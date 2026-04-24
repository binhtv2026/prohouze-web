"""
ProHouzing Payroll & Workforce Models
=====================================
Phase 1 of HR AI Platform

Includes:
- Payroll (Bảng lương)
- Attendance (Chấm công)
- Leave Management (Nghỉ phép)
- Work Shifts (Ca làm việc)
- Salary Components
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class PayrollStatus(str, Enum):
    """Payroll lifecycle status"""
    DRAFT = "draft"
    CALCULATED = "calculated"
    APPROVED = "approved"
    PAID = "paid"
    LOCKED = "locked"


class AttendanceStatus(str, Enum):
    """Attendance record status"""
    PRESENT = "present"         # Có mặt
    ABSENT = "absent"           # Vắng mặt
    LATE = "late"               # Đi muộn
    EARLY_LEAVE = "early_leave" # Về sớm
    HALF_DAY = "half_day"       # Nửa ngày
    HOLIDAY = "holiday"         # Ngày lễ
    WEEKEND = "weekend"         # Cuối tuần
    ON_LEAVE = "on_leave"       # Nghỉ phép


class LeaveType(str, Enum):
    """Types of leave"""
    ANNUAL = "annual"           # Phép năm
    SICK = "sick"               # Nghỉ ốm
    MATERNITY = "maternity"     # Thai sản
    PATERNITY = "paternity"     # Nghỉ cha
    MARRIAGE = "marriage"       # Nghỉ cưới
    BEREAVEMENT = "bereavement" # Tang chế
    UNPAID = "unpaid"           # Không lương
    COMPENSATORY = "compensatory" # Nghỉ bù
    OTHER = "other"


class LeaveStatus(str, Enum):
    """Leave request status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ShiftType(str, Enum):
    """Work shift types"""
    MORNING = "morning"         # Ca sáng
    AFTERNOON = "afternoon"     # Ca chiều
    FULL_DAY = "full_day"       # Cả ngày
    NIGHT = "night"             # Ca đêm
    FLEXIBLE = "flexible"       # Linh hoạt


class OvertimeType(str, Enum):
    """Overtime types"""
    NORMAL = "normal"           # OT bình thường (x1.5)
    WEEKEND = "weekend"         # OT cuối tuần (x2.0)
    HOLIDAY = "holiday"         # OT ngày lễ (x3.0)


class SalaryComponentType(str, Enum):
    """Types of salary components"""
    # Additions
    BASE_SALARY = "base_salary"           # Lương cơ bản
    ALLOWANCE = "allowance"               # Phụ cấp
    COMMISSION = "commission"             # Hoa hồng
    BONUS = "bonus"                       # Thưởng
    OVERTIME = "overtime"                 # Tăng ca
    HOLIDAY_PAY = "holiday_pay"           # Lương ngày lễ
    # Deductions
    SOCIAL_INSURANCE = "social_insurance" # BHXH (8%)
    HEALTH_INSURANCE = "health_insurance" # BHYT (1.5%)
    UNEMPLOYMENT = "unemployment"         # BHTN (1%)
    PERSONAL_TAX = "personal_tax"         # TNCN
    PENALTY = "penalty"                   # Phạt
    ADVANCE = "advance"                   # Tạm ứng
    OTHER_DEDUCTION = "other_deduction"   # Khấu trừ khác


class PayrollPermission(str, Enum):
    """Payroll access permissions"""
    VIEW_OWN = "view_own"
    VIEW_TEAM = "view_team"
    VIEW_ALL = "view_all"
    CALCULATE = "calculate"
    APPROVE = "approve"
    PAY = "pay"
    EXPORT = "export"


# ═══════════════════════════════════════════════════════════════════════════════
# WORK SHIFT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class WorkShift(BaseModel):
    """Work shift definition"""
    id: str
    name: str                           # Tên ca
    code: str                           # Mã ca (MORNING, AFTERNOON, etc)
    shift_type: ShiftType
    start_time: str                     # "08:00"
    end_time: str                       # "17:00"
    break_start: Optional[str] = None   # "12:00"
    break_end: Optional[str] = None     # "13:00"
    break_duration_minutes: int = 60
    work_hours: float = 8.0             # Số giờ làm việc
    late_tolerance_minutes: int = 15    # Cho phép đi muộn (phút)
    early_leave_tolerance_minutes: int = 15
    overtime_threshold_minutes: int = 30  # Sau bao nhiêu phút tính OT
    is_active: bool = True
    created_at: str
    updated_at: str


