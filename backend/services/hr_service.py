"""
ProHouzing HR Service
Business logic for HR Profile 360°

Features:
- CRUD for all HR entities
- Profile completeness calculation
- Onboarding checklist management
- Alert generation
- Search & filter
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import uuid
import logging
import re

from motor.motor_asyncio import AsyncIOMotorDatabase

from models.hr_models import (
    HR_COLLECTIONS,
    HRProfile, HRProfileCreate, HRProfileUpdate,
    FamilyMember, FamilyMemberCreate,
    Education, EducationCreate,
    WorkHistory, WorkHistoryCreate,
    Certificate, CertificateCreate,
    HRDocument, HRDocumentCreate,
    InternalWorkHistory,
    EmploymentContract,
    RewardDiscipline, RewardDisciplineCreate,
    KPIRecord,
    OnboardingChecklistItem,
    HRAlert,
    EmploymentStatus, DocumentCategory, OnboardingStatus,
)
from services.audit_service import AuditService

logger = logging.getLogger(__name__)


def remove_accents(text: str) -> str:
    """Remove Vietnamese accents for search"""
    if not text:
        return ""
    accents = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    }
    result = text.lower()
    for k, v in accents.items():
        result = result.replace(k, v)
    return result


class HRService:
    """HR Service - Business logic for HR Profile 360°"""
    
    # Required documents for profile completeness
    REQUIRED_DOCUMENTS = [
        DocumentCategory.ID_CARD,
        DocumentCategory.CV,
        DocumentCategory.PHOTO,
    ]
    
    # Onboarding checklist template
    ONBOARDING_CHECKLIST = [
        {"code": "doc_id_card", "name": "Nộp CCCD/CMND", "category": "documents", "required": True},
        {"code": "doc_cv", "name": "Nộp Sơ yếu lý lịch", "category": "documents", "required": True},
        {"code": "doc_photo", "name": "Nộp Ảnh 3x4", "category": "documents", "required": True},
        {"code": "doc_health", "name": "Nộp Giấy khám sức khỏe", "category": "documents", "required": False},
        {"code": "doc_degree", "name": "Nộp Bằng cấp", "category": "documents", "required": False},
        {"code": "contract_sign", "name": "Ký hợp đồng", "category": "contract", "required": True},
        {"code": "bank_info", "name": "Cung cấp thông tin ngân hàng", "category": "setup", "required": True},
        {"code": "tax_info", "name": "Cung cấp mã số thuế", "category": "setup", "required": False},
        {"code": "training_company", "name": "Hoàn thành đào tạo công ty", "category": "training", "required": True},
        {"code": "training_product", "name": "Hoàn thành đào tạo sản phẩm", "category": "training", "required": True},
        {"code": "account_setup", "name": "Thiết lập tài khoản hệ thống", "category": "setup", "required": True},
    ]
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.audit = AuditService(db)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HR PROFILE CRUD
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_profile(
        self,
        data: HRProfileCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Create new HR Profile"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Generate user_id if not provided
        user_id = data.user_id if data.user_id else str(uuid.uuid4())
        
        # Check if profile already exists for user (only if user_id was provided)
        if data.user_id:
            existing = await self.db[HR_COLLECTIONS["profiles"]].find_one(
                {"user_id": data.user_id}
            )
            if existing:
                return {"success": False, "error": "Profile already exists for this user"}
        
        # Generate employee code
        count = await self.db[HR_COLLECTIONS["profiles"]].count_documents({})
        employee_code = f"PH{str(count + 1).zfill(4)}"
        
        # Create profile
        profile_id = str(uuid.uuid4())
        profile_data = data.dict() if hasattr(data, 'dict') else data.model_dump()
        profile_data.update({
            "id": profile_id,
            "user_id": user_id,
            "employee_code": employee_code,
            "full_name_unsigned": remove_accents(data.full_name),
            "employment_status": (data.employment_status.value if data.employment_status else EmploymentStatus.PROBATION.value),
            "onboarding_status": OnboardingStatus.PENDING.value,
            "profile_completeness": 0,
            "missing_documents": [d.value for d in self.REQUIRED_DOCUMENTS],
            "total_deals": 0,
            "total_revenue": 0,
            "total_commission": 0,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "created_by": actor_id,
            "updated_by": actor_id,
        })
        
        await self.db[HR_COLLECTIONS["profiles"]].insert_one(profile_data)
        
        # Create onboarding checklist
        await self._create_onboarding_checklist(profile_id)
        
        # Audit log
        await self.audit.log(
            entity_type="hr_profile",
            entity_id=profile_id,
            action="create",
            actor_id=actor_id,
            metadata={"employee_code": employee_code, "full_name": data.full_name},
        )
        
        # Update completeness
        await self._update_profile_completeness(profile_id)
        
        logger.info(f"Created HR Profile: {employee_code} - {data.full_name}")
        
        return {
            "success": True,
            "data": {
                "id": profile_id,
                "employee_code": employee_code,
            }
        }
    
    async def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get HR Profile by ID"""
        profile = await self.db[HR_COLLECTIONS["profiles"]].find_one(
            {"id": profile_id},
            {"_id": 0}
        )
        return profile
    
    async def get_profile_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get HR Profile by User ID"""
        profile = await self.db[HR_COLLECTIONS["profiles"]].find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        return profile
    
    async def update_profile(
        self,
        profile_id: str,
        data: HRProfileUpdate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Update HR Profile"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get current profile
        current = await self.get_profile(profile_id)
        if not current:
            return {"success": False, "error": "Profile not found"}
        
        # Build update data
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        if not update_data:
            return {"success": False, "error": "No data to update"}
        
        # Add unsigned name if name changed
        if "full_name" in update_data:
            update_data["full_name_unsigned"] = remove_accents(update_data["full_name"])
        
        update_data["updated_at"] = now
        update_data["updated_by"] = actor_id
        
        # Track changes for audit
        changes = {}
        for key, new_value in update_data.items():
            if key not in ["updated_at", "updated_by"]:
                old_value = current.get(key)
                if old_value != new_value:
                    changes[key] = {"old": old_value, "new": new_value}
        
        # Update
        await self.db[HR_COLLECTIONS["profiles"]].update_one(
            {"id": profile_id},
            {"$set": update_data}
        )
        
        # Audit log
        if changes:
            await self.audit.log(
                entity_type="hr_profile",
                entity_id=profile_id,
                action="update",
                actor_id=actor_id,
                changes=changes,
            )
        
        # Update completeness
        await self._update_profile_completeness(profile_id)
        
        logger.info(f"Updated HR Profile: {profile_id}")
        
        return {"success": True}
    
    async def list_profiles(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: int = -1,
    ) -> List[Dict[str, Any]]:
        """List HR Profiles with filters"""
        query = {"is_active": True}
        
        if search:
            search_unsigned = remove_accents(search)
            query["$or"] = [
                {"full_name": {"$regex": search, "$options": "i"}},
                {"full_name_unsigned": {"$regex": search_unsigned, "$options": "i"}},
                {"employee_code": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"email_personal": {"$regex": search, "$options": "i"}},
            ]
        
        if status:
            query["employment_status"] = status
        
        if team_id:
            query["current_team_id"] = team_id
        
        cursor = self.db[HR_COLLECTIONS["profiles"]].find(
            query,
            {"_id": 0}
        ).sort(sort_by, sort_order).skip(skip).limit(limit)
        
        profiles = await cursor.to_list(limit)
        return profiles
    
    async def get_profile_360(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """
        Get FULL 360° view of HR Profile
        Returns all related data in one response
        """
        profile = await self.get_profile(profile_id)
        if not profile:
            return None
        
        # Get all related data in parallel
        family = await self.db[HR_COLLECTIONS["family"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).to_list(20)
        
        education = await self.db[HR_COLLECTIONS["education"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(20)
        
        work_history = await self.db[HR_COLLECTIONS["work_history"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(20)
        
        certificates = await self.db[HR_COLLECTIONS["certificates"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("issue_date", -1).to_list(50)
        
        documents = await self.db[HR_COLLECTIONS["documents"]].find(
            {"hr_profile_id": profile_id, "is_latest": True},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        internal_history = await self.db[HR_COLLECTIONS["internal_history"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(20)
        
        contracts = await self.db[HR_COLLECTIONS["contracts"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(10)
        
        rewards = await self.db[HR_COLLECTIONS["rewards"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("effective_date", -1).to_list(50)
        
        kpi = await self.db[HR_COLLECTIONS["kpi"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort([("period_year", -1), ("period_month", -1)]).to_list(24)
        
        onboarding = await self.db[HR_COLLECTIONS["onboarding"]].find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).to_list(20)
        
        alerts = await self.db[HR_COLLECTIONS["alerts"]].find(
            {"hr_profile_id": profile_id, "is_resolved": False},
            {"_id": 0}
        ).sort("created_at", -1).to_list(20)
        
        return {
            "profile": profile,
            "family": family,
            "education": education,
            "work_history": work_history,
            "certificates": certificates,
            "documents": documents,
            "internal_history": internal_history,
            "contracts": contracts,
            "rewards_discipline": rewards,
            "kpi_records": kpi,
            "onboarding_checklist": onboarding,
            "alerts": alerts,
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FAMILY MEMBERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_family_member(
        self,
        profile_id: str,
        data: FamilyMemberCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Add family member"""
        now = datetime.now(timezone.utc).isoformat()
        
        member_id = str(uuid.uuid4())
        member_data = data.dict()
        member_data.update({
            "id": member_id,
            "hr_profile_id": profile_id,
            "created_at": now,
            "updated_at": now,
        })
        
        await self.db[HR_COLLECTIONS["family"]].insert_one(member_data)
        
        await self.audit.log(
            entity_type="hr_family",
            entity_id=member_id,
            action="create",
            actor_id=actor_id,
            metadata={"hr_profile_id": profile_id, "name": data.full_name},
        )
        
        return {"success": True, "data": {"id": member_id}}
    
    async def update_family_member(
        self,
        member_id: str,
        data: Dict[str, Any],
        actor_id: str,
    ) -> Dict[str, Any]:
        """Update family member"""
        now = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = now
        
        await self.db[HR_COLLECTIONS["family"]].update_one(
            {"id": member_id},
            {"$set": data}
        )
        
        await self.audit.log(
            entity_type="hr_family",
            entity_id=member_id,
            action="update",
            actor_id=actor_id,
        )
        
        return {"success": True}
    
    async def delete_family_member(
        self,
        member_id: str,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Delete family member"""
        await self.db[HR_COLLECTIONS["family"]].delete_one({"id": member_id})
        
        await self.audit.log(
            entity_type="hr_family",
            entity_id=member_id,
            action="delete",
            actor_id=actor_id,
        )
        
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EDUCATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_education(
        self,
        profile_id: str,
        data: EducationCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Add education record"""
        now = datetime.now(timezone.utc).isoformat()
        
        edu_id = str(uuid.uuid4())
        edu_data = data.dict()
        edu_data.update({
            "id": edu_id,
            "hr_profile_id": profile_id,
            "created_at": now,
            "updated_at": now,
        })
        
        await self.db[HR_COLLECTIONS["education"]].insert_one(edu_data)
        
        await self.audit.log(
            entity_type="hr_education",
            entity_id=edu_id,
            action="create",
            actor_id=actor_id,
            metadata={"hr_profile_id": profile_id, "institution": data.institution},
        )
        
        await self._update_profile_completeness(profile_id)
        
        return {"success": True, "data": {"id": edu_id}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # WORK HISTORY
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_work_history(
        self,
        profile_id: str,
        data: WorkHistoryCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Add work history record"""
        now = datetime.now(timezone.utc).isoformat()
        
        work_id = str(uuid.uuid4())
        work_data = data.dict()
        work_data.update({
            "id": work_id,
            "hr_profile_id": profile_id,
            "created_at": now,
            "updated_at": now,
        })
        
        await self.db[HR_COLLECTIONS["work_history"]].insert_one(work_data)
        
        await self.audit.log(
            entity_type="hr_work_history",
            entity_id=work_id,
            action="create",
            actor_id=actor_id,
            metadata={"hr_profile_id": profile_id, "company": data.company},
        )
        
        return {"success": True, "data": {"id": work_id}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CERTIFICATES
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_certificate(
        self,
        profile_id: str,
        data: CertificateCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Add certificate"""
        now = datetime.now(timezone.utc).isoformat()
        
        cert_id = str(uuid.uuid4())
        cert_data = data.dict()
        cert_data.update({
            "id": cert_id,
            "hr_profile_id": profile_id,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
        })
        
        await self.db[HR_COLLECTIONS["certificates"]].insert_one(cert_data)
        
        await self.audit.log(
            entity_type="hr_certificate",
            entity_id=cert_id,
            action="create",
            actor_id=actor_id,
            metadata={"hr_profile_id": profile_id, "name": data.name},
        )
        
        return {"success": True, "data": {"id": cert_id}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DOCUMENTS (với version control)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_document(
        self,
        profile_id: str,
        file_info: Dict[str, Any],
        metadata: HRDocumentCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """
        Add document with version control
        If document of same category exists, create new version
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Check for existing document of same category
        existing = await self.db[HR_COLLECTIONS["documents"]].find_one(
            {
                "hr_profile_id": profile_id,
                "category": metadata.category.value,
                "is_latest": True,
            },
            {"_id": 0, "id": 1, "version": 1}
        )
        
        # Determine version
        if existing:
            # Mark old version as not latest
            await self.db[HR_COLLECTIONS["documents"]].update_one(
                {"id": existing["id"]},
                {"$set": {"is_latest": False, "updated_at": now}}
            )
            version = existing["version"] + 1
            parent_id = existing["id"]
        else:
            version = 1
            parent_id = None
        
        # Create document record
        doc_id = str(uuid.uuid4())
        doc_data = {
            "id": doc_id,
            "hr_profile_id": profile_id,
            
            "name": metadata.name,
            "category": metadata.category.value,
            "description": metadata.description,
            
            "file_path": file_info["file_path"],
            "file_name": file_info["file_name"],
            "file_size": file_info["file_size"],
            "file_type": file_info["file_type"],
            
            "version": version,
            "parent_id": parent_id,
            "is_latest": True,
            
            "is_verified": False,
            "issue_date": metadata.issue_date,
            "expiry_date": metadata.expiry_date,
            
            "uploaded_by": actor_id,
            "uploaded_at": now,
            "notes": metadata.notes,
            
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db[HR_COLLECTIONS["documents"]].insert_one(doc_data)
        
        # Audit log
        await self.audit.log(
            entity_type="hr_document",
            entity_id=doc_id,
            action="upload",
            actor_id=actor_id,
            metadata={
                "hr_profile_id": profile_id,
                "category": metadata.category.value,
                "version": version,
                "file_name": file_info["file_name"],
            },
        )
        
        # Update profile completeness
        await self._update_profile_completeness(profile_id)
        
        # Update onboarding checklist if applicable
        await self._update_onboarding_document(profile_id, metadata.category.value)
        
        logger.info(f"Added document v{version}: {metadata.name} for profile {profile_id}")
        
        return {"success": True, "data": {"id": doc_id, "version": version}}
    
    async def get_document_versions(
        self,
        profile_id: str,
        category: str,
    ) -> List[Dict[str, Any]]:
        """Get all versions of a document category"""
        docs = await self.db[HR_COLLECTIONS["documents"]].find(
            {"hr_profile_id": profile_id, "category": category},
            {"_id": 0}
        ).sort("version", -1).to_list(50)
        return docs
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REWARDS & DISCIPLINE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def add_reward_discipline(
        self,
        profile_id: str,
        data: RewardDisciplineCreate,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Add reward or discipline record"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get actor name
        actor = await self.db.users.find_one(
            {"id": actor_id},
            {"_id": 0, "full_name": 1}
        )
        
        record_id = str(uuid.uuid4())
        record_data = data.dict()
        record_data.update({
            "id": record_id,
            "hr_profile_id": profile_id,
            "approved_by": actor_id,
            "approved_by_name": actor.get("full_name") if actor else None,
            "approved_at": now,
            "created_at": now,
            "updated_at": now,
        })
        
        await self.db[HR_COLLECTIONS["rewards"]].insert_one(record_data)
        
        await self.audit.log(
            entity_type="hr_reward_discipline",
            entity_id=record_id,
            action="create",
            actor_id=actor_id,
            metadata={
                "hr_profile_id": profile_id,
                "type": data.type.value,
                "title": data.title,
            },
        )
        
        return {"success": True, "data": {"id": record_id}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ONBOARDING CHECKLIST
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _create_onboarding_checklist(self, profile_id: str):
        """Create onboarding checklist for new employee"""
        now = datetime.now(timezone.utc).isoformat()
        
        items = []
        for item in self.ONBOARDING_CHECKLIST:
            items.append({
                "id": str(uuid.uuid4()),
                "hr_profile_id": profile_id,
                "item_code": item["code"],
                "item_name": item["name"],
                "category": item["category"],
                "is_required": item["required"],
                "is_completed": False,
                "created_at": now,
                "updated_at": now,
            })
        
        if items:
            await self.db[HR_COLLECTIONS["onboarding"]].insert_many(items)
    
    async def complete_onboarding_item(
        self,
        profile_id: str,
        item_code: str,
        actor_id: str,
    ) -> Dict[str, Any]:
        """Mark onboarding item as completed"""
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.db[HR_COLLECTIONS["onboarding"]].update_one(
            {"hr_profile_id": profile_id, "item_code": item_code},
            {"$set": {
                "is_completed": True,
                "completed_at": now,
                "completed_by": actor_id,
                "updated_at": now,
            }}
        )
        
        # Check if all required items are completed
        await self._check_onboarding_completion(profile_id)
        
        return {"success": result.modified_count > 0}
    
    async def _check_onboarding_completion(self, profile_id: str):
        """Check if onboarding is complete"""
        # Count required items not completed
        incomplete = await self.db[HR_COLLECTIONS["onboarding"]].count_documents({
            "hr_profile_id": profile_id,
            "is_required": True,
            "is_completed": False,
        })
        
        if incomplete == 0:
            # All required items completed
            now = datetime.now(timezone.utc).isoformat()
            await self.db[HR_COLLECTIONS["profiles"]].update_one(
                {"id": profile_id},
                {"$set": {
                    "onboarding_status": OnboardingStatus.COMPLETED.value,
                    "onboarding_completed_at": now,
                }}
            )
    
    async def _update_onboarding_document(self, profile_id: str, doc_category: str):
        """Update onboarding checklist when document is uploaded"""
        doc_to_checklist = {
            "id_card": "doc_id_card",
            "cv": "doc_cv",
            "photo": "doc_photo",
            "health_check": "doc_health",
            "certificate": "doc_degree",
        }
        
        item_code = doc_to_checklist.get(doc_category)
        if item_code:
            now = datetime.now(timezone.utc).isoformat()
            await self.db[HR_COLLECTIONS["onboarding"]].update_one(
                {"hr_profile_id": profile_id, "item_code": item_code},
                {"$set": {
                    "is_completed": True,
                    "completed_at": now,
                    "completed_by": "system",
                    "updated_at": now,
                }}
            )
            await self._check_onboarding_completion(profile_id)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PROFILE COMPLETENESS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _update_profile_completeness(self, profile_id: str):
        """Calculate and update profile completeness percentage"""
        profile = await self.get_profile(profile_id)
        if not profile:
            return
        
        # Scoring weights
        scores = {
            "basic_info": 0,      # 20 points
            "contact_info": 0,    # 10 points
            "id_info": 0,         # 15 points
            "bank_info": 0,       # 10 points
            "family": 0,          # 10 points
            "education": 0,       # 10 points
            "documents": 0,       # 25 points
        }
        
        # Basic info (20 points)
        basic_fields = ["full_name", "date_of_birth", "gender", "permanent_address"]
        basic_filled = sum(1 for f in basic_fields if profile.get(f))
        scores["basic_info"] = int((basic_filled / len(basic_fields)) * 20)
        
        # Contact info (10 points)
        contact_fields = ["phone", "email_personal"]
        contact_filled = sum(1 for f in contact_fields if profile.get(f))
        scores["contact_info"] = int((contact_filled / len(contact_fields)) * 10)
        
        # ID info (15 points)
        id_fields = ["id_number", "id_issue_date", "id_issue_place"]
        id_filled = sum(1 for f in id_fields if profile.get(f))
        scores["id_info"] = int((id_filled / len(id_fields)) * 15)
        
        # Bank info (10 points)
        bank_fields = ["bank_account", "bank_name"]
        bank_filled = sum(1 for f in bank_fields if profile.get(f))
        scores["bank_info"] = int((bank_filled / len(bank_fields)) * 10)
        
        # Family (10 points)
        family_count = await self.db[HR_COLLECTIONS["family"]].count_documents(
            {"hr_profile_id": profile_id}
        )
        scores["family"] = 10 if family_count > 0 else 0
        
        # Education (10 points)
        edu_count = await self.db[HR_COLLECTIONS["education"]].count_documents(
            {"hr_profile_id": profile_id}
        )
        scores["education"] = 10 if edu_count > 0 else 0
        
        # Documents (25 points)
        missing_docs = []
        for doc_cat in self.REQUIRED_DOCUMENTS:
            doc = await self.db[HR_COLLECTIONS["documents"]].find_one(
                {"hr_profile_id": profile_id, "category": doc_cat.value, "is_latest": True}
            )
            if doc:
                scores["documents"] += 8  # ~8 points per required doc
            else:
                missing_docs.append(doc_cat.value)
        
        scores["documents"] = min(scores["documents"], 25)
        
        # Total completeness
        total = sum(scores.values())
        
        # Update profile
        await self.db[HR_COLLECTIONS["profiles"]].update_one(
            {"id": profile_id},
            {"$set": {
                "profile_completeness": total,
                "missing_documents": missing_docs,
            }}
        )
        
        # Generate alerts for missing documents
        await self._generate_missing_doc_alerts(profile_id, missing_docs)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ALERTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _generate_missing_doc_alerts(
        self,
        profile_id: str,
        missing_docs: List[str],
    ):
        """Generate alerts for missing documents"""
        now = datetime.now(timezone.utc).isoformat()
        
        doc_names = {
            "id_card": "CCCD/CMND",
            "cv": "Sơ yếu lý lịch",
            "photo": "Ảnh chân dung",
        }
        
        for doc in missing_docs:
            # Check if alert already exists
            existing = await self.db[HR_COLLECTIONS["alerts"]].find_one({
                "hr_profile_id": profile_id,
                "alert_type": "missing_document",
                "is_resolved": False,
                "metadata.category": doc,
            })
            
            if not existing:
                await self.db[HR_COLLECTIONS["alerts"]].insert_one({
                    "id": str(uuid.uuid4()),
                    "hr_profile_id": profile_id,
                    "alert_type": "missing_document",
                    "title": f"Thiếu {doc_names.get(doc, doc)}",
                    "description": f"Nhân viên chưa nộp {doc_names.get(doc, doc)}",
                    "severity": "high" if doc == "id_card" else "medium",
                    "metadata": {"category": doc},
                    "is_resolved": False,
                    "created_at": now,
                    "updated_at": now,
                })
    
    async def get_hr_dashboard_stats(self) -> Dict[str, Any]:
        """Get HR Dashboard statistics"""
        now = datetime.now(timezone.utc)
        month_ago = (now - timedelta(days=30)).isoformat()
        
        # Total employees
        total = await self.db[HR_COLLECTIONS["profiles"]].count_documents(
            {"is_active": True}
        )
        
        # New employees (last 30 days)
        new_employees = await self.db[HR_COLLECTIONS["profiles"]].count_documents(
            {"is_active": True, "created_at": {"$gte": month_ago}}
        )
        
        # By status
        by_status = {}
        for status in EmploymentStatus:
            count = await self.db[HR_COLLECTIONS["profiles"]].count_documents(
                {"is_active": True, "employment_status": status.value}
            )
            by_status[status.value] = count
        
        # Incomplete profiles
        incomplete = await self.db[HR_COLLECTIONS["profiles"]].count_documents(
            {"is_active": True, "profile_completeness": {"$lt": 70}}
        )
        
        # Pending onboarding
        pending_onboarding = await self.db[HR_COLLECTIONS["profiles"]].count_documents(
            {"is_active": True, "onboarding_status": {"$ne": OnboardingStatus.COMPLETED.value}}
        )
        
        # Expiring contracts (next 30 days)
        next_month = (now + timedelta(days=30)).isoformat()
        expiring_contracts = await self.db[HR_COLLECTIONS["contracts"]].count_documents({
            "status": "active",
            "end_date": {"$lte": next_month, "$gte": now.isoformat()},
        })
        
        # Active alerts
        active_alerts = await self.db[HR_COLLECTIONS["alerts"]].count_documents(
            {"is_resolved": False}
        )
        
        return {
            "total_employees": total,
            "new_employees": new_employees,
            "by_status": by_status,
            "incomplete_profiles": incomplete,
            "pending_onboarding": pending_onboarding,
            "expiring_contracts": expiring_contracts,
            "active_alerts": active_alerts,
        }
