"""
ProHouzing Finance API - Quản lý Tài chính Doanh nghiệp
API endpoints cho: Hoa hồng, Lương, Doanh thu, Chi phí, Hoá đơn, Hợp đồng, Thuế, Ngân sách, Công nợ, Dự báo
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import os
import jwt
from dotenv import load_dotenv
from pathlib import Path

# Import models
from finance_models import (
    # Enums
    TransactionType, PaymentStatus, CommissionStatus, SalaryStatus,
    ExpenseCategory, RevenueCategory, InvoiceType, InvoiceStatus,
    ContractType, ContractStatus, TaxType, BudgetType, BudgetStatus, DebtType,
    # Commission
    CommissionCreate, CommissionResponse,
    # Salary
    SalaryComponent, SalaryCreate, SalaryResponse,
    # Revenue
    RevenueCreate, RevenueResponse, SalesTarget,
    # Expense
    ExpenseCreate, ExpenseResponse,
    # Invoice
    InvoiceItem, InvoiceCreate, InvoiceResponse,
    # Contract
    ContractParty, ContractPaymentSchedule, ContractCreate, ContractResponse, ContractTemplate,
    # Tax
    TaxDeclaration, TaxReport,
    # Budget
    BudgetLineItem, BudgetCreate, BudgetResponse,
    # Debt
    DebtCreate, DebtResponse,
    # Forecast
    ForecastCreate, ForecastResponse,
    # Bank
    BankAccount, BankTransaction,
    # Summary
    FinancialSummary, CashFlowReport, ProfitLossReport
)

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

finance_router = APIRouter(prefix="/finance", tags=["Finance"])

# ==================== HELPER FUNCTIONS ====================

def number_to_words_vn(number: float) -> str:
    """Chuyển số thành chữ tiếng Việt"""
    if number == 0:
        return "Không đồng"
    
    ones = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    teens = ["mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm", 
             "mười sáu", "mười bảy", "mười tám", "mười chín"]
    tens = ["", "", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", 
            "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"]
    
    def convert_hundreds(n):
        if n == 0:
            return ""
        result = ""
        if n >= 100:
            result += ones[n // 100] + " trăm "
            n %= 100
        if n >= 20:
            result += tens[n // 10] + " "
            n %= 10
            if n > 0:
                if n == 1:
                    result += "mốt "
                elif n == 5:
                    result += "lăm "
                else:
                    result += ones[n] + " "
        elif n >= 10:
            result += teens[n - 10] + " "
        elif n > 0:
            result += ones[n] + " "
        return result.strip()
    
    units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ"]
    
    num = int(number)
    if num == 0:
        return "Không đồng"
    
    result = ""
    unit_index = 0
    
    while num > 0:
        chunk = num % 1000
        if chunk > 0:
            chunk_words = convert_hundreds(chunk)
            if chunk_words:
                result = chunk_words + " " + units[unit_index] + " " + result
        num //= 1000
        unit_index += 1
    
    return result.strip().capitalize() + " đồng"


def get_category_label(category: str) -> str:
    """Lấy nhãn tiếng Việt cho danh mục"""
    labels = {
        # Expense categories
        "marketing": "Marketing & Quảng cáo",
        "operations": "Vận hành",
        "office": "Văn phòng",
        "travel": "Di chuyển",
        "utilities": "Tiện ích",
        "salary": "Lương nhân viên",
        "commission": "Hoa hồng",
        "tax": "Thuế",
        "insurance": "Bảo hiểm",
        "training": "Đào tạo",
        "equipment": "Thiết bị",
        "software": "Phần mềm",
        "legal": "Pháp lý",
        "consulting": "Tư vấn",
        "event": "Sự kiện",
        "other": "Khác",
        # Revenue categories
        "property_sale": "Bán BĐS",
        "brokerage_fee": "Phí môi giới",
        "consulting_fee": "Phí tư vấn",
        "service_fee": "Phí dịch vụ",
        "rental_income": "Thu từ cho thuê",
        # Invoice types
        "sales": "Hoá đơn bán hàng",
        "service": "Hoá đơn dịch vụ",
        "vat": "Hoá đơn GTGT",
        "receipt": "Phiếu thu",
        "payment": "Phiếu chi",
        # Contract types
        "brokerage": "HĐ môi giới",
        "deposit": "HĐ đặt cọc",
        "rental": "HĐ thuê",
        "collaborator": "HĐ CTV",
        "employment": "HĐ lao động",
        "partnership": "HĐ hợp tác",
        # Tax types
        "vat": "Thuế GTGT",
        "cit": "Thuế TNDN",
        "pit": "Thuế TNCN",
        "fct": "Thuế nhà thầu",
        "property": "Thuế BĐS",
        "stamp": "Lệ phí trước bạ",
        # Budget types
        "annual": "Ngân sách năm",
        "quarterly": "Ngân sách quý",
        "monthly": "Ngân sách tháng",
        "project": "Ngân sách dự án",
        "department": "Ngân sách phòng ban",
        "campaign": "Ngân sách chiến dịch",
        # Debt types
        "receivable": "Phải thu",
        "payable": "Phải trả",
        # Forecast types
        "revenue": "Dự báo doanh thu",
        "expense": "Dự báo chi phí",
        "cash_flow": "Dự báo dòng tiền",
        "profit": "Dự báo lợi nhuận",
    }
    return labels.get(category, category)


def generate_invoice_no(invoice_type: str) -> str:
    """Tạo số hoá đơn tự động"""
    prefix_map = {
        "sales": "HD",
        "service": "DV",
        "vat": "VAT",
        "receipt": "PT",
        "payment": "PC"
    }
    prefix = prefix_map.get(invoice_type, "HD")
    year = datetime.now().year
    return f"{prefix}{year}{str(uuid.uuid4())[:6].upper()}"


def generate_contract_no(contract_type: str) -> str:
    """Tạo số hợp đồng tự động"""
    prefix_map = {
        "property_sale": "HDMB",
        "brokerage": "HDMG",
        "deposit": "HDDC",
        "rental": "HDT",
        "collaborator": "HDCTV",
        "employment": "HDLD",
        "service": "HDDV",
        "partnership": "HDHT"
    }
    prefix = prefix_map.get(contract_type, "HD")
    year = datetime.now().year
    return f"{prefix}-{year}-{str(uuid.uuid4())[:6].upper()}"


# ==================== COMMISSION ENDPOINTS ====================

@finance_router.post("/commissions", response_model=CommissionResponse)
async def create_commission(data: CommissionCreate, current_user: dict = Depends(get_current_user)):
    """Tạo hoa hồng mới"""
    commission_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    commission_doc = {
        "id": commission_id,
        "deal_id": data.deal_id,
        "recipient_id": data.recipient_id,
        "recipient_type": data.recipient_type,
        "deal_value": data.deal_value,
        "commission_rate": data.commission_rate,
        "commission_amount": data.commission_amount,
        "policy_id": data.policy_id,
        "status": CommissionStatus.PENDING.value,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.commissions.insert_one(commission_doc)
    
    return CommissionResponse(**commission_doc)


@finance_router.get("/commissions", response_model=List[CommissionResponse])
async def get_commissions(
    status: Optional[CommissionStatus] = None,
    recipient_id: Optional[str] = None,
    recipient_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách hoa hồng"""
    query = {}
    if status:
        query["status"] = status.value
    if recipient_id:
        query["recipient_id"] = recipient_id
    if recipient_type:
        query["recipient_type"] = recipient_type
    if from_date:
        query["created_at"] = {"$gte": from_date}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = to_date
        else:
            query["created_at"] = {"$lte": to_date}
    
    commissions = await db.commissions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [CommissionResponse(**c) for c in commissions]