class WorkShiftCreate(BaseModel):
    """Create work shift"""
    name: str
    code: str
    shift_type: ShiftType = ShiftType.FULL_DAY
    start_time: str = "08:00"
    end_time: str = "17:30"
    break_start: Optional[str] = "12:00"
    break_end: Optional[str] = "13:00"
    break_duration_minutes: int = 60
    work_hours: float = 8.0
    late_tolerance_minutes: int = 15
    early_leave_tolerance_minutes: int = 15
    overtime_threshold_minutes: int = 30


class EmployeeShiftAssignment(BaseModel):
    """Assign employee to shift"""
    id: str
    hr_profile_id: str
    shift_id: str
    effective_from: str
    effective_to: Optional[str] = None
    is_current: bool = True
    created_at: str
    created_by: str


# ═══════════════════════════════════════════════════════════════════════════════
# ATTENDANCE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class AttendanceRecord(BaseModel):
    """Daily attendance record"""
    id: str
    hr_profile_id: str
    employee_code: str
    employee_name: str
    date: str                           # YYYY-MM-DD
    shift_id: Optional[str] = None
    shift_name: Optional[str] = None
    
    # Check-in/out
    check_in_time: Optional[str] = None
    check_in_device: Optional[str] = None
    check_in_ip: Optional[str] = None
    check_in_location: Optional[str] = None
    check_in_photo: Optional[str] = None  # Selfie nếu có
    
    check_out_time: Optional[str] = None
    check_out_device: Optional[str] = None
    check_out_ip: Optional[str] = None
    check_out_location: Optional[str] = None
    check_out_photo: Optional[str] = None
    
    # Status
    status: AttendanceStatus = AttendanceStatus.PRESENT
    
    # Calculated
    work_hours: float = 0.0
    overtime_hours: float = 0.0
    overtime_type: Optional[OvertimeType] = None
    late_minutes: int = 0
    early_leave_minutes: int = 0
    
    # Leave reference
    leave_request_id: Optional[str] = None
    leave_type: Optional[LeaveType] = None
    
    # Notes
    notes: Optional[str] = None
    anomaly_detected: bool = False      # Bất thường được AI phát hiện
    anomaly_reason: Optional[str] = None
    
    # Approval
    is_adjusted: bool = False
    adjusted_by: Optional[str] = None
    adjusted_at: Optional[str] = None
    adjustment_reason: Optional[str] = None
    
    created_at: str
    updated_at: str


class AttendanceCheckIn(BaseModel):
    """Check-in request"""
    device: Optional[str] = None
    ip: Optional[str] = None
    location: Optional[str] = None
    photo: Optional[str] = None
    notes: Optional[str] = None


class AttendanceCheckOut(BaseModel):
    """Check-out request"""
    device: Optional[str] = None
    ip: Optional[str] = None
    location: Optional[str] = None
    photo: Optional[str] = None
    notes: Optional[str] = None


class AttendanceAdjustment(BaseModel):
    """Adjust attendance record (admin only)"""
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    status: Optional[AttendanceStatus] = None
    reason: str


class AttendanceSummary(BaseModel):
    """Monthly attendance summary"""
    hr_profile_id: str
    employee_code: str
    employee_name: str
    period: str                         # YYYY-MM
    
    # Days count
    total_working_days: int = 0
    present_days: int = 0
    absent_days: int = 0
    late_days: int = 0
    early_leave_days: int = 0
    half_days: int = 0
    leave_days: int = 0
    holiday_days: int = 0
    weekend_days: int = 0
    
    # Hours
    total_work_hours: float = 0.0
    total_overtime_hours: float = 0.0
    overtime_normal_hours: float = 0.0
    overtime_weekend_hours: float = 0.0
    overtime_holiday_hours: float = 0.0
    
    # Minutes late/early
    total_late_minutes: int = 0
    total_early_leave_minutes: int = 0
    
    # Anomalies
    anomaly_count: int = 0
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# LEAVE MANAGEMENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class LeaveBalance(BaseModel):
    """Employee leave balance"""
    id: str
    hr_profile_id: str
    year: int
    leave_type: LeaveType
    entitled_days: float                # Số ngày được phép
    used_days: float = 0.0              # Đã sử dụng
    pending_days: float = 0.0           # Đang chờ duyệt
    remaining_days: float = 0.0         # Còn lại
    carry_forward_days: float = 0.0     # Chuyển từ năm trước
    notes: Optional[str] = None
    created_at: str
    updated_at: str


