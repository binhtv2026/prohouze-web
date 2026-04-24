"""
ProHouzing Payroll Router
=========================
API endpoints for Payroll & Workforce Management

Features:
- Attendance (check-in/out)
- Leave management
- Payroll calculation
- Strict access control
- Full audit trail
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from models.payroll_models import (
    PayrollStatus, AttendanceStatus, LeaveType, LeaveStatus,
    WorkShiftCreate, AttendanceCheckIn, AttendanceCheckOut, AttendanceAdjustment,
    LeaveRequestCreate, SalaryStructureCreate,
    PayrollCalculationRequest, PayrollApprovalRequest, PayrollPaymentRequest,
)
from services.payroll_service import PayrollService

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payroll", tags=["Payroll & Workforce"])


def configure_payroll_router(db: AsyncIOMotorDatabase, get_current_user):
    """Configure the router with dependencies"""
    
    payroll_service = PayrollService(db)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # WORK SHIFTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/shifts", response_model=List[Dict[str, Any]])
    async def get_shifts(
        active_only: bool = True,
        current_user: dict = Depends(get_current_user)
    ):
        """Get all work shifts"""
        shifts = await payroll_service.get_shifts(active_only)
        return shifts
    
    @router.post("/shifts", response_model=Dict[str, Any])
    async def create_shift(
        data: WorkShiftCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Create new work shift (admin only)"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        import uuid
        now = datetime.now(timezone.utc).isoformat()
        
        shift = {
            "id": str(uuid.uuid4()),
            **data.dict(),
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        
        await db.work_shifts.insert_one(shift)
        return {"success": True, "data": {"id": shift["id"]}}
    
    @router.post("/shifts/init-defaults")
    async def init_default_shifts(
        current_user: dict = Depends(get_current_user)
    ):
        """Initialize default work shifts"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        await payroll_service.create_default_shifts()
        return {"success": True, "message": "Default shifts created"}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ATTENDANCE
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/attendance/check-in", response_model=Dict[str, Any])
    async def attendance_check_in(
        request: Request,
        data: AttendanceCheckIn = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Employee check-in"""
        # Get HR profile ID for current user
        profile = await db.hr_profiles.find_one(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="HR Profile not found")
        
        # Get IP from request
        ip = request.client.host if request.client else None
        
        result = await payroll_service.check_in(
            hr_profile_id=profile["id"],
            device=data.device if data else None,
            ip=ip,
            location=data.location if data else None,
            photo=data.photo if data else None,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.post("/attendance/check-out", response_model=Dict[str, Any])
    async def attendance_check_out(
        request: Request,
        data: AttendanceCheckOut = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Employee check-out"""
        profile = await db.hr_profiles.find_one(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="HR Profile not found")
        
        ip = request.client.host if request.client else None
        
        result = await payroll_service.check_out(
            hr_profile_id=profile["id"],
            device=data.device if data else None,
            ip=ip,
            location=data.location if data else None,
            photo=data.photo if data else None,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.get("/attendance/today", response_model=Dict[str, Any])
    async def get_today_attendance(
        current_user: dict = Depends(get_current_user)
    ):
        """Get today's attendance for current user"""
        profile = await db.hr_profiles.find_one(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="HR Profile not found")
        
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        record = await db.attendance_records.find_one(
            {"hr_profile_id": profile["id"], "date": today},
            {"_id": 0}
        )
        
        return {"data": record}
    
    @router.get("/attendance/records", response_model=List[Dict[str, Any]])
    async def get_attendance_records(
        hr_profile_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user)
    ):
        """Get attendance records"""
        # If not admin/hr, only get own records
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            profile = await db.hr_profiles.find_one(
                {"user_id": current_user["id"]},
                {"_id": 0, "id": 1}
            )
            hr_profile_id = profile["id"] if profile else "none"
        
        records = await payroll_service.get_attendance_records(
            hr_profile_id=hr_profile_id,
            start_date=start_date,
            end_date=end_date,
            status=status,
            limit=limit,
        )
        return records
    
    @router.get("/attendance/summary/{hr_profile_id}/{period}", response_model=Dict[str, Any])
    async def get_attendance_summary(
        hr_profile_id: str,
        period: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get monthly attendance summary"""
        # Check access
        if current_user.get("role") not in ["admin", "bod", "manager", "accountant"]:
            profile = await db.hr_profiles.find_one(
                {"user_id": current_user["id"]},
                {"_id": 0, "id": 1}
            )
            if not profile or profile["id"] != hr_profile_id:
                raise HTTPException(status_code=403, detail="Permission denied")
        
        summary = await payroll_service.calculate_attendance_summary(hr_profile_id, period)
        return {"data": summary}
    
    @router.get("/attendance/summaries", response_model=Dict[str, Any])
    async def get_all_attendance_summaries(
        period: str = Query(..., description="Period in YYYY-MM format"),
        current_user: dict = Depends(get_current_user)
    ):
        """Get monthly attendance summaries for ALL employees (Admin/HR)"""
        if current_user.get("role") not in ["admin", "bod", "manager", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied - Admin/HR only")
        
        # Get all active employees
        profiles = await db.hr_profiles.find(
            {"is_active": True},
            {"_id": 0, "id": 1, "employee_code": 1, "full_name": 1}
        ).to_list(1000)
        
        summaries = []
        totals = {
            "total_employees": len(profiles),
            "total_work_days": 0,
            "total_overtime_hours": 0,
            "total_leave_days": 0,
            "total_late_days": 0,
            "total_anomalies": 0,
        }
        
        for profile in profiles:
            try:
                summary = await payroll_service.calculate_attendance_summary(profile["id"], period)
                summary["standard_work_days"] = 22  # TODO: from config
                summaries.append(summary)
                
                # Aggregate totals
                totals["total_work_days"] += summary.get("present_days", 0) + summary.get("half_days", 0) * 0.5
                totals["total_overtime_hours"] += summary.get("total_overtime_hours", 0)
                totals["total_leave_days"] += summary.get("leave_days", 0)
                totals["total_late_days"] += summary.get("late_days", 0)
                totals["total_anomalies"] += summary.get("anomaly_count", 0)
            except Exception as e:
                logger.error(f"Error calculating summary for {profile['id']}: {e}")
        
        return {
            "period": period,
            "summaries": summaries,
            "totals": totals,
        }
    
    @router.post("/attendance/summaries/refresh", response_model=Dict[str, Any])
    async def refresh_attendance_summaries(
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Recalculate and store attendance summaries for period (Admin/HR)"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        period = data.get("period")
        if not period:
            raise HTTPException(status_code=400, detail="Period is required")
        
        # Get all active employees
        profiles = await db.hr_profiles.find(
            {"is_active": True},
            {"_id": 0, "id": 1}
        ).to_list(1000)
        
        processed = 0
        for profile in profiles:
            try:
                summary = await payroll_service.calculate_attendance_summary(profile["id"], period)
                # Store summary
                await db.attendance_summaries.update_one(
                    {"hr_profile_id": profile["id"], "period": period},
                    {"$set": summary},
                    upsert=True
                )
                processed += 1
            except Exception as e:
                logger.error(f"Error refreshing summary for {profile['id']}: {e}")
        
        return {
            "success": True,
            "period": period,
            "processed": processed,
        }
    
    @router.put("/attendance/{record_id}/adjust", response_model=Dict[str, Any])
    async def adjust_attendance(
        record_id: str,
        data: AttendanceAdjustment,
        current_user: dict = Depends(get_current_user)
    ):
        """Adjust attendance record (admin/HR only)"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {
            "is_adjusted": True,
            "adjusted_by": current_user["id"],
            "adjusted_at": now,
            "adjustment_reason": data.reason,
            "updated_at": now,
        }
        
        if data.check_in_time:
            update_data["check_in_time"] = data.check_in_time
        if data.check_out_time:
            update_data["check_out_time"] = data.check_out_time
        if data.status:
            update_data["status"] = data.status.value
        
        result = await db.attendance_records.update_one(
            {"id": record_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEAVE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/leave/request", response_model=Dict[str, Any])
    async def create_leave_request(
        data: LeaveRequestCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Create leave request"""
        profile = await db.hr_profiles.find_one(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="HR Profile not found")
        
        result = await payroll_service.create_leave_request(
            hr_profile_id=profile["id"],
            data=data.dict(),
            actor_id=current_user["id"],
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.get("/leave/requests", response_model=List[Dict[str, Any]])
    async def get_leave_requests(
        hr_profile_id: Optional[str] = None,
        status: Optional[str] = None,
        pending_only: bool = False,
        limit: int = 50,
        current_user: dict = Depends(get_current_user)
    ):
        """Get leave requests"""
        query = {}
        
        # Filter by user unless admin/manager
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            profile = await db.hr_profiles.find_one(
                {"user_id": current_user["id"]},
                {"_id": 0, "id": 1}
            )
            query["hr_profile_id"] = profile["id"] if profile else "none"
        elif hr_profile_id:
            query["hr_profile_id"] = hr_profile_id
        
        if pending_only:
            query["status"] = LeaveStatus.PENDING.value
        elif status:
            query["status"] = status
        
        requests = await db.leave_requests.find(
            query, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return requests
    
    @router.put("/leave/requests/{request_id}/approve", response_model=Dict[str, Any])
    async def approve_leave_request(
        request_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Approve leave request"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await payroll_service.approve_leave_request(
            request_id=request_id,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.put("/leave/requests/{request_id}/reject", response_model=Dict[str, Any])
    async def reject_leave_request(
        request_id: str,
        reason: str = Query(...),
        current_user: dict = Depends(get_current_user)
    ):
        """Reject leave request"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await payroll_service.reject_leave_request(
            request_id=request_id,
            actor_id=current_user["id"],
            reason=reason,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.get("/leave/balance", response_model=List[Dict[str, Any]])
    async def get_leave_balance(
        year: int = Query(default=None),
        current_user: dict = Depends(get_current_user)
    ):
        """Get leave balance for current user"""
        profile = await db.hr_profiles.find_one(
            {"user_id": current_user["id"]},
            {"_id": 0, "id": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="HR Profile not found")
        
        if not year:
            year = datetime.now().year
        
        balances = await db.leave_balances.find(
            {"hr_profile_id": profile["id"], "year": year},
            {"_id": 0}
        ).to_list(20)
        
        return balances
    
    @router.post("/leave/balance/init", response_model=Dict[str, Any])
    async def initialize_leave_balance(
        hr_profile_id: str,
        year: int,
        current_user: dict = Depends(get_current_user)
    ):
        """Initialize leave balance for employee"""
        if current_user.get("role") not in ["admin", "bod", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        profile = await db.hr_profiles.find_one(
            {"id": hr_profile_id},
            {"_id": 0, "employment_status": 1}
        )
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        await payroll_service.initialize_leave_balance(
            hr_profile_id=hr_profile_id,
            year=year,
            employment_status=profile.get("employment_status", "probation"),
        )
        
        return {"success": True}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SALARY STRUCTURE
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/salary-structure", response_model=Dict[str, Any])
    async def create_salary_structure(
        data: SalaryStructureCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Create salary structure for employee"""
        if current_user.get("role") not in ["admin", "bod", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await payroll_service.create_salary_structure(
            data=data.dict(),
            actor_id=current_user["id"],
        )
        
        return result
    
    @router.get("/salary-structure/{hr_profile_id}", response_model=Dict[str, Any])
    async def get_salary_structure(
        hr_profile_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get salary structure for employee"""
        # Check access
        access = await payroll_service.check_salary_access(
            actor_id=current_user["id"],
            actor_role=current_user.get("role"),
            target_profile_id=hr_profile_id,
        )
        
        if not access.get("allowed"):
            raise HTTPException(status_code=403, detail="Permission denied")
        
        structure = await payroll_service.get_current_salary_structure(hr_profile_id)
        if not structure:
            raise HTTPException(status_code=404, detail="No salary structure found")
        
        return {"data": structure}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.post("/calculate", response_model=Dict[str, Any])
    async def calculate_payroll(
        data: PayrollCalculationRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Calculate payroll for a period"""
        if current_user.get("role") not in ["admin", "bod", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        result = await payroll_service.calculate_payroll(
            period=data.period,
            hr_profile_ids=data.hr_profile_ids,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
        )
        
        return result
    
    @router.post("/approve", response_model=Dict[str, Any])
    async def approve_payroll(
        data: PayrollApprovalRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Approve calculated payrolls"""
        result = await payroll_service.approve_payroll(
            payroll_ids=data.payroll_ids,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
            actor_role=current_user.get("role", ""),
            notes=data.notes,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.post("/pay", response_model=Dict[str, Any])
    async def mark_payroll_paid(
        data: PayrollPaymentRequest,
        current_user: dict = Depends(get_current_user)
    ):
        """Mark payrolls as paid"""
        result = await payroll_service.mark_payroll_paid(
            payroll_ids=data.payroll_ids,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
            actor_role=current_user.get("role", ""),
            payment_reference=data.payment_reference,
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.post("/lock/{period}", response_model=Dict[str, Any])
    async def lock_payroll(
        period: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Lock payroll for a period"""
        result = await payroll_service.lock_payroll(
            period=period,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
            actor_role=current_user.get("role", ""),
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=400, detail=result.get("error"))
        
        return result
    
    @router.get("/my-payrolls", response_model=List[Dict[str, Any]])
    async def get_my_payrolls(
        limit: int = 12,
        current_user: dict = Depends(get_current_user)
    ):
        """Get payrolls for current user"""
        payrolls = await payroll_service.get_my_payrolls(
            user_id=current_user["id"],
            limit=limit,
        )
        return payrolls
    
    @router.get("/payroll/{payroll_id}", response_model=Dict[str, Any])
    async def get_payroll(
        payroll_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get single payroll"""
        payroll = await payroll_service.get_payroll(
            payroll_id=payroll_id,
            actor_id=current_user["id"],
            actor_name=current_user.get("name", ""),
            actor_role=current_user.get("role", ""),
        )
        
        if not payroll:
            raise HTTPException(status_code=404, detail="Payroll not found or access denied")
        
        return {"data": payroll}
    
    @router.get("/payrolls/{period}", response_model=List[Dict[str, Any]])
    async def get_payrolls_for_period(
        period: str,
        status: Optional[str] = None,
        current_user: dict = Depends(get_current_user)
    ):
        """Get all payrolls for a period (admin only)"""
        payrolls = await payroll_service.get_payrolls_for_period(
            period=period,
            status=status,
            actor_role=current_user.get("role"),
        )
        return payrolls
    
    @router.get("/summary/{period}", response_model=Dict[str, Any])
    async def get_payroll_summary(
        period: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get payroll summary for a period"""
        if current_user.get("role") not in ["admin", "bod", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        summary = await payroll_service.get_payroll_summary(period)
        return {"data": summary}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUDIT LOGS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/audit-logs", response_model=List[Dict[str, Any]])
    async def get_payroll_audit_logs(
        action: Optional[str] = None,
        period: Optional[str] = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user)
    ):
        """Get payroll audit logs (admin only)"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        query = {}
        if action:
            query["action"] = action
        if period:
            query["period"] = period
        
        logs = await db.payroll_audit_logs.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    @router.get("/salary-view-logs", response_model=List[Dict[str, Any]])
    async def get_salary_view_logs(
        suspicious_only: bool = False,
        limit: int = 100,
        current_user: dict = Depends(get_current_user)
    ):
        """Get salary view logs (admin only)"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        query = {}
        if suspicious_only:
            query["view_type"] = "other"
        
        logs = await db.salary_view_logs.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    # ═══════════════════════════════════════════════════════════════════════════
    # DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/dashboard", response_model=Dict[str, Any])
    async def get_payroll_dashboard(
        current_user: dict = Depends(get_current_user)
    ):
        """Get payroll dashboard data"""
        if current_user.get("role") not in ["admin", "bod", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        now = datetime.now(timezone.utc)
        current_period = now.strftime("%Y-%m")
        
        # Get summary for current period
        summary = await payroll_service.get_payroll_summary(current_period)
        
        # Get pending leave requests
        pending_leaves = await db.leave_requests.count_documents(
            {"status": LeaveStatus.PENDING.value}
        )
        
        # Get today's attendance stats
        today = now.strftime("%Y-%m-%d")
        total_employees = await db.hr_profiles.count_documents({"is_active": True})
        checked_in_today = await db.attendance_records.count_documents(
            {"date": today, "check_in_time": {"$ne": None}}
        )
        
        # Get anomalies
        anomaly_count = await db.attendance_records.count_documents(
            {"date": today, "anomaly_detected": True}
        )
        
        return {
            "current_period": current_period,
            "payroll_summary": summary,
            "pending_leave_requests": pending_leaves,
            "today_attendance": {
                "total_employees": total_employees,
                "checked_in": checked_in_today,
                "not_checked_in": total_employees - checked_in_today,
                "anomalies": anomaly_count,
            },
        }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL RULES CONFIG
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/rules", response_model=Dict[str, Any])
    async def get_payroll_rules(
        current_user: dict = Depends(get_current_user)
    ):
        """Get payroll rules configuration (HR only)"""
        if current_user.get("role") not in ["admin", "bod", "accountant", "manager"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        # Get rules from database or return defaults
        rules = await db.payroll_rules.find_one({"is_active": True}, {"_id": 0})
        
        if not rules:
            # Return default rules
            rules = {
                "id": "default",
                "is_active": True,
                # Insurance rates
                "insurance": {
                    "social_rate": 0.08,  # BHXH 8%
                    "health_rate": 0.015,  # BHYT 1.5%
                    "unemployment_rate": 0.01,  # BHTN 1%
                    "insurance_cap": 36000000,  # Cap 20x minimum wage
                },
                # Tax brackets
                "tax_brackets": [
                    {"threshold": 5000000, "rate": 0.05, "label": "Bậc 1: 0-5M"},
                    {"threshold": 10000000, "rate": 0.10, "label": "Bậc 2: 5-10M"},
                    {"threshold": 18000000, "rate": 0.15, "label": "Bậc 3: 10-18M"},
                    {"threshold": 32000000, "rate": 0.20, "label": "Bậc 4: 18-32M"},
                    {"threshold": 52000000, "rate": 0.25, "label": "Bậc 5: 32-52M"},
                    {"threshold": 80000000, "rate": 0.30, "label": "Bậc 6: 52-80M"},
                    {"threshold": None, "rate": 0.35, "label": "Bậc 7: >80M"},
                ],
                # Personal deductions
                "deductions": {
                    "personal": 11000000,  # 11M
                    "dependent": 4400000,  # 4.4M per dependent
                },
                # OT multipliers
                "overtime": {
                    "normal_rate": 1.5,  # 150%
                    "weekend_rate": 2.0,  # 200%
                    "holiday_rate": 3.0,  # 300%
                },
                # Work config
                "work": {
                    "standard_days_per_month": 22,
                    "standard_hours_per_day": 8,
                    "late_tolerance_minutes": 15,
                    "early_leave_tolerance_minutes": 15,
                },
                # Allowances by role (optional)
                "allowances_by_role": {
                    "manager": [
                        {"name": "Phụ cấp quản lý", "amount": 2000000, "is_taxable": True},
                    ],
                    "sales": [
                        {"name": "Phụ cấp điện thoại", "amount": 500000, "is_taxable": False},
                        {"name": "Phụ cấp xăng xe", "amount": 1000000, "is_taxable": False},
                    ],
                },
            }
        
        return {"data": rules}
    
    @router.put("/rules", response_model=Dict[str, Any])
    async def update_payroll_rules(
        data: Dict[str, Any],
        current_user: dict = Depends(get_current_user)
    ):
        """Update payroll rules (Admin only) - Chỉ chỉnh RULE, không chỉnh số tiền trực tiếp"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Only admin can update rules")
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Validate rules
        if "insurance" in data:
            ins = data["insurance"]
            if ins.get("social_rate", 0) > 0.15:
                raise HTTPException(status_code=400, detail="BHXH rate cannot exceed 15%")
        
        if "overtime" in data:
            ot = data["overtime"]
            if ot.get("normal_rate", 0) < 1.0:
                raise HTTPException(status_code=400, detail="OT normal rate cannot be less than 1.0")
        
        # Deactivate current rules
        await db.payroll_rules.update_many(
            {"is_active": True},
            {"$set": {"is_active": False, "deactivated_at": now}}
        )
        
        # Create new rules
        import uuid
        rules_id = str(uuid.uuid4())
        new_rules = {
            "id": rules_id,
            "is_active": True,
            **data,
            "created_at": now,
            "created_by": current_user["id"],
            "created_by_name": current_user.get("full_name", ""),
        }
        
        await db.payroll_rules.insert_one(new_rules)
        
        # Log action
        await payroll_service.log_payroll_action(
            action="update_rules",
            actor_id=current_user["id"],
            actor_name=current_user.get("full_name", ""),
            actor_role=current_user.get("role", ""),
            new_value={"rules_id": rules_id},
        )
        
        return {"success": True, "data": {"id": rules_id}}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # AUDIT LOGS
    # ═══════════════════════════════════════════════════════════════════════════
    
    @router.get("/audit-logs", response_model=List[Dict[str, Any]])
    async def get_audit_logs(
        payroll_id: Optional[str] = None,
        hr_profile_id: Optional[str] = None,
        period: Optional[str] = None,
        action: Optional[str] = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user)
    ):
        """Get payroll audit logs (Admin/Accountant only)"""
        if current_user.get("role") not in ["admin", "bod", "accountant"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        logs = await payroll_service.get_payroll_audit_logs(
            payroll_id=payroll_id,
            hr_profile_id=hr_profile_id,
            period=period,
            action=action,
            limit=limit,
        )
        return logs
    
    @router.get("/salary-view-logs", response_model=List[Dict[str, Any]])
    async def get_salary_view_logs(
        target_hr_profile_id: Optional[str] = None,
        viewer_id: Optional[str] = None,
        period: Optional[str] = None,
        limit: int = 100,
        current_user: dict = Depends(get_current_user)
    ):
        """Get salary view logs (Admin only) - Ai đã xem lương ai"""
        if current_user.get("role") not in ["admin", "bod"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        logs = await payroll_service.get_salary_view_logs(
            target_hr_profile_id=target_hr_profile_id,
            viewer_id=viewer_id,
            period=period,
            limit=limit,
        )
        return logs
    
    return router


# Export
__all__ = ["router", "configure_payroll_router"]
