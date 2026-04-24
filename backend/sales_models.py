"""
ProHouzing Sales Module
Quản lý Bán hàng: Chiến dịch mở bán, Dự án, Pipeline, Booking
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone

# ==================== ENUMS ====================

class CampaignStatus(str, Enum):
    DRAFT = "draft"
    UPCOMING = "upcoming"
    ACTIVE = "active"
    PAUSED = "paused"
    ENDED = "ended"
    CANCELLED = "cancelled"

class CampaignType(str, Enum):
    GRAND_OPENING = "grand_opening"  # Mở bán lớn
    SOFT_OPENING = "soft_opening"  # Mở bán mềm
    FLASH_SALE = "flash_sale"  # Flash sale
    VIP_SALE = "vip_sale"  # Bán riêng cho VIP
    PHASE_LAUNCH = "phase_launch"  # Mở bán theo đợt

class ProductType(str, Enum):
    APARTMENT = "apartment"  # Căn hộ
    VILLA = "villa"  # Biệt thự
    TOWNHOUSE = "townhouse"  # Nhà phố
    SHOPHOUSE = "shophouse"  # Shophouse
    LAND = "land"  # Đất nền
    OFFICE = "office"  # Văn phòng

class ProductStatus(str, Enum):
    AVAILABLE = "available"  # Còn hàng
    BOOKING = "booking"  # Đang booking
    DEPOSITED = "deposited"  # Đã đặt cọc
    SOLD = "sold"  # Đã bán
    RESERVED = "reserved"  # Giữ chỗ nội bộ
    UNAVAILABLE = "unavailable"  # Không bán

class BookingStatus(str, Enum):
    PENDING = "pending"  # Chờ xác nhận
    CONFIRMED = "confirmed"  # Đã xác nhận
    DEPOSITED = "deposited"  # Đã đặt cọc
    CONTRACT_SIGNED = "contract_signed"  # Đã ký HĐ
    CANCELLED = "cancelled"  # Đã huỷ
    EXPIRED = "expired"  # Hết hạn

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    REFUNDED = "refunded"

class DealStage(str, Enum):
    LEAD = "lead"  # Lead mới
    QUALIFIED = "qualified"  # Đã xác nhận nhu cầu
    SITE_VISIT = "site_visit"  # Đã dẫn tham quan
    PROPOSAL = "proposal"  # Đã gửi báo giá
    NEGOTIATION = "negotiation"  # Đang đàm phán
    BOOKING = "booking"  # Đã booking
    DEPOSIT = "deposit"  # Đã đặt cọc
    CONTRACT = "contract"  # Đang làm HĐ
    WON = "won"  # Thắng - đã ký HĐ
    LOST = "lost"  # Mất deal

# ==================== SALES CAMPAIGN MODELS ====================

class SalesCampaignCreate(BaseModel):
    name: str
    code: str
    type: CampaignType
    description: Optional[str] = None
    
    project_id: str
    
    start_date: str
    end_date: str
    
    # Target
    target_units: int = 0
    target_revenue: float = 0
    
    # Promotion
    promotions: List[Dict[str, Any]] = []  # [{name, discount_percent, discount_amount, conditions}]
    
    # Commission policy
    commission_rate: float = 0  # % hoa hồng
    bonus_conditions: List[Dict[str, Any]] = []
    
    # Products in campaign
    product_ids: List[str] = []
    
    # Team
    manager_id: Optional[str] = None
    sales_team_ids: List[str] = []
    
    # Marketing
    marketing_budget: float = 0
    marketing_channels: List[str] = []
    
    banner_url: Optional[str] = None
    landing_page_url: Optional[str] = None

class SalesCampaignResponse(BaseModel):
    id: str
    name: str
    code: str
    type: CampaignType
    status: CampaignStatus
    description: Optional[str] = None
    
    project_id: str
    project_name: str
    
    start_date: str
    end_date: str
    
    target_units: int
    target_revenue: float
    
    # Actual results
    sold_units: int = 0
    actual_revenue: float = 0
    booking_count: int = 0
    
    # Progress
    units_progress: float = 0
    revenue_progress: float = 0
    
    promotions: List[Dict[str, Any]]
    commission_rate: float
    bonus_conditions: List[Dict[str, Any]]
    
    product_ids: List[str]
    total_products: int = 0
    available_products: int = 0
    
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    sales_team_ids: List[str]
    
    marketing_budget: float
    marketing_channels: List[str]
    
    banner_url: Optional[str] = None
    landing_page_url: Optional[str] = None
    
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

# ==================== PROJECT/PRODUCT MODELS ====================

class SalesProjectCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    
    # Location
    address: str
    district: str
    city: str
    
    # Developer
    developer_name: str
    investor_name: Optional[str] = None
    
    # Details
    total_units: int = 0
    total_area: float = 0  # m2
    floors: int = 0
    blocks: List[str] = []
    
    # Timeline
    construction_start: Optional[str] = None
    expected_handover: Optional[str] = None
    
    # Price range
    price_from: float = 0
    price_to: float = 0
    
    # Media
    images: List[str] = []
    videos: List[str] = []
    brochure_url: Optional[str] = None
    
    # Amenities
    amenities: List[str] = []
    
    # Legal
    legal_status: str = ""  # Sổ hồng, Sổ đỏ, Đang làm thủ tục
    
    status: str = "upcoming"  # upcoming, selling, sold_out, completed

class SalesProjectResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    
    address: str
    district: str
    city: str
    full_address: str = ""
    
    developer_name: str
    investor_name: Optional[str] = None
    
    total_units: int
    total_area: float
    floors: int
    blocks: List[str]
    
    # Stats
    available_units: int = 0
    sold_units: int = 0
    booking_units: int = 0
    
    construction_start: Optional[str] = None
    expected_handover: Optional[str] = None
    
    price_from: float
    price_to: float
    price_range_label: str = ""
    
    images: List[str]
    videos: List[str]
    brochure_url: Optional[str] = None
    
    amenities: List[str]
    legal_status: str
    status: str
    
    created_at: str
    updated_at: Optional[str] = None

class ProductUnitCreate(BaseModel):
    project_id: str
    campaign_id: Optional[str] = None
    
    code: str  # Mã căn: A-10-01
    name: str  # Căn hộ A-10-01
    
    type: ProductType
    status: ProductStatus = ProductStatus.AVAILABLE
    
    # Location in project
    block: str
    floor: int
    unit_number: str
    
    # Details
    area: float  # m2
    bedrooms: int = 0
    bathrooms: int = 0
    direction: str = ""  # Hướng: Đông, Tây, Nam, Bắc
    view: str = ""  # View: Hồ bơi, Công viên, Đường phố
    
    # Price
    base_price: float  # Giá gốc
    price_per_sqm: float  # Giá/m2
    total_price: float  # Tổng giá
    
    # Discount
    discount_percent: float = 0
    discount_amount: float = 0
    final_price: float = 0
    
    # Payment
    payment_schedule: List[Dict[str, Any]] = []
    
    # Media
    floor_plan_url: Optional[str] = None
    images: List[str] = []

class ProductUnitResponse(BaseModel):
    id: str
    project_id: str
    project_name: str
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    
    code: str
    name: str
    type: ProductType
    status: ProductStatus
    
    block: str
    floor: int
    unit_number: str
    
    area: float
    bedrooms: int
    bathrooms: int
    direction: str
    view: str
    
    base_price: float
    price_per_sqm: float
    total_price: float
    
    discount_percent: float
    discount_amount: float
    final_price: float
    
    payment_schedule: List[Dict[str, Any]]
    
    floor_plan_url: Optional[str] = None
    images: List[str]
    
    # Booking info if any
    current_booking_id: Optional[str] = None
    booked_by: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None

# ==================== BOOKING MODELS ====================

class BookingCreate(BaseModel):
    product_id: str
    campaign_id: Optional[str] = None
    
    customer_id: str
    sales_id: str
    
    booking_amount: float  # Tiền booking
    deposit_amount: float = 0  # Tiền cọc
    
    notes: Optional[str] = None
    
    # Customer info snapshot
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_id_number: Optional[str] = None

class BookingResponse(BaseModel):
    id: str
    booking_number: str
    
    product_id: str
    product_code: str
    product_name: str
    project_name: str
    
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    
    customer_id: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    
    sales_id: str
    sales_name: str
    
    status: BookingStatus
    
    booking_amount: float
    deposit_amount: float
    total_paid: float = 0
    
    # Product price
    product_price: float = 0
    discount_amount: float = 0
    final_price: float = 0
    remaining_amount: float = 0
    
    # Timeline
    booking_date: str
    deposit_deadline: Optional[str] = None
    contract_deadline: Optional[str] = None
    
    expired_at: Optional[str] = None
    cancelled_at: Optional[str] = None
    
    notes: Optional[str] = None
    
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

# ==================== PAYMENT MODELS ====================

class PaymentCreate(BaseModel):
    booking_id: str
    
    amount: float
    payment_method: str  # cash, bank_transfer, credit_card
    
    payment_date: str
    reference_number: Optional[str] = None
    
    notes: Optional[str] = None
    attachments: List[str] = []

class PaymentResponse(BaseModel):
    id: str
    payment_number: str
    
    booking_id: str
    booking_number: str
    
    customer_id: str
    customer_name: str
    
    product_id: str
    product_code: str
    
    amount: float
    payment_method: str
    
    payment_date: str
    reference_number: Optional[str] = None
    
    status: PaymentStatus
    
    notes: Optional[str] = None
    attachments: List[str]
    
    received_by: str
    received_by_name: str
    
    created_at: str

# ==================== DEAL/PIPELINE MODELS ====================

class DealCreate(BaseModel):
    name: str
    
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    
    product_id: Optional[str] = None
    campaign_id: Optional[str] = None
    
    stage: DealStage = DealStage.LEAD
    
    expected_value: float = 0
    probability: int = 10  # % khả năng thắng
    
    expected_close_date: Optional[str] = None
    
    sales_id: str
    
    source: str = ""  # Facebook, Website, Referral, Event
    
    notes: Optional[str] = None
    
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None

class DealResponse(BaseModel):
    id: str
    deal_number: str = ""
    name: str = ""
    
    lead_id: Optional[str] = None
    lead_name: Optional[str] = None
    
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    
    product_id: Optional[str] = None
    product_code: Optional[str] = None
    product_name: Optional[str] = None
    
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    
    stage: DealStage = DealStage.LEAD
    stage_label: str = ""
    
    expected_value: float = 0
    actual_value: float = 0
    probability: int = 10
    weighted_value: float = 0  # expected_value * probability / 100
    
    expected_close_date: Optional[str] = None
    actual_close_date: Optional[str] = None
    
    sales_id: Optional[str] = None
    sales_name: Optional[str] = None
    
    source: str = ""
    
    notes: Optional[str] = None
    
    next_action: Optional[str] = None
    next_action_date: Optional[str] = None
    
    # Activity
    last_activity_date: Optional[str] = None
    activities_count: int = 0
    
    # Timeline
    days_in_pipeline: int = 0
    
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# ==================== SALES REPORT MODELS ====================

class SalesReportResponse(BaseModel):
    period: str
    period_label: str
    
    # Summary
    total_deals: int = 0
    won_deals: int = 0
    lost_deals: int = 0
    win_rate: float = 0
    
    total_revenue: float = 0
    total_bookings: int = 0
    total_units_sold: int = 0
    
    # By stage
    deals_by_stage: Dict[str, int] = {}
    
    # By sales
    sales_performance: List[Dict[str, Any]] = []
    
    # By campaign
    campaign_performance: List[Dict[str, Any]] = []
    
    # By source
    deals_by_source: Dict[str, int] = {}
    
    # Trends
    daily_revenue: List[Dict[str, Any]] = []
    daily_bookings: List[Dict[str, Any]] = []