class LeaveRequest(BaseModel):
    """Leave request"""
    id: str
    hr_profile_id: str
    employee_code: str
    employee_name: str
    
    leave_type: LeaveType
    start_date: str
    end_date: str
    days_count: float                   # Số ngày nghỉ
    is_half_day: bool = False
    half_day_type: Optional[str] = None  # "morning" or "afternoon"
    
    reason: str
    attachment_urls: List[str] = []     # Giấy tờ đính kèm
    
    status: LeaveStatus = LeaveStatus.PENDING
    
    # Approval workflow
    requested_at: str
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    rejected_by: Optional[str] = None
    rejected_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    
    # Handover
    handover_to: Optional[str] = None
    handover_notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class LeaveRequestCreate(BaseModel):
    """Create leave request"""
    leave_type: LeaveType
    start_date: str
    end_date: str
    is_half_day: bool = False
    half_day_type: Optional[str] = None
    reason: str
    handover_to: Optional[str] = None
    handover_notes: Optional[str] = None


class LeavePolicy(BaseModel):
    """Leave policy by employment type"""
    id: str
    name: str
    employment_status: str              # probation, official, etc
    leave_type: LeaveType
    entitled_days_per_year: float
    max_consecutive_days: int = 30
    requires_approval: bool = True
    min_advance_days: int = 1           # Phải xin trước bao nhiêu ngày
    can_carry_forward: bool = False
    max_carry_forward_days: float = 0.0
    is_active: bool = True
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# SALARY COMPONENT MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class SalaryComponent(BaseModel):
    """Individual salary component"""
    id: str
    payroll_id: str
    hr_profile_id: str
    
    component_type: SalaryComponentType
    name: str
    description: Optional[str] = None
    
    amount: float
    is_taxable: bool = True
    is_addition: bool = True            # True = cộng, False = trừ
    
    # Source tracking
    source_type: Optional[str] = None   # "commission", "attendance", "kpi", "manual"
    source_id: Optional[str] = None
    source_details: Optional[Dict[str, Any]] = None
    
    created_at: str
    created_by: str


class SalaryStructure(BaseModel):
    """Employee salary structure (template)"""
    id: str
    hr_profile_id: str
    effective_from: str
    effective_to: Optional[str] = None
    is_current: bool = True
    
    base_salary: float
    allowances: List[Dict[str, Any]] = []  # [{name, amount, is_taxable}]
    
    # Insurance contribution rates
    social_insurance_rate: float = 0.08     # 8%
    health_insurance_rate: float = 0.015    # 1.5%
    unemployment_rate: float = 0.01         # 1%
    
    # Tax info
    tax_dependents: int = 0                 # Số người phụ thuộc
    personal_deduction: float = 11000000    # Giảm trừ bản thân (11M)
    dependent_deduction: float = 4400000    # Giảm trừ người phụ thuộc (4.4M/người)
    
    notes: Optional[str] = None
    created_at: str
    created_by: str
    updated_at: str


class SalaryStructureCreate(BaseModel):
    """Create salary structure"""
    hr_profile_id: str
    effective_from: str
    base_salary: float
    allowances: List[Dict[str, Any]] = []
    tax_dependents: int = 0