@finance_router.put("/commissions/{commission_id}/approve")
async def approve_commission(commission_id: str, current_user: dict = Depends(get_current_user)):
    """Duyệt hoa hồng"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.commissions.update_one(
        {"id": commission_id},
        {"$set": {
            "status": CommissionStatus.APPROVED.value,
            "approved_by": current_user["id"],
            "approved_at": now,
            "updated_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Commission not found")
    
    return {"success": True, "status": "approved"}


@finance_router.put("/commissions/{commission_id}/pay")
async def pay_commission(commission_id: str, payment_ref: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Thanh toán hoa hồng"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.commissions.update_one(
        {"id": commission_id, "status": CommissionStatus.APPROVED.value},
        {"$set": {
            "status": CommissionStatus.PAID.value,
            "paid_at": now,
            "payment_ref": payment_ref,
            "updated_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Commission not found or not approved")
    
    return {"success": True, "status": "paid"}


# ==================== SALARY ENDPOINTS ====================

@finance_router.post("/salaries", response_model=SalaryResponse)
async def create_salary(data: SalaryCreate, current_user: dict = Depends(get_current_user)):
    """Tạo bảng lương"""
    salary_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Tính tổng thu nhập
    gross_income = (
        data.base_salary + data.allowances + data.bonus + 
        data.commission_total + data.overtime_pay + data.other_income
    )
    
    # Tính tổng khấu trừ
    total_deductions = (
        data.social_insurance + data.health_insurance + 
        data.unemployment_insurance + data.personal_income_tax + data.other_deductions
    )
    
    # Lương thực lĩnh
    net_salary = gross_income - total_deductions
    
    salary_doc = {
        "id": salary_id,
        "employee_id": data.employee_id,
        "period_month": data.period_month,
        "period_year": data.period_year,
        "period_label": f"Tháng {data.period_month}/{data.period_year}",
        # Thu nhập
        "base_salary": data.base_salary,
        "allowances": data.allowances,
        "bonus": data.bonus,
        "commission_total": data.commission_total,
        "overtime_pay": data.overtime_pay,
        "other_income": data.other_income,
        "gross_income": gross_income,
        # Khấu trừ
        "social_insurance": data.social_insurance,
        "health_insurance": data.health_insurance,
        "unemployment_insurance": data.unemployment_insurance,
        "personal_income_tax": data.personal_income_tax,
        "other_deductions": data.other_deductions,
        "total_deductions": total_deductions,
        # Thực lĩnh
        "net_salary": net_salary,
        # Chi tiết
        "components": [c.dict() for c in data.components],
        "work_days": data.work_days,
        "paid_leave_days": data.paid_leave_days,
        "unpaid_leave_days": data.unpaid_leave_days,
        # Trạng thái
        "status": SalaryStatus.DRAFT.value,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.salaries.insert_one(salary_doc)
    
    return SalaryResponse(**salary_doc)


@finance_router.get("/salaries", response_model=List[SalaryResponse])
async def get_salaries(
    employee_id: Optional[str] = None,
    period_month: Optional[int] = None,
    period_year: Optional[int] = None,
    status: Optional[SalaryStatus] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách bảng lương"""
    query = {}
    if employee_id:
        query["employee_id"] = employee_id
    if period_month:
        query["period_month"] = period_month
    if period_year:
        query["period_year"] = period_year
    if status:
        query["status"] = status.value
    
    salaries = await db.salaries.find(query, {"_id": 0}).sort([("period_year", -1), ("period_month", -1)]).skip(skip).limit(limit).to_list(limit)
    
    return [SalaryResponse(**s) for s in salaries]


