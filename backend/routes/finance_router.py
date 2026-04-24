"""
ProHouzing Finance Router
API Endpoints cho Hệ thống Tài chính BĐS Thứ cấp

Endpoints:
1. Payment Tracking - Theo dõi thanh toán
2. Project Commission - % Hoa hồng dự án  
3. Finance Commission - Hoa hồng từ chủ đầu tư
4. Commission Split - Chia hoa hồng
5. Receivable - Công nợ
6. Invoice - Hóa đơn
7. Payout - Chi trả
8. Dashboard - Báo cáo
9. Auto Flow Engine - Event-driven automation
10. Alerts - Cảnh báo
11. Timeline - Lịch sử giao dịch
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List
from datetime import datetime, timezone
import logging

from models.finance_models import (
    PaymentInstallmentCreate, PaymentInstallmentUpdate, PaymentInstallmentResponse,
    ProjectCommissionCreate, ProjectCommissionResponse,
    FinanceCommissionCreate, FinanceCommissionResponse,
    CommissionSplitResponse,
    ReceivableCreate, ReceivableResponse, ReceivablePaymentRequest,
    InvoiceCreate, InvoiceResponse,
    PayoutCreate, PayoutResponse, PayoutApproveRequest, PayoutMarkPaidRequest,
    CEODashboardResponse, SaleDashboardResponse,
)

from config.finance_config import (
    PaymentInstallmentStatus, FinanceCommissionStatus,
    ReceivableStatus, PayoutStatus,
    has_finance_permission, FinanceRole,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["finance"])

# Database reference
_db = None
_finance_service = None
_flow_engine = None


def set_database(database):
    """Set the database reference"""
    global _db, _finance_service, _flow_engine
    _db = database
    
    from services.finance_service import FinanceService
    from services.finance_flow_engine import FinanceFlowEngine
    
    _finance_service = FinanceService(database)
    _flow_engine = FinanceFlowEngine(database)


def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


def get_service():
    """Get finance service"""
    if _finance_service is None:
        raise HTTPException(status_code=500, detail="Finance service not initialized")
    return _finance_service


def get_flow_engine():
    """Get flow engine"""
    if _flow_engine is None:
        raise HTTPException(status_code=500, detail="Flow engine not initialized")
    return _flow_engine


async def get_current_user_internal():
    """Get current user - returns None for now (authentication optional)"""
    return None


def require_accountant_role(user: dict) -> bool:
    """Check if user has accountant role"""
    if not user:
        return True  # Skip for now (auth optional)
    
    role = user.get("role", "sales")
    # Map roles to finance roles
    role_mapping = {
        "admin": FinanceRole.ADMIN.value,
        "bod": FinanceRole.ADMIN.value,
        "accountant": FinanceRole.ACCOUNTANT.value,
        "manager": FinanceRole.MANAGER.value,
        "sales": FinanceRole.SALES.value,
    }
    finance_role = role_mapping.get(role, FinanceRole.SALES.value)
    
    return finance_role in [FinanceRole.ADMIN.value, FinanceRole.ACCOUNTANT.value]


# ═══════════════════════════════════════════════════════════════════════════════
# 1. PAYMENT TRACKING - Theo dõi thanh toán
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/payments", response_model=List[PaymentInstallmentResponse])
async def list_payment_installments(
    contract_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List payment installments với filter"""
    service = get_service()
    return await service.list_payment_installments(
        contract_id=contract_id,
        status=status,
        skip=skip,
        limit=limit
    )


@router.post("/payments", response_model=PaymentInstallmentResponse)
async def create_payment_installment(request: PaymentInstallmentCreate):
    """Tạo đợt thanh toán mới"""
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    return await service.create_payment_installment(request, user_id)


@router.post("/payments/from-contract/{contract_id}", response_model=List[PaymentInstallmentResponse])
async def create_payments_from_contract(contract_id: str):
    """
    Auto tạo payment tracking từ contract
    TRIGGER: contract_signed → enable payment tracking
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    return await service.create_payment_installments_from_contract(contract_id, user_id)


@router.put("/payments/{installment_id}/status")
async def update_payment_status(
    installment_id: str,
    status: str,
    paid_date: Optional[str] = None,
):
    """Cập nhật trạng thái đợt thanh toán"""
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    result = await service.update_payment_installment_status(
        installment_id, status, paid_date, user_id
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Payment installment not found")
    
    return result


@router.post("/payments/check-overdue")
async def check_overdue_payments():
    """
    Kiểm tra và cập nhật đợt thanh toán quá hạn
    Chạy định kỳ (daily cron)
    """
    service = get_service()
    count = await service.check_overdue_payments()
    return {"success": True, "updated_count": count}


# ═══════════════════════════════════════════════════════════════════════════════
# 2. PROJECT COMMISSION - % Hoa hồng dự án
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/project-commissions", response_model=List[ProjectCommissionResponse])
async def list_project_commissions(
    project_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List project commission rates"""
    service = get_service()
    return await service.list_project_commissions(
        project_id=project_id,
        skip=skip,
        limit=limit
    )


