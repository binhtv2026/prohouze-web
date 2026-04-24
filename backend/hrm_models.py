"""
ProHouzing HRM Module - Human Resource Management
Quản lý nhân sự: Sơ đồ tổ chức, Vị trí công việc, Cộng tác viên
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone

# ==================== ENUMS ====================

class EmploymentType(str, Enum):
    FULL_TIME = "full_time"  # Nhân viên chính thức
    PART_TIME = "part_time"  # Bán thời gian
    PROBATION = "probation"  # Thử việc
    INTERN = "intern"  # Thực tập
    COLLABORATOR = "collaborator"  # Cộng tác viên (CTV)
    CONTRACTOR = "contractor"  # Hợp đồng dịch vụ

class OrgUnitType(str, Enum):
    COMPANY = "company"  # Công ty
    BRANCH = "branch"  # Chi nhánh
    DEPARTMENT = "department"  # Phòng ban
    TEAM = "team"  # Team/Nhóm
    GROUP = "group"  # Tổ/Nhóm nhỏ

class CommissionType(str, Enum):
    FIXED = "fixed"  # Cố định
    PERCENTAGE = "percentage"  # Phần trăm
    TIERED = "tiered"  # Theo tầng

class CollaboratorStatus(str, Enum):
    PENDING = "pending"  # Chờ duyệt
    ACTIVE = "active"  # Đang hoạt động
    INACTIVE = "inactive"  # Ngưng hoạt động
    SUSPENDED = "suspended"  # Tạm ngưng
    TERMINATED = "terminated"  # Đã chấm dứt

# ==================== ORGANIZATION MODELS ====================

class OrgUnitCreate(BaseModel):
    """Model tạo đơn vị tổ chức"""
    name: str
    code: str  # Mã đơn vị (VD: HN001, SG002)
    type: OrgUnitType
    parent_id: Optional[str] = None  # ID của đơn vị cha
    manager_id: Optional[str] = None  # ID người quản lý
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    settings: Dict[str, Any] = {}  # Cài đặt riêng cho đơn vị
    order: int = 0  # Thứ tự hiển thị

class OrgUnitResponse(BaseModel):
    """Model trả về đơn vị tổ chức"""
    id: str
    name: str
    code: str
    type: OrgUnitType
    parent_id: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    settings: Dict[str, Any] = {}
    order: int = 0
    level: int = 0  # Cấp độ trong cây (0 = gốc)
    path: str = ""  # Đường dẫn đầy đủ (VD: /company/branch/dept)
    employee_count: int = 0
    children_count: int = 0
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

class OrgTreeNode(BaseModel):
    """Node trong cây tổ chức"""
    id: str
    name: str
    code: str
    type: OrgUnitType
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    manager_avatar: Optional[str] = None
    employee_count: int = 0
    children: List["OrgTreeNode"] = []

# ==================== JOB POSITION MODELS ====================

class JobPositionCreate(BaseModel):
    """Model tạo vị trí công việc"""
    title: str  # Tên vị trí (Sales Executive, Team Lead, etc.)
    code: str  # Mã vị trí
    department_type: str  # Phòng ban áp dụng
    level: int = 1  # Cấp bậc (1-10)
    description: Optional[str] = None  # Mô tả công việc
    responsibilities: List[str] = []  # Trách nhiệm
    requirements: List[str] = []  # Yêu cầu
    skills: List[str] = []  # Kỹ năng cần có
    salary_min: Optional[float] = None  # Lương tối thiểu
    salary_max: Optional[float] = None  # Lương tối đa
    kpi_targets: Dict[str, Any] = {}  # Mục tiêu KPI
    permissions: List[str] = []  # Quyền hạn trong hệ thống
    is_management: bool = False  # Có phải vị trí quản lý không

class JobPositionResponse(BaseModel):
    """Model trả về vị trí công việc"""
    id: str
    title: str
    code: str
    department_type: str
    level: int
    description: Optional[str] = None
    responsibilities: List[str] = []
    requirements: List[str] = []
    skills: List[str] = []
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    kpi_targets: Dict[str, Any] = {}
    permissions: List[str] = []
    is_management: bool = False
    employee_count: int = 0  # Số nhân viên đang giữ vị trí này
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

# ==================== EMPLOYEE EXTENDED MODELS ====================

class EmployeeProfileCreate(BaseModel):
    """Model tạo/cập nhật hồ sơ nhân sự mở rộng"""
    user_id: str
    # Thông tin cá nhân
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None  # male, female, other
    id_number: Optional[str] = None  # CCCD/CMND
    id_issue_date: Optional[str] = None
    id_issue_place: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    # Thông tin công việc
    position_id: Optional[str] = None  # ID vị trí công việc
    org_unit_id: Optional[str] = None  # ID đơn vị tổ chức
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    join_date: Optional[str] = None  # Ngày vào làm
    contract_start: Optional[str] = None
    contract_end: Optional[str] = None
    probation_end: Optional[str] = None
    # Quản lý
    manager_ids: List[str] = []  # Tối đa 3 manager (M1, M2, M3)
    # Kỹ năng & chuyên môn
    education: List[Dict[str, Any]] = []  # Học vấn
    certifications: List[Dict[str, Any]] = []  # Chứng chỉ
    work_history: List[Dict[str, Any]] = []  # Lịch sử công tác
    skills: List[str] = []
    specializations: List[str] = []  # Dự án chuyên môn
    regions: List[str] = []  # Vùng phụ trách
    # Ngân hàng
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_branch: Optional[str] = None
    # Ghi chú
    notes: Optional[str] = None

class EmployeeProfileResponse(BaseModel):
    """Model trả về hồ sơ nhân sự"""
    id: str
    user_id: str
    user_email: str
    user_name: str
    user_phone: Optional[str] = None
    user_avatar: Optional[str] = None
    # Thông tin cá nhân
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    id_number: Optional[str] = None
    id_issue_date: Optional[str] = None
    id_issue_place: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    # Thông tin công việc
    position_id: Optional[str] = None
    position_title: Optional[str] = None
    org_unit_id: Optional[str] = None
    org_unit_name: Optional[str] = None
    org_unit_path: Optional[str] = None
    employment_type: EmploymentType = EmploymentType.FULL_TIME
    join_date: Optional[str] = None
    contract_start: Optional[str] = None
    contract_end: Optional[str] = None
    probation_end: Optional[str] = None
    tenure_days: int = 0  # Số ngày làm việc
    # Quản lý
    manager_ids: List[str] = []
    managers: List[Dict[str, Any]] = []  # Thông tin managers
    # Kỹ năng
    education: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    work_history: List[Dict[str, Any]] = []
    skills: List[str] = []
    specializations: List[str] = []
    regions: List[str] = []
    # Hiệu suất
    performance_score: float = 0
    current_workload: int = 0
    total_leads: int = 0
    total_deals: int = 0
    conversion_rate: float = 0
    # Trạng thái
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

# ==================== COLLABORATOR (CTV) MODELS ====================

class CommissionTier(BaseModel):
    """Tầng hoa hồng"""
    min_deals: int  # Số deal tối thiểu
    max_deals: Optional[int] = None  # Số deal tối đa (None = không giới hạn)
    rate: float  # Tỷ lệ hoa hồng (%)
    bonus: float = 0  # Thưởng cố định thêm

class CommissionPolicyCreate(BaseModel):
    """Model tạo chính sách hoa hồng"""
    name: str
    code: str
    type: CommissionType = CommissionType.TIERED
    description: Optional[str] = None
    # Cho loại FIXED
    fixed_amount: Optional[float] = None
    # Cho loại PERCENTAGE
    percentage: Optional[float] = None
    # Cho loại TIERED
    tiers: List[CommissionTier] = []
    # Điều kiện áp dụng
    min_deal_value: Optional[float] = None  # Giá trị deal tối thiểu
    project_ids: List[str] = []  # Áp dụng cho dự án cụ thể (rỗng = tất cả)
    is_active: bool = True

class CommissionPolicyResponse(BaseModel):
    """Model trả về chính sách hoa hồng"""
    id: str
    name: str
    code: str
    type: CommissionType
    description: Optional[str] = None
    fixed_amount: Optional[float] = None
    percentage: Optional[float] = None
    tiers: List[CommissionTier] = []
    min_deal_value: Optional[float] = None
    project_ids: List[str] = []
    collaborator_count: int = 0  # Số CTV đang áp dụng
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

class CollaboratorCreate(BaseModel):
    """Model tạo cộng tác viên"""
    # Thông tin cơ bản
    full_name: str
    phone: str
    email: Optional[str] = None
    id_number: Optional[str] = None  # CCCD
    address: Optional[str] = None
    # Nguồn giới thiệu
    referrer_id: Optional[str] = None  # ID người giới thiệu (nhân viên hoặc CTV khác)
    referrer_type: Optional[str] = None  # "employee" hoặc "collaborator"
    # Chính sách
    commission_policy_id: Optional[str] = None
    # Ngân hàng
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_branch: Optional[str] = None
    # Gán cho
    assigned_to_id: Optional[str] = None  # ID nhân viên quản lý CTV này
    org_unit_id: Optional[str] = None  # Thuộc đơn vị nào
    # Ghi chú
    notes: Optional[str] = None

class CollaboratorResponse(BaseModel):
    """Model trả về cộng tác viên"""
    id: str
    code: str  # Mã CTV tự động (VD: CTV001)
    full_name: str
    phone: str
    email: Optional[str] = None
    id_number: Optional[str] = None
    address: Optional[str] = None
    # Nguồn
    referrer_id: Optional[str] = None
    referrer_name: Optional[str] = None
    referrer_type: Optional[str] = None
    # Chính sách
    commission_policy_id: Optional[str] = None
    commission_policy_name: Optional[str] = None
    # Ngân hàng
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_branch: Optional[str] = None
    # Quản lý
    assigned_to_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    org_unit_id: Optional[str] = None
    org_unit_name: Optional[str] = None
    # Thống kê
    total_leads_referred: int = 0
    total_deals_closed: int = 0
    total_deal_value: float = 0
    total_commission_earned: float = 0
    total_commission_paid: float = 0
    pending_commission: float = 0
    conversion_rate: float = 0
    # Trạng thái
    status: CollaboratorStatus = CollaboratorStatus.PENDING
    join_date: str
    last_activity: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

class CollaboratorCommission(BaseModel):
    """Model hoa hồng của CTV"""
    id: str
    collaborator_id: str
    collaborator_name: str
    deal_id: str
    deal_value: float
    commission_rate: float
    commission_amount: float
    status: str  # pending, approved, paid, cancelled
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None
    payment_ref: Optional[str] = None
    notes: Optional[str] = None
    created_at: str

# ==================== PERMISSION MODELS ====================

class PermissionSet(BaseModel):
    """Bộ quyền cho từng cấp"""
    # Quản lý nhân sự
    can_view_org_chart: bool = False
    can_edit_org_chart: bool = False
    can_manage_positions: bool = False
    can_manage_employees: bool = False
    can_manage_collaborators: bool = False
    can_approve_collaborators: bool = False
    can_manage_commission_policies: bool = False
    can_approve_commissions: bool = False
    can_view_salary: bool = False
    # Quản lý lead
    can_view_all_leads: bool = False
    can_assign_leads: bool = False
    can_transfer_leads: bool = False
    # Báo cáo
    can_view_reports: bool = False
    can_export_data: bool = False
    # Cài đặt
    can_manage_settings: bool = False
    can_manage_users: bool = False
    # Custom permissions
    custom: Dict[str, bool] = {}

class OrgUnitPermission(BaseModel):
    """Cấu hình quyền cho đơn vị tổ chức"""
    org_unit_id: str
    role: str  # Role áp dụng
    permissions: PermissionSet
