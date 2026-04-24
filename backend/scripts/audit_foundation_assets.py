#!/usr/bin/env python3
"""Audit go-live foundation assets and baseline runtime metrics."""

from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.go_live_foundation_assets import (  # noqa: E402
    ROOT as BACKEND_ROOT,
    get_go_live_foundation_assets,
)


def main() -> int:
    missing_files: list[str] = []
    missing_metrics: list[str] = []
    assets = get_go_live_foundation_assets()

    for item in assets:
        for artifact in item.get("artifacts", []):
            if not (BACKEND_ROOT / artifact).exists():
                missing_files.append(f"{item['key']}: {artifact}")

        for metric_key, threshold in item.get("thresholds", {}).items():
            value = item.get("runtime_metrics", {}).get(metric_key, 0)
            if value < threshold:
                missing_metrics.append(
                    f"{item['key']}: {metric_key}={value} < {threshold}"
                )

    if missing_files or missing_metrics:
        print("FAIL: go-live foundation assets are not fully locked")
        if missing_files:
            print("Missing artifacts:")
            for item in missing_files:
                print(f"- {item}")
        if missing_metrics:
            print("Missing runtime thresholds:")
            for item in missing_metrics:
                print(f"- {item}")
        return 1

    print(
        "PASS: go-live foundation assets locked for "
        f"{len(assets)} baseline domains"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
