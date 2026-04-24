"""
ProHouzing Document Models
Prompt 9/20 - Contract & Document Workflow

Models:
- Document (file/document entity)
- DocumentVersion (version history)
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from config.document_config import (
    DocumentCategory, DocumentStatus, DocumentVisibility, StorageType
)


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT CREATE/UPDATE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentCreate(BaseModel):
    """Create new document (internal use - file upload handled separately)"""
    entity_type: str                         # "contract", "amendment", "deal", "customer"
    entity_id: str
    category: str = DocumentCategory.OTHER.value
    title: str
    
    # For ID documents
    expiry_date: Optional[str] = None
    
    # Visibility
    visibility: str = DocumentVisibility.INTERNAL.value
    access_roles: List[str] = []
    
    # Metadata
    tags: List[str] = []
    notes: Optional[str] = None


class DocumentResponse(BaseModel):
    """Document response model"""
    id: str
    document_code: str
    
    # Entity link
    entity_type: str
    entity_id: str
    entity_code: str = ""                    # Resolved (contract code, deal code, etc.)
    
    # Classification
    category: str
    category_label: str = ""
    title: str
    
    # Versioning
    version: int = 1
    is_latest: bool = True
    previous_version_id: Optional[str] = None
    version_notes: Optional[str] = None
    total_versions: int = 1
    
    # File info
    original_filename: str
    storage_filename: str
    storage_path: str
    storage_type: str = StorageType.LOCAL.value
    mime_type: str
    file_size: int                           # bytes
    file_size_display: str = ""              # "2.5 MB"
    checksum: str
    
    # Status
    document_status: str
    document_status_label: str = ""
    document_status_color: str = ""
    is_signed: bool = False
    signed_at: Optional[str] = None
    signed_by: Optional[str] = None
    signed_by_name: str = ""
    
    # For ID documents
    expiry_date: Optional[str] = None
    is_expired: bool = False
    days_until_expiry: Optional[int] = None
    
    # Access control
    visibility: str
    visibility_label: str = ""
    access_roles: List[str] = []
    
    # Audit
    uploaded_by: Optional[str] = None
    uploaded_by_name: str = ""
    uploaded_at: Optional[str] = None
    verified_by: Optional[str] = None
    verified_by_name: str = ""
    verified_at: Optional[str] = None
    verification_notes: Optional[str] = None
    
    # Metadata
    tags: List[str] = []
    notes: Optional[str] = None
    
    # Download URL
    download_url: str = ""
    preview_url: Optional[str] = None
    
    # Flags
    is_immutable: bool = False               # True if signed
    can_replace: bool = True
    can_delete: bool = True


class DocumentVersionResponse(BaseModel):
    """Document version history entry"""
    id: str
    document_code: str                       # Same code across versions
    version: int
    is_latest: bool
    
    # File info
    original_filename: str
    file_size: int
    file_size_display: str = ""
    checksum: str
    
    # Status
    document_status: str
    is_signed: bool = False
    
    # Version info
    version_notes: Optional[str] = None
    previous_version_id: Optional[str] = None
    
    # Audit
    uploaded_by: Optional[str] = None
    uploaded_by_name: str = ""
    uploaded_at: str = ""
    
    download_url: str = ""


class DocumentUploadResponse(BaseModel):
    """Response after document upload"""
    success: bool
    document: Optional[DocumentResponse] = None
    message: str = ""
    errors: List[str] = []


class CreateVersionRequest(BaseModel):
    """Request to create new version of document"""
    version_notes: str
    # File will be handled in multipart form


class VerifyDocumentRequest(BaseModel):
    """Request to verify document"""
    notes: Optional[str] = None


class SignDocumentRequest(BaseModel):
    """Request to mark document as signed"""
    signed_by_name: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT LIST/FILTER MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentListFilters(BaseModel):
    """Filters for document list"""
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    category: Optional[str] = None
    document_status: Optional[str] = None
    visibility: Optional[str] = None
    is_signed: Optional[bool] = None
    is_expired: Optional[bool] = None
    is_latest: bool = True                   # By default only show latest versions
    search: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "uploaded_at"
    sort_order: str = "desc"


class DocumentsByEntityRequest(BaseModel):
    """Request to get documents by entity"""
    entity_type: str
    entity_id: str
    categories: Optional[List[str]] = None   # Filter by categories
    include_all_versions: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# CHECKLIST MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ChecklistStatusResponse(BaseModel):
    """Checklist status for a contract"""
    contract_id: str
    contract_code: str = ""
    
    total_items: int = 0
    uploaded_items: int = 0
    verified_items: int = 0
    missing_items: int = 0
    rejected_items: int = 0
    
    completion_percent: float = 0
    is_complete: bool = False
    is_verified: bool = False
    
    items: List[dict] = []                   # ChecklistItem with resolved document info


class UpdateChecklistItemRequest(BaseModel):
    """Request to update checklist item"""
    item_code: str
    document_id: Optional[str] = None
    status: str                              # uploaded, verified, rejected, waived
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRITY MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class IntegrityCheckResponse(BaseModel):
    """Response from document integrity check"""
    document_id: str
    document_code: str = ""
    is_valid: bool
    stored_checksum: str
    current_checksum: str
    checked_at: str
    message: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentSummary(BaseModel):
    """Document summary for an entity"""
    entity_type: str
    entity_id: str
    
    total_documents: int = 0
    by_category: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    
    signed_documents: int = 0
    pending_verification: int = 0
    expired_documents: int = 0
    
    total_size_bytes: int = 0
    total_size_display: str = ""
