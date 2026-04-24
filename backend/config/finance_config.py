"""
ProHouzing Financial System Configuration
Hệ thống Tài chính cho Công ty Môi giới BĐS Thứ cấp

Luồng tiền: Khách hàng → Chủ đầu tư → ProHouzing → Nhân sự nội bộ

CONFIG LOCKED - KHÔNG THAY ĐỔI
"""

from enum import Enum
from typing import Dict, List, Any


# ═══════════════════════════════════════════════════════════════════════════════
# 1. COMMISSION SPLIT - CHUẨN (LOCKED)
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionSplitConfig:
    """
    Tỷ lệ chia hoa hồng chuẩn
    - Sale: 60%
    - Leader: 10%
    - Company: 25%
    - Affiliate: 5% (nếu có ref_id, lấy từ TỔNG HOA HỒNG)
    
    Lưu ý: Nếu không có affiliate → 5% chuyển về Company (Company = 30%)
    """
    SALE_PERCENT = 60.0
    LEADER_PERCENT = 10.0
    COMPANY_PERCENT = 25.0
    AFFILIATE_PERCENT = 5.0
    
    # Nếu không có affiliate, company nhận thêm phần affiliate
    COMPANY_PERCENT_NO_AFFILIATE = 30.0  # 25% + 5%


# ═══════════════════════════════════════════════════════════════════════════════
# 2. TAX RATES (LOCKED)
# ═══════════════════════════════════════════════════════════════════════════════

class TaxConfig:
    """
    Thuế suất cố định theo quy định VN
    """
    VAT_RATE = 10.0           # VAT: 10%
    TNDN_RATE = 20.0          # Thuế TNDN công ty: 20% (chỉ tracking)
    TNCN_SALE_RATE = 10.0     # Thuế TNCN Sale: 10%
    TNCN_AFFILIATE_RATE = 10.0  # Thuế TNCN Affiliate: 10%


# ═══════════════════════════════════════════════════════════════════════════════
# 3. PAYMENT TRACKING STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class PaymentInstallmentStatus(str, Enum):
    """Trạng thái đợt thanh toán"""
    PENDING = "pending"           # Chưa thanh toán
    PAID = "paid"                 # Đã thanh toán
    OVERDUE = "overdue"           # Quá hạn


