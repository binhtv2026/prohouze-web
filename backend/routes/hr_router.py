"""
ProHouzing HR Router
API Endpoints for HR Profile 360°

Features:
- Full CRUD for HR profiles and all related entities
- Document upload with version control
- 360° profile view
- Dashboard stats
- Search & filter
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorDatabase

from models.hr_models import (
    HRProfile, HRProfileCreate, HRProfileUpdate,
    FamilyMemberCreate,
    EducationCreate,
    WorkHistoryCreate,
    CertificateCreate,
    HRDocumentCreate,
    RewardDisciplineCreate,
    DocumentCategory,
    EmploymentStatus,
)
from services.hr_service import HRService
from services.storage_service import get_storage_service

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hr", tags=["HR Profile 360°"])


# ═══════════════════════════════════════════════════════════════════════════════
# DEPENDENCIES
# ═══════════════════════════════════════════════════════════════════════════════

async def get_hr_service(db=None) -> HRService:
    """Get HR Service instance - will be overridden at mount time"""
    raise HTTPException(status_code=500, detail="HR Service not configured")


def configure_hr_router(db: AsyncIOMotorDatabase, get_current_user):
    """Configure the router with dependencies"""
    
    hr_service = HRService(db)
    storage = get_storage_service()
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HR PROFILE ENDPOINTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles", response_model=Dict[str, Any])
    async def create_profile(
        data: HRProfileCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Create new HR Profile"""
        # Check permission (HR or Admin)
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await hr_service.create_profile(data, current_user["id"])
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    
    @router.get("/profiles", response_model=List[Dict[str, Any]])
    async def list_profiles(
        search: Optional[str] = None,
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
        current_user: dict = Depends(get_current_user)
    ):
        """List HR Profiles with filters"""
        profiles = await hr_service.list_profiles(
            skip=skip,
            limit=limit,
            search=search,
            status=status,
            team_id=team_id,
        )
        return profiles
    
    @router.get("/profiles/{profile_id}", response_model=Dict[str, Any])
    async def get_profile(
        profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get HR Profile by ID"""
        profile = await hr_service.get_profile(profile_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    
    @router.get("/profiles/user/{user_id}", response_model=Dict[str, Any])
    async def get_profile_by_user(
        user_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get HR Profile by User ID"""
        profile = await hr_service.get_profile_by_user(user_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    
    @router.get("/profiles/{profile_id}/360", response_model=Dict[str, Any])
    async def get_profile_360(
        profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get FULL 360° view of HR Profile"""
        data = await hr_service.get_profile_360(profile_id)
        if not data:
            raise HTTPException(status_code=404, detail="Profile not found")
        return data
    
    @router.put("/profiles/{profile_id}", response_model=Dict[str, Any])
    async def update_profile(
        profile_id: str,
        data: HRProfileUpdate,
        current_user: dict = Depends(get_current_user)
    ):
        """Update HR Profile"""
        result = await hr_service.update_profile(profile_id, data, current_user["id"])
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # FAMILY MEMBERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/family", response_model=Dict[str, Any])
    async def add_family_member(
        profile_id: str,
        data: FamilyMemberCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Add family member to profile"""
        result = await hr_service.add_family_member(profile_id, data, current_user["id"])
        return result
    
    @router.put("/family/{member_id}", response_model=Dict[str, Any])
    async def update_family_member(
        member_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Update family member"""
        result = await hr_service.update_family_member(member_id, data, current_user["id"])
        return result
    
    @router.delete("/family/{member_id}", response_model=Dict[str, Any])
    async def delete_family_member(
        member_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Delete family member"""
        result = await hr_service.delete_family_member(member_id, current_user["id"])
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # EDUCATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/education", response_model=Dict[str, Any])
    async def add_education(
        profile_id: str,
        data: EducationCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Add education record"""
        result = await hr_service.add_education(profile_id, data, current_user["id"])
        return result
    
    @router.put("/education/{education_id}", response_model=Dict[str, Any])
    async def update_education(
        education_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Update education record"""
        now = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = now
        
        await db.hr_education.update_one(
            {"id": education_id},
            {"$set": data}
        )
        return {"success": True}
    
    @router.delete("/education/{education_id}", response_model=Dict[str, Any])
    async def delete_education(
        education_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Delete education record"""
        await db.hr_education.delete_one({"id": education_id})
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # WORK HISTORY
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/work-history", response_model=Dict[str, Any])
    async def add_work_history(
        profile_id: str,
        data: WorkHistoryCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Add work history record"""
        result = await hr_service.add_work_history(profile_id, data, current_user["id"])
        return result
    
    @router.put("/work-history/{history_id}", response_model=Dict[str, Any])
    async def update_work_history(
        history_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Update work history record"""
        now = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = now
        
        await db.hr_work_history.update_one(
            {"id": history_id},
            {"$set": data}
        )
        return {"success": True}
    
    @router.delete("/work-history/{history_id}", response_model=Dict[str, Any])
    async def delete_work_history(
        history_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Delete work history record"""
        await db.hr_work_history.delete_one({"id": history_id})
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CERTIFICATES
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/certificates", response_model=Dict[str, Any])
    async def add_certificate(
        profile_id: str,
        data: CertificateCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Add certificate"""
        result = await hr_service.add_certificate(profile_id, data, current_user["id"])
        return result
    
    @router.put("/certificates/{certificate_id}", response_model=Dict[str, Any])
    async def update_certificate(
        certificate_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Update certificate"""
        now = datetime.now(timezone.utc).isoformat()
        data["updated_at"] = now
        
        await db.hr_certificates.update_one(
            {"id": certificate_id},
            {"$set": data}
        )
        return {"success": True}
    
    @router.put("/certificates/{certificate_id}/verify", response_model=Dict[str, Any])
    async def verify_certificate(
        certificate_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Verify certificate (HR/Admin only)"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        now = datetime.now(timezone.utc).isoformat()
        await db.hr_certificates.update_one(
            {"id": certificate_id},
            {"$set": {
                "is_verified": True,
                "verified_by": current_user["id"],
                "verified_at": now,
                "updated_at": now,
            }}
        )
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DOCUMENTS (with version control)
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/documents", response_model=Dict[str, Any])
    async def upload_document(
        profile_id: str,
        file: UploadFile = File(...),
        name: str = Form(...),
        category: str = Form(...),
        description: Optional[str] = Form(None),
        issue_date: Optional[str] = Form(None),
        expiry_date: Optional[str] = Form(None),
        notes: Optional[str] = Form(None),
        current_user: dict = Depends(get_current_user)
    ):
        """Upload document with version control"""
        try:
            # Validate category
            try:
                doc_category = DocumentCategory(category)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid category: {category}")
            
            # Read file content
            file_content = await file.read()
            
            # Check file size (max 10MB)
            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File too large (max 10MB)")
            
            # Get current version
            existing = await db.hr_documents.find_one(
                {"hr_profile_id": profile_id, "category": category, "is_latest": True},
                {"_id": 0, "version": 1}
            )
            version = (existing.get("version", 0) + 1) if existing else 1
            
            # Save file
            file_info = await storage.save_file(
                file_content=file_content,
                original_filename=file.filename,
                category=category,
                hr_profile_id=profile_id,
                version=version,
            )
            
            # Create metadata
            metadata = HRDocumentCreate(
                name=name,
                category=doc_category,
                description=description,
                issue_date=issue_date,
                expiry_date=expiry_date,
                notes=notes,
            )
            
            # Add to database
            result = await hr_service.add_document(
                profile_id=profile_id,
                file_info=file_info,
                metadata=metadata,
                actor_id=current_user["id"],
            )
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Document upload error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/profiles/{profile_id}/documents", response_model=List[Dict[str, Any]])
    async def get_profile_documents(
        profile_id: str,
        category: Optional[str] = None,
        latest_only: bool = True,
        current_user: dict = Depends(get_current_user)
    ):
        """Get profile documents"""
        query = {"hr_profile_id": profile_id}
        if category:
            query["category"] = category
        if latest_only:
            query["is_latest"] = True
        
        docs = await db.hr_documents.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        return docs
    
    @router.get("/documents/versions", response_model=List[Dict[str, Any]])
    async def get_document_versions(
        profile_id: str = Query(...),
        category: str = Query(...),
        current_user: dict = Depends(get_current_user)
    ):
        """Get all versions of a document category"""
        versions = await hr_service.get_document_versions(profile_id, category)
        return versions
    
    @router.get("/documents/download/{filename}")
    async def download_document(
        filename: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Download document by filename"""
        from fastapi.responses import FileResponse
        import os
        
        # Find file in storage directories
        base_path = str((Path(__file__).resolve().parent.parent / "uploads" / "hr_documents"))
        for category_dir in os.listdir(base_path):
            file_path = os.path.join(base_path, category_dir, filename)
            if os.path.exists(file_path):
                return FileResponse(
                    file_path,
                    filename=filename,
                    media_type="application/octet-stream"
                )
        
        raise HTTPException(status_code=404, detail="File not found")
    
    @router.put("/documents/{document_id}/verify", response_model=Dict[str, Any])
    async def verify_document(
        document_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Verify document (HR/Admin only)"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        now = datetime.now(timezone.utc).isoformat()
        await db.hr_documents.update_one(
            {"id": document_id},
            {"$set": {
                "is_verified": True,
                "verified_by": current_user["id"],
                "verified_at": now,
                "updated_at": now,
            }}
        )
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # REWARDS & DISCIPLINE
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/profiles/{profile_id}/rewards", response_model=Dict[str, Any])
    async def add_reward_discipline(
        profile_id: str,
        data: RewardDisciplineCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Add reward or discipline record"""
        # Only managers can add rewards/discipline
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await hr_service.add_reward_discipline(profile_id, data, current_user["id"])
        return result
    
    @router.get("/profiles/{profile_id}/rewards", response_model=List[Dict[str, Any]])
    async def get_profile_rewards(
        profile_id: str,
        type: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Get profile rewards and discipline records"""
        query = {"hr_profile_id": profile_id}
        if type:
            query["type"] = type
        
        records = await db.hr_rewards_discipline.find(
            query,
            {"_id": 0}
        ).sort("effective_date", -1).to_list(50)
        return records
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INTERNAL WORK HISTORY (at ProHouzing)
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/profiles/{profile_id}/internal-history", response_model=List[Dict[str, Any]])
    async def get_internal_history(
        profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get internal work history at ProHouzing"""
        records = await db.hr_internal_history.find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(20)
        return records
    
    @router.post("/profiles/{profile_id}/internal-history", response_model=Dict[str, Any])
    async def add_internal_history(
        profile_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Add internal work history record (position change, transfer, etc.)"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        import uuid
        now = datetime.now(timezone.utc).isoformat()
        
        # Close current position if exists
        await db.hr_internal_history.update_many(
            {"hr_profile_id": profile_id, "is_current": True},
            {"$set": {"is_current": False, "end_date": data.get("start_date", now)}}
        )
        
        record = {
            "id": str(uuid.uuid4()),
            "hr_profile_id": profile_id,
            "team_id": data.get("team_id"),
            "team_name": data.get("team_name"),
            "position": data.get("position"),
            "leader_id": data.get("leader_id"),
            "leader_name": data.get("leader_name"),
            "start_date": data.get("start_date", now),
            "end_date": None,
            "is_current": True,
            "change_type": data.get("change_type", "transfer"),
            "change_reason": data.get("change_reason"),
            "approved_by": current_user["id"],
            "notes": data.get("notes"),
            "created_at": now,
            "updated_at": now,
        }
        
        await db.hr_internal_history.insert_one(record)
        
        # Update profile current position
        await db.hr_profiles.update_one(
            {"id": profile_id},
            {"$set": {
                "current_team_id": data.get("team_id"),
                "current_position": data.get("position"),
                "current_leader_id": data.get("leader_id"),
                "updated_at": now,
            }}
        )
        
        return {"success": True, "data": {"id": record["id"]}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CONTRACTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/profiles/{profile_id}/contracts", response_model=List[Dict[str, Any]])
    async def get_profile_contracts(
        profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get employment contracts"""
        contracts = await db.hr_contracts.find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).sort("start_date", -1).to_list(10)
        return contracts
    
    @router.post("/profiles/{profile_id}/contracts", response_model=Dict[str, Any])
    async def add_contract(
        profile_id: str,
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Add employment contract"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        import uuid
        now = datetime.now(timezone.utc).isoformat()
        
        # Generate contract number
        count = await db.hr_contracts.count_documents({})
        contract_number = f"HD-{datetime.now().strftime('%Y%m')}-{str(count + 1).zfill(4)}"
        
        contract = {
            "id": str(uuid.uuid4()),
            "hr_profile_id": profile_id,
            "contract_number": contract_number,
            "contract_type": data.get("contract_type", "probation"),
            "start_date": data.get("start_date"),
            "end_date": data.get("end_date"),
            "position": data.get("position"),
            "department": data.get("department"),
            "base_salary": data.get("base_salary"),
            "signed_date": data.get("signed_date"),
            "signed_by_employee": False,
            "signed_by_company": False,
            "status": "draft",
            "notes": data.get("notes"),
            "created_at": now,
            "updated_at": now,
        }
        
        await db.hr_contracts.insert_one(contract)
        
        return {"success": True, "data": {"id": contract["id"], "contract_number": contract_number}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # KPI RECORDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/profiles/{profile_id}/kpi", response_model=List[Dict[str, Any]])
    async def get_profile_kpi(
        profile_id: str,
        year: Optional[int] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Get KPI records"""
        query = {"hr_profile_id": profile_id}
        if year:
            query["period_year"] = year
        
        kpi = await db.hr_kpi_records.find(
            query,
            {"_id": 0}
        ).sort([("period_year", -1), ("period_month", -1)]).to_list(24)
        return kpi
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ONBOARDING CHECKLIST
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/profiles/{profile_id}/onboarding", response_model=List[Dict[str, Any]])
    async def get_onboarding_checklist(
        profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get onboarding checklist"""
        items = await db.hr_onboarding_checklist.find(
            {"hr_profile_id": profile_id},
            {"_id": 0}
        ).to_list(20)
        return items
    
    @router.put("/onboarding/{item_id}/complete", response_model=Dict[str, Any])
    async def complete_onboarding_item(
        item_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Complete onboarding item"""
        item = await db.hr_onboarding_checklist.find_one({"id": item_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        result = await hr_service.complete_onboarding_item(
            item["hr_profile_id"],
            item["item_code"],
            current_user["id"]
        )
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ALERTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/alerts", response_model=List[Dict[str, Any]])
    async def get_hr_alerts(
        resolved: bool = False,
        severity: Optional[str] = None,
        limit: int = 50,
        current_user: dict = Depends(get_current_user)
    ):
        """Get HR alerts"""
        query = {"is_resolved": resolved}
        if severity:
            query["severity"] = severity
        
        alerts = await db.hr_alerts.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Enrich with profile info
        for alert in alerts:
            profile = await db.hr_profiles.find_one(
                {"id": alert.get("hr_profile_id")},
                {"_id": 0, "full_name": 1, "employee_code": 1}
            )
            if profile:
                alert["employee_name"] = profile.get("full_name")
                alert["employee_code"] = profile.get("employee_code")
        
        return alerts
    
    @router.put("/alerts/{alert_id}/resolve", response_model=Dict[str, Any])
    async def resolve_alert(
        alert_id: str,
        notes: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Resolve HR alert"""
        now = datetime.now(timezone.utc).isoformat()
        await db.hr_alerts.update_one(
            {"id": alert_id},
            {"$set": {
                "is_resolved": True,
                "resolved_at": now,
                "resolved_by": current_user["id"],
                "resolution_notes": notes,
                "updated_at": now,
            }}
        )
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/dashboard", response_model=Dict[str, Any])
    async def get_hr_dashboard(
        current_user: dict = Depends(get_current_user)
    ):
        """Get HR Dashboard statistics"""
        stats = await hr_service.get_hr_dashboard_stats()
        return stats
    
    @router.get("/dashboard/recent-employees", response_model=List[Dict[str, Any]])
    async def get_recent_employees(
        limit: int = 10,
        current_user: dict = Depends(get_current_user)
    ):
        """Get recently joined employees"""
        employees = await db.hr_profiles.find(
            {"is_active": True},
            {"_id": 0, "id": 1, "employee_code": 1, "full_name": 1, "avatar_url": 1, 
             "current_position": 1, "employment_status": 1, "created_at": 1, "join_date": 1}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return employees
    
    @router.get("/dashboard/incomplete-profiles", response_model=List[Dict[str, Any]])
    async def get_incomplete_profiles(
        limit: int = 10,
        current_user: dict = Depends(get_current_user)
    ):
        """Get profiles with incomplete information"""
        profiles = await db.hr_profiles.find(
            {"is_active": True, "profile_completeness": {"$lt": 70}},
            {"_id": 0, "id": 1, "employee_code": 1, "full_name": 1, "avatar_url": 1,
             "profile_completeness": 1, "missing_documents": 1}
        ).sort("profile_completeness", 1).limit(limit).to_list(limit)
        return profiles
    
    @router.get("/dashboard/expiring-contracts", response_model=List[Dict[str, Any]])
    async def get_expiring_contracts(
        days: int = 30,
        current_user: dict = Depends(get_current_user)
    ):
        """Get contracts expiring within N days"""
        from datetime import timedelta
        
        now = datetime.now(timezone.utc)
        future = (now + timedelta(days=days)).isoformat()
        
        contracts = await db.hr_contracts.find(
            {
                "status": "active",
                "end_date": {"$lte": future, "$gte": now.isoformat()}
            },
            {"_id": 0}
        ).sort("end_date", 1).limit(20).to_list(20)
        
        # Enrich with profile info
        for contract in contracts:
            profile = await db.hr_profiles.find_one(
                {"id": contract.get("hr_profile_id")},
                {"_id": 0, "full_name": 1, "employee_code": 1}
            )
            if profile:
                contract["employee_name"] = profile.get("full_name")
                contract["employee_code"] = profile.get("employee_code")
        
        return contracts
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SEARCH
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/search", response_model=List[Dict[str, Any]])
    async def search_employees(
        q: str = Query(..., min_length=1),
        status: Optional[str] = None,
        team_id: Optional[str] = None,
        limit: int = 20,
        current_user: dict = Depends(get_current_user)
    ):
        """Quick search employees"""
        profiles = await hr_service.list_profiles(
            search=q,
            status=status,
            team_id=team_id,
            limit=limit,
        )
        return profiles
    
    return router


# Export
__all__ = ["router", "configure_hr_router"]
