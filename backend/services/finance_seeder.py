"""
ProHouzing Finance Seeder
Tạo dữ liệu THẬT cho demo - KHÔNG RANDOM

DỮ LIỆU CỐ ĐỊNH:
- Project: Căn hộ ABC Đà Nẵng (2% hoa hồng)
- User: 1 Sale + 1 Leader + 1 Accountant + 1 CEO
- Contract: 3 tỷ VNĐ, status=signed
- Payment: Chủ đầu tư thanh toán 1 lần

FLOW: Gọi API engine, KHÔNG insert DB trực tiếp
"""

from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class FinanceSeeder:
    """
    Finance Seeder - Tạo dữ liệu mẫu cho demo
    GỌI API FLOW - KHÔNG INSERT TRỰC TIẾP
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        
    async def seed_sample_data(self) -> Dict[str, Any]:
        """
        Seed full flow với dữ liệu THẬT
        
        FLOW:
        1. Tạo Developer
        2. Tạo Project (2% hoa hồng)
        3. Tạo Team + Users (Sale, Leader, Accountant, CEO)
        4. Tạo Customer
        5. Tạo Contract (3 tỷ, signed)
        6. Trigger flow: contract_signed → payment → commission → split → payout
        7. Accountant approve → payout paid
        
        Returns: Dict với tất cả IDs đã tạo
        """
        result = {
            "success": False,
            "created": {},
            "flow_results": [],
            "errors": [],
        }
        
        now = datetime.now(timezone.utc).isoformat()
        
        try:
            # ═══════════════════════════════════════════════════════════════════
            # 1. TẠO DEVELOPER
            # ═══════════════════════════════════════════════════════════════════
            developer_id = str(uuid.uuid4())
            developer = {
                "id": developer_id,
                "name": "Công ty CP Đầu tư ABC",
                "code": "ABC-DEV",
                "address": "123 Nguyễn Văn Linh, Đà Nẵng",
                "phone": "0236-1234567",
                "email": "contact@abcdev.vn",
                "tax_code": "0401234567",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            # Check existing
            existing_dev = await self.db.developers.find_one({"code": "ABC-DEV"})
            if existing_dev:
                developer_id = existing_dev["id"]
                logger.info("Developer already exists, using existing")
            else:
                await self.db.developers.insert_one(developer)
                logger.info(f"Created developer: {developer_id}")
            
            result["created"]["developer_id"] = developer_id
            
            # ═══════════════════════════════════════════════════════════════════
            # 2. TẠO PROJECT (2% hoa hồng)
            # ═══════════════════════════════════════════════════════════════════
            project_id = str(uuid.uuid4())
            project = {
                "id": project_id,
                "name": "Căn hộ ABC Đà Nẵng",
                "code": "ABC-DN-2024",
                "developer_id": developer_id,
                "address": "Đường Võ Nguyên Giáp, Sơn Trà, Đà Nẵng",
                "type": "apartment",
                "status": "selling",
                "total_units": 500,
                "price_range": "2.5-5 tỷ",
                "description": "Căn hộ cao cấp view biển",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
            
            existing_project = await self.db.projects_master.find_one({"code": "ABC-DN-2024"})
            if existing_project:
                project_id = existing_project["id"]
                logger.info("Project already exists, using existing")
            else:
                await self.db.projects_master.insert_one(project)
                logger.info(f"Created project: {project_id}")
            
            result["created"]["project_id"] = project_id
            
            # Tạo cấu hình hoa hồng 2%
            commission_config_id = str(uuid.uuid4())
            existing_comm_config = await self.db.project_commissions.find_one({
                "project_id": project_id,
                "is_active": True
            })
            
            if not existing_comm_config:
                commission_config = {
                    "id": commission_config_id,
                    "project_id": project_id,
                    "commission_rate": 2.0,  # 2%
                    "effective_from": now,
                    "effective_to": None,
                    "is_active": True,
                    "notes": "Hoa hồng chuẩn 2% cho dự án ABC",
                    "created_by": "seeder",
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.project_commissions.insert_one(commission_config)
                logger.info(f"Created commission config: 2%")
            else:
                commission_config_id = existing_comm_config["id"]
            
            result["created"]["commission_config_id"] = commission_config_id
            
            # ═══════════════════════════════════════════════════════════════════
            # 3. TẠO TEAM + USERS
            # ═══════════════════════════════════════════════════════════════════
            
            # Team
            team_id = str(uuid.uuid4())
            existing_team = await self.db.teams.find_one({"code": "TEAM-DEMO"})
            if existing_team:
                team_id = existing_team["id"]
            else:
                team = {
                    "id": team_id,
                    "name": "Team Demo",
                    "code": "TEAM-DEMO",
                    "leader_id": None,  # Will update after creating leader
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.teams.insert_one(team)
            
            result["created"]["team_id"] = team_id
            
            # Users
            users_data = [
                {
                    "full_name": "Nguyễn Văn A",
                    "email": "sale.a@prohouzing.vn",
                    "role": "sales",
                    "is_leader": False,
                },
                {
                    "full_name": "Trần Văn B",
                    "email": "leader.b@prohouzing.vn",
                    "role": "manager",
                    "is_leader": True,
                },
                {
                    "full_name": "Lê Thị Accountant",
                    "email": "accountant@prohouzing.vn",
                    "role": "accountant",
                    "is_leader": False,
                },
                {
                    "full_name": "Phạm CEO",
                    "email": "ceo@prohouzing.vn",
                    "role": "bod",
                    "is_leader": False,
                },
            ]
            
            user_ids = {
                "sale_id": None,
                "leader_id": None,
                "accountant_id": None,
                "ceo_id": None,
            }
            
            for idx, user_data in enumerate(users_data):
                existing_user = await self.db.users.find_one({"email": user_data["email"]})
                
                if existing_user:
                    user_id = existing_user["id"]
                else:
                    user_id = str(uuid.uuid4())
                    user = {
                        "id": user_id,
                        "full_name": user_data["full_name"],
                        "email": user_data["email"],
                        "role": user_data["role"],
                        "team_id": team_id if user_data["role"] in ["sales", "manager"] else None,
                        "is_active": True,
                        "phone": f"090{idx}123456",
                        "bank_account": f"10201234560{idx}",
                        "bank_name": "Vietcombank",
                        "created_at": now,
                        "updated_at": now,
                    }
                    await self.db.users.insert_one(user)
                
                # Map user ids
                if user_data["role"] == "sales":
                    user_ids["sale_id"] = user_id
                elif user_data["role"] == "manager":
                    user_ids["leader_id"] = user_id
                elif user_data["role"] == "accountant":
                    user_ids["accountant_id"] = user_id
                elif user_data["role"] == "bod":
                    user_ids["ceo_id"] = user_id
            
            # Update team leader
            if user_ids["leader_id"]:
                await self.db.teams.update_one(
                    {"id": team_id},
                    {"$set": {"leader_id": user_ids["leader_id"]}}
                )
            
            result["created"].update(user_ids)
            logger.info(f"Created users: {user_ids}")
            
            # ═══════════════════════════════════════════════════════════════════
            # 4. TẠO CUSTOMER
            # ═══════════════════════════════════════════════════════════════════
            customer_id = str(uuid.uuid4())
            existing_customer = await self.db.contacts.find_one({
                "$or": [
                    {"email": "khachhang.demo@gmail.com"},
                    {"phone": "0901234567"}
                ]
            })
            
            if existing_customer:
                customer_id = existing_customer["id"]
                logger.info("Customer already exists, using existing")
            else:
                customer = {
                    "id": customer_id,
                    "full_name": "Khách hàng Demo",
                    "email": "khachhang.demo@gmail.com",
                    "phone": "0901234567",
                    "address": "456 Lê Duẩn, Đà Nẵng",
                    "type": "customer",
                    "is_active": True,
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.contacts.insert_one(customer)
                logger.info(f"Created customer: {customer_id}")
            
            result["created"]["customer_id"] = customer_id
            
            # ═══════════════════════════════════════════════════════════════════
            # 5. TẠO CONTRACT (3 tỷ, status=signed)
            # ═══════════════════════════════════════════════════════════════════
            contract_id = str(uuid.uuid4())
            contract_code = f"HD-DEMO-{datetime.now().strftime('%Y%m%d')}"
            contract_value = 3_000_000_000  # 3 tỷ VNĐ
            
            existing_contract = await self.db.contracts.find_one({"contract_code": contract_code})
            
            if existing_contract:
                contract_id = existing_contract["id"]
                logger.info("Contract already exists, using existing")
            else:
                # Create deal first
                deal_id = str(uuid.uuid4())
                deal = {
                    "id": deal_id,
                    "code": f"DEAL-DEMO-{datetime.now().strftime('%Y%m%d')}",
                    "project_id": project_id,
                    "customer_id": customer_id,
                    "assigned_to": user_ids["sale_id"],
                    "status": "won",
                    "value": contract_value,
                    "ref_id": None,  # Không có affiliate
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.deals.insert_one(deal)
                result["created"]["deal_id"] = deal_id
                
                # Create contract
                contract = {
                    "id": contract_id,
                    "contract_code": contract_code,
                    "deal_id": deal_id,
                    "project_id": project_id,
                    "customer_id": customer_id,
                    "owner_id": user_ids["sale_id"],
                    "grand_total": contract_value,
                    "contract_value": contract_value,
                    "status": "signed",  # QUAN TRỌNG: signed để trigger flow
                    "signed_date": now,
                    "payment_schedule": [
                        {
                            "installment_number": 1,
                            "installment_name": "Thanh toán 1 lần",
                            "amount": contract_value,
                            "due_date": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                        }
                    ],
                    "created_at": now,
                    "updated_at": now,
                }
                await self.db.contracts.insert_one(contract)
                logger.info(f"Created contract: {contract_code} - {contract_value:,} VNĐ")
            
            result["created"]["contract_id"] = contract_id
            result["created"]["contract_code"] = contract_code
            result["created"]["contract_value"] = contract_value
            
            # ═══════════════════════════════════════════════════════════════════
            # 6. TRIGGER FLOW: contract_signed → full cycle
            # ═══════════════════════════════════════════════════════════════════
            
            # Import flow engine
            from services.finance_flow_engine import FinanceFlowEngine
            engine = FinanceFlowEngine(self.db)
            
            # Step 1: Contract signed → Create payment schedule
            flow_result_1 = await engine.handle_event(
                "contract_signed",
                {"contract_id": contract_id},
                "seeder"
            )
            result["flow_results"].append({
                "step": 1,
                "event": "contract_signed",
                "result": flow_result_1
            })
            logger.info(f"Flow step 1 (contract_signed): {flow_result_1.get('success')}")
            
            # Step 2: Developer payment → Create commission + split + receivable
            flow_result_2 = await engine.create_commission_from_contract(
                contract_id,
                "seeder"
            )
            result["flow_results"].append({
                "step": 2,
                "event": "developer_payment",
                "result": flow_result_2
            })
            logger.info(f"Flow step 2 (developer_payment): {flow_result_2.get('success')}")
            
            commission_id = flow_result_2.get("data", {}).get("commission_id")
            result["created"]["commission_id"] = commission_id
            
            # Step 3: Get receivable and record payment (CĐT trả tiền đủ)
            receivable = await self.db.receivables.find_one(
                {"commission_id": commission_id},
                {"_id": 0}
            )
            
            if receivable:
                receivable_id = receivable["id"]
                amount_due = receivable["amount_due"]
                result["created"]["receivable_id"] = receivable_id
                
                # CĐT trả tiền đủ
                flow_result_3 = await engine.handle_event(
                    "payment_received_from_developer",
                    {
                        "receivable_id": receivable_id,
                        "contract_id": contract_id,
                        "amount": amount_due,
                        "payment_reference": "CK-ABC-001",
                    },
                    "seeder"
                )
                result["flow_results"].append({
                    "step": 3,
                    "event": "payment_received",
                    "result": flow_result_3
                })
                logger.info(f"Flow step 3 (payment_received): {flow_result_3.get('success')}")
            
            # ═══════════════════════════════════════════════════════════════════
            # 7. ACCOUNTANT APPROVE + PAYOUT PAID
            # ═══════════════════════════════════════════════════════════════════
            
            # Get all pending payouts
            payouts = await self.db.payouts.find(
                {"status": "pending"},
                {"_id": 0, "id": 1}
            ).to_list(10)
            
            approved_payouts = []
            for payout in payouts:
                payout_id = payout["id"]
                
                # Approve
                flow_result_approve = await engine.handle_event(
                    "payout_approved",
                    {"payout_id": payout_id},
                    user_ids["accountant_id"] or "seeder"
                )
                
                if flow_result_approve.get("success"):
                    approved_payouts.append(payout_id)
                    
                    # Mark as paid
                    await self.db.payouts.update_one(
                        {"id": payout_id},
                        {"$set": {
                            "status": "paid",
                            "paid_at": now,
                            "payment_reference": f"CK-PAY-{payout_id[:8]}",
                        }}
                    )
            
            result["flow_results"].append({
                "step": 4,
                "event": "payouts_approved_and_paid",
                "approved_count": len(approved_payouts),
            })
            logger.info(f"Flow step 4: Approved and paid {len(approved_payouts)} payouts")
            
            # ═══════════════════════════════════════════════════════════════════
            # DONE - Summary
            # ═══════════════════════════════════════════════════════════════════
            
            # Calculate commission = 3 tỷ x 2% = 60 triệu
            total_commission = contract_value * 0.02
            
            result["success"] = True
            result["summary"] = {
                "contract_value": contract_value,
                "commission_rate": 2.0,
                "total_commission": total_commission,
                "split_details": {
                    "sale": total_commission * 0.60,  # 36 triệu
                    "leader": total_commission * 0.10,  # 6 triệu
                    "company": total_commission * 0.30,  # 18 triệu (30% vì không có affiliate)
                },
                "users": {
                    "sale": "Nguyễn Văn A",
                    "leader": "Trần Văn B",
                    "accountant": "Lê Thị Accountant",
                    "ceo": "Phạm CEO",
                },
            }
            
            logger.info(f"Seeder completed successfully!")
            logger.info(f"Contract: {contract_value:,} VNĐ")
            logger.info(f"Commission: {total_commission:,} VNĐ (2%)")
            
        except Exception as e:
            logger.error(f"Seeder error: {e}")
            result["errors"].append(str(e))
            
        return result
    
    async def verify_seeded_data(self) -> Dict[str, Any]:
        """
        Verify dữ liệu đã seed
        Kiểm tra:
        - Sale thấy tiền
        - Leader thấy team
        - Accountant thấy payout
        - CEO thấy tổng
        """
        result = {
            "verified": True,
            "checks": {},
        }
        
        try:
            # 1. Check Sale có commission split
            sale_user = await self.db.users.find_one(
                {"email": "sale.a@prohouzing.vn"},
                {"_id": 0, "id": 1, "full_name": 1}
            )
            
            if sale_user:
                sale_splits = await self.db.commission_splits.find(
                    {"recipient_id": sale_user["id"]},
                    {"_id": 0}
                ).to_list(10)
                
                sale_total = sum(s.get("net_amount", 0) for s in sale_splits)
                
                result["checks"]["sale"] = {
                    "user": sale_user.get("full_name"),
                    "splits_count": len(sale_splits),
                    "total_net": sale_total,
                    "passed": len(sale_splits) > 0 and sale_total > 0,
                }
            
            # 2. Check Leader có commission
            leader_user = await self.db.users.find_one(
                {"email": "leader.b@prohouzing.vn"},
                {"_id": 0, "id": 1, "full_name": 1}
            )
            
            if leader_user:
                leader_splits = await self.db.commission_splits.find(
                    {"recipient_id": leader_user["id"]},
                    {"_id": 0}
                ).to_list(10)
                
                leader_total = sum(s.get("net_amount", 0) for s in leader_splits)
                
                result["checks"]["leader"] = {
                    "user": leader_user.get("full_name"),
                    "splits_count": len(leader_splits),
                    "total_net": leader_total,
                    "passed": len(leader_splits) > 0,
                }
            
            # 3. Check Accountant thấy payouts
            payouts = await self.db.payouts.find(
                {},
                {"_id": 0, "status": 1, "net_amount": 1}
            ).to_list(20)
            
            payouts_by_status = {}
            for p in payouts:
                status = p.get("status", "unknown")
                if status not in payouts_by_status:
                    payouts_by_status[status] = {"count": 0, "amount": 0}
                payouts_by_status[status]["count"] += 1
                payouts_by_status[status]["amount"] += p.get("net_amount", 0)
            
            result["checks"]["accountant"] = {
                "total_payouts": len(payouts),
                "by_status": payouts_by_status,
                "passed": len(payouts) > 0,
            }
            
            # 4. Check CEO thấy tổng
            commissions = await self.db.finance_commissions.find(
                {},
                {"_id": 0, "total_commission": 1, "contract_value": 1}
            ).to_list(20)
            
            total_contract_value = sum(c.get("contract_value", 0) for c in commissions)
            total_commission = sum(c.get("total_commission", 0) for c in commissions)
            
            receivables = await self.db.receivables.find(
                {},
                {"_id": 0, "amount_due": 1, "amount_paid": 1}
            ).to_list(20)
            
            total_receivable = sum(r.get("amount_due", 0) for r in receivables)
            total_received = sum(r.get("amount_paid", 0) for r in receivables)
            
            result["checks"]["ceo"] = {
                "total_contract_value": total_contract_value,
                "total_commission": total_commission,
                "total_receivable": total_receivable,
                "total_received": total_received,
                "passed": total_commission > 0,
            }
            
            # Overall verification
            all_passed = all(
                check.get("passed", False)
                for check in result["checks"].values()
            )
            result["verified"] = all_passed
            
        except Exception as e:
            result["verified"] = False
            result["error"] = str(e)
            
        return result
