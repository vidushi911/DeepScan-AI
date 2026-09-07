"""Format-agnostic sonar data adapter layer.

This module routes incoming sonar files to the appropriate parser based on
file extension. It outputs a standardised SonarData dataclass that the rest
of the pipeline consumes, decoupling downstream processing from format-specific
quirks.

Supported formats:
- .xtf  → pyxtf-based parser (XTF is the most common SSS format)
- .jsf  → EdgeTech JSF parser (stub — swap-in point for proprietary SDK)
- .sdf  → SDF parser (stub)
- .png/.jpg/.tiff → Image + optional CSV metadata fallback

Design decision: We parse into a common representation (SonarData) immediately
at ingestion. This means format-specific metadata extraction happens once,
and every downstream module works against a stable interface.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

from app.core.logging import get_logger

logger = get_logger(__name__)


@dataclass
class PingMetadata:
    """Navigation and sensor metadata for a single sonar ping.

    These values are used by the geotagging engine to convert pixel
    coordinates to real-world lat/lon.

    Attributes:
        ping_number: Sequential ping index.
        latitude: WGS84 latitude of the towfish/AUV at this ping.
        longitude: WGS84 longitude of the towfish/AUV at this ping.
        heading_deg: Heading in degrees (0–360, clockwise from north).
        altitude_m: Altitude above the seafloor in meters.
        slant_range_m: Maximum slant range of the sonar beam in meters.
        sound_velocity_mps: Speed of sound in water (m/s), typically ~1500.
        timestamp: Unix timestamp of the ping.
    """

    ping_number: int = 0
    latitude: float = 0.0
    longitude: float = 0.0
    heading_deg: float = 0.0
    altitude_m: float = 10.0
    slant_range_m: float = 75.0
    sound_velocity_mps: float = 1500.0
    timestamp: float = 0.0
    grazing_angle_deg: float = 0.0  # Computed from altitude and range


@dataclass
class SonarData:
    """Standardised sonar data representation consumed by the processing pipeline.

    Attributes:
        image: 2D numpy array of the sonar waterfall image (pings × samples).
        ping_metadata: Per-ping navigation data, one entry per image row.
        range_m: Maximum range setting in meters.
        frequency_khz: Operating frequency.
        samples_per_ping: Number of samples (columns) per ping.
        channel: 'port', 'starboard', or 'combined'.
        source_format: Original file format.
        raw_metadata: Any additional format-specific metadata.
    """

    image: np.ndarray
    ping_metadata: list[PingMetadata] = field(default_factory=list)
    range_m: float = 75.0
    frequency_khz: float = 500.0
    samples_per_ping: int = 0
    channel: str = "combined"
    source_format: str = "unknown"
    raw_metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def num_pings(self) -> int:
        """Number of pings (rows) in the sonar image."""
        return self.image.shape[0]

    @property
    def ground_resolution_m(self) -> float:
        """Approximate across-track ground resolution in meters per pixel.

        This is derived from the range setting and number of samples.
        It's an approximation — true ground resolution varies with slant range
        and requires slant-range correction for accuracy.
        """
        if self.samples_per_ping > 0:
            return self.range_m / self.samples_per_ping
        return self.range_m / max(self.image.shape[1], 1)


def ingest_sonar_file(file_path: Path) -> SonarData:
    """Route a sonar file to the appropriate parser and return standardised data.

    Args:
        file_path: Path to the sonar file on disk.

    Returns:
        SonarData with parsed image and navigation metadata.

    Raises:
        ValueError: If the file format is unsupported.
        FileNotFoundError: If the file doesn't exist.
    """
    if not file_path.exists():
        raise FileNotFoundError(f"Sonar file not found: {file_path}")

    ext = file_path.suffix.lower()
    logger.info("ingesting_sonar_file", path=str(file_path), format=ext)

    if ext == ".xtf":
        return _parse_xtf(file_path)
    elif ext == ".jsf":
        return _parse_jsf(file_path)
    elif ext == ".sdf":
        return _parse_sdf(file_path)
    elif ext in (".png", ".jpg", ".jpeg", ".tiff", ".tif"):
        return _parse_image(file_path)
    else:
        raise ValueError(f"Unsupported sonar file format: {ext}")


def _parse_xtf(file_path: Path) -> SonarData:
    """Parse an XTF (eXtended Triton Format) side-scan sonar file.

    Uses the pyxtf library for header and channel data extraction.
    Extracts per-ping navigation from the XTF ping headers.

    Reference: https://www.tritonimaginginc.com/site/content/public/downloads/
               FileFormatInfo/XTFFileFormat_X42.pdf

    Args:
        file_path: Path to the .xtf file.

    Returns:
        SonarData with image and ping-level navigation.
    """
    try:
        import pyxtf
    except ImportError as e:
        logger.error("pyxtf_not_installed")
        raise ImportError("pyxtf is required for .xtf parsing: pip install pyxtf") from e

    logger.info("parsing_xtf", path=str(file_path))

    # Read the XTF file
    (file_header, packets) = pyxtf.xtf_read(str(file_path))

    # Extract side-scan sonar packets (type 0 = sonar data)
    sonar_packets = packets.get(0, [])
    if not sonar_packets:
        # Try other packet types
        for ptype, pdata in packets.items():
            if pdata:
                sonar_packets = pdata
                break

    if not sonar_packets:
        raise ValueError(f"No sonar data packets found in {file_path}")

    # Build the image array and ping metadata
    pings: list[np.ndarray] = []
    metadata_list: list[PingMetadata] = []

    for i, packet in enumerate(sonar_packets):
        # Extract the sonar data samples
        if hasattr(packet, "data") and len(packet.data) > 0:
            ping_data = np.array(packet.data[0], dtype=np.float32)
            pings.append(ping_data)

            # Extract navigation from the ping header
            meta = PingMetadata(
                ping_number=i,
                latitude=getattr(packet, "SensorYcoordinate", 0.0),
                longitude=getattr(packet, "SensorXcoordinate", 0.0),
                heading_deg=getattr(packet, "SensorHeading", 0.0),
                altitude_m=getattr(packet, "SensorPrimaryAltitude", 10.0),
                slant_range_m=getattr(packet, "SlantRange", 75.0),
                sound_velocity_mps=getattr(packet, "SoundVelocity", 1500.0),
                timestamp=0.0,  # Computed from date/time fields if available
            )
            metadata_list.append(meta)

    if not pings:
        raise ValueError(f"No usable ping data extracted from {file_path}")

    # Normalise ping lengths (pad shorter pings to max length)
    max_samples = max(len(p) for p in pings)
    image = np.zeros((len(pings), max_samples), dtype=np.float32)
    for i, ping in enumerate(pings):
        image[i, : len(ping)] = ping

    logger.info(
        "xtf_parsed",
        pings=len(pings),
        samples=max_samples,
        has_nav=any(m.latitude != 0 for m in metadata_list),
    )

    return SonarData(
        image=image,
        ping_metadata=metadata_list,
        range_m=metadata_list[0].slant_range_m if metadata_list else 75.0,
        samples_per_ping=max_samples,
        channel="combined",
        source_format="xtf",
    )


def _parse_jsf(file_path: Path) -> SonarData:
    """Parse an EdgeTech JSF sonar file.

    SWAP-IN POINT: This is a stub implementation that reads the JSF file
    as raw binary and extracts basic sonar data. For production use with
    EdgeTech hardware, replace this with the vendor's SDK parser.

    Args:
        file_path: Path to the .jsf file.

    Returns:
        SonarData with parsed or synthetic fallback data.
    """
    logger.warning(
        "jsf_parser_stub",
        path=str(file_path),
        msg="JSF parsing uses basic binary extraction. "
        "For full JSF support, integrate the EdgeTech SDK.",
    )

    # Read raw bytes and attempt basic extraction
    raw = file_path.read_bytes()

    # JSF files start with a message header: sync (0x1601), protocol version, etc.
    # Basic extraction: treat the file as a single-channel image
    data = np.frombuffer(raw, dtype=np.uint16)
    # Reshape into a reasonable aspect ratio
    samples = 1024
    pings = len(data) // samples
    if pings < 1:
        samples = len(data)
        pings = 1

    image = data[: pings * samples].reshape(pings, samples).astype(np.float32)

    return SonarData(
        image=image,
        ping_metadata=[PingMetadata(ping_number=i) for i in range(pings)],
        samples_per_ping=samples,
        source_format="jsf",
    )


def _parse_sdf(file_path: Path) -> SonarData:
    """Parse an SDF sonar file.

    SWAP-IN POINT: SDF is a less common format. This stub reads it as
    raw binary. Replace with vendor-specific parsing logic as needed.

    Args:
        file_path: Path to the .sdf file.

    Returns:
        SonarData with basic extraction.
    """
    logger.warning(
        "sdf_parser_stub",
        path=str(file_path),
        msg="SDF parsing is a basic stub. Replace with vendor SDK.",
    )

    raw = file_path.read_bytes()
    data = np.frombuffer(raw, dtype=np.uint16)
    samples = 1024
    pings = max(len(data) // samples, 1)
    image = data[: pings * samples].reshape(pings, samples).astype(np.float32)

    return SonarData(
        image=image,
        ping_metadata=[PingMetadata(ping_number=i) for i in range(pings)],
        samples_per_ping=samples,
        source_format="sdf",
    )


def _parse_image(file_path: Path) -> SonarData:
    """Parse a plain image file (PNG/JPG/TIFF) as sonar input.

    If a companion .csv metadata file exists alongside the image
    (same name, .csv extension), it is loaded as ping-level navigation.

    This is the fallback for users who export sonar mosaics as images
    rather than using native sonar formats.

    Args:
        file_path: Path to the image file.

    Returns:
        SonarData with image and optional CSV metadata.
    """
    import cv2

    logger.info("parsing_image_as_sonar", path=str(file_path))

    image = cv2.imread(str(file_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        raise ValueError(f"Failed to read image: {file_path}")

    image = image.astype(np.float32)

    # Check for companion CSV metadata
    csv_path = file_path.with_suffix(".csv")
    metadata_list: list[PingMetadata] = []

    if csv_path.exists():
        import csv

        logger.info("loading_companion_csv", path=str(csv_path))
        with open(csv_path, "r") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                meta = PingMetadata(
                    ping_number=i,
                    latitude=float(row.get("latitude", row.get("lat", 0.0))),
                    longitude=float(row.get("longitude", row.get("lon", 0.0))),
                    heading_deg=float(row.get("heading", 0.0)),
                    altitude_m=float(row.get("altitude", row.get("alt", 10.0))),
                    slant_range_m=float(row.get("slant_range", row.get("range", 75.0))),
                )
                metadata_list.append(meta)
    else:
        # Generate placeholder metadata (one per row)
        metadata_list = [PingMetadata(ping_number=i) for i in range(image.shape[0])]

    return SonarData(
        image=image,
        ping_metadata=metadata_list,
        samples_per_ping=image.shape[1],
        source_format="image",
    )
