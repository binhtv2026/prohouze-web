#!/usr/bin/env python3
"""Audit backend route permissions against canonical RBAC."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config.canonical_rbac import PERMISSION_MATRIX, get_permission_scope  # noqa: E402


ROUTES_DIR = ROOT / "core" / "routes"
PERMISSION_PATTERN = re.compile(r'require_permission\("([^"]+)",\s*"([^"]+)"\)')


def iter_required_permissions() -> list[tuple[str, str, str]]:
    permissions: list[tuple[str, str, str]] = []
    for file_path in sorted(ROUTES_DIR.rglob("*.py")):
        content = file_path.read_text(encoding="utf-8")
        for resource, action in PERMISSION_PATTERN.findall(content):
            permissions.append((str(file_path.relative_to(ROOT)), resource, action))
    return permissions


def find_covering_roles(resource: str, action: str) -> list[str]:
    covering_roles: list[str] = []
    for role in sorted(PERMISSION_MATRIX):
        if get_permission_scope(role, resource, action):
            covering_roles.append(role)
    return covering_roles


def main() -> int:
    required_permissions = iter_required_permissions()
    missing: list[tuple[str, str, str]] = []

    for source_file, resource, action in required_permissions:
        if not find_covering_roles(resource, action):
            missing.append((source_file, resource, action))

    if missing:
        print("FAIL: canonical RBAC is missing backend route permissions")
        for source_file, resource, action in missing:
            print(f"- {source_file}: {resource}.{action}")
        return 1

    unique_permissions = {
        (resource, action) for _, resource, action in required_permissions
    }
    print(
        f"PASS: canonical RBAC covers {len(unique_permissions)} backend route permissions "
        f"across {len(required_permissions)} guarded endpoints"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