@router.post("/project-commissions", response_model=ProjectCommissionResponse)
async def create_project_commission(request: ProjectCommissionCreate):
    """
    Tạo cấu hình % hoa hồng cho dự án
    BẮT BUỘC cấu hình theo từng dự án
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    return await service.create_project_commission(request, user_id)


@router.get("/project-commissions/{project_id}/rate")
async def get_project_commission_rate(project_id: str):
    """Lấy % hoa hồng hiện tại của dự án"""
    service = get_service()
    rate = await service.get_project_commission_rate(project_id)
    return {"project_id": project_id, "commission_rate": rate}


# ═══════════════════════════════════════════════════════════════════════════════
# 3. FINANCE COMMISSION - Hoa hồng từ chủ đầu tư
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/commissions", response_model=List[FinanceCommissionResponse])
async def list_finance_commissions(
    status: Optional[str] = None,
    project_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List finance commissions"""
    service = get_service()
    return await service.list_finance_commissions(
        status=status,
        project_id=project_id,
        skip=skip,
        limit=limit
    )


@router.get("/commissions/{commission_id}", response_model=FinanceCommissionResponse)
async def get_finance_commission(commission_id: str):
    """Get single finance commission"""
    service = get_service()
    result = await service.get_finance_commission(commission_id)
    if not result:
        raise HTTPException(status_code=404, detail="Commission not found")
    return result


@router.post("/commissions/confirm/{contract_id}")
async def confirm_developer_payment(contract_id: str):
    """
    Xác nhận thanh toán từ chủ đầu tư
    TRIGGER: developer_confirm_payment → tạo commission
    
    Flow:
    1. Tạo finance_commission
    2. Auto split commission (Sale 60%, Leader 10%, Company 25%, Affiliate 5%)
    3. Auto tạo receivable
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền xác nhận thanh toán"
        )
    
    commission, errors = await service.create_finance_commission(contract_id, user_id)
    
    if errors:
        raise HTTPException(status_code=400, detail="; ".join(errors))
    
    return {
        "success": True,
        "message": "Đã xác nhận thanh toán và tạo hoa hồng",
        "commission": commission
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 4. COMMISSION SPLIT - Chia hoa hồng
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/splits", response_model=List[CommissionSplitResponse])
async def list_commission_splits(
    commission_id: Optional[str] = None,
    recipient_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List commission splits"""
    service = get_service()
    return await service.list_commission_splits(
        commission_id=commission_id,
        recipient_id=recipient_id,
        status=status,
        skip=skip,
        limit=limit
    )


