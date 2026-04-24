"""
ProHouzing Document Router
Prompt 9/20 - Contract & Document Workflow

API Endpoints for:
- Document upload
- Version management
- Integrity verification
- Checklist management
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from typing import Optional, List
from datetime import datetime, timezone
from pathlib import Path
import uuid
import os
import hashlib
import logging

from models.document_models import (
    DocumentCreate, DocumentResponse, DocumentVersionResponse,
    DocumentUploadResponse, CreateVersionRequest, VerifyDocumentRequest,
    SignDocumentRequest, DocumentListFilters, DocumentsByEntityRequest,
    ChecklistStatusResponse, UpdateChecklistItemRequest,
    IntegrityCheckResponse, DocumentSummary
)
from config.document_config import (
    DocumentCategory, DocumentStatus, DocumentVisibility, StorageType,
    DOCUMENT_CATEGORY_CONFIG, DOCUMENT_STATUS_CONFIG, STORAGE_CONFIG,
    calculate_checksum, verify_checksum, get_category_config,
    is_document_immutable, can_replace_document
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["documents"])

# Database reference
_db = None

def set_database(database):
    """Set the database reference"""
    global _db
    _db = database

def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

async def get_current_user_internal():
    """Get current user - returns None for now (authentication optional)"""
    return None

# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def get_next_document_sequence(db) -> int:
    """Get next document sequence number"""
    result = await db.counters.find_one_and_update(
        {"_id": "document_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return result.get("seq", 1)

def generate_document_code(sequence: int) -> str:
    """Generate document code"""
    today = datetime.now(timezone.utc)
    return f"DOC-{today.strftime('%Y%m%d')}-{sequence:05d}"

def format_file_size(size_bytes: int) -> str:
    """Format file size for display"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"

def get_storage_path(tenant_id: str, category: str, filename: str) -> str:
    """Generate storage path for document"""
    now = datetime.now(timezone.utc)
    return f"{tenant_id}/{now.year}/{now.month:02d}/{category}/{filename}"

async def save_file_to_storage(content: bytes, storage_path: str) -> str:
    """Save file to storage and return full path"""
    base_path = STORAGE_CONFIG["local_path"]
    full_path = os.path.join(base_path, storage_path)
    
    # Create directories if needed
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Write file
    with open(full_path, "wb") as f:
        f.write(content)
    
    return full_path

async def resolve_entity_code(db, entity_type: str, entity_id: str) -> str:
    """Resolve entity code from type and ID"""
    collection_map = {
        "contract": "contracts",
        "amendment": "amendments",
        "deal": "deals",
        "customer": "contacts",
        "booking": "soft_bookings",
    }
    
    code_field_map = {
        "contract": "contract_code",
        "amendment": "amendment_code",
        "deal": "code",
        "customer": "code",
        "booking": "code",
    }
    
    collection = collection_map.get(entity_type)
    code_field = code_field_map.get(entity_type, "code")
    
    if not collection:
        return ""
    
    doc = await db[collection].find_one({"id": entity_id}, {"_id": 0, code_field: 1})
    return doc.get(code_field, "") if doc else ""

async def create_document_audit_log(
    db,
    document_id: str,
    action: str,
    actor_id: str,
    metadata: dict = None
):
    """Create audit log for document"""
    log = {
        "id": str(uuid.uuid4()),
        "entity_type": "document",
        "entity_id": document_id,
        "action": action,
        "actor_id": actor_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
    }
    await db.document_audit_logs.insert_one(log)

# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT UPLOAD
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    category: str = Form(default=DocumentCategory.OTHER.value),
    title: Optional[str] = Form(default=None),
    visibility: str = Form(default=DocumentVisibility.INTERNAL.value),
    expiry_date: Optional[str] = Form(default=None),
    notes: Optional[str] = Form(default=None),
):
    """Upload new document"""
    
    db = get_db()
    current_user = await get_current_user_internal()
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="Tên file không hợp lệ")
        
        # Get category config
        cat_config = get_category_config(DocumentCategory(category))
        
        # Check extension
        ext = Path(file.filename).suffix.lower()
        allowed_ext = cat_config.get("allowed_extensions", STORAGE_CONFIG["allowed_extensions"])
        if ext not in allowed_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Định dạng file không hỗ trợ. Chấp nhận: {', '.join(allowed_ext)}"
            )
        
        # Read content
        content = await file.read()
        file_size = len(content)
        
        # Check size
        max_size = cat_config.get("max_size_mb", STORAGE_CONFIG["max_file_size_mb"]) * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File quá lớn. Tối đa: {cat_config.get('max_size_mb', STORAGE_CONFIG['max_file_size_mb'])} MB"
            )
        
        # Calculate checksum
        checksum = calculate_checksum(content)
        
        # Check for duplicate
        existing = await db.documents.find_one({
            "checksum": checksum,
            "entity_type": entity_type,
            "entity_id": entity_id,
        })
        if existing:
            raise HTTPException(status_code=400, detail="File này đã tồn tại trong hệ thống")
        
        # Generate paths
        storage_filename = f"{uuid.uuid4()}{ext}"
        tenant_id = current_user.get("tenant_id", "default") if current_user else "default"
        storage_path = get_storage_path(tenant_id, category, storage_filename)
        
        # Save file
        await save_file_to_storage(content, storage_path)
        
        # Generate document code
        now = datetime.now(timezone.utc)
        sequence = await get_next_document_sequence(db)
        document_code = generate_document_code(sequence)
        
        # Resolve entity code
        entity_code = await resolve_entity_code(db, entity_type, entity_id)
        
        # Create document record
        doc = {
            "id": str(uuid.uuid4()),
            "document_code": document_code,
            
            "entity_type": entity_type,
            "entity_id": entity_id,
            
            "category": category,
            "title": title or file.filename,
            
            "version": 1,
            "is_latest": True,
            "previous_version_id": None,
            "version_notes": "Bản gốc",
            
            "original_filename": file.filename,
            "storage_filename": storage_filename,
            "storage_path": storage_path,
            "storage_type": STORAGE_CONFIG["type"].value,
            "mime_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "checksum": checksum,
            
            "document_status": DocumentStatus.DRAFT.value,
            "is_signed": False,
            "signed_at": None,
            "signed_by": None,
            
            "expiry_date": expiry_date,
            "is_expired": False,
            
            "visibility": visibility,
            "access_roles": [],
            
            "uploaded_by": current_user["id"] if current_user else None,
            "uploaded_at": now.isoformat(),
            "verified_by": None,
            "verified_at": None,
            "verification_notes": None,
            
            "tags": [],
            "notes": notes,
        }
        
        await db.documents.insert_one(doc)
        
        # Link to entity
        await link_document_to_entity(db, entity_type, entity_id, doc["id"])
        
        # Audit log
        await create_document_audit_log(
            db, doc["id"], "upload",
            current_user["id"] if current_user else "system",
            {"filename": file.filename, "category": category}
        )
        
        # Build response
        cat_label = DOCUMENT_CATEGORY_CONFIG.get(DocumentCategory(category), {}).get("label", "")
        status_config = DOCUMENT_STATUS_CONFIG.get(DocumentStatus(doc["document_status"]), {})
        
        return DocumentUploadResponse(
            success=True,
            document=DocumentResponse(
                **doc,
                entity_code=entity_code,
                category_label=cat_label,
                document_status_label=status_config.get("label", ""),
                document_status_color=status_config.get("color", ""),
                file_size_display=format_file_size(file_size),
                uploaded_by_name=current_user.get("full_name", "") if current_user else "",
                download_url=f"/api/documents/{doc['id']}/download",
                is_immutable=False,
                can_replace=True,
                can_delete=True,
                total_versions=1,
            ),
            message="Upload thành công"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return DocumentUploadResponse(
            success=False,
            message="Lỗi upload file",
            errors=[str(e)]
        )

async def link_document_to_entity(db, entity_type: str, entity_id: str, document_id: str):
    """Link document to parent entity"""
    collection_map = {
        "contract": "contracts",
        "amendment": "amendments",
        "deal": "deals",
    }
    
    collection = collection_map.get(entity_type)
    if collection:
        await db[collection].update_one(
            {"id": entity_id},
            {"$addToSet": {"document_ids": document_id}}
        )

# ═══════════════════════════════════════════════════════════════════════════════
# STATIC REFERENCE ENDPOINTS (must be before /{document_id})
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/categories", response_model=List[dict])
async def get_document_categories():
    """Get all document categories"""
    return [
        {
            "value": cat.value,
            "label": DOCUMENT_CATEGORY_CONFIG.get(cat, {}).get("label", cat.value),
            "description": DOCUMENT_CATEGORY_CONFIG.get(cat, {}).get("description", ""),
            "icon": DOCUMENT_CATEGORY_CONFIG.get(cat, {}).get("icon", ""),
            "requires_verification": DOCUMENT_CATEGORY_CONFIG.get(cat, {}).get("requires_verification", False),
        }
        for cat in DocumentCategory
    ]


@router.get("/statuses", response_model=List[dict])
async def get_document_statuses():
    """Get all document statuses"""
    return [
        {
            "value": ds.value,
            "label": DOCUMENT_STATUS_CONFIG.get(ds, {}).get("label", ds.value),
            "color": DOCUMENT_STATUS_CONFIG.get(ds, {}).get("color", ""),
            "description": DOCUMENT_STATUS_CONFIG.get(ds, {}).get("description", ""),
        }
        for ds in DocumentStatus
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# DOCUMENT CRUD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    category: Optional[str] = None,
    document_status: Optional[str] = None,
    is_signed: Optional[bool] = None,
    is_latest: bool = True,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    sort_by: str = "uploaded_at",
    sort_order: str = "desc",
):
    """List documents with filters"""
    
    db = get_db()
    
    query = {}
    
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if category:
        query["category"] = category
    if document_status:
        query["document_status"] = document_status
    if is_signed is not None:
        query["is_signed"] = is_signed
    if is_latest:
        query["is_latest"] = True
    if search:
        query["$or"] = [
            {"document_code": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
            {"original_filename": {"$regex": search, "$options": "i"}},
        ]
    
    sort_dir = -1 if sort_order == "desc" else 1
    
    docs = await db.documents.find(
        query, {"_id": 0}
    ).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)
    
    results = []
    for doc in docs:
        entity_code = await resolve_entity_code(db, doc.get("entity_type", ""), doc.get("entity_id", ""))
        cat_label = DOCUMENT_CATEGORY_CONFIG.get(DocumentCategory(doc.get("category", "other")), {}).get("label", "")
        status_config = DOCUMENT_STATUS_CONFIG.get(DocumentStatus(doc.get("document_status", "draft")), {})
        
        # Count versions
        total_versions = await db.documents.count_documents({
            "document_code": doc["document_code"]
        })
        
        results.append(DocumentResponse(
            **doc,
            entity_code=entity_code,
            category_label=cat_label,
            document_status_label=status_config.get("label", ""),
            document_status_color=status_config.get("color", ""),
            file_size_display=format_file_size(doc.get("file_size", 0)),
            download_url=f"/api/documents/{doc['id']}/download",
            is_immutable=is_document_immutable(DocumentStatus(doc.get("document_status", "draft"))),
            can_replace=can_replace_document(DocumentStatus(doc.get("document_status", "draft"))),
            can_delete=status_config.get("can_delete", False),
            total_versions=total_versions,
        ))
    
    return results

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    """Get document detail"""
    
    db = get_db()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    entity_code = await resolve_entity_code(db, doc.get("entity_type", ""), doc.get("entity_id", ""))
    cat_label = DOCUMENT_CATEGORY_CONFIG.get(DocumentCategory(doc.get("category", "other")), {}).get("label", "")
    status_config = DOCUMENT_STATUS_CONFIG.get(DocumentStatus(doc.get("document_status", "draft")), {})
    
    total_versions = await db.documents.count_documents({"document_code": doc["document_code"]})
    
    # Resolve names
    uploaded_by_name = ""
    if doc.get("uploaded_by"):
        user = await db.users.find_one({"id": doc["uploaded_by"]}, {"_id": 0, "full_name": 1})
        uploaded_by_name = user.get("full_name", "") if user else ""
    
    verified_by_name = ""
    if doc.get("verified_by"):
        user = await db.users.find_one({"id": doc["verified_by"]}, {"_id": 0, "full_name": 1})
        verified_by_name = user.get("full_name", "") if user else ""
    
    signed_by_name = ""
    if doc.get("signed_by"):
        user = await db.users.find_one({"id": doc["signed_by"]}, {"_id": 0, "full_name": 1})
        signed_by_name = user.get("full_name", "") if user else ""
    
    return DocumentResponse(
        **doc,
        entity_code=entity_code,
        category_label=cat_label,
        document_status_label=status_config.get("label", ""),
        document_status_color=status_config.get("color", ""),
        file_size_display=format_file_size(doc.get("file_size", 0)),
        uploaded_by_name=uploaded_by_name,
        verified_by_name=verified_by_name,
        signed_by_name=signed_by_name,
        download_url=f"/api/documents/{doc['id']}/download",
        is_immutable=is_document_immutable(DocumentStatus(doc.get("document_status", "draft"))),
        can_replace=can_replace_document(DocumentStatus(doc.get("document_status", "draft"))),
        can_delete=status_config.get("can_delete", False),
        total_versions=total_versions,
    )

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete document (only if not signed)"""
    
    db = get_db()
    current_user = await get_current_user_internal()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    status = DocumentStatus(doc.get("document_status", "draft"))
    status_config = DOCUMENT_STATUS_CONFIG.get(status, {})
    
    if not status_config.get("can_delete", False):
        raise HTTPException(
            status_code=400,
            detail=f"Không thể xóa tài liệu ở trạng thái {status_config.get('label', status.value)}"
        )
    
    if doc.get("is_signed"):
        raise HTTPException(status_code=400, detail="Không thể xóa tài liệu đã ký")
    
    # Delete file
    try:
        full_path = os.path.join(STORAGE_CONFIG["local_path"], doc["storage_path"])
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        logger.warning(f"Could not delete file: {e}")
    
    # Delete record
    await db.documents.delete_one({"id": document_id})
    
    # Remove from entity
    entity_type = doc.get("entity_type")
    entity_id = doc.get("entity_id")
    if entity_type and entity_id:
        collection_map = {"contract": "contracts", "amendment": "amendments", "deal": "deals"}
        collection = collection_map.get(entity_type)
        if collection:
            await db[collection].update_one(
                {"id": entity_id},
                {"$pull": {"document_ids": document_id}}
            )
    
    await create_document_audit_log(
        db, document_id, "delete",
        current_user["id"] if current_user else "system"
    )
    
    return {"success": True, "message": "Đã xóa tài liệu"}

# ═══════════════════════════════════════════════════════════════════════════════
# VERSION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{document_id}/versions", response_model=DocumentUploadResponse)
async def create_new_version(
    document_id: str,
    file: UploadFile = File(...),
    version_notes: str = Form(...),
):
    """Create new version of document (only if not signed)"""
    
    db = get_db()
    current_user = await get_current_user_internal()
    
    # Get existing document
    existing = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    # Check if signed (immutable)
    if existing.get("is_signed"):
        raise HTTPException(
            status_code=400,
            detail="Không thể tạo version mới cho tài liệu đã ký. Vui lòng upload tài liệu mới."
        )
    
    if not can_replace_document(DocumentStatus(existing.get("document_status", "draft"))):
        raise HTTPException(status_code=400, detail="Không thể tạo version mới cho tài liệu này")
    
    # Read and validate file
    content = await file.read()
    checksum = calculate_checksum(content)
    
    # Generate new storage path
    ext = Path(file.filename).suffix.lower()
    storage_filename = f"{uuid.uuid4()}{ext}"
    tenant_id = current_user.get("tenant_id", "default") if current_user else "default"
    storage_path = get_storage_path(tenant_id, existing["category"], storage_filename)
    
    # Save file
    await save_file_to_storage(content, storage_path)
    
    # Mark old version as not latest
    await db.documents.update_one(
        {"id": document_id},
        {"$set": {"is_latest": False}}
    )
    
    now = datetime.now(timezone.utc)
    
    # Create new version
    new_doc = {
        "id": str(uuid.uuid4()),
        "document_code": existing["document_code"],  # Same code
        
        "entity_type": existing["entity_type"],
        "entity_id": existing["entity_id"],
        
        "category": existing["category"],
        "title": file.filename,
        
        "version": existing["version"] + 1,
        "is_latest": True,
        "previous_version_id": document_id,
        "version_notes": version_notes,
        
        "original_filename": file.filename,
        "storage_filename": storage_filename,
        "storage_path": storage_path,
        "storage_type": STORAGE_CONFIG["type"].value,
        "mime_type": file.content_type or "application/octet-stream",
        "file_size": len(content),
        "checksum": checksum,
        
        "document_status": DocumentStatus.DRAFT.value,  # Reset status
        "is_signed": False,
        "signed_at": None,
        "signed_by": None,
        
        "expiry_date": existing.get("expiry_date"),
        "is_expired": existing.get("is_expired", False),
        
        "visibility": existing["visibility"],
        "access_roles": existing.get("access_roles", []),
        
        "uploaded_by": current_user["id"] if current_user else None,
        "uploaded_at": now.isoformat(),
        "verified_by": None,
        "verified_at": None,
        "verification_notes": None,
        
        "tags": existing.get("tags", []),
        "notes": existing.get("notes"),
    }
    
    await db.documents.insert_one(new_doc)
    
    # Update entity document_ids
    entity_type = existing.get("entity_type")
    entity_id = existing.get("entity_id")
    if entity_type and entity_id:
        collection_map = {"contract": "contracts", "amendment": "amendments", "deal": "deals"}
        collection = collection_map.get(entity_type)
        if collection:
            await db[collection].update_one(
                {"id": entity_id},
                {"$addToSet": {"document_ids": new_doc["id"]}}
            )
    
    await create_document_audit_log(
        db, new_doc["id"], "new_version",
        current_user["id"] if current_user else "system",
        {"previous_version": document_id, "version": new_doc["version"]}
    )
    
    return DocumentUploadResponse(
        success=True,
        document=DocumentResponse(
            **new_doc,
            file_size_display=format_file_size(len(content)),
            download_url=f"/api/documents/{new_doc['id']}/download",
            total_versions=new_doc["version"],
        ),
        message=f"Đã tạo version {new_doc['version']}"
    )

@router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
async def get_document_versions(document_id: str):
    """Get all versions of a document"""
    
    db = get_db()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0, "document_code": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    versions = await db.documents.find(
        {"document_code": doc["document_code"]},
        {"_id": 0}
    ).sort("version", -1).to_list(100)
    
    results = []
    for v in versions:
        uploaded_by_name = ""
        if v.get("uploaded_by"):
            user = await db.users.find_one({"id": v["uploaded_by"]}, {"_id": 0, "full_name": 1})
            uploaded_by_name = user.get("full_name", "") if user else ""
        
        results.append(DocumentVersionResponse(
            id=v["id"],
            document_code=v["document_code"],
            version=v["version"],
            is_latest=v.get("is_latest", False),
            original_filename=v.get("original_filename", ""),
            file_size=v.get("file_size", 0),
            file_size_display=format_file_size(v.get("file_size", 0)),
            checksum=v.get("checksum", ""),
            document_status=v.get("document_status", "draft"),
            is_signed=v.get("is_signed", False),
            version_notes=v.get("version_notes"),
            previous_version_id=v.get("previous_version_id"),
            uploaded_by=v.get("uploaded_by"),
            uploaded_by_name=uploaded_by_name,
            uploaded_at=v.get("uploaded_at") or "",
            download_url=f"/api/documents/{v['id']}/download",
        ))
    
    return results

# ═══════════════════════════════════════════════════════════════════════════════
# INTEGRITY VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/{document_id}/verify", response_model=IntegrityCheckResponse)
async def verify_document_integrity(document_id: str):
    """Verify document file integrity (checksum match)"""
    
    db = get_db()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    # Read file
    full_path = os.path.join(STORAGE_CONFIG["local_path"], doc["storage_path"])
    
    if not os.path.exists(full_path):
        return IntegrityCheckResponse(
            document_id=document_id,
            document_code=doc.get("document_code", ""),
            is_valid=False,
            stored_checksum=doc.get("checksum", ""),
            current_checksum="FILE_NOT_FOUND",
            checked_at=datetime.now(timezone.utc).isoformat(),
            message="File không tồn tại trên server"
        )
    
    with open(full_path, "rb") as f:
        content = f.read()
    
    current_checksum = calculate_checksum(content)
    stored_checksum = doc.get("checksum", "")
    is_valid = current_checksum == stored_checksum
    
    return IntegrityCheckResponse(
        document_id=document_id,
        document_code=doc.get("document_code", ""),
        is_valid=is_valid,
        stored_checksum=stored_checksum,
        current_checksum=current_checksum,
        checked_at=datetime.now(timezone.utc).isoformat(),
        message="File hợp lệ" if is_valid else "CẢNH BÁO: File đã bị thay đổi!"
    )

@router.post("/{document_id}/sign")
async def mark_document_as_signed(document_id: str, request: SignDocumentRequest):
    """Mark document as signed (makes it immutable)"""
    
    db = get_db()
    current_user = await get_current_user_internal()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    if doc.get("is_signed"):
        raise HTTPException(status_code=400, detail="Tài liệu đã được đánh dấu là đã ký")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.documents.update_one(
        {"id": document_id},
        {"$set": {
            "is_signed": True,
            "signed_at": now,
            "signed_by": current_user["id"] if current_user else None,
            "document_status": DocumentStatus.SIGNED.value,
        }}
    )
    
    await create_document_audit_log(
        db, document_id, "sign",
        current_user["id"] if current_user else "system",
        {"signed_by_name": request.signed_by_name}
    )
    
    return {"success": True, "message": "Đã đánh dấu tài liệu là đã ký. Tài liệu không thể thay đổi."}

# ═══════════════════════════════════════════════════════════════════════════════
# DOWNLOAD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/{document_id}/download")
async def download_document(document_id: str, verify: bool = True):
    """Download document with optional integrity verification"""
    
    from fastapi.responses import FileResponse
    
    db = get_db()
    
    doc = await db.documents.find_one({"id": document_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    
    full_path = os.path.join(STORAGE_CONFIG["local_path"], doc["storage_path"])
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File không tồn tại trên server")
    
    # Verify integrity if requested
    if verify:
        with open(full_path, "rb") as f:
            content = f.read()
        current_checksum = calculate_checksum(content)
        if current_checksum != doc.get("checksum", ""):
            raise HTTPException(
                status_code=500,
                detail="CẢNH BÁO: File đã bị thay đổi! Integrity check failed."
            )
    
    return FileResponse(
        full_path,
        filename=doc.get("original_filename", "download"),
        media_type=doc.get("mime_type", "application/octet-stream")
    )

# ═══════════════════════════════════════════════════════════════════════════════
# BY ENTITY
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/by-contract/{contract_id}", response_model=List[DocumentResponse])
async def get_documents_by_contract(contract_id: str):
    """Get all documents for a contract"""
    return await list_documents(entity_type="contract", entity_id=contract_id)

@router.get("/by-deal/{deal_id}", response_model=List[DocumentResponse])
async def get_documents_by_deal(deal_id: str):
    """Get all documents for a deal"""
    return await list_documents(entity_type="deal", entity_id=deal_id)

@router.get("/by-customer/{customer_id}", response_model=List[DocumentResponse])
async def get_documents_by_customer(customer_id: str):
    """Get all documents for a customer"""
    return await list_documents(entity_type="customer", entity_id=customer_id)

# ═══════════════════════════════════════════════════════════════════════════════
# CHECKLIST
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/checklist/{contract_id}", response_model=ChecklistStatusResponse)
async def get_checklist_status(contract_id: str):
    """Get checklist status for a contract"""
    
    db = get_db()
    
    contract = await db.contracts.find_one(
        {"id": contract_id},
        {"_id": 0, "contract_code": 1, "required_checklist": 1}
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    checklist = contract.get("required_checklist", [])
    
    total = len(checklist)
    uploaded = sum(1 for i in checklist if i.get("status") in ["uploaded", "verified"])
    verified = sum(1 for i in checklist if i.get("status") == "verified")
    missing = sum(1 for i in checklist if i.get("status") == "pending" and i.get("is_required"))
    rejected = sum(1 for i in checklist if i.get("status") == "rejected")
    
    completion = (uploaded / total * 100) if total > 0 else 0
    
    return ChecklistStatusResponse(
        contract_id=contract_id,
        contract_code=contract.get("contract_code", ""),
        total_items=total,
        uploaded_items=uploaded,
        verified_items=verified,
        missing_items=missing,
        rejected_items=rejected,
        completion_percent=round(completion, 1),
        is_complete=missing == 0,
        is_verified=verified == total,
        items=checklist,
    )

@router.put("/checklist/{contract_id}", response_model=ChecklistStatusResponse)
async def update_checklist_item(contract_id: str, request: UpdateChecklistItemRequest):
    """Update checklist item status"""
    
    db = get_db()
    current_user = await get_current_user_internal()
    
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Hợp đồng không tồn tại")
    
    checklist = contract.get("required_checklist", [])
    now = datetime.now(timezone.utc).isoformat()
    
    # Find and update item
    updated = False
    for i, item in enumerate(checklist):
        if item.get("item_code") == request.item_code:
            checklist[i]["document_id"] = request.document_id
            checklist[i]["status"] = request.status
            checklist[i]["notes"] = request.notes
            
            if request.status == "verified":
                checklist[i]["verified_by"] = current_user["id"] if current_user else None
                checklist[i]["verified_at"] = now
            
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Item không tồn tại trong checklist")
    
    # Update contract
    missing_docs = [
        item["item_code"] for item in checklist
        if item.get("status") == "pending" and item.get("is_required")
    ]
    
    checklist_complete = len(missing_docs) == 0
    checklist_verified = all(item.get("status") == "verified" for item in checklist if item.get("is_required"))
    
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {
            "required_checklist": checklist,
            "missing_documents": missing_docs,
            "checklist_complete": checklist_complete,
            "checklist_verified": checklist_verified,
        }}
    )
    
    return await get_checklist_status(contract_id)
