"""
ProHouzing Storage Service
Abstracted file storage with version control

Current: Local storage
Future: Can easily switch to S3, GCS, Azure Blob

Features:
- Version control (không overwrite)
- Category-based organization
- Audit log cho mọi thao tác
"""

import os
import shutil
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple, BinaryIO
from pathlib import Path
import mimetypes
import logging

logger = logging.getLogger(__name__)

# Base upload directory
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
HR_DOCUMENTS_DIR = UPLOAD_DIR / "hr_documents"


class StorageService:
    """
    Abstracted Storage Service
    - Local storage implementation
    - Easy to extend for cloud storage
    """
    
    def __init__(self, base_path: Path = HR_DOCUMENTS_DIR):
        self.base_path = base_path
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure all required directories exist"""
        directories = [
            self.base_path,
            self.base_path / "id_card",
            self.base_path / "passport",
            self.base_path / "household",
            self.base_path / "cv",
            self.base_path / "contract",
            self.base_path / "certificate",
            self.base_path / "health_check",
            self.base_path / "photo",
            self.base_path / "nda",
            self.base_path / "other",
        ]
        for d in directories:
            d.mkdir(parents=True, exist_ok=True)
    
    def _get_category_path(self, category: str) -> Path:
        """Get path for document category"""
        valid_categories = [
            "id_card", "passport", "household", "cv", "contract",
            "certificate", "health_check", "photo", "nda", "other"
        ]
        if category not in valid_categories:
            category = "other"
        return self.base_path / category
    
    def _generate_filename(
        self,
        original_filename: str,
        hr_profile_id: str,
        version: int = 1
    ) -> str:
        """Generate unique filename with version"""
        ext = Path(original_filename).suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        return f"{hr_profile_id}_{timestamp}_v{version}_{unique_id}{ext}"
    
    def _calculate_hash(self, file_content: bytes) -> str:
        """Calculate MD5 hash of file content"""
        return hashlib.md5(file_content).hexdigest()
    
    async def save_file(
        self,
        file_content: bytes,
        original_filename: str,
        category: str,
        hr_profile_id: str,
        version: int = 1,
    ) -> Dict[str, Any]:
        """
        Save file to storage
        
        Returns:
            {
                "file_path": str,
                "file_name": str,
                "file_size": int,
                "file_type": str,
                "file_hash": str,
            }
        """
        # Get category path
        category_path = self._get_category_path(category)
        
        # Generate unique filename
        new_filename = self._generate_filename(original_filename, hr_profile_id, version)
        file_path = category_path / new_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Get file info
        file_size = len(file_content)
        file_type, _ = mimetypes.guess_type(original_filename)
        file_hash = self._calculate_hash(file_content)
        
        logger.info(f"Saved file: {file_path} ({file_size} bytes)")
        
        return {
            "file_path": str(file_path),
            "file_name": new_filename,
            "file_size": file_size,
            "file_type": file_type or "application/octet-stream",
            "file_hash": file_hash,
        }
    
    async def get_file(self, file_path: str) -> Optional[bytes]:
        """Read file content"""
        path = Path(file_path)
        if not path.exists():
            return None
        
        with open(path, "rb") as f:
            return f.read()
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete file (soft delete - move to trash)
        """
        path = Path(file_path)
        if not path.exists():
            return False
        
        # Move to trash instead of hard delete
        trash_dir = self.base_path / "_trash"
        trash_dir.mkdir(exist_ok=True)
        
        trash_path = trash_dir / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{path.name}"
        shutil.move(str(path), str(trash_path))
        
        logger.info(f"Moved file to trash: {file_path} -> {trash_path}")
        return True
    
    async def file_exists(self, file_path: str) -> bool:
        """Check if file exists"""
        return Path(file_path).exists()
    
    async def get_file_url(self, file_path: str) -> str:
        """
        Get URL to access file
        For local storage, return API path
        For cloud storage, return signed URL
        """
        # Convert absolute path to relative URL
        # /app/uploads/hr_documents/cv/xxx.pdf -> /api/hr/documents/download/xxx.pdf
        filename = Path(file_path).name
        return f"/api/hr/documents/download/{filename}"
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        total_size = 0
        file_count = 0
        by_category = {}
        
        for category_dir in self.base_path.iterdir():
            if category_dir.is_dir() and not category_dir.name.startswith("_"):
                category_size = 0
                category_count = 0
                
                for f in category_dir.iterdir():
                    if f.is_file():
                        size = f.stat().st_size
                        category_size += size
                        category_count += 1
                
                by_category[category_dir.name] = {
                    "count": category_count,
                    "size": category_size,
                }
                total_size += category_size
                file_count += category_count
        
        return {
            "total_files": file_count,
            "total_size": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "by_category": by_category,
        }


# Singleton instance
storage_service = StorageService()


def get_storage_service() -> StorageService:
    """Get storage service instance"""
    return storage_service
