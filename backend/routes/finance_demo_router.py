"""
ProHouzing Finance Sample Data & Role-Based Dashboard
Prompt 20/20 - Real Data Integration

Sample Data:
- 1 Developer (Novaland)
- 1 Project (The Grand Manhattan, 2% commission)
- 1 Team (Sales Team A)
- 1 Leader (Nguyễn Văn A)
- 1 Sale (Trần Thị B)
- 1 Customer (Lê Văn C)
- 1 Contract (3 tỷ)
- Full flow: Contract → Payment → Commission → Split → Payout
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/finance/demo", tags=["finance-demo"])

# Database reference
_db = None
_flow_engine = None


def set_database(database):
    """Set the database reference"""
    global _db, _flow_engine
    _db = database
    
    from services.finance_flow_engine import FinanceFlowEngine
    _flow_engine = FinanceFlowEngine(database)


def get_db():
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


def get_flow_engine():
    if _flow_engine is None:
        raise HTTPException(status_code=500, detail="Flow engine not initialized")
    return _flow_engine


# ═══════════════════════════════════════════════════════════════════════════════
# SAMPLE DATA CREATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/seed-sample-data")
async def seed_sample_data():
    """
    Tạo sample data thực tế:
    - 1 Developer + 1 Project (2% commission)
    - 1 Team + 1 Leader + 1 Sale
    - 1 Customer
    - 1 Contract (3 tỷ)
    
    Sau đó chạy full flow
    """
    db = get_db()
    engine = get_flow_engine()
    now = datetime.now(timezone.utc)
    
    result = {
        "created": {},
        "flow_results": {},
        "summary": {},
    }
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 1. CREATE DEVELOPER
    # ═══════════════════════════════════════════════════════════════════════════
    
    developer_id = "dev-novaland-001"
    developer = await db.developers.find_one({"id": developer_id})
    
    if not developer:
        developer = {
            "id": developer_id,
            "code": "NVL",
            "name": "Công ty CP Tập đoàn Đầu tư Địa ốc No Va (Novaland)",
            "short_name": "Novaland",
            "address": "65 Nguyễn Du, P. Bến Nghé, Q.1, TP.HCM",
            "tax_code": "0301444753",
            "phone": "028 3821 6628",
            "email": "info@novaland.com.vn",
            "website": "https://novaland.com.vn",
            "representative": "Bùi Thành Nhơn",
            "representative_title": "Chủ tịch HĐQT",
            "created_at": now.isoformat(),
        }
        await db.developers.insert_one(developer)
        result["created"]["developer"] = developer_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 2. CREATE PROJECT
    # ═══════════════════════════════════════════════════════════════════════════
    
    project_id = "proj-grand-manhattan-001"
    project = await db.projects_master.find_one({"id": project_id})
    
    if not project:
        project = {
            "id": project_id,
            "code": "TGM-Q1",
            "name": "The Grand Manhattan",
            "developer_id": developer_id,
            "address": "100 Cô Giang, P. Cô Giang, Q.1, TP.HCM",
            "district": "Quận 1",
            "city": "TP. Hồ Chí Minh",
            "type": "apartment",
            "status": "selling",
            "total_units": 999,
            "available_units": 450,
            "price_from": 6000000000,  # 6 tỷ
            "price_to": 25000000000,    # 25 tỷ
            "handover_date": "2025-12-31",
            "description": "Dự án căn hộ hạng sang tại trung tâm Q.1",
            "created_at": now.isoformat(),
        }
        await db.projects_master.insert_one(project)
        result["created"]["project"] = project_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 3. CREATE PROJECT COMMISSION (2%)
    # ═══════════════════════════════════════════════════════════════════════════
    
    commission_config_id = "pc-tgm-001"
    pc = await db.project_commissions.find_one({"id": commission_config_id})
    
    if not pc:
        pc = {
            "id": commission_config_id,
            "project_id": project_id,
            "commission_rate": 2.0,  # 2%
            "effective_from": (now - timedelta(days=30)).isoformat(),
            "effective_to": None,
            "is_active": True,
            "notes": "Hoa hồng tiêu chuẩn 2%",
            "created_by": "system",
            "created_at": now.isoformat(),
        }
        await db.project_commissions.insert_one(pc)
        result["created"]["project_commission"] = commission_config_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 4. CREATE TEAM
    # ═══════════════════════════════════════════════════════════════════════════
    
    team_id = "team-sales-a-001"
    team = await db.teams.find_one({"id": team_id})
    
    leader_id = "user-leader-001"
    
    if not team:
        team = {
            "id": team_id,
            "name": "Sales Team A",
            "code": "STA",
            "leader_id": leader_id,
            "department": "sales",
            "created_at": now.isoformat(),
        }
        await db.teams.insert_one(team)
        result["created"]["team"] = team_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 5. CREATE LEADER
    # ═══════════════════════════════════════════════════════════════════════════
    
    leader = await db.users.find_one({"id": leader_id})
    
    if not leader:
        leader = {
            "id": leader_id,
            "email": "leader@prohouzing.vn",
            "full_name": "Nguyễn Văn A",
            "phone": "0901234567",
            "role": "manager",
            "team_id": team_id,
            "department": "sales",
            "is_team_leader": True,
            "bank_account": "9704229201234567",
            "bank_name": "VietcomBank",
            "created_at": now.isoformat(),
        }
        await db.users.insert_one(leader)
        result["created"]["leader"] = leader_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 6. CREATE SALE
    # ═══════════════════════════════════════════════════════════════════════════
    
    sale_id = "user-sale-001"
    sale = await db.users.find_one({"id": sale_id})
    
    if not sale:
        sale = {
            "id": sale_id,
            "email": "sale@prohouzing.vn",
            "full_name": "Trần Thị B",
            "phone": "0907654321",
            "role": "sales",
            "team_id": team_id,
            "department": "sales",
            "is_team_leader": False,
            "bank_account": "9704229209876543",
            "bank_name": "TechcomBank",
            "created_at": now.isoformat(),
        }
        await db.users.insert_one(sale)
        result["created"]["sale"] = sale_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 7. CREATE CUSTOMER
    # ═══════════════════════════════════════════════════════════════════════════
    
    customer_id = "cust-levanc-001"
    customer = await db.contacts.find_one({"id": customer_id})
    
    if not customer:
        customer = {
            "id": customer_id,
            "full_name": "Lê Văn C",
            "email": "levanc@email.com",
            "phone": "0912345678",
            "address": "123 Nguyễn Huệ, Q.1, TP.HCM",
            "id_number": "079099001234",
            "id_issue_date": "2020-01-15",
            "id_issue_place": "Cục CSĐKQL Cư trú và DLQG",
            "type": "customer",
            "status": "active",
            "created_at": now.isoformat(),
        }
        await db.contacts.insert_one(customer)
        result["created"]["customer"] = customer_id
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 8. CREATE CONTRACT (3 tỷ)
    # ═══════════════════════════════════════════════════════════════════════════
    
    contract_id = "contract-demo-001"
    contract = await db.contracts.find_one({"id": contract_id})
    
    contract_value = 3000000000  # 3 tỷ
    
    if not contract:
        contract = {
            "id": contract_id,
            "contract_code": f"HD-TGM-{now.strftime('%Y%m')}-0001",
            "contract_type": "purchase",
            "status": "signed",
            "is_locked": True,
            
            # Parties
            "customer_id": customer_id,
            "project_id": project_id,
            "developer_id": developer_id,
            "owner_id": sale_id,
            
            # Product
            "product_id": "unit-tgm-1001",
            "product_name": "Căn hộ 2PN - Tầng 10 - Block A",
            "product_code": "A-1001",
            
            # Value
            "base_price": contract_value,
            "discount": 0,
            "grand_total": contract_value,
            "contract_value": contract_value,
            
            # Payment schedule
            "payment_schedule": [
                {
                    "installment_number": 1,
                    "installment_name": "Đợt 1 - Đặt cọc",
                    "amount": contract_value * 0.1,  # 300 triệu
                    "due_date": (now + timedelta(days=7)).isoformat(),
                },
                {
                    "installment_number": 2,
                    "installment_name": "Đợt 2 - Ký HĐMB",
                    "amount": contract_value * 0.4,  # 1.2 tỷ
                    "due_date": (now + timedelta(days=30)).isoformat(),
                },
                {
                    "installment_number": 3,
                    "installment_name": "Đợt 3 - Bàn giao",
                    "amount": contract_value * 0.5,  # 1.5 tỷ
                    "due_date": (now + timedelta(days=180)).isoformat(),
                },
            ],
            
            # Signing info
            "signed_date": now.isoformat(),
            "signing_status": "completed",
            "signed_by_customer_id": customer_id,
            "signed_by_customer_name": "Lê Văn C",
            "customer_signed_at": now.isoformat(),
            
            # Deal link (sale assigned)
            "deal_id": "deal-demo-001",
            
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }
        await db.contracts.insert_one(contract)
        result["created"]["contract"] = contract_id
        
        # Create deal
        deal = await db.deals.find_one({"id": "deal-demo-001"})
        if not deal:
            deal = {
                "id": "deal-demo-001",
                "code": f"D-{now.strftime('%Y%m')}-0001",
                "title": "Deal The Grand Manhattan - A1001",
                "customer_id": customer_id,
                "project_id": project_id,
                "product_id": "unit-tgm-1001",
                "assigned_to": sale_id,
                "status": "won",
                "value": contract_value,
                "created_at": now.isoformat(),
            }
            await db.deals.insert_one(deal)
            result["created"]["deal"] = "deal-demo-001"
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 9. RUN FULL FINANCE FLOW
    # ═══════════════════════════════════════════════════════════════════════════
    
    # Step 1: Contract signed → Create payment schedule
    flow1 = await engine.handle_event(
        "contract_signed",
        {"contract_id": contract_id},
        "system"
    )
    result["flow_results"]["contract_signed"] = flow1
    
    # Step 2: Developer confirm payment → Create commission + split + receivable
    flow2 = await engine.create_commission_from_contract(contract_id, "system")
    result["flow_results"]["developer_payment"] = flow2
    
    # Get commission_id và receivable_id
    commission = await db.finance_commissions.find_one({"contract_id": contract_id})
    receivable = await db.receivables.find_one({"contract_id": contract_id})
    
    if commission:
        result["summary"]["commission_id"] = commission.get("id")
        result["summary"]["commission_code"] = commission.get("code")
        result["summary"]["total_commission"] = commission.get("total_commission")
    
    if receivable:
        result["summary"]["receivable_id"] = receivable.get("id")
        result["summary"]["receivable_code"] = receivable.get("code")
        result["summary"]["amount_due"] = receivable.get("amount_due")
        
        # Step 3: CĐT trả tiền → Create payouts
        flow3 = await engine.handle_event(
            "payment_received_from_developer",
            {
                "receivable_id": receivable.get("id"),
                "contract_id": contract_id,
                "amount": receivable.get("amount_due"),
                "payment_reference": "UNC-NOVALAND-001",
            },
            "system"
        )
        result["flow_results"]["receivable_paid"] = flow3
        
        # Update receivable status to paid
        await db.receivables.update_one(
            {"id": receivable.get("id")},
            {"$set": {
                "amount_paid": receivable.get("amount_due"),
                "amount_remaining": 0,
                "status": "paid",
            }}
        )
    
    # Get payouts
    payouts = await db.payouts.find(
        {"commission_split_id": {"$exists": True}},
        {"_id": 0, "id": 1, "code": 1, "recipient_id": 1, "recipient_role": 1, "net_amount": 1, "status": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    result["summary"]["payouts"] = payouts
    result["summary"]["payouts_count"] = len(payouts)
    
    # Get splits
    splits = await db.commission_splits.find(
        {},
        {"_id": 0, "id": 1, "code": 1, "recipient_role": 1, "gross_amount": 1, "tax_amount": 1, "net_amount": 1, "status": 1}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    result["summary"]["commission_splits"] = splits
    
    # Calculate totals
    commission_total = commission.get("total_commission", 0) if commission else 0
    result["summary"]["calculation"] = {
        "contract_value": contract_value,
        "commission_rate": "2%",
        "total_commission": commission_total,
        "split_sale_60": commission_total * 0.6,
        "split_leader_10": commission_total * 0.1,
        "split_company_30": commission_total * 0.3,
        "sale_tax_tncn_10": commission_total * 0.6 * 0.1,
        "leader_tax_tncn_10": commission_total * 0.1 * 0.1,
        "sale_net": commission_total * 0.6 * 0.9,
        "leader_net": commission_total * 0.1 * 0.9,
    }
    
    return result


@router.post("/approve-all-payouts")
async def approve_all_payouts():
    """
    Kế toán duyệt tất cả payouts pending
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()
    
    # Get all pending payouts
    pending = await db.payouts.find(
        {"status": "pending"},
        {"_id": 0, "id": 1}
    ).to_list(100)
    
    approved_count = 0
    
    for p in pending:
        await db.payouts.update_one(
            {"id": p["id"]},
            {"$set": {
                "status": "approved",
                "approved_by": "accountant",
                "approved_at": now,
                "updated_at": now,
            }}
        )
        approved_count += 1
    
    return {
        "success": True,
        "approved_count": approved_count,
    }


