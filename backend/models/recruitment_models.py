"""
Recruitment Models - Phase 3.5: AUTO RECRUITMENT + ONBOARDING ENGINE
GLOBAL STANDARD 10/10 - LOCKED

Database Models:
- Candidate
- Application  
- OTPVerification
- ConsentLog
- IdentityVerification
- AIScore
- TestAttempt
- Contract
- OnboardingProfile
- ReferralTree
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS - PIPELINE STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class CandidateStatus(str, Enum):
    APPLIED = "applied"
    VERIFIED = "verified"
    CONSENTED = "consented"
    KYC_VERIFIED = "kyc_verified"
    SCREENED = "screened"
    TESTED = "tested"
    PASSED = "passed"
    CONTRACTED = "contracted"
    ONBOARDED = "onboarded"
    ACTIVE = "active"
    BLOCKED = "blocked"
    REJECTED = "rejected"


class OTPChannel(str, Enum):
    ZALO = "zalo"
    EMAIL = "email"
    SMS = "sms"


class OTPStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    EXPIRED = "expired"
    FAILED = "failed"


class PositionType(str, Enum):
    SALE = "sale"
    CTV = "ctv"
    LEADER = "leader"
    MANAGER = "manager"


class VerificationStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"


class ContractStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    SIGNED = "signed"
    REJECTED = "rejected"
    EXPIRED = "expired"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FitLevel(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"
    REJECT = "reject"


# ═══════════════════════════════════════════════════════════════════════════════
# 1. CANDIDATE - Main applicant record
# ═══════════════════════════════════════════════════════════════════════════════

class Candidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Basic Info
    full_name: str
    phone: str
    email: EmailStr
    
    # Location
    region: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    
    # Application
    position: PositionType = PositionType.CTV
    experience_years: int = 0
    has_real_estate_exp: bool = False
    cv_url: Optional[str] = None
    
    # Source Tracking
    source: str = "direct"  # direct, qr, referral, campaign, landing
    source_url: Optional[str] = None
    ref_id: Optional[str] = None  # Referrer user ID
    campaign_id: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    
    # Pipeline Status
    status: CandidateStatus = CandidateStatus.APPLIED
    current_step: int = 1
    
    # Verification
    phone_verified: bool = False
    email_verified: bool = False
    consent_accepted: bool = False
    kyc_verified: bool = False
    
    # Scores
    screening_score: Optional[float] = None
    test_score: Optional[float] = None
    ai_score: Optional[float] = None
    final_score: Optional[float] = None
    
    # Risk
    risk_level: RiskLevel = RiskLevel.LOW
    fit_level: Optional[FitLevel] = None
    
    # Decision
    decision: Optional[str] = None  # pass, fail, review
    decision_at: Optional[str] = None
    decision_by: Optional[str] = None
    
    # Contract
    contract_id: Optional[str] = None
    signed_at: Optional[str] = None
    
    # Onboarding
    user_id: Optional[str] = None  # Created user ID after onboarding
    onboarded_at: Optional[str] = None
    assigned_team_id: Optional[str] = None
    assigned_manager_id: Optional[str] = None
    
    # Device & Security
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Timestamps
    applied_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Metadata
    notes: Optional[str] = None
    tags: List[str] = []


# ═══════════════════════════════════════════════════════════════════════════════
# 2. OTP VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

class OTPVerification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Target
    channel: OTPChannel
    target: str  # phone or email
    
    # OTP
    otp_hash: str  # bcrypt hashed OTP
    
    # Status
    status: OTPStatus = OTPStatus.PENDING
    
    # Limits
    attempt_count: int = 0
    max_attempts: int = 5
    resend_count: int = 0
    max_resends: int = 3
    
    # Timing
    expires_at: str
    last_attempt_at: Optional[str] = None
    verified_at: Optional[str] = None
    
    # Security
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 3. CONSENT LOG - GDPR/PDPA Compliance
# ═══════════════════════════════════════════════════════════════════════════════

class ConsentLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Consent Types
    data_processing: bool = False
    terms_of_service: bool = False
    privacy_policy: bool = False
    marketing_consent: bool = False
    
    # Policy Versions
    tos_version: str = "1.0"
    privacy_version: str = "1.0"
    
    # Legal
    ip_address: str
    user_agent: str
    device_fingerprint: Optional[str] = None
    
    # Timestamps
    consented_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Withdrawal (GDPR right)
    withdrawn: bool = False
    withdrawn_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 4. IDENTITY VERIFICATION - KYC
# ═══════════════════════════════════════════════════════════════════════════════

class IdentityVerification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Document
    document_type: str = "cccd"  # cccd, passport, cmnd
    document_number: Optional[str] = None
    document_front_url: Optional[str] = None
    document_back_url: Optional[str] = None
    
    # OCR Extracted Data
    ocr_full_name: Optional[str] = None
    ocr_dob: Optional[str] = None
    ocr_gender: Optional[str] = None
    ocr_address: Optional[str] = None
    ocr_issue_date: Optional[str] = None
    ocr_expiry_date: Optional[str] = None
    
    # Face Verification
    selfie_url: Optional[str] = None
    face_match_score: Optional[float] = None
    face_match_passed: bool = False
    
    # Liveness
    liveness_score: Optional[float] = None
    liveness_passed: bool = False
    
    # Status
    status: VerificationStatus = VerificationStatus.PENDING
    
    # Anti-fraud
    is_duplicate: bool = False
    duplicate_candidate_id: Optional[str] = None
    risk_score: float = 0.0
    fraud_flags: List[str] = []
    
    # Review
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    review_notes: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 5. AI SCORE - AI Screening Results
# ═══════════════════════════════════════════════════════════════════════════════

class AIScore(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Input Data Used
    cv_analyzed: bool = False
    form_analyzed: bool = True
    behavior_analyzed: bool = False
    
    # Scores (0-100)
    overall_score: float = 0.0
    cv_score: Optional[float] = None
    experience_score: float = 0.0
    communication_score: float = 0.0
    sales_mindset_score: float = 0.0
    culture_fit_score: float = 0.0
    
    # Risk Assessment
    risk_level: RiskLevel = RiskLevel.LOW
    risk_factors: List[str] = []
    
    # Fit Assessment
    fit_level: FitLevel = FitLevel.AVERAGE
    recommended_position: PositionType = PositionType.CTV
    
    # AI Analysis
    strengths: List[str] = []
    weaknesses: List[str] = []
    recommendations: List[str] = []
    
    # Model Info
    model_version: str = "1.0"
    model_name: str = "recruitment_screening_v1"
    
    # Timestamps
    scored_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 6. TEST ATTEMPT - Online Assessment
# ═══════════════════════════════════════════════════════════════════════════════

class TestQuestion(BaseModel):
    id: str
    question: str
    question_type: str = "mcq"  # mcq, essay, scenario
    options: List[str] = []
    correct_answer: Optional[str] = None
    points: int = 1
    category: str = "general"  # general, sales, real_estate, mindset


class TestAnswer(BaseModel):
    question_id: str
    answer: str
    is_correct: Optional[bool] = None
    points_earned: int = 0
    ai_evaluation: Optional[str] = None


class TestAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Test Info
    test_id: str
    test_name: str
    test_type: str = "screening"  # screening, skills, personality
    
    # Timing
    started_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None
    time_limit_minutes: int = 30
    time_spent_seconds: int = 0
    
    # Questions & Answers
    total_questions: int = 0
    answered_questions: int = 0
    answers: List[TestAnswer] = []
    
    # Scoring
    total_points: int = 0
    earned_points: int = 0
    score_percentage: float = 0.0
    passed: bool = False
    pass_threshold: float = 60.0
    
    # Category Scores
    category_scores: Dict[str, float] = {}
    
    # AI Evaluation (for essay/scenario)
    ai_evaluated: bool = False
    ai_feedback: Optional[str] = None
    
    # Status
    status: str = "in_progress"  # in_progress, completed, timed_out, abandoned
    
    # Anti-cheat
    tab_switches: int = 0
    suspicious_behavior: bool = False
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 7. RECRUITMENT CONTRACT
# ═══════════════════════════════════════════════════════════════════════════════

class RecruitmentContract(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Contract Info
    contract_number: str
    contract_type: str = "ctv"  # ctv, sales, leader
    template_id: Optional[str] = None
    
    # Parties
    candidate_name: str
    candidate_phone: str
    candidate_email: str
    candidate_id_number: Optional[str] = None
    
    company_name: str = "ProHouzing"
    company_representative: Optional[str] = None
    
    # Terms
    position: PositionType
    commission_rate: float = 0.0
    effective_date: str
    expiry_date: Optional[str] = None
    probation_months: int = 0
    
    # Content
    contract_content: str
    contract_html: Optional[str] = None
    contract_pdf_url: Optional[str] = None
    
    # Signature
    status: ContractStatus = ContractStatus.DRAFT
    
    # Candidate Signature
    candidate_signed: bool = False
    candidate_signature_data: Optional[str] = None  # Base64 or signature URL
    candidate_signed_at: Optional[str] = None
    candidate_signed_ip: Optional[str] = None
    candidate_signed_device: Optional[str] = None
    
    # Company Signature (if required)
    company_signed: bool = False
    company_signed_by: Optional[str] = None
    company_signed_at: Optional[str] = None
    
    # Hash for integrity
    contract_hash: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    sent_at: Optional[str] = None
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 8. ONBOARDING PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

class OnboardingProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    user_id: str  # Created user ID
    
    # User Setup
    username: str
    email: str
    phone: str
    role: str  # sales, ctv, leader
    
    # Assignment
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    
    # Commission Tree
    commission_tree_created: bool = False
    upline_id: Optional[str] = None  # Direct upline
    tree_level: int = 1
    
    # System Links
    hr_profile_created: bool = False
    crm_linked: bool = False
    kpi_linked: bool = False
    commission_linked: bool = False
    payroll_linked: bool = False
    
    # Training
    training_assigned: bool = False
    training_ids: List[str] = []
    training_completed: bool = False
    
    # Activation
    account_activated: bool = False
    first_login_at: Optional[str] = None
    
    # Timestamps
    onboarded_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    activated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 9. REFERRAL TREE
# ═══════════════════════════════════════════════════════════════════════════════

class ReferralTree(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Referrer
    referrer_id: str
    referrer_name: str
    referrer_code: str
    
    # Referred
    candidate_id: str
    referred_user_id: Optional[str] = None  # After onboarding
    referred_name: str
    
    # Tracking
    source: str = "referral"
    campaign_id: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, converted, rewarded, cancelled
    
    # Reward
    reward_type: str = "commission"  # commission, bonus, points
    reward_amount: float = 0.0
    reward_paid: bool = False
    reward_paid_at: Optional[str] = None
    
    # Conversion
    converted_at: Optional[str] = None
    first_deal_at: Optional[str] = None
    
    # Multi-level
    level: int = 1  # Direct = 1, Indirect = 2+
    parent_referral_id: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 10. RECRUITMENT CAMPAIGN
# ═══════════════════════════════════════════════════════════════════════════════

class RecruitmentCampaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Campaign Info
    name: str
    description: Optional[str] = None
    code: str  # Unique code for tracking
    
    # Targets
    target_positions: List[PositionType] = [PositionType.CTV]
    target_regions: List[str] = []
    target_count: int = 100
    
    # QR / Links
    qr_code_url: Optional[str] = None
    landing_page_url: Optional[str] = None
    apply_url: str
    
    # Budget
    budget: float = 0.0
    spent: float = 0.0
    cost_per_hire: float = 0.0
    
    # Stats
    impressions: int = 0
    clicks: int = 0
    applications: int = 0
    conversions: int = 0
    conversion_rate: float = 0.0
    
    # Status
    status: str = "active"  # draft, active, paused, completed
    
    # Timing
    start_date: str
    end_date: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_by: str
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# 11. AUDIT LOG - Full Flow Tracking
# ═══════════════════════════════════════════════════════════════════════════════

class RecruitmentAuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    
    # Action
    action: str  # applied, otp_sent, otp_verified, consent_accepted, kyc_submitted, etc.
    step: int
    
    # Details
    details: Dict[str, Any] = {}
    
    # Security
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_fingerprint: Optional[str] = None
    
    # Actor
    actor_type: str = "candidate"  # candidate, system, admin
    actor_id: Optional[str] = None
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# ═══════════════════════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class ApplicationRequest(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    region: Optional[str] = None
    city: Optional[str] = None
    position: PositionType = PositionType.CTV
    experience_years: int = 0
    has_real_estate_exp: bool = False
    cv_url: Optional[str] = None
    
    # Source
    ref_id: Optional[str] = None
    campaign_id: Optional[str] = None
    source: str = "direct"
    
    # UTM
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None


class OTPSendRequest(BaseModel):
    candidate_id: str
    channel: OTPChannel = OTPChannel.EMAIL
    target: str  # phone or email


class OTPVerifyRequest(BaseModel):
    candidate_id: str
    otp: str


class ConsentRequest(BaseModel):
    candidate_id: str
    data_processing: bool
    terms_of_service: bool
    privacy_policy: bool
    marketing_consent: bool = False


class KYCUploadRequest(BaseModel):
    candidate_id: str
    document_type: str = "cccd"
    document_front_url: str
    document_back_url: Optional[str] = None
    selfie_url: Optional[str] = None


class TestSubmitRequest(BaseModel):
    attempt_id: str
    answers: List[TestAnswer]


class ContractSignRequest(BaseModel):
    contract_id: str
    signature_data: str  # Base64 signature image
    accept_terms: bool = True



# ═══════════════════════════════════════════════════════════════════════════════
# CONTRACT TEMPLATE - Dynamic templates without hardcode
# ═══════════════════════════════════════════════════════════════════════════════

class ContractTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Template Info
    name: str
    description: Optional[str] = None
    contract_type: PositionType  # ctv, sale, leader
    version: str = "1.0"
    
    # Template Content
    template_content: str  # HTML/Markdown with placeholders
    variables: List[str] = []  # List of placeholders: {{name}}, {{phone}}, etc.
    
    # File Storage
    file_url: Optional[str] = None  # PDF template URL if uploaded
    
    # Status
    is_active: bool = False
    is_default: bool = False
    
    # Approval
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    
    # Stats
    usage_count: int = 0
    
    # Timestamps
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    created_by: Optional[str] = None


class ContractTemplateUploadRequest(BaseModel):
    name: str
    contract_type: str = "ctv"  # ctv, sale, leader
    template_content: str
    description: Optional[str] = None
    variables: List[str] = ["name", "phone", "email", "position", "commission_rate", "date"]
