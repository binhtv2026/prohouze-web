"""
ProHouzing Core Enums - Master Taxonomy
Version: 1.0.0
Status: LOCKED FOR BUILD

All enumerations for the ProHouzing system.
These are the Single Source of Truth for all status and type values.
"""

from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# ORGANIZATION DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class OrgType(str, Enum):
    """Organization types"""
    COMPANY = "company"           # Main company
    BRANCH = "branch"             # Branch office
    AGENCY = "agency"             # Partner agency
    PARTNER = "partner"           # Distribution partner
    SUBSIDIARY = "subsidiary"     # Subsidiary company


class OrgStatus(str, Enum):
    """Organization status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING = "pending"


class UnitType(str, Enum):
    """Organizational unit types"""
    HQ = "hq"                     # Headquarters
    REGION = "region"             # Regional office
    BRANCH = "branch"             # Branch office
    DEPARTMENT = "department"     # Department
    TEAM = "team"                 # Team


# ═══════════════════════════════════════════════════════════════════════════════
# USER DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class UserType(str, Enum):
    """User types"""
    INTERNAL = "internal"         # Company employee
    EXTERNAL = "external"         # External user (partner, agency)
    SYSTEM = "system"             # System account


class EmploymentType(str, Enum):
    """Employment types"""
    FULLTIME = "fulltime"
    PARTTIME = "parttime"
    CONTRACT = "contract"
    CTV = "ctv"                   # Cộng tác viên
    INTERN = "intern"
    FREELANCE = "freelance"


class UserStatus(str, Enum):
    """User status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    LEFT = "left"
    PENDING = "pending"


class RoleCode(str, Enum):
    """Standard role codes"""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    CEO = "ceo"
    DIRECTOR = "director"
    MANAGER = "manager"
    TEAM_LEAD = "team_lead"
    SENIOR_SALES = "senior_sales"
    SALES = "sales"
    JUNIOR_SALES = "junior_sales"
    CTV = "ctv"
    SALES_ADMIN = "sales_admin"
    FINANCE = "finance"
    ACCOUNTANT = "accountant"
    LEGAL = "legal"
    MARKETING = "marketing"
    HR = "hr"
    SUPPORT = "support"
    VIEWER = "viewer"


class ScopeType(str, Enum):
    """Permission scope types"""
    GLOBAL = "global"             # All organizations
    ORG = "org"                   # Single organization
    UNIT = "unit"                 # Single unit
    PROJECT = "project"           # Single project
    TEAM = "team"                 # Single team


# ═══════════════════════════════════════════════════════════════════════════════
# CUSTOMER DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class Gender(str, Enum):
    """Gender options"""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class CustomerType(str, Enum):
    """Customer types"""
    INDIVIDUAL = "individual"
    COMPANY = "company"


class CustomerStage(str, Enum):
    """Customer lifecycle stage"""
    LEAD = "lead"                 # Just captured
    PROSPECT = "prospect"         # Qualified interest
    CUSTOMER = "customer"         # Made purchase
    VIP = "vip"                   # High value
    CHURNED = "churned"           # Lost/inactive


class QualificationLevel(str, Enum):
    """Lead/Customer qualification"""
    COLD = "cold"
    WARM = "warm"
    HOT = "hot"
    QUALIFIED = "qualified"


class IdentityType(str, Enum):
    """Customer identity types"""
    PHONE = "phone"
    EMAIL = "email"
    ZALO = "zalo"
    FACEBOOK = "facebook"
    TELEGRAM = "telegram"
    NATIONAL_ID = "national_id"
    PASSPORT = "passport"
    TAX_CODE = "tax_code"


class VerifiedStatus(str, Enum):
    """Identity verification status"""
    UNVERIFIED = "unverified"
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class ConsentStatus(str, Enum):
    """Marketing consent status"""
    PENDING = "pending"
    GRANTED = "granted"
    REVOKED = "revoked"


class AddressType(str, Enum):
    """Address types"""
    HOME = "home"
    WORK = "work"
    MAILING = "mailing"
    OTHER = "other"


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class ProjectType(str, Enum):
    """Real estate project types"""
    APARTMENT = "apartment"
    VILLA = "villa"
    TOWNHOUSE = "townhouse"
    COMMERCIAL = "commercial"
    LAND = "land"
    RESORT = "resort"
    MIXED = "mixed"
    OFFICE = "office"


class LegalStatus(str, Enum):
    """Project legal status"""
    PENDING = "pending"
    APPROVED = "approved"
    LICENSED = "licensed"
    COMPLETED = "completed"


class SellingStatus(str, Enum):
    """Project selling status"""
    UPCOMING = "upcoming"
    PRESALE = "presale"
    SELLING = "selling"
    CLOSING = "closing"
    SOLD_OUT = "sold_out"


class StructureType(str, Enum):
    """Project structure types"""
    PHASE = "phase"
    ZONE = "zone"
    BLOCK = "block"
    TOWER = "tower"
    BUILDING = "building"


