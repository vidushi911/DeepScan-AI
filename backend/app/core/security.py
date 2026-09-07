"""Security utilities — input validation, rate limiting, file checks.

This module provides the building blocks consumed by API route handlers.
No wildcard CORS, no raw file path exposure, no silent failures.
"""

from __future__ import annotations

import hashlib
import secrets
from pathlib import Path
from typing import BinaryIO

from app.core.logging import get_logger

logger = get_logger(__name__)

# Allowed sonar file extensions and their expected magic bytes (first N bytes).
# Keys are lowercase extensions; values are (magic_bytes, offset) tuples.
ALLOWED_FILE_TYPES: dict[str, list[tuple[bytes, int]]] = {
    ".xtf": [(b"\x7b", 0)],           # XTF header magic (0x7B = 123)
    ".jsf": [(b"\x16\x05", 0)],       # JSF/EdgeTech header magic
    ".sdf": [],                        # SDF — validated by extension only
    ".png": [(b"\x89PNG", 0)],
    ".jpg": [(b"\xff\xd8\xff", 0)],
    ".jpeg": [(b"\xff\xd8\xff", 0)],
    ".tiff": [(b"II\x2a\x00", 0), (b"MM\x00\x2a", 0)],
    ".tif": [(b"II\x2a\x00", 0), (b"MM\x00\x2a", 0)],
}


def validate_file_extension(filename: str) -> str:
    """Check that the uploaded file has an allowed extension.

    Args:
        filename: Original filename from the upload.

    Returns:
        The normalised lowercase extension (e.g. '.xtf').

    Raises:
        ValueError: If the extension is not in the allow-list.
    """
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_FILE_TYPES:
        allowed = ", ".join(sorted(ALLOWED_FILE_TYPES.keys()))
        raise ValueError(
            f"File extension '{ext}' is not allowed. "
            f"Accepted types: {allowed}"
        )
    return ext


def validate_magic_bytes(file_obj: BinaryIO, extension: str) -> bool:
    """Verify that the file's magic bytes match the expected values for its extension.

    Args:
        file_obj: A file-like object positioned at the start.
        extension: The normalised extension (e.g. '.xtf').

    Returns:
        True if magic bytes match (or no check is defined for this extension).

    Raises:
        ValueError: If magic bytes do not match.
    """
    expected = ALLOWED_FILE_TYPES.get(extension, [])
    if not expected:
        return True  # No magic-byte check defined for this extension

    # Read enough bytes for the longest check
    max_len = max(offset + len(magic) for magic, offset in expected)
    header = file_obj.read(max_len)
    file_obj.seek(0)  # Reset for downstream consumers

    for magic, offset in expected:
        if header[offset : offset + len(magic)] == magic:
            return True

    raise ValueError(
        f"File content does not match expected format for '{extension}'. "
        f"The file may be corrupted or mislabeled."
    )


def validate_file_size(size_bytes: int, max_bytes: int) -> None:
    """Reject files that exceed the configured size limit.

    Args:
        size_bytes: Actual file size.
        max_bytes: Maximum allowed bytes.

    Raises:
        ValueError: If the file is too large.
    """
    if size_bytes > max_bytes:
        max_mb = max_bytes / (1024 * 1024)
        actual_mb = size_bytes / (1024 * 1024)
        raise ValueError(
            f"File size ({actual_mb:.1f} MB) exceeds the "
            f"maximum allowed size ({max_mb:.1f} MB)."
        )


def generate_opaque_filename(original: str) -> str:
    """Generate a collision-resistant opaque filename that hides the original path.

    Args:
        original: The original filename.

    Returns:
        An opaque filename like 'a3f8b2c1d4e5.xtf'.
    """
    ext = Path(original).suffix.lower()
    token = secrets.token_hex(12)
    return f"{token}{ext}"


def compute_file_hash(file_obj: BinaryIO, algorithm: str = "sha256") -> str:
    """Compute a hex digest of the file contents for deduplication/integrity.

    Args:
        file_obj: A file-like object positioned at the start.
        algorithm: Hash algorithm name (default sha256).

    Returns:
        Hex digest string.
    """
    h = hashlib.new(algorithm)
    for chunk in iter(lambda: file_obj.read(8192), b""):
        h.update(chunk)
    file_obj.seek(0)
    return h.hexdigest()
