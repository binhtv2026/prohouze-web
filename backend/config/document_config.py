"""
ProHouzing Document Configuration
Prompt 9/20 - Contract & Document Workflow

Contains:
- Document Categories
- Document Status
- Storage Configuration
- Visibility Levels
"""

from enum import Enum
from typing import Dict, List, Optional
import hashlib


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT CATEGORIES
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentCategory(str, Enum):
    """Document categories for BĐS transactions"""
    # Contract Documents
    CONTRACT_PRIMARY = "contract_primary"         # Hợp đồng chính
    CONTRACT_AMENDMENT = "contract_amendment"     # Phụ lục hợp đồng
    CONTRACT_DRAFT = "contract_draft"             # Bản nháp hợp đồng
    
    # Customer Identity Documents
    CUSTOMER_CCCD = "customer_cccd"               # CCCD/CMND
    CUSTOMER_PASSPORT = "customer_passport"       # Hộ chiếu
    CUSTOMER_HOUSEHOLD = "customer_household"     # Sổ hộ khẩu
    CUSTOMER_MARRIAGE = "customer_marriage"       # Giấy kết hôn
    CUSTOMER_AUTHORIZATION = "customer_authorization"  # Giấy ủy quyền
    
    # Payment Documents
    PAYMENT_RECEIPT = "payment_receipt"           # Phiếu thu
    PAYMENT_TRANSFER = "payment_transfer"         # Chứng từ chuyển khoản
    PAYMENT_INVOICE = "payment_invoice"           # Hóa đơn
    
    # Legal Documents
    LEGAL_NOTARIZATION = "legal_notarization"     # Công chứng
    LEGAL_AUTHENTICATION = "legal_authentication" # Chứng thực
    LEGAL_CERTIFICATE = "legal_certificate"       # Giấy chứng nhận
    
    # Handover Documents
    HANDOVER_MINUTES = "handover_minutes"         # Biên bản bàn giao
    HANDOVER_ACCEPTANCE = "handover_acceptance"   # Biên bản nghiệm thu
    HANDOVER_DEFECT = "handover_defect"           # Danh sách sửa chữa
    
    # Internal Documents
    INTERNAL_APPROVAL = "internal_approval"       # Phiếu duyệt nội bộ
    INTERNAL_MEMO = "internal_memo"               # Ghi chú nội bộ
    INTERNAL_CHECKLIST = "internal_checklist"     # Checklist
    
    # Other
    OTHER = "other"                               # Khác


