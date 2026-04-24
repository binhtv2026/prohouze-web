"""
ProHouzing Audit Service
TRUST ENGINE - Lưu vết mọi thao tác để minh bạch tuyệt đối

Audit Log lưu:
- ai làm gì
- lúc nào  
- thay đổi gì
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import uuid
import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class AuditService:
    """
    Audit Service - Ghi log mọi thao tác
    Không ai có thể gian lận khi có audit trail
    """
    
    # Action types
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    ACTION_APPROVE = "approve"
    ACTION_REJECT = "reject"
    ACTION_SIGN = "sign"
    ACTION_LOCK = "lock"
    ACTION_PAYMENT = "payment"
    ACTION_SPLIT = "split"
    ACTION_PAYOUT = "payout"
    
    # Entity types
    ENTITY_CONTRACT = "contract"
    ENTITY_COMMISSION = "commission"
    ENTITY_SPLIT = "commission_split"
    ENTITY_RECEIVABLE = "receivable"
    ENTITY_PAYOUT = "payout"
    ENTITY_INVOICE = "invoice"
    ENTITY_DEAL = "deal"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def log(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        actor_id: str,
        changes: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        amount: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Ghi audit log
        
        Args:
            entity_type: Loại entity (contract, commission, payout, etc.)
            entity_id: ID của entity
            action: Hành động (create, update, approve, etc.)
            actor_id: ID người thực hiện
            changes: Dict of {field: {old: x, new: y}}
            reason: Lý do thực hiện
            metadata: Thông tin bổ sung
            amount: Số tiền liên quan (nếu có)
            
        Returns:
            Dict: Audit log entry đã tạo
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Get actor info
        actor_name = ""
        actor_role = ""
        if actor_id and actor_id != "system" and actor_id != "seeder":
            user = await self.db.users.find_one(
                {"id": actor_id},
                {"_id": 0, "full_name": 1, "role": 1, "email": 1}
            )
            if user:
                actor_name = user.get("full_name", "")
                actor_role = user.get("role", "")
        elif actor_id == "system":
            actor_name = "Hệ thống"
            actor_role = "system"
        elif actor_id == "seeder":
            actor_name = "Demo Seeder"
            actor_role = "seeder"
        
        log_entry = {
            "id": str(uuid.uuid4()),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            
            # Actor info
            "actor_id": actor_id,
            "actor_name": actor_name,
            "actor_role": actor_role,
            
            # Changes
            "changes": changes or {},
            "reason": reason,
            "amount": amount,
            
            # Metadata
            "metadata": metadata or {},
            
            # Timestamp
            "timestamp": now,
            "created_at": now,
        }
        
        await self.db.audit_logs.insert_one(log_entry)
        
        logger.info(
            f"AUDIT: {actor_name or actor_id} {action} {entity_type} {entity_id}"
            f"{f' - {amount:,.0f}đ' if amount else ''}"
        )
        
        return log_entry
    
    async def get_logs(
        self,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_id: Optional[str] = None,
        action: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        """
        Lấy audit logs với filters
        """
        query = {}
        
        if entity_type:
            query["entity_type"] = entity_type
        if entity_id:
            query["entity_id"] = entity_id
        if actor_id:
            query["actor_id"] = actor_id
        if action:
            query["action"] = action
        if date_from:
            query["timestamp"] = {"$gte": date_from}
        if date_to:
            if "timestamp" in query:
                query["timestamp"]["$lte"] = date_to
            else:
                query["timestamp"] = {"$lte": date_to}
        
        logs = await self.db.audit_logs.find(
            query,
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    async def get_entity_timeline(
        self,
        entity_type: str,
        entity_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Lấy timeline của một entity
        Sorted by timestamp ascending (oldest first)
        """
        logs = await self.db.audit_logs.find(
            {"entity_type": entity_type, "entity_id": entity_id},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(100)
        
        return logs
    
    async def get_contract_full_timeline(
        self,
        contract_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Lấy FULL timeline của contract bao gồm tất cả entities liên quan:
        - Contract events
        - Commission events
        - Commission split events
        - Receivable events  
        - Payout events
        
        Returns: Sorted timeline by timestamp
        """
        # Get all related entity IDs
        commission = await self.db.finance_commissions.find_one(
            {"contract_id": contract_id},
            {"_id": 0, "id": 1}
        )
        commission_id = commission["id"] if commission else None
        
        splits = []
        if commission_id:
            splits = await self.db.commission_splits.find(
                {"commission_id": commission_id},
                {"_id": 0, "id": 1}
            ).to_list(10)
        
        receivable = await self.db.receivables.find_one(
            {"commission_id": commission_id} if commission_id else {"contract_id": contract_id},
            {"_id": 0, "id": 1}
        )
        
        payouts = []
        if splits:
            split_ids = [s["id"] for s in splits]
            payouts = await self.db.payouts.find(
                {"commission_split_id": {"$in": split_ids}},
                {"_id": 0, "id": 1}
            ).to_list(10)
        
        # Build query for all related entities
        entity_queries = [
            {"entity_type": "contract", "entity_id": contract_id}
        ]
        
        if commission_id:
            entity_queries.append({"entity_type": "commission", "entity_id": commission_id})
        
        for s in splits:
            entity_queries.append({"entity_type": "commission_split", "entity_id": s["id"]})
        
        if receivable:
            entity_queries.append({"entity_type": "receivable", "entity_id": receivable["id"]})
        
        for p in payouts:
            entity_queries.append({"entity_type": "payout", "entity_id": p["id"]})
        
        # Query all logs
        logs = await self.db.audit_logs.find(
            {"$or": entity_queries},
            {"_id": 0}
        ).sort("timestamp", 1).to_list(200)
        
        return logs


# ═══════════════════════════════════════════════════════════════════════════════
# LOCK SERVICE - Contract Lock
# ═══════════════════════════════════════════════════════════════════════════════

class LockService:
    """
    Lock Service - Khóa contract sau khi ký
    
    LOCKED FIELDS khi contract.status = "signed":
    - contract_value
    - sale_id (owner_id)
    - leader_id
    - project_id
    
    Muốn sửa → phải tạo amendment (version mới)
    """
    
    LOCKED_FIELDS = [
        "contract_value",
        "grand_total",
        "owner_id",       # sale_id
        "project_id",
        "customer_id",
        "unit_price",
        "commission_rate",
    ]
    
    # Status that locks the contract
    LOCKED_STATUSES = ["signed", "active", "completed"]
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.audit = AuditService(db)
    
    def is_locked_status(self, status: str) -> bool:
        """Check if status means contract is locked"""
        return status in self.LOCKED_STATUSES
    
    async def check_can_edit(
        self,
        contract_id: str,
        fields_to_edit: List[str],
        actor_id: str,
    ) -> Dict[str, Any]:
        """
        Check if contract fields can be edited
        
        Returns:
            {
                "can_edit": bool,
                "blocked_fields": [...],
                "reason": str,
            }
        """
        contract = await self.db.contracts.find_one(
            {"id": contract_id},
            {"_id": 0, "status": 1, "is_locked": 1, "contract_code": 1}
        )
        
        if not contract:
            return {
                "can_edit": False,
                "blocked_fields": fields_to_edit,
                "reason": "Hợp đồng không tồn tại",
            }
        
        status = contract.get("status", "draft")
        is_locked = contract.get("is_locked", False)
        
        # If not locked, allow all edits
        if not is_locked and not self.is_locked_status(status):
            return {
                "can_edit": True,
                "blocked_fields": [],
                "reason": None,
            }
        
        # Check which fields are blocked
        blocked = [f for f in fields_to_edit if f in self.LOCKED_FIELDS]
        
        if blocked:
            return {
                "can_edit": False,
                "blocked_fields": blocked,
                "reason": f"Hợp đồng {contract.get('contract_code')} đã ký. "
                          f"Không thể sửa: {', '.join(blocked)}. "
                          f"Vui lòng tạo Phụ lục để thay đổi.",
            }
        
        return {
            "can_edit": True,
            "blocked_fields": [],
            "reason": None,
        }
    
    async def lock_contract(
        self,
        contract_id: str,
        actor_id: str,
    ) -> Dict[str, Any]:
        """
        Lock contract - called when contract is signed
        """
        result = await self.db.contracts.update_one(
            {"id": contract_id},
            {"$set": {
                "is_locked": True,
                "locked_at": datetime.now(timezone.utc).isoformat(),
                "locked_by": actor_id,
            }}
        )
        
        # Audit log
        await self.audit.log(
            entity_type=AuditService.ENTITY_CONTRACT,
            entity_id=contract_id,
            action=AuditService.ACTION_LOCK,
            actor_id=actor_id,
            reason="Contract signed - auto lock",
        )
        
        return {"success": result.modified_count > 0}


# ═══════════════════════════════════════════════════════════════════════════════
# HARD RULES SERVICE
# ═══════════════════════════════════════════════════════════════════════════════

class HardRulesService:
    """
    Hard Rules - Không cho phép vi phạm
    
    RULES:
    1. Không cho xóa deal đã có commission
    2. Không cho sửa payout đã paid
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.audit = AuditService(db)
    
    async def can_delete_deal(self, deal_id: str) -> Dict[str, Any]:
        """
        Check if deal can be deleted
        
        Rule: Không cho xóa deal đã có commission
        """
        # Check if deal has any commission
        commission = await self.db.finance_commissions.find_one(
            {"deal_id": deal_id},
            {"_id": 0, "id": 1, "code": 1, "status": 1}
        )
        
        if commission:
            return {
                "can_delete": False,
                "reason": f"Không thể xóa deal đã có commission {commission.get('code')}. "
                          f"Trạng thái commission: {commission.get('status')}",
                "commission_id": commission["id"],
            }
        
        return {
            "can_delete": True,
            "reason": None,
        }
    
    async def can_edit_payout(
        self, 
        payout_id: str,
        fields_to_edit: List[str],
    ) -> Dict[str, Any]:
        """
        Check if payout can be edited
        
        Rule: Không cho sửa payout đã paid
        """
        payout = await self.db.payouts.find_one(
            {"id": payout_id},
            {"_id": 0, "status": 1, "code": 1}
        )
        
        if not payout:
            return {
                "can_edit": False,
                "reason": "Payout không tồn tại",
            }
        
        if payout.get("status") == "paid":
            return {
                "can_edit": False,
                "reason": f"Không thể sửa payout {payout.get('code')} đã thanh toán. "
                          f"Mọi thay đổi phải qua kế toán.",
                "status": "paid",
            }
        
        return {
            "can_edit": True,
            "reason": None,
        }
    
    async def can_delete_commission(self, commission_id: str) -> Dict[str, Any]:
        """
        Check if commission can be deleted
        
        Rule: Không cho xóa commission đã có payout
        """
        # Check if any splits have payouts
        splits = await self.db.commission_splits.find(
            {"commission_id": commission_id},
            {"_id": 0, "id": 1}
        ).to_list(10)
        
        split_ids = [s["id"] for s in splits]
        
        payout = await self.db.payouts.find_one(
            {"commission_split_id": {"$in": split_ids}},
            {"_id": 0, "id": 1, "code": 1, "status": 1}
        )
        
        if payout:
            return {
                "can_delete": False,
                "reason": f"Không thể xóa commission đã có payout {payout.get('code')}. "
                          f"Trạng thái: {payout.get('status')}",
                "payout_id": payout["id"],
            }
        
        return {
            "can_delete": True,
            "reason": None,
        }