@router.delete("/clear-sample-data")
async def clear_sample_data():
    """
    Xóa sample data (để test lại)
    """
    db = get_db()
    
    # Clear finance data only
    collections = [
        "payment_trackings",
        "finance_commissions",
        "commission_splits",
        "receivables",
        "receivable_payments",
        "payouts",
        "finance_invoices",
        "tax_records",
        "finance_events",
        "finance_alerts",
    ]
    
    deleted = {}
    for col in collections:
        result = await db[col].delete_many({})
        deleted[col] = result.deleted_count
    
    # Also clear demo contract and deal
    await db.contracts.delete_many({"id": "contract-demo-001"})
    await db.deals.delete_many({"id": "deal-demo-001"})
    
    return {
        "success": True,
        "deleted": deleted,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ROLE-BASED DASHBOARDS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/sale/{user_id}")
async def get_sale_dashboard(user_id: str):
    """
    SALE DASHBOARD
    - Thu nhập của tôi
    - Payout pending
    - Lịch sử nhận tiền
    
    Max 5 blocks
    """
    db = get_db()
    now = datetime.now(timezone.utc)
    
    # Get user info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1})
    user_name = user.get("full_name", "") if user else ""
    
    # Get all splits for this user
    splits = await db.commission_splits.find(
        {"recipient_id": user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Calculate totals
    total_gross = sum(s.get("gross_amount", 0) for s in splits)
    total_tax = sum(s.get("tax_amount", 0) for s in splits)
    total_net = sum(s.get("net_amount", 0) for s in splits)
    
    # Get payouts
    payouts = await db.payouts.find(
        {"recipient_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    
    pending_amount = sum(p.get("net_amount", 0) for p in payouts if p.get("status") == "pending")
    approved_amount = sum(p.get("net_amount", 0) for p in payouts if p.get("status") == "approved")
    paid_amount = sum(p.get("net_amount", 0) for p in payouts if p.get("status") == "paid")
    
    # Recent paid history
    paid_history = [
        {
            "code": p.get("code"),
            "amount": p.get("net_amount"),
            "paid_at": p.get("paid_at"),
        }
        for p in payouts if p.get("status") == "paid"
    ][:5]
    
    return {
        "role": "sale",
        "user_id": user_id,
        "user_name": user_name,
        "blocks": {
            "my_income": {
                "title": "Thu nhập của tôi",
                "gross": total_gross,
                "tax": total_tax,
                "net": total_net,
            },
            "payout_status": {
                "title": "Trạng thái chi trả",
                "pending": pending_amount,
                "approved": approved_amount,
                "paid": paid_amount,
            },
            "payment_history": {
                "title": "Lịch sử nhận tiền",
                "items": paid_history,
            },
        },
    }


@router.get("/dashboard/leader/{user_id}")
async def get_leader_dashboard(user_id: str):
    """
    LEADER DASHBOARD
    - Tổng team commission
    - Top sale
    - Pending payout team
    
    Max 5 blocks
    """
    db = get_db()
    
    # Get leader info
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "full_name": 1, "team_id": 1})
    user_name = user.get("full_name", "") if user else ""
    team_id = user.get("team_id") if user else None
    
    # Get team members
    team_members = []
    if team_id:
        members = await db.users.find(
            {"team_id": team_id},
            {"_id": 0, "id": 1, "full_name": 1}
        ).to_list(50)
        team_members = [m["id"] for m in members]
    
    # Get all splits for team
    team_splits = await db.commission_splits.find(
        {"recipient_id": {"$in": team_members}, "recipient_role": "sale"},
        {"_id": 0, "recipient_id": 1, "gross_amount": 1, "net_amount": 1}
    ).to_list(500)
    
    # Calculate team totals
    team_total_commission = sum(s.get("gross_amount", 0) for s in team_splits)
    
    # My commission as leader
    my_splits = await db.commission_splits.find(
        {"recipient_id": user_id, "recipient_role": "leader"},
        {"_id": 0, "gross_amount": 1, "net_amount": 1}
    ).to_list(100)
    
    my_commission = sum(s.get("net_amount", 0) for s in my_splits)
    
    # Top sales in team
    sale_totals = {}
    for s in team_splits:
        rid = s.get("recipient_id")
        sale_totals[rid] = sale_totals.get(rid, 0) + s.get("gross_amount", 0)
    
    # Get names
    top_sales = []
    for rid, amount in sorted(sale_totals.items(), key=lambda x: -x[1])[:5]:
        user_doc = await db.users.find_one({"id": rid}, {"_id": 0, "full_name": 1})
        top_sales.append({
            "user_id": rid,
            "name": user_doc.get("full_name", "") if user_doc else "",
            "commission": amount,
        })
    
    # Pending payouts for team
    pending_payouts = await db.payouts.find(
        {"recipient_id": {"$in": team_members}, "status": "pending"},
        {"_id": 0, "recipient_id": 1, "net_amount": 1}
    ).to_list(100)
    
    team_pending = sum(p.get("net_amount", 0) for p in pending_payouts)
    
    return {
        "role": "leader",
        "user_id": user_id,
        "user_name": user_name,
        "team_id": team_id,
        "blocks": {
            "my_commission": {
                "title": "Hoa hồng Leader",
                "amount": my_commission,
            },
            "team_commission": {
                "title": "Tổng HH Team",
                "amount": team_total_commission,
                "member_count": len(team_members),
            },
            "top_sales": {
                "title": "Top Sale",
                "items": top_sales,
            },
            "team_pending": {
                "title": "Pending Payout Team",
                "amount": team_pending,
                "count": len(pending_payouts),
            },
        },
    }


@router.get("/dashboard/ceo")
async def get_ceo_dashboard():
    """
    CEO DASHBOARD
    - Tổng doanh thu (giá trị HĐ)
    - Tổng commission
    - Lợi nhuận (company share)
    - Công nợ
    
    Max 5 blocks
    """
    db = get_db()
    
    # Get all commissions
    commissions = await db.finance_commissions.find(
        {},
        {"_id": 0, "contract_value": 1, "total_commission": 1}
    ).to_list(1000)
    
    total_contract_value = sum(c.get("contract_value", 0) for c in commissions)
    total_commission = sum(c.get("total_commission", 0) for c in commissions)
    
    # Company profit (from splits)
    company_splits = await db.commission_splits.find(
        {"recipient_role": "company"},
        {"_id": 0, "gross_amount": 1}
    ).to_list(1000)
    
    company_profit = sum(s.get("gross_amount", 0) for s in company_splits)
    
    # Receivables
    receivables = await db.receivables.find(
        {},
        {"_id": 0, "amount_due": 1, "amount_paid": 1, "status": 1}
    ).to_list(1000)
    
    total_receivable = sum(r.get("amount_due", 0) for r in receivables)
    total_collected = sum(r.get("amount_paid", 0) for r in receivables)
    overdue = sum(r.get("amount_due", 0) - r.get("amount_paid", 0) for r in receivables if r.get("status") == "overdue")
    
    # Tax
    vat_total = total_commission * 0.1  # 10% VAT
    
    return {
        "role": "ceo",
        "blocks": {
            "revenue": {
                "title": "Tổng giá trị HĐ",
                "amount": total_contract_value,
                "deals_count": len(commissions),
            },
            "commission": {
                "title": "Tổng hoa hồng",
                "amount": total_commission,
                "rate": "~2%",
            },
            "company_profit": {
                "title": "Lợi nhuận công ty",
                "amount": company_profit,
                "note": "25-30% tổng HH",
            },
            "receivables": {
                "title": "Công nợ",
                "total": total_receivable,
                "collected": total_collected,
                "pending": total_receivable - total_collected,
                "overdue": overdue,
            },
            "tax": {
                "title": "Thuế VAT ước tính",
                "amount": vat_total,
            },
        },
    }


@router.get("/dashboard/accountant")
async def get_accountant_dashboard():
    """
    ACCOUNTANT DASHBOARD
    - Payout cần duyệt
    - Công nợ
    - Thuế
    
    Max 5 blocks
    """
    db = get_db()
    
    # Pending payouts
    pending_payouts = await db.payouts.find(
        {"status": "pending"},
        {"_id": 0, "id": 1, "code": 1, "recipient_id": 1, "recipient_role": 1, "net_amount": 1}
    ).to_list(100)
    
    total_pending = sum(p.get("net_amount", 0) for p in pending_payouts)
    
    # Enrich with names
    pending_list = []
    for p in pending_payouts[:10]:
        user = await db.users.find_one({"id": p.get("recipient_id")}, {"_id": 0, "full_name": 1})
        pending_list.append({
            "id": p.get("id"),
            "code": p.get("code"),
            "recipient_name": user.get("full_name", "") if user else "",
            "role": p.get("recipient_role"),
            "amount": p.get("net_amount"),
        })
    
    # Approved but not paid
    approved_payouts = await db.payouts.find(
        {"status": "approved"},
        {"_id": 0, "net_amount": 1}
    ).to_list(100)
    
    total_approved = sum(p.get("net_amount", 0) for p in approved_payouts)
    
    # Receivables
    receivables = await db.receivables.find(
        {"status": {"$in": ["pending", "confirmed", "partial"]}},
        {"_id": 0, "code": 1, "amount_remaining": 1, "status": 1, "developer_id": 1}
    ).to_list(100)
    
    total_pending_receivable = sum(r.get("amount_remaining", 0) for r in receivables)
    
    # Tax summary
    tax_records = await db.tax_records.find(
        {},
        {"_id": 0, "tax_type": 1, "tax_amount": 1}
    ).to_list(1000)
    
    vat_total = sum(t.get("tax_amount", 0) for t in tax_records if t.get("tax_type") == "vat_output")
    tncn_total = sum(t.get("tax_amount", 0) for t in tax_records if t.get("tax_type") == "tncn")
    
    return {
        "role": "accountant",
        "blocks": {
            "pending_approval": {
                "title": "Payout chờ duyệt",
                "count": len(pending_payouts),
                "total": total_pending,
                "items": pending_list,
            },
            "approved_unpaid": {
                "title": "Đã duyệt chưa trả",
                "count": len(approved_payouts),
                "total": total_approved,
            },
            "receivables": {
                "title": "Công nợ chưa thu",
                "count": len(receivables),
                "total": total_pending_receivable,
            },
            "tax": {
                "title": "Thuế",
                "vat_output": vat_total,
                "tncn_collected": tncn_total,
            },
        },
    }
