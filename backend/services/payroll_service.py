"""
ProHouzing Payroll Service
==========================
Business logic for payroll calculation, approval, and payment

Features:
- Auto-calculate from attendance, commission, KPI
- Tax calculation (TNCN)
- Insurance calculation (BHXH, BHYT, BHTN)
- Strict access control
- Full audit trail
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.payroll_models import (
    PayrollStatus, AttendanceStatus, LeaveType, LeaveStatus,
    SalaryComponentType, OvertimeType, ShiftType,
)

logger = logging.getLogger(__name__)


# Collections
PAYROLL_COLLECTIONS = {
    "payroll": "payroll",
    "salary_structures": "salary_structures",
    "salary_components": "salary_components",
    "attendance": "attendance_records",
    "attendance_summary": "attendance_summaries",
    "leave_requests": "leave_requests",
    "leave_balances": "leave_balances",
    "leave_policies": "leave_policies",
    "work_shifts": "work_shifts",
    "shift_assignments": "shift_assignments",
    "payroll_audit": "payroll_audit_logs",
    "salary_view_logs": "salary_view_logs",
}


# Tax brackets for Vietnam PIT (TNCN)
TAX_BRACKETS = [
    (5000000, 0.05),      # Up to 5M: 5%
    (10000000, 0.10),     # 5M - 10M: 10%
    (18000000, 0.15),     # 10M - 18M: 15%
    (32000000, 0.20),     # 18M - 32M: 20%
    (52000000, 0.25),     # 32M - 52M: 25%
    (80000000, 0.30),     # 52M - 80M: 30%
    (float('inf'), 0.35), # Over 80M: 35%
]

# Insurance rates
INSURANCE_RATES = {
    "social": 0.08,       # BHXH 8%
    "health": 0.015,      # BHYT 1.5%
    "unemployment": 0.01, # BHTN 1%
}

# Overtime rates
OVERTIME_RATES = {
    OvertimeType.NORMAL: 1.5,
    OvertimeType.WEEKEND: 2.0,
    OvertimeType.HOLIDAY: 3.0,
}


class PayrollService:
    """Payroll service with strict security"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SECURITY & PERMISSIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def check_salary_access(
        self,
        actor_id: str,
        actor_role: str,
        target_profile_id: str,
        action: str = "view",
    ) -> Dict[str, Any]:
        """Check if actor can access target's salary"""
        
        # Admin always has access
        if actor_role in ["admin", "bod"]:
            return {"allowed": True, "reason": "admin_access"}
        
        # User can view own salary
        actor_profile = await self.db.hr_profiles.find_one({"user_id": actor_id}, {"_id": 0, "id": 1})
        if actor_profile and actor_profile.get("id") == target_profile_id:
            if action == "view":
                return {"allowed": True, "reason": "own_salary"}
            else:
                return {"allowed": False, "reason": "cannot_modify_own_salary"}
        
        # Accountant needs explicit permission
        if actor_role == "accountant":
            user = await self.db.users.find_one({"id": actor_id}, {"_id": 0, "permissions": 1})
            if user and "view_salary" in user.get("permissions", []):
                return {"allowed": True, "reason": "accountant_permission"}
            return {"allowed": False, "reason": "accountant_no_permission"}
        
        # Leader/Manager cannot view team salary
        if actor_role in ["leader", "manager", "sales"]:
            return {"allowed": False, "reason": "no_salary_access_for_role"}
        
        return {"allowed": False, "reason": "default_deny"}
    
    async def log_salary_view(
        self,
        viewer_id: str,
        viewer_name: str,
        viewer_role: str,
        target_profile_id: str,
        target_info: Dict[str, Any],
        period: Optional[str],
        is_authorized: bool,
        reason: str,
        ip: Optional[str] = None,
    ):
        """Log salary view access"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Determine if viewing own salary
        viewer_profile = await self.db.hr_profiles.find_one({"user_id": viewer_id}, {"_id": 0, "id": 1})
        view_type = "own" if viewer_profile and viewer_profile.get("id") == target_profile_id else "other"
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "viewer_id": viewer_id,
            "viewer_name": viewer_name,
            "viewer_role": viewer_role,
            "viewer_ip": ip,
            "target_hr_profile_id": target_profile_id,
            "target_employee_code": target_info.get("employee_code"),
            "target_employee_name": target_info.get("full_name"),
            "view_type": view_type,
            "period": period,
            "is_authorized": is_authorized,
            "authorization_reason": reason,
            "timestamp": now,
        }
        
        await self.db[PAYROLL_COLLECTIONS["salary_view_logs"]].insert_one(log_entry)
        
        # Check for suspicious access
        if not is_authorized or view_type == "other":
            await self._check_suspicious_access(viewer_id, viewer_role)
    
    async def _check_suspicious_access(self, user_id: str, user_role: str):
        """Detect suspicious salary access patterns"""
        now = datetime.now(timezone.utc)
        one_hour_ago = (now - timedelta(hours=1)).isoformat()
        
        # Count accesses in last hour
        count = await self.db[PAYROLL_COLLECTIONS["salary_view_logs"]].count_documents({
            "viewer_id": user_id,
            "view_type": "other",
            "timestamp": {"$gte": one_hour_ago}
        })
        
        if count >= 10:  # More than 10 views of other's salary in 1 hour
            await self._create_security_alert(
                user_id=user_id,
                alert_type="suspicious_salary_access",
                message=f"User viewed {count} other employees' salaries in last hour",
                severity="high"
            )
    
    async def _create_security_alert(
        self,
        user_id: str,
        alert_type: str,
        message: str,
        severity: str,
    ):
        """Create security alert"""
        now = datetime.now(timezone.utc).isoformat()
        
        alert = {
            "id": str(uuid.uuid4()),
            "alert_type": alert_type,
            "user_id": user_id,
            "message": message,
            "severity": severity,
            "is_resolved": False,
            "created_at": now,
        }
        
        await self.db.security_alerts.insert_one(alert)
        logger.warning(f"Security alert: {alert_type} - {message}")
    
    async def log_payroll_action(
        self,
        action: str,
        actor_id: str,
        actor_name: str,
        actor_role: str,
        payroll_id: Optional[str] = None,
        hr_profile_id: Optional[str] = None,
        period: Optional[str] = None,
        old_value: Optional[Dict] = None,
        new_value: Optional[Dict] = None,
        notes: Optional[str] = None,
        warnings: Optional[List] = None,
        ip: Optional[str] = None,
        device: Optional[str] = None,
    ):
        """Log payroll actions - AUDIT LOG COMPLETE"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get employee info if hr_profile_id provided
        employee_info = None
        if hr_profile_id:
            profile = await self.db.hr_profiles.find_one(
                {"id": hr_profile_id},
                {"_id": 0, "employee_code": 1, "full_name": 1}
            )
            if profile:
                employee_info = {
                    "employee_code": profile.get("employee_code"),
                    "employee_name": profile.get("full_name"),
                }
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "action": action,  # calculate, approve, pay, lock, view, adjust
            "payroll_id": payroll_id,
            "hr_profile_id": hr_profile_id,
            "employee_info": employee_info,
            "period": period,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            "actor_ip": ip,
            "actor_device": device,
            "old_value": old_value,
            "new_value": new_value,
            "notes": notes,
            "warnings": warnings,
            "is_suspicious": False,
            "timestamp": now,
        }
        
        await self.db[PAYROLL_COLLECTIONS["payroll_audit"]].insert_one(log_entry)
    
    async def get_payroll_audit_logs(
        self,
        payroll_id: Optional[str] = None,
        hr_profile_id: Optional[str] = None,
        period: Optional[str] = None,
        action: Optional[str] = None,
        actor_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Get payroll audit logs"""
        query = {}
        if payroll_id:
            query["payroll_id"] = payroll_id
        if hr_profile_id:
            query["hr_profile_id"] = hr_profile_id
        if period:
            query["period"] = period
        if action:
            query["action"] = action
        if actor_id:
            query["actor_id"] = actor_id
        
        logs = await self.db[PAYROLL_COLLECTIONS["payroll_audit"]].find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    async def get_salary_view_logs(
        self,
        target_hr_profile_id: Optional[str] = None,
        viewer_id: Optional[str] = None,
        period: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Get salary view logs"""
        query = {}
        if target_hr_profile_id:
            query["target_hr_profile_id"] = target_hr_profile_id
        if viewer_id:
            query["viewer_id"] = viewer_id
        if period:
            query["period"] = period
        
        logs = await self.db[PAYROLL_COLLECTIONS["salary_view_logs"]].find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    # ═══════════════════════════════════════════════════════════════════════════
    # WORK SHIFTS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_default_shifts(self):
        """Create default work shifts if not exists"""
        existing = await self.db[PAYROLL_COLLECTIONS["work_shifts"]].count_documents({})
        if existing > 0:
            return
        
        now = datetime.now(timezone.utc).isoformat()
        default_shifts = [
            {
                "id": str(uuid.uuid4()),
                "name": "Ca hành chính",
                "code": "FULL_DAY",
                "shift_type": ShiftType.FULL_DAY.value,
                "start_time": "08:00",
                "end_time": "17:30",
                "break_start": "12:00",
                "break_end": "13:00",
                "break_duration_minutes": 60,
                "work_hours": 8.0,
                "late_tolerance_minutes": 15,
                "early_leave_tolerance_minutes": 15,
                "overtime_threshold_minutes": 30,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ca sáng",
                "code": "MORNING",
                "shift_type": ShiftType.MORNING.value,
                "start_time": "06:00",
                "end_time": "14:00",
                "break_start": "10:00",
                "break_end": "10:30",
                "break_duration_minutes": 30,
                "work_hours": 7.5,
                "late_tolerance_minutes": 10,
                "early_leave_tolerance_minutes": 10,
                "overtime_threshold_minutes": 30,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ca chiều",
                "code": "AFTERNOON",
                "shift_type": ShiftType.AFTERNOON.value,
                "start_time": "14:00",
                "end_time": "22:00",
                "break_start": "18:00",
                "break_end": "18:30",
                "break_duration_minutes": 30,
                "work_hours": 7.5,
                "late_tolerance_minutes": 10,
                "early_leave_tolerance_minutes": 10,
                "overtime_threshold_minutes": 30,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            },
        ]
        
        await self.db[PAYROLL_COLLECTIONS["work_shifts"]].insert_many(default_shifts)
        logger.info("Created default work shifts")
    
    async def get_shifts(self, active_only: bool = True) -> List[Dict]:
        """Get all work shifts"""
        query = {"is_active": True} if active_only else {}
        shifts = await self.db[PAYROLL_COLLECTIONS["work_shifts"]].find(
            query, {"_id": 0}
        ).to_list(20)
        return shifts
    
    async def get_employee_shift(self, hr_profile_id: str, date: str) -> Optional[Dict]:
        """Get employee's assigned shift for a date"""
        assignment = await self.db[PAYROLL_COLLECTIONS["shift_assignments"]].find_one(
            {
                "hr_profile_id": hr_profile_id,
                "is_current": True,
                "effective_from": {"$lte": date},
                "$or": [
                    {"effective_to": None},
                    {"effective_to": {"$gte": date}}
                ]
            },
            {"_id": 0}
        )
        
        if not assignment:
            # Return default shift
            return await self.db[PAYROLL_COLLECTIONS["work_shifts"]].find_one(
                {"code": "FULL_DAY", "is_active": True}, {"_id": 0}
            )
        
        return await self.db[PAYROLL_COLLECTIONS["work_shifts"]].find_one(
            {"id": assignment.get("shift_id")}, {"_id": 0}
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ATTENDANCE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def check_in(
        self,
        hr_profile_id: str,
        device: Optional[str] = None,
        ip: Optional[str] = None,
        location: Optional[str] = None,
        photo: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Employee check-in"""
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M:%S")
        
        # Get employee info
        profile = await self.db.hr_profiles.find_one(
            {"id": hr_profile_id}, {"_id": 0, "employee_code": 1, "full_name": 1}
        )
        if not profile:
            return {"success": False, "error": "Profile not found"}
        
        # Check if already checked in
        existing = await self.db[PAYROLL_COLLECTIONS["attendance"]].find_one(
            {"hr_profile_id": hr_profile_id, "date": today}
        )
        if existing and existing.get("check_in_time"):
            return {"success": False, "error": "Already checked in today"}
        
        # Get shift
        shift = await self.get_employee_shift(hr_profile_id, today)
        
        # Calculate late minutes
        late_minutes = 0
        status = AttendanceStatus.PRESENT.value
        if shift:
            shift_start = datetime.strptime(shift["start_time"], "%H:%M")
            check_in_dt = datetime.strptime(current_time[:5], "%H:%M")
            
            tolerance = shift.get("late_tolerance_minutes", 15)
            diff_minutes = (check_in_dt - shift_start).total_seconds() / 60
            
            if diff_minutes > tolerance:
                late_minutes = int(diff_minutes - tolerance)
                status = AttendanceStatus.LATE.value
        
        record_id = str(uuid.uuid4())
        record = {
            "id": record_id,
            "hr_profile_id": hr_profile_id,
            "employee_code": profile.get("employee_code"),
            "employee_name": profile.get("full_name"),
            "date": today,
            "shift_id": shift.get("id") if shift else None,
            "shift_name": shift.get("name") if shift else None,
            "check_in_time": current_time,
            "check_in_device": device,
            "check_in_ip": ip,
            "check_in_location": location,
            "check_in_photo": photo,
            "status": status,
            "late_minutes": late_minutes,
            "work_hours": 0.0,
            "overtime_hours": 0.0,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        
        if existing:
            await self.db[PAYROLL_COLLECTIONS["attendance"]].update_one(
                {"id": existing["id"]},
                {"$set": record}
            )
            record_id = existing["id"]
        else:
            await self.db[PAYROLL_COLLECTIONS["attendance"]].insert_one(record)
        
        return {
            "success": True,
            "data": {
                "id": record_id,
                "check_in_time": current_time,
                "status": status,
                "late_minutes": late_minutes,
            }
        }
    
    async def check_out(
        self,
        hr_profile_id: str,
        device: Optional[str] = None,
        ip: Optional[str] = None,
        location: Optional[str] = None,
        photo: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Employee check-out"""
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M:%S")
        
        # Get today's attendance
        record = await self.db[PAYROLL_COLLECTIONS["attendance"]].find_one(
            {"hr_profile_id": hr_profile_id, "date": today}
        )
        if not record:
            return {"success": False, "error": "No check-in found for today"}
        if not record.get("check_in_time"):
            return {"success": False, "error": "Must check-in first"}
        if record.get("check_out_time"):
            return {"success": False, "error": "Already checked out"}
        
        # Calculate work hours and overtime
        check_in_dt = datetime.strptime(record["check_in_time"][:5], "%H:%M")
        check_out_dt = datetime.strptime(current_time[:5], "%H:%M")
        
        # Get shift
        shift = await self.get_employee_shift(hr_profile_id, today)
        
        # Calculate hours
        total_minutes = (check_out_dt - check_in_dt).total_seconds() / 60
        break_minutes = shift.get("break_duration_minutes", 60) if shift else 60
        work_minutes = total_minutes - break_minutes
        work_hours = max(0, work_minutes / 60)
        
        # Calculate overtime
        overtime_hours = 0.0
        overtime_type = None
        status = record.get("status", AttendanceStatus.PRESENT.value)
        early_leave_minutes = 0
        
        if shift:
            standard_hours = shift.get("work_hours", 8.0)
            overtime_threshold = shift.get("overtime_threshold_minutes", 30)
            
            if work_hours > standard_hours + (overtime_threshold / 60):
                overtime_hours = work_hours - standard_hours
                # Determine overtime type based on day
                day_of_week = now.weekday()
                if day_of_week >= 5:  # Weekend
                    overtime_type = OvertimeType.WEEKEND.value
                else:
                    overtime_type = OvertimeType.NORMAL.value
                work_hours = standard_hours
            
            # Check early leave
            shift_end = datetime.strptime(shift["end_time"], "%H:%M")
            early_tolerance = shift.get("early_leave_tolerance_minutes", 15)
            diff_minutes = (shift_end - check_out_dt).total_seconds() / 60
            
            if diff_minutes > early_tolerance:
                early_leave_minutes = int(diff_minutes - early_tolerance)
                if status == AttendanceStatus.LATE.value:
                    status = AttendanceStatus.LATE.value  # Keep late status
                else:
                    status = AttendanceStatus.EARLY_LEAVE.value
        
        update_data = {
            "check_out_time": current_time,
            "check_out_device": device,
            "check_out_ip": ip,
            "check_out_location": location,
            "check_out_photo": photo,
            "work_hours": round(work_hours, 2),
            "overtime_hours": round(overtime_hours, 2),
            "overtime_type": overtime_type,
            "early_leave_minutes": early_leave_minutes,
            "status": status,
            "updated_at": now.isoformat(),
        }
        
        await self.db[PAYROLL_COLLECTIONS["attendance"]].update_one(
            {"id": record["id"]},
            {"$set": update_data}
        )
        
        return {
            "success": True,
            "data": {
                "id": record["id"],
                "check_out_time": current_time,
                "work_hours": round(work_hours, 2),
                "overtime_hours": round(overtime_hours, 2),
                "status": status,
            }
        }
    
    async def get_attendance_records(
        self,
        hr_profile_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Get attendance records"""
        query = {}
        if hr_profile_id:
            query["hr_profile_id"] = hr_profile_id
        if start_date:
            query["date"] = {"$gte": start_date}
        if end_date:
            query.setdefault("date", {})["$lte"] = end_date
        if status:
            query["status"] = status
        
        records = await self.db[PAYROLL_COLLECTIONS["attendance"]].find(
            query, {"_id": 0}
        ).sort("date", -1).limit(limit).to_list(limit)
        
        return records
    
    async def calculate_attendance_summary(
        self,
        hr_profile_id: str,
        period: str,  # YYYY-MM
    ) -> Dict[str, Any]:
        """Calculate monthly attendance summary"""
        year, month = period.split("-")
        start_date = f"{period}-01"
        
        # Calculate end of month
        if int(month) == 12:
            end_date = f"{int(year)+1}-01-01"
        else:
            end_date = f"{year}-{str(int(month)+1).zfill(2)}-01"
        
        # Get all records for the month
        records = await self.db[PAYROLL_COLLECTIONS["attendance"]].find(
            {
                "hr_profile_id": hr_profile_id,
                "date": {"$gte": start_date, "$lt": end_date}
            },
            {"_id": 0}
        ).to_list(31)
        
        # Get employee info
        profile = await self.db.hr_profiles.find_one(
            {"id": hr_profile_id},
            {"_id": 0, "employee_code": 1, "full_name": 1}
        )
        
        # Calculate summary
        summary = {
            "hr_profile_id": hr_profile_id,
            "employee_code": profile.get("employee_code") if profile else "",
            "employee_name": profile.get("full_name") if profile else "",
            "period": period,
            "total_working_days": len(records),
            "present_days": 0,
            "absent_days": 0,
            "late_days": 0,
            "early_leave_days": 0,
            "half_days": 0,
            "leave_days": 0,
            "holiday_days": 0,
            "weekend_days": 0,
            "total_work_hours": 0.0,
            "total_overtime_hours": 0.0,
            "overtime_normal_hours": 0.0,
            "overtime_weekend_hours": 0.0,
            "overtime_holiday_hours": 0.0,
            "total_late_minutes": 0,
            "total_early_leave_minutes": 0,
            "anomaly_count": 0,
        }
        
        for record in records:
            status = record.get("status")
            
            if status == AttendanceStatus.PRESENT.value:
                summary["present_days"] += 1
            elif status == AttendanceStatus.ABSENT.value:
                summary["absent_days"] += 1
            elif status == AttendanceStatus.LATE.value:
                summary["late_days"] += 1
                summary["present_days"] += 1
            elif status == AttendanceStatus.EARLY_LEAVE.value:
                summary["early_leave_days"] += 1
                summary["present_days"] += 1
            elif status == AttendanceStatus.HALF_DAY.value:
                summary["half_days"] += 1
            elif status == AttendanceStatus.ON_LEAVE.value:
                summary["leave_days"] += 1
            elif status == AttendanceStatus.HOLIDAY.value:
                summary["holiday_days"] += 1
            elif status == AttendanceStatus.WEEKEND.value:
                summary["weekend_days"] += 1
            
            summary["total_work_hours"] += record.get("work_hours", 0)
            summary["total_overtime_hours"] += record.get("overtime_hours", 0)
            
            overtime_type = record.get("overtime_type")
            if overtime_type == OvertimeType.NORMAL.value:
                summary["overtime_normal_hours"] += record.get("overtime_hours", 0)
            elif overtime_type == OvertimeType.WEEKEND.value:
                summary["overtime_weekend_hours"] += record.get("overtime_hours", 0)
            elif overtime_type == OvertimeType.HOLIDAY.value:
                summary["overtime_holiday_hours"] += record.get("overtime_hours", 0)
            
            summary["total_late_minutes"] += record.get("late_minutes", 0)
            summary["total_early_leave_minutes"] += record.get("early_leave_minutes", 0)
            
            if record.get("anomaly_detected"):
                summary["anomaly_count"] += 1
        
        return summary
    
    # ═══════════════════════════════════════════════════════════════════════════
    # LEAVE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_leave_request(
        self,
        hr_profile_id: str,
        data: Dict[str, Any],
        actor_id: str,
    ) -> Dict[str, Any]:
        """Create a leave request"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get employee info
        profile = await self.db.hr_profiles.find_one(
            {"id": hr_profile_id},
            {"_id": 0, "employee_code": 1, "full_name": 1}
        )
        if not profile:
            return {"success": False, "error": "Profile not found"}
        
        # Calculate days count
        start = datetime.strptime(data["start_date"], "%Y-%m-%d")
        end = datetime.strptime(data["end_date"], "%Y-%m-%d")
        days_count = (end - start).days + 1
        
        if data.get("is_half_day"):
            days_count = 0.5
        
        # Check leave balance
        balance = await self.get_leave_balance(hr_profile_id, data["leave_type"], start.year)
        if balance and balance.get("remaining_days", 0) < days_count:
            return {"success": False, "error": "Insufficient leave balance"}
        
        request_id = str(uuid.uuid4())
        request = {
            "id": request_id,
            "hr_profile_id": hr_profile_id,
            "employee_code": profile.get("employee_code"),
            "employee_name": profile.get("full_name"),
            "leave_type": data["leave_type"],
            "start_date": data["start_date"],
            "end_date": data["end_date"],
            "days_count": days_count,
            "is_half_day": data.get("is_half_day", False),
            "half_day_type": data.get("half_day_type"),
            "reason": data.get("reason", ""),
            "attachment_urls": data.get("attachment_urls", []),
            "status": LeaveStatus.PENDING.value,
            "requested_at": now,
            "handover_to": data.get("handover_to"),
            "handover_notes": data.get("handover_notes"),
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db[PAYROLL_COLLECTIONS["leave_requests"]].insert_one(request)
        
        # Update pending days in balance
        if balance:
            await self.db[PAYROLL_COLLECTIONS["leave_balances"]].update_one(
                {"id": balance["id"]},
                {"$inc": {"pending_days": days_count}}
            )
        
        return {"success": True, "data": {"id": request_id}}
    
    async def approve_leave_request(
        self,
        request_id: str,
        actor_id: str,
        actor_name: str,
    ) -> Dict[str, Any]:
        """Approve a leave request"""
        now = datetime.now(timezone.utc).isoformat()
        
        request = await self.db[PAYROLL_COLLECTIONS["leave_requests"]].find_one(
            {"id": request_id}, {"_id": 0}
        )
        if not request:
            return {"success": False, "error": "Request not found"}
        if request.get("status") != LeaveStatus.PENDING.value:
            return {"success": False, "error": "Request already processed"}
        
        # Update request
        await self.db[PAYROLL_COLLECTIONS["leave_requests"]].update_one(
            {"id": request_id},
            {"$set": {
                "status": LeaveStatus.APPROVED.value,
                "approved_by": actor_id,
                "approved_at": now,
                "updated_at": now,
            }}
        )
        
        # Update leave balance
        year = int(request["start_date"][:4])
        balance = await self.get_leave_balance(
            request["hr_profile_id"],
            request["leave_type"],
            year
        )
        if balance:
            await self.db[PAYROLL_COLLECTIONS["leave_balances"]].update_one(
                {"id": balance["id"]},
                {
                    "$inc": {
                        "pending_days": -request["days_count"],
                        "used_days": request["days_count"],
                    },
                    "$set": {"remaining_days": balance["remaining_days"] - request["days_count"]}
                }
            )
        
        # Create attendance records for leave days
        await self._create_leave_attendance_records(request)
        
        return {"success": True}
    
    async def reject_leave_request(
        self,
        request_id: str,
        actor_id: str,
        reason: str,
    ) -> Dict[str, Any]:
        """Reject a leave request"""
        now = datetime.now(timezone.utc).isoformat()
        
        request = await self.db[PAYROLL_COLLECTIONS["leave_requests"]].find_one(
            {"id": request_id}, {"_id": 0}
        )
        if not request:
            return {"success": False, "error": "Request not found"}
        
        await self.db[PAYROLL_COLLECTIONS["leave_requests"]].update_one(
            {"id": request_id},
            {"$set": {
                "status": LeaveStatus.REJECTED.value,
                "rejected_by": actor_id,
                "rejected_at": now,
                "rejection_reason": reason,
                "updated_at": now,
            }}
        )
        
        # Remove from pending
        year = int(request["start_date"][:4])
        balance = await self.get_leave_balance(
            request["hr_profile_id"],
            request["leave_type"],
            year
        )
        if balance:
            await self.db[PAYROLL_COLLECTIONS["leave_balances"]].update_one(
                {"id": balance["id"]},
                {"$inc": {"pending_days": -request["days_count"]}}
            )
        
        return {"success": True}
    
    async def _create_leave_attendance_records(self, request: Dict):
        """Create attendance records for approved leave"""
        start = datetime.strptime(request["start_date"], "%Y-%m-%d")
        end = datetime.strptime(request["end_date"], "%Y-%m-%d")
        
        current = start
        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            now = datetime.now(timezone.utc).isoformat()
            
            # Check if record exists
            existing = await self.db[PAYROLL_COLLECTIONS["attendance"]].find_one(
                {"hr_profile_id": request["hr_profile_id"], "date": date_str}
            )
            
            if not existing:
                record = {
                    "id": str(uuid.uuid4()),
                    "hr_profile_id": request["hr_profile_id"],
                    "employee_code": request["employee_code"],
                    "employee_name": request["employee_name"],
                    "date": date_str,
                    "status": AttendanceStatus.ON_LEAVE.value,
                    "leave_request_id": request["id"],
                    "leave_type": request["leave_type"],
                    "work_hours": 0.0,
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db[PAYROLL_COLLECTIONS["attendance"]].insert_one(record)
            
            current += timedelta(days=1)
    
    async def get_leave_balance(
        self,
        hr_profile_id: str,
        leave_type: str,
        year: int,
    ) -> Optional[Dict]:
        """Get leave balance for employee"""
        return await self.db[PAYROLL_COLLECTIONS["leave_balances"]].find_one(
            {
                "hr_profile_id": hr_profile_id,
                "leave_type": leave_type,
                "year": year,
            },
            {"_id": 0}
        )
    
    async def initialize_leave_balance(
        self,
        hr_profile_id: str,
        year: int,
        employment_status: str,
    ):
        """Initialize leave balance for new year"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get leave policies
        policies = await self.db[PAYROLL_COLLECTIONS["leave_policies"]].find(
            {"employment_status": employment_status, "is_active": True},
            {"_id": 0}
        ).to_list(20)
        
        for policy in policies:
            # Check if balance exists
            existing = await self.get_leave_balance(
                hr_profile_id, policy["leave_type"], year
            )
            if existing:
                continue
            
            # Check carry forward from last year
            carry_forward = 0.0
            if policy.get("can_carry_forward"):
                last_year_balance = await self.get_leave_balance(
                    hr_profile_id, policy["leave_type"], year - 1
                )
                if last_year_balance:
                    carry_forward = min(
                        last_year_balance.get("remaining_days", 0),
                        policy.get("max_carry_forward_days", 0)
                    )
            
            balance = {
                "id": str(uuid.uuid4()),
                "hr_profile_id": hr_profile_id,
                "year": year,
                "leave_type": policy["leave_type"],
                "entitled_days": policy["entitled_days_per_year"],
                "used_days": 0.0,
                "pending_days": 0.0,
                "remaining_days": policy["entitled_days_per_year"] + carry_forward,
                "carry_forward_days": carry_forward,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db[PAYROLL_COLLECTIONS["leave_balances"]].insert_one(balance)
    
    # ═══════════════════════════════════════════════════════════════════════════
    # SALARY STRUCTURE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_salary_structure(
        self,
        data: Dict[str, Any],
        actor_id: str,
    ) -> Dict[str, Any]:
        """Create salary structure for employee"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Deactivate current structure
        await self.db[PAYROLL_COLLECTIONS["salary_structures"]].update_many(
            {"hr_profile_id": data["hr_profile_id"], "is_current": True},
            {"$set": {"is_current": False, "effective_to": data["effective_from"]}}
        )
        
        structure_id = str(uuid.uuid4())
        structure = {
            "id": structure_id,
            "hr_profile_id": data["hr_profile_id"],
            "effective_from": data["effective_from"],
            "effective_to": None,
            "is_current": True,
            "base_salary": data["base_salary"],
            "allowances": data.get("allowances", []),
            "social_insurance_rate": data.get("social_insurance_rate", 0.08),
            "health_insurance_rate": data.get("health_insurance_rate", 0.015),
            "unemployment_rate": data.get("unemployment_rate", 0.01),
            "tax_dependents": data.get("tax_dependents", 0),
            "personal_deduction": data.get("personal_deduction", 11000000),
            "dependent_deduction": data.get("dependent_deduction", 4400000),
            "notes": data.get("notes"),
            "created_at": now,
            "created_by": actor_id,
            "updated_at": now,
        }
        
        await self.db[PAYROLL_COLLECTIONS["salary_structures"]].insert_one(structure)
        
        return {"success": True, "data": {"id": structure_id}}
    
    async def get_current_salary_structure(self, hr_profile_id: str) -> Optional[Dict]:
        """Get current salary structure"""
        return await self.db[PAYROLL_COLLECTIONS["salary_structures"]].find_one(
            {"hr_profile_id": hr_profile_id, "is_current": True},
            {"_id": 0}
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL CALCULATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def calculate_payroll(
        self,
        period: str,
        hr_profile_ids: Optional[List[str]] = None,
        actor_id: str = None,
        actor_name: str = None,
    ) -> Dict[str, Any]:
        """Calculate payroll for period"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Get employees to calculate
        query = {"is_active": True}
        if hr_profile_ids:
            query["id"] = {"$in": hr_profile_ids}
        
        profiles = await self.db.hr_profiles.find(
            query,
            {"_id": 0, "id": 1, "employee_code": 1, "full_name": 1, "employment_status": 1}
        ).to_list(1000)
        
        results = []
        
        for profile in profiles:
            try:
                payroll = await self._calculate_individual_payroll(
                    profile, period, actor_id, now
                )
                results.append({
                    "hr_profile_id": profile["id"],
                    "employee_code": profile["employee_code"],
                    "status": "success",
                    "payroll_id": payroll.get("id"),
                })
            except Exception as e:
                logger.error(f"Error calculating payroll for {profile['id']}: {e}")
                results.append({
                    "hr_profile_id": profile["id"],
                    "employee_code": profile["employee_code"],
                    "status": "error",
                    "error": str(e),
                })
        
        # Log action
        if actor_id:
            await self.log_payroll_action(
                action="calculate",
                actor_id=actor_id,
                actor_name=actor_name or "",
                actor_role="",
                period=period,
                new_value={"count": len(results)},
            )
        
        return {
            "success": True,
            "period": period,
            "processed": len(results),
            "results": results,
        }
    
    async def _calculate_individual_payroll(
        self,
        profile: Dict,
        period: str,
        actor_id: str,
        now: str,
    ) -> Dict:
        """Calculate payroll for one employee"""
        hr_profile_id = profile["id"]
        
        # Check if payroll exists and not locked
        existing = await self.db[PAYROLL_COLLECTIONS["payroll"]].find_one(
            {"hr_profile_id": hr_profile_id, "period": period}
        )
        if existing and existing.get("status") in [PayrollStatus.APPROVED.value, PayrollStatus.PAID.value, PayrollStatus.LOCKED.value]:
            raise Exception(f"Payroll already {existing.get('status')}")
        
        # Get salary structure
        structure = await self.get_current_salary_structure(hr_profile_id)
        if not structure:
            raise Exception("No salary structure found")
        
        # Get attendance summary
        attendance = await self.calculate_attendance_summary(hr_profile_id, period)
        
        # Get bank info from profile
        full_profile = await self.db.hr_profiles.find_one(
            {"id": hr_profile_id},
            {"_id": 0, "bank_account": 1, "bank_name": 1}
        )
        
        # ═══ CALCULATE EARNINGS ═══
        base_salary = structure["base_salary"]
        standard_work_days = 22  # TODO: Get from config
        actual_work_days = attendance.get("present_days", 0) + attendance.get("half_days", 0) * 0.5
        
        # Pro-rata base salary
        prorated_base = (base_salary / standard_work_days) * actual_work_days
        
        # Allowances
        total_allowances = 0.0
        allowance_details = []
        for allowance in structure.get("allowances", []):
            amount = allowance.get("amount", 0)
            total_allowances += amount
            allowance_details.append({
                "name": allowance.get("name"),
                "amount": amount,
                "is_taxable": allowance.get("is_taxable", True),
            })
        
        # Commission (from Finance module)
        commissions = await self._get_commission_for_period(hr_profile_id, period)
        total_commission = sum(c.get("amount", 0) for c in commissions)
        
        # Overtime
        hourly_rate = base_salary / standard_work_days / 8
        overtime_normal = attendance.get("overtime_normal_hours", 0) * hourly_rate * OVERTIME_RATES[OvertimeType.NORMAL]
        overtime_weekend = attendance.get("overtime_weekend_hours", 0) * hourly_rate * OVERTIME_RATES[OvertimeType.WEEKEND]
        overtime_holiday = attendance.get("overtime_holiday_hours", 0) * hourly_rate * OVERTIME_RATES[OvertimeType.HOLIDAY]
        total_overtime = overtime_normal + overtime_weekend + overtime_holiday
        
        # Bonuses (from KPI/rewards)
        bonuses = await self._get_bonuses_for_period(hr_profile_id, period)
        total_bonus = sum(b.get("amount", 0) for b in bonuses)
        
        # ═══ GROSS SALARY ═══
        gross_salary = prorated_base + total_allowances + total_commission + total_overtime + total_bonus
        
        # ═══ CALCULATE DEDUCTIONS ═══
        # Insurance (on base salary, capped at 20x minimum wage ~36M)
        insurance_base = min(base_salary, 36000000)
        social_insurance = insurance_base * structure.get("social_insurance_rate", 0.08)
        health_insurance = insurance_base * structure.get("health_insurance_rate", 0.015)
        unemployment_insurance = insurance_base * structure.get("unemployment_rate", 0.01)
        total_insurance = social_insurance + health_insurance + unemployment_insurance
        
        # Tax calculation
        tax_dependents = structure.get("tax_dependents", 0)
        personal_deduction = structure.get("personal_deduction", 11000000)
        dependent_deduction = structure.get("dependent_deduction", 4400000) * tax_dependents
        
        # Taxable income
        taxable_income = gross_salary - total_insurance - personal_deduction - dependent_deduction
        taxable_income = max(0, taxable_income)
        
        # Calculate PIT
        personal_income_tax = self._calculate_pit(taxable_income)
        
        # Penalties
        penalties = await self._get_penalties_for_period(hr_profile_id, period)
        total_penalties = sum(p.get("amount", 0) for p in penalties)
        
        # Advances
        advances = await self._get_advances_for_period(hr_profile_id, period)
        total_advances = sum(a.get("amount", 0) for a in advances)
        
        # ═══ NET SALARY (KHÔNG CHO ÂM) ═══
        raw_net_salary = gross_salary - total_insurance - personal_income_tax - total_penalties - total_advances
        
        # Xử lý trường hợp net âm
        carry_forward_debt = 0.0
        if raw_net_salary < 0:
            carry_forward_debt = abs(raw_net_salary)
            net_salary = 0.0  # Set net = 0
        else:
            net_salary = raw_net_salary
        
        # ═══ BUILD PAYROLL RECORD ═══
        payroll_id = existing.get("id") if existing else str(uuid.uuid4())
        version = (existing.get("version", 0) + 1) if existing else 1
        
        # Get previous carry forward if any
        prev_carry_forward = existing.get("carry_forward_debt", 0) if existing else 0
        total_carry_forward = carry_forward_debt + prev_carry_forward
        
        payroll = {
            "id": payroll_id,
            "hr_profile_id": hr_profile_id,
            "employee_code": profile["employee_code"],
            "employee_name": profile["full_name"],
            "period": period,
            "period_start": f"{period}-01",
            "period_end": f"{period}-{self._get_last_day_of_month(period)}",
            "status": PayrollStatus.CALCULATED.value,
            
            # Earnings
            "base_salary": prorated_base,
            "base_salary_full": structure["base_salary"],  # Lương cơ bản gốc
            "actual_work_days": actual_work_days,
            "standard_work_days": standard_work_days,
            "total_allowances": total_allowances,
            "allowance_details": allowance_details,
            "total_commission": total_commission,
            "commission_details": commissions,
            "total_overtime": total_overtime,
            "overtime_normal_hours": attendance.get("overtime_normal_hours", 0),
            "overtime_normal_amount": overtime_normal,
            "overtime_weekend_hours": attendance.get("overtime_weekend_hours", 0),
            "overtime_weekend_amount": overtime_weekend,
            "overtime_holiday_hours": attendance.get("overtime_holiday_hours", 0),
            "overtime_holiday_amount": overtime_holiday,
            "total_bonus": total_bonus,
            "bonus_details": bonuses,
            
            # Gross
            "gross_salary": gross_salary,
            
            # Deductions
            "social_insurance": social_insurance,
            "health_insurance": health_insurance,
            "unemployment_insurance": unemployment_insurance,
            "total_insurance": total_insurance,
            "insurance_base": insurance_base,  # Base tính BH
            "taxable_income": taxable_income,
            "personal_deduction": personal_deduction,
            "dependent_deduction": dependent_deduction,
            "tax_dependents": tax_dependents,
            "personal_income_tax": personal_income_tax,
            "total_penalties": total_penalties,
            "penalty_details": penalties,
            "total_advances": total_advances,
            "advance_details": advances,
            
            # Net (KHÔNG ÂM)
            "raw_net_salary": raw_net_salary,  # Net thực tế (có thể âm)
            "net_salary": net_salary,  # Net hiển thị (>= 0)
            "carry_forward_debt": total_carry_forward,  # Nợ chuyển tiếp
            "has_debt": total_carry_forward > 0,
            
            # OT Rates (for transparency)
            "ot_rate_normal": OVERTIME_RATES[OvertimeType.NORMAL],
            "ot_rate_weekend": OVERTIME_RATES[OvertimeType.WEEKEND],
            "ot_rate_holiday": OVERTIME_RATES[OvertimeType.HOLIDAY],
            
            # Insurance Rates
            "insurance_rate_social": structure.get("social_insurance_rate", 0.08),
            "insurance_rate_health": structure.get("health_insurance_rate", 0.015),
            "insurance_rate_unemployment": structure.get("unemployment_rate", 0.01),
            
            # Bank
            "bank_account": full_profile.get("bank_account") if full_profile else None,
            "bank_name": full_profile.get("bank_name") if full_profile else None,
            
            # Attendance summary
            "late_days": attendance.get("late_days", 0),
            "total_late_minutes": attendance.get("total_late_minutes", 0),
            "leave_days": attendance.get("leave_days", 0),
            "absent_days": attendance.get("absent_days", 0),
            
            # Workflow
            "calculated_at": now,
            "calculated_by": actor_id,
            
            # Audit
            "created_at": existing.get("created_at", now) if existing else now,
            "updated_at": now,
            "version": version,
        }
        
        if existing:
            await self.db[PAYROLL_COLLECTIONS["payroll"]].update_one(
                {"id": payroll_id},
                {"$set": payroll}
            )
        else:
            await self.db[PAYROLL_COLLECTIONS["payroll"]].insert_one(payroll)
        
        return payroll
    
    def _calculate_pit(self, taxable_income: float) -> float:
        """Calculate Personal Income Tax using Vietnam's progressive tax brackets"""
        if taxable_income <= 0:
            return 0
        
        tax = 0.0
        remaining = taxable_income
        prev_bracket = 0
        
        for bracket, rate in TAX_BRACKETS:
            if remaining <= 0:
                break
            
            taxable_at_bracket = min(remaining, bracket - prev_bracket)
            tax += taxable_at_bracket * rate
            remaining -= taxable_at_bracket
            prev_bracket = bracket
        
        return round(tax, 0)
    
    def _get_last_day_of_month(self, period: str) -> str:
        """Get last day of month"""
        year, month = map(int, period.split("-"))
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        last_day = next_month - timedelta(days=1)
        return str(last_day.day).zfill(2)
    
    async def _get_commission_for_period(self, hr_profile_id: str, period: str) -> List[Dict]:
        """Get commission from Finance module"""
        # Get user_id from hr_profile
        profile = await self.db.hr_profiles.find_one({"id": hr_profile_id}, {"_id": 0, "user_id": 1})
        if not profile:
            return []
        
        user_id = profile.get("user_id")
        if not user_id:
            return []
        
        # Query commissions from finance module
        start_date = f"{period}-01"
        end_date = f"{period}-{self._get_last_day_of_month(period)}"
        
        commissions = await self.db.commissions.find(
            {
                "user_id": user_id,
                "status": "paid",
                "paid_at": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0, "id": 1, "amount": 1, "contract_id": 1}
        ).to_list(100)
        
        return commissions
    
    async def _get_bonuses_for_period(self, hr_profile_id: str, period: str) -> List[Dict]:
        """Get bonuses from HR rewards"""
        year, month = period.split("-")
        start_date = f"{period}-01"
        end_date = f"{period}-{self._get_last_day_of_month(period)}"
        
        rewards = await self.db.hr_rewards_discipline.find(
            {
                "hr_profile_id": hr_profile_id,
                "type": "reward",
                "effective_date": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0, "id": 1, "title": 1, "monetary_value": 1}
        ).to_list(20)
        
        return [{"name": r.get("title"), "amount": r.get("monetary_value", 0)} for r in rewards]
    
    async def _get_penalties_for_period(self, hr_profile_id: str, period: str) -> List[Dict]:
        """Get penalties from HR discipline"""
        start_date = f"{period}-01"
        end_date = f"{period}-{self._get_last_day_of_month(period)}"
        
        penalties = await self.db.hr_rewards_discipline.find(
            {
                "hr_profile_id": hr_profile_id,
                "type": {"$in": ["discipline", "warning"]},
                "effective_date": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0, "id": 1, "title": 1, "monetary_value": 1}
        ).to_list(20)
        
        return [{"name": p.get("title"), "amount": p.get("monetary_value", 0)} for p in penalties]
    
    async def _get_advances_for_period(self, hr_profile_id: str, period: str) -> List[Dict]:
        """Get salary advances"""
        start_date = f"{period}-01"
        end_date = f"{period}-{self._get_last_day_of_month(period)}"
        
        advances = await self.db.salary_advances.find(
            {
                "hr_profile_id": hr_profile_id,
                "status": "approved",
                "advance_date": {"$gte": start_date, "$lte": end_date}
            },
            {"_id": 0, "id": 1, "amount": 1, "reason": 1}
        ).to_list(10)
        
        return [{"name": a.get("reason", "Tạm ứng"), "amount": a.get("amount", 0)} for a in advances]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYROLL APPROVAL & PAYMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def approve_payroll(
        self,
        payroll_ids: List[str],
        actor_id: str,
        actor_name: str,
        actor_role: str,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Approve calculated payrolls"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Check permission
        if actor_role not in ["admin", "bod", "accountant"]:
            return {"success": False, "error": "Permission denied"}
        
        results = []
        for payroll_id in payroll_ids:
            payroll = await self.db[PAYROLL_COLLECTIONS["payroll"]].find_one(
                {"id": payroll_id}, {"_id": 0}
            )
            
            if not payroll:
                results.append({"id": payroll_id, "status": "not_found", "error": "Không tìm thấy bảng lương"})
                continue
            
            if payroll.get("status") != PayrollStatus.CALCULATED.value:
                results.append({"id": payroll_id, "status": "invalid_status", "error": "Trạng thái không hợp lệ"})
                continue
            
            # ═══ VALIDATION: Không cho approve nếu thiếu data ═══
            validation_errors = []
            
            # Check attendance data
            if payroll.get("actual_work_days", 0) == 0 and payroll.get("leave_days", 0) == 0:
                validation_errors.append("Thiếu dữ liệu chấm công (attendance)")
            
            # Check if gross = 0 (may indicate missing data)
            if payroll.get("gross_salary", 0) == 0:
                validation_errors.append("Lương gross = 0, kiểm tra lại cấu hình lương")
            
            # Check for debt warning
            if payroll.get("has_debt"):
                validation_errors.append(f"Cảnh báo: Nhân viên có nợ chuyển tiếp {payroll.get('carry_forward_debt'):,.0f}đ")
            
            if validation_errors and not notes:
                results.append({
                    "id": payroll_id, 
                    "status": "validation_warning", 
                    "warnings": validation_errors,
                    "message": "Có cảnh báo - thêm ghi chú để xác nhận approve"
                })
                continue
            
            await self.db[PAYROLL_COLLECTIONS["payroll"]].update_one(
                {"id": payroll_id},
                {"$set": {
                    "status": PayrollStatus.APPROVED.value,
                    "approved_at": now,
                    "approved_by": actor_id,
                    "approval_notes": notes,
                    "validation_warnings": validation_errors if validation_errors else None,
                    "updated_at": now,
                }}
            )
            
            # Log action
            await self.log_payroll_action(
                action="approve",
                actor_id=actor_id,
                actor_name=actor_name,
                actor_role=actor_role,
                payroll_id=payroll_id,
                hr_profile_id=payroll.get("hr_profile_id"),
                period=payroll.get("period"),
                notes=notes,
                warnings=validation_errors,
            )
            
            results.append({"id": payroll_id, "status": "approved"})
        
        return {"success": True, "results": results}
    
    async def mark_payroll_paid(
        self,
        payroll_ids: List[str],
        actor_id: str,
        actor_name: str,
        actor_role: str,
        payment_reference: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Mark payrolls as paid"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Check permission
        if actor_role not in ["admin", "bod", "accountant"]:
            return {"success": False, "error": "Permission denied"}
        
        results = []
        for payroll_id in payroll_ids:
            payroll = await self.db[PAYROLL_COLLECTIONS["payroll"]].find_one(
                {"id": payroll_id}, {"_id": 0}
            )
            
            if not payroll:
                results.append({"id": payroll_id, "status": "not_found"})
                continue
            
            if payroll.get("status") != PayrollStatus.APPROVED.value:
                results.append({"id": payroll_id, "status": "not_approved"})
                continue
            
            await self.db[PAYROLL_COLLECTIONS["payroll"]].update_one(
                {"id": payroll_id},
                {"$set": {
                    "status": PayrollStatus.PAID.value,
                    "paid_at": now,
                    "paid_by": actor_id,
                    "payment_reference": payment_reference,
                    "updated_at": now,
                }}
            )
            
            # Log action
            await self.log_payroll_action(
                action="pay",
                actor_id=actor_id,
                actor_name=actor_name,
                actor_role=actor_role,
                payroll_id=payroll_id,
                hr_profile_id=payroll.get("hr_profile_id"),
                period=payroll.get("period"),
            )
            
            results.append({"id": payroll_id, "status": "paid"})
        
        return {"success": True, "results": results}
    
    async def lock_payroll(
        self,
        period: str,
        actor_id: str,
        actor_name: str,
        actor_role: str,
    ) -> Dict[str, Any]:
        """Lock all paid payrolls for a period"""
        now = datetime.now(timezone.utc).isoformat()
        
        if actor_role not in ["admin", "bod"]:
            return {"success": False, "error": "Only admin can lock payroll"}
        
        result = await self.db[PAYROLL_COLLECTIONS["payroll"]].update_many(
            {"period": period, "status": PayrollStatus.PAID.value},
            {"$set": {
                "status": PayrollStatus.LOCKED.value,
                "locked_at": now,
                "locked_by": actor_id,
                "updated_at": now,
            }}
        )
        
        # Log action
        await self.log_payroll_action(
            action="lock",
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            period=period,
            new_value={"locked_count": result.modified_count},
        )
        
        return {"success": True, "locked_count": result.modified_count}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # QUERIES
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_payroll(
        self,
        payroll_id: str,
        actor_id: str,
        actor_name: str,
        actor_role: str,
    ) -> Optional[Dict]:
        """Get single payroll with access check"""
        payroll = await self.db[PAYROLL_COLLECTIONS["payroll"]].find_one(
            {"id": payroll_id}, {"_id": 0}
        )
        
        if not payroll:
            return None
        
        # Check access
        access = await self.check_salary_access(
            actor_id, actor_role, payroll["hr_profile_id"]
        )
        
        # Log view
        target_info = {
            "employee_code": payroll.get("employee_code"),
            "full_name": payroll.get("employee_name"),
        }
        await self.log_salary_view(
            viewer_id=actor_id,
            viewer_name=actor_name,
            viewer_role=actor_role,
            target_profile_id=payroll["hr_profile_id"],
            target_info=target_info,
            period=payroll.get("period"),
            is_authorized=access["allowed"],
            reason=access["reason"],
        )
        
        if not access["allowed"]:
            return None
        
        return payroll
    
    async def get_payrolls_for_period(
        self,
        period: str,
        status: Optional[str] = None,
        actor_role: str = None,
    ) -> List[Dict]:
        """Get all payrolls for a period (admin/accountant only)"""
        if actor_role not in ["admin", "bod", "accountant"]:
            return []
        
        query = {"period": period}
        if status:
            query["status"] = status
        
        payrolls = await self.db[PAYROLL_COLLECTIONS["payroll"]].find(
            query, {"_id": 0}
        ).sort("employee_code", 1).to_list(1000)
        
        return payrolls
    
    async def get_my_payrolls(
        self,
        user_id: str,
        limit: int = 12,
    ) -> List[Dict]:
        """Get payrolls for current user"""
        # Get profile
        profile = await self.db.hr_profiles.find_one(
            {"user_id": user_id}, {"_id": 0, "id": 1}
        )
        if not profile:
            return []
        
        payrolls = await self.db[PAYROLL_COLLECTIONS["payroll"]].find(
            {"hr_profile_id": profile["id"]},
            {"_id": 0}
        ).sort("period", -1).limit(limit).to_list(limit)
        
        return payrolls
    
    async def get_payroll_summary(self, period: str) -> Dict:
        """Get payroll summary for a period"""
        payrolls = await self.db[PAYROLL_COLLECTIONS["payroll"]].find(
            {"period": period}, {"_id": 0}
        ).to_list(1000)
        
        summary = {
            "period": period,
            "total_employees": len(payrolls),
            "total_gross": sum(p.get("gross_salary", 0) for p in payrolls),
            "total_net": sum(p.get("net_salary", 0) for p in payrolls),
            "total_tax": sum(p.get("personal_income_tax", 0) for p in payrolls),
            "total_insurance": sum(p.get("total_insurance", 0) for p in payrolls),
            "by_status": {},
        }
        
        for status in PayrollStatus:
            summary["by_status"][status.value] = len([p for p in payrolls if p.get("status") == status.value])
        
        return summary
