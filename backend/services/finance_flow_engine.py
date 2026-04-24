"""
ProHouzing Auto Financial Flow Engine
Event-driven automation for financial operations

Events:
1. contract_signed → create payment schedule
2. payment_received_from_developer → update payment + create commission
3. commission_created → auto split + create receivable
4. commission_split → create payout (pending)
5. accountant_approve → payout = paid

HARD RULES:
- Không cho tạo commission manual
- Không cho tạo payout manual  
- Track full history
- Scale 1000+ deals
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from enum import Enum
import logging
import uuid

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class FinanceEvent(str, Enum):
    """Finance Events"""
    CONTRACT_SIGNED = "contract_signed"
    PAYMENT_RECEIVED = "payment_received_from_developer"
    COMMISSION_CREATED = "commission_created"
    COMMISSION_SPLIT = "commission_split"
    PAYOUT_READY = "payout_ready"
    PAYOUT_APPROVED = "payout_approved"
    PAYOUT_PAID = "payout_paid"
    
    # Alerts
    RECEIVABLE_OVERDUE = "receivable_overdue"
    PAYOUT_PENDING_TOO_LONG = "payout_pending_too_long"
    COMMISSION_NOT_SPLIT = "commission_not_split"


class FinanceFlowEngine:
    """
    Auto Financial Flow Engine
    Event-driven, không phụ thuộc nhập tay
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    # ═══════════════════════════════════════════════════════════════════════════
    # EVENT HANDLERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def handle_event(
        self,
        event_type: str,
        payload: Dict[str, Any],
        triggered_by: str = "system"
    ) -> Dict[str, Any]:
        """
        Main event handler - route to specific handler
        """
        result = {
            "event_type": event_type,
            "success": False,
            "actions": [],
            "errors": [],
        }
        
        try:
            if event_type == FinanceEvent.CONTRACT_SIGNED.value:
                result = await self._handle_contract_signed(payload, triggered_by)
            
            elif event_type == FinanceEvent.PAYMENT_RECEIVED.value:
                result = await self._handle_payment_received(payload, triggered_by)
            
            elif event_type == FinanceEvent.COMMISSION_CREATED.value:
                result = await self._handle_commission_created(payload, triggered_by)
            
            elif event_type == FinanceEvent.PAYOUT_APPROVED.value:
                result = await self._handle_payout_approved(payload, triggered_by)
            
            else:
                result["errors"].append(f"Unknown event type: {event_type}")
            
            # Log event
            await self._log_event(event_type, payload, result, triggered_by)
            
        except Exception as e:
            logger.error(f"Finance event error: {e}")
            result["errors"].append(str(e))
            await self._log_event(event_type, payload, result, triggered_by)
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 1. CONTRACT SIGNED → Create Payment Schedule
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _handle_contract_signed(
        self,
        payload: Dict[str, Any],
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Khi contract được ký:
        1. Tạo payment schedule từ contract
        2. Track history
        """
        result = {
            "event_type": FinanceEvent.CONTRACT_SIGNED.value,
            "success": False,
            "actions": [],
            "errors": [],
            "data": {},
        }
        
        contract_id = payload.get("contract_id")
        if not contract_id:
            result["errors"].append("Missing contract_id")
            return result
        
        # Get contract
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        
        if not contract:
            result["errors"].append(f"Contract {contract_id} not found")
            return result
        
        # Check if already processed (idempotency)
        existing = await self.db.payment_trackings.find_one({
            "contract_id": contract_id
        })
        
        if existing:
            result["actions"].append("Payment schedule already exists")
            result["success"] = True
            return result
        
        # Get payment schedule from contract
        payment_schedule = contract.get("payment_schedule", [])
        
        if not payment_schedule:
            # Create default schedule based on contract value
            contract_value = contract.get("grand_total") or contract.get("contract_value", 0)
            payment_schedule = self._generate_default_schedule(contract_value)
        
        # Create payment tracking records
        now = datetime.now(timezone.utc).isoformat()
        created_count = 0
        
        for item in payment_schedule:
            installment_number = item.get("installment_number", created_count + 1)
            
            doc = {
                "id": str(uuid.uuid4()),
                "contract_id": contract_id,
                "installment_name": item.get("installment_name", f"Đợt {installment_number}"),
                "installment_number": installment_number,
                "amount": item.get("amount", 0),
                "due_date": item.get("due_date") or (datetime.now(timezone.utc) + timedelta(days=30 * installment_number)).isoformat(),
                "status": "pending",
                "paid_date": None,
                "days_overdue": 0,
                "notes": item.get("notes"),
                # Tracking
                "source_event": FinanceEvent.CONTRACT_SIGNED.value,
                "source_contract_id": contract_id,
                "created_by": triggered_by,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.payment_trackings.insert_one(doc)
            created_count += 1
        
        result["success"] = True
        result["actions"].append(f"Created {created_count} payment installments")
        result["data"]["payment_count"] = created_count
        result["data"]["contract_id"] = contract_id
        
        return result
    
    def _generate_default_schedule(self, contract_value: float) -> List[Dict]:
        """Generate default 3-phase payment schedule"""
        return [
            {
                "installment_number": 1,
                "installment_name": "Đợt 1 - Đặt cọc",
                "amount": contract_value * 0.1,  # 10%
                "due_date": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            },
            {
                "installment_number": 2,
                "installment_name": "Đợt 2 - Ký HĐMB",
                "amount": contract_value * 0.4,  # 40%
                "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            },
            {
                "installment_number": 3,
                "installment_name": "Đợt 3 - Bàn giao",
                "amount": contract_value * 0.5,  # 50%
                "due_date": (datetime.now(timezone.utc) + timedelta(days=90)).isoformat(),
            },
        ]
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 2. PAYMENT RECEIVED → Update Payment + Create Commission
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _handle_payment_received(
        self,
        payload: Dict[str, Any],
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Khi chủ đầu tư trả tiền:
        1. Update payment status
        2. Update receivable
        3. Check nếu đủ điều kiện → Create commission
        """
        result = {
            "event_type": FinanceEvent.PAYMENT_RECEIVED.value,
            "success": False,
            "actions": [],
            "errors": [],
            "data": {},
        }
        
        contract_id = payload.get("contract_id")
        amount = payload.get("amount", 0)
        receivable_id = payload.get("receivable_id")
        payment_reference = payload.get("payment_reference")
        
        if not contract_id:
            result["errors"].append("Missing contract_id")
            return result
        
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Update receivable if provided
        if receivable_id:
            receivable = await self.db.receivables.find_one({"id": receivable_id})
            if receivable:
                new_paid = receivable.get("amount_paid", 0) + amount
                amount_due = receivable.get("amount_due", 0)
                new_remaining = amount_due - new_paid
                
                new_status = "paid" if new_remaining <= 0 else "partial" if new_paid > 0 else "confirmed"
                
                await self.db.receivables.update_one(
                    {"id": receivable_id},
                    {"$set": {
                        "amount_paid": new_paid,
                        "amount_remaining": max(0, new_remaining),
                        "status": new_status,
                        "updated_at": now,
                    }}
                )
                
                result["actions"].append(f"Updated receivable {receivable_id}: {new_status}")
                
                # If fully paid, trigger payout creation
                if new_status == "paid":
                    await self._create_payouts_from_receivable(receivable_id, triggered_by)
                    result["actions"].append("Triggered payout creation")
        
        # 2. Record payment history
        await self.db.receivable_payments.insert_one({
            "id": str(uuid.uuid4()),
            "receivable_id": receivable_id,
            "contract_id": contract_id,
            "amount": amount,
            "payment_date": now,
            "payment_reference": payment_reference,
            "source_event": FinanceEvent.PAYMENT_RECEIVED.value,
            "recorded_by": triggered_by,
            "recorded_at": now,
        })
        
        result["success"] = True
        result["data"]["contract_id"] = contract_id
        result["data"]["amount"] = amount
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 3. COMMISSION CREATED → Auto Split + Create Receivable
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _handle_commission_created(
        self,
        payload: Dict[str, Any],
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Khi commission được tạo:
        1. Auto split commission (Sale 60%, Leader 10%, Company 25%, Affiliate 5%)
        2. Create receivable
        3. Trigger next event
        """
        result = {
            "event_type": FinanceEvent.COMMISSION_CREATED.value,
            "success": False,
            "actions": [],
            "errors": [],
            "data": {},
        }
        
        commission_id = payload.get("commission_id")
        
        if not commission_id:
            result["errors"].append("Missing commission_id")
            return result
        
        # Get commission
        commission = await self.db.finance_commissions.find_one(
            {"id": commission_id},
            {"_id": 0}
        )
        
        if not commission:
            result["errors"].append(f"Commission {commission_id} not found")
            return result
        
        # Check if already split (idempotency)
        existing_splits = await self.db.commission_splits.count_documents({
            "commission_id": commission_id
        })
        
        if existing_splits > 0:
            result["actions"].append("Commission already split")
            result["success"] = True
            return result
        
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Split commission
        total = commission.get("total_commission", 0)
        has_affiliate = commission.get("has_affiliate", False)
        
        # Calculate splits
        splits = self._calculate_splits(total, has_affiliate)
        
        split_configs = [
            ("sale", commission.get("sale_id"), splits["sale"], 10.0),
            ("leader", commission.get("leader_id"), splits["leader"], 10.0),
            ("company", "company", splits["company"], 0),
        ]
        
        if has_affiliate and commission.get("ref_id"):
            split_configs.append(
                ("affiliate", commission.get("ref_id"), splits["affiliate"], 10.0)
            )
        
        created_splits = []
        
        for role, recipient_id, gross_amount, tax_rate in split_configs:
            if not recipient_id or gross_amount <= 0:
                continue
            
            tax_amount = gross_amount * tax_rate / 100
            net_amount = gross_amount - tax_amount
            
            # Generate code
            code = await self._generate_code("CS")
            
            split_doc = {
                "id": str(uuid.uuid4()),
                "code": code,
                "commission_id": commission_id,
                "contract_id": commission.get("contract_id"),
                "recipient_id": recipient_id,
                "recipient_role": role,
                "split_percent": splits.get(f"{role}_percent", 0),
                "gross_amount": gross_amount,
                "tax_rate": tax_rate,
                "tax_amount": tax_amount,
                "net_amount": net_amount,
                "status": "calculated",
                "payout_id": None,
                "paid_at": None,
                # Tracking
                "source_event": FinanceEvent.COMMISSION_CREATED.value,
                "source_commission_id": commission_id,
                "created_by": triggered_by,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.commission_splits.insert_one(split_doc)
            created_splits.append(split_doc)
            
            # Create tax record for TNCN
            if tax_rate > 0 and recipient_id != "company":
                await self._create_tax_record("tncn", gross_amount, tax_rate, tax_amount, split_doc["id"], recipient_id)
        
        result["actions"].append(f"Created {len(created_splits)} commission splits")
        
        # 2. Create receivable (công nợ chủ đầu tư)
        receivable_code = await self._generate_code("RCV")
        vat_rate = 10.0
        vat_amount = total * vat_rate / 100
        amount_due = total + vat_amount
        
        receivable_doc = {
            "id": str(uuid.uuid4()),
            "code": receivable_code,
            "commission_id": commission_id,
            "contract_id": commission.get("contract_id"),
            "developer_id": commission.get("developer_id"),
            "amount_due": amount_due,
            "amount_paid": 0,
            "amount_remaining": amount_due,
            "due_date": None,
            "days_overdue": 0,
            "status": "pending",
            # Tracking
            "source_event": FinanceEvent.COMMISSION_CREATED.value,
            "source_commission_id": commission_id,
            "created_by": triggered_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.receivables.insert_one(receivable_doc)
        result["actions"].append(f"Created receivable {receivable_code}")
        
        # 3. Create VAT tax record
        await self._create_tax_record("vat_output", total, vat_rate, vat_amount, None, None, receivable_doc["id"])
        
        # 4. Update commission status
        await self.db.finance_commissions.update_one(
            {"id": commission_id},
            {"$set": {
                "status": "split",
                "updated_at": now,
            }}
        )
        
        result["success"] = True
        result["data"]["commission_id"] = commission_id
        result["data"]["splits_count"] = len(created_splits)
        result["data"]["receivable_id"] = receivable_doc["id"]
        
        return result
    
    def _calculate_splits(self, total: float, has_affiliate: bool) -> Dict[str, float]:
        """Calculate commission splits"""
        if has_affiliate:
            return {
                "sale": total * 0.60,
                "sale_percent": 60.0,
                "leader": total * 0.10,
                "leader_percent": 10.0,
                "company": total * 0.25,
                "company_percent": 25.0,
                "affiliate": total * 0.05,
                "affiliate_percent": 5.0,
            }
        else:
            return {
                "sale": total * 0.60,
                "sale_percent": 60.0,
                "leader": total * 0.10,
                "leader_percent": 10.0,
                "company": total * 0.30,  # 25% + 5% affiliate
                "company_percent": 30.0,
                "affiliate": 0,
                "affiliate_percent": 0,
            }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 4. CREATE PAYOUTS (After receivable paid)
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _create_payouts_from_receivable(
        self,
        receivable_id: str,
        triggered_by: str
    ) -> List[str]:
        """
        Tự động tạo payouts khi receivable được thanh toán đủ
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Get receivable
        receivable = await self.db.receivables.find_one(
            {"id": receivable_id},
            {"_id": 0, "commission_id": 1}
        )
        
        if not receivable:
            return []
        
        # Get commission splits that don't have payouts yet
        splits = await self.db.commission_splits.find(
            {
                "commission_id": receivable["commission_id"],
                "recipient_id": {"$ne": "company"},  # Company không cần payout
                "payout_id": None,
            },
            {"_id": 0}
        ).to_list(100)
        
        created_payout_ids = []
        
        for split in splits:
            # Check existing payout
            existing = await self.db.payouts.find_one({
                "commission_split_id": split["id"]
            })
            
            if existing:
                continue
            
            payout_code = await self._generate_code("PAY")
            
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
            
            payout_doc = {
                "id": str(uuid.uuid4()),
                "code": payout_code,
                "commission_split_id": split["id"],
                "recipient_id": split.get("recipient_id"),
                "recipient_role": split.get("recipient_role"),
                "gross_amount": split.get("gross_amount", 0),
                "tax_amount": split.get("tax_amount", 0),
                "net_amount": split.get("net_amount", 0),
                "bank_account": bank_info["account"],
                "bank_name": bank_info["name"],
                "status": "pending",  # Chờ kế toán duyệt
                "approved_by": None,
                "approved_at": None,
                "paid_at": None,
                "payment_reference": None,
                # Tracking
                "source_event": FinanceEvent.PAYOUT_READY.value,
                "source_receivable_id": receivable_id,
                "source_commission_split_id": split["id"],
                "created_by": triggered_by,
                "created_at": now,
                "updated_at": now,
            }
            
            await self.db.payouts.insert_one(payout_doc)
            
            # Update split
            await self.db.commission_splits.update_one(
                {"id": split["id"]},
                {"$set": {
                    "status": "pending_payout",
                    "payout_id": payout_doc["id"],
                    "updated_at": now,
                }}
            )
            
            created_payout_ids.append(payout_doc["id"])
        
        return created_payout_ids
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 5. PAYOUT APPROVED → Mark as Paid
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _handle_payout_approved(
        self,
        payload: Dict[str, Any],
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Khi kế toán duyệt payout
        """
        result = {
            "event_type": FinanceEvent.PAYOUT_APPROVED.value,
            "success": False,
            "actions": [],
            "errors": [],
            "data": {},
        }
        
        payout_id = payload.get("payout_id")
        
        if not payout_id:
            result["errors"].append("Missing payout_id")
            return result
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Update payout
        payout = await self.db.payouts.find_one_and_update(
            {"id": payout_id, "status": "pending"},
            {"$set": {
                "status": "approved",
                "approved_by": triggered_by,
                "approved_at": now,
                "updated_at": now,
            }},
            return_document=True
        )
        
        if not payout:
            result["errors"].append(f"Payout {payout_id} not found or not pending")
            return result
        
        result["success"] = True
        result["actions"].append(f"Approved payout {payout_id}")
        result["data"]["payout_id"] = payout_id
        
        return result
    
    # ═══════════════════════════════════════════════════════════════════════════
    # MAIN TRIGGER: Create Commission from Contract
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_commission_from_contract(
        self,
        contract_id: str,
        triggered_by: str
    ) -> Dict[str, Any]:
        """
        Main entry point: Tạo commission từ contract
        Được gọi khi chủ đầu tư xác nhận deal
        
        Flow:
        1. Validate contract
        2. Get project commission rate
        3. Create finance_commission
        4. Trigger commission_created event (auto split + receivable)
        """
        result = {
            "success": False,
            "actions": [],
            "errors": [],
            "data": {},
        }
        
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Check idempotency
        existing = await self.db.finance_commissions.find_one({
            "contract_id": contract_id
        })
        
        if existing:
            # Already processed - return existing data
            result["success"] = True
            result["actions"].append("Commission already exists")
            result["data"]["commission_id"] = existing.get("id")
            return result
        
        # 2. Get contract
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0}
        )
        
        if not contract:
            result["errors"].append(f"Contract {contract_id} not found")
            return result
        
        # 3. Get project commission rate
        project_id = contract.get("project_id")
        commission_rate = await self._get_project_commission_rate(project_id)
        
        if commission_rate <= 0:
            result["errors"].append(f"Project {project_id} chưa cấu hình % hoa hồng. Vui lòng cấu hình trước.")
            return result
        
        # 4. Get deal info
        deal = None
        deal_id = contract.get("deal_id")
        if deal_id:
            deal = await self.db.deals.find_one({"id": deal_id}, {"_id": 0})
        
        # 5. Get sale/leader/affiliate info
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
        
        # 6. Calculate commission
        contract_value = contract.get("grand_total") or contract.get("contract_value", 0)
        total_commission = contract_value * commission_rate / 100
        
        # 7. Get developer from project
        developer_id = None
        project = await self.db.projects_master.find_one(
            {"id": project_id},
            {"_id": 0, "developer_id": 1}
        )
        if project:
            developer_id = project.get("developer_id")
        
        # 8. Create commission record
        commission_code = await self._generate_code("FC")
        
        commission_doc = {
            "id": str(uuid.uuid4()),
            "code": commission_code,
            "contract_id": contract_id,
            "contract_value": contract_value,
            "deal_id": deal_id,
            "project_id": project_id,
            "developer_id": developer_id,
            "customer_id": contract.get("customer_id"),
            "sale_id": sale_id,
            "leader_id": leader_id,
            "ref_id": ref_id,
            "has_affiliate": ref_id is not None,
            "commission_rate": commission_rate,
            "total_commission": total_commission,
            "status": "confirmed",
            # Tracking
            "source_event": "developer_confirm_payment",
            "source_contract_id": contract_id,
            "confirmed_by": triggered_by,
            "confirmed_at": now,
            "created_by": triggered_by,
            "created_at": now,
            "updated_at": now,
        }
        
        await self.db.finance_commissions.insert_one(commission_doc)
        
        result["actions"].append(f"Created commission {commission_code}")
        result["data"]["commission_id"] = commission_doc["id"]
        result["data"]["total_commission"] = total_commission
        
        # 9. Trigger commission_created event (auto split + receivable)
        split_result = await self.handle_event(
            FinanceEvent.COMMISSION_CREATED.value,
            {"commission_id": commission_doc["id"]},
            triggered_by
        )
        
        result["actions"].extend(split_result.get("actions", []))
        result["data"].update(split_result.get("data", {}))
        
        result["success"] = True
        
        return result
    
    async def _get_project_commission_rate(
        self,
        project_id: str
    ) -> float:
        """Get project commission rate"""
        if not project_id:
            return 0
        
        now = datetime.now(timezone.utc).isoformat()
        
        doc = await self.db.project_commissions.find_one(
            {
                "project_id": project_id,
                "is_active": True,
                "effective_from": {"$lte": now},
                "$or": [
                    {"effective_to": None},
                    {"effective_to": {"$gte": now}}
                ]
            },
            {"_id": 0, "commission_rate": 1}
        )
        
        return doc.get("commission_rate", 0) if doc else 0
    
    # ═══════════════════════════════════════════════════════════════════════════
    # ALERTS SYSTEM
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def check_alerts(self) -> Dict[str, Any]:
        """
        Kiểm tra và tạo alerts:
        1. Công nợ quá hạn
        2. Sale chưa được trả tiền (>7 ngày sau khi CĐT trả)
        3. Deal có tiền nhưng chưa chia hoa hồng
        """
        now = datetime.now(timezone.utc)
        now_str = now.isoformat()
        alerts = []
        
        # 1. Công nợ quá hạn
        overdue_receivables = await self.db.receivables.find(
            {
                "status": {"$in": ["pending", "confirmed", "partial"]},
                "due_date": {"$lt": now_str, "$ne": None}
            },
            {"_id": 0, "id": 1, "code": 1, "amount_remaining": 1, "due_date": 1}
        ).to_list(100)
        
        for r in overdue_receivables:
            due = datetime.fromisoformat(r["due_date"].replace("Z", "+00:00"))
            days_overdue = (now - due).days
            
            alerts.append({
                "type": "receivable_overdue",
                "severity": "high" if days_overdue > 30 else "medium",
                "message": f"Công nợ {r['code']} quá hạn {days_overdue} ngày",
                "data": {
                    "receivable_id": r["id"],
                    "amount": r["amount_remaining"],
                    "days_overdue": days_overdue,
                },
            })
            
            # Update days_overdue
            await self.db.receivables.update_one(
                {"id": r["id"]},
                {"$set": {"days_overdue": days_overdue, "status": "overdue"}}
            )
        
        # 2. Sale chưa được trả tiền (pending payout > 7 ngày)
        week_ago = (now - timedelta(days=7)).isoformat()
        
        pending_payouts = await self.db.payouts.find(
            {
                "status": "pending",
                "created_at": {"$lt": week_ago}
            },
            {"_id": 0, "id": 1, "code": 1, "recipient_id": 1, "net_amount": 1, "created_at": 1}
        ).to_list(100)
        
        for p in pending_payouts:
            created = datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
            days_pending = (now - created).days
            
            alerts.append({
                "type": "payout_pending_too_long",
                "severity": "medium",
                "message": f"Payout {p['code']} chờ duyệt {days_pending} ngày",
                "data": {
                    "payout_id": p["id"],
                    "recipient_id": p["recipient_id"],
                    "amount": p["net_amount"],
                    "days_pending": days_pending,
                },
            })
        
        # 3. Commission chưa split
        unsplit_commissions = await self.db.finance_commissions.find(
            {
                "status": {"$in": ["confirmed", "calculated"]},
            },
            {"_id": 0, "id": 1, "code": 1, "total_commission": 1}
        ).to_list(100)
        
        for c in unsplit_commissions:
            split_count = await self.db.commission_splits.count_documents({
                "commission_id": c["id"]
            })
            
            if split_count == 0:
                alerts.append({
                    "type": "commission_not_split",
                    "severity": "high",
                    "message": f"Commission {c['code']} chưa được chia hoa hồng",
                    "data": {
                        "commission_id": c["id"],
                        "amount": c["total_commission"],
                    },
                })
        
        # Store alerts
        for alert in alerts:
            alert["id"] = str(uuid.uuid4())
            alert["created_at"] = now_str
            alert["resolved"] = False
            await self.db.finance_alerts.update_one(
                {
                    "type": alert["type"],
                    "data": alert["data"],
                    "resolved": False,
                },
                {"$setOnInsert": alert},
                upsert=True
            )
        
        return {
            "checked_at": now_str,
            "alerts_count": len(alerts),
            "alerts": alerts,
        }
    
    async def get_active_alerts(self) -> List[Dict]:
        """Get all active (unresolved) alerts"""
        alerts = await self.db.finance_alerts.find(
            {"resolved": False},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return alerts
    
    async def resolve_alert(self, alert_id: str, resolved_by: str) -> bool:
        """Mark alert as resolved"""
        result = await self.db.finance_alerts.update_one(
            {"id": alert_id},
            {"$set": {
                "resolved": True,
                "resolved_by": resolved_by,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
        return result.modified_count > 0
    
    # ═══════════════════════════════════════════════════════════════════════════
    # TIMELINE - Full History Tracking
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_contract_timeline(self, contract_id: str) -> List[Dict]:
        """
        Get full timeline for a contract:
        Contract → Payment → Commission → Split → Receivable → Payout
        """
        timeline = []
        
        # 1. Contract
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0, "id": 1, "contract_code": 1, "status": 1, "created_at": 1, "signed_date": 1}
        )
        
        if contract:
            timeline.append({
                "type": "contract",
                "title": f"Hợp đồng {contract.get('contract_code', '')}",
                "status": contract.get("status", ""),
                "timestamp": contract.get("signed_date") or contract.get("created_at", ""),
                "data": {"contract_id": contract_id},
            })
        
        # 2. Payment Schedule
        payments = await self.db.payment_trackings.find(
            {"contract_id": contract_id},
            {"_id": 0}
        ).sort("installment_number", 1).to_list(20)
        
        for p in payments:
            timeline.append({
                "type": "payment",
                "title": p.get("installment_name", ""),
                "status": p.get("status", ""),
                "timestamp": p.get("paid_date") or p.get("due_date", ""),
                "amount": p.get("amount", 0),
                "data": {"payment_id": p.get("id")},
            })
        
        # 3. Commission
        commission = await self.db.finance_commissions.find_one(
            {"contract_id": contract_id},
            {"_id": 0}
        )
        
        if commission:
            timeline.append({
                "type": "commission",
                "title": f"Hoa hồng {commission.get('code', '')}",
                "status": commission.get("status", ""),
                "timestamp": commission.get("created_at", ""),
                "amount": commission.get("total_commission", 0),
                "data": {"commission_id": commission.get("id")},
            })
            
            # 4. Commission Splits
            splits = await self.db.commission_splits.find(
                {"commission_id": commission.get("id")},
                {"_id": 0}
            ).to_list(10)
            
            for s in splits:
                timeline.append({
                    "type": "split",
                    "title": f"Chia HH - {s.get('recipient_role', '').title()}",
                    "status": s.get("status", ""),
                    "timestamp": s.get("created_at", ""),
                    "amount": s.get("net_amount", 0),
                    "data": {
                        "split_id": s.get("id"),
                        "recipient_id": s.get("recipient_id"),
                        "role": s.get("recipient_role"),
                    },
                })
            
            # 5. Receivable
            receivable = await self.db.receivables.find_one(
                {"commission_id": commission.get("id")},
                {"_id": 0}
            )
            
            if receivable:
                timeline.append({
                    "type": "receivable",
                    "title": f"Công nợ {receivable.get('code', '')}",
                    "status": receivable.get("status", ""),
                    "timestamp": receivable.get("created_at", ""),
                    "amount": receivable.get("amount_due", 0),
                    "paid": receivable.get("amount_paid", 0),
                    "data": {"receivable_id": receivable.get("id")},
                })
        
        # 6. Payouts
        payouts = await self.db.payouts.find(
            {"commission_split_id": {"$in": [s.get("id") for s in splits] if splits else []}},
            {"_id": 0}
        ).to_list(20)
        
        for payout in payouts:
            timeline.append({
                "type": "payout",
                "title": f"Chi trả {payout.get('code', '')}",
                "status": payout.get("status", ""),
                "timestamp": payout.get("paid_at") or payout.get("approved_at") or payout.get("created_at", ""),
                "amount": payout.get("net_amount", 0),
                "data": {
                    "payout_id": payout.get("id"),
                    "recipient_id": payout.get("recipient_id"),
                },
            })
        
        # Sort by timestamp
        timeline.sort(key=lambda x: x.get("timestamp", ""))
        
        return timeline
    
    # ═══════════════════════════════════════════════════════════════════════════
    # HELPERS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _generate_code(self, prefix: str) -> str:
        """Generate sequential code"""
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
    
    async def _create_tax_record(
        self,
        tax_type: str,
        taxable_amount: float,
        tax_rate: float,
        tax_amount: float,
        commission_split_id: Optional[str] = None,
        user_id: Optional[str] = None,
        invoice_id: Optional[str] = None,
    ):
        """Create tax record"""
        now = datetime.now(timezone.utc)
        
        await self.db.tax_records.insert_one({
            "id": str(uuid.uuid4()),
            "tax_type": tax_type,
            "period_month": now.month,
            "period_year": now.year,
            "taxable_amount": taxable_amount,
            "tax_rate": tax_rate,
            "tax_amount": tax_amount,
            "commission_split_id": commission_split_id,
            "invoice_id": invoice_id,
            "user_id": user_id,
            "created_at": now.isoformat(),
        })
    
    async def _log_event(
        self,
        event_type: str,
        payload: Dict,
        result: Dict,
        triggered_by: str
    ):
        """Log event for audit"""
        await self.db.finance_events.insert_one({
            "id": str(uuid.uuid4()),
            "event_type": event_type,
            "payload": payload,
            "result": result,
            "triggered_by": triggered_by,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
