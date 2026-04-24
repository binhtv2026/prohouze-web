"""
ProHouzing Commission Service
Prompt 11/20 - Commission Engine

Core service layer for:
- Policy management
- Commission calculation engine
- Event processing
- Approval workflow
- Payout management
- Income queries
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.commission_config import (
    CommissionStatus, CommissionTrigger, CommissionSplitType,
    ApprovalStatus, ApprovalAction, PayoutStatus, PayoutBatchStatus,
    PolicyStatus, BrokerageRateType, SplitCalcType,
    COMMISSION_STATUS_CONFIG, COMMISSION_TRIGGER_CONFIG, COMMISSION_SPLIT_CONFIG,
    APPROVAL_CONFIG, get_required_approval_levels, can_user_approve,
    get_commission_status_config, get_trigger_config, get_split_config
)

from models.commission_models import (
    CommissionPolicyCreate, CommissionPolicyResponse,
    CommissionEventCreate, CommissionEventResponse,
    CommissionRecordResponse, CommissionAdjustment,
    CommissionApprovalResponse, ApprovalRequest,
    PayoutBatchCreate, PayoutBatchResponse,
    IncomeSummary, TeamMemberIncome, TeamIncomeSummary,
    SplitRule, BrokerageTier
)


class CommissionService:
    """Commission service with calculation engine"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════════════
    # CODE GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def _generate_code(self, prefix: str) -> str:
        """Generate sequential code like POL-202603-0001"""
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
    # POLICY MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_policy(
        self,
        data: CommissionPolicyCreate,
        created_by: str
    ) -> CommissionPolicyResponse:
        """Create new commission policy"""
        policy_id = str(uuid.uuid4())
        code = await self._generate_code("POL")
        now = datetime.now(timezone.utc).isoformat()
        
        # Validate split rules total = 100%
        total_split = sum(rule.calc_value for rule in data.split_rules 
                         if rule.calc_type == SplitCalcType.PERCENT_OF_BROKERAGE.value)
        
        policy_doc = {
            "id": policy_id,
            "code": code,
            "name": data.name,
            "description": data.description,
            
            # Scope
            "scope_type": data.scope_type,
            "project_ids": data.project_ids,
            "product_types": data.product_types,
            "campaign_ids": data.campaign_ids,
            "branch_ids": data.branch_ids,
            
            # Brokerage
            "brokerage_rate_type": data.brokerage_rate_type,
            "brokerage_rate_value": data.brokerage_rate_value,
            "brokerage_tiers": [t.dict() for t in data.brokerage_tiers],
            
            # Split rules
            "split_rules": [r.dict() for r in data.split_rules],
            "total_split_percent": total_split,
            
            # Trigger
            "trigger_event": data.trigger_event,
            "estimated_trigger": data.estimated_trigger,
            
            # Validity
            "effective_from": data.effective_from,
            "effective_to": data.effective_to,
            
            # Approval
            "requires_approval_above": data.requires_approval_above,
            "approval_levels": data.approval_levels,
            
            # Status
            "status": PolicyStatus.DRAFT.value,
            "version": 1,
            "previous_version_id": None,
            
            # Audit
            "created_by": created_by,
            "created_at": now,
            "approved_by": None,
            "approved_at": None,
            "updated_at": now,
            
            "notes": data.notes,
        }
        
        await self.db.commission_policies.insert_one(policy_doc)
        
        return await self._enrich_policy(policy_doc)
    
    async def get_policy(self, policy_id: str) -> Optional[CommissionPolicyResponse]:
        """Get policy by ID"""
        policy = await self.db.commission_policies.find_one(
            {"id": policy_id}, {"_id": 0}
        )
        if not policy:
            return None
        return await self._enrich_policy(policy)
    
    async def list_policies(
        self,
        status: Optional[str] = None,
        project_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[CommissionPolicyResponse]:
        """List policies with filters"""
        query = {}
        if status:
            query["status"] = status
        if project_id:
            query["$or"] = [
                {"project_ids": {"$size": 0}},
                {"project_ids": project_id}
            ]
        
        policies = await self.db.commission_policies.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_policy(p) for p in policies]
    
    async def activate_policy(self, policy_id: str, approved_by: str) -> bool:
        """Activate a policy"""
        now = datetime.now(timezone.utc).isoformat()
        result = await self.db.commission_policies.update_one(
            {"id": policy_id, "status": PolicyStatus.DRAFT.value},
            {"$set": {
                "status": PolicyStatus.ACTIVE.value,
                "approved_by": approved_by,
                "approved_at": now,
                "updated_at": now
            }}
        )
        return result.modified_count > 0
    
    async def find_matching_policy(
        self,
        project_id: str,
        product_type: Optional[str] = None,
        event_date: Optional[datetime] = None
    ) -> Optional[Dict]:
        """Find best matching policy for calculation"""
        if not event_date:
            event_date = datetime.now(timezone.utc)
        
        event_date_str = event_date.isoformat() if isinstance(event_date, datetime) else event_date
        
        # Priority: specific project > global
        # First try project-specific
        query = {
            "status": PolicyStatus.ACTIVE.value,
            "effective_from": {"$lte": event_date_str},
            "$or": [
                {"effective_to": None},
                {"effective_to": {"$gte": event_date_str}}
            ]
        }
        
        # Try project-specific first
        project_query = {**query, "project_ids": project_id}
        policy = await self.db.commission_policies.find_one(project_query, {"_id": 0})
        
        if not policy:
            # Try global policy
            global_query = {
                **query,
                "$or": [
                    {"project_ids": {"$size": 0}},
                    {"scope_type": "global"}
                ]
            }
            policy = await self.db.commission_policies.find_one(global_query, {"_id": 0})
        
        return policy
    
    async def _enrich_policy(self, policy: Dict) -> CommissionPolicyResponse:
        """Enrich policy with labels and resolved names"""
        # Get project names
        project_names = []
        if policy.get("project_ids"):
            projects = await self.db.projects_master.find(
                {"id": {"$in": policy["project_ids"]}},
                {"_id": 0, "name": 1}
            ).to_list(100)
            project_names = [p.get("name", "") for p in projects]
        
        # Get creator name
        created_by_name = ""
        if policy.get("created_by"):
            user = await self.db.users.find_one(
                {"id": policy["created_by"]},
                {"_id": 0, "full_name": 1}
            )
            if user:
                created_by_name = user.get("full_name", "")
        
        trigger_config = get_trigger_config(policy.get("trigger_event", "contract_signed"))
        
        now = datetime.now(timezone.utc)
        eff_from = policy.get("effective_from", now.isoformat())
        eff_to = policy.get("effective_to")
        
        is_active_calculated = (
            policy.get("status", "draft") == PolicyStatus.ACTIVE.value and
            eff_from <= now.isoformat() and
            (not eff_to or eff_to >= now.isoformat())
        )
        
        # Create copy with all required fields with defaults
        policy_copy = {
            "id": policy.get("id", ""),
            "code": policy.get("code", ""),
            "name": policy.get("name", ""),
            "description": policy.get("description"),
            "scope_type": policy.get("scope_type", "global"),
            "project_ids": policy.get("project_ids", []),
            "product_types": policy.get("product_types", []),
            "campaign_ids": policy.get("campaign_ids", []),
            "branch_ids": policy.get("branch_ids", []),
            "brokerage_rate_type": policy.get("brokerage_rate_type", "percent"),
            "brokerage_rate_value": policy.get("brokerage_rate_value", 2.0),
            "brokerage_tiers": policy.get("brokerage_tiers", []),
            "split_rules": policy.get("split_rules", []),
            "total_split_percent": policy.get("total_split_percent", 0),
            "trigger_event": policy.get("trigger_event", "contract_signed"),
            "estimated_trigger": policy.get("estimated_trigger", "booking_confirmed"),
            "effective_from": eff_from,
            "effective_to": eff_to,
            "requires_approval_above": policy.get("requires_approval_above", 50000000),
            "approval_levels": policy.get("approval_levels", 1),
            "status": policy.get("status", "draft"),
            "version": policy.get("version", 1),
            "previous_version_id": policy.get("previous_version_id"),
            "created_by": policy.get("created_by"),
            "created_at": policy.get("created_at", now.isoformat()),
            "approved_by": policy.get("approved_by"),
            "approved_at": policy.get("approved_at"),
            "updated_at": policy.get("updated_at"),
            "notes": policy.get("notes"),
        }
        
        return CommissionPolicyResponse(
            **policy_copy,
            project_names=project_names,
            scope_label=policy_copy["scope_type"].replace("_", " ").title(),
            brokerage_rate_type_label=policy_copy["brokerage_rate_type"].title(),
            trigger_event_label=trigger_config.get("label", ""),
            is_active=is_active_calculated,
            status_label=policy_copy["status"].replace("_", " ").title(),
            created_by_name=created_by_name,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # COMMISSION CALCULATION ENGINE
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def calculate_commission(
        self,
        contract_id: str,
        trigger_event: str = CommissionTrigger.CONTRACT_SIGNED.value,
        policy_id: Optional[str] = None,
        triggered_by: str = "system"
    ) -> Tuple[List[Dict], List[str]]:
        """
        Main calculation engine
        Returns: (commission_records, errors)
        """
        errors = []
        records = []
        
        # 1. Get contract
        contract = await self.db.contracts.find_one(
            {"id": contract_id}, {"_id": 0}
        )
        if not contract:
            return [], ["Contract not found"]
        
        # 2. Get related deal
        deal = None
        if contract.get("deal_id"):
            deal = await self.db.deals.find_one(
                {"id": contract["deal_id"]}, {"_id": 0}
            )
        
        # 3. Find policy
        policy = None
        if policy_id:
            policy = await self.db.commission_policies.find_one(
                {"id": policy_id}, {"_id": 0}
            )
        else:
            policy = await self.find_matching_policy(
                project_id=contract.get("project_id"),
                product_type=None,  # Could be from product
                event_date=datetime.now(timezone.utc)
            )
        
        if not policy:
            return [], ["No matching commission policy found"]
        
        # 4. Calculate brokerage amount
        base_amount = contract.get("grand_total") or contract.get("contract_value", 0)
        brokerage_amount = self._calculate_brokerage(base_amount, policy)
        
        # 5. Create event
        event_id = str(uuid.uuid4())
        idempotency_key = f"{trigger_event}:{contract_id}"
        
        # Check idempotency
        existing_event = await self.db.commission_events.find_one(
            {"idempotency_key": idempotency_key}
        )
        if existing_event:
            # Return existing records
            existing_records = await self.db.commission_records.find(
                {"event_id": existing_event["id"]}, {"_id": 0}
            ).to_list(100)
            return existing_records, []
        
        now = datetime.now(timezone.utc).isoformat()
        
        event_doc = {
            "id": event_id,
            "event_type": trigger_event,
            "source_entity_type": "contract",
            "source_entity_id": contract_id,
            "contract_id": contract_id,
            "contract_code": contract.get("contract_code", ""),
            "contract_value": base_amount,
            "deal_id": contract.get("deal_id"),
            "booking_id": contract.get("booking_id"),
            "customer_id": contract.get("customer_id"),
            "product_id": contract.get("product_id"),
            "project_id": contract.get("project_id"),
            "sales_owner_id": deal.get("assigned_to") if deal else contract.get("owner_id"),
            "co_broker_id": deal.get("co_broker_id") if deal else None,
            "team_id": deal.get("team_id") if deal else None,
            "branch_id": deal.get("branch_id") if deal else contract.get("branch_id"),
            "triggered_at": now,
            "triggered_by": triggered_by,
            "processed": False,
            "idempotency_key": idempotency_key,
        }
        
        await self.db.commission_events.insert_one(event_doc)
        
        # 6. Generate commission records for each split rule
        trigger_config = get_trigger_config(trigger_event)
        is_estimated = trigger_config.get("creates_estimated", False)
        
        record_ids = []
        
        for rule in policy.get("split_rules", []):
            # Resolve recipient
            recipient = await self._resolve_recipient(rule, event_doc)
            
            if not recipient and rule.get("recipient_source") != "company":
                continue  # Skip if no recipient found
            
            # Calculate split amount
            split_amount = self._calculate_split(brokerage_amount, rule)
            
            # Check conditions
            if not self._evaluate_conditions(rule.get("conditions", []), contract, deal):
                continue
            
            # Generate code
            record_code = await self._generate_code("COM")
            record_id = str(uuid.uuid4())
            
            # Determine approval requirements
            requires_approval = split_amount >= policy.get("requires_approval_above", 0)
            approval_levels = get_required_approval_levels(split_amount)
            
            record_doc = {
                "id": record_id,
                "code": record_code,
                
                # Event & Policy
                "event_id": event_id,
                "event_type": trigger_event,
                "policy_id": policy["id"],
                "policy_version": policy.get("version", 1),
                
                # Source Entities
                "contract_id": contract_id,
                "contract_code": contract.get("contract_code", ""),
                "deal_id": contract.get("deal_id"),
                "booking_id": contract.get("booking_id"),
                
                # Product/Project/Customer
                "product_id": contract.get("product_id"),
                "project_id": contract.get("project_id"),
                "customer_id": contract.get("customer_id"),
                
                # Recipient
                "recipient_id": recipient["id"] if recipient else "company",
                "recipient_name": recipient.get("full_name", "Công ty") if recipient else "Công ty",
                "recipient_role": rule.get("recipient_role", ""),
                "recipient_type": recipient.get("type", "employee") if recipient else "company",
                
                # Calculation
                "base_amount": base_amount,
                "brokerage_rate": policy.get("brokerage_rate_value", 0),
                "brokerage_amount": brokerage_amount,
                "commission_type": rule.get("split_type", ""),
                "split_percent": rule.get("calc_value", 0),
                "commission_amount": split_amount,
                "adjusted_amount": 0,
                "final_amount": split_amount,
                
                # ═══════════════════════════════════════════════════════════════
                # RULE SNAPSHOT - Lưu chính xác rule đã áp dụng tại thời điểm tính
                # ═══════════════════════════════════════════════════════════════
                "rule_snapshot": {
                    "policy_id": policy["id"],
                    "policy_code": policy.get("code", ""),
                    "policy_name": policy.get("name", ""),
                    "policy_version": policy.get("version", 1),
                    "brokerage_rate_type": policy.get("brokerage_rate_type", ""),
                    "brokerage_rate_value": policy.get("brokerage_rate_value", 0),
                    "trigger_event": policy.get("trigger_event", ""),
                    "requires_approval_above": policy.get("requires_approval_above", 0),
                    "snapshot_at": now,
                },
                "rule_name": policy.get("name", ""),
                "rule_version": policy.get("version", 1),
                "applied_percentage": rule.get("calc_value", 0),
                "applied_formula": f"{base_amount:,.0f} × {policy.get('brokerage_rate_value', 0)}% × {rule.get('calc_value', 0)}% = {split_amount:,.0f}",
                "split_structure": {
                    "split_type": rule.get("split_type", ""),
                    "recipient_role": rule.get("recipient_role", ""),
                    "recipient_source": rule.get("recipient_source", ""),
                    "calc_type": rule.get("calc_type", ""),
                    "calc_value": rule.get("calc_value", 0),
                    "min_amount": rule.get("min_amount"),
                    "max_amount": rule.get("max_amount"),
                    "conditions": rule.get("conditions", []),
                },
                
                # Status
                "is_estimated": is_estimated,
                "status": CommissionStatus.ESTIMATED.value if is_estimated else CommissionStatus.PENDING.value,
                
                # Approval
                "approval_status": ApprovalStatus.NOT_STARTED.value,
                "current_approval_step": 0,
                "required_approval_levels": approval_levels,
                "requires_approval": requires_approval,
                
                # Payout
                "payout_status": PayoutStatus.NOT_READY.value,
                "payout_batch_id": None,
                "payout_scheduled_date": None,
                "paid_at": None,
                "paid_amount": 0,
                
                # Dispute
                "is_disputed": False,
                
                # Lock
                "is_locked": False,
                
                # Audit
                "created_at": now,
                "created_by": triggered_by,
                "calculated_at": now,
                "calculated_by": "system",
            }
            
            await self.db.commission_records.insert_one(record_doc)
            records.append(record_doc)
            record_ids.append(record_id)
        
        # 7. Mark event as processed
        await self.db.commission_events.update_one(
            {"id": event_id},
            {"$set": {
                "processed": True,
                "processed_at": now,
                "commission_record_ids": record_ids
            }}
        )
        
        return records, errors
    
    def _calculate_brokerage(self, base_amount: float, policy: Dict) -> float:
        """Calculate brokerage amount based on policy"""
        rate_type = policy.get("brokerage_rate_type", BrokerageRateType.PERCENT.value)
        rate_value = policy.get("brokerage_rate_value", 0)
        
        if rate_type == BrokerageRateType.PERCENT.value:
            return base_amount * rate_value / 100
        elif rate_type == BrokerageRateType.FIXED.value:
            return rate_value
        elif rate_type == BrokerageRateType.TIERED.value:
            return self._calculate_tiered_brokerage(base_amount, policy.get("brokerage_tiers", []))
        
        return 0
    
    def _calculate_tiered_brokerage(self, base_amount: float, tiers: List[Dict]) -> float:
        """Calculate tiered brokerage"""
        total = 0
        remaining = base_amount
        
        sorted_tiers = sorted(tiers, key=lambda t: t.get("min_value", 0))
        
        for tier in sorted_tiers:
            min_val = tier.get("min_value", 0)
            max_val = tier.get("max_value") or float('inf')
            rate = tier.get("rate", 0)
            
            tier_range = max_val - min_val
            applicable = min(remaining, tier_range)
            
            if applicable > 0:
                total += applicable * rate / 100
                remaining -= applicable
            
            if remaining <= 0:
                break
        
        return total
    
    def _calculate_split(self, brokerage_amount: float, rule: Dict) -> float:
        """Calculate split amount from rule"""
        calc_type = rule.get("calc_type", SplitCalcType.PERCENT_OF_BROKERAGE.value)
        calc_value = rule.get("calc_value", 0)
        
        if calc_type == SplitCalcType.PERCENT_OF_BROKERAGE.value:
            amount = brokerage_amount * calc_value / 100
        elif calc_type == SplitCalcType.FIXED.value:
            amount = calc_value
        else:
            amount = 0
        
        # Apply constraints
        min_amount = rule.get("min_amount")
        max_amount = rule.get("max_amount")
        
        if min_amount and amount < min_amount:
            amount = min_amount
        if max_amount and amount > max_amount:
            amount = max_amount
        
        return amount
    
    async def _resolve_recipient(self, rule: Dict, event: Dict) -> Optional[Dict]:
        """Resolve recipient based on rule"""
        source = rule.get("recipient_source", "")
        
        if source == "deal_owner":
            if event.get("sales_owner_id"):
                return await self.db.users.find_one(
                    {"id": event["sales_owner_id"]},
                    {"_id": 0, "id": 1, "full_name": 1, "type": 1}
                )
        
        elif source == "co_broker":
            if event.get("co_broker_id"):
                return await self.db.users.find_one(
                    {"id": event["co_broker_id"]},
                    {"_id": 0, "id": 1, "full_name": 1, "type": 1}
                )
        
        elif source == "team_leader":
            if event.get("team_id"):
                team = await self.db.teams.find_one(
                    {"id": event["team_id"]},
                    {"_id": 0, "leader_id": 1}
                )
                if team and team.get("leader_id"):
                    return await self.db.users.find_one(
                        {"id": team["leader_id"]},
                        {"_id": 0, "id": 1, "full_name": 1, "type": 1}
                    )
        
        elif source == "branch_manager":
            if event.get("branch_id"):
                branch = await self.db.branches.find_one(
                    {"id": event["branch_id"]},
                    {"_id": 0, "manager_id": 1}
                )
                if branch and branch.get("manager_id"):
                    return await self.db.users.find_one(
                        {"id": branch["manager_id"]},
                        {"_id": 0, "id": 1, "full_name": 1, "type": 1}
                    )
        
        elif source == "manual":
            manual_id = rule.get("manual_recipient_id")
            if manual_id:
                return await self.db.users.find_one(
                    {"id": manual_id},
                    {"_id": 0, "id": 1, "full_name": 1, "type": 1}
                )
        
        elif source == "company":
            return {"id": "company", "full_name": "Công ty", "type": "company"}
        
        return None
    
    def _evaluate_conditions(self, conditions: List[Dict], contract: Dict, deal: Optional[Dict]) -> bool:
        """Evaluate conditions for a rule"""
        if not conditions:
            return True
        
        for cond in conditions:
            field = cond.get("field", "")
            operator = cond.get("operator", "")
            value = cond.get("value")
            
            # Get actual value
            actual = contract.get(field) or (deal.get(field) if deal else None)
            
            # Evaluate
            if operator == "eq" and actual != value:
                return False
            elif operator == "gt" and (actual is None or actual <= value):
                return False
            elif operator == "lt" and (actual is None or actual >= value):
                return False
            elif operator == "in" and actual not in value:
                return False
        
        return True
    
    # ═══════════════════════════════════════════════════════════════════════════
    # COMMISSION RECORD OPERATIONS
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_record(self, record_id: str) -> Optional[CommissionRecordResponse]:
        """Get commission record by ID"""
        record = await self.db.commission_records.find_one(
            {"id": record_id}, {"_id": 0}
        )
        if not record:
            return None
        return await self._enrich_record(record)
    
    async def list_records(
        self,
        filters: Dict[str, Any],
        skip: int = 0,
        limit: int = 50
    ) -> List[CommissionRecordResponse]:
        """List commission records with filters"""
        query = {}
        
        if filters.get("status"):
            query["status"] = filters["status"]
        if filters.get("approval_status"):
            query["approval_status"] = filters["approval_status"]
        if filters.get("payout_status"):
            query["payout_status"] = filters["payout_status"]
        if filters.get("recipient_id"):
            query["recipient_id"] = filters["recipient_id"]
        if filters.get("project_id"):
            query["project_id"] = filters["project_id"]
        if filters.get("contract_id"):
            query["contract_id"] = filters["contract_id"]
        if filters.get("is_estimated") is not None:
            query["is_estimated"] = filters["is_estimated"]
        if filters.get("is_disputed") is not None:
            query["is_disputed"] = filters["is_disputed"]
        
        sort_by = filters.get("sort_by", "created_at")
        sort_order = -1 if filters.get("sort_order", "desc") == "desc" else 1
        
        records = await self.db.commission_records.find(
            query, {"_id": 0}
        ).sort(sort_by, sort_order).skip(skip).limit(limit).to_list(limit)
        
        return [await self._enrich_record(r) for r in records]
    
    async def adjust_commission(
        self,
        record_id: str,
        adjustment: CommissionAdjustment,
        adjusted_by: str
    ) -> Optional[CommissionRecordResponse]:
        """Adjust commission amount - BLOCKED if approved/locked"""
        now = datetime.now(timezone.utc).isoformat()
        
        record = await self.db.commission_records.find_one(
            {"id": record_id}, {"_id": 0}
        )
        if not record:
            return None
        
        # ═══════════════════════════════════════════════════════════════════════
        # LOCK CHECK - Cannot adjust after approval
        # ═══════════════════════════════════════════════════════════════════════
        if record.get("is_locked"):
            raise ValueError("Commission đã bị khóa, không thể điều chỉnh")
        
        if record.get("approval_status") in [ApprovalStatus.APPROVED.value]:
            raise ValueError("Commission đã được duyệt, không thể điều chỉnh")
        
        if record.get("status") in [CommissionStatus.APPROVED.value, CommissionStatus.PAID.value, 
                                     CommissionStatus.READY_FOR_PAYOUT.value, CommissionStatus.SCHEDULED.value]:
            raise ValueError(f"Commission ở trạng thái {record.get('status')}, không thể điều chỉnh")
        
        new_final = record.get("commission_amount", 0) + adjustment.adjusted_amount
        
        await self.db.commission_records.update_one(
            {"id": record_id},
            {"$set": {
                "adjusted_amount": adjustment.adjusted_amount,
                "adjustment_reason": adjustment.adjustment_reason,
                "adjustment_by": adjusted_by,
                "adjustment_at": now,
                "final_amount": new_final,
                "updated_at": now
            }}
        )
        
        return await self.get_record(record_id)
    
    async def _enrich_record(self, record: Dict) -> CommissionRecordResponse:
        """Enrich record with labels and resolved names"""
        # Get customer name
        customer_name = ""
        if record.get("customer_id"):
            customer = await self.db.contacts.find_one(
                {"id": record["customer_id"]},
                {"_id": 0, "full_name": 1}
            )
            if customer:
                customer_name = customer.get("full_name", "")
        
        # Get project name
        project_name = ""
        if record.get("project_id"):
            project = await self.db.projects_master.find_one(
                {"id": record["project_id"]},
                {"_id": 0, "name": 1}
            )
            if project:
                project_name = project.get("name", "")
        
        # Get product info
        product_code = ""
        product_name = ""
        if record.get("product_id"):
            product = await self.db.products.find_one(
                {"id": record["product_id"]},
                {"_id": 0, "code": 1, "name": 1}
            )
            if product:
                product_code = product.get("code", "")
                product_name = product.get("name", "")
        
        # Get policy name
        policy_name = ""
        if record.get("policy_id"):
            policy = await self.db.commission_policies.find_one(
                {"id": record["policy_id"]},
                {"_id": 0, "name": 1}
            )
            if policy:
                policy_name = policy.get("name", "")
        
        status_config = get_commission_status_config(record.get("status", ""))
        split_config = get_split_config(record.get("commission_type", ""))
        trigger_config = get_trigger_config(record.get("event_type", ""))
        
        # ═══════════════════════════════════════════════════════════════════════════
        # LEGACY DETECTION - Record cũ không có snapshot
        # ═══════════════════════════════════════════════════════════════════════════
        is_legacy = record.get("rule_snapshot") is None
        legacy_warning = ""
        
        # Fallback cho legacy records - READ ONLY, không update DB
        fallback_rule_name = record.get("rule_name", "")
        fallback_rule_version = record.get("rule_version", 0)
        fallback_formula = record.get("applied_formula", "")
        
        if is_legacy:
            legacy_warning = "Record này được tạo trước khi hệ thống snapshot. Giá trị hiển thị dựa trên dữ liệu gốc, không có chi tiết policy."
            
            # Nếu có policy_id, lấy thông tin READ-ONLY để hiển thị
            if record.get("policy_id") and not fallback_rule_name:
                policy = await self.db.commission_policies.find_one(
                    {"id": record["policy_id"]},
                    {"_id": 0, "name": 1, "version": 1}
                )
                if policy:
                    fallback_rule_name = f"{policy.get('name', 'N/A')} (fallback)"
                    fallback_rule_version = policy.get("version", 0)
            
            # Generate formula fallback nếu chưa có
            if not fallback_formula:
                base = record.get("base_amount", 0)
                rate = record.get("brokerage_rate", 0)
                split = record.get("split_percent", 0)
                final = record.get("final_amount", 0)
                if base > 0:
                    fallback_formula = f"{base:,.0f} × {rate}% × {split}% ≈ {final:,.0f} (ước tính)"
        
        return CommissionRecordResponse(
            **record,
            customer_name=customer_name,
            project_name=project_name,
            product_code=product_code,
            product_name=product_name,
            policy_name=policy_name,
            status_label=status_config.get("label", ""),
            status_color=status_config.get("color", ""),
            event_type_label=trigger_config.get("label", ""),
            commission_type_label=split_config.get("label", ""),
            recipient_role_label=split_config.get("label", ""),
            approval_status_label=record.get("approval_status", "").replace("_", " ").title(),
            payout_status_label=record.get("payout_status", "").replace("_", " ").title(),
            # Legacy fields
            is_legacy=is_legacy,
            legacy_warning=legacy_warning,
            rule_name=fallback_rule_name if is_legacy else record.get("rule_name", ""),
            rule_version=fallback_rule_version if is_legacy else record.get("rule_version", 0),
            applied_formula=fallback_formula if is_legacy else record.get("applied_formula", ""),
            # KPI Bonus fields (Phase 5)
            kpi_bonus_modifier=record.get("kpi_bonus_modifier", 1.0),
            kpi_bonus_tier=record.get("kpi_bonus_tier", ""),
            kpi_bonus_applied_at=record.get("kpi_bonus_applied_at"),
            kpi_bonus_amount=record.get("final_amount", 0) - record.get("commission_amount", 0) if record.get("kpi_bonus_modifier", 1.0) != 1.0 else 0,
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # APPROVAL WORKFLOW
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def submit_for_approval(self, record_id: str, submitted_by: str) -> bool:
        """Submit commission record for approval"""
        now = datetime.now(timezone.utc).isoformat()
        
        record = await self.db.commission_records.find_one({"id": record_id})
        if not record:
            return False
        
        if record.get("status") not in [CommissionStatus.PENDING.value, CommissionStatus.REJECTED.value]:
            return False
        
        # Create first approval step
        approval_id = str(uuid.uuid4())
        sla_hours = APPROVAL_CONFIG.get("level_1_sla_hours", 24)
        deadline = (datetime.now(timezone.utc) + timedelta(hours=sla_hours)).isoformat()
        
        approval_doc = {
            "id": approval_id,
            "commission_record_id": record_id,
            "step_number": 1,
            "step_name": "Sales Manager Review",
            "required_role": "sales_manager",
            "action": "pending",
            "assigned_at": now,
            "deadline": deadline,
            "sla_hours": sla_hours,
        }
        
        await self.db.commission_approvals.insert_one(approval_doc)
        
        await self.db.commission_records.update_one(
            {"id": record_id},
            {"$set": {
                "status": CommissionStatus.PENDING_APPROVAL.value,
                "approval_status": ApprovalStatus.PENDING.value,
                "current_approval_step": 1,
                "updated_at": now
            }}
        )
        
        return True
    
    async def approve_commission(
        self,
        record_id: str,
        reviewer_id: str,
        reviewer_role: str,
        comments: Optional[str] = None
    ) -> bool:
        """Approve commission at current step"""
        now = datetime.now(timezone.utc).isoformat()
        
        record = await self.db.commission_records.find_one({"id": record_id})
        if not record:
            return False
        
        current_step = record.get("current_approval_step", 0)
        required_levels = record.get("required_approval_levels", 1)
        
        # Check if user can approve this step
        if not can_user_approve(reviewer_role, current_step):
            return False
        
        # Get reviewer name
        reviewer = await self.db.users.find_one({"id": reviewer_id})
        reviewer_name = reviewer.get("full_name", "") if reviewer else ""
        
        # Update current approval record
        await self.db.commission_approvals.update_one(
            {"commission_record_id": record_id, "step_number": current_step, "action": "pending"},
            {"$set": {
                "action": "approved",
                "reviewer_id": reviewer_id,
                "reviewer_name": reviewer_name,
                "reviewer_role": reviewer_role,
                "comments": comments,
                "acted_at": now
            }}
        )
        
        # Check if more approval levels needed
        if current_step < required_levels:
            # Create next approval step
            next_step = current_step + 1
            level_key = f"level_{next_step}_sla_hours"
            sla_hours = APPROVAL_CONFIG.get(level_key, 48)
            deadline = (datetime.now(timezone.utc) + timedelta(hours=sla_hours)).isoformat()
            
            step_names = {
                2: "Finance Manager Review",
                3: "Director Approval"
            }
            required_roles = {
                2: "finance_manager",
                3: "director"
            }
            
            approval_doc = {
                "id": str(uuid.uuid4()),
                "commission_record_id": record_id,
                "step_number": next_step,
                "step_name": step_names.get(next_step, f"Level {next_step} Review"),
                "required_role": required_roles.get(next_step, "admin"),
                "action": "pending",
                "assigned_at": now,
                "deadline": deadline,
                "sla_hours": sla_hours,
            }
            
            await self.db.commission_approvals.insert_one(approval_doc)
            
            await self.db.commission_records.update_one(
                {"id": record_id},
                {"$set": {
                    "current_approval_step": next_step,
                    "updated_at": now
                }}
            )
        else:
            # All approvals complete - APPLY KPI BONUS then LOCK the commission record
            # ═══════════════════════════════════════════════════════════════════════
            # PHASE 5: KPI x COMMISSION INTEGRATION + FINANCIAL-GRADE PRINCIPLES
            # ═══════════════════════════════════════════════════════════════════════
            # PRINCIPLE 1: Rule Versioning - Lưu bonus_rule_id + rule_version
            # PRINCIPLE 2: KPI Snapshot - Lưu snapshot KPI tại thời điểm tính
            # PRINCIPLE 3: Re-calculation Control - Lock after approval
            # ═══════════════════════════════════════════════════════════════════════
            
            recipient_id = record.get("recipient_id")
            
            # Calculate KPI bonus with FULL SNAPSHOT
            from services.kpi_service import KPIService
            kpi_service = KPIService(self.db)
            
            # Initialize financial-grade fields
            kpi_score = 0
            kpi_bonus_modifier = 1.0
            kpi_bonus_tier = ""
            kpi_bonus_rule_id = None
            kpi_bonus_rule_version = 0
            kpi_snapshot = None
            kpi_calculated_at = now
            
            if recipient_id and recipient_id != "company":
                # Get current period
                period_now = datetime.now(timezone.utc)
                
                # Get bonus result with full details
                bonus_result = await kpi_service.calculate_bonus_modifier(
                    recipient_id,
                    "monthly",
                    period_now.year,
                    period_now.month
                )
                
                kpi_score = bonus_result.overall_achievement
                kpi_bonus_modifier = bonus_result.bonus_modifier
                kpi_bonus_tier = bonus_result.bonus_tier_label
                
                # PRINCIPLE 1: Get Rule Versioning data
                active_rule = await self.db.kpi_bonus_rules.find_one(
                    {"is_active": True},
                    {"_id": 0, "id": 1, "version": 1, "code": 1, "name": 1, "tiers": 1}
                )
                if active_rule:
                    kpi_bonus_rule_id = active_rule.get("id")
                    kpi_bonus_rule_version = active_rule.get("version", 1)
                
                # PRINCIPLE 2: Create KPI Snapshot
                kpi_snapshot = {
                    "user_id": recipient_id,
                    "period_type": "monthly",
                    "period_year": period_now.year,
                    "period_month": period_now.month,
                    "overall_score": bonus_result.overall_achievement,
                    "kpi_details": [kpi.dict() for kpi in bonus_result.kpi_details] if bonus_result.kpi_details else [],
                    "bonus_modifier": bonus_result.bonus_modifier,
                    "bonus_tier": bonus_result.bonus_tier_label,
                    "rule_id": kpi_bonus_rule_id,
                    "rule_version": kpi_bonus_rule_version,
                    "calculated_at": now,
                    "snapshot_type": "commission_approval"
                }
            else:
                # Company-level commissions don't get KPI bonus
                kpi_bonus_modifier = 1.0
                kpi_bonus_tier = "N/A - Company Level"
                kpi_snapshot = {"type": "company_level", "calculated_at": now}
            
            # CORE COMMISSION FORMULA: final_amount = commission_amount × kpi_modifier
            base_commission = record.get("commission_amount", 0)
            final_amount = base_commission * kpi_bonus_modifier
            
            await self.db.commission_records.update_one(
                {"id": record_id},
                {"$set": {
                    "status": CommissionStatus.APPROVED.value,
                    "approval_status": ApprovalStatus.APPROVED.value,
                    "payout_status": PayoutStatus.READY.value,
                    "is_locked": True,  # LOCK AFTER APPROVAL
                    "locked_at": now,
                    "locked_by": reviewer_id,
                    # KPI BONUS FIELDS - Part of CORE formula
                    "kpi_bonus_modifier": kpi_bonus_modifier,
                    "kpi_bonus_tier": kpi_bonus_tier,
                    "kpi_bonus_applied_at": now,
                    "final_amount": final_amount,
                    # FINANCIAL-GRADE: Rule Versioning (Principle 1)
                    "kpi_score": kpi_score,
                    "kpi_bonus_rule_id": kpi_bonus_rule_id,
                    "kpi_bonus_rule_version": kpi_bonus_rule_version,
                    # FINANCIAL-GRADE: KPI Snapshot (Principle 2)
                    "kpi_snapshot": kpi_snapshot,
                    "kpi_calculated_at": kpi_calculated_at,
                    # FINANCIAL-GRADE: Re-calculation Control (Principle 3)
                    "is_recalculation_locked": True,  # LOCKED after approval
                    "updated_at": now
                }}
            )
        
        return True
    
    async def reject_commission(
        self,
        record_id: str,
        reviewer_id: str,
        reviewer_role: str,
        reason: str
    ) -> bool:
        """Reject commission"""
        now = datetime.now(timezone.utc).isoformat()
        
        record = await self.db.commission_records.find_one({"id": record_id})
        if not record:
            return False
        
        current_step = record.get("current_approval_step", 0)
        
        # Get reviewer name
        reviewer = await self.db.users.find_one({"id": reviewer_id})
        reviewer_name = reviewer.get("full_name", "") if reviewer else ""
        
        # Update approval record
        await self.db.commission_approvals.update_one(
            {"commission_record_id": record_id, "step_number": current_step, "action": "pending"},
            {"$set": {
                "action": "rejected",
                "reviewer_id": reviewer_id,
                "reviewer_name": reviewer_name,
                "reviewer_role": reviewer_role,
                "rejection_reason": reason,
                "acted_at": now
            }}
        )
        
        # Update record
        await self.db.commission_records.update_one(
            {"id": record_id},
            {"$set": {
                "status": CommissionStatus.REJECTED.value,
                "approval_status": ApprovalStatus.REJECTED.value,
                "updated_at": now
            }}
        )
        
        return True
    
    async def get_pending_approvals(
        self,
        reviewer_role: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict]:
        """Get pending approvals for a role"""
        # Find which levels this role can approve
        approvable_levels = []
        for level in [1, 2, 3]:
            if can_user_approve(reviewer_role, level):
                approvable_levels.append(level)
        
        if not approvable_levels:
            return []
        
        # Get pending approval records at those levels
        approvals = await self.db.commission_approvals.find({
            "action": "pending",
            "step_number": {"$in": approvable_levels}
        }, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with commission record data
        results = []
        for approval in approvals:
            record = await self.get_record(approval.get("commission_record_id"))
            if record:
                results.append({
                    "approval": approval,
                    "record": record.dict()
                })
        
        return results
    
    # ═══════════════════════════════════════════════════════════════════════════
    # PAYOUT MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def create_payout_batch(
        self,
        data: PayoutBatchCreate,
        created_by: str
    ) -> PayoutBatchResponse:
        """Create payout batch"""
        batch_id = str(uuid.uuid4())
        batch_code = await self._generate_code("PAY")
        now = datetime.now(timezone.utc).isoformat()
        
        # Get commission records
        records = await self.db.commission_records.find({
            "id": {"$in": data.commission_record_ids},
            "payout_status": PayoutStatus.READY.value
        }, {"_id": 0}).to_list(1000)
        
        total_amount = sum(r.get("final_amount", 0) for r in records)
        
        # Count by type
        employee_records = [r for r in records if r.get("recipient_type") == "employee"]
        collaborator_records = [r for r in records if r.get("recipient_type") == "collaborator"]
        
        batch_doc = {
            "id": batch_id,
            "batch_code": batch_code,
            "name": data.name or f"Batch {batch_code}",
            "total_records": len(records),
            "total_amount": total_amount,
            "employee_count": len(employee_records),
            "employee_amount": sum(r.get("final_amount", 0) for r in employee_records),
            "collaborator_count": len(collaborator_records),
            "collaborator_amount": sum(r.get("final_amount", 0) for r in collaborator_records),
            "status": PayoutBatchStatus.DRAFT.value,
            "scheduled_date": data.scheduled_date,
            "processed_count": 0,
            "processed_amount": 0,
            "failed_count": 0,
            "created_by": created_by,
            "created_at": now,
            "notes": data.notes,
        }
        
        await self.db.payout_batches.insert_one(batch_doc)
        
        # Update commission records
        await self.db.commission_records.update_many(
            {"id": {"$in": data.commission_record_ids}},
            {"$set": {
                "payout_batch_id": batch_id,
                "payout_status": PayoutStatus.SCHEDULED.value,
                "payout_scheduled_date": data.scheduled_date,
                "updated_at": now
            }}
        )
        
        # Create payout records
        for record in records:
            payout_doc = {
                "id": str(uuid.uuid4()),
                "batch_id": batch_id,
                "commission_record_id": record["id"],
                "commission_code": record.get("code", ""),
                "recipient_id": record.get("recipient_id"),
                "recipient_name": record.get("recipient_name", ""),
                "recipient_type": record.get("recipient_type", "employee"),
                "amount": record.get("final_amount", 0),
                "status": PayoutStatus.SCHEDULED.value,
                "created_at": now,
            }
            await self.db.payout_records.insert_one(payout_doc)
        
        return PayoutBatchResponse(**batch_doc)
    
    async def mark_payout_paid(
        self,
        payout_id: str,
        payment_ref: Optional[str],
        confirmed_by: str
    ) -> bool:
        """Mark individual payout as paid"""
        now = datetime.now(timezone.utc).isoformat()
        
        payout = await self.db.payout_records.find_one({"id": payout_id})
        if not payout:
            return False
        
        # Update payout record
        await self.db.payout_records.update_one(
            {"id": payout_id},
            {"$set": {
                "status": PayoutStatus.PAID.value,
                "payment_reference": payment_ref,
                "paid_at": now,
                "confirmed_by": confirmed_by
            }}
        )
        
        # Update commission record
        await self.db.commission_records.update_one(
            {"id": payout["commission_record_id"]},
            {"$set": {
                "status": CommissionStatus.PAID.value,
                "payout_status": PayoutStatus.PAID.value,
                "paid_at": now,
                "paid_amount": payout.get("amount", 0),
                "updated_at": now
            }}
        )
        
        # Update batch stats
        batch_id = payout.get("batch_id")
        if batch_id:
            await self.db.payout_batches.update_one(
                {"id": batch_id},
                {"$inc": {
                    "processed_count": 1,
                    "processed_amount": payout.get("amount", 0)
                }}
            )
        
        return True
    
    # ═══════════════════════════════════════════════════════════════════════════
    # INCOME DASHBOARD
    # ═══════════════════════════════════════════════════════════════════════════
    
    async def get_my_income(
        self,
        user_id: str,
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> IncomeSummary:
        """Get income summary for a sales user"""
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month:
            period_month = now.month
        
        # Build date range
        start_date = f"{period_year}-{period_month:02d}-01T00:00:00"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01T00:00:00"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01T00:00:00"
        
        # Aggregate by status
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
                    "count": {"$sum": 1},
                    "amount": {"$sum": "$final_amount"}
                }
            }
        ]
        
        results = await self.db.commission_records.aggregate(pipeline).to_list(20)
        
        summary = IncomeSummary(
            period_type="monthly",
            period_year=period_year,
            period_month=period_month,
            period_label=f"Tháng {period_month}/{period_year}"
        )
        
        for r in results:
            status = r["_id"]
            count = r["count"]
            amount = r["amount"]
            
            if status == CommissionStatus.ESTIMATED.value:
                summary.estimated_count = count
                summary.estimated_amount = amount
            elif status == CommissionStatus.PENDING.value:
                summary.pending_count = count
                summary.pending_amount = amount
            elif status == CommissionStatus.PENDING_APPROVAL.value:
                summary.pending_approval_count = count
                summary.pending_approval_amount = amount
            elif status == CommissionStatus.APPROVED.value:
                summary.approved_count = count
                summary.approved_amount = amount
            elif status == CommissionStatus.PAID.value:
                summary.paid_count = count
                summary.paid_amount = amount
            elif status == CommissionStatus.DISPUTED.value:
                summary.disputed_count = count
                summary.disputed_amount = amount
        
        return summary
    
    async def get_team_income(
        self,
        team_id: Optional[str] = None,
        manager_id: Optional[str] = None,
        period_year: Optional[int] = None,
        period_month: Optional[int] = None
    ) -> TeamIncomeSummary:
        """Get team income summary for manager"""
        now = datetime.now(timezone.utc)
        if not period_year:
            period_year = now.year
        if not period_month:
            period_month = now.month
        
        # Get team members
        team_query = {}
        if team_id:
            team_query["team_id"] = team_id
        elif manager_id:
            # Find teams where this user is manager/leader
            teams = await self.db.teams.find(
                {"$or": [{"leader_id": manager_id}, {"manager_id": manager_id}]},
                {"_id": 0, "id": 1}
            ).to_list(100)
            team_ids = [t["id"] for t in teams]
            team_query["team_id"] = {"$in": team_ids}
        
        if not team_query:
            return TeamIncomeSummary(period_year=period_year, period_month=period_month)
        
        # Get team members from users
        members = await self.db.users.find(
            team_query,
            {"_id": 0, "id": 1, "full_name": 1, "position": 1}
        ).to_list(100)
        
        member_ids = [m["id"] for m in members]
        
        # Build date range
        start_date = f"{period_year}-{period_month:02d}-01T00:00:00"
        if period_month == 12:
            end_date = f"{period_year + 1}-01-01T00:00:00"
        else:
            end_date = f"{period_year}-{period_month + 1:02d}-01T00:00:00"
        
        # Aggregate by member and status
        pipeline = [
            {
                "$match": {
                    "recipient_id": {"$in": member_ids},
                    "created_at": {"$gte": start_date, "$lt": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "recipient_id": "$recipient_id",
                        "status": "$status"
                    },
                    "count": {"$sum": 1},
                    "amount": {"$sum": "$final_amount"}
                }
            }
        ]
        
        results = await self.db.commission_records.aggregate(pipeline).to_list(1000)
        
        # Build member summaries
        member_data = {}
        for m in members:
            member_data[m["id"]] = TeamMemberIncome(
                user_id=m["id"],
                user_name=m.get("full_name", ""),
                position=m.get("position", "")
            )
        
        total_estimated = 0
        total_approved = 0
        total_paid = 0
        pending_count = 0
        
        for r in results:
            user_id = r["_id"]["recipient_id"]
            status = r["_id"]["status"]
            amount = r["amount"]
            
            if user_id in member_data:
                if status == CommissionStatus.ESTIMATED.value:
                    member_data[user_id].estimated_amount += amount
                    total_estimated += amount
                elif status in [CommissionStatus.APPROVED.value, CommissionStatus.READY_FOR_PAYOUT.value]:
                    member_data[user_id].approved_amount += amount
                    total_approved += amount
                elif status == CommissionStatus.PAID.value:
                    member_data[user_id].paid_amount += amount
                    total_paid += amount
                
                if status == CommissionStatus.PENDING_APPROVAL.value:
                    member_data[user_id].pending_approval_count += r["count"]
                    pending_count += r["count"]
        
        return TeamIncomeSummary(
            team_id=team_id,
            period_type="monthly",
            period_year=period_year,
            period_month=period_month,
            period_label=f"Tháng {period_month}/{period_year}",
            total_estimated=total_estimated,
            total_approved=total_approved,
            total_paid=total_paid,
            member_count=len(members),
            members=list(member_data.values()),
            pending_approval_count=pending_count
        )