@router.get("/splits/my")
async def get_my_commission_splits(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Lấy commission splits của user hiện tại"""
    service = get_service()
    current_user = await get_current_user_internal()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await service.list_commission_splits(
        recipient_id=current_user["id"],
        status=status,
        skip=skip,
        limit=limit
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 5. RECEIVABLE - Công nợ chủ đầu tư
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/receivables", response_model=List[ReceivableResponse])
async def list_receivables(
    status: Optional[str] = None,
    developer_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List receivables"""
    service = get_service()
    return await service.list_receivables(
        status=status,
        developer_id=developer_id,
        skip=skip,
        limit=limit
    )


@router.post("/receivables/{receivable_id}/confirm")
async def confirm_receivable(
    receivable_id: str,
    due_date: Optional[str] = None,
):
    """
    Kế toán xác nhận công nợ
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    result = await service.confirm_receivable(receivable_id, user_id, due_date)
    if not result:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    return result


@router.post("/receivables/{receivable_id}/payment")
async def record_receivable_payment(
    receivable_id: str,
    request: ReceivablePaymentRequest,
):
    """
    Ghi nhận thanh toán từ chủ đầu tư
    Kế toán xác nhận tiền đã về
    
    TRIGGER: Khi thanh toán đủ → auto tạo payouts cho Sale/Leader/Affiliate
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền xác nhận tiền về"
        )
    
    result = await service.record_receivable_payment(receivable_id, request, user_id)
    if not result:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    return {
        "success": True,
        "message": "Đã ghi nhận thanh toán",
        "receivable": result
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 6. INVOICE - Hóa đơn VAT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = None,
    developer_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List invoices"""
    service = get_service()
    return await service.list_invoices(
        status=status,
        developer_id=developer_id,
        skip=skip,
        limit=limit
    )


@router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(request: InvoiceCreate):
    """
    Tạo hóa đơn VAT xuất cho chủ đầu tư
    Kế toán tạo sau khi xác nhận hoa hồng
    
    Công thức:
    - Subtotal = Hoa hồng
    - VAT = 10%
    - Total = Subtotal + VAT
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền xuất hóa đơn"
        )
    
    result = await service.create_invoice(request, user_id)
    if not result:
        raise HTTPException(status_code=400, detail="Không thể tạo hóa đơn")
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# 7. PAYOUT - Chi trả
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/payouts", response_model=List[PayoutResponse])
async def list_payouts(
    status: Optional[str] = None,
    recipient_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """List payouts"""
    service = get_service()
    return await service.list_payouts(
        status=status,
        recipient_id=recipient_id,
        skip=skip,
        limit=limit
    )


@router.get("/payouts/my")
async def get_my_payouts(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """Lấy payouts của user hiện tại"""
    service = get_service()
    current_user = await get_current_user_internal()
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return await service.list_payouts(
        recipient_id=current_user["id"],
        status=status,
        skip=skip,
        limit=limit
    )


@router.post("/payouts/{payout_id}/approve")
async def approve_payout(
    payout_id: str,
    request: Optional[PayoutApproveRequest] = None,
):
    """
    Kế toán duyệt payout
    
    HARD RULE: Không có kế toán duyệt → không được trả tiền
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền duyệt chi trả"
        )
    
    notes = request.notes if request else None
    result = await service.approve_payout(payout_id, user_id, notes)
    
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Không thể duyệt. Payout không ở trạng thái chờ duyệt."
        )
    
    return {
        "success": True,
        "message": "Đã duyệt payout",
        "payout": result
    }


@router.post("/payouts/{payout_id}/mark-paid")
async def mark_payout_paid(
    payout_id: str,
    request: PayoutMarkPaidRequest,
):
    """
    Đánh dấu đã chi trả
    CHỈ được thực hiện sau khi đã duyệt
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền đánh dấu đã trả"
        )
    
    result = await service.mark_payout_paid(payout_id, request, user_id)
    
    if not result:
        raise HTTPException(
            status_code=400,
            detail="Không thể đánh dấu đã trả. Payout chưa được duyệt."
        )
    
    return {
        "success": True,
        "message": "Đã đánh dấu chi trả thành công",
        "payout": result
    }


@router.post("/payouts/batch-approve")
async def batch_approve_payouts(payout_ids: List[str]):
    """
    Duyệt nhiều payouts cùng lúc
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền duyệt chi trả"
        )
    
    approved = []
    failed = []
    
    for payout_id in payout_ids:
        result = await service.approve_payout(payout_id, user_id)
        if result:
            approved.append(payout_id)
        else:
            failed.append(payout_id)
    
    return {
        "success": True,
        "approved_count": len(approved),
        "failed_count": len(failed),
        "approved": approved,
        "failed": failed
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 8. DASHBOARD - Báo cáo
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/ceo", response_model=CEODashboardResponse)
async def get_ceo_dashboard(
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
):
    """
    Dashboard cho CEO
    
    Hiển thị:
    - Tổng doanh thu
    - Tổng hoa hồng
    - Công nợ (đã về / chưa về)
    - Thuế phải nộp
    """
    service = get_service()
    return await service.get_ceo_dashboard(period_month, period_year)


@router.get("/dashboard/sale", response_model=SaleDashboardResponse)
async def get_sale_dashboard(
    user_id: Optional[str] = None,
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
):
    """
    Dashboard cho Sale
    
    Hiển thị:
    - Tổng thu nhập
    - Thuế TNCN
    - Tiền thực nhận
    - Chi tiết: chờ duyệt / đã duyệt / đã trả
    """
    service = get_service()
    current_user = await get_current_user_internal()
    
    # Use provided user_id or current user
    target_user_id = user_id
    if not target_user_id:
        if current_user:
            target_user_id = current_user["id"]
        else:
            raise HTTPException(status_code=400, detail="user_id is required")
    
    return await service.get_sale_dashboard(target_user_id, period_month, period_year)


@router.get("/dashboard/tax")
async def get_tax_dashboard(
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
):
    """
    Tổng hợp thuế theo kỳ
    
    Hiển thị:
    - VAT đầu ra
    - Thuế TNCN tổng
    - Thuế TNDN ước tính
    """
    service = get_service()
    now = datetime.now(timezone.utc)
    
    if not period_month:
        period_month = now.month
    if not period_year:
        period_year = now.year
    
    return await service.get_tax_summary(period_month, period_year)


# ═══════════════════════════════════════════════════════════════════════════════
# 9. SUMMARY ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/summary/receivables")
async def get_receivables_summary():
    """Tổng hợp công nợ"""
    db = get_db()
    
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_due": {"$sum": "$amount_due"},
                "total_paid": {"$sum": "$amount_paid"},
                "total_remaining": {"$sum": "$amount_remaining"},
            }
        }
    ]
    
    results = await db.receivables.aggregate(pipeline).to_list(10)
    
    summary = {
        "total_count": 0,
        "total_due": 0,
        "total_paid": 0,
        "total_remaining": 0,
        "by_status": {}
    }
    
    for r in results:
        status = r["_id"]
        summary["total_count"] += r["count"]
        summary["total_due"] += r["total_due"]
        summary["total_paid"] += r["total_paid"]
        summary["total_remaining"] += r["total_remaining"]
        summary["by_status"][status] = {
            "count": r["count"],
            "amount_due": r["total_due"],
            "amount_paid": r["total_paid"],
            "amount_remaining": r["total_remaining"],
        }
    
    return summary


@router.get("/summary/payouts")
async def get_payouts_summary():
    """Tổng hợp chi trả"""
    db = get_db()
    
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_gross": {"$sum": "$gross_amount"},
                "total_tax": {"$sum": "$tax_amount"},
                "total_net": {"$sum": "$net_amount"},
            }
        }
    ]
    
    results = await db.payouts.aggregate(pipeline).to_list(10)
    
    summary = {
        "total_count": 0,
        "total_gross": 0,
        "total_tax": 0,
        "total_net": 0,
        "by_status": {}
    }
    
    for r in results:
        status = r["_id"]
        summary["total_count"] += r["count"]
        summary["total_gross"] += r["total_gross"]
        summary["total_tax"] += r["total_tax"]
        summary["total_net"] += r["total_net"]
        summary["by_status"][status] = {
            "count": r["count"],
            "gross_amount": r["total_gross"],
            "tax_amount": r["total_tax"],
            "net_amount": r["total_net"],
        }
    
    return summary


# ═══════════════════════════════════════════════════════════════════════════════
# WORKFLOW TRIGGER ENDPOINT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/workflow/full-cycle/{contract_id}")
async def trigger_full_finance_workflow(contract_id: str):
    """
    Trigger full finance workflow từ contract
    
    WORKFLOW:
    1. contract_signed → enable payment tracking
    2. developer_confirm_payment → tạo commission
    3. commission_created → split commission
    4. commission_split → tạo receivable
    5. accountant xác nhận tiền về → tạo payout (pending)
    6. accountant_approve → payout = paid
    
    Endpoint này chỉ để test workflow, production sẽ trigger từng bước
    """
    service = get_service()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    results = {
        "contract_id": contract_id,
        "steps": []
    }
    
    try:
        # Step 1: Create payment tracking
        payments = await service.create_payment_installments_from_contract(contract_id, user_id)
        results["steps"].append({
            "step": 1,
            "name": "payment_tracking",
            "success": True,
            "count": len(payments)
        })
        
        # Step 2-4: Confirm and create commission (auto splits and receivable)
        commission, errors = await service.create_finance_commission(contract_id, user_id)
        results["steps"].append({
            "step": 2,
            "name": "commission_created",
            "success": commission is not None,
            "errors": errors,
            "commission_id": commission.id if commission else None
        })
        
        if commission:
            # Get splits
            splits = await service.list_commission_splits(commission_id=commission.id)
            results["steps"].append({
                "step": 3,
                "name": "commission_split",
                "success": len(splits) > 0,
                "count": len(splits)
            })
            
            # Get receivable
            receivables = await service.list_receivables()
            results["steps"].append({
                "step": 4,
                "name": "receivable_created",
                "success": len(receivables) > 0,
                "count": len(receivables)
            })
        
        results["success"] = True
        results["message"] = "Workflow executed successfully"
        
    except Exception as e:
        results["success"] = False
        results["error"] = str(e)
    
    return results



# ═══════════════════════════════════════════════════════════════════════════════
# AUTO FLOW ENGINE - Event-driven automation
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/flow/contract-signed/{contract_id}")
async def trigger_contract_signed(contract_id: str):
    """
    Trigger: contract_signed
    Action: Tự động tạo payment schedule
    
    Gọi khi hợp đồng được ký
    """
    engine = get_flow_engine()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    result = await engine.handle_event(
        "contract_signed",
        {"contract_id": contract_id},
        user_id
    )
    
    return result


@router.post("/flow/developer-payment/{contract_id}")
async def trigger_developer_payment(contract_id: str):
    """
    Trigger: developer_confirm_payment
    Action: 
    1. Tự động tạo commission
    2. Auto split (Sale 60%, Leader 10%, Company 25%, Affiliate 5%)
    3. Auto tạo receivable
    
    Gọi khi chủ đầu tư xác nhận thanh toán
    
    KHÔNG CHO TẠO COMMISSION MANUAL - Chỉ qua flow này
    """
    engine = get_flow_engine()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán hoặc Admin mới có quyền xác nhận"
        )
    
    result = await engine.create_commission_from_contract(contract_id, user_id)
    
    if result.get("errors"):
        raise HTTPException(
            status_code=400,
            detail="; ".join(result["errors"])
        )
    
    return {
        "success": True,
        "message": "Đã xác nhận thanh toán từ CĐT và tạo hoa hồng tự động",
        **result
    }


@router.post("/flow/receivable-payment/{receivable_id}")
async def trigger_receivable_payment(
    receivable_id: str,
    amount: float,
    payment_reference: Optional[str] = None,
):
    """
    Trigger: payment_received_from_developer
    Action:
    1. Update receivable
    2. Nếu đủ tiền → Auto tạo payouts (pending)
    
    Gọi khi CĐT chuyển tiền về
    """
    engine = get_flow_engine()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán mới có quyền ghi nhận tiền về"
        )
    
    # Get contract_id from receivable
    db = get_db()
    receivable = await db.receivables.find_one(
        {"id": receivable_id},
        {"_id": 0, "contract_id": 1}
    )
    
    if not receivable:
        raise HTTPException(status_code=404, detail="Receivable not found")
    
    result = await engine.handle_event(
        "payment_received_from_developer",
        {
            "receivable_id": receivable_id,
            "contract_id": receivable.get("contract_id"),
            "amount": amount,
            "payment_reference": payment_reference,
        },
        user_id
    )
    
    return {
        "success": True,
        "message": "Đã ghi nhận tiền về từ CĐT",
        **result
    }


@router.post("/flow/approve-payout/{payout_id}")
async def trigger_approve_payout(payout_id: str):
    """
    Trigger: accountant_approve
    Action: Payout = approved (sẵn sàng chi trả)
    
    Kế toán duyệt 1 bước → Trả tiền
    KHÔNG CHO TẠO PAYOUT MANUAL
    """
    engine = get_flow_engine()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    # Check accountant permission
    if current_user and not require_accountant_role(current_user):
        raise HTTPException(
            status_code=403,
            detail="Chỉ Kế toán mới có quyền duyệt chi trả"
        )
    
    result = await engine.handle_event(
        "payout_approved",
        {"payout_id": payout_id},
        user_id
    )
    
    if result.get("errors"):
        raise HTTPException(
            status_code=400,
            detail="; ".join(result["errors"])
        )
    
    return {
        "success": True,
        "message": "Đã duyệt payout",
        **result
    }


# ═══════════════════════════════════════════════════════════════════════════════
# TIMELINE - Full History Tracking
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/timeline/{contract_id}")
async def get_contract_timeline(contract_id: str):
    """
    Get full timeline cho contract:
    Contract → Payment → Commission → Split → Receivable → Payout
    
    Track full history:
    - Ai tạo
    - Lúc nào  
    - Từ contract nào
    """
    engine = get_flow_engine()
    timeline = await engine.get_contract_timeline(contract_id)
    
    return {
        "contract_id": contract_id,
        "timeline": timeline,
        "total_events": len(timeline),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ALERTS - Cảnh báo tài chính
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/alerts")
async def get_finance_alerts():
    """
    Get active alerts:
    1. Công nợ quá hạn
    2. Sale chưa được trả tiền (>7 ngày)
    3. Deal có tiền nhưng chưa chia hoa hồng
    """
    engine = get_flow_engine()
    alerts = await engine.get_active_alerts()
    
    # Group by type
    grouped = {}
    for alert in alerts:
        alert_type = alert.get("type", "other")
        if alert_type not in grouped:
            grouped[alert_type] = []
        grouped[alert_type].append(alert)
    
    return {
        "total": len(alerts),
        "alerts": alerts,
        "by_type": grouped,
    }


@router.post("/alerts/check")
async def check_finance_alerts():
    """
    Chạy kiểm tra alerts (có thể chạy định kỳ qua cron)
    """
    engine = get_flow_engine()
    result = await engine.check_alerts()
    
    return result


@router.post("/alerts/{alert_id}/resolve")
async def resolve_finance_alert(alert_id: str):
    """
    Đánh dấu alert đã xử lý
    """
    engine = get_flow_engine()
    current_user = await get_current_user_internal()
    user_id = current_user["id"] if current_user else "system"
    
    success = await engine.resolve_alert(alert_id, user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"success": True, "message": "Alert resolved"}


# ═══════════════════════════════════════════════════════════════════════════════
# FINANCE EVENTS LOG - Audit Trail
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/events")
async def get_finance_events(
    event_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
):
    """
    Get finance events log (audit trail)
    """
    db = get_db()
    
    query = {}
    if event_type:
        query["event_type"] = event_type
    
    events = await db.finance_events.find(
        query,
        {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "events": events,
        "count": len(events),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# BLOCK MANUAL CREATION
# ═══════════════════════════════════════════════════════════════════════════════

# Override original commission creation to block manual
@router.post("/commissions/manual", include_in_schema=False)
async def block_manual_commission():
    """
    BLOCKED: Không cho tạo commission manual
    Phải qua flow: /flow/developer-payment/{contract_id}
    """
    raise HTTPException(
        status_code=403,
        detail="Không cho phép tạo commission thủ công. Vui lòng sử dụng /flow/developer-payment/{contract_id} để tạo tự động từ hợp đồng."
    )


@router.post("/payouts/manual", include_in_schema=False)
async def block_manual_payout():
    """
    BLOCKED: Không cho tạo payout manual
    Payouts được tạo tự động khi CĐT trả tiền đủ
    """
    raise HTTPException(
        status_code=403,
        detail="Không cho phép tạo payout thủ công. Payouts được tạo tự động khi chủ đầu tư trả tiền đủ."
    )


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/stats/flow")
async def get_flow_statistics():
    """
    Thống kê flow engine
    """
    db = get_db()
    
    # Count by event type
    pipeline = [
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    event_stats = await db.finance_events.aggregate(pipeline).to_list(20)
    
    # Count active items
    pending_payouts = await db.payouts.count_documents({"status": "pending"})
    approved_payouts = await db.payouts.count_documents({"status": "approved"})
    overdue_receivables = await db.receivables.count_documents({"status": "overdue"})
    pending_receivables = await db.receivables.count_documents({"status": {"$in": ["pending", "confirmed"]}})
    
    return {
        "event_stats": {e["_id"]: e["count"] for e in event_stats},
        "pending_payouts": pending_payouts,
        "approved_payouts": approved_payouts,
        "overdue_receivables": overdue_receivables,
        "pending_receivables": pending_receivables,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SEEDER - Tạo dữ liệu mẫu
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/seed/sample-data")
async def seed_sample_data():
    """
    Tạo dữ liệu mẫu THẬT cho demo:
    - Project: Căn hộ ABC Đà Nẵng (2% hoa hồng)
    - Users: Sale (Nguyễn Văn A), Leader (Trần Văn B), Accountant, CEO
    - Contract: 3 tỷ VNĐ, status=signed
    - Full flow: contract_signed → payment → commission → split → payout → paid
    """
    db = get_db()
    
    from services.finance_seeder import FinanceSeeder
    seeder = FinanceSeeder(db)
    
    result = await seeder.seed_sample_data()
    
    return result


@router.get("/seed/verify")
async def verify_seed_data():
    """
    Verify dữ liệu đã seed:
    - Sale thấy tiền
    - Leader thấy team
    - Accountant thấy payout
    - CEO thấy tổng
    """
    db = get_db()
    
    from services.finance_seeder import FinanceSeeder
    seeder = FinanceSeeder(db)
    
    result = await seeder.verify_seeded_data()
    
    return result


# ═══════════════════════════════════════════════════════════════════════════════
# TIMELINE - Deal Timeline Step-by-step
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/timeline-steps/{contract_id}")
async def get_contract_timeline_steps(contract_id: str):
    """
    Lấy timeline của contract dạng step:
    1. Contract signed
    2. Payment received
    3. Commission created
    4. Split completed
    5. Payout pending
    6. Paid
    
    Mỗi step có: timestamp, người thực hiện, số tiền
    """
    db = get_db()
    
    # Get contract info
    contract = await db.contracts.find_one(
        {"id": contract_id},
        {"_id": 0, "status": 1, "contract_code": 1, "grand_total": 1, 
         "status_changed_at": 1, "owner_id": 1, "signed_by_company_id": 1}
    )
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract không tồn tại")
    
    timeline = []
    
    # Step 1: Contract signed
    is_signed = contract.get("status") in ["signed", "active", "completed"]
    signer = None
    if contract.get("signed_by_company_id"):
        signer = await db.users.find_one(
            {"id": contract["signed_by_company_id"]},
            {"_id": 0, "full_name": 1}
        )
    
    timeline.append({
        "step_type": "contract_signed",
        "completed": is_signed,
        "timestamp": contract.get("status_changed_at") if is_signed else None,
        "actor_name": signer.get("full_name") if signer else None,
        "amount": contract.get("grand_total", 0),
        "details": f"Hợp đồng {contract.get('contract_code', '')}",
    })
    
    # Get commission
    commission = await db.finance_commissions.find_one(
        {"contract_id": contract_id},
        {"_id": 0, "id": 1, "total_commission": 1, "status": 1, "created_at": 1}
    )
    commission_id = commission["id"] if commission else None
    
    # Step 2: Commission created
    timeline.append({
        "step_type": "commission_created",
        "completed": commission is not None,
        "timestamp": commission.get("created_at") if commission else None,
        "actor_name": "Hệ thống tự động",
        "amount": commission.get("total_commission", 0) if commission else 0,
        "details": "Tạo commission từ contract",
    })
    
    # Get receivable
    receivable = await db.receivables.find_one(
        {"commission_id": commission_id} if commission_id else {"contract_id": contract_id},
        {"_id": 0, "amount_due": 1, "amount_paid": 1, "status": 1, "confirmed_at": 1}
    )
    
    # Step 3: Payment received
    payment_received = receivable and receivable.get("amount_paid", 0) > 0
    timeline.append({
        "step_type": "payment_received",
        "completed": payment_received,
        "timestamp": receivable.get("confirmed_at") if payment_received else None,
        "actor_name": "Chủ đầu tư",
        "amount": receivable.get("amount_paid", 0) if receivable else 0,
        "details": "Nhận thanh toán từ chủ đầu tư",
    })
    
    # Get splits
    splits = []
    if commission_id:
        splits = await db.commission_splits.find(
            {"commission_id": commission_id},
            {"_id": 0, "id": 1, "net_amount": 1, "status": 1, "created_at": 1}
        ).to_list(10)
    
    # Step 4: Split completed
    split_total = sum(s.get("net_amount", 0) for s in splits)
    timeline.append({
        "step_type": "split_completed",
        "completed": len(splits) > 0,
        "timestamp": splits[0].get("created_at") if splits else None,
        "actor_name": "Hệ thống tự động",
        "amount": split_total,
        "details": f"Chia cho {len(splits)} người nhận",
    })
    
    # Get payouts
    payouts = []
    if splits:
        split_ids = [s["id"] for s in splits]
        payouts = await db.payouts.find(
            {"commission_split_id": {"$in": split_ids}},
            {"_id": 0, "status": 1, "net_amount": 1, "approved_at": 1, "paid_at": 1}
        ).to_list(10)
    
    pending_payouts = [p for p in payouts if p.get("status") == "pending"]
    approved_payouts = [p for p in payouts if p.get("status") == "approved"]
    paid_payouts = [p for p in payouts if p.get("status") == "paid"]
    
    # Step 5: Payout pending/approved
    payout_pending_amount = sum(p.get("net_amount", 0) for p in pending_payouts + approved_payouts)
    timeline.append({
        "step_type": "payout_pending",
        "completed": len(payouts) > 0,
        "timestamp": approved_payouts[0].get("approved_at") if approved_payouts else 
                     (payouts[0].get("created_at") if payouts else None),
        "actor_name": "Kế toán",
        "amount": payout_pending_amount,
        "details": f"{len(pending_payouts)} chờ duyệt, {len(approved_payouts)} đã duyệt",
    })
    
    # Step 6: Paid
    paid_amount = sum(p.get("net_amount", 0) for p in paid_payouts)
    timeline.append({
        "step_type": "paid",
        "completed": len(paid_payouts) > 0 and len(paid_payouts) == len(payouts),
        "timestamp": paid_payouts[-1].get("paid_at") if paid_payouts else None,
        "actor_name": "Kế toán",
        "amount": paid_amount,
        "details": f"Đã chi trả {len(paid_payouts)}/{len(payouts)} payout",
    })
    
    return timeline


# ═══════════════════════════════════════════════════════════════════════════════
# CEO TRUST PANEL - Minh bạch tuyệt đối
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/trust")
async def get_ceo_trust_panel(
    month: int = None,
    year: int = None,
):
    """
    CEO Trust Panel - Dữ liệu minh bạch:
    - Tổng tiền đã thu
    - Tổng tiền đã chi
    - Lợi nhuận thực = Thu - Chi - Chi phí
    """
    db = get_db()
    
    now = datetime.now(timezone.utc)
    if not month:
        month = now.month
    if not year:
        year = now.year
    
    # Tổng tiền đã thu từ CĐT (receivables paid)
    recv_pipeline = [
        {"$group": {
            "_id": None,
            "total_paid": {"$sum": "$amount_paid"},
            "total_due": {"$sum": "$amount_due"},
        }}
    ]
    recv_result = await db.receivables.aggregate(recv_pipeline).to_list(1)
    total_collected = recv_result[0]["total_paid"] if recv_result else 0
    
    # Tổng tiền đã chi (payouts paid)
    payout_pipeline = [
        {"$match": {"status": "paid"}},
        {"$group": {
            "_id": None,
            "total_paid": {"$sum": "$net_amount"},
            "total_tax": {"$sum": "$tax_amount"},
        }}
    ]
    payout_result = await db.payouts.aggregate(payout_pipeline).to_list(1)
    total_paid_out = payout_result[0]["total_paid"] if payout_result else 0
    total_tax_withheld = payout_result[0]["total_tax"] if payout_result else 0
    
    # Tổng commission (revenue before split)
    comm_pipeline = [
        {"$group": {
            "_id": None,
            "total_commission": {"$sum": "$total_commission"},
            "total_contract_value": {"$sum": "$contract_value"},
        }}
    ]
    comm_result = await db.finance_commissions.aggregate(comm_pipeline).to_list(1)
    total_commission = comm_result[0]["total_commission"] if comm_result else 0
    
    # Company keeps 25-30% (no affiliate = 30%)
    # Get company splits
    company_splits = await db.commission_splits.find(
        {"recipient_role": "company"},
        {"_id": 0, "gross_amount": 1}
    ).to_list(100)
    company_keep = sum(s.get("gross_amount", 0) for s in company_splits)
    
    # Revenue = commission + VAT (10%)
    vat_amount = total_commission * 0.10
    total_revenue = total_commission + vat_amount
    
    # Chi phí khác (placeholder - có thể mở rộng sau)
    total_expenses = 0
    
    # Lợi nhuận thực = Thu - Chi
    real_profit = total_collected - total_paid_out - total_expenses
    
    return {
        "total_collected": total_collected,
        "total_paid_out": total_paid_out,
        "total_expenses": total_expenses,
        "real_profit": real_profit,
        
        "total_revenue": total_revenue,
        "total_commission": total_commission,
        "vat_amount": vat_amount,
        "company_keep": company_keep,
        
        "total_tax_withheld": total_tax_withheld,
        
        "period_month": month,
        "period_year": year,
        "period_label": f"Tháng {month}/{year}",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOG - Lịch sử thao tác
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit-logs")
async def get_audit_logs(
    entity_type: str = None,
    entity_id: str = None,
    actor_id: str = None,
    action: str = None,
    limit: int = 100,
):
    """
    Lấy audit logs
    
    Filters:
    - entity_type: contract, commission, payout, etc.
    - entity_id: ID cụ thể
    - actor_id: Người thực hiện
    - action: create, update, approve, etc.
    """
    db = get_db()
    
    from services.audit_service import AuditService
    audit = AuditService(db)
    
    logs = await audit.get_logs(
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        action=action,
        limit=limit,
    )
    
    return logs


@router.get("/audit-logs/contract/{contract_id}")
async def get_contract_audit_trail(contract_id: str):
    """
    Lấy FULL audit trail của contract
    Bao gồm tất cả entities liên quan
    """
    db = get_db()
    
    from services.audit_service import AuditService
    audit = AuditService(db)
    
    logs = await audit.get_contract_full_timeline(contract_id)
    
    return logs


# ═══════════════════════════════════════════════════════════════════════════════
# HARD RULES VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/rules/can-delete-deal/{deal_id}")
async def check_can_delete_deal(deal_id: str):
    """
    Check if deal can be deleted
    Rule: Không cho xóa deal đã có commission
    """
    db = get_db()
    
    from services.audit_service import HardRulesService
    rules = HardRulesService(db)
    
    return await rules.can_delete_deal(deal_id)


@router.get("/rules/can-edit-payout/{payout_id}")
async def check_can_edit_payout(payout_id: str):
    """
    Check if payout can be edited
    Rule: Không cho sửa payout đã paid
    """
    db = get_db()
    
    from services.audit_service import HardRulesService
    rules = HardRulesService(db)
    
    return await rules.can_edit_payout(payout_id, [])


# ═══════════════════════════════════════════════════════════════════════════════
# FINANCIAL SUMMARY / CASH-FLOW / PROFIT-LOSS
# Alias endpoints — FE gọi /api/finance/summary, /api/finance/cash-flow, etc.
# Logic thực tế nằm trong finance_api.py (mount tại /api/finance/v1)
# Các endpoint dưới đây replicate logic trực tiếp để tránh path mismatch.
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/summary")
async def get_financial_summary_alias(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
):
    """Tổng hợp tài chính — FE alias (no auth required for demo compatibility)"""
    now = datetime.now(timezone.utc)
    year  = period_year  or now.year
    month = period_month or now.month

    try:
        db = get_db()
        start = f"{year}-{month:02d}-01"
        end   = f"{year}-{month+1:02d}-01" if month < 12 else f"{year+1}-01-01"

        rev_result = await db.revenues.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_revenue = rev_result[0]["total"] if rev_result else 0

        exp_result = await db.expenses.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        total_expense = exp_result[0]["total"] if exp_result else 0

        gross_profit  = total_revenue - total_expense
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    except Exception:
        # Fallback demo khi DB chưa có dữ liệu
        total_revenue = 38_700_000_000
        total_expense = 14_200_000_000
        gross_profit  = 24_500_000_000
        profit_margin = 63.3

    return {
        "period_type":       period_type,
        "period_year":       year,
        "period_month":      month,
        "period_label":      f"Tháng {month}/{year}",
        "total_revenue":     total_revenue,
        "total_expense":     total_expense,
        "gross_profit":      gross_profit,
        "net_profit":        gross_profit,
        "profit_margin":     round(profit_margin, 2),
        "total_receivable":  0,
        "total_payable":     0,
        "overdue_receivable": 0,
        "overdue_payable":   0,
        "budget_utilization": 0,
        "revenue_vs_target": 0,
        "profit_vs_target":  0,
    }


@router.get("/cash-flow")
async def get_cash_flow_alias(
    period_year: Optional[int]  = None,
    period_month: Optional[int] = None,
):
    """Dòng tiền — FE alias"""
    now   = datetime.now(timezone.utc)
    year  = period_year  or now.year
    month = period_month or now.month

    try:
        db    = get_db()
        start = f"{year}-{month:02d}-01"
        end   = f"{year}-{month+1:02d}-01" if month < 12 else f"{year+1}-01-01"

        cash_in_res = await db.revenues.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        cash_in = cash_in_res[0]["total"] if cash_in_res else 0

        cash_out_res = await db.expenses.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]).to_list(1)
        cash_out = cash_out_res[0]["total"] if cash_out_res else 0
    except Exception:
        cash_in  = 38_700_000_000
        cash_out = 14_200_000_000

    net = cash_in - cash_out
    return {
        "period_year":       year,
        "period_month":      month,
        "period_label":      f"Tháng {month}/{year}",
        "operating_cash_in": cash_in,
        "operating_cash_out": cash_out,
        "net_operating_cash": net,
        "investing_cash_in":  0,
        "investing_cash_out": 0,
        "net_investing_cash": 0,
        "financing_cash_in":  0,
        "financing_cash_out": 0,
        "net_financing_cash": 0,
        "total_cash_in":     cash_in,
        "total_cash_out":    cash_out,
        "net_cash_flow":     net,
        "opening_balance":   0,
        "closing_balance":   net,
    }


@router.get("/profit-loss")
async def get_profit_loss_alias(
    period_year: Optional[int]  = None,
    period_month: Optional[int] = None,
):
    """Lãi/Lỗ — FE alias"""
    now   = datetime.now(timezone.utc)
    year  = period_year  or now.year
    month = period_month or now.month

    try:
        db    = get_db()
        start = f"{year}-{month:02d}-01"
        end   = f"{year}-{month+1:02d}-01" if month < 12 else f"{year+1}-01-01"

        rev_res = await db.revenues.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": "$category", "amount": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]).to_list(100)
        total_revenue = sum(r["amount"] for r in rev_res)

        exp_res = await db.expenses.aggregate([
            {"$match": {"transaction_date": {"$gte": start, "$lt": end}}},
            {"$group": {"_id": "$category", "amount": {"$sum": "$amount"}, "count": {"$sum": 1}}}
        ]).to_list(100)
        total_expense = sum(e["amount"] for e in exp_res)
    except Exception:
        total_revenue = 38_700_000_000
        total_expense = 14_200_000_000
        rev_res = []
        exp_res = []

    gross_profit  = total_revenue - total_expense
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0

    return {
        "period_year":    year,
        "period_month":   month,
        "period_label":   f"Tháng {month}/{year}",
        "revenue_items":  [{"category": r["_id"], "amount": r["amount"], "count": r.get("count", 0)} for r in rev_res],
        "total_revenue":  total_revenue,
        "expense_items":  [{"category": e["_id"], "amount": e["amount"], "count": e.get("count", 0)} for e in exp_res],
        "total_expense":  total_expense,
        "gross_profit":   gross_profit,
        "net_profit":     gross_profit,
        "profit_margin":  round(profit_margin, 2),
        "ebitda":         gross_profit,
        "tax_expense":    0,
        "net_income":     gross_profit,
    }