@finance_router.put("/salaries/{salary_id}/approve")
async def approve_salary(salary_id: str, current_user: dict = Depends(get_current_user)):
    """Duyệt bảng lương"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.salaries.update_one(
        {"id": salary_id},
        {"$set": {
            "status": SalaryStatus.APPROVED.value,
            "approved_by": current_user["id"],
            "approved_at": now,
            "updated_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Salary record not found")
    
    return {"success": True, "status": "approved"}


# ==================== REVENUE ENDPOINTS ====================

@finance_router.post("/revenues", response_model=RevenueResponse)
async def create_revenue(data: RevenueCreate, current_user: dict = Depends(get_current_user)):
    """Tạo doanh thu"""
    revenue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    revenue_doc = {
        "id": revenue_id,
        "category": data.category.value,
        "category_label": get_category_label(data.category.value),
        "amount": data.amount,
        "description": data.description,
        "deal_id": data.deal_id,
        "project_id": data.project_id,
        "customer_id": data.customer_id,
        "employee_id": data.employee_id,
        "branch_id": data.branch_id,
        "transaction_date": data.transaction_date,
        "payment_method": data.payment_method,
        "reference_no": data.reference_no,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.revenues.insert_one(revenue_doc)
    
    return RevenueResponse(**revenue_doc)


@finance_router.get("/revenues", response_model=List[RevenueResponse])
async def get_revenues(
    category: Optional[RevenueCategory] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    branch_id: Optional[str] = None,
    employee_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách doanh thu"""
    query = {}
    if category:
        query["category"] = category.value
    if branch_id:
        query["branch_id"] = branch_id
    if employee_id:
        query["employee_id"] = employee_id
    if from_date:
        query["transaction_date"] = {"$gte": from_date}
    if to_date:
        if "transaction_date" in query:
            query["transaction_date"]["$lte"] = to_date
        else:
            query["transaction_date"] = {"$lte": to_date}
    
    revenues = await db.revenues.find(query, {"_id": 0}).sort("transaction_date", -1).skip(skip).limit(limit).to_list(limit)
    
    return [RevenueResponse(**r) for r in revenues]


