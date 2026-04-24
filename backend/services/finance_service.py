"""
ProHouzing Finance Service
Core Engine cho Hệ thống Tài chính BĐS Thứ cấp

Chức năng chính:
1. Payment Tracking - Theo dõi thanh toán
2. Commission Engine - Tính hoa hồng (% theo dự án)
3. Commission Split - Chia hoa hồng tự động
4. Receivable - Công nợ chủ đầu tư
5. Invoice - Hóa đơn VAT
6. Tax - Thuế (VAT, TNCN)
7. Payout - Chi trả (kế toán duyệt)
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.finance_config import (
    CommissionSplitConfig, TaxConfig,
    PaymentInstallmentStatus, FinanceCommissionStatus,
    CommissionSplitStatus, ReceivableStatus, InvoiceStatus, PayoutStatus,
    RecipientRole, FinanceTrigger, FinanceRole,
    get_payment_status_config, get_commission_status_config,
    get_split_status_config, get_receivable_status_config,
    get_invoice_status_config, get_payout_status_config,
    calculate_commission_split, calculate_tax, calculate_net_amount,
    has_finance_permission,
)

from models.finance_models import (
    PaymentInstallmentCreate, PaymentInstallmentUpdate, PaymentInstallmentResponse,
    ProjectCommissionCreate, ProjectCommissionResponse,
    FinanceCommissionCreate, FinanceCommissionResponse,
    CommissionSplitResponse,
    ReceivableCreate, ReceivableResponse, ReceivablePaymentRequest,
    InvoiceCreate, InvoiceResponse,
    TaxRecordResponse, TaxType,
    PayoutCreate, PayoutResponse, PayoutApproveRequest, PayoutMarkPaidRequest,
    CEODashboardResponse, SaleDashboardResponse,
)


class FinanceService:
    """Finance Service - Core business logic"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CODE GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _generate_code(self, prefix: str) -> str:
        """Generate sequential code like FC-202512-0001"""
        now = datetime.now(timezone.utc)
        month_key = f"{prefix}_{now.strftime('%Y%m')}"
        
        counter_doc = await self.db.counters.find_one_and_update(
            {"_id": month_key},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True
        )
        seq = counter_doc.get("seq", 1)
        return f"{prefix}-{now.strftime('%Y%m')}-{seq:04d}"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 1. PAYMENT TRACKING - Theo dõi thanh toán
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_payment_installment(
        self,
        data: PaymentInstallmentCreate,
        created_by: str
    ) -> PaymentInstallmentResponse:
        """Tạo đợt thanh toán cho hợp đồng"""
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": str(uuid.uuid4()),
            "contract_id": data.contract_id,
            "installment_name": data.installment_name,
            "installment_number": data.installment_number,
            "amount": data.amount,
            "due_date": data.due_date,
            "status": PaymentInstallmentStatus.PENDING.value,
            "paid_date": None,
            "days_overdue": 0,
            "notes": data.notes,
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.payment_trackings.insert_one(doc)
        return await self._enrich_payment_installment(doc)
    
    async def create_payment_installments_from_contract(
        self,
        contract_id: str,
        created_by: str
    ) -> List[PaymentInstallmentResponse]:
        """
        Auto tạo payment tracking từ payment_schedule của contract
        TRIGGER: contract_signed
        """
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        if not contract:
            return []
        
        # Lấy payment_schedule từ contract
        payment_schedule = contract.get("payment_schedule", [])
        if not payment_schedule:
            return []
        
        results = []
        for installment in payment_schedule:
            # Check if already exists
            existing = await self.db.payment_trackings.find_one({
                "contract_id": contract_id,
                "installment_number": installment.get("installment_number")
            })
            if existing:
                continue
            
            data = PaymentInstallmentCreate(
                contract_id=contract_id,
                installment_name=installment.get("installment_name", f"Đợt {installment.get('installment_number', 1)}"),
                installment_number=installment.get("installment_number", 1),
                amount=installment.get("amount", 0),
                due_date=installment.get("due_date") or datetime.now(timezone.utc).isoformat(),
                notes=installment.get("notes"),
            )
            result = await self.create_payment_installment(data, created_by)
            results.append(result)
        
        return results
    
    async def update_payment_installment_status(
        self,
        installment_id: str,
        status: str,
        paid_date: Optional[str] = None,
        updated_by: str = "system"
    ) -> Optional[PaymentInstallmentResponse]:
        """Cập nhật trạng thái đợt thanh toán"""
        now = datetime.now(timezone.utc).isoformat()
        
        updates = {
            "status": status,
            "updated_at": now,
        }
        
        if status == PaymentInstallmentStatus.PAID.value and paid_date:
            updates["paid_date"] = paid_date
        
        result = await self.db.payment_trackings.find_one_and_update(
            {"id": installment_id},
            {"$set": updates},
            return_document=True
        )
        
        if not result:
            return None
        
        return await self._enrich_payment_installment(result)
    
    async def check_overdue_payments(self) -> int:
        """
        Kiểm tra và cập nhật các đợt thanh toán quá hạn
        Chạy định kỳ (daily)
        """
        now = datetime.now(timezone.utc)
        now_str = now.isoformat()
        
        # Find pending payments with due_date < now
        result = await self.db.payment_trackings.update_many(
            {
                "status": PaymentInstallmentStatus.PENDING.value,
                "due_date": {"$lt": now_str}
            },
            {"$set": {
                "status": PaymentInstallmentStatus.OVERDUE.value,
                "updated_at": now_str
            }}
        )
        
        # Update days_overdue for all overdue payments
        overdue_docs = await self.db.payment_trackings.find(
            {"status": PaymentInstallmentStatus.OVERDUE.value},
            {"_id": 0, "id": 1, "due_date": 1}
        ).to_list(1000)
        
        for doc in overdue_docs:
            try:
                due = datetime.fromisoformat(doc["due_date"].replace("Z", "+00:00"))
                days = (now - due).days
                await self.db.payment_trackings.update_one(
                    {"id": doc["id"]},
                    {"$set": {"days_overdue": max(0, days)}}
                )
            except Exception:
                pass
        
        return result.modified_count
    
    async def list_payment_installments(
        self,
        contract_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[PaymentInstallmentResponse]:
        """List payment installments với filter"""
        query = {}
        if contract_id:
            query["contract_id"] = contract_id
        if status:
            query["status"] = status
        
        docs = await self.db.payment_trackings.find(
            query, {"_id": 0}
        ).sort("due_date", 1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_payment_installment(d) for d in docs]
    
    async def _enrich_payment_installment(self, doc: dict) -> PaymentInstallmentResponse:
        """Enrich payment installment với thông tin liên quan"""
        contract_code = ""
        customer_name = ""
        project_name = ""
        
        if doc.get("contract_id"):
            contract = await self.db.contracts.find_one(
                {"id": doc["contract_id"]},
                {"_id": 0, "contract_code": 1, "customer_id": 1, "project_id": 1}
            )
            if contract:
                contract_code = contract.get("contract_code", "")
                
                if contract.get("customer_id"):
                    customer = await self.db.contacts.find_one(
                        {"id": contract["customer_id"]},
                        {"_id": 0, "full_name": 1}
                    )
                    customer_name = customer.get("full_name", "") if customer else ""
                
                if contract.get("project_id"):
                    project = await self.db.projects_master.find_one(
                        {"id": contract["project_id"]},
                        {"_id": 0, "name": 1}
                    )
                    project_name = project.get("name", "") if project else ""
        
        status_config = get_payment_status_config(doc.get("status", ""))
        
        return PaymentInstallmentResponse(
            id=doc.get("id", ""),
            contract_id=doc.get("contract_id", ""),
            contract_code=contract_code,
            customer_name=customer_name,
            project_name=project_name,
            installment_name=doc.get("installment_name", ""),
            installment_number=doc.get("installment_number", 0),
            amount=doc.get("amount", 0),
            due_date=doc.get("due_date", ""),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            paid_date=doc.get("paid_date"),
            days_overdue=doc.get("days_overdue", 0),
            notes=doc.get("notes"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 2. PROJECT COMMISSION RATE - % Hoa hồng theo dự án
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_project_commission(
        self,
        data: ProjectCommissionCreate,
        created_by: str
    ) -> ProjectCommissionResponse:
        """Tạo cấu hình % hoa hồng cho dự án"""
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": str(uuid.uuid4()),
            "project_id": data.project_id,
            "commission_rate": data.commission_rate,
            "effective_from": data.effective_from,
            "effective_to": data.effective_to,
            "is_active": True,
            "notes": data.notes,
            "created_by": created_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.project_commissions.insert_one(doc)
        return await self._enrich_project_commission(doc)
    
    async def get_project_commission_rate(
        self,
        project_id: str,
        as_of_date: Optional[datetime] = None
    ) -> float:
        """
        Lấy % hoa hồng của dự án tại thời điểm cụ thể
        Returns 0 nếu không có cấu hình
        """
        if not as_of_date:
            as_of_date = datetime.now(timezone.utc)
        
        date_str = as_of_date.isoformat()
        
        # Find active commission rate
        doc = await self.db.project_commissions.find_one(
            {
                "project_id": project_id,
                "is_active": True,
                "effective_from": {"$lte": date_str},
                "$or": [
                    {"effective_to": None},
                    {"effective_to": {"$gte": date_str}}
                ]
            },
            {"_id": 0, "commission_rate": 1}
        )
        
        return doc.get("commission_rate", 0) if doc else 0
    
    async def list_project_commissions(
        self,
        project_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProjectCommissionResponse]:
        """List project commission rates"""
        query = {}
        if project_id:
            query["project_id"] = project_id
        
        docs = await self.db.project_commissions.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_project_commission(d) for d in docs]
    
    async def _enrich_project_commission(self, doc: dict) -> ProjectCommissionResponse:
        """Enrich project commission với thông tin dự án"""
        project_name = ""
        project_code = ""
        developer_name = ""
        created_by_name = ""
        
        if doc.get("project_id"):
            project = await self.db.projects_master.find_one(
                {"id": doc["project_id"]},
                {"_id": 0, "name": 1, "code": 1, "developer_id": 1}
            )
            if project:
                project_name = project.get("name", "")
                project_code = project.get("code", "")
                
                if project.get("developer_id"):
                    developer = await self.db.developers.find_one(
                        {"id": project["developer_id"]},
                        {"_id": 0, "name": 1}
                    )
                    developer_name = developer.get("name", "") if developer else ""
        
        if doc.get("created_by"):
            user = await self.db.users.find_one(
                {"id": doc["created_by"]},
                {"_id": 0, "full_name": 1}
            )
            created_by_name = user.get("full_name", "") if user else ""
        
        return ProjectCommissionResponse(
            id=doc.get("id", ""),
            project_id=doc.get("project_id", ""),
            project_name=project_name,
            project_code=project_code,
            developer_name=developer_name,
            commission_rate=doc.get("commission_rate", 0),
            effective_from=doc.get("effective_from", ""),
            effective_to=doc.get("effective_to"),
            is_active=doc.get("is_active", True),
            notes=doc.get("notes"),
            created_by=doc.get("created_by"),
            created_by_name=created_by_name,
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 3. COMMISSION ENGINE - Tính hoa hồng
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_finance_commission(
        self,
        contract_id: str,
        confirmed_by: str
    ) -> Tuple[Optional[FinanceCommissionResponse], List[str]]:
        """
        Tạo hoa hồng sau khi chủ đầu tư xác nhận deal
        TRIGGER: developer_confirm_payment
        
        Returns: (commission, errors)
        """
        errors = []
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Check idempotency
        existing = await self.db.finance_commissions.find_one({
            "contract_id": contract_id
        })
        if existing:
            return await self._enrich_finance_commission(existing), []
        
        # 2. Get contract
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        if not contract:
            return None, ["Contract not found"]
        
        # 3. Get project commission rate
        project_id = contract.get("project_id")
        commission_rate = await self.get_project_commission_rate(project_id)
        if commission_rate <= 0:
            errors.append(f"Project {project_id} chưa cấu hình % hoa hồng")
            return None, errors
        
        # 4. Get deal info
        deal = None
        deal_id = contract.get("deal_id")
        if deal_id:
            deal = await self.db.deals.find_one({"id": deal_id}, {"_id": 0})
        
        # 5. Get sale info
        sale_id = deal.get("assigned_to") if deal else contract.get("owner_id")
        leader_id = None
        ref_id = deal.get("ref_id") if deal else None
        
        # Get leader from team
        if sale_id:
            user = await self.db.users.find_one(
                {"id": sale_id},
                {"_id": 0, "team_id": 1}
            )
            if user and user.get("team_id"):
                team = await self.db.teams.find_one(
                    {"id": user["team_id"]},
                    {"_id": 0, "leader_id": 1}
                )
                if team:
                    leader_id = team.get("leader_id")
        
        # 6. Calculate total commission
        contract_value = contract.get("grand_total") or contract.get("contract_value", 0)
        total_commission = contract_value * commission_rate / 100
        
        # 7. Create commission record
        code = await self._generate_code("FC")
        
        doc = {
            "id": str(uuid.uuid4()),
            "code": code,
            "contract_id": contract_id,
            "contract_value": contract_value,
            "deal_id": deal_id,
            "project_id": project_id,
            "developer_id": None,  # Will be set from project
            "customer_id": contract.get("customer_id"),
            "sale_id": sale_id,
            "leader_id": leader_id,
            "ref_id": ref_id,
            "has_affiliate": ref_id is not None,
            "commission_rate": commission_rate,
            "total_commission": total_commission,
            "status": FinanceCommissionStatus.CONFIRMED.value,
            "confirmed_by": confirmed_by,
            "confirmed_at": now,
            "created_at": now,
            "updated_at": now,
        }
        
        # Get developer from project
        project = await self.db.projects_master.find_one(
            {"id": project_id},
            {"_id": 0, "developer_id": 1}
        )
        if project:
            doc["developer_id"] = project.get("developer_id")
        
        await self.db.finance_commissions.insert_one(doc)
        
        # 8. Auto trigger: Split commission
        await self.split_commission(doc["id"])
        
        # 9. Auto trigger: Create receivable
        await self.create_receivable(doc["id"])
        
        return await self._enrich_finance_commission(doc), errors
    
    async def list_finance_commissions(
        self,
        status: Optional[str] = None,
        project_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[FinanceCommissionResponse]:
        """List finance commissions"""
        query = {}
        if status:
            query["status"] = status
        if project_id:
            query["project_id"] = project_id
        
        docs = await self.db.finance_commissions.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_finance_commission(d) for d in docs]
    
    async def get_finance_commission(
        self,
        commission_id: str
    ) -> Optional[FinanceCommissionResponse]:
        """Get single finance commission"""
        doc = await self.db.finance_commissions.find_one(
            {"id": commission_id},
            {"_id": 0}
        )
        if not doc:
            return None
        return await self._enrich_finance_commission(doc)
    
    async def _enrich_finance_commission(self, doc: dict) -> FinanceCommissionResponse:
        """Enrich finance commission với thông tin liên quan"""
        contract_code = ""
        deal_code = ""
        project_name = ""
        developer_name = ""
        customer_name = ""
        sale_name = ""
        leader_name = ""
        ref_name = ""
        confirmed_by_name = ""
        
        # Contract
        if doc.get("contract_id"):
            contract = await self.db.contracts.find_one(
                {"id": doc["contract_id"]},
                {"_id": 0, "contract_code": 1}
            )
            contract_code = contract.get("contract_code", "") if contract else ""
        
        # Deal
        if doc.get("deal_id"):
            deal = await self.db.deals.find_one(
                {"id": doc["deal_id"]},
                {"_id": 0, "code": 1}
            )
            deal_code = deal.get("code", "") if deal else ""
        
        # Project
        if doc.get("project_id"):
            project = await self.db.projects_master.find_one(
                {"id": doc["project_id"]},
                {"_id": 0, "name": 1}
            )
            project_name = project.get("name", "") if project else ""
        
        # Developer
        if doc.get("developer_id"):
            developer = await self.db.developers.find_one(
                {"id": doc["developer_id"]},
                {"_id": 0, "name": 1}
            )
            developer_name = developer.get("name", "") if developer else ""
        
        # Customer
        if doc.get("customer_id"):
            customer = await self.db.contacts.find_one(
                {"id": doc["customer_id"]},
                {"_id": 0, "full_name": 1}
            )
            customer_name = customer.get("full_name", "") if customer else ""
        
        # Sale
        if doc.get("sale_id"):
            user = await self.db.users.find_one(
                {"id": doc["sale_id"]},
                {"_id": 0, "full_name": 1}
            )
            sale_name = user.get("full_name", "") if user else ""
        
        # Leader
        if doc.get("leader_id"):
            user = await self.db.users.find_one(
                {"id": doc["leader_id"]},
                {"_id": 0, "full_name": 1}
            )
            leader_name = user.get("full_name", "") if user else ""
        
        # Affiliate
        if doc.get("ref_id"):
            user = await self.db.users.find_one(
                {"id": doc["ref_id"]},
                {"_id": 0, "full_name": 1}
            )
            ref_name = user.get("full_name", "") if user else ""
        
        # Confirmed by
        if doc.get("confirmed_by"):
            user = await self.db.users.find_one(
                {"id": doc["confirmed_by"]},
                {"_id": 0, "full_name": 1}
            )
            confirmed_by_name = user.get("full_name", "") if user else ""
        
        status_config = get_commission_status_config(doc.get("status", ""))
        
        return FinanceCommissionResponse(
            id=doc.get("id", ""),
            code=doc.get("code", ""),
            contract_id=doc.get("contract_id", ""),
            contract_code=contract_code,
            contract_value=doc.get("contract_value", 0),
            deal_id=doc.get("deal_id"),
            deal_code=deal_code,
            project_id=doc.get("project_id", ""),
            project_name=project_name,
            developer_id=doc.get("developer_id"),
            developer_name=developer_name,
            customer_id=doc.get("customer_id"),
            customer_name=customer_name,
            sale_id=doc.get("sale_id", ""),
            sale_name=sale_name,
            leader_id=doc.get("leader_id"),
            leader_name=leader_name,
            ref_id=doc.get("ref_id"),
            ref_name=ref_name,
            has_affiliate=doc.get("has_affiliate", False),
            commission_rate=doc.get("commission_rate", 0),
            total_commission=doc.get("total_commission", 0),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            confirmed_by=doc.get("confirmed_by"),
            confirmed_by_name=confirmed_by_name,
            confirmed_at=doc.get("confirmed_at"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 4. COMMISSION SPLIT - Chia hoa hồng
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def split_commission(
        self,
        commission_id: str
    ) -> List[CommissionSplitResponse]:
        """
        Chia hoa hồng tự động
        TRIGGER: commission_created
        
        Split:
        - Sale: 60%
        - Leader: 10%
        - Company: 25% (30% nếu không có affiliate)
        - Affiliate: 5% (nếu có ref_id)
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Get commission
        commission = await self.db.finance_commissions.find_one(
            {"id": commission_id},
            {"_id": 0}
        )
        if not commission:
            return []
        
        # 2. Check if already split
        existing = await self.db.commission_splits.count_documents({
            "commission_id": commission_id
        })
        if existing > 0:
            # Return existing splits
            docs = await self.db.commission_splits.find(
                {"commission_id": commission_id},
                {"_id": 0}
            ).to_list(10)
            return [await self._enrich_commission_split(d) for d in docs]
        
        # 3. Calculate split amounts
        total = commission.get("total_commission", 0)
        has_affiliate = commission.get("has_affiliate", False)
        splits = calculate_commission_split(total, has_affiliate)
        
        results = []
        
        # 4. Create split records
        split_configs = [
            (RecipientRole.SALE, commission.get("sale_id"), splits["sale"], TaxConfig.TNCN_SALE_RATE),
            (RecipientRole.LEADER, commission.get("leader_id"), splits["leader"], TaxConfig.TNCN_SALE_RATE),
            (RecipientRole.COMPANY, "company", splits["company"], 0),  # Company không chịu TNCN
        ]
        
        if has_affiliate and commission.get("ref_id"):
            split_configs.append(
                (RecipientRole.AFFILIATE, commission.get("ref_id"), splits["affiliate"], TaxConfig.TNCN_AFFILIATE_RATE)
            )
        
        for role, recipient_id, gross_amount, tax_rate in split_configs:
            if not recipient_id or gross_amount <= 0:
                continue
            
            # Calculate tax
            tax_amount = gross_amount * tax_rate / 100
            net_amount = gross_amount - tax_amount
            
            # Get split percent
            percent = {
                RecipientRole.SALE: CommissionSplitConfig.SALE_PERCENT,
                RecipientRole.LEADER: CommissionSplitConfig.LEADER_PERCENT,
                RecipientRole.COMPANY: CommissionSplitConfig.COMPANY_PERCENT_NO_AFFILIATE if not has_affiliate else CommissionSplitConfig.COMPANY_PERCENT,
                RecipientRole.AFFILIATE: CommissionSplitConfig.AFFILIATE_PERCENT,
            }.get(role, 0)
            
            code = await self._generate_code("CS")
            
            doc = {
                "id": str(uuid.uuid4()),
                "code": code,
                "commission_id": commission_id,
                "contract_id": commission.get("contract_id"),
                "recipient_id": recipient_id,
                "recipient_role": role.value,
                "split_percent": percent,
                "gross_amount": gross_amount,
                "tax_rate": tax_rate,
                "tax_amount": tax_amount,
                "net_amount": net_amount,
                "status": CommissionSplitStatus.CALCULATED.value,
                "payout_id": None,
                "paid_at": None,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.commission_splits.insert_one(doc)
            results.append(await self._enrich_commission_split(doc))
            
            # Create tax record for TNCN
            if tax_rate > 0 and recipient_id != "company":
                await self._create_tax_record(
                    tax_type=TaxType.TNCN,
                    taxable_amount=gross_amount,
                    tax_rate=tax_rate,
                    tax_amount=tax_amount,
                    commission_split_id=doc["id"],
                    user_id=recipient_id,
                )
        
        # 5. Update commission status
        await self.db.finance_commissions.update_one(
            {"id": commission_id},
            {"$set": {
                "status": FinanceCommissionStatus.SPLIT.value,
                "updated_at": now
            }}
        )
        
        return results
    
    async def list_commission_splits(
        self,
        commission_id: Optional[str] = None,
        recipient_id: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[CommissionSplitResponse]:
        """List commission splits"""
        query = {}
        if commission_id:
            query["commission_id"] = commission_id
        if recipient_id:
            query["recipient_id"] = recipient_id
        if status:
            query["status"] = status
        
        docs = await self.db.commission_splits.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_commission_split(d) for d in docs]
    
    async def _enrich_commission_split(self, doc: dict) -> CommissionSplitResponse:
        """Enrich commission split"""
        commission_code = ""
        contract_code = ""
        recipient_name = ""
        
        if doc.get("commission_id"):
            comm = await self.db.finance_commissions.find_one(
                {"id": doc["commission_id"]},
                {"_id": 0, "code": 1}
            )
            commission_code = comm.get("code", "") if comm else ""
        
        if doc.get("contract_id"):
            contract = await self.db.contracts.find_one(
                {"id": doc["contract_id"]},
                {"_id": 0, "contract_code": 1}
            )
            contract_code = contract.get("contract_code", "") if contract else ""
        
        if doc.get("recipient_id"):
            if doc["recipient_id"] == "company":
                recipient_name = "Công ty"
            else:
                user = await self.db.users.find_one(
                    {"id": doc["recipient_id"]},
                    {"_id": 0, "full_name": 1}
                )
                recipient_name = user.get("full_name", "") if user else ""
        
        status_config = get_split_status_config(doc.get("status", ""))
        role_config = {
            "sale": "Nhân viên Sale",
            "leader": "Trưởng nhóm",
            "company": "Công ty",
            "affiliate": "Affiliate",
        }
        
        return CommissionSplitResponse(
            id=doc.get("id", ""),
            code=doc.get("code", ""),
            commission_id=doc.get("commission_id", ""),
            commission_code=commission_code,
            contract_id=doc.get("contract_id", ""),
            contract_code=contract_code,
            recipient_id=doc.get("recipient_id", ""),
            recipient_name=recipient_name,
            recipient_role=doc.get("recipient_role", ""),
            recipient_role_label=role_config.get(doc.get("recipient_role", ""), ""),
            split_percent=doc.get("split_percent", 0),
            gross_amount=doc.get("gross_amount", 0),
            tax_rate=doc.get("tax_rate", 0),
            tax_amount=doc.get("tax_amount", 0),
            net_amount=doc.get("net_amount", 0),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            payout_id=doc.get("payout_id"),
            paid_at=doc.get("paid_at"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 5. RECEIVABLE - Công nợ chủ đầu tư
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_receivable(
        self,
        commission_id: str
    ) -> Optional[ReceivableResponse]:
        """
        Tạo công nợ từ commission
        TRIGGER: commission_created
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Check existing
        existing = await self.db.receivables.find_one({
            "commission_id": commission_id
        })
        if existing:
            return await self._enrich_receivable(existing)
        
        # Get commission
        commission = await self.db.finance_commissions.find_one(
            {"id": commission_id},
            {"_id": 0}
        )
        if not commission:
            return None
        
        code = await self._generate_code("RCV")
        
        # Calculate amount with VAT
        total_commission = commission.get("total_commission", 0)
        vat_amount = total_commission * TaxConfig.VAT_RATE / 100
        amount_due = total_commission + vat_amount
        
        doc = {
            "id": str(uuid.uuid4()),
            "code": code,
            "commission_id": commission_id,
            "contract_id": commission.get("contract_id"),
            "developer_id": commission.get("developer_id"),
            "amount_due": amount_due,
            "amount_paid": 0,
            "amount_remaining": amount_due,
            "due_date": None,  # Can be set by accountant
            "days_overdue": 0,
            "status": ReceivableStatus.PENDING.value,
            "confirmed_by": None,
            "confirmed_at": None,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.receivables.insert_one(doc)
        return await self._enrich_receivable(doc)
    
    async def confirm_receivable(
        self,
        receivable_id: str,
        confirmed_by: str,
        due_date: Optional[str] = None
    ) -> Optional[ReceivableResponse]:
        """Kế toán xác nhận công nợ"""
        now = datetime.now(timezone.utc).isoformat()
        
        updates = {
            "status": ReceivableStatus.CONFIRMED.value,
            "confirmed_by": confirmed_by,
            "confirmed_at": now,
            "updated_at": now,
        }
        
        if due_date:
            updates["due_date"] = due_date
        
        result = await self.db.receivables.find_one_and_update(
            {"id": receivable_id},
            {"$set": updates},
            return_document=True
        )
        
        if not result:
            return None
        
        return await self._enrich_receivable(result)
    
    async def record_receivable_payment(
        self,
        receivable_id: str,
        data: ReceivablePaymentRequest,
        recorded_by: str
    ) -> Optional[ReceivableResponse]:
        """
        Ghi nhận thanh toán từ chủ đầu tư
        Kế toán xác nhận tiền đã về
        """
        now = datetime.now(timezone.utc).isoformat()
        
        receivable = await self.db.receivables.find_one(
            {"id": receivable_id},
            {"_id": 0}
        )
        if not receivable:
            return None
        
        new_paid = receivable.get("amount_paid", 0) + data.amount
        amount_due = receivable.get("amount_due", 0)
        new_remaining = amount_due - new_paid
        
        # Determine status
        if new_remaining <= 0:
            new_status = ReceivableStatus.PAID.value
            new_remaining = 0
        elif new_paid > 0:
            new_status = ReceivableStatus.PARTIAL.value
        else:
            new_status = receivable.get("status", ReceivableStatus.CONFIRMED.value)
        
        result = await self.db.receivables.find_one_and_update(
            {"id": receivable_id},
            {"$set": {
                "amount_paid": new_paid,
                "amount_remaining": new_remaining,
                "status": new_status,
                "updated_at": now,
            }},
            return_document=True
        )
        
        # Record payment history
        await self.db.receivable_payments.insert_one({
            "id": str(uuid.uuid4()),
            "receivable_id": receivable_id,
            "amount": data.amount,
            "payment_date": data.payment_date or now,
            "payment_reference": data.payment_reference,
            "recorded_by": recorded_by,
            "recorded_at": now,
            "notes": data.notes,
        })
        
        # If fully paid, auto-create payouts
        if new_status == ReceivableStatus.PAID.value:
            await self._create_payouts_from_receivable(receivable_id)
        
        return await self._enrich_receivable(result)
    
    async def list_receivables(
        self,
        status: Optional[str] = None,
        developer_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[ReceivableResponse]:
        """List receivables"""
        query = {}
        if status:
            query["status"] = status
        if developer_id:
            query["developer_id"] = developer_id
        
        docs = await self.db.receivables.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_receivable(d) for d in docs]
    
    async def _enrich_receivable(self, doc: dict) -> ReceivableResponse:
        """Enrich receivable"""
        commission_code = ""
        contract_code = ""
        developer_name = ""
        confirmed_by_name = ""
        
        if doc.get("commission_id"):
            comm = await self.db.finance_commissions.find_one(
                {"id": doc["commission_id"]},
                {"_id": 0, "code": 1}
            )
            commission_code = comm.get("code", "") if comm else ""
        
        if doc.get("contract_id"):
            contract = await self.db.contracts.find_one(
                {"id": doc["contract_id"]},
                {"_id": 0, "contract_code": 1}
            )
            contract_code = contract.get("contract_code", "") if contract else ""
        
        if doc.get("developer_id"):
            developer = await self.db.developers.find_one(
                {"id": doc["developer_id"]},
                {"_id": 0, "name": 1}
            )
            developer_name = developer.get("name", "") if developer else ""
        
        if doc.get("confirmed_by"):
            user = await self.db.users.find_one(
                {"id": doc["confirmed_by"]},
                {"_id": 0, "full_name": 1}
            )
            confirmed_by_name = user.get("full_name", "") if user else ""
        
        status_config = get_receivable_status_config(doc.get("status", ""))
        
        return ReceivableResponse(
            id=doc.get("id", ""),
            code=doc.get("code", ""),
            commission_id=doc.get("commission_id", ""),
            commission_code=commission_code,
            contract_id=doc.get("contract_id", ""),
            contract_code=contract_code,
            developer_id=doc.get("developer_id", ""),
            developer_name=developer_name,
            amount_due=doc.get("amount_due", 0),
            amount_paid=doc.get("amount_paid", 0),
            amount_remaining=doc.get("amount_remaining", 0),
            due_date=doc.get("due_date"),
            days_overdue=doc.get("days_overdue", 0),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            confirmed_by=doc.get("confirmed_by"),
            confirmed_by_name=confirmed_by_name,
            confirmed_at=doc.get("confirmed_at"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 6. INVOICE - Hóa đơn VAT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_invoice(
        self,
        data: InvoiceCreate,
        issued_by: str
    ) -> Optional[InvoiceResponse]:
        """
        Tạo hóa đơn VAT xuất cho chủ đầu tư
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Get commission
        commission = await self.db.finance_commissions.find_one(
            {"id": data.commission_id},
            {"_id": 0}
        )
        if not commission:
            return None
        
        # Check existing
        existing = await self.db.finance_invoices.find_one({
            "commission_id": data.commission_id
        })
        if existing:
            return await self._enrich_invoice(existing)
        
        # Get developer info
        developer_info = {
            "name": "",
            "address": "",
            "tax_code": "",
        }
        if commission.get("developer_id"):
            developer = await self.db.developers.find_one(
                {"id": commission["developer_id"]},
                {"_id": 0, "name": 1, "address": 1, "tax_code": 1}
            )
            if developer:
                developer_info = {
                    "name": developer.get("name", ""),
                    "address": developer.get("address", ""),
                    "tax_code": developer.get("tax_code", ""),
                }
        
        # Get receivable
        receivable = await self.db.receivables.find_one(
            {"commission_id": data.commission_id},
            {"_id": 0, "id": 1}
        )
        
        # Calculate
        subtotal = commission.get("total_commission", 0)
        vat_rate = TaxConfig.VAT_RATE
        vat_amount = subtotal * vat_rate / 100
        total_amount = subtotal + vat_amount
        
        invoice_no = await self._generate_code("INV")
        
        doc = {
            "id": str(uuid.uuid4()),
            "invoice_no": invoice_no,
            "commission_id": data.commission_id,
            "contract_id": commission.get("contract_id"),
            "receivable_id": receivable.get("id") if receivable else None,
            "developer_id": commission.get("developer_id"),
            "developer_name": developer_info["name"],
            "developer_address": developer_info["address"],
            "developer_tax_code": developer_info["tax_code"],
            "subtotal": subtotal,
            "vat_rate": vat_rate,
            "vat_amount": vat_amount,
            "total_amount": total_amount,
            "invoice_date": data.invoice_date or now,
            "description": "Phí môi giới BĐS theo hợp đồng",
            "status": InvoiceStatus.ISSUED.value,
            "issued_by": issued_by,
            "issued_at": now,
            "created_at": now,
            "updated_at": now,
            "notes": data.notes,
        }
        
        await self.db.finance_invoices.insert_one(doc)
        
        # Create VAT tax record
        await self._create_tax_record(
            tax_type=TaxType.VAT_OUTPUT,
            taxable_amount=subtotal,
            tax_rate=vat_rate,
            tax_amount=vat_amount,
            invoice_id=doc["id"],
        )
        
        return await self._enrich_invoice(doc)
    
    async def list_invoices(
        self,
        status: Optional[str] = None,
        developer_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[InvoiceResponse]:
        """List invoices"""
        query = {}
        if status:
            query["status"] = status
        if developer_id:
            query["developer_id"] = developer_id
        
        docs = await self.db.finance_invoices.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_invoice(d) for d in docs]
    
    async def _enrich_invoice(self, doc: dict) -> InvoiceResponse:
        """Enrich invoice"""
        commission_code = ""
        contract_code = ""
        issued_by_name = ""
        
        if doc.get("commission_id"):
            comm = await self.db.finance_commissions.find_one(
                {"id": doc["commission_id"]},
                {"_id": 0, "code": 1}
            )
            commission_code = comm.get("code", "") if comm else ""
        
        if doc.get("contract_id"):
            contract = await self.db.contracts.find_one(
                {"id": doc["contract_id"]},
                {"_id": 0, "contract_code": 1}
            )
            contract_code = contract.get("contract_code", "") if contract else ""
        
        if doc.get("issued_by"):
            user = await self.db.users.find_one(
                {"id": doc["issued_by"]},
                {"_id": 0, "full_name": 1}
            )
            issued_by_name = user.get("full_name", "") if user else ""
        
        status_config = get_invoice_status_config(doc.get("status", ""))
        
        return InvoiceResponse(
            id=doc.get("id", ""),
            invoice_no=doc.get("invoice_no", ""),
            commission_id=doc.get("commission_id", ""),
            commission_code=commission_code,
            contract_id=doc.get("contract_id", ""),
            contract_code=contract_code,
            receivable_id=doc.get("receivable_id"),
            developer_id=doc.get("developer_id", ""),
            developer_name=doc.get("developer_name", ""),
            developer_address=doc.get("developer_address", ""),
            developer_tax_code=doc.get("developer_tax_code", ""),
            subtotal=doc.get("subtotal", 0),
            vat_rate=doc.get("vat_rate", 10),
            vat_amount=doc.get("vat_amount", 0),
            total_amount=doc.get("total_amount", 0),
            invoice_date=doc.get("invoice_date", ""),
            description=doc.get("description", ""),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            issued_by=doc.get("issued_by"),
            issued_by_name=issued_by_name,
            issued_at=doc.get("issued_at"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 7. TAX RECORDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _create_tax_record(
        self,
        tax_type: TaxType,
        taxable_amount: float,
        tax_rate: float,
        tax_amount: float,
        commission_split_id: Optional[str] = None,
        invoice_id: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> str:
        """Internal: Create tax record"""
        now = datetime.now(timezone.utc)
        
        doc = {
            "id": str(uuid.uuid4()),
            "tax_type": tax_type.value,
            "period_month": now.month,
            "period_year": now.year,
            "taxable_amount": taxable_amount,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "commission_split_id": commission_split_id,
            "invoice_id": invoice_id,
            "user_id": user_id,
            "created_at": now.isoformat(),
        }
        
        await self.db.tax_records.insert_one(doc)
        return doc["id"]
    
    async def get_tax_summary(
        self,
        period_month: int,
        period_year: int
    ) -> Dict[str, Any]:
        """Lấy tổng hợp thuế theo kỳ"""
        pipeline = [
            {
                "$match": {
                    "period_month": period_month,
                    "period_year": period_year
                }
            },
            {
                "$group": {
                    "_id": "$tax_type",
                    "total_taxable": {"$sum": "$taxable_amount"},
                    "total_tax": {"$sum": "$tax_amount"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        results = await self.db.tax_records.aggregate(pipeline).to_list(10)
        
        summary = {
            "period_month": period_month,
            "period_year": period_year,
            "period_label": f"Tháng {period_month}/{period_year}",
            "vat_output": 0,
            "tncn_total": 0,
            "tndn_estimate": 0,
        }
        
        for r in results:
            if r["_id"] == TaxType.VAT_OUTPUT.value:
                summary["vat_output"] = r["total_tax"]
            elif r["_id"] == TaxType.TNCN.value:
                summary["tncn_total"] = r["total_tax"]
        
        return summary
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 8. PAYOUT - Chi trả
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _create_payouts_from_receivable(
        self,
        receivable_id: str
    ) -> List[PayoutResponse]:
        """
        Auto tạo payouts khi receivable được thanh toán đủ
        TRIGGER: receivable paid
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Get receivable
        receivable = await self.db.receivables.find_one(
            {"id": receivable_id},
            {"_id": 0, "commission_id": 1}
        )
        if not receivable:
            return []
        
        # Get commission splits
        splits = await self.db.commission_splits.find(
            {
                "commission_id": receivable["commission_id"],
                "recipient_id": {"$ne": "company"},  # Company không cần payout
                "status": CommissionSplitStatus.CALCULATED.value
            },
            {"_id": 0}
        ).to_list(100)
        
        results = []
        
        for split in splits:
            # Check existing payout
            existing = await self.db.payouts.find_one({
                "commission_split_id": split["id"]
            })
            if existing:
                continue
            
            code = await self._generate_code("PAY")
            
            # Get bank info
            bank_info = {"account": None, "name": None}
            if split.get("recipient_id"):
                user = await self.db.users.find_one(
                    {"id": split["recipient_id"]},
                    {"_id": 0, "bank_account": 1, "bank_name": 1}
                )
                if user:
                    bank_info = {
                        "account": user.get("bank_account"),
                        "name": user.get("bank_name"),
                    }
            
            doc = {
                "id": str(uuid.uuid4()),
                "code": code,
                "commission_split_id": split["id"],
                "recipient_id": split.get("recipient_id"),
                "recipient_role": split.get("recipient_role"),
                "gross_amount": split.get("gross_amount", 0),
                "tax_amount": split.get("tax_amount", 0),
                "net_amount": split.get("net_amount", 0),
                "bank_account": bank_info["account"],
                "bank_name": bank_info["name"],
                "status": PayoutStatus.PENDING.value,
                "approved_by": None,
                "approved_at": None,
                "paid_at": None,
                "payment_reference": None,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.payouts.insert_one(doc)
            
            # Update split status
            await self.db.commission_splits.update_one(
                {"id": split["id"]},
                {"$set": {
                    "status": CommissionSplitStatus.PENDING_PAYOUT.value,
                    "payout_id": doc["id"],
                    "updated_at": now
                }}
            )
            
            results.append(await self._enrich_payout(doc))
        
        return results
    
    async def approve_payout(
        self,
        payout_id: str,
        approved_by: str,
        notes: Optional[str] = None
    ) -> Optional[PayoutResponse]:
        """
        Kế toán duyệt payout
        HARD RULE: Không có kế toán duyệt → không được trả tiền
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.db.payouts.find_one_and_update(
            {"id": payout_id, "status": PayoutStatus.PENDING.value},
            {"$set": {
                "status": PayoutStatus.APPROVED.value,
                "approved_by": approved_by,
                "approved_at": now,
                "updated_at": now,
            }},
            return_document=True
        )
        
        if not result:
            return None
        
        return await self._enrich_payout(result)
    
    async def mark_payout_paid(
        self,
        payout_id: str,
        data: PayoutMarkPaidRequest,
        paid_by: str
    ) -> Optional[PayoutResponse]:
        """
        Đánh dấu đã chi trả
        CHỈ được thực hiện sau khi đã duyệt
        """
        now = datetime.now(timezone.utc).isoformat()
        
        result = await self.db.payouts.find_one_and_update(
            {"id": payout_id, "status": PayoutStatus.APPROVED.value},
            {"$set": {
                "status": PayoutStatus.PAID.value,
                "paid_at": data.paid_at or now,
                "payment_reference": data.payment_reference,
                "updated_at": now,
            }},
            return_document=True
        )
        
        if not result:
            return None
        
        # Update split status
        if result.get("commission_split_id"):
            await self.db.commission_splits.update_one(
                {"id": result["commission_split_id"]},
                {"$set": {
                    "status": CommissionSplitStatus.PAID.value,
                    "paid_at": data.paid_at or now,
                    "updated_at": now
                }}
            )
        
        return await self._enrich_payout(result)
    
    async def list_payouts(
        self,
        status: Optional[str] = None,
        recipient_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[PayoutResponse]:
        """List payouts"""
        query = {}
        if status:
            query["status"] = status
        if recipient_id:
            query["recipient_id"] = recipient_id
        
        docs = await self.db.payouts.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_payout(d) for d in docs]
    
    async def _enrich_payout(self, doc: dict) -> PayoutResponse:
        """Enrich payout"""
        split_code = ""
        recipient_name = ""
        approved_by_name = ""
        
        if doc.get("commission_split_id"):
            split = await self.db.commission_splits.find_one(
                {"id": doc["commission_split_id"]},
                {"_id": 0, "code": 1}
            )
            split_code = split.get("code", "") if split else ""
        
        if doc.get("recipient_id"):
            user = await self.db.users.find_one(
                {"id": doc["recipient_id"]},
                {"_id": 0, "full_name": 1}
            )
            recipient_name = user.get("full_name", "") if user else ""
        
        if doc.get("approved_by"):
            user = await self.db.users.find_one(
                {"id": doc["approved_by"]},
                {"_id": 0, "full_name": 1}
            )
            approved_by_name = user.get("full_name", "") if user else ""
        
        status_config = get_payout_status_config(doc.get("status", ""))
        
        return PayoutResponse(
            id=doc.get("id", ""),
            code=doc.get("code", ""),
            commission_split_id=doc.get("commission_split_id", ""),
            commission_split_code=split_code,
            recipient_id=doc.get("recipient_id", ""),
            recipient_name=recipient_name,
            recipient_role=doc.get("recipient_role", ""),
            gross_amount=doc.get("gross_amount", 0),
            tax_amount=doc.get("tax_amount", 0),
            net_amount=doc.get("net_amount", 0),
            bank_account=doc.get("bank_account"),
            bank_name=doc.get("bank_name"),
            status=doc.get("status", ""),
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            approved_by=doc.get("approved_by"),
            approved_by_name=approved_by_name,
            approved_at=doc.get("approved_at"),
            paid_at=doc.get("paid_at"),
            payment_reference=doc.get("payment_reference"),
            created_at=doc.get("created_at", ""),
            updated_at=doc.get("updated_at"),
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 9. DASHBOARDS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_ceo_dashboard(
        self,
        period_month: Optional[int] = None,
        period_year: Optional[int] = None
    ) -> CEODashboardResponse:
        """Dashboard cho CEO"""
        now = datetime.now(timezone.utc)
        if not period_month:
            period_month = now.month
        if not period_year:
            period_year = now.year
        
        # Build date range
        start_date = f"{period_year}-{period_month:02d}-01T00:00:00"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01T00:00:00"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01T00:00:00"
        
        # Aggregate commissions
        comm_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_contract_value": {"$sum": "$contract_value"},
                    "total_commission": {"$sum": "$total_commission"},
                }
            }
        ]
        
        comm_result = await self.db.finance_commissions.aggregate(comm_pipeline).to_list(1)
        comm_data = comm_result[0] if comm_result else {}
        
        # Aggregate receivables
        recv_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "amount": {"$sum": "$amount_due"},
                    "paid": {"$sum": "$amount_paid"},
                }
            }
        ]
        
        recv_results = await self.db.receivables.aggregate(recv_pipeline).to_list(10)
        
        receivable_total = sum(r.get("amount", 0) for r in recv_results)
        receivable_paid = sum(r.get("paid", 0) for r in recv_results)
        receivable_overdue = sum(
            r.get("amount", 0) - r.get("paid", 0)
            for r in recv_results
            if r["_id"] == ReceivableStatus.OVERDUE.value
        )
        
        # Get tax summary
        tax_summary = await self.get_tax_summary(period_month, period_year)
        
        total_commission = comm_data.get("total_commission", 0)
        vat_output = tax_summary.get("vat_output", 0)
        
        return CEODashboardResponse(
            total_contract_value=comm_data.get("total_contract_value", 0),
            total_commission=total_commission,
            total_revenue=total_commission + vat_output,
            receivable_total=receivable_total,
            receivable_paid=receivable_paid,
            receivable_pending=receivable_total - receivable_paid,
            receivable_overdue=receivable_overdue,
            vat_output=vat_output,
            tndn_estimate=total_commission * TaxConfig.TNDN_RATE / 100,
            period_month=period_month,
            period_year=period_year,
            period_label=f"Tháng {period_month}/{period_year}",
        )
    
    async def get_sale_dashboard(
        self,
        user_id: str,
        period_month: Optional[int] = None,
        period_year: Optional[int] = None
    ) -> SaleDashboardResponse:
        """Dashboard cho Sale"""
        now = datetime.now(timezone.utc)
        if not period_month:
            period_month = now.month
        if not period_year:
            period_year = now.year
        
        # Build date range
        start_date = f"{period_year}-{period_month:02d}-01T00:00:00"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01T00:00:00"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01T00:00:00"
        
        # Get user name
        user = await self.db.users.find_one(
            {"id": user_id},
            {"_id": 0, "full_name": 1}
        )
        user_name = user.get("full_name", "") if user else ""
        
        # Aggregate splits
        pipeline = [
            {
                "$match": {
                    "recipient_id": user_id,
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "gross": {"$sum": "$gross_amount"},
                    "tax": {"$sum": "$tax_amount"},
                    "net": {"$sum": "$net_amount"},
                }
            }
        ]
        
        results = await self.db.commission_splits.aggregate(pipeline).to_list(10)
        
        total_gross = 0
        total_tax = 0
        total_net = 0
        pending_amount = 0
        approved_amount = 0
        paid_amount = 0
        
        for r in results:
            total_gross += r.get("gross", 0)
            total_tax += r.get("tax", 0)
            total_net += r.get("net", 0)
            
            if r["_id"] in [CommissionSplitStatus.CALCULATED.value, CommissionSplitStatus.PENDING_PAYOUT.value]:
                pending_amount += r.get("net", 0)
            elif r["_id"] == CommissionSplitStatus.PAID.value:
                paid_amount += r.get("net", 0)
        
        # Get approved but not paid
        approved_payouts = await self.db.payouts.aggregate([
            {
                "$match": {
                    "recipient_id": user_id,
                    "status": PayoutStatus.APPROVED.value,
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": "$net_amount"}
                }
            }
        ]).to_list(1)
        
        approved_amount = approved_payouts[0].get("total", 0) if approved_payouts else 0
        
        return SaleDashboardResponse(
            user_id=user_id,
            user_name=user_name,
            total_gross=total_gross,
            total_tax=total_tax,
            total_net=total_net,
            pending_amount=pending_amount,
            approved_amount=approved_amount,
            paid_amount=paid_amount,
            period_month=period_month,
            period_year=period_year,
            period_label=f"Tháng {period_month}/{period_year}",
        )
