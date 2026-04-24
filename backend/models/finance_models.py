"""
ProHouzing Financial System Models
Hệ thống Tài chính cho Công ty Môi giới BĐS Thứ cấp

Collections:
1. payment_trackings - Theo dõi thanh toán hợp đồng
2. project_commissions - % hoa hồng theo dự án  
3. finance_commissions - Hoa hồng từ chủ đầu tư
4. commission_splits - Chia hoa hồng cá nhân
5. receivables - Công nợ chủ đầu tư
6. finance_invoices - Hóa đơn VAT
7. tax_records - Thuế (VAT, TNDN, TNCN)
8. payouts - Chi trả
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from config.finance_config import (
    PaymentInstallmentStatus,
    FinanceCommissionStatus,
    CommissionSplitStatus,
    ReceivableStatus,
    InvoiceStatus,
    PayoutStatus,
    RecipientRole,
)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. PAYMENT TRACKING - Theo dõi thanh toán hợp đồng
# ═══════════════════════════════════════════════════════════════════════════════

class PaymentInstallmentCreate(BaseModel):
    """Tạo đợt thanh toán"""
    contract_id: str
    installment_name: str              # "Đợt 1 - Đặt cọc", "Đợt 2", etc.
    installment_number: int
    amount: float                       # Số tiền
    due_date: str                       # Hạn thanh toán (ISO format)
    notes: Optional[str] = None


class PaymentInstallmentUpdate(BaseModel):
    """Cập nhật đợt thanh toán"""
    status: Optional[str] = None
    paid_date: Optional[str] = None
    notes: Optional[str] = None


class PaymentInstallmentResponse(BaseModel):
    """Response đợt thanh toán"""
    id: str
    contract_id: str
    contract_code: str = ""
    customer_name: str = ""
    project_name: str = ""
    
    installment_name: str
    installment_number: int
    amount: float
    due_date: str
    
    status: str
    status_label: str = ""
    status_color: str = ""
    
    paid_date: Optional[str] = None
    days_overdue: int = 0
    
    notes: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 2. PROJECT COMMISSION RATE - % Hoa hồng theo dự án
# ═══════════════════════════════════════════════════════════════════════════════

class ProjectCommissionCreate(BaseModel):
    """Cấu hình % hoa hồng cho dự án"""
    project_id: str
    commission_rate: float             # % hoa hồng (VD: 2.0 = 2%)
    effective_from: str                # Ngày bắt đầu hiệu lực
    effective_to: Optional[str] = None # Ngày kết thúc (null = vô thời hạn)
    notes: Optional[str] = None


class ProjectCommissionResponse(BaseModel):
    """Response % hoa hồng dự án"""
    id: str
    project_id: str
    project_name: str = ""
    project_code: str = ""
    developer_name: str = ""
    
    commission_rate: float
    effective_from: str
    effective_to: Optional[str] = None
    is_active: bool = True
    
    notes: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: str = ""
    created_at: str
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 3. FINANCE COMMISSION - Hoa hồng từ chủ đầu tư (sau khi xác nhận deal)
# ═══════════════════════════════════════════════════════════════════════════════

class FinanceCommissionCreate(BaseModel):
    """Tạo hoa hồng (auto khi developer confirm)"""
    contract_id: str
    deal_id: Optional[str] = None


class FinanceCommissionResponse(BaseModel):
    """Response hoa hồng"""
    id: str
    code: str                          # FC-YYYYMM-XXXX
    
    # Liên kết
    contract_id: str
    contract_code: str = ""
    contract_value: float = 0
    deal_id: Optional[str] = None
    deal_code: str = ""
    project_id: str = ""
    project_name: str = ""
    developer_id: Optional[str] = None
    developer_name: str = ""
    customer_id: Optional[str] = None
    customer_name: str = ""
    
    # Sale info
    sale_id: str = ""
    sale_name: str = ""
    leader_id: Optional[str] = None
    leader_name: str = ""
    ref_id: Optional[str] = None       # Affiliate
    ref_name: str = ""
    has_affiliate: bool = False
    
    # Tính toán
    commission_rate: float = 0         # % từ dự án
    total_commission: float = 0        # Tổng hoa hồng = contract_value x rate
    
    # Trạng thái
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Audit
    confirmed_by: Optional[str] = None
    confirmed_by_name: str = ""
    confirmed_at: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 4. COMMISSION SPLIT - Chia hoa hồng cá nhân
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionSplitResponse(BaseModel):
    """Response chia hoa hồng"""
    id: str
    code: str                          # CS-YYYYMM-XXXX
    
    # Liên kết
    commission_id: str                 # FK to finance_commissions
    commission_code: str = ""
    contract_id: str
    contract_code: str = ""
    
    # Người nhận
    recipient_id: str                  # user_id hoặc "company"
    recipient_name: str = ""
    recipient_role: str                # sale, leader, company, affiliate
    recipient_role_label: str = ""
    
    # Tính toán
    split_percent: float = 0           # % chia
    gross_amount: float = 0            # Số tiền trước thuế
    tax_rate: float = 0                # % thuế TNCN (10% cho sale/affiliate, 0 cho company)
    tax_amount: float = 0              # Số tiền thuế
    net_amount: float = 0              # Thực nhận = gross - tax
    
    # Trạng thái
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Payout
    payout_id: Optional[str] = None
    paid_at: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 5. RECEIVABLE - Công nợ chủ đầu tư
# ═══════════════════════════════════════════════════════════════════════════════

class ReceivableCreate(BaseModel):
    """Tạo công nợ (auto khi tạo commission)"""
    commission_id: str


class ReceivableResponse(BaseModel):
    """Response công nợ"""
    id: str
    code: str                          # RCV-YYYYMM-XXXX
    
    # Liên kết
    commission_id: str
    commission_code: str = ""
    contract_id: str
    contract_code: str = ""
    developer_id: str
    developer_name: str = ""
    
    # Số tiền
    amount_due: float = 0              # Phải thu
    amount_paid: float = 0             # Đã thu
    amount_remaining: float = 0        # Còn lại
    
    # Due date
    due_date: Optional[str] = None
    days_overdue: int = 0
    
    # Trạng thái
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Audit
    confirmed_by: Optional[str] = None
    confirmed_by_name: str = ""
    confirmed_at: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None


class ReceivablePaymentRequest(BaseModel):
    """Ghi nhận thanh toán từ chủ đầu tư"""
    amount: float
    payment_date: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 6. INVOICE - Hóa đơn VAT xuất cho chủ đầu tư
# ═══════════════════════════════════════════════════════════════════════════════

class InvoiceCreate(BaseModel):
    """Tạo hóa đơn (sau khi xác nhận hoa hồng)"""
    commission_id: str
    invoice_date: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(BaseModel):
    """Response hóa đơn"""
    id: str
    invoice_no: str                    # INV-YYYYMM-XXXX
    
    # Liên kết
    commission_id: str
    commission_code: str = ""
    contract_id: str
    contract_code: str = ""
    receivable_id: Optional[str] = None
    
    # Bên mua (Chủ đầu tư)
    developer_id: str
    developer_name: str = ""
    developer_address: str = ""
    developer_tax_code: str = ""
    
    # Bên bán (ProHouzing)
    company_name: str = "Công ty TNHH ProHouzing"
    company_address: str = ""
    company_tax_code: str = ""
    
    # Giá trị
    subtotal: float = 0                # Giá trước thuế (= hoa hồng)
    vat_rate: float = 10.0             # VAT 10%
    vat_amount: float = 0              # Tiền VAT
    total_amount: float = 0            # Tổng = subtotal + VAT
    
    # Thông tin
    invoice_date: str
    description: str = ""
    
    # Trạng thái
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Audit
    issued_by: Optional[str] = None
    issued_by_name: str = ""
    issued_at: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 7. TAX RECORD - Theo dõi thuế
# ═══════════════════════════════════════════════════════════════════════════════

class TaxType(str, Enum):
    """Loại thuế"""
    VAT_OUTPUT = "vat_output"          # VAT đầu ra
    TNDN = "tndn"                      # Thuế TNDN công ty
    TNCN = "tncn"                      # Thuế TNCN cá nhân


class TaxRecordResponse(BaseModel):
    """Response bản ghi thuế"""
    id: str
    
    tax_type: str
    tax_type_label: str = ""
    
    # Period
    period_month: int
    period_year: int
    period_label: str = ""             # "Tháng 12/2025"
    
    # Số liệu
    taxable_amount: float = 0          # Số tiền chịu thuế
    tax_rate: float = 0                # Thuế suất %
    tax_amount: float = 0              # Số thuế phải nộp
    
    # Liên kết (optional)
    commission_split_id: Optional[str] = None
    invoice_id: Optional[str] = None
    user_id: Optional[str] = None
    user_name: str = ""
    
    created_at: str


# ═══════════════════════════════════════════════════════════════════════════════
# 8. PAYOUT - Chi trả
# ═══════════════════════════════════════════════════════════════════════════════

class PayoutCreate(BaseModel):
    """Tạo payout (auto khi chia hoa hồng + chủ đầu tư đã trả)"""
    commission_split_id: str


class PayoutResponse(BaseModel):
    """Response payout"""
    id: str
    code: str                          # PAY-YYYYMM-XXXX
    
    # Liên kết
    commission_split_id: str
    commission_split_code: str = ""
    recipient_id: str
    recipient_name: str = ""
    recipient_role: str = ""
    
    # Số tiền
    gross_amount: float = 0            # Số tiền trước thuế
    tax_amount: float = 0              # Thuế TNCN đã trừ
    net_amount: float = 0              # Thực chi
    
    # Bank info
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    
    # Trạng thái
    status: str
    status_label: str = ""
    status_color: str = ""
    
    # Approval
    approved_by: Optional[str] = None
    approved_by_name: str = ""
    approved_at: Optional[str] = None
    
    # Payment
    paid_at: Optional[str] = None
    payment_reference: Optional[str] = None
    
    created_at: str
    updated_at: Optional[str] = None


class PayoutApproveRequest(BaseModel):
    """Request duyệt payout (kế toán)"""
    notes: Optional[str] = None


class PayoutMarkPaidRequest(BaseModel):
    """Request đánh dấu đã trả"""
    payment_reference: Optional[str] = None
    paid_at: Optional[str] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# 9. DASHBOARD MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CEODashboardResponse(BaseModel):
    """Dashboard cho CEO"""
    # Doanh thu
    total_contract_value: float = 0    # Tổng giá trị HĐ
    total_commission: float = 0        # Tổng hoa hồng
    total_revenue: float = 0           # Doanh thu = commission + VAT
    
    # Công nợ
    receivable_total: float = 0        # Tổng phải thu
    receivable_paid: float = 0         # Đã thu
    receivable_pending: float = 0      # Chưa thu
    receivable_overdue: float = 0      # Quá hạn
    
    # Thuế
    vat_output: float = 0              # VAT đầu ra
    tndn_estimate: float = 0           # Thuế TNDN ước tính
    
    # By period
    period_month: int
    period_year: int
    period_label: str = ""


class SaleDashboardResponse(BaseModel):
    """Dashboard cho Sale"""
    user_id: str
    user_name: str = ""
    
    # Thu nhập
    total_gross: float = 0             # Tổng thu nhập trước thuế
    total_tax: float = 0               # Tổng thuế TNCN
    total_net: float = 0               # Tổng thực nhận
    
    # Chi tiết
    pending_amount: float = 0          # Chờ duyệt
    approved_amount: float = 0         # Đã duyệt chưa trả
    paid_amount: float = 0             # Đã trả
    
    # By period
    period_month: int
    period_year: int
    period_label: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# 10. FILTER MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class FinanceListFilters(BaseModel):
    """Filters chung cho các list"""
    status: Optional[str] = None
    project_id: Optional[str] = None
    developer_id: Optional[str] = None
    user_id: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    search: Optional[str] = None
    
    skip: int = 0
    limit: int = 50
    sort_by: str = "created_at"
    sort_order: str = "desc"
