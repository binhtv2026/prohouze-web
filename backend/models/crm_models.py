"""
ProHouzing CRM Domain Models - V2 (Revised)
Prompt 6/20 - CRM Unified Profile Standardization

ARCHITECTURE PRINCIPLES:
1. Contact = Single source of truth for identity
2. Customer is NOT a separate entity (Contact.status = 'customer')
3. Lead → Deal → Booking → Contract flow
4. UnifiedProfile is aggregation, not database model

Entity Hierarchy:
┌─────────────┐
│   CONTACT   │  ← Single identity (Person/Company)
│  status:    │
│  - lead     │
│  - prospect │
│  - customer │
│  - vip      │
└──────┬──────┘
       │
       ├── Leads (N)       ← Raw inquiries
       ├── Deals (N)       ← Active transactions  
       ├── Bookings (N)    ← Product reservations
       ├── Contracts (N)   ← Signed agreements
       └── DemandProfiles  ← Structured needs
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# ============================================
# ENUMS - CONTACT & LEAD LIFECYCLE
# ============================================

class ContactStatus(str, Enum):
    """Contact classification status"""
    LEAD = "lead"              # Raw inquiry, not yet qualified
    PROSPECT = "prospect"      # Qualified, showing interest
    CUSTOMER = "customer"      # Has completed transaction
    VIP = "vip"               # High-value customer
    INACTIVE = "inactive"      # No activity > 6 months
    BLACKLIST = "blacklist"    # Do not contact


class ContactType(str, Enum):
    """Type of contact identity"""
    INDIVIDUAL = "individual"      # Cá nhân
    CORPORATE = "corporate"        # Doanh nghiệp/Pháp nhân
    REPRESENTATIVE = "representative"  # Người đại diện


class LeadStage(str, Enum):
    """Lead lifecycle stages (inquiry processing)"""
    # Initial
    RAW = "raw"                    # Mới nhập, chưa xử lý
    VERIFIED = "verified"          # Đã xác minh thông tin
    
    # Engagement
    CONTACTED = "contacted"        # Đã liên hệ lần đầu
    RESPONDED = "responded"        # Khách đã phản hồi
    ENGAGED = "engaged"            # Đang tương tác tích cực
    
    # Qualification
    QUALIFYING = "qualifying"      # Đang đánh giá
    QUALIFIED = "qualified"        # Đủ điều kiện → Create Deal
    DISQUALIFIED = "disqualified"  # Không phù hợp
    
    # Terminal
    CONVERTED = "converted"        # Đã tạo Deal
    LOST = "lost"                  # Mất
    RECYCLED = "recycled"          # Quay lại nurturing


class DealStage(str, Enum):
    """Deal lifecycle stages (transaction processing)"""
    # Pre-transaction
    NEGOTIATING = "negotiating"    # Đang đàm phán
    SITE_VISIT = "site_visit"      # Đã/sẽ xem nhà
    PROPOSAL_SENT = "proposal_sent" # Đã gửi báo giá
    
    # Transaction
    BOOKING = "booking"            # Đang giữ chỗ
    DEPOSITED = "deposited"        # Đã đặt cọc
    CONTRACTING = "contracting"    # Đang làm hợp đồng
    CONTRACTED = "contracted"      # Đã ký hợp đồng
    
    # Post-transaction
    PAYMENT_PROGRESS = "payment_progress"  # Đang thanh toán
    HANDOVER_PENDING = "handover_pending"  # Chờ bàn giao
    COMPLETED = "completed"        # Hoàn tất
    
    # Terminal
    CANCELLED = "cancelled"        # Hủy
    LOST = "lost"                  # Mất


class DemandUrgency(str, Enum):
    """How urgent is the need"""
    IMMEDIATE = "immediate"        # Cần ngay (< 1 tháng)
    SHORT_TERM = "short_term"      # Ngắn hạn (1-3 tháng)
    MEDIUM_TERM = "medium_term"    # Trung hạn (3-6 tháng)
    LONG_TERM = "long_term"        # Dài hạn (> 6 tháng)
    EXPLORING = "exploring"        # Chỉ tìm hiểu


class DemandPurpose(str, Enum):
    """Purpose of property purchase"""
    RESIDENCE = "residence"        # Để ở
    INVESTMENT = "investment"      # Đầu tư cho thuê
    FLIP = "flip"                 # Đầu tư lướt sóng
    BOTH = "both"                  # Vừa ở vừa đầu tư
    BUSINESS = "business"          # Kinh doanh
    GIFT = "gift"                  # Tặng/cho con cái


class InteractionType(str, Enum):
    """Types of CRM interactions"""
    # Communication
    CALL_OUTBOUND = "call_outbound"
    CALL_INBOUND = "call_inbound"
    CALL_MISSED = "call_missed"
    SMS = "sms"
    EMAIL = "email"
    ZNS = "zns"
    CHAT = "chat"
    
    # Meeting
    MEETING = "meeting"
    SITE_VISIT = "site_visit"
    
    # Notes & Updates
    NOTE = "note"
    STAGE_CHANGE = "stage_change"
    STATUS_CHANGE = "status_change"
    
    # Assignment
    ASSIGNMENT = "assignment"
    REASSIGNMENT = "reassignment"
    
    # Demand
    DEMAND_UPDATE = "demand_update"
    DEMAND_MATCH = "demand_match"
    PRODUCT_PRESENTED = "product_presented"
    
    # Transaction
    DEAL_CREATED = "deal_created"
    BOOKING_CREATED = "booking_created"
    DEPOSIT_RECEIVED = "deposit_received"
    CONTRACT_SIGNED = "contract_signed"
    
    # System
    SYSTEM = "system"
    AUTO_ACTION = "auto_action"
    DUPLICATE_MERGE = "duplicate_merge"


class InteractionOutcome(str, Enum):
    """Outcome of an interaction"""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    WRONG_NUMBER = "wrong_number"
    CALLBACK_REQUESTED = "callback_requested"
    MEETING_SCHEDULED = "meeting_scheduled"
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    NEEDS_MORE_INFO = "needs_more_info"


# ============================================
# CONTACT MODEL (Single Source of Identity)
# ============================================

class ContactCreate(BaseModel):
    """
    Contact = THE identity record
    Whether lead, prospect, or customer - all are Contacts
    """
    # Core Identity
    full_name: str = Field(..., min_length=1, description="Họ tên đầy đủ")
    phone: str = Field(..., min_length=9, description="Số điện thoại chính")
    phone_secondary: Optional[str] = None
    email: Optional[EmailStr] = None
    email_secondary: Optional[str] = None
    
    # Contact Type & Status
    contact_type: ContactType = ContactType.INDIVIDUAL
    status: ContactStatus = ContactStatus.LEAD  # Default: new contacts are leads
    
    # Personal Info (Individual)
    gender: Optional[str] = None  # male/female/other
    date_of_birth: Optional[str] = None
    year_of_birth: Optional[int] = None
    id_number: Optional[str] = None  # CCCD/CMND
    id_issued_date: Optional[str] = None
    id_issued_place: Optional[str] = None
    
    # Address
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    country: str = "Vietnam"
    
    # Corporate Info (if corporate)
    company_name: Optional[str] = None
    company_tax_code: Optional[str] = None
    company_position: Optional[str] = None
    company_address: Optional[str] = None
    
    # Social & Communication
    zalo_phone: Optional[str] = None
    facebook_id: Optional[str] = None
    facebook_url: Optional[str] = None
    
    # Source Attribution (first touch)
    original_source: Optional[str] = None
    original_source_detail: Optional[str] = None
    original_campaign_id: Optional[str] = None
    original_content_id: Optional[str] = None
    
    # Referral
    referrer_id: Optional[str] = None
    referrer_type: Optional[str] = None  # collaborator/employee/customer
    
    # Segment & Tags
    segment: Optional[str] = None  # vip/high_value/mid_value/standard/entry
    tags: List[str] = []
    
    # Organization Assignment
    assigned_to: Optional[str] = None
    branch_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Priority & VIP
    is_vip: bool = False
    priority: str = "normal"  # low/normal/high/urgent
    
    # Notes
    notes: Optional[str] = None


class ContactResponse(ContactCreate):
    """Contact response with computed fields"""
    id: str
    
    # Display helpers
    phone_masked: str = ""
    display_name: str = ""  # Full name + company if corporate
    
    # Segment info
    segment_label: str = ""
    segment_color: str = ""
    
    # Assignment info
    assigned_to_name: Optional[str] = None
    branch_name: Optional[str] = None
    team_name: Optional[str] = None
    
    # Referrer info
    referrer_name: Optional[str] = None
    
    # Summary stats
    total_leads: int = 0
    total_deals: int = 0
    total_bookings: int = 0
    total_contracts: int = 0
    total_transaction_value: float = 0
    
    # Demand
    active_demand_profile_id: Optional[str] = None
    demand_summary: Optional[str] = None  # "2-3 tỷ, 2PN, Q7"
    
    # Activity
    total_interactions: int = 0
    last_interaction_at: Optional[str] = None
    last_interaction_type: Optional[str] = None
    next_follow_up: Optional[str] = None
    days_since_last_contact: Optional[int] = None
    
    # Duplicate detection
    is_primary: bool = True
    merged_contact_ids: List[str] = []
    potential_duplicate_ids: List[str] = []
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    first_transaction_at: Optional[str] = None  # When became customer
    last_transaction_at: Optional[str] = None


# ============================================
# LEAD MODEL (Inquiry Record)
# ============================================

class LeadCreate(BaseModel):
    """
    Lead = An inquiry/interest from a Contact
    One Contact can have multiple Leads over time
    """
    # Contact link
    contact_id: Optional[str] = None  # Link to existing contact
    
    # Or create new contact inline
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Source Attribution (Prompt 7/20 enhanced)
    source: str = "website"
    source_detail: Optional[str] = None
    lead_source_id: Optional[str] = None      # Link to lead_sources collection
    channel_id: Optional[str] = None
    channel_user_id: Optional[str] = None
    campaign_id: Optional[str] = None          # Link to campaigns collection
    content_id: Optional[str] = None
    landing_page_url: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None
    
    # Referral
    referrer_id: Optional[str] = None
    referrer_type: Optional[str] = None
    
    # Initial Interest (brief)
    project_interest: Optional[str] = None
    project_ids: List[str] = []  # Link to Prompt 5 projects
    product_type_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    area_interest: Optional[str] = None  # Location area
    
    # Raw data
    raw_message: Optional[str] = None
    initial_notes: Optional[str] = None
    
    # Tags
    tags: List[str] = []
    
    # Organization
    branch_id: Optional[str] = None
    team_id: Optional[str] = None


class LeadResponse(BaseModel):
    """Lead response with full context"""
    id: str
    
    # Contact (optional for backward compatibility with old leads)
    contact_id: Optional[str] = None
    contact_name: str = ""
    contact_phone: str = ""
    contact_phone_masked: str = ""
    contact_email: Optional[str] = None
    contact_status: str = ""
    
    # Lifecycle
    stage: LeadStage
    stage_label: str = ""
    stage_color: str = ""
    previous_stage: Optional[str] = None
    stage_changed_at: Optional[str] = None
    
    # Legacy compatibility
    status: str = "new"  # Maps to old status field
    
    # Source (Prompt 7/20 enhanced)
    source: str = "other"
    source_label: str = ""
    source_detail: Optional[str] = None
    lead_source_id: Optional[str] = None
    lead_source_name: Optional[str] = None
    lead_source_type: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    
    # UTM tracking (Prompt 7/20)
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    
    # Segment & Score
    segment: Optional[str] = None
    segment_label: str = ""
    score: int = 0
    score_factors: Dict[str, Any] = {}
    priority: str = "normal"
    
    # Interest
    project_interest: Optional[str] = None
    project_ids: List[str] = []
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_display: str = ""
    
    # Assignment
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    assigned_at: Optional[str] = None
    assignment_reason: Optional[str] = None
    
    # Organization
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    
    # Activity
    total_interactions: int = 0
    last_interaction_at: Optional[str] = None
    last_interaction_type: Optional[str] = None
    next_follow_up: Optional[str] = None
    days_since_last_contact: Optional[int] = None
    
    # Conversion
    converted_to_deal_id: Optional[str] = None
    converted_at: Optional[str] = None
    
    # Duplicate
    is_duplicate: bool = False
    merged_from_lead_ids: List[str] = []
    
    # Referral
    referrer_id: Optional[str] = None
    referrer_type: Optional[str] = None
    referrer_name: Optional[str] = None
    
    # Tags
    tags: List[str] = []
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


# ============================================
# DEMAND PROFILE MODEL (Structured Needs) - EXPANDED
# ============================================

class DemandProfileCreate(BaseModel):
    """
    DemandProfile = Complete structured needs for property matching
    Expanded with all fields for BĐS matching, scoring, and AI
    """
    # Link
    contact_id: str  # Required - belongs to Contact
    lead_id: Optional[str] = None  # Can link to specific lead
    
    # === PURPOSE & URGENCY ===
    purpose: DemandPurpose = DemandPurpose.RESIDENCE
    urgency: DemandUrgency = DemandUrgency.EXPLORING
    expected_purchase_date: Optional[str] = None
    decision_timeline: Optional[str] = None  # "Quyết định trong 2 tuần"
    
    # === BUDGET ===
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_currency: str = "VND"
    budget_flexibility: Optional[str] = None  # "Có thể tăng 10% nếu phù hợp"
    
    # Payment
    payment_method: Optional[str] = None  # cash/loan/installment/mixed
    down_payment_percent: Optional[float] = None  # % trả trước
    loan_amount_needed: Optional[float] = None
    loan_pre_approved: bool = False
    loan_bank: Optional[str] = None
    
    # === PROPERTY TYPE ===
    property_types: List[str] = []  # apartment/villa/townhouse/shophouse/land...
    property_type_primary: Optional[str] = None  # Main preference
    
    # === AREA/SIZE ===
    area_min: Optional[float] = None  # m²
    area_max: Optional[float] = None
    land_area_min: Optional[float] = None  # For villa/townhouse
    land_area_max: Optional[float] = None
    frontage_min: Optional[float] = None  # Mặt tiền (m)
    
    # === ROOMS ===
    bedrooms_min: Optional[int] = None
    bedrooms_max: Optional[int] = None
    bedrooms_exact: Optional[int] = None  # If they want exact
    bathrooms_min: Optional[int] = None
    
    # === LOCATION ===
    preferred_cities: List[str] = []
    preferred_districts: List[str] = []
    preferred_wards: List[str] = []
    preferred_areas: List[str] = []  # Named areas like "Phú Mỹ Hưng"
    excluded_areas: List[str] = []  # Areas they don't want
    
    # Distance constraints
    max_distance_from_workplace: Optional[float] = None  # km
    workplace_address: Optional[str] = None
    max_distance_from_school: Optional[float] = None
    school_name: Optional[str] = None
    near_requirements: List[str] = []  # metro/highway/hospital...
    
    # === PROJECT PREFERENCE ===
    preferred_project_ids: List[str] = []  # Link to Prompt 5 projects
    preferred_project_names: List[str] = []
    excluded_project_ids: List[str] = []
    preferred_developers: List[str] = []  # Vingroup, Novaland...
    
    # === FLOOR & POSITION ===
    floor_preference: Optional[str] = None  # low/mid/high/penthouse
    floor_min: Optional[int] = None
    floor_max: Optional[int] = None
    floors_to_avoid: List[int] = []  # 4, 13, etc.
    position_preference: Optional[str] = None  # corner/middle
    
    # === ORIENTATION & VIEW ===
    directions: List[str] = []  # east/west/south/north/northeast...
    directions_to_avoid: List[str] = []
    views: List[str] = []  # city/river/park/pool/sea...
    views_must_have: List[str] = []
    
    # === AMENITIES & FEATURES ===
    must_have_features: List[str] = []  # pool/gym/parking/security...
    nice_to_have_features: List[str] = []
    deal_breakers: List[str] = []  # Things they absolutely don't want
    
    # === LEGAL REQUIREMENTS ===
    legal_status_required: List[str] = []  # sổ hồng/sổ đỏ/hợp đồng mua bán
    ownership_type: Optional[str] = None  # lâu dài/50 năm
    foreigner_eligible: bool = False  # Need foreigner-purchasable
    
    # === HANDOVER ===
    handover_preference: Optional[str] = None  # bare_shell/basic/full_furnished
    handover_timeline: Optional[str] = None  # "Q4/2025", "Đã bàn giao"
    accept_secondary: bool = True  # Accept resale/secondary market
    
    # === INVESTMENT CRITERIA (if purpose = investment) ===
    investment_yield_target: Optional[float] = None  # % rental yield expected
    investment_appreciation_expectation: Optional[str] = None
    rental_potential_important: bool = False
    
    # === PRIORITY WEIGHTS (1-5) ===
    priority_location: int = 3
    priority_price: int = 3
    priority_size: int = 3
    priority_amenities: int = 3
    priority_developer: int = 3
    priority_legal: int = 3
    priority_handover_time: int = 3
    
    # === COMPETITORS ===
    viewing_other_projects: List[str] = []  # Projects they're also viewing
    competing_products: List[str] = []  # Specific products they're comparing
    
    # === SPECIAL REQUIREMENTS ===
    special_requirements: Optional[str] = None  # Free text for complex needs
    
    # === META ===
    is_active: bool = True
    confidence_level: int = 50  # 0-100, how confident in this profile
    last_validated_at: Optional[str] = None
    validated_by: Optional[str] = None


class DemandProfileResponse(DemandProfileCreate):
    """Demand profile response with computed fields"""
    id: str
    
    # Contact info
    contact_name: str = ""
    
    # Display helpers
    budget_display: str = ""  # "2-3 tỷ"
    area_display: str = ""    # "60-80m²"
    bedrooms_display: str = "" # "2-3 PN"
    location_display: str = "" # "Q7, Q2, Thủ Đức"
    summary: str = ""  # Full summary line
    
    # Matching stats
    matched_product_count: int = 0
    last_match_at: Optional[str] = None
    best_match_score: Optional[float] = None
    
    # Versioning
    version: int = 1
    previous_version_id: Optional[str] = None
    
    # Timestamps
    created_at: str
    created_by: Optional[str] = None
    updated_at: Optional[str] = None


# ============================================
# CRM INTERACTION MODEL (Unified Timeline)
# ============================================

class CRMInteractionCreate(BaseModel):
    """
    CRM Interaction = Single entry in unified timeline
    Records all touchpoints across Contact, Lead, Deal, Booking, Contract
    """
    # Entity links (at least contact_id required)
    contact_id: str  # Always required
    lead_id: Optional[str] = None
    deal_id: Optional[str] = None
    booking_id: Optional[str] = None
    contract_id: Optional[str] = None
    
    # Type & Content
    interaction_type: InteractionType
    title: str
    content: str
    
    # Outcome
    outcome: Optional[InteractionOutcome] = None
    outcome_notes: Optional[str] = None
    
    # Communication details
    direction: Optional[str] = None  # inbound/outbound
    channel: Optional[str] = None  # phone/email/zalo/facebook...
    duration_minutes: Optional[int] = None
    
    # Related entities
    product_id: Optional[str] = None  # Product discussed
    project_id: Optional[str] = None
    
    # For stage/status changes
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    
    # Follow-up
    next_action: Optional[str] = None
    next_follow_up: Optional[str] = None
    follow_up_assigned_to: Optional[str] = None
    
    # Attachments
    attachments: List[str] = []
    
    # System tracking
    is_auto: bool = False
    auto_trigger: Optional[str] = None
    
    # Visibility
    is_private: bool = False  # Only visible to creator and managers


class CRMInteractionResponse(CRMInteractionCreate):
    """Interaction response"""
    id: str
    
    # User info
    user_id: str
    user_name: str = ""
    
    # Entity names
    contact_name: str = ""
    lead_source: Optional[str] = None
    deal_name: Optional[str] = None
    
    # Display helpers
    interaction_type_label: str = ""
    interaction_type_icon: str = ""
    outcome_label: Optional[str] = None
    outcome_color: Optional[str] = None
    
    # Timestamps
    created_at: str


# ============================================
# ASSIGNMENT HISTORY MODEL
# ============================================

class AssignmentHistoryCreate(BaseModel):
    """Track all ownership changes for audit trail"""
    # Entity
    entity_type: str  # contact/lead/deal/booking/contract
    entity_id: str
    
    # Assignment
    from_user_id: Optional[str] = None
    to_user_id: str
    
    # Organization change
    from_branch_id: Optional[str] = None
    to_branch_id: Optional[str] = None
    from_team_id: Optional[str] = None
    to_team_id: Optional[str] = None
    
    # Reason
    assignment_type: str  # initial/manual/auto/reassign/escalate/round_robin
    reason: Optional[str] = None


class AssignmentHistoryResponse(AssignmentHistoryCreate):
    """Assignment history response"""
    id: str
    
    # Names
    from_user_name: Optional[str] = None
    to_user_name: str = ""
    from_branch_name: Optional[str] = None
    to_branch_name: Optional[str] = None
    from_team_name: Optional[str] = None
    to_team_name: Optional[str] = None
    
    # Timestamps
    assigned_at: str
    assigned_by: Optional[str] = None
    assigned_by_name: Optional[str] = None


# ============================================
# DUPLICATE DETECTION - EXPANDED
# ============================================

class DuplicateCheckRequest(BaseModel):
    """Request to check for duplicates"""
    # Check by any of these
    phone: Optional[str] = None
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    zalo_phone: Optional[str] = None
    facebook_id: Optional[str] = None
    full_name: Optional[str] = None
    
    # Context
    exclude_contact_id: Optional[str] = None  # Exclude self when editing


class DuplicateCandidateResponse(BaseModel):
    """Potential duplicate record"""
    id: str
    
    # Primary record
    primary_contact_id: str
    primary_name: str
    primary_phone: str
    primary_phone_masked: str
    primary_email: Optional[str] = None
    primary_status: str
    
    # Duplicate candidate
    duplicate_contact_id: str
    duplicate_name: str
    duplicate_phone: str
    duplicate_phone_masked: str
    duplicate_email: Optional[str] = None
    duplicate_status: str
    
    # Match analysis
    match_score: float  # 0-100
    match_reasons: List[Dict[str, Any]] = []
    # Example: [{"field": "phone", "type": "exact", "score": 100}, 
    #           {"field": "name", "type": "fuzzy", "similarity": 0.85, "score": 25}]
    
    # Status
    status: str = "pending"  # pending/merged/rejected/ignored
    
    # Resolution
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_by_name: Optional[str] = None
    resolution_action: Optional[str] = None
    
    # Timestamps
    detected_at: str


class MergeContactsRequest(BaseModel):
    """Request to merge duplicate contacts"""
    primary_contact_id: str  # Keep this one
    duplicate_contact_ids: List[str]  # Merge these into primary
    
    # Field resolution (which contact's value to keep)
    # If not specified, primary's values are kept
    field_selections: Dict[str, str] = {}  # field -> contact_id to use
    
    # Options
    merge_leads: bool = True  # Transfer leads to primary
    merge_deals: bool = True
    merge_interactions: bool = True
    merge_tags: bool = True  # Combine tags from all


# ============================================
# UNIFIED PROFILE (Service Aggregation - NOT DB Model)
# ============================================

class UnifiedProfileResponse(BaseModel):
    """
    Unified Profile = Aggregated view from multiple entities
    This is NOT stored in database - computed on request
    """
    # Core identity
    contact: ContactResponse
    
    # Linked leads (all inquiries)
    leads: List[LeadResponse] = []
    active_lead: Optional[LeadResponse] = None
    
    # Demand profiles
    demand_profiles: List[DemandProfileResponse] = []
    active_demand: Optional[DemandProfileResponse] = None
    
    # Transactions (from Prompt 8 - Deal/Booking/Contract)
    deals: List[Dict[str, Any]] = []
    active_deals: List[Dict[str, Any]] = []
    bookings: List[Dict[str, Any]] = []
    contracts: List[Dict[str, Any]] = []
    
    # Linked products
    interested_products: List[Dict[str, Any]] = []
    booked_products: List[Dict[str, Any]] = []
    owned_products: List[Dict[str, Any]] = []
    
    # Matching products (from demand)
    matched_products: List[Dict[str, Any]] = []
    match_count: int = 0
    
    # Timeline (recent)
    recent_interactions: List[CRMInteractionResponse] = []
    total_interactions: int = 0
    
    # Assignment history
    assignment_history: List[AssignmentHistoryResponse] = []
    
    # Summary stats
    summary: Dict[str, Any] = {}
    # {
    #   "total_leads": 2,
    #   "total_deals": 1,
    #   "total_value": 2500000000,
    #   "first_contact_date": "2024-01-15",
    #   "days_as_customer": 45,
    #   "engagement_score": 85
    # }


# ============================================
# NEED MATCHING
# ============================================

class NeedMatchRequest(BaseModel):
    """Request to find products matching needs"""
    demand_profile_id: Optional[str] = None
    contact_id: Optional[str] = None
    
    # Override/filter
    project_ids: Optional[List[str]] = None
    max_results: int = 20
    include_unavailable: bool = False
    min_match_score: float = 50.0


class ProductMatchResult(BaseModel):
    """Single product match result"""
    product_id: str
    product_code: str
    product_name: str
    project_id: str
    project_name: str
    
    # Product details
    product_type: str
    area: float
    bedrooms: int
    floor: Optional[int] = None
    direction: Optional[str] = None
    price: float
    
    # Match analysis
    match_score: float  # 0-100
    match_breakdown: Dict[str, float] = {}
    # {"budget": 100, "area": 90, "bedrooms": 100, "location": 80, "direction": 70}
    
    match_notes: List[str] = []  # ["Trong ngân sách", "Đúng số phòng", "Tầng hơi thấp"]
    
    # Status
    inventory_status: str
    is_available: bool


class NeedMatchResponse(BaseModel):
    """Products matching customer needs"""
    demand_profile_id: str
    contact_id: str
    contact_name: str
    
    # Results
    total_matches: int
    matches: List[ProductMatchResult] = []
    
    # Breakdown
    by_project: Dict[str, int] = {}
    by_type: Dict[str, int] = {}
    by_status: Dict[str, int] = {}
    
    # Analysis
    best_match_score: float = 0
    avg_match_score: float = 0
    
    matched_at: str


# ============================================
# STAGE TRANSITION
# ============================================

class LeadStageTransition(BaseModel):
    """Request to change lead stage"""
    new_stage: LeadStage
    reason: Optional[str] = None
    
    # For conversion to deal
    create_deal: bool = False
    deal_data: Optional[Dict[str, Any]] = None


class ContactStatusChange(BaseModel):
    """Request to change contact status"""
    contact_id: str
    new_status: ContactStatus
    reason: Optional[str] = None
