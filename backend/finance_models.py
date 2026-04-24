"""
ProHouzing Finance Module - Quản lý Tài chính Doanh nghiệp
Bao gồm: Hoa hồng, Lương, Doanh số, Chi phí, Thuế, Hoá đơn, Hợp đồng, Ngân sách, Dự báo
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone

# ==================== ENUMS ====================

class TransactionType(str, Enum):
    """Loại giao dịch"""
    INCOME = "income"  # Thu
    EXPENSE = "expense"  # Chi

class PaymentStatus(str, Enum):
    """Trạng thái thanh toán"""
    PENDING = "pending"  # Chờ thanh toán
    PARTIAL = "partial"  # Thanh toán một phần
    PAID = "paid"  # Đã thanh toán
    OVERDUE = "overdue"  # Quá hạn
    CANCELLED = "cancelled"  # Đã hủy
    REFUNDED = "refunded"  # Đã hoàn tiền

class CommissionStatus(str, Enum):
    """Trạng thái hoa hồng"""
    PENDING = "pending"  # Chờ duyệt
    APPROVED = "approved"  # Đã duyệt
    PAID = "paid"  # Đã chi trả
    CANCELLED = "cancelled"  # Đã hủy
    ON_HOLD = "on_hold"  # Tạm giữ

class SalaryStatus(str, Enum):
    """Trạng thái lương"""
    DRAFT = "draft"  # Nháp
    PENDING_APPROVAL = "pending_approval"  # Chờ duyệt
    APPROVED = "approved"  # Đã duyệt
    PAID = "paid"  # Đã chi trả
    CANCELLED = "cancelled"  # Đã hủy

class ExpenseCategory(str, Enum):
    """Danh mục chi phí"""
    MARKETING = "marketing"  # Marketing & Quảng cáo
    OPERATIONS = "operations"  # Vận hành
    OFFICE = "office"  # Văn phòng
    TRAVEL = "travel"  # Di chuyển
    UTILITIES = "utilities"  # Tiện ích (điện, nước, internet)
    SALARY = "salary"  # Lương nhân viên
    COMMISSION = "commission"  # Hoa hồng
    TAX = "tax"  # Thuế
    INSURANCE = "insurance"  # Bảo hiểm
    TRAINING = "training"  # Đào tạo
    EQUIPMENT = "equipment"  # Thiết bị
    SOFTWARE = "software"  # Phần mềm
    LEGAL = "legal"  # Pháp lý
    CONSULTING = "consulting"  # Tư vấn
    EVENT = "event"  # Sự kiện
    OTHER = "other"  # Khác

class RevenueCategory(str, Enum):
    """Danh mục doanh thu"""
    PROPERTY_SALE = "property_sale"  # Bán BĐS
    BROKERAGE_FEE = "brokerage_fee"  # Phí môi giới
    CONSULTING_FEE = "consulting_fee"  # Phí tư vấn
    SERVICE_FEE = "service_fee"  # Phí dịch vụ
    RENTAL_INCOME = "rental_income"  # Thu từ cho thuê
    OTHER = "other"  # Khác

class InvoiceType(str, Enum):
    """Loại hoá đơn"""
    SALES = "sales"  # Hoá đơn bán hàng
    SERVICE = "service"  # Hoá đơn dịch vụ
    VAT = "vat"  # Hoá đơn GTGT
    RECEIPT = "receipt"  # Phiếu thu
    PAYMENT = "payment"  # Phiếu chi

class InvoiceStatus(str, Enum):
    """Trạng thái hoá đơn"""
    DRAFT = "draft"  # Nháp
    ISSUED = "issued"  # Đã phát hành
    SENT = "sent"  # Đã gửi
    PAID = "paid"  # Đã thanh toán
    OVERDUE = "overdue"  # Quá hạn
    CANCELLED = "cancelled"  # Đã hủy

class ContractType(str, Enum):
    """Loại hợp đồng"""
    PROPERTY_SALE = "property_sale"  # Hợp đồng mua bán BĐS
    BROKERAGE = "brokerage"  # Hợp đồng môi giới
    DEPOSIT = "deposit"  # Hợp đồng đặt cọc
    RENTAL = "rental"  # Hợp đồng thuê
    COLLABORATOR = "collaborator"  # Hợp đồng CTV
    EMPLOYMENT = "employment"  # Hợp đồng lao động
    SERVICE = "service"  # Hợp đồng dịch vụ
    PARTNERSHIP = "partnership"  # Hợp đồng hợp tác

class ContractStatus(str, Enum):
    """Trạng thái hợp đồng"""
    DRAFT = "draft"  # Nháp
    PENDING_REVIEW = "pending_review"  # Chờ xem xét
    PENDING_SIGNATURE = "pending_signature"  # Chờ ký
    ACTIVE = "active"  # Đang hiệu lực
    COMPLETED = "completed"  # Đã hoàn thành
    EXPIRED = "expired"  # Hết hạn
    TERMINATED = "terminated"  # Đã chấm dứt
    CANCELLED = "cancelled"  # Đã hủy

class TaxType(str, Enum):
    """Loại thuế"""
    VAT = "vat"  # Thuế GTGT
    CIT = "cit"  # Thuế TNDN (Corporate Income Tax)
    PIT = "pit"  # Thuế TNCN (Personal Income Tax)
    FCT = "fct"  # Thuế nhà thầu (Foreign Contractor Tax)
    PROPERTY = "property"  # Thuế BĐS
    STAMP = "stamp"  # Lệ phí trước bạ

class BudgetType(str, Enum):
    """Loại ngân sách"""
    ANNUAL = "annual"  # Năm
    QUARTERLY = "quarterly"  # Quý
    MONTHLY = "monthly"  # Tháng
    PROJECT = "project"  # Dự án
    DEPARTMENT = "department"  # Phòng ban
    CAMPAIGN = "campaign"  # Chiến dịch

class BudgetStatus(str, Enum):
    """Trạng thái ngân sách"""
    DRAFT = "draft"  # Nháp
    PENDING_APPROVAL = "pending_approval"  # Chờ duyệt
    APPROVED = "approved"  # Đã duyệt
    ACTIVE = "active"  # Đang thực hiện
    CLOSED = "closed"  # Đã đóng
    CANCELLED = "cancelled"  # Đã hủy

class DebtType(str, Enum):
    """Loại công nợ"""
    RECEIVABLE = "receivable"  # Phải thu
    PAYABLE = "payable"  # Phải trả

# ==================== COMMISSION MODELS ====================

class CommissionCreate(BaseModel):
    """Tạo hoa hồng"""
    deal_id: str
    recipient_id: str  # User ID hoặc Collaborator ID
    recipient_type: str  # "employee" hoặc "collaborator"
    deal_value: float
    commission_rate: float  # Tỷ lệ %
    commission_amount: float
    policy_id: Optional[str] = None  # ID chính sách hoa hồng
    notes: Optional[str] = None

class CommissionResponse(BaseModel):
    """Response hoa hồng"""
    id: str
    deal_id: str
    deal_name: Optional[str] = None
    recipient_id: str
    recipient_name: Optional[str] = None
    recipient_type: str
    deal_value: float
    commission_rate: float
    commission_amount: float
    policy_id: Optional[str] = None
    policy_name: Optional[str] = None
    status: CommissionStatus
    approved_by: Optional[str] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None
    payment_ref: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ==================== SALARY MODELS ====================

class SalaryComponent(BaseModel):
    """Thành phần lương"""
    name: str
    type: str  # "earning" hoặc "deduction"
    amount: float
    is_taxable: bool = True
    notes: Optional[str] = None

class SalaryCreate(BaseModel):
    """Tạo bảng lương"""
    employee_id: str
    period_month: int  # Tháng (1-12)
    period_year: int  # Năm
    # Các khoản thu nhập
    base_salary: float = 0  # Lương cơ bản
    allowances: float = 0  # Phụ cấp
    bonus: float = 0  # Thưởng
    commission_total: float = 0  # Tổng hoa hồng
    overtime_pay: float = 0  # Lương tăng ca
    other_income: float = 0  # Thu nhập khác
    # Các khoản khấu trừ
    social_insurance: float = 0  # BHXH (8%)
    health_insurance: float = 0  # BHYT (1.5%)
    unemployment_insurance: float = 0  # BHTN (1%)
    personal_income_tax: float = 0  # Thuế TNCN
    other_deductions: float = 0  # Khấu trừ khác
    # Chi tiết
    components: List[SalaryComponent] = []
    work_days: int = 0  # Số ngày công
    paid_leave_days: int = 0  # Ngày nghỉ phép có lương
    unpaid_leave_days: int = 0  # Ngày nghỉ không lương
    notes: Optional[str] = None

class SalaryResponse(BaseModel):
    """Response bảng lương"""
    id: str
    employee_id: str
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    period_month: int
    period_year: int
    period_label: str  # "Tháng 12/2025"
    # Thu nhập
    base_salary: float
    allowances: float
    bonus: float
    commission_total: float
    overtime_pay: float
    other_income: float
    gross_income: float  # Tổng thu nhập
    # Khấu trừ
    social_insurance: float
    health_insurance: float
    unemployment_insurance: float
    personal_income_tax: float
    other_deductions: float
    total_deductions: float  # Tổng khấu trừ
    # Thực lĩnh
    net_salary: float  # Lương thực lĩnh
    # Chi tiết
    components: List[SalaryComponent] = []
    work_days: int
    paid_leave_days: int
    unpaid_leave_days: int
    # Trạng thái
    status: SalaryStatus
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    paid_at: Optional[str] = None
    payment_ref: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ==================== REVENUE & SALES MODELS ====================

class RevenueCreate(BaseModel):
    """Tạo doanh thu"""
    category: RevenueCategory
    amount: float
    description: str
    deal_id: Optional[str] = None
    project_id: Optional[str] = None
    customer_id: Optional[str] = None
    employee_id: Optional[str] = None  # Nhân viên tạo doanh thu
    branch_id: Optional[str] = None
    transaction_date: str
    payment_method: Optional[str] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None

class RevenueResponse(BaseModel):
    """Response doanh thu"""
    id: str
    category: RevenueCategory
    category_label: str
    amount: float
    description: str
    deal_id: Optional[str] = None
    deal_name: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    employee_id: Optional[str] = None
    employee_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    transaction_date: str
    payment_method: Optional[str] = None
    reference_no: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: str

class SalesTarget(BaseModel):
    """Mục tiêu doanh số"""
    id: str
    name: str
    target_type: str  # "individual", "team", "branch", "company"
    target_id: Optional[str] = None  # ID của cá nhân/team/branch
    target_name: Optional[str] = None
    period_type: str  # "monthly", "quarterly", "yearly"
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    period_year: int
    target_amount: float  # Mục tiêu doanh số
    achieved_amount: float = 0  # Đã đạt được
    achievement_rate: float = 0  # Tỷ lệ đạt (%)
    target_deals: int = 0  # Mục tiêu số deal
    achieved_deals: int = 0  # Số deal đã đạt
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

# ==================== EXPENSE MODELS ====================

class ExpenseCreate(BaseModel):
    """Tạo chi phí"""
    category: ExpenseCategory
    amount: float
    description: str
    vendor_name: Optional[str] = None  # Nhà cung cấp
    department_id: Optional[str] = None
    project_id: Optional[str] = None
    campaign_id: Optional[str] = None
    transaction_date: str
    payment_method: Optional[str] = None
    reference_no: Optional[str] = None  # Số chứng từ
    invoice_no: Optional[str] = None  # Số hoá đơn
    is_recurring: bool = False  # Chi phí định kỳ
    recurrence_type: Optional[str] = None  # "monthly", "quarterly", "yearly"
    attachments: List[str] = []  # URLs file đính kèm
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    """Response chi phí"""
    id: str
    category: ExpenseCategory
    category_label: str
    amount: float
    description: str
    vendor_name: Optional[str] = None
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    transaction_date: str
    payment_method: Optional[str] = None
    reference_no: Optional[str] = None
    invoice_no: Optional[str] = None
    is_recurring: bool
    recurrence_type: Optional[str] = None
    attachments: List[str] = []
    status: PaymentStatus
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str

# ==================== INVOICE MODELS ====================

class InvoiceItem(BaseModel):
    """Mục trong hoá đơn"""
    description: str
    quantity: float = 1
    unit: str = "item"  # item, m2, unit...
    unit_price: float
    discount_percent: float = 0
    discount_amount: float = 0
    vat_rate: float = 10  # % VAT
    vat_amount: float = 0
    amount: float  # Thành tiền (chưa VAT)
    total: float  # Tổng (đã VAT)

class InvoiceCreate(BaseModel):
    """Tạo hoá đơn"""
    invoice_type: InvoiceType
    customer_id: Optional[str] = None
    customer_name: str
    customer_address: Optional[str] = None
    customer_tax_code: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    deal_id: Optional[str] = None
    contract_id: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float  # Tổng tiền hàng
    total_discount: float = 0
    total_vat: float = 0
    total_amount: float  # Tổng cộng
    payment_method: Optional[str] = None
    payment_terms: Optional[str] = None  # Điều khoản thanh toán
    due_date: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    """Response hoá đơn"""
    id: str
    invoice_no: str  # Số hoá đơn (auto-generated)
    invoice_type: InvoiceType
    invoice_type_label: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_address: Optional[str] = None
    customer_tax_code: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    deal_id: Optional[str] = None
    deal_name: Optional[str] = None
    contract_id: Optional[str] = None
    contract_no: Optional[str] = None
    items: List[InvoiceItem]
    subtotal: float
    total_discount: float
    total_vat: float
    total_amount: float
    total_amount_words: str  # Số tiền bằng chữ
    payment_method: Optional[str] = None
    payment_terms: Optional[str] = None
    due_date: Optional[str] = None
    status: InvoiceStatus
    issued_at: Optional[str] = None
    sent_at: Optional[str] = None
    paid_at: Optional[str] = None
    paid_amount: float = 0
    remaining_amount: float = 0
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    pdf_url: Optional[str] = None
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ==================== CONTRACT MODELS ====================

class ContractParty(BaseModel):
    """Bên tham gia hợp đồng"""
    party_type: str  # "company", "individual"
    name: str
    representative: Optional[str] = None  # Người đại diện
    position: Optional[str] = None  # Chức vụ
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_code: Optional[str] = None
    id_number: Optional[str] = None  # CCCD/CMND
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None

class ContractPaymentSchedule(BaseModel):
    """Lịch thanh toán hợp đồng"""
    milestone: str  # Mốc thanh toán
    due_date: str
    amount: float
    percentage: float  # % giá trị HĐ
    status: PaymentStatus = PaymentStatus.PENDING
    paid_date: Optional[str] = None
    paid_amount: float = 0
    notes: Optional[str] = None

class ContractCreate(BaseModel):
    """Tạo hợp đồng"""
    contract_type: ContractType
    title: str
    # Các bên
    party_a: ContractParty  # Bên A (thường là công ty)
    party_b: ContractParty  # Bên B (khách hàng/đối tác)
    # Thông tin BĐS (nếu có)
    property_id: Optional[str] = None
    property_address: Optional[str] = None
    property_area: Optional[float] = None  # m2
    # Giá trị
    contract_value: float
    currency: str = "VND"
    vat_included: bool = True
    vat_rate: float = 10
    # Thời hạn
    start_date: str
    end_date: Optional[str] = None
    signing_date: Optional[str] = None
    # Thanh toán
    payment_schedules: List[ContractPaymentSchedule] = []
    deposit_amount: float = 0  # Tiền đặt cọc
    # Điều khoản
    terms_and_conditions: Optional[str] = None
    special_terms: Optional[str] = None
    # Liên kết
    deal_id: Optional[str] = None
    project_id: Optional[str] = None
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    # File
    template_id: Optional[str] = None  # Mẫu hợp đồng
    attachments: List[str] = []
    notes: Optional[str] = None

class ContractResponse(BaseModel):
    """Response hợp đồng"""
    id: str
    contract_no: str = ""  # Số hợp đồng (auto-generated)
    contract_type: Optional[ContractType] = None
    contract_type_label: str = ""
    title: str = ""
    # Các bên
    party_a: Optional[ContractParty] = None
    party_b: Optional[ContractParty] = None
    # Thông tin BĐS
    property_id: Optional[str] = None
    property_name: Optional[str] = None
    property_address: Optional[str] = None
    property_area: Optional[float] = None
    # Giá trị
    contract_value: float = 0
    contract_value_words: str = ""  # Số tiền bằng chữ
    currency: str = "VND"
    vat_included: bool = True
    vat_rate: float = 10
    vat_amount: float = 0
    total_value: float = 0  # Giá trị sau VAT
    # Thời hạn
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    signing_date: Optional[str] = None
    duration_days: int = 0  # Số ngày hiệu lực
    # Thanh toán
    payment_schedules: List[ContractPaymentSchedule] = []
    deposit_amount: float = 0
    paid_amount: float = 0
    remaining_amount: float = 0
    payment_progress: float = 0  # % đã thanh toán
    # Điều khoản
    terms_and_conditions: Optional[str] = None
    special_terms: Optional[str] = None
    # Liên kết
    deal_id: Optional[str] = None
    deal_name: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    lead_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    # Trạng thái
    status: ContractStatus
    signed_by_a: bool = False
    signed_by_b: bool = False
    signed_at_a: Optional[str] = None
    signed_at_b: Optional[str] = None
    # File
    template_id: Optional[str] = None
    attachments: List[str] = []
    pdf_url: Optional[str] = None
    notes: Optional[str] = None
    # Audit
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class ContractTemplate(BaseModel):
    """Mẫu hợp đồng"""
    id: str
    name: str
    contract_type: ContractType
    description: Optional[str] = None
    content: str  # Nội dung mẫu với variables
    variables: List[str] = []  # Danh sách biến: {{party_a_name}}, {{contract_value}}...
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None

# ==================== TAX MODELS ====================

class TaxDeclaration(BaseModel):
    """Kê khai thuế"""
    id: str
    tax_type: TaxType
    tax_type_label: str
    period_type: str  # "monthly", "quarterly", "yearly"
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    period_year: int
    period_label: str  # "Quý 4/2025", "Tháng 12/2025"
    # Số liệu
    taxable_revenue: float = 0  # Doanh thu chịu thuế
    deductible_expenses: float = 0  # Chi phí được trừ
    taxable_income: float = 0  # Thu nhập chịu thuế
    tax_rate: float = 0  # Thuế suất
    tax_amount: float = 0  # Số thuế phải nộp
    tax_paid: float = 0  # Đã nộp
    tax_remaining: float = 0  # Còn phải nộp
    # Trạng thái
    status: str  # "draft", "submitted", "accepted", "rejected"
    submitted_at: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    attachments: List[str] = []
    created_at: str
    updated_at: Optional[str] = None

class TaxReport(BaseModel):
    """Báo cáo thuế tổng hợp"""
    period_type: str
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    # Thuế GTGT
    vat_output: float = 0  # Thuế GTGT đầu ra
    vat_input: float = 0  # Thuế GTGT đầu vào
    vat_payable: float = 0  # Thuế GTGT phải nộp
    # Thuế TNDN
    cit_taxable_income: float = 0
    cit_rate: float = 20  # 20% theo quy định VN
    cit_amount: float = 0
    # Thuế TNCN
    pit_total_employees: int = 0
    pit_total_amount: float = 0
    # Tổng
    total_tax_payable: float = 0
    total_tax_paid: float = 0
    total_tax_remaining: float = 0

# ==================== BUDGET MODELS ====================

class BudgetLineItem(BaseModel):
    """Mục ngân sách"""
    category: str  # Danh mục
    description: str
    planned_amount: float  # Kế hoạch
    actual_amount: float = 0  # Thực tế
    variance: float = 0  # Chênh lệch
    variance_percent: float = 0  # % chênh lệch
    notes: Optional[str] = None

class BudgetCreate(BaseModel):
    """Tạo ngân sách"""
    name: str
    budget_type: BudgetType
    description: Optional[str] = None
    # Phạm vi áp dụng
    department_id: Optional[str] = None
    project_id: Optional[str] = None
    campaign_id: Optional[str] = None
    branch_id: Optional[str] = None
    # Thời gian
    period_year: int
    period_quarter: Optional[int] = None
    period_month: Optional[int] = None
    start_date: str
    end_date: str
    # Ngân sách
    total_planned: float
    line_items: List[BudgetLineItem] = []
    notes: Optional[str] = None

class BudgetResponse(BaseModel):
    """Response ngân sách"""
    id: str
    name: str
    budget_type: BudgetType
    budget_type_label: str
    description: Optional[str] = None
    # Phạm vi
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    campaign_id: Optional[str] = None
    campaign_name: Optional[str] = None
    branch_id: Optional[str] = None
    branch_name: Optional[str] = None
    # Thời gian
    period_year: int
    period_quarter: Optional[int] = None
    period_month: Optional[int] = None
    period_label: str
    start_date: str
    end_date: str
    # Ngân sách
    total_planned: float
    total_actual: float = 0
    total_variance: float = 0
    variance_percent: float = 0
    utilization_rate: float = 0  # % sử dụng
    line_items: List[BudgetLineItem] = []
    # Trạng thái
    status: BudgetStatus
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

# ==================== DEBT MANAGEMENT MODELS ====================

class DebtCreate(BaseModel):
    """Tạo công nợ"""
    debt_type: DebtType
    # Đối tượng
    customer_id: Optional[str] = None  # Khách hàng (nếu phải thu)
    vendor_id: Optional[str] = None  # Nhà cung cấp (nếu phải trả)
    partner_name: str  # Tên đối tác
    # Chi tiết
    description: str
    amount: float
    due_date: str
    # Liên kết
    invoice_id: Optional[str] = None
    contract_id: Optional[str] = None
    deal_id: Optional[str] = None
    notes: Optional[str] = None

class DebtResponse(BaseModel):
    """Response công nợ"""
    id: str
    debt_type: DebtType
    debt_type_label: str
    # Đối tượng
    customer_id: Optional[str] = None
    vendor_id: Optional[str] = None
    partner_name: str
    partner_phone: Optional[str] = None
    partner_email: Optional[str] = None
    # Chi tiết
    description: str
    amount: float
    paid_amount: float = 0
    remaining_amount: float = 0
    due_date: str
    days_overdue: int = 0  # Số ngày quá hạn
    # Liên kết
    invoice_id: Optional[str] = None
    invoice_no: Optional[str] = None
    contract_id: Optional[str] = None
    contract_no: Optional[str] = None
    deal_id: Optional[str] = None
    # Trạng thái
    status: PaymentStatus
    notes: Optional[str] = None
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

# ==================== FINANCIAL FORECAST MODELS ====================

class ForecastCreate(BaseModel):
    """Tạo dự báo tài chính"""
    name: str
    forecast_type: str  # "revenue", "expense", "cash_flow", "profit"
    period_type: str  # "monthly", "quarterly", "yearly"
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    # Dự báo
    forecast_amount: float
    confidence_level: float = 0.8  # Độ tin cậy (0-1)
    methodology: str  # "historical", "trend", "ai", "manual"
    assumptions: List[str] = []  # Giả định
    notes: Optional[str] = None

class ForecastResponse(BaseModel):
    """Response dự báo"""
    id: str
    name: str
    forecast_type: str
    forecast_type_label: str
    period_type: str
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    period_label: str
    # Dự báo vs Thực tế
    forecast_amount: float
    actual_amount: float = 0
    variance: float = 0
    variance_percent: float = 0
    accuracy: float = 0  # Độ chính xác
    # Chi tiết
    confidence_level: float
    methodology: str
    assumptions: List[str] = []
    notes: Optional[str] = None
    created_by: str
    created_at: str
    updated_at: Optional[str] = None

# ==================== BANK INTEGRATION MODELS ====================

class BankAccount(BaseModel):
    """Tài khoản ngân hàng"""
    id: str
    account_name: str
    account_number: str
    bank_name: str
    bank_code: str
    branch: Optional[str] = None
    currency: str = "VND"
    account_type: str  # "checking", "savings"
    is_primary: bool = False
    is_active: bool = True
    current_balance: float = 0
    last_synced: Optional[str] = None
    created_at: str

class BankTransaction(BaseModel):
    """Giao dịch ngân hàng"""
    id: str
    bank_account_id: str
    transaction_type: TransactionType
    amount: float
    balance_after: float
    description: str
    reference_no: str
    transaction_date: str
    counterparty_name: Optional[str] = None
    counterparty_account: Optional[str] = None
    # Mapping nội bộ
    matched_invoice_id: Optional[str] = None
    matched_expense_id: Optional[str] = None
    matched_revenue_id: Optional[str] = None
    is_reconciled: bool = False
    created_at: str

# ==================== FINANCIAL SUMMARY MODELS ====================

class FinancialSummary(BaseModel):
    """Tổng hợp tài chính"""
    period_type: str
    period_year: int
    period_month: Optional[int] = None
    period_quarter: Optional[int] = None
    period_label: str
    # Doanh thu
    total_revenue: float = 0
    revenue_by_category: Dict[str, float] = {}
    revenue_growth: float = 0  # % tăng trưởng so với kỳ trước
    # Chi phí
    total_expense: float = 0
    expense_by_category: Dict[str, float] = {}
    expense_growth: float = 0
    # Lợi nhuận
    gross_profit: float = 0  # Lợi nhuận gộp
    net_profit: float = 0  # Lợi nhuận ròng
    profit_margin: float = 0  # Biên lợi nhuận (%)
    # Công nợ
    total_receivable: float = 0  # Phải thu
    total_payable: float = 0  # Phải trả
    overdue_receivable: float = 0  # Quá hạn phải thu
    overdue_payable: float = 0  # Quá hạn phải trả
    # Thuế
    total_tax_payable: float = 0
    total_tax_paid: float = 0
    # Ngân sách
    budget_utilization: float = 0  # % sử dụng ngân sách
    # So sánh
    comparison_period: Optional[str] = None
    revenue_vs_target: float = 0  # % so với mục tiêu
    profit_vs_target: float = 0

class CashFlowReport(BaseModel):
    """Báo cáo dòng tiền"""
    period_type: str
    period_year: int
    period_month: Optional[int] = None
    period_label: str
    # Dòng tiền từ hoạt động kinh doanh
    operating_cash_in: float = 0  # Thu từ hoạt động KD
    operating_cash_out: float = 0  # Chi cho hoạt động KD
    net_operating_cash: float = 0
    # Dòng tiền từ hoạt động đầu tư
    investing_cash_in: float = 0
    investing_cash_out: float = 0
    net_investing_cash: float = 0
    # Dòng tiền từ hoạt động tài chính
    financing_cash_in: float = 0
    financing_cash_out: float = 0
    net_financing_cash: float = 0
    # Tổng
    total_cash_in: float = 0
    total_cash_out: float = 0
    net_cash_flow: float = 0
    opening_balance: float = 0
    closing_balance: float = 0

class ProfitLossReport(BaseModel):
    """Báo cáo Lãi/Lỗ"""
    period_type: str
    period_year: int
    period_month: Optional[int] = None
    period_label: str
    # Doanh thu
    revenue_details: List[Dict[str, Any]] = []
    total_revenue: float = 0
    # Giá vốn
    cost_of_goods_sold: float = 0
    gross_profit: float = 0
    gross_margin: float = 0
    # Chi phí hoạt động
    operating_expenses: List[Dict[str, Any]] = []
    total_operating_expense: float = 0
    operating_profit: float = 0
    operating_margin: float = 0
    # Chi phí khác
    other_income: float = 0
    other_expense: float = 0
    # Lợi nhuận trước thuế
    profit_before_tax: float = 0
    # Thuế
    income_tax: float = 0
    # Lợi nhuận sau thuế
    net_profit: float = 0
    net_margin: float = 0