class ProductType(str, Enum):
    """Product/Unit types"""
    APARTMENT = "apartment"
    VILLA = "villa"
    TOWNHOUSE = "townhouse"
    SHOPHOUSE = "shophouse"
    OFFICE = "office"
    LAND = "land"
    PARKING = "parking"
    STUDIO = "studio"
    PENTHOUSE = "penthouse"
    DUPLEX = "duplex"


class Direction(str, Enum):
    """Compass directions"""
    N = "N"
    S = "S"
    E = "E"
    W = "W"
    NE = "NE"
    NW = "NW"
    SE = "SE"
    SW = "SW"


class LegalType(str, Enum):
    """Property legal type"""
    FREEHOLD = "freehold"         # Sổ hồng/đỏ
    LEASEHOLD = "leasehold"       # Thuê dài hạn
    PENDING = "pending"           # Chưa có sổ


class HandoverStandard(str, Enum):
    """Handover finish standard"""
    BARE = "bare"                 # Thô
    BASIC = "basic"               # Cơ bản
    FULL = "full"                 # Hoàn thiện
    PREMIUM = "premium"           # Cao cấp


class InventoryStatus(str, Enum):
    """Product inventory status"""
    AVAILABLE = "available"       # Còn hàng
    HOLD = "hold"                 # Đang giữ tạm
    BOOKED = "booked"             # Đã đặt chỗ
    DEPOSITED = "deposited"       # Đã cọc
    CONTRACTED = "contracted"     # Đã ký HĐ
    SOLD = "sold"                 # Đã bán
    RETURNED = "returned"         # Đã trả lại


class BusinessStatus(str, Enum):
    """Product business status"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELISTED = "delisted"


class AvailabilityStatus(str, Enum):
    """Product availability for sale"""
    OPEN = "open"                 # Mở bán
    RESTRICTED = "restricted"     # Hạn chế
    RESERVED = "reserved"         # Đã đặt trước
    LOCKED = "locked"             # Khóa


class HolderType(str, Enum):
    """Who holds the product"""
    NONE = "none"
    ORG = "org"
    USER = "user"
    PARTNER = "partner"


class PriceType(str, Enum):
    """Price types"""
    LIST = "list"                 # Giá niêm yết
    SALE = "sale"                 # Giá bán
    SPECIAL = "special"           # Giá đặc biệt


# ═══════════════════════════════════════════════════════════════════════════════
# LEAD DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class SourceChannel(str, Enum):
    """Lead source channels"""
    WEBSITE = "website"
    FACEBOOK = "facebook"
    ZALO = "zalo"
    TIKTOK = "tiktok"
    GOOGLE = "google"
    YOUTUBE = "youtube"
    REFERRAL = "referral"
    DIRECT = "direct"
    EVENT = "event"
    CALL_CENTER = "call_center"
    WALK_IN = "walk_in"
    EMAIL = "email"
    SMS = "sms"
    OTHER = "other"


class LeadStatus(str, Enum):
    """Lead status"""
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    CONVERTED = "converted"
    LOST = "lost"
    INVALID = "invalid"


class IntentLevel(str, Enum):
    """Purchase intent level"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


# ═══════════════════════════════════════════════════════════════════════════════
# DEAL DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class SalesChannel(str, Enum):
    """Sales channels"""
    DIRECT = "direct"             # Direct sales
    AGENCY = "agency"             # Through agency
    ONLINE = "online"             # Online sale
    REFERRAL = "referral"         # Customer referral


class DealStage(str, Enum):
    """Deal pipeline stages"""
    NEW = "new"                   # Mới tạo
    QUALIFIED = "qualified"       # Đã sàng lọc
    VIEWING = "viewing"           # Đang xem nhà
    PROPOSAL = "proposal"         # Đề xuất giá
    NEGOTIATION = "negotiation"   # Đàm phán
    BOOKING = "booking"           # Giữ chỗ
    DEPOSIT = "deposit"           # Đặt cọc
    CONTRACT = "contract"         # Ký hợp đồng
    WON = "won"                   # Thành công
    LOST = "lost"                 # Mất deal
    CANCELLED = "cancelled"       # Hủy bỏ


class SourceRefType(str, Enum):
    """Deal source reference type"""
    LEAD = "lead"
    REFERRAL = "referral"
    DIRECT = "direct"
    AGENCY = "agency"


# ═══════════════════════════════════════════════════════════════════════════════
# BOOKING / DEPOSIT / CONTRACT DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class BookingStatus(str, Enum):
    """Booking status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    EXPIRED = "expired"
    CONVERTED = "converted"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class DepositStatus(str, Enum):
    """Deposit status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CONVERTED = "converted"
    CANCELLED = "cancelled"
    FORFEITED = "forfeited"
    REFUNDED = "refunded"


class ContractType(str, Enum):
    """Contract types"""
    SALE = "sale"
    LEASE = "lease"
    RESERVATION = "reservation"


