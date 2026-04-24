"""
ProHouzing File Upload API - Handle image and file uploads
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import aiofiles
from datetime import datetime, timezone
from pathlib import Path

upload_router = APIRouter(prefix="/upload", tags=["Upload"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_DOC_TYPES = ["application/pdf", "application/msword", 
                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@upload_router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file"""
    
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(content)
    
    # Return URL
    return {
        "success": True,
        "filename": filename,
        "url": f"/api/upload/files/{filename}",
        "size": len(content),
        "content_type": file.content_type
    }

@upload_router.post("/document")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document file (PDF, DOC, DOCX)"""
    
    # Validate file type
    all_allowed = ALLOWED_IMAGE_TYPES + ALLOWED_DOC_TYPES
    if file.content_type not in all_allowed:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: images, PDF, DOC, DOCX"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size: 10MB")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as f:
        await f.write(content)
    
    # Return URL
    return {
        "success": True,
        "filename": filename,
        "original_name": file.filename,
        "url": f"/api/upload/files/{filename}",
        "size": len(content),
        "content_type": file.content_type
    }

@upload_router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded file"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(filepath)

@upload_router.delete("/files/{filename}")
async def delete_file(filename: str):
    """Delete uploaded file"""
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")
    
    os.remove(filepath)
    return {"success": True, "message": "File deleted"}
