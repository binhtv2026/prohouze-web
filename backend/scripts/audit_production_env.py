#!/usr/bin/env python3
"""Validate required production environment variables for go-live."""

from __future__ import annotations

import os
import sys


REQUIRED_VARS = {
    "MONGO_URL": {"forbidden_contains": ["localhost", "127.0.0.1"]},
    "DB_NAME": {"forbidden_equals": ["test_database"]},
    "JWT_SECRET": {"forbidden_contains": ["prohouzing-secret-key-2024", "thay-bang-secret-rat-manh"]},
    "FRONTEND_URL": {"forbidden_contains": ["localhost", "127.0.0.1"]},
    "CORS_ORIGINS": {"forbidden_contains": ["localhost", "127.0.0.1", "*"]},
    "COOKIE_DOMAIN": {"forbidden_contains": ["localhost"]},
}

OPTIONAL_VARS = ["POSTGRES_URL", "EMERGENT_LLM_KEY", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]


def validate_var(name: str, rules: dict) -> str | None:
    value = os.environ.get(name, "").strip()
    if not value:
        return f"{name}: missing"

    for needle in rules.get("forbidden_contains", []):
        if needle and needle in value:
            return f"{name}: contains forbidden value '{needle}'"

    for forbidden in rules.get("forbidden_equals", []):
        if value == forbidden:
            return f"{name}: still uses forbidden exact value '{forbidden}'"

    return None


def main() -> int:
    failures = []
    optional_missing = []

    for name, rules in REQUIRED_VARS.items():
        error = validate_var(name, rules)
        if error:
            failures.append(error)

    for name in OPTIONAL_VARS:
        if not os.environ.get(name):
            optional_missing.append(name)

    if failures:
        print("FAIL: production environment is not locked")
        for item in failures:
            print(f"- {item}")
        if optional_missing:
            print("Optional variables not set:")
            for item in optional_missing:
                print(f"- {item}")
        return 1

    print("PASS: required production environment variables are locked")
    if optional_missing:
        print("Optional variables not set:")
        for item in optional_missing:
            print(f"- {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
