"""
ProHouzing HR Models
Hồ sơ nhân sự 360° - Database Models

Architecture:
- User = Tài khoản đăng nhập (auth/account)
- HRProfile = Hồ sơ nhân sự 360° (link với User)

Mỗi nhân sự = 1 HRProfile duy nhất
Mọi thay đổi phải có audit log
"""

from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class MaritalStatus(str, Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"


class RelationshipType(str, Enum):
    SPOUSE = "spouse"           # Vợ/Chồng
    FATHER = "father"           # Cha
    MOTHER = "mother"           # Mẹ
    CHILD = "child"             # Con
    SIBLING = "sibling"         # Anh/Chị/Em
    GRANDPARENT = "grandparent" # Ông/Bà
    OTHER = "other"             # Khác


class EducationLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    VOCATIONAL = "vocational"
    COLLEGE = "college"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"
    OTHER = "other"


class EmploymentStatus(str, Enum):
    PROBATION = "probation"     # Thử việc
    OFFICIAL = "official"       # Chính thức
    COLLABORATOR = "collaborator"  # Cộng tác viên
    INTERN = "intern"           # Thực tập
    RESIGNED = "resigned"       # Đã nghỉ
    TERMINATED = "terminated"   # Đã sa thải


class ContractType(str, Enum):
    PROBATION = "probation"     # Hợp đồng thử việc
    FIXED_TERM = "fixed_term"   # Hợp đồng có thời hạn
    INDEFINITE = "indefinite"   # Hợp đồng không thời hạn
    COLLABORATOR = "collaborator"  # Hợp đồng CTV
    FREELANCE = "freelance"     # Freelance


class DocumentCategory(str, Enum):
    ID_CARD = "id_card"             # CCCD/CMND
    PASSPORT = "passport"           # Hộ chiếu
    HOUSEHOLD = "household"         # Hộ khẩu
    CV = "cv"                       # Sơ yếu lý lịch
    CONTRACT = "contract"           # Hợp đồng
    CERTIFICATE = "certificate"     # Bằng cấp/Chứng chỉ
    HEALTH_CHECK = "health_check"   # Giấy khám sức khỏe
    PHOTO = "photo"                 # Ảnh
    NDA = "nda"                     # Cam kết bảo mật
    OTHER = "other"                 # Khác


class RewardDisciplineType(str, Enum):
    REWARD = "reward"           # Khen thưởng
    DISCIPLINE = "discipline"   # Kỷ luật
    WARNING = "warning"         # Cảnh cáo
    PROMOTION = "promotion"     # Thăng chức
    DEMOTION = "demotion"       # Giáng chức


class OnboardingStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"


# ═══════════════════════════════════════════════════════════════════════════════
# HR PROFILE - Core Model
# ═══════════════════════════════════════════════════════════════════════════════

class HRProfileBase(BaseModel):
    """Base fields for HR Profile"""
    # Link to User
    user_id: str
    
    # Personal Info
    full_name: str
    full_name_unsigned: Optional[str] = None  # For search
    date_of_birth: Optional[str] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    
    # Identification
    id_number: Optional[str] = None  # CCCD/CMND
    id_issue_date: Optional[str] = None
    id_issue_place: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    tax_code: Optional[str] = None
    social_insurance_number: Optional[str] = None
    
    # Contact
    phone: Optional[str] = None
    phone_secondary: Optional[str] = None
    email_personal: Optional[str] = None
    
    # Address
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    hometown: Optional[str] = None
    nationality: Optional[str] = "Việt Nam"
    ethnicity: Optional[str] = "Kinh"
    religion: Optional[str] = None
    
    # Photo
    avatar_url: Optional[str] = None
    
    # Bank Info
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None


class HRProfile(HRProfileBase):
    """Full HR Profile with metadata"""
    id: str
    employee_code: Optional[str] = None  # Mã nhân viên
    
    # Employment at ProHouzing
    join_date: Optional[str] = None
    employment_status: EmploymentStatus = EmploymentStatus.PROBATION
    current_team_id: Optional[str] = None
    current_position: Optional[str] = None
    current_leader_id: Optional[str] = None
    
    # Onboarding
    onboarding_status: OnboardingStatus = OnboardingStatus.PENDING
    onboarding_completed_at: Optional[str] = None
    
    # Stats (denormalized for quick access)
    total_deals: int = 0
    total_revenue: float = 0
    total_commission: float = 0
    
    # Completeness
    profile_completeness: int = 0  # 0-100%
    missing_documents: List[str] = []
    
    # Metadata
    created_at: str
    updated_at: str
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    is_active: bool = True


class HRProfileCreate(BaseModel):
    """Create HR Profile request"""
    # user_id is optional - can be auto-generated or linked later
    user_id: Optional[str] = None
    
    # Personal Info
    full_name: str
    date_of_birth: Optional[str] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    
    # Identification
    id_number: Optional[str] = None
    id_issue_date: Optional[str] = None
    id_issue_place: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    tax_code: Optional[str] = None
    social_insurance_number: Optional[str] = None
    
    # Contact
    phone: Optional[str] = None
    phone_secondary: Optional[str] = None
    email_personal: Optional[str] = None
    
    # Address
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    hometown: Optional[str] = None
    nationality: Optional[str] = "Việt Nam"
    ethnicity: Optional[str] = "Kinh"
    religion: Optional[str] = None
    
    # Bank Info
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    
    # Employment
    join_date: Optional[str] = None
    employment_status: Optional[EmploymentStatus] = EmploymentStatus.PROBATION
    current_position: Optional[str] = None


class HRProfileUpdate(BaseModel):
    """Update HR Profile request - all fields optional"""
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[Gender] = None
    marital_status: Optional[MaritalStatus] = None
    id_number: Optional[str] = None
    id_issue_date: Optional[str] = None
    id_issue_place: Optional[str] = None
    passport_number: Optional[str] = None
    passport_expiry: Optional[str] = None
    tax_code: Optional[str] = None
    social_insurance_number: Optional[str] = None
    phone: Optional[str] = None
    phone_secondary: Optional[str] = None
    email_personal: Optional[str] = None
    permanent_address: Optional[str] = None
    current_address: Optional[str] = None
    hometown: Optional[str] = None
    nationality: Optional[str] = None
    ethnicity: Optional[str] = None
    religion: Optional[str] = None
    avatar_url: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    bank_branch: Optional[str] = None
    employment_status: Optional[EmploymentStatus] = None
    current_team_id: Optional[str] = None
    current_position: Optional[str] = None
    current_leader_id: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# FAMILY MEMBER - Nhân thân
# ═══════════════════════════════════════════════════════════════════════════════

class FamilyMember(BaseModel):
    """Thông tin nhân thân / Liên hệ khẩn cấp"""
    id: str
    hr_profile_id: str
    
    full_name: str
    relationship: RelationshipType
    year_of_birth: Optional[int] = None
    occupation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    
    is_emergency_contact: bool = False  # Liên hệ khẩn cấp
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class FamilyMemberCreate(BaseModel):
    """Create Family Member"""
    full_name: str
    relationship: RelationshipType
    year_of_birth: Optional[int] = None
    occupation: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_emergency_contact: bool = False
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# EDUCATION - Học vấn
# ═══════════════════════════════════════════════════════════════════════════════

class Education(BaseModel):
    """Quá trình học tập"""
    id: str
    hr_profile_id: str
    
    institution: str  # Tên trường
    degree: Optional[str] = None  # Bằng cấp
    major: Optional[str] = None  # Ngành học
    level: EducationLevel = EducationLevel.BACHELOR
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    
    gpa: Optional[float] = None
    ranking: Optional[str] = None  # Xếp loại
    
    certificate_file_id: Optional[str] = None  # Link to HRDocument
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class EducationCreate(BaseModel):
    """Create Education"""
    institution: str
    degree: Optional[str] = None
    major: Optional[str] = None
    level: EducationLevel = EducationLevel.BACHELOR
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    gpa: Optional[float] = None
    ranking: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# WORK HISTORY - Quá trình công tác (trước ProHouzing)
# ═══════════════════════════════════════════════════════════════════════════════

class WorkHistory(BaseModel):
    """Quá trình công tác trước khi vào ProHouzing"""
    id: str
    hr_profile_id: str
    
    company: str
    position: str
    department: Optional[str] = None
    
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None
    reason_for_leaving: Optional[str] = None
    
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class WorkHistoryCreate(BaseModel):
    """Create Work History"""
    company: str
    position: str
    department: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: Optional[str] = None
    achievements: Optional[str] = None
    reason_for_leaving: Optional[str] = None
    reference_name: Optional[str] = None
    reference_phone: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# CERTIFICATE - Bằng cấp & Chứng chỉ
# ═══════════════════════════════════════════════════════════════════════════════

class Certificate(BaseModel):
    """Bằng cấp & Chứng chỉ"""
    id: str
    hr_profile_id: str
    
    name: str  # Tên bằng/chứng chỉ
    issuer: str  # Đơn vị cấp
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    
    certificate_number: Optional[str] = None
    level: Optional[str] = None  # Cấp độ (nếu có)
    score: Optional[str] = None  # Điểm (nếu có)
    
    file_id: Optional[str] = None  # Link to HRDocument
    is_verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class CertificateCreate(BaseModel):
    """Create Certificate"""
    name: str
    issuer: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    certificate_number: Optional[str] = None
    level: Optional[str] = None
    score: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# HR DOCUMENT - Tài liệu hồ sơ (với version control)
# ═══════════════════════════════════════════════════════════════════════════════

class HRDocument(BaseModel):
    """
    Tài liệu hồ sơ nhân sự
    - Version control: mỗi upload tạo version mới
    - Không overwrite, giữ lịch sử
    """
    id: str
    hr_profile_id: str
    
    # Document info
    name: str
    category: DocumentCategory
    description: Optional[str] = None
    
    # File info
    file_path: str
    file_name: str
    file_size: int  # bytes
    file_type: str  # MIME type
    
    # Version control
    version: int = 1
    parent_id: Optional[str] = None  # Previous version
    is_latest: bool = True
    
    # Verification
    is_verified: bool = False
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    
    # Expiry (for contracts, ID cards, etc.)
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    
    # Metadata
    uploaded_by: str
    uploaded_at: str
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class HRDocumentCreate(BaseModel):
    """Create Document metadata (file uploaded separately)"""
    name: str
    category: DocumentCategory
    description: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# INTERNAL WORK HISTORY - Công tác tại ProHouzing
# ═══════════════════════════════════════════════════════════════════════════════

class InternalWorkHistory(BaseModel):
    """
    Lịch sử công tác tại ProHouzing
    - Thay đổi team, vị trí, leader
    """
    id: str
    hr_profile_id: str
    
    # Position info
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    position: str
    leader_id: Optional[str] = None
    leader_name: Optional[str] = None
    
    # Duration
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = True
    
    # Change info
    change_type: str  # join, transfer, promotion, demotion, resignation
    change_reason: Optional[str] = None
    approved_by: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT - Hợp đồng lao động
# ═══════════════════════════════════════════════════════════════════════════════

class EmploymentContract(BaseModel):
    """Hợp đồng lao động"""
    id: str
    hr_profile_id: str
    
    contract_number: str
    contract_type: ContractType
    
    start_date: str
    end_date: Optional[str] = None  # None = vô thời hạn
    
    position: str
    department: Optional[str] = None
    base_salary: Optional[float] = None
    
    # Signing
    signed_date: Optional[str] = None
    signed_by_employee: bool = False
    signed_by_company: bool = False
    signed_by_company_id: Optional[str] = None
    
    # Document
    document_id: Optional[str] = None  # Link to HRDocument
    
    # Status
    status: str = "draft"  # draft, active, expired, terminated
    termination_date: Optional[str] = None
    termination_reason: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# REWARD & DISCIPLINE - Khen thưởng & Kỷ luật
# ═══════════════════════════════════════════════════════════════════════════════

class RewardDiscipline(BaseModel):
    """Khen thưởng / Kỷ luật"""
    id: str
    hr_profile_id: str
    
    type: RewardDisciplineType
    title: str
    description: Optional[str] = None
    
    effective_date: str
    
    # For rewards
    reward_amount: Optional[float] = None
    reward_type: Optional[str] = None  # cash, gift, certificate
    
    # For discipline
    severity: Optional[str] = None  # mild, moderate, severe
    duration: Optional[str] = None  # Duration of discipline
    
    # Approval
    approved_by: str
    approved_by_name: Optional[str] = None
    approved_at: str
    
    # Document
    document_id: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_at: str
    updated_at: str


class RewardDisciplineCreate(BaseModel):
    """Create Reward/Discipline"""
    type: RewardDisciplineType
    title: str
    description: Optional[str] = None
    effective_date: str
    reward_amount: Optional[float] = None
    reward_type: Optional[str] = None
    severity: Optional[str] = None
    duration: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# KPI RECORD - Lịch sử KPI
# ═══════════════════════════════════════════════════════════════════════════════

class KPIRecord(BaseModel):
    """Lịch sử KPI theo tháng"""
    id: str
    hr_profile_id: str
    
    period_month: int
    period_year: int
    
    # Performance
    deals_count: int = 0
    deals_value: float = 0
    revenue: float = 0
    commission_earned: float = 0
    
    # KPI metrics
    kpi_target: Optional[float] = None
    kpi_achieved: Optional[float] = None
    kpi_percentage: Optional[float] = None
    
    # Rating
    rating: Optional[str] = None  # A, B, C, D, E
    reviewer_id: Optional[str] = None
    reviewer_name: Optional[str] = None
    review_date: Optional[str] = None
    review_notes: Optional[str] = None
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# ONBOARDING CHECKLIST - Checklist nhập việc
# ═══════════════════════════════════════════════════════════════════════════════

class OnboardingChecklistItem(BaseModel):
    """Checklist item cho onboarding"""
    id: str
    hr_profile_id: str
    
    item_code: str  # Unique code for the checklist item
    item_name: str
    category: str  # documents, training, setup, etc.
    
    is_required: bool = True
    is_completed: bool = False
    completed_at: Optional[str] = None
    completed_by: Optional[str] = None
    
    due_date: Optional[str] = None
    notes: Optional[str] = None
    
    # Link to document if applicable
    document_id: Optional[str] = None
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# HR ALERT - Cảnh báo cho HR
# ═══════════════════════════════════════════════════════════════════════════════

class HRAlert(BaseModel):
    """Cảnh báo HR"""
    id: str
    hr_profile_id: str
    
    alert_type: str  # missing_document, contract_expiry, kpi_review, etc.
    title: str
    description: Optional[str] = None
    
    severity: str = "medium"  # low, medium, high, critical
    due_date: Optional[str] = None
    
    is_resolved: bool = False
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    
    created_at: str
    updated_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# COLLECTION NAMES
# ═══════════════════════════════════════════════════════════════════════════════

HR_COLLECTIONS = {
    "profiles": "hr_profiles",
    "family": "hr_family_members",
    "education": "hr_education",
    "work_history": "hr_work_history",
    "certificates": "hr_certificates",
    "documents": "hr_documents",
    "internal_history": "hr_internal_history",
    "contracts": "hr_contracts",
    "rewards": "hr_rewards_discipline",
    "kpi": "hr_kpi_records",
    "onboarding": "hr_onboarding_checklist",
    "alerts": "hr_alerts",
}