class ContractStatus(str, Enum):
    """Contract status"""
    DRAFT = "draft"
    PENDING_SIGN = "pending_sign"
    SIGNED = "signed"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    CANCELLED = "cancelled"


class PaymentType(str, Enum):
    """Payment types"""
    BOOKING = "booking"
    DEPOSIT = "deposit"
    INSTALLMENT = "installment"
    MILESTONE = "milestone"
    FINAL = "final"
    PENALTY = "penalty"
    REFUND = "refund"


class PaymentMethod(str, Enum):
    """Payment methods"""
    CASH = "cash"
    TRANSFER = "transfer"
    CARD = "card"
    CHECK = "check"
    CRYPTO = "crypto"


class PaymentStatus(str, Enum):
    """Payment status"""
    SCHEDULED = "scheduled"
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


# ═══════════════════════════════════════════════════════════════════════════════
# COMMISSION DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionType(str, Enum):
    """Commission types"""
    SALES = "sales"               # Direct sales commission
    REFERRAL = "referral"         # Customer referral
    OVERRIDE = "override"         # Manager override
    BONUS = "bonus"               # Performance bonus
    AGENCY_F0 = "agency_f0"       # F0 agency commission
    AGENCY_F1 = "agency_f1"       # F1 sub-agency
    AGENCY_F2 = "agency_f2"       # F2 sub-agency
    ADJUSTMENT = "adjustment"     # Adjustment entry
    CLAWBACK = "clawback"         # Clawback/reversal


class RateType(str, Enum):
    """Commission rate type"""
    PERCENT = "percent"
    FIXED = "fixed"


class EarningStatus(str, Enum):
    """Commission earning status"""
    PENDING = "pending"           # Not yet earned
    EARNED = "earned"             # Earned/recognized
    CANCELLED = "cancelled"       # Cancelled


class PayoutStatus(str, Enum):
    """Commission payout status"""
    NOT_DUE = "not_due"           # Not yet due
    DUE = "due"                   # Due for payment
    PROCESSING = "processing"     # Being processed
    PAID = "paid"                 # Paid out
    HELD = "held"                 # On hold
    CANCELLED = "cancelled"       # Cancelled


class LevelCode(str, Enum):
    """Agency level codes"""
    DIRECT = "direct"             # Direct sale
    F0 = "F0"                     # Primary agency
    F1 = "F1"                     # Sub-agency level 1
    F2 = "F2"                     # Sub-agency level 2


# ═══════════════════════════════════════════════════════════════════════════════
# PARTNER DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class PartnerType(str, Enum):
    """Partner types"""
    AGENCY = "agency"
    DISTRIBUTOR = "distributor"
    BROKER = "broker"
    AFFILIATE = "affiliate"
    DEVELOPER = "developer"


class PartnerStatus(str, Enum):
    """Partner status"""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class EntityType(str, Enum):
    """Entity types for generic relations"""
    ORGANIZATION = "organization"
    USER = "user"
    CUSTOMER = "customer"
    LEAD = "lead"
    DEAL = "deal"
    PRODUCT = "product"
    PROJECT = "project"
    BOOKING = "booking"
    DEPOSIT = "deposit"
    CONTRACT = "contract"
    PAYMENT = "payment"
    TASK = "task"
    PARTNER = "partner"


class AssignmentType(str, Enum):
    """Assignment types"""
    OWNER = "owner"
    COLLABORATOR = "collaborator"
    WATCHER = "watcher"
    REVIEWER = "reviewer"
    APPROVER = "approver"


class EndReason(str, Enum):
    """Assignment end reasons"""
    TRANSFERRED = "transferred"
    COMPLETED = "completed"
    REVOKED = "revoked"


class TaskType(str, Enum):
    """Task types"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    VISIT = "visit"
    DOCUMENT = "document"
    FOLLOW_UP = "follow_up"
    REMINDER = "reminder"
    APPROVAL = "approval"
    OTHER = "other"


class TaskStatus(str, Enum):
    """Task status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class Priority(str, Enum):
    """Priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ═══════════════════════════════════════════════════════════════════════════════
# EVENT DOMAIN
# ═══════════════════════════════════════════════════════════════════════════════

class ActionCode(str, Enum):
    """Activity log action codes"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    ASSIGN = "assign"
    APPROVE = "approve"
    REJECT = "reject"
    EXPORT = "export"
    IMPORT = "import"
    LOGIN = "login"
    LOGOUT = "logout"
    STAGE_CHANGE = "stage_change"
    STATUS_CHANGE = "status_change"


class ProcessedStatus(str, Enum):
    """Event processing status"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


# ═══════════════════════════════════════════════════════════════════════════════
# COMMON
# ═══════════════════════════════════════════════════════════════════════════════

class Status(str, Enum):
    """Generic status"""
    ACTIVE = "active"
    INACTIVE = "inactive"


class SourceType(str, Enum):
    """Data source type"""
    MANUAL = "manual"
    IMPORT = "import"
    SYSTEM = "system"
    API = "api"