# ═══════════════════════════════════════════════════════════════════════════════
# PAYROLL MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class Payroll(BaseModel):
    """Monthly payroll record"""
    id: str
    hr_profile_id: str
    employee_code: str
    employee_name: str
    
    # Period
    period: str                         # YYYY-MM
    period_start: str
    period_end: str
    
    # Status
    status: PayrollStatus = PayrollStatus.DRAFT
    
    # ═══ EARNINGS (Khoản cộng) ═══
    base_salary: float = 0.0
    actual_work_days: float = 0.0       # Ngày công thực tế
    standard_work_days: float = 22.0    # Ngày công chuẩn
    
    # Allowances
    total_allowances: float = 0.0
    allowance_details: List[Dict[str, Any]] = []
    
    # Commission (from Finance module)
    total_commission: float = 0.0
    commission_details: List[Dict[str, Any]] = []
    
    # Overtime
    total_overtime: float = 0.0
    overtime_normal_hours: float = 0.0
    overtime_normal_amount: float = 0.0
    overtime_weekend_hours: float = 0.0
    overtime_weekend_amount: float = 0.0
    overtime_holiday_hours: float = 0.0
    overtime_holiday_amount: float = 0.0
    
    # Bonus (from KPI, rewards)
    total_bonus: float = 0.0
    bonus_details: List[Dict[str, Any]] = []
    
    # Holiday pay
    holiday_pay: float = 0.0
    
    # ═══ GROSS ═══
    gross_salary: float = 0.0
    
    # ═══ DEDUCTIONS (Khoản trừ) ═══
    # Insurance (employee contribution)
    social_insurance: float = 0.0       # BHXH 8%
    health_insurance: float = 0.0       # BHYT 1.5%
    unemployment_insurance: float = 0.0 # BHTN 1%
    total_insurance: float = 0.0
    
    # Tax
    taxable_income: float = 0.0
    personal_deduction: float = 11000000
    dependent_deduction: float = 0.0
    tax_dependents: int = 0
    personal_income_tax: float = 0.0    # TNCN
    
    # Penalties (from HR)
    total_penalties: float = 0.0
    penalty_details: List[Dict[str, Any]] = []
    
    # Advances
    total_advances: float = 0.0
    advance_details: List[Dict[str, Any]] = []
    
    # Other deductions
    total_other_deductions: float = 0.0
    other_deduction_details: List[Dict[str, Any]] = []
    
    # ═══ NET ═══
    net_salary: float = 0.0
    
    # Bank info
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    
    # Workflow
    calculated_at: Optional[str] = None
    calculated_by: Optional[str] = None
    
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None
    
    paid_at: Optional[str] = None
    paid_by: Optional[str] = None
    payment_reference: Optional[str] = None
    
    locked_at: Optional[str] = None
    locked_by: Optional[str] = None
    
    # Notes
    notes: Optional[str] = None
    
    # Audit
    created_at: str
    updated_at: str
    version: int = 1


class PayrollCalculationRequest(BaseModel):
    """Request to calculate payroll"""
    period: str                         # YYYY-MM
    hr_profile_ids: Optional[List[str]] = None  # None = all active employees


class PayrollApprovalRequest(BaseModel):
    """Request to approve payroll"""
    payroll_ids: List[str]
    notes: Optional[str] = None


class PayrollPaymentRequest(BaseModel):
    """Request to mark payroll as paid"""
    payroll_ids: List[str]
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# PAYROLL AUDIT LOG
# ═══════════════════════════════════════════════════════════════════════════════

class PayrollAuditLog(BaseModel):
    """Audit log for payroll access and changes"""
    id: str
    action: str                         # view, calculate, approve, pay, export
    payroll_id: Optional[str] = None
    hr_profile_id: Optional[str] = None
    period: Optional[str] = None
    
    actor_id: str
    actor_name: str
    actor_role: str
    actor_ip: Optional[str] = None
    actor_device: Optional[str] = None
    
    # For view actions
    viewed_fields: Optional[List[str]] = None
    
    # For changes
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    
    # Risk detection
    is_suspicious: bool = False
    risk_reason: Optional[str] = None
    
    timestamp: str


class SalaryViewLog(BaseModel):
    """Log for salary view access (sensitive)"""
    id: str
    viewer_id: str
    viewer_name: str
    viewer_role: str
    viewer_ip: Optional[str] = None
    
    target_hr_profile_id: str
    target_employee_code: str
    target_employee_name: str
    
    view_type: str                      # "own", "other"
    period: Optional[str] = None
    
    is_authorized: bool = True
    authorization_reason: Optional[str] = None
    
    timestamp: str


# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY & REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

class PayrollSummary(BaseModel):
    """Payroll summary for a period"""
    period: str
    total_employees: int = 0
    
    total_gross: float = 0.0
    total_net: float = 0.0
    total_tax: float = 0.0
    total_insurance: float = 0.0
    
    by_status: Dict[str, int] = {}
    by_department: List[Dict[str, Any]] = []
    
    created_at: str


class PayrollComparisonReport(BaseModel):
    """Compare payroll between periods"""
    period_1: str
    period_2: str
    
    headcount_change: int = 0
    gross_change: float = 0.0
    gross_change_percent: float = 0.0
    net_change: float = 0.0
    net_change_percent: float = 0.0
    
    significant_changes: List[Dict[str, Any]] = []  # Employees with big changes
