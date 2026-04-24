"""Canonical asset registry for go-live foundation baselines."""

from __future__ import annotations

from pathlib import Path

from config.canonical_inventory import STATUS_CONFIG
from config.canonical_rbac import ROLE_METADATA
from config.governance_foundation import APPROVAL_FLOWS, CANONICAL_DOMAINS, STATUS_MODELS
from config.master_data import MASTER_DATA_REGISTRY


ROOT = Path(__file__).resolve().parents[1]


GO_LIVE_FOUNDATION_ASSETS = [
    {
        "key": "user_directory",
        "label": "Người dùng & vai trò",
        "artifacts": [
            "config/canonical_rbac.py",
            "core/dependencies.py",
            "core/services/permission.py",
        ],
        "runtime_metrics": {
            "canonical_roles": len(ROLE_METADATA),
        },
        "thresholds": {
            "canonical_roles": 9,
        },
    },
    {
        "key": "organization_hierarchy",
        "label": "Cơ cấu công ty / chi nhánh / team",
        "artifacts": [
            "seed_hrm.py",
            "config/governance_foundation.py",
            "core/routes/migration.py",
        ],
        "runtime_metrics": {
            "canonical_domains": len(CANONICAL_DOMAINS),
        },
        "thresholds": {
            "canonical_domains": 8,
        },
    },
    {
        "key": "master_data_catalog",
        "label": "Master data chuẩn",
        "artifacts": [
            "config/master_data.py",
            "core/scripts/seed_master_data.py",
            "config_api.py",
        ],
        "runtime_metrics": {
            "master_data_categories": len(MASTER_DATA_REGISTRY),
        },
        "thresholds": {
            "master_data_categories": 12,
        },
    },
    {
        "key": "status_models",
        "label": "State machine canonical",
        "artifacts": [
            "config/governance_foundation.py",
            "config/canonical_inventory.py",
            "config_api.py",
        ],
        "runtime_metrics": {
            "status_models": len(STATUS_MODELS),
            "inventory_statuses": len(STATUS_CONFIG),
        },
        "thresholds": {
            "status_models": 6,
            "inventory_statuses": 8,
        },
    },
    {
        "key": "project_catalog",
        "label": "Danh mục dự án & sản phẩm bán",
        "artifacts": [
            "seed_danang_projects.py",
            "config/canonical_inventory.py",
            "core/routes/inventory_v2.py",
        ],
        "runtime_metrics": {
            "inventory_statuses": len(STATUS_CONFIG),
        },
        "thresholds": {
            "inventory_statuses": 8,
        },
    },
    {
        "key": "pricing_catalog",
        "label": "Bảng giá chuẩn",
        "artifacts": [
            "core/routes/price_routes.py",
            "routes/sales_router.py",
            "tests/test_pricing_consistency.py",
        ],
        "runtime_metrics": {},
        "thresholds": {},
    },
    {
        "key": "sales_policy_catalog",
        "label": "Chính sách bán hàng chuẩn",
        "artifacts": [
            "config/governance_foundation.py",
            "routes/commission_router.py",
            "services/finance_seeder.py",
        ],
        "runtime_metrics": {
            "approval_flows": len(APPROVAL_FLOWS),
        },
        "thresholds": {
            "approval_flows": 4,
        },
    },
    {
        "key": "legal_catalog",
        "label": "Pháp lý & tài liệu chuẩn",
        "artifacts": [
            "config/contract_config.py",
            "models/contract_models.py",
            "routes/contract_router.py",
            "core/routes/contracts.py",
        ],
        "runtime_metrics": {},
        "thresholds": {},
    },
]


def get_go_live_foundation_assets() -> list[dict]:
    """Return canonical foundation asset registry."""
    return GO_LIVE_FOUNDATION_ASSETS