@finance_router.get("/revenues/summary")
async def get_revenue_summary(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Tổng hợp doanh thu theo kỳ"""
    if not period_year:
        period_year = datetime.now().year
    
    # Build date range
    if period_type == "monthly" and period_month:
        start_date = f"{period_year}-{period_month:02d}-01"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01"
    else:
        start_date = f"{period_year}-01-01"
        end_date = f"{period_year + 1}-01-01"
    
    pipeline = [
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.revenues.aggregate(pipeline).to_list(100)
    
    total_revenue = sum(r["total"] for r in results)
    by_category = {r["_id"]: {"amount": r["total"], "count": r["count"]} for r in results}
    
    return {
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
        "total_revenue": total_revenue,
        "by_category": by_category,
        "transaction_count": sum(r["count"] for r in results)
    }


# ==================== EXPENSE ENDPOINTS ====================

@finance_router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    """Tạo chi phí"""
    expense_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    expense_doc = {
        "id": expense_id,
        "category": data.category.value,
        "category_label": get_category_label(data.category.value),
        "amount": data.amount,
        "description": data.description,
        "vendor_name": data.vendor_name,
        "department_id": data.department_id,
        "project_id": data.project_id,
        "campaign_id": data.campaign_id,
        "transaction_date": data.transaction_date,
        "payment_method": data.payment_method,
        "reference_no": data.reference_no,
        "invoice_no": data.invoice_no,
        "is_recurring": data.is_recurring,
        "recurrence_type": data.recurrence_type,
        "attachments": data.attachments,
        "status": PaymentStatus.PENDING.value,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.expenses.insert_one(expense_doc)
    
    return ExpenseResponse(**expense_doc)


@finance_router.get("/expenses", response_model=List[ExpenseResponse])
async def get_expenses(
    category: Optional[ExpenseCategory] = None,
    status: Optional[PaymentStatus] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách chi phí"""
    query = {}
    if category:
        query["category"] = category.value
    if status:
        query["status"] = status.value
    if department_id:
        query["department_id"] = department_id
    if from_date:
        query["transaction_date"] = {"$gte": from_date}
    if to_date:
        if "transaction_date" in query:
            query["transaction_date"]["$lte"] = to_date
        else:
            query["transaction_date"] = {"$lte": to_date}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("transaction_date", -1).skip(skip).limit(limit).to_list(limit)
    
    return [ExpenseResponse(**e) for e in expenses]


@finance_router.put("/expenses/{expense_id}/approve")
async def approve_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    """Duyệt chi phí"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.expenses.update_one(
        {"id": expense_id},
        {"$set": {
            "status": PaymentStatus.PAID.value,
            "approved_by": current_user["id"],
            "approved_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"success": True, "status": "approved"}


# ==================== INVOICE ENDPOINTS ====================

@finance_router.post("/invoices", response_model=InvoiceResponse)
async def create_invoice(data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    """Tạo hoá đơn"""
    invoice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    invoice_no = generate_invoice_no(data.invoice_type.value)
    
    invoice_doc = {
        "id": invoice_id,
        "invoice_no": invoice_no,
        "invoice_type": data.invoice_type.value,
        "invoice_type_label": get_category_label(data.invoice_type.value),
        "customer_id": data.customer_id,
        "customer_name": data.customer_name,
        "customer_address": data.customer_address,
        "customer_tax_code": data.customer_tax_code,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        "deal_id": data.deal_id,
        "contract_id": data.contract_id,
        "items": [item.dict() for item in data.items],
        "subtotal": data.subtotal,
        "total_discount": data.total_discount,
        "total_vat": data.total_vat,
        "total_amount": data.total_amount,
        "total_amount_words": number_to_words_vn(data.total_amount),
        "payment_method": data.payment_method,
        "payment_terms": data.payment_terms,
        "due_date": data.due_date,
        "status": InvoiceStatus.DRAFT.value,
        "paid_amount": 0,
        "remaining_amount": data.total_amount,
        "notes": data.notes,
        "internal_notes": data.internal_notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.invoices.insert_one(invoice_doc)
    
    return InvoiceResponse(**invoice_doc)


@finance_router.get("/invoices", response_model=List[InvoiceResponse])
async def get_invoices(
    invoice_type: Optional[InvoiceType] = None,
    status: Optional[InvoiceStatus] = None,
    customer_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách hoá đơn"""
    query = {}
    if invoice_type:
        query["invoice_type"] = invoice_type.value
    if status:
        query["status"] = status.value
    if customer_id:
        query["customer_id"] = customer_id
    if from_date:
        query["created_at"] = {"$gte": from_date}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = to_date
        else:
            query["created_at"] = {"$lte": to_date}
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [InvoiceResponse(**inv) for inv in invoices]


@finance_router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Lấy chi tiết hoá đơn"""
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceResponse(**invoice)


@finance_router.put("/invoices/{invoice_id}/issue")
async def issue_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """Phát hành hoá đơn"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.invoices.update_one(
        {"id": invoice_id, "status": InvoiceStatus.DRAFT.value},
        {"$set": {
            "status": InvoiceStatus.ISSUED.value,
            "issued_at": now,
            "updated_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Invoice not found or already issued")
    
    return {"success": True, "status": "issued"}


@finance_router.put("/invoices/{invoice_id}/record-payment")
async def record_invoice_payment(
    invoice_id: str,
    amount: float,
    payment_ref: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Ghi nhận thanh toán"""
    now = datetime.now(timezone.utc).isoformat()
    
    invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    new_paid_amount = invoice.get("paid_amount", 0) + amount
    remaining = invoice["total_amount"] - new_paid_amount
    
    status = InvoiceStatus.PAID.value if remaining <= 0 else InvoiceStatus.ISSUED.value
    
    await db.invoices.update_one(
        {"id": invoice_id},
        {"$set": {
            "paid_amount": new_paid_amount,
            "remaining_amount": max(0, remaining),
            "status": status,
            "paid_at": now if remaining <= 0 else None,
            "updated_at": now
        }}
    )
    
    return {"success": True, "paid_amount": new_paid_amount, "remaining": max(0, remaining)}


# ==================== CONTRACT ENDPOINTS ====================

@finance_router.post("/contracts", response_model=ContractResponse)
async def create_contract(data: ContractCreate, current_user: dict = Depends(get_current_user)):
    """Tạo hợp đồng"""
    contract_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    contract_no = generate_contract_no(data.contract_type.value)
    
    # Tính VAT
    vat_amount = 0 if data.vat_included else data.contract_value * data.vat_rate / 100
    total_value = data.contract_value if data.vat_included else data.contract_value + vat_amount
    
    # Tính số ngày hiệu lực
    duration_days = 0
    if data.end_date:
        try:
            start = datetime.fromisoformat(data.start_date.replace('Z', '+00:00'))
            end = datetime.fromisoformat(data.end_date.replace('Z', '+00:00'))
            duration_days = (end - start).days
        except:
            pass
    
    contract_doc = {
        "id": contract_id,
        "contract_no": contract_no,
        "contract_type": data.contract_type.value,
        "contract_type_label": get_category_label(data.contract_type.value),
        "title": data.title,
        # Các bên
        "party_a": data.party_a.dict(),
        "party_b": data.party_b.dict(),
        # BĐS
        "property_id": data.property_id,
        "property_address": data.property_address,
        "property_area": data.property_area,
        # Giá trị
        "contract_value": data.contract_value,
        "contract_value_words": number_to_words_vn(data.contract_value),
        "currency": data.currency,
        "vat_included": data.vat_included,
        "vat_rate": data.vat_rate,
        "vat_amount": vat_amount,
        "total_value": total_value,
        # Thời hạn
        "start_date": data.start_date,
        "end_date": data.end_date,
        "signing_date": data.signing_date,
        "duration_days": duration_days,
        # Thanh toán
        "payment_schedules": [ps.dict() for ps in data.payment_schedules],
        "deposit_amount": data.deposit_amount,
        "paid_amount": 0,
        "remaining_amount": total_value,
        "payment_progress": 0,
        # Điều khoản
        "terms_and_conditions": data.terms_and_conditions,
        "special_terms": data.special_terms,
        # Liên kết
        "deal_id": data.deal_id,
        "project_id": data.project_id,
        "lead_id": data.lead_id,
        "customer_id": data.customer_id,
        # Trạng thái
        "status": ContractStatus.DRAFT.value,
        "signed_by_a": False,
        "signed_by_b": False,
        # File
        "template_id": data.template_id,
        "attachments": data.attachments,
        "notes": data.notes,
        # Audit
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.contracts.insert_one(contract_doc)
    
    return ContractResponse(**contract_doc)


@finance_router.get("/contracts", response_model=List[ContractResponse])
async def get_contracts(
    contract_type: Optional[ContractType] = None,
    status: Optional[ContractStatus] = None,
    customer_id: Optional[str] = None,
    project_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách hợp đồng"""
    query = {}
    if contract_type:
        query["contract_type"] = contract_type.value
    if status:
        query["status"] = status.value
    if customer_id:
        query["customer_id"] = customer_id
    if project_id:
        query["project_id"] = project_id
    if from_date:
        query["created_at"] = {"$gte": from_date}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = to_date
        else:
            query["created_at"] = {"$lte": to_date}
    
    contracts = await db.contracts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [ContractResponse(**c) for c in contracts]


@finance_router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str, current_user: dict = Depends(get_current_user)):
    """Lấy chi tiết hợp đồng"""
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    return ContractResponse(**contract)


@finance_router.put("/contracts/{contract_id}/sign")
async def sign_contract(contract_id: str, party: str, current_user: dict = Depends(get_current_user)):
    """Ký hợp đồng (party = 'a' hoặc 'b')"""
    now = datetime.now(timezone.utc).isoformat()
    
    update = {"updated_at": now}
    if party == "a":
        update["signed_by_a"] = True
        update["signed_at_a"] = now
    elif party == "b":
        update["signed_by_b"] = True
        update["signed_at_b"] = now
    else:
        raise HTTPException(status_code=400, detail="Invalid party. Use 'a' or 'b'")
    
    # Check if both signed
    contract = await db.contracts.find_one({"id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    both_signed = (
        (party == "a" and contract.get("signed_by_b")) or
        (party == "b" and contract.get("signed_by_a"))
    )
    
    if both_signed:
        update["status"] = ContractStatus.ACTIVE.value
        update["signing_date"] = now
    else:
        update["status"] = ContractStatus.PENDING_SIGNATURE.value
    
    await db.contracts.update_one({"id": contract_id}, {"$set": update})
    
    return {"success": True, "status": update.get("status", "pending_signature")}


# ==================== BUDGET ENDPOINTS ====================

@finance_router.post("/budgets", response_model=BudgetResponse)
async def create_budget(data: BudgetCreate, current_user: dict = Depends(get_current_user)):
    """Tạo ngân sách"""
    budget_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Build period label
    if data.budget_type == BudgetType.MONTHLY and data.period_month:
        period_label = f"Tháng {data.period_month}/{data.period_year}"
    elif data.budget_type == BudgetType.QUARTERLY and data.period_quarter:
        period_label = f"Quý {data.period_quarter}/{data.period_year}"
    else:
        period_label = f"Năm {data.period_year}"
    
    budget_doc = {
        "id": budget_id,
        "name": data.name,
        "budget_type": data.budget_type.value,
        "budget_type_label": get_category_label(data.budget_type.value),
        "description": data.description,
        # Phạm vi
        "department_id": data.department_id,
        "project_id": data.project_id,
        "campaign_id": data.campaign_id,
        "branch_id": data.branch_id,
        # Thời gian
        "period_year": data.period_year,
        "period_quarter": data.period_quarter,
        "period_month": data.period_month,
        "period_label": period_label,
        "start_date": data.start_date,
        "end_date": data.end_date,
        # Ngân sách
        "total_planned": data.total_planned,
        "total_actual": 0,
        "total_variance": data.total_planned,
        "variance_percent": 0,
        "utilization_rate": 0,
        "line_items": [item.dict() for item in data.line_items],
        # Trạng thái
        "status": BudgetStatus.DRAFT.value,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.budgets.insert_one(budget_doc)
    
    return BudgetResponse(**budget_doc)


@finance_router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(
    budget_type: Optional[BudgetType] = None,
    status: Optional[BudgetStatus] = None,
    period_year: Optional[int] = None,
    department_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách ngân sách"""
    query = {}
    if budget_type:
        query["budget_type"] = budget_type.value
    if status:
        query["status"] = status.value
    if period_year:
        query["period_year"] = period_year
    if department_id:
        query["department_id"] = department_id
    
    budgets = await db.budgets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [BudgetResponse(**b) for b in budgets]


@finance_router.put("/budgets/{budget_id}/approve")
async def approve_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    """Duyệt ngân sách"""
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.budgets.update_one(
        {"id": budget_id},
        {"$set": {
            "status": BudgetStatus.APPROVED.value,
            "approved_by": current_user["id"],
            "approved_at": now,
            "updated_at": now
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    return {"success": True, "status": "approved"}


# ==================== DEBT ENDPOINTS ====================

@finance_router.post("/debts", response_model=DebtResponse)
async def create_debt(data: DebtCreate, current_user: dict = Depends(get_current_user)):
    """Tạo công nợ"""
    debt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    debt_doc = {
        "id": debt_id,
        "debt_type": data.debt_type.value,
        "debt_type_label": get_category_label(data.debt_type.value),
        "customer_id": data.customer_id,
        "vendor_id": data.vendor_id,
        "partner_name": data.partner_name,
        "description": data.description,
        "amount": data.amount,
        "paid_amount": 0,
        "remaining_amount": data.amount,
        "due_date": data.due_date,
        "days_overdue": 0,
        "invoice_id": data.invoice_id,
        "contract_id": data.contract_id,
        "deal_id": data.deal_id,
        "status": PaymentStatus.PENDING.value,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.debts.insert_one(debt_doc)
    
    return DebtResponse(**debt_doc)


@finance_router.get("/debts", response_model=List[DebtResponse])
async def get_debts(
    debt_type: Optional[DebtType] = None,
    status: Optional[PaymentStatus] = None,
    customer_id: Optional[str] = None,
    overdue_only: bool = False,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách công nợ"""
    query = {}
    if debt_type:
        query["debt_type"] = debt_type.value
    if status:
        query["status"] = status.value
    if customer_id:
        query["customer_id"] = customer_id
    if overdue_only:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        query["due_date"] = {"$lt": today}
        query["status"] = {"$ne": PaymentStatus.PAID.value}
    
    debts = await db.debts.find(query, {"_id": 0}).sort("due_date", 1).skip(skip).limit(limit).to_list(limit)
    
    # Calculate days overdue
    today = datetime.now(timezone.utc)
    for debt in debts:
        if debt.get("due_date") and debt.get("status") != PaymentStatus.PAID.value:
            try:
                due = datetime.fromisoformat(debt["due_date"].replace('Z', '+00:00'))
                if today > due:
                    debt["days_overdue"] = (today - due).days
            except:
                pass
    
    return [DebtResponse(**d) for d in debts]


@finance_router.put("/debts/{debt_id}/record-payment")
async def record_debt_payment(
    debt_id: str,
    amount: float,
    payment_ref: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Ghi nhận thanh toán công nợ"""
    now = datetime.now(timezone.utc).isoformat()
    
    debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    new_paid = debt.get("paid_amount", 0) + amount
    remaining = debt["amount"] - new_paid
    
    status = PaymentStatus.PAID.value if remaining <= 0 else PaymentStatus.PARTIAL.value
    
    await db.debts.update_one(
        {"id": debt_id},
        {"$set": {
            "paid_amount": new_paid,
            "remaining_amount": max(0, remaining),
            "status": status,
            "updated_at": now
        }}
    )
    
    return {"success": True, "paid_amount": new_paid, "remaining": max(0, remaining)}


# ==================== TAX ENDPOINTS ====================

@finance_router.get("/tax/report")
async def get_tax_report(
    period_type: str = "quarterly",
    period_year: Optional[int] = None,
    period_quarter: Optional[int] = None,
    period_month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Báo cáo thuế tổng hợp"""
    if not period_year:
        period_year = datetime.now().year
    
    # Build date range based on period
    if period_type == "monthly" and period_month:
        start_date = f"{period_year}-{period_month:02d}-01"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01"
    elif period_type == "quarterly" and period_quarter:
        start_month = (period_quarter - 1) * 3 + 1
        end_month = start_month + 3
        start_date = f"{period_year}-{start_month:02d}-01"
        if end_month > 12:
            end_date = f"{period_year + 1}-01-01"
        else:
            end_date = f"{period_year}-{end_month:02d}-01"
    else:
        start_date = f"{period_year}-01-01"
        end_date = f"{period_year + 1}-01-01"
    
    # Calculate VAT
    revenue_result = await db.revenues.aggregate([
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    vat_output = total_revenue * 0.10  # 10% VAT
    
    expense_result = await db.expenses.aggregate([
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    total_expense = expense_result[0]["total"] if expense_result else 0
    vat_input = total_expense * 0.10  # Approximate
    
    vat_payable = max(0, vat_output - vat_input)
    
    # CIT calculation (20% of profit)
    taxable_income = max(0, total_revenue - total_expense)
    cit_amount = taxable_income * 0.20
    
    # PIT from salaries
    pit_result = await db.salaries.aggregate([
        {"$match": {"period_year": period_year}},
        {"$group": {
            "_id": None,
            "total_pit": {"$sum": "$personal_income_tax"},
            "employee_count": {"$sum": 1}
        }}
    ]).to_list(1)
    pit_total = pit_result[0]["total_pit"] if pit_result else 0
    employee_count = pit_result[0]["employee_count"] if pit_result else 0
    
    total_tax = vat_payable + cit_amount + pit_total
    
    return {
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
        "period_quarter": period_quarter,
        "vat_output": vat_output,
        "vat_input": vat_input,
        "vat_payable": vat_payable,
        "cit_taxable_income": taxable_income,
        "cit_rate": 20,
        "cit_amount": cit_amount,
        "pit_total_employees": employee_count,
        "pit_total_amount": pit_total,
        "total_tax_payable": total_tax,
        "total_tax_paid": 0,
        "total_tax_remaining": total_tax
    }


# ==================== FORECAST ENDPOINTS ====================

@finance_router.post("/forecasts", response_model=ForecastResponse)
async def create_forecast(data: ForecastCreate, current_user: dict = Depends(get_current_user)):
    """Tạo dự báo tài chính"""
    forecast_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Build period label
    if data.period_type == "monthly" and data.period_month:
        period_label = f"Tháng {data.period_month}/{data.period_year}"
    elif data.period_type == "quarterly" and data.period_quarter:
        period_label = f"Quý {data.period_quarter}/{data.period_year}"
    else:
        period_label = f"Năm {data.period_year}"
    
    forecast_doc = {
        "id": forecast_id,
        "name": data.name,
        "forecast_type": data.forecast_type,
        "forecast_type_label": get_category_label(data.forecast_type),
        "period_type": data.period_type,
        "period_year": data.period_year,
        "period_month": data.period_month,
        "period_quarter": data.period_quarter,
        "period_label": period_label,
        "forecast_amount": data.forecast_amount,
        "actual_amount": 0,
        "variance": data.forecast_amount,
        "variance_percent": 0,
        "accuracy": 0,
        "confidence_level": data.confidence_level,
        "methodology": data.methodology,
        "assumptions": data.assumptions,
        "notes": data.notes,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.forecasts.insert_one(forecast_doc)
    
    return ForecastResponse(**forecast_doc)


@finance_router.get("/forecasts", response_model=List[ForecastResponse])
async def get_forecasts(
    forecast_type: Optional[str] = None,
    period_year: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách dự báo"""
    query = {}
    if forecast_type:
        query["forecast_type"] = forecast_type
    if period_year:
        query["period_year"] = period_year
    
    forecasts = await db.forecasts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [ForecastResponse(**f) for f in forecasts]


# ==================== FINANCIAL SUMMARY ENDPOINTS ====================

@finance_router.get("/summary")
async def get_financial_summary(
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    period_quarter: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Tổng hợp tài chính"""
    if not period_year:
        period_year = datetime.now().year
    if not period_month:
        period_month = datetime.now().month
    
    # Build date range
    if period_type == "monthly":
        start_date = f"{period_year}-{period_month:02d}-01"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01"
        period_label = f"Tháng {period_month}/{period_year}"
    elif period_type == "quarterly" and period_quarter:
        start_month = (period_quarter - 1) * 3 + 1
        end_month = start_month + 3
        start_date = f"{period_year}-{start_month:02d}-01"
        if end_month > 12:
            end_date = f"{period_year + 1}-01-01"
        else:
            end_date = f"{period_year}-{end_month:02d}-01"
        period_label = f"Quý {period_quarter}/{period_year}"
    else:
        start_date = f"{period_year}-01-01"
        end_date = f"{period_year + 1}-01-01"
        period_label = f"Năm {period_year}"
    
    # Revenue
    revenue_pipeline = [
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"}
        }}
    ]
    revenue_results = await db.revenues.aggregate(revenue_pipeline).to_list(100)
    total_revenue = sum(r["total"] for r in revenue_results)
    revenue_by_category = {r["_id"]: r["total"] for r in revenue_results}
    
    # Expense
    expense_pipeline = [
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"}
        }}
    ]
    expense_results = await db.expenses.aggregate(expense_pipeline).to_list(100)
    total_expense = sum(e["total"] for e in expense_results)
    expense_by_category = {e["_id"]: e["total"] for e in expense_results}
    
    # Profit
    gross_profit = total_revenue - total_expense
    profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Debts
    receivable_result = await db.debts.aggregate([
        {"$match": {"debt_type": "receivable", "status": {"$ne": "paid"}}},
        {"$group": {"_id": None, "total": {"$sum": "$remaining_amount"}}}
    ]).to_list(1)
    total_receivable = receivable_result[0]["total"] if receivable_result else 0
    
    payable_result = await db.debts.aggregate([
        {"$match": {"debt_type": "payable", "status": {"$ne": "paid"}}},
        {"$group": {"_id": None, "total": {"$sum": "$remaining_amount"}}}
    ]).to_list(1)
    total_payable = payable_result[0]["total"] if payable_result else 0
    
    # Overdue
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue_recv_result = await db.debts.aggregate([
        {"$match": {"debt_type": "receivable", "due_date": {"$lt": today}, "status": {"$ne": "paid"}}},
        {"$group": {"_id": None, "total": {"$sum": "$remaining_amount"}}}
    ]).to_list(1)
    overdue_receivable = overdue_recv_result[0]["total"] if overdue_recv_result else 0
    
    return {
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
        "period_quarter": period_quarter,
        "period_label": period_label,
        "total_revenue": total_revenue,
        "revenue_by_category": revenue_by_category,
        "revenue_growth": 0,
        "total_expense": total_expense,
        "expense_by_category": expense_by_category,
        "expense_growth": 0,
        "gross_profit": gross_profit,
        "net_profit": gross_profit,
        "profit_margin": profit_margin,
        "total_receivable": total_receivable,
        "total_payable": total_payable,
        "overdue_receivable": overdue_receivable,
        "overdue_payable": 0,
        "total_tax_payable": 0,
        "total_tax_paid": 0,
        "budget_utilization": 0,
        "revenue_vs_target": 0,
        "profit_vs_target": 0
    }


@finance_router.get("/cash-flow")
async def get_cash_flow_report(
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Báo cáo dòng tiền"""
    if not period_year:
        period_year = datetime.now().year
    if not period_month:
        period_month = datetime.now().month
    
    start_date = f"{period_year}-{period_month:02d}-01"
    if period_month == 12:
        end_date = f"{period_year + 1}-01-01"
    else:
        end_date = f"{period_year}-{period_month + 1:02d}-01"
    
    # Operating cash in (Revenue)
    revenue_result = await db.revenues.aggregate([
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    operating_cash_in = revenue_result[0]["total"] if revenue_result else 0
    
    # Operating cash out (Expenses excluding investment)
    expense_result = await db.expenses.aggregate([
        {"$match": {
            "transaction_date": {"$gte": start_date, "$lt": end_date},
            "category": {"$nin": ["equipment", "software"]}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    operating_cash_out = expense_result[0]["total"] if expense_result else 0
    
    # Investing cash out (Equipment, Software)
    invest_result = await db.expenses.aggregate([
        {"$match": {
            "transaction_date": {"$gte": start_date, "$lt": end_date},
            "category": {"$in": ["equipment", "software"]}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]).to_list(1)
    investing_cash_out = invest_result[0]["total"] if invest_result else 0
    
    net_operating = operating_cash_in - operating_cash_out
    net_investing = -investing_cash_out
    net_cash_flow = net_operating + net_investing
    
    return {
        "period_type": "monthly",
        "period_year": period_year,
        "period_month": period_month,
        "period_label": f"Tháng {period_month}/{period_year}",
        "operating_cash_in": operating_cash_in,
        "operating_cash_out": operating_cash_out,
        "net_operating_cash": net_operating,
        "investing_cash_in": 0,
        "investing_cash_out": investing_cash_out,
        "net_investing_cash": net_investing,
        "financing_cash_in": 0,
        "financing_cash_out": 0,
        "net_financing_cash": 0,
        "total_cash_in": operating_cash_in,
        "total_cash_out": operating_cash_out + investing_cash_out,
        "net_cash_flow": net_cash_flow,
        "opening_balance": 0,
        "closing_balance": net_cash_flow
    }


@finance_router.get("/profit-loss")
async def get_profit_loss_report(
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Báo cáo Lãi/Lỗ"""
    if not period_year:
        period_year = datetime.now().year
    if not period_month:
        period_month = datetime.now().month
    
    start_date = f"{period_year}-{period_month:02d}-01"
    if period_month == 12:
        end_date = f"{period_year + 1}-01-01"
    else:
        end_date = f"{period_year}-{period_month + 1:02d}-01"
    
    # Revenue details
    revenue_pipeline = [
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    revenue_results = await db.revenues.aggregate(revenue_pipeline).to_list(100)
    revenue_details = [{"category": r["_id"], "label": get_category_label(r["_id"]), "amount": r["amount"]} for r in revenue_results]
    total_revenue = sum(r["amount"] for r in revenue_results)
    
    # Operating expenses
    expense_pipeline = [
        {"$match": {"transaction_date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$category",
            "amount": {"$sum": "$amount"},
            "count": {"$sum": 1}
        }}
    ]
    expense_results = await db.expenses.aggregate(expense_pipeline).to_list(100)
    operating_expenses = [{"category": e["_id"], "label": get_category_label(e["_id"]), "amount": e["amount"]} for e in expense_results]
    total_operating_expense = sum(e["amount"] for e in expense_results)
    
    # Profit calculations
    gross_profit = total_revenue
    gross_margin = 100  # No COGS in service business
    operating_profit = total_revenue - total_operating_expense
    operating_margin = (operating_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    # Tax (20% CIT)
    profit_before_tax = operating_profit
    income_tax = max(0, profit_before_tax * 0.20)
    net_profit = profit_before_tax - income_tax
    net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return {
        "period_type": "monthly",
        "period_year": period_year,
        "period_month": period_month,
        "period_label": f"Tháng {period_month}/{period_year}",
        "revenue_details": revenue_details,
        "total_revenue": total_revenue,
        "cost_of_goods_sold": 0,
        "gross_profit": gross_profit,
        "gross_margin": gross_margin,
        "operating_expenses": operating_expenses,
        "total_operating_expense": total_operating_expense,
        "operating_profit": operating_profit,
        "operating_margin": operating_margin,
        "other_income": 0,
        "other_expense": 0,
        "profit_before_tax": profit_before_tax,
        "income_tax": income_tax,
        "net_profit": net_profit,
        "net_margin": net_margin
    }


# ==================== SALES TARGET ENDPOINTS ====================

@finance_router.post("/sales-targets")
async def create_sales_target(
    name: str,
    target_type: str,
    target_id: Optional[str] = None,
    period_type: str = "monthly",
    period_year: Optional[int] = None,
    period_month: Optional[int] = None,
    period_quarter: Optional[int] = None,
    target_amount: float = 0,
    target_deals: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Tạo mục tiêu doanh số"""
    target_doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    if not period_year:
        period_year = datetime.now().year
    
    target_doc = {
        "id": target_doc_id,
        "name": name,
        "target_type": target_type,
        "target_id": target_id,
        "period_type": period_type,
        "period_year": period_year,
        "period_month": period_month,
        "period_quarter": period_quarter,
        "target_amount": target_amount,
        "achieved_amount": 0,
        "achievement_rate": 0,
        "target_deals": target_deals,
        "achieved_deals": 0,
        "is_active": True,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.sales_targets.insert_one(target_doc)
    
    return target_doc


@finance_router.get("/sales-targets")
async def get_sales_targets(
    target_type: Optional[str] = None,
    period_year: Optional[int] = None,
    is_active: bool = True,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách mục tiêu doanh số"""
    query = {"is_active": is_active}
    if target_type:
        query["target_type"] = target_type
    if period_year:
        query["period_year"] = period_year
    
    targets = await db.sales_targets.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return targets


# ==================== BANK ACCOUNT ENDPOINTS ====================

@finance_router.post("/bank-accounts")
async def create_bank_account(
    account_name: str,
    account_number: str,
    bank_name: str,
    bank_code: str,
    branch: Optional[str] = None,
    currency: str = "VND",
    account_type: str = "checking",
    is_primary: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Tạo tài khoản ngân hàng"""
    account_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    account_doc = {
        "id": account_id,
        "account_name": account_name,
        "account_number": account_number,
        "bank_name": bank_name,
        "bank_code": bank_code,
        "branch": branch,
        "currency": currency,
        "account_type": account_type,
        "is_primary": is_primary,
        "is_active": True,
        "current_balance": 0,
        "last_synced": None,
        "created_by": current_user["id"],
        "created_at": now
    }
    
    await db.bank_accounts.insert_one(account_doc)
    
    return account_doc


@finance_router.get("/bank-accounts")
async def get_bank_accounts(
    is_active: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách tài khoản ngân hàng"""
    accounts = await db.bank_accounts.find({"is_active": is_active}, {"_id": 0}).to_list(100)
    return accounts


# ==================== CONTRACT TEMPLATE ENDPOINTS ====================

@finance_router.post("/contract-templates")
async def create_contract_template(
    name: str,
    contract_type: ContractType,
    content: str,
    description: Optional[str] = None,
    variables: List[str] = [],
    current_user: dict = Depends(get_current_user)
):
    """Tạo mẫu hợp đồng"""
    template_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    template_doc = {
        "id": template_id,
        "name": name,
        "contract_type": contract_type.value,
        "description": description,
        "content": content,
        "variables": variables,
        "is_active": True,
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.contract_templates.insert_one(template_doc)
    
    return template_doc


@finance_router.get("/contract-templates")
async def get_contract_templates(
    contract_type: Optional[ContractType] = None,
    is_active: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách mẫu hợp đồng"""
    query = {"is_active": is_active}
    if contract_type:
        query["contract_type"] = contract_type.value
    
    templates = await db.contract_templates.find(query, {"_id": 0}).to_list(100)
    return templates