PAYMENT_STATUS_CONFIG = {
    PaymentInstallmentStatus.PENDING: {
        "label": "Chưa thanh toán",
        "color": "yellow",
    },
    PaymentInstallmentStatus.PAID: {
        "label": "Đã thanh toán",
        "color": "green",
    },
    PaymentInstallmentStatus.OVERDUE: {
        "label": "Quá hạn",
        "color": "red",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 4. COMMISSION STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class FinanceCommissionStatus(str, Enum):
    """Trạng thái hoa hồng từ chủ đầu tư"""
    PENDING = "pending"           # Chờ xác nhận từ chủ đầu tư
    CONFIRMED = "confirmed"       # Chủ đầu tư đã xác nhận deal
    CALCULATED = "calculated"     # Đã tính hoa hồng
    SPLIT = "split"               # Đã chia hoa hồng


COMMISSION_STATUS_CONFIG = {
    FinanceCommissionStatus.PENDING: {
        "label": "Chờ xác nhận",
        "color": "yellow",
    },
    FinanceCommissionStatus.CONFIRMED: {
        "label": "Đã xác nhận",
        "color": "blue",
    },
    FinanceCommissionStatus.CALCULATED: {
        "label": "Đã tính hoa hồng",
        "color": "purple",
    },
    FinanceCommissionStatus.SPLIT: {
        "label": "Đã chia hoa hồng",
        "color": "green",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 5. COMMISSION SPLIT STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class CommissionSplitStatus(str, Enum):
    """Trạng thái chia hoa hồng cá nhân"""
    PENDING = "pending"           # Chờ tính
    CALCULATED = "calculated"     # Đã tính
    PENDING_PAYOUT = "pending_payout"  # Chờ chi trả
    PAID = "paid"                 # Đã chi trả


SPLIT_STATUS_CONFIG = {
    CommissionSplitStatus.PENDING: {
        "label": "Chờ tính",
        "color": "gray",
    },
    CommissionSplitStatus.CALCULATED: {
        "label": "Đã tính",
        "color": "blue",
    },
    CommissionSplitStatus.PENDING_PAYOUT: {
        "label": "Chờ chi trả",
        "color": "yellow",
    },
    CommissionSplitStatus.PAID: {
        "label": "Đã chi trả",
        "color": "green",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 6. RECEIVABLE STATUS (Công nợ chủ đầu tư)
# ═══════════════════════════════════════════════════════════════════════════════

class ReceivableStatus(str, Enum):
    """Trạng thái công nợ phải thu từ chủ đầu tư"""
    PENDING = "pending"           # Chờ
    CONFIRMED = "confirmed"       # Xác nhận (chủ đầu tư đồng ý)
    PARTIAL = "partial"           # Đã thanh toán một phần
    PAID = "paid"                 # Đã thanh toán đủ
    OVERDUE = "overdue"           # Quá hạn


RECEIVABLE_STATUS_CONFIG = {
    ReceivableStatus.PENDING: {
        "label": "Chờ xác nhận",
        "color": "gray",
    },
    ReceivableStatus.CONFIRMED: {
        "label": "Đã xác nhận",
        "color": "blue",
    },
    ReceivableStatus.PARTIAL: {
        "label": "Thanh toán một phần",
        "color": "yellow",
    },
    ReceivableStatus.PAID: {
        "label": "Đã thanh toán",
        "color": "green",
    },
    ReceivableStatus.OVERDUE: {
        "label": "Quá hạn",
        "color": "red",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 7. INVOICE STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class InvoiceStatus(str, Enum):
    """Trạng thái hóa đơn"""
    DRAFT = "draft"               # Nháp
    ISSUED = "issued"             # Đã xuất
    PAID = "paid"                 # Đã thanh toán


INVOICE_STATUS_CONFIG = {
    InvoiceStatus.DRAFT: {
        "label": "Nháp",
        "color": "gray",
    },
    InvoiceStatus.ISSUED: {
        "label": "Đã xuất",
        "color": "blue",
    },
    InvoiceStatus.PAID: {
        "label": "Đã thanh toán",
        "color": "green",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 8. PAYOUT STATUS
# ═══════════════════════════════════════════════════════════════════════════════

class PayoutStatus(str, Enum):
    """Trạng thái chi trả cho nhân viên"""
    PENDING = "pending"           # Chờ duyệt
    APPROVED = "approved"         # Đã duyệt (kế toán)
    PAID = "paid"                 # Đã trả


PAYOUT_STATUS_CONFIG = {
    PayoutStatus.PENDING: {
        "label": "Chờ duyệt",
        "color": "yellow",
    },
    PayoutStatus.APPROVED: {
        "label": "Đã duyệt",
        "color": "blue",
    },
    PayoutStatus.PAID: {
        "label": "Đã trả",
        "color": "green",
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 9. RECIPIENT ROLE
# ═══════════════════════════════════════════════════════════════════════════════

class RecipientRole(str, Enum):
    """Vai trò người nhận hoa hồng"""
    SALE = "sale"                 # Nhân viên sale
    LEADER = "leader"             # Trưởng nhóm
    COMPANY = "company"           # Công ty
    AFFILIATE = "affiliate"       # Affiliate


RECIPIENT_ROLE_CONFIG = {
    RecipientRole.SALE: {
        "label": "Nhân viên Sale",
        "percent": CommissionSplitConfig.SALE_PERCENT,
    },
    RecipientRole.LEADER: {
        "label": "Trưởng nhóm",
        "percent": CommissionSplitConfig.LEADER_PERCENT,
    },
    RecipientRole.COMPANY: {
        "label": "Công ty",
        "percent": CommissionSplitConfig.COMPANY_PERCENT,
    },
    RecipientRole.AFFILIATE: {
        "label": "Affiliate",
        "percent": CommissionSplitConfig.AFFILIATE_PERCENT,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# 10. TRIGGER WORKFLOW
# ═══════════════════════════════════════════════════════════════════════════════

class FinanceTrigger(str, Enum):
    """Event triggers cho workflow tài chính"""
    CONTRACT_SIGNED = "contract_signed"
    DEVELOPER_CONFIRM_PAYMENT = "developer_confirm_payment"
    COMMISSION_CREATED = "commission_created"
    COMMISSION_SPLIT = "commission_split"
    ACCOUNTANT_APPROVE = "accountant_approve"


# ═══════════════════════════════════════════════════════════════════════════════
# 11. PERMISSION ROLES (Kế toán)
# ═══════════════════════════════════════════════════════════════════════════════

class FinanceRole(str, Enum):
    """Vai trò trong hệ thống tài chính"""
    ADMIN = "admin"               # Toàn quyền
    ACCOUNTANT = "accountant"     # Kế toán - duyệt + xác nhận + xuất hóa đơn
    MANAGER = "manager"           # Manager - xem + đề xuất
    SALES = "sales"               # Sales - chỉ xem tiền của mình


FINANCE_PERMISSIONS = {
    FinanceRole.ADMIN: {
        "can_view_all": True,
        "can_confirm_payment": True,
        "can_approve_payout": True,
        "can_issue_invoice": True,
        "can_manage_tax": True,
        "can_reconcile": True,
    },
    FinanceRole.ACCOUNTANT: {
        "can_view_all": True,
        "can_confirm_payment": True,
        "can_approve_payout": True,
        "can_issue_invoice": True,
        "can_manage_tax": True,
        "can_reconcile": True,
    },
    FinanceRole.MANAGER: {
        "can_view_all": True,
        "can_confirm_payment": False,
        "can_approve_payout": False,
        "can_issue_invoice": False,
        "can_manage_tax": False,
        "can_reconcile": False,
    },
    FinanceRole.SALES: {
        "can_view_all": False,
        "can_confirm_payment": False,
        "can_approve_payout": False,
        "can_issue_invoice": False,
        "can_manage_tax": False,
        "can_reconcile": False,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_payment_status_config(status: str) -> dict:
    """Get payment status config"""
    try:
        return PAYMENT_STATUS_CONFIG.get(PaymentInstallmentStatus(status), {})
    except ValueError:
        return {}


def get_commission_status_config(status: str) -> dict:
    """Get commission status config"""
    try:
        return COMMISSION_STATUS_CONFIG.get(FinanceCommissionStatus(status), {})
    except ValueError:
        return {}


def get_split_status_config(status: str) -> dict:
    """Get split status config"""
    try:
        return SPLIT_STATUS_CONFIG.get(CommissionSplitStatus(status), {})
    except ValueError:
        return {}


def get_receivable_status_config(status: str) -> dict:
    """Get receivable status config"""
    try:
        return RECEIVABLE_STATUS_CONFIG.get(ReceivableStatus(status), {})
    except ValueError:
        return {}


def get_invoice_status_config(status: str) -> dict:
    """Get invoice status config"""
    try:
        return INVOICE_STATUS_CONFIG.get(InvoiceStatus(status), {})
    except ValueError:
        return {}


def get_payout_status_config(status: str) -> dict:
    """Get payout status config"""
    try:
        return PAYOUT_STATUS_CONFIG.get(PayoutStatus(status), {})
    except ValueError:
        return {}


def has_finance_permission(role: str, permission: str) -> bool:
    """Check if role has specific finance permission"""
    try:
        role_enum = FinanceRole(role)
        permissions = FINANCE_PERMISSIONS.get(role_enum, {})
        return permissions.get(permission, False)
    except ValueError:
        return False


def calculate_commission_split(
    total_commission: float,
    has_affiliate: bool = False
) -> Dict[str, float]:
    """
    Calculate commission split amounts
    
    Returns:
        {
            "sale": amount,
            "leader": amount,
            "company": amount,
            "affiliate": amount (0 if no affiliate)
        }
    """
    if has_affiliate:
        return {
            "sale": total_commission * CommissionSplitConfig.SALE_PERCENT / 100,
            "leader": total_commission * CommissionSplitConfig.LEADER_PERCENT / 100,
            "company": total_commission * CommissionSplitConfig.COMPANY_PERCENT / 100,
            "affiliate": total_commission * CommissionSplitConfig.AFFILIATE_PERCENT / 100,
        }
    else:
        return {
            "sale": total_commission * CommissionSplitConfig.SALE_PERCENT / 100,
            "leader": total_commission * CommissionSplitConfig.LEADER_PERCENT / 100,
            "company": total_commission * CommissionSplitConfig.COMPANY_PERCENT_NO_AFFILIATE / 100,
            "affiliate": 0,
        }


def calculate_tax(amount: float, tax_type: str) -> float:
    """
    Calculate tax amount
    
    Args:
        amount: Base amount
        tax_type: "vat", "tncn_sale", "tncn_affiliate", "tndn"
    
    Returns:
        Tax amount
    """
    tax_rates = {
        "vat": TaxConfig.VAT_RATE,
        "tncn_sale": TaxConfig.TNCN_SALE_RATE,
        "tncn_affiliate": TaxConfig.TNCN_AFFILIATE_RATE,
        "tndn": TaxConfig.TNDN_RATE,
    }
    
    rate = tax_rates.get(tax_type, 0)
    return amount * rate / 100


def calculate_net_amount(gross_amount: float, tax_type: str) -> Dict[str, float]:
    """
    Calculate net amount after tax
    
    Returns:
        {
            "gross": original amount,
            "tax": tax amount,
            "net": amount after tax
        }
    """
    tax = calculate_tax(gross_amount, tax_type)
    return {
        "gross": gross_amount,
        "tax": tax,
        "net": gross_amount - tax,
    }