DOCUMENT_CATEGORY_CONFIG = {
    DocumentCategory.CONTRACT_PRIMARY: {
        "label": "Hợp đồng chính",
        "allowed_extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 50,
        "requires_signing": True,
        "is_legal_document": True,
    },
    DocumentCategory.CONTRACT_AMENDMENT: {
        "label": "Phụ lục hợp đồng",
        "allowed_extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 50,
        "requires_signing": True,
        "is_legal_document": True,
    },
    DocumentCategory.CUSTOMER_CCCD: {
        "label": "CCCD/CMND",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": True,
        "has_expiry": True,
    },
    DocumentCategory.CUSTOMER_PASSPORT: {
        "label": "Hộ chiếu",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": True,
        "has_expiry": True,
    },
    DocumentCategory.CUSTOMER_HOUSEHOLD: {
        "label": "Sổ hộ khẩu",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": True,
    },
    DocumentCategory.CUSTOMER_MARRIAGE: {
        "label": "Giấy kết hôn",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": True,
    },
    DocumentCategory.CUSTOMER_AUTHORIZATION: {
        "label": "Giấy ủy quyền",
        "allowed_extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 20,
        "requires_signing": True,
        "is_legal_document": True,
    },
    DocumentCategory.PAYMENT_RECEIPT: {
        "label": "Phiếu thu",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": False,
    },
    DocumentCategory.PAYMENT_TRANSFER: {
        "label": "Chứng từ chuyển khoản",
        "allowed_extensions": [".pdf", ".jpg", ".jpeg", ".png"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": False,
    },
    DocumentCategory.LEGAL_NOTARIZATION: {
        "label": "Công chứng",
        "allowed_extensions": [".pdf"],
        "max_size_mb": 50,
        "requires_signing": True,
        "is_legal_document": True,
    },
    DocumentCategory.HANDOVER_MINUTES: {
        "label": "Biên bản bàn giao",
        "allowed_extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 20,
        "requires_signing": True,
        "is_legal_document": True,
    },
    DocumentCategory.INTERNAL_APPROVAL: {
        "label": "Phiếu duyệt nội bộ",
        "allowed_extensions": [".pdf", ".doc", ".docx"],
        "max_size_mb": 10,
        "requires_signing": False,
        "is_legal_document": False,
        "internal_only": True,
    },
    DocumentCategory.OTHER: {
        "label": "Khác",
        "allowed_extensions": [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".xls", ".xlsx"],
        "max_size_mb": 20,
        "requires_signing": False,
        "is_legal_document": False,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentStatus(str, Enum):
    """Document status"""
    DRAFT = "draft"           # Bản nháp
    PENDING = "pending"       # Chờ xác nhận
    VERIFIED = "verified"     # Đã xác nhận
    SIGNED = "signed"         # Đã ký (immutable)
    ARCHIVED = "archived"     # Đã lưu trữ
    REJECTED = "rejected"     # Bị từ chối


DOCUMENT_STATUS_CONFIG = {
    DocumentStatus.DRAFT: {
        "label": "Bản nháp",
        "color": "slate",
        "is_final": False,
        "can_replace": True,
        "can_delete": True,
    },
    DocumentStatus.PENDING: {
        "label": "Chờ xác nhận",
        "color": "yellow",
        "is_final": False,
        "can_replace": True,
        "can_delete": True,
    },
    DocumentStatus.VERIFIED: {
        "label": "Đã xác nhận",
        "color": "blue",
        "is_final": False,
        "can_replace": True,  # Can create new version
        "can_delete": False,
    },
    DocumentStatus.SIGNED: {
        "label": "Đã ký",
        "color": "green",
        "is_final": True,
        "can_replace": False,  # IMMUTABLE
        "can_delete": False,
    },
    DocumentStatus.ARCHIVED: {
        "label": "Đã lưu trữ",
        "color": "gray",
        "is_final": True,
        "can_replace": False,
        "can_delete": False,
    },
    DocumentStatus.REJECTED: {
        "label": "Bị từ chối",
        "color": "red",
        "is_final": False,
        "can_replace": True,
        "can_delete": True,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# VISIBILITY LEVELS
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentVisibility(str, Enum):
    """Document visibility levels"""
    PUBLIC = "public"                 # Customer can see
    INTERNAL = "internal"             # All internal users
    SALES_ONLY = "sales_only"         # Sales team only
    LEGAL_ONLY = "legal_only"         # Legal team only
    FINANCE_ONLY = "finance_only"     # Finance team only
    ADMIN_ONLY = "admin_only"         # Admin only


VISIBILITY_ROLES = {
    DocumentVisibility.PUBLIC: ["*"],
    DocumentVisibility.INTERNAL: ["sales", "sales_manager", "legal", "finance", "admin", "director"],
    DocumentVisibility.SALES_ONLY: ["sales", "sales_manager", "admin", "director"],
    DocumentVisibility.LEGAL_ONLY: ["legal", "admin", "director"],
    DocumentVisibility.FINANCE_ONLY: ["finance", "admin", "director"],
    DocumentVisibility.ADMIN_ONLY: ["admin", "director"],
}


# ═══════════════════════════════════════════════════════════════════════════════
# STORAGE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class StorageType(str, Enum):
    """Storage backend types"""
    LOCAL = "local"
    S3 = "s3"
    GCS = "gcs"


STORAGE_CONFIG = {
    "type": StorageType.LOCAL,
    "local_path": "/app/uploads/documents",
    "path_template": "{tenant_id}/{year}/{month}/{category}/{filename}",
    "max_file_size_mb": 50,
    "checksum_algorithm": "sha256",
    
    # Allowed extensions globally
    "allowed_extensions": [
        ".pdf", ".doc", ".docx",
        ".jpg", ".jpeg", ".png",
        ".xls", ".xlsx",
    ],
    
    # MIME types
    "allowed_mime_types": [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKLIST CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

class ChecklistItemStatus(str, Enum):
    """Checklist item status"""
    PENDING = "pending"
    UPLOADED = "uploaded"
    VERIFIED = "verified"
    REJECTED = "rejected"
    WAIVED = "waived"


# Default checklists by contract type
DEFAULT_CHECKLISTS = {
    "sale_contract": [
        {
            "item_code": "CCCD_FRONT",
            "item_name": "CCCD mặt trước",
            "category": DocumentCategory.CUSTOMER_CCCD.value,
            "is_required": True,
        },
        {
            "item_code": "CCCD_BACK",
            "item_name": "CCCD mặt sau",
            "category": DocumentCategory.CUSTOMER_CCCD.value,
            "is_required": True,
        },
        {
            "item_code": "HOUSEHOLD_BOOK",
            "item_name": "Sổ hộ khẩu",
            "category": DocumentCategory.CUSTOMER_HOUSEHOLD.value,
            "is_required": True,
        },
        {
            "item_code": "MARRIAGE_CERT",
            "item_name": "Giấy kết hôn (nếu có)",
            "category": DocumentCategory.CUSTOMER_MARRIAGE.value,
            "is_required": False,
        },
        {
            "item_code": "DEPOSIT_RECEIPT",
            "item_name": "Phiếu thu tiền cọc",
            "category": DocumentCategory.PAYMENT_RECEIPT.value,
            "is_required": True,
        },
        {
            "item_code": "SIGNED_CONTRACT",
            "item_name": "Hợp đồng đã ký",
            "category": DocumentCategory.CONTRACT_PRIMARY.value,
            "is_required": True,
        },
    ],
    "deposit_agreement": [
        {
            "item_code": "CCCD_FRONT",
            "item_name": "CCCD mặt trước",
            "category": DocumentCategory.CUSTOMER_CCCD.value,
            "is_required": True,
        },
        {
            "item_code": "CCCD_BACK",
            "item_name": "CCCD mặt sau",
            "category": DocumentCategory.CUSTOMER_CCCD.value,
            "is_required": True,
        },
        {
            "item_code": "DEPOSIT_RECEIPT",
            "item_name": "Phiếu thu tiền cọc",
            "category": DocumentCategory.PAYMENT_RECEIPT.value,
            "is_required": True,
        },
    ],
    "booking_agreement": [
        {
            "item_code": "CCCD_FRONT",
            "item_name": "CCCD mặt trước",
            "category": DocumentCategory.CUSTOMER_CCCD.value,
            "is_required": True,
        },
        {
            "item_code": "BOOKING_RECEIPT",
            "item_name": "Phiếu thu tiền giữ chỗ",
            "category": DocumentCategory.PAYMENT_RECEIPT.value,
            "is_required": True,
        },
    ],
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def calculate_checksum(content: bytes) -> str:
    """Calculate SHA-256 checksum for file content"""
    return f"sha256:{hashlib.sha256(content).hexdigest()}"


def verify_checksum(content: bytes, stored_checksum: str) -> bool:
    """Verify file content against stored checksum"""
    if not stored_checksum.startswith("sha256:"):
        return False
    
    current = calculate_checksum(content)
    return current == stored_checksum


def get_category_config(category: DocumentCategory) -> dict:
    """Get configuration for a document category"""
    return DOCUMENT_CATEGORY_CONFIG.get(category, DOCUMENT_CATEGORY_CONFIG[DocumentCategory.OTHER])


def get_default_checklist(contract_type: str) -> list:
    """Get default checklist for a contract type"""
    return DEFAULT_CHECKLISTS.get(contract_type, [])


def is_document_immutable(status: DocumentStatus) -> bool:
    """Check if document is in immutable state"""
    config = DOCUMENT_STATUS_CONFIG.get(status, {})
    return config.get("is_final", False) and not config.get("can_replace", True)


def can_replace_document(status: DocumentStatus) -> bool:
    """Check if document can be replaced/updated"""
    return DOCUMENT_STATUS_CONFIG.get(status, {}).get("can_replace", False)


def can_access_document(visibility: DocumentVisibility, user_role: str) -> bool:
    """Check if user role can access document with given visibility"""
    allowed_roles = VISIBILITY_ROLES.get(visibility, [])
    if "*" in allowed_roles:
        return True
    return user_role in allowed_roles
