"""Synthetic side-scan sonar image generator with physics-based modeling.

Simulates side-scan sonar (SSS) waterfall imagery containing seafloor clutter,
speckle noise, acoustic attenuation, slant-range geometric distortion, and
man-made debris targets (ghost nets, pipes, cylinders, shipwrecks) with acoustic
highlights and cast shadows.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import random
from typing import Literal

import cv2
import numpy as np
from numpy.typing import NDArray


@dataclass
class SyntheticTarget:
    """Target object placed in synthetic sonar image."""

    target_type: Literal["ghost_net", "pipe", "cylinder", "wreck"]
    center_row: int
    center_col: int
    width_px: int
    height_px: int
    shadow_length_px: int
    bbox_xyxy: tuple[int, int, int, int]


class SyntheticSonarGenerator:
    """Generates synthetic sonar waterfall tiles with realistic physics."""

    def __init__(
        self,
        height: int = 1024,
        width: int = 1024,
        range_m: float = 75.0,
        altitude_m: float = 12.0,
    ) -> None:
        self.height = height
        self.width = width
        self.range_m = range_m
        self.altitude_m = altitude_m

    def generate_background(self) -> NDArray[np.float32]:
        """Generate seafloor textured background with nadir zone and attenuation."""
        # Baseline texture (Rayleigh noise distribution for sonar speckle)
        rayleigh_scale = 0.15
        bg = np.random.rayleigh(scale=rayleigh_scale, size=(self.height, self.width)).astype(np.float32)

        # Nadir gap (blind zone directly beneath towfish)
        center_col = self.width // 2
        # Nadir width based on altitude / range ratio
        nadir_half_width = int((self.altitude_m / self.range_m) * (self.width / 2))
        
        # Apply nadir silence zone
        nadir_mask = np.ones(self.width, dtype=np.float32)
        if nadir_half_width > 0:
            x = np.arange(self.width)
            dist_from_center = np.abs(x - center_col)
            nadir_mask = np.clip(dist_from_center / (nadir_half_width + 1e-5), 0.05, 1.0)

        bg = bg * nadir_mask[np.newaxis, :]

        # Acoustic range attenuation (loss over distance from center)
        dist_grid = np.abs(np.arange(self.width) - center_col) / (self.width / 2)
        attenuation = np.exp(-1.5 * dist_grid)
        bg = bg * attenuation[np.newaxis, :]

        # Smooth substrate ripple pattern (sand waves)
        y, x = np.ogrid[: self.height, : self.width]
        ripple = 0.05 * np.sin(2 * np.pi * y / 40.0 + 0.5 * np.sin(2 * np.pi * x / 120.0))
        bg = np.clip(bg + ripple.astype(np.float32), 0.0, 1.0)

        return bg

    def add_target(
        self,
        image: NDArray[np.float32],
        target_type: Literal["ghost_net", "pipe", "cylinder", "wreck"],
        row: int | None = None,
        col: int | None = None,
    ) -> tuple[NDArray[np.float32], SyntheticTarget]:
        """Place a synthetic target with high-intensity echo highlight and cast shadow."""
        h, w = image.shape
        center_col = w // 2

        if row is None:
            row = random.randint(100, h - 100)
        if col is None:
            # Place either in port or starboard swath (away from nadir)
            offset = random.randint(120, w // 2 - 80)
            col = center_col + offset if random.random() > 0.5 else center_col - offset

        # Calculate shadow length based on sonar altitude & target distance
        dist_from_nadir_px = abs(col - center_col)
        dist_m = (dist_from_nadir_px / (w / 2)) * self.range_m
        
        # Target height off seabed (m)
        target_h_m = 1.5 if target_type in ("wreck", "pipe") else 0.8
        shadow_len_m = (target_h_m * dist_m) / max(self.altitude_m, 0.1)
        shadow_length_px = int((shadow_len_m / self.range_m) * (w / 2))
        shadow_length_px = max(10, min(shadow_length_px, 150))

        # Size of highlight target
        if target_type == "ghost_net":
            tw, th = random.randint(30, 60), random.randint(25, 50)
            highlight_val = 0.85
        elif target_type == "pipe":
            tw, th = random.randint(70, 120), random.randint(15, 25)
            highlight_val = 0.95
        elif target_type == "cylinder":
            tw, th = random.randint(20, 35), random.randint(20, 35)
            highlight_val = 0.90
        else:  # wreck
            tw, th = random.randint(80, 140), random.randint(50, 90)
            highlight_val = 0.98

        y1, y2 = max(0, row - th // 2), min(h, row + th // 2)
        x1, x2 = max(0, col - tw // 2), min(w, col + tw // 2)

        # Highlight echo
        output = image.copy()
        output[y1:y2, x1:x2] = np.clip(output[y1:y2, x1:x2] + highlight_val, 0.0, 1.0)

        # Acoustic shadow extends AWAY from nadir center
        shadow_dir = 1 if col > center_col else -1
        sx1 = x2 if shadow_dir == 1 else max(0, x1 - shadow_length_px)
        sx2 = min(w, x2 + shadow_length_px) if shadow_dir == 1 else x1

        output[y1:y2, sx1:sx2] = output[y1:y2, sx1:sx2] * 0.05  # Near zero intensity shadow

        bbox = (min(x1, sx1), y1, max(x2, sx2), y2)
        target_info = SyntheticTarget(
            target_type=target_type,
            center_row=row,
            center_col=col,
            width_px=tw,
            height_px=th,
            shadow_length_px=shadow_length_px,
            bbox_xyxy=bbox,
        )

        return output, target_info

    def generate_sample(
        self, num_targets: int = 2
    ) -> tuple[NDArray[np.float32], list[SyntheticTarget]]:
        """Generate a complete synthetic sonar tile with multiple targets."""
        img = self.generate_background()
        targets: list[SyntheticTarget] = []
        target_types: list[Literal["ghost_net", "pipe", "cylinder", "wreck"]] = [
            "ghost_net",
            "pipe",
            "cylinder",
            "wreck",
        ]

        for _ in range(num_targets):
            ttype = random.choice(target_types)
            img, tinfo = self.add_target(img, ttype)
            targets.append(tinfo)

        return img, targets


if __name__ == "__main__":
    gen = SyntheticSonarGenerator()
    img, targets = gen.generate_sample(num_targets=3)
    print(f"Generated synthetic tile: shape={img.shape}, targets={len(targets)}")
