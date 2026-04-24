"""
ProHouzing Sales API
APIs cho Module Bán hàng: Campaigns, Projects, Products, Bookings, Deals
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid

from sales_models import (
    CampaignStatus, CampaignType, ProductType, ProductStatus,
    BookingStatus, PaymentStatus, DealStage,
    SalesCampaignCreate, SalesCampaignResponse,
    SalesProjectCreate, SalesProjectResponse,
    ProductUnitCreate, ProductUnitResponse,
    BookingCreate, BookingResponse,
    PaymentCreate, PaymentResponse,
    DealCreate, DealResponse,
    SalesReportResponse
)

sales_router = APIRouter(prefix="/sales", tags=["Sales Management"])

from server import db, get_current_user

# ==================== SALES CAMPAIGN APIs ====================

@sales_router.post("/campaigns", response_model=SalesCampaignResponse)
async def create_sales_campaign(
    data: SalesCampaignCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo chiến dịch mở bán"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    campaign_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get project info
    project = await db.sales_projects.find_one({"id": data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get manager info
    manager_name = None
    if data.manager_id:
        manager = await db.users.find_one({"id": data.manager_id}, {"_id": 0, "full_name": 1})
        manager_name = manager["full_name"] if manager else None
    
    # Determine status based on dates
    start = datetime.fromisoformat(data.start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(data.end_date.replace('Z', '+00:00'))
    today = datetime.now(timezone.utc)
    
    if today < start:
        status = CampaignStatus.UPCOMING
    elif today > end:
        status = CampaignStatus.ENDED
    else:
        status = CampaignStatus.ACTIVE
    
    campaign_doc = {
        "id": campaign_id,
        "name": data.name,
        "code": data.code,
        "type": data.type.value,
        "status": status.value,
        "description": data.description,
        
        "project_id": data.project_id,
        "project_name": project["name"],
        
        "start_date": data.start_date,
        "end_date": data.end_date,
        
        "target_units": data.target_units,
        "target_revenue": data.target_revenue,
        
        "sold_units": 0,
        "actual_revenue": 0,
        "booking_count": 0,
        
        "units_progress": 0,
        "revenue_progress": 0,
        
        "promotions": data.promotions,
        "commission_rate": data.commission_rate,
        "bonus_conditions": data.bonus_conditions,
        
        "product_ids": data.product_ids,
        "total_products": len(data.product_ids),
        "available_products": len(data.product_ids),
        
        "manager_id": data.manager_id,
        "manager_name": manager_name,
        "sales_team_ids": data.sales_team_ids,
        
        "marketing_budget": data.marketing_budget,
        "marketing_channels": data.marketing_channels,
        
        "banner_url": data.banner_url,
        "landing_page_url": data.landing_page_url,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.sales_campaigns.insert_one(campaign_doc)
    return SalesCampaignResponse(**campaign_doc)

@sales_router.get("/campaigns", response_model=List[SalesCampaignResponse])
async def get_sales_campaigns(
    status: Optional[CampaignStatus] = None,
    project_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách chiến dịch mở bán"""
    query = {}
    if status:
        query["status"] = status.value
    if project_id:
        query["project_id"] = project_id
    
    campaigns = await db.sales_campaigns.find(query, {"_id": 0}).sort("start_date", -1).to_list(100)
    return [SalesCampaignResponse(**c) for c in campaigns]

@sales_router.get("/campaigns/{campaign_id}", response_model=SalesCampaignResponse)
async def get_sales_campaign(
    campaign_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết chiến dịch"""
    campaign = await db.sales_campaigns.find_one({"id": campaign_id}, {"_id": 0})
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return SalesCampaignResponse(**campaign)

# ==================== SALES PROJECT APIs ====================

@sales_router.post("/projects", response_model=SalesProjectResponse)
async def create_sales_project(
    data: SalesProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo dự án BĐS"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    project_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    project_doc = {
        "id": project_id,
        "name": data.name,
        "code": data.code,
        "description": data.description,
        
        "address": data.address,
        "district": data.district,
        "city": data.city,
        "full_address": f"{data.address}, {data.district}, {data.city}",
        
        "developer_name": data.developer_name,
        "investor_name": data.investor_name,
        
        "total_units": data.total_units,
        "total_area": data.total_area,
        "floors": data.floors,
        "blocks": data.blocks,
        
        "available_units": data.total_units,
        "sold_units": 0,
        "booking_units": 0,
        
        "construction_start": data.construction_start,
        "expected_handover": data.expected_handover,
        
        "price_from": data.price_from,
        "price_to": data.price_to,
        "price_range_label": f"{data.price_from/1000000:.0f}M - {data.price_to/1000000:.0f}M" if data.price_from and data.price_to else "Liên hệ",
        
        "images": data.images,
        "videos": data.videos,
        "brochure_url": data.brochure_url,
        
        "amenities": data.amenities,
        "legal_status": data.legal_status,
        "status": data.status,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.sales_projects.insert_one(project_doc)
    return SalesProjectResponse(**project_doc)

@sales_router.get("/projects", response_model=List[SalesProjectResponse])
async def get_sales_projects(
    status: Optional[str] = None,
    city: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách dự án"""
    query = {}
    if status:
        query["status"] = status
    if city:
        query["city"] = city
    
    projects = await db.sales_projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [SalesProjectResponse(**p) for p in projects]

@sales_router.get("/projects/{project_id}", response_model=SalesProjectResponse)
async def get_sales_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết dự án"""
    project = await db.sales_projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return SalesProjectResponse(**project)

# ==================== PRODUCT UNIT APIs ====================

@sales_router.post("/products", response_model=ProductUnitResponse)
async def create_product_unit(
    data: ProductUnitCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo sản phẩm (căn hộ/nhà/đất)"""
    if current_user["role"] not in ["bod", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    product_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get project info
    project = await db.sales_projects.find_one({"id": data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get campaign info
    campaign_name = None
    if data.campaign_id:
        campaign = await db.sales_campaigns.find_one({"id": data.campaign_id}, {"_id": 0})
        campaign_name = campaign["name"] if campaign else None
    
    # Calculate final price
    discount_amount = data.total_price * (data.discount_percent / 100) if data.discount_percent else data.discount_amount
    final_price = data.total_price - discount_amount
    
    product_doc = {
        "id": product_id,
        "project_id": data.project_id,
        "project_name": project["name"],
        "campaign_id": data.campaign_id,
        "campaign_name": campaign_name,
        
        "code": data.code,
        "name": data.name,
        "type": data.type.value,
        "status": data.status.value,
        
        "block": data.block,
        "floor": data.floor,
        "unit_number": data.unit_number,
        
        "area": data.area,
        "bedrooms": data.bedrooms,
        "bathrooms": data.bathrooms,
        "direction": data.direction,
        "view": data.view,
        
        "base_price": data.base_price,
        "price_per_sqm": data.price_per_sqm,
        "total_price": data.total_price,
        
        "discount_percent": data.discount_percent,
        "discount_amount": discount_amount,
        "final_price": final_price,
        
        "payment_schedule": data.payment_schedule,
        
        "floor_plan_url": data.floor_plan_url,
        "images": data.images,
        
        "current_booking_id": None,
        "booked_by": None,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.product_units.insert_one(product_doc)
    return ProductUnitResponse(**product_doc)

@sales_router.get("/products", response_model=List[ProductUnitResponse])
async def get_product_units(
    project_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
    status: Optional[ProductStatus] = None,
    type: Optional[ProductType] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách sản phẩm"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    if campaign_id:
        query["campaign_id"] = campaign_id
    if status:
        query["status"] = status.value
    if type:
        query["type"] = type.value
    
    products = await db.product_units.find(query, {"_id": 0}).sort([("block", 1), ("floor", 1)]).to_list(1000)
    return [ProductUnitResponse(**p) for p in products]

@sales_router.get("/products/{product_id}", response_model=ProductUnitResponse)
async def get_product_unit(
    product_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Lấy chi tiết sản phẩm"""
    product = await db.product_units.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductUnitResponse(**product)

# ==================== BOOKING APIs ====================

@sales_router.post("/bookings", response_model=BookingResponse)
async def create_booking(
    data: BookingCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo booking"""
    booking_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get product info
    product = await db.product_units.find_one({"id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["status"] != ProductStatus.AVAILABLE.value:
        raise HTTPException(status_code=400, detail="Product is not available")
    
    # Get sales info
    sales = await db.users.find_one({"id": data.sales_id}, {"_id": 0})
    sales_name = sales["full_name"] if sales else "N/A"
    
    # Get campaign info
    campaign_name = None
    if data.campaign_id:
        campaign = await db.sales_campaigns.find_one({"id": data.campaign_id}, {"_id": 0})
        campaign_name = campaign["name"] if campaign else None
    
    # Generate booking number
    year = datetime.now().year
    count = await db.bookings.count_documents({"created_year": year})
    booking_number = f"BK-{year}-{count + 1:05d}"
    
    # Calculate amounts
    remaining = product["final_price"] - data.booking_amount - data.deposit_amount
    
    booking_doc = {
        "id": booking_id,
        "booking_number": booking_number,
        
        "product_id": data.product_id,
        "product_code": product["code"],
        "product_name": product["name"],
        "project_name": product["project_name"],
        
        "campaign_id": data.campaign_id,
        "campaign_name": campaign_name,
        
        "customer_id": data.customer_id,
        "customer_name": data.customer_name,
        "customer_phone": data.customer_phone,
        "customer_email": data.customer_email,
        
        "sales_id": data.sales_id,
        "sales_name": sales_name,
        
        "status": BookingStatus.PENDING.value,
        
        "booking_amount": data.booking_amount,
        "deposit_amount": data.deposit_amount,
        "total_paid": data.booking_amount,
        
        "product_price": product["final_price"],
        "discount_amount": product["discount_amount"],
        "final_price": product["final_price"],
        "remaining_amount": remaining,
        
        "booking_date": now.split("T")[0],
        "deposit_deadline": None,
        "contract_deadline": None,
        
        "expired_at": None,
        "cancelled_at": None,
        
        "notes": data.notes,
        
        "created_by": current_user["id"],
        "created_at": now,
        "created_year": year,
        "updated_at": None
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Update product status
    await db.product_units.update_one(
        {"id": data.product_id},
        {"$set": {
            "status": ProductStatus.BOOKING.value,
            "current_booking_id": booking_id,
            "booked_by": data.customer_name
        }}
    )
    
    # Update campaign stats
    if data.campaign_id:
        await db.sales_campaigns.update_one(
            {"id": data.campaign_id},
            {"$inc": {"booking_count": 1}}
        )
    
    return BookingResponse(**booking_doc)

@sales_router.get("/bookings", response_model=List[BookingResponse])
async def get_bookings(
    status: Optional[BookingStatus] = None,
    campaign_id: Optional[str] = None,
    sales_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách booking"""
    query = {}
    if status:
        query["status"] = status.value
    if campaign_id:
        query["campaign_id"] = campaign_id
    if sales_id:
        query["sales_id"] = sales_id
    
    # Sales only see their own bookings
    if current_user["role"] == "sales":
        query["sales_id"] = current_user["id"]
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [BookingResponse(**b) for b in bookings]

@sales_router.put("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: BookingStatus,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật trạng thái booking"""
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update = {"status": status.value, "updated_at": now}
    
    if status == BookingStatus.CANCELLED:
        update["cancelled_at"] = now
        # Restore product status
        await db.product_units.update_one(
            {"id": booking["product_id"]},
            {"$set": {"status": ProductStatus.AVAILABLE.value, "current_booking_id": None, "booked_by": None}}
        )
    elif status == BookingStatus.CONTRACT_SIGNED:
        # Update product to sold
        await db.product_units.update_one(
            {"id": booking["product_id"]},
            {"$set": {"status": ProductStatus.SOLD.value}}
        )
        # Update campaign stats
        if booking.get("campaign_id"):
            await db.sales_campaigns.update_one(
                {"id": booking["campaign_id"]},
                {"$inc": {"sold_units": 1, "actual_revenue": booking["final_price"]}}
            )
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update})
    
    return {"success": True}

# ==================== DEAL/PIPELINE APIs ====================

@sales_router.post("/deals", response_model=DealResponse)
async def create_deal(
    data: DealCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo deal mới"""
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate deal number
    count = await db.deals.count_documents({})
    deal_number = f"DEAL-{count + 1:05d}"
    
    # Get related info
    lead_name = None
    if data.lead_id:
        lead = await db.leads.find_one({"id": data.lead_id}, {"_id": 0})
        lead_name = lead.get("full_name") if lead else None
    
    customer_name = None
    customer_phone = None
    if data.customer_id:
        customer = await db.customers.find_one({"id": data.customer_id}, {"_id": 0})
        if customer:
            customer_name = customer.get("full_name")
            customer_phone = customer.get("phone")
    
    product_code = None
    product_name = None
    if data.product_id:
        product = await db.product_units.find_one({"id": data.product_id}, {"_id": 0})
        if product:
            product_code = product["code"]
            product_name = product["name"]
    
    campaign_name = None
    if data.campaign_id:
        campaign = await db.sales_campaigns.find_one({"id": data.campaign_id}, {"_id": 0})
        campaign_name = campaign["name"] if campaign else None
    
    sales = await db.users.find_one({"id": data.sales_id}, {"_id": 0})
    sales_name = sales["full_name"] if sales else "N/A"
    
    # Stage labels
    stage_labels = {
        "lead": "Lead mới",
        "qualified": "Đã xác nhận",
        "site_visit": "Đã tham quan",
        "proposal": "Đã báo giá",
        "negotiation": "Đang đàm phán",
        "booking": "Đã booking",
        "deposit": "Đã đặt cọc",
        "contract": "Đang làm HĐ",
        "won": "Thắng",
        "lost": "Mất"
    }
    
    deal_doc = {
        "id": deal_id,
        "deal_number": deal_number,
        "name": data.name,
        
        "lead_id": data.lead_id,
        "lead_name": lead_name,
        
        "customer_id": data.customer_id,
        "customer_name": customer_name,
        "customer_phone": customer_phone,
        
        "product_id": data.product_id,
        "product_code": product_code,
        "product_name": product_name,
        
        "campaign_id": data.campaign_id,
        "campaign_name": campaign_name,
        
        "stage": data.stage.value,
        "stage_label": stage_labels.get(data.stage.value, ""),
        
        "expected_value": data.expected_value,
        "actual_value": 0,
        "probability": data.probability,
        "weighted_value": data.expected_value * data.probability / 100,
        
        "expected_close_date": data.expected_close_date,
        "actual_close_date": None,
        
        "sales_id": data.sales_id,
        "sales_name": sales_name,
        
        "source": data.source,
        
        "notes": data.notes,
        
        "next_action": data.next_action,
        "next_action_date": data.next_action_date,
        
        "last_activity_date": now,
        "activities_count": 0,
        
        "days_in_pipeline": 0,
        
        "created_by": current_user["id"],
        "created_at": now,
        "updated_at": None
    }
    
    await db.deals.insert_one(deal_doc)
    return DealResponse(**deal_doc)

@sales_router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    stage: Optional[DealStage] = None,
    sales_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy danh sách deals"""
    query = {}
    if stage:
        query["stage"] = stage.value
    if sales_id:
        query["sales_id"] = sales_id
    if campaign_id:
        query["campaign_id"] = campaign_id
    
    # Sales only see their own deals
    if current_user["role"] == "sales":
        query["sales_id"] = current_user["id"]
    
    deals = await db.deals.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Validate and filter out invalid deals
    valid_deals = []
    valid_stages = {s.value for s in DealStage}
    for d in deals:
        # Ensure stage is valid
        if d.get("stage") not in valid_stages:
            d["stage"] = "lead"  # Default to lead stage
        valid_deals.append(d)
    
    return [DealResponse(**d) for d in valid_deals]

@sales_router.get("/deals/pipeline")
async def get_deals_pipeline(
    sales_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Lấy deals theo dạng pipeline"""
    query = {"stage": {"$nin": ["won", "lost"]}}
    
    if sales_id:
        query["sales_id"] = sales_id
    elif current_user["role"] == "sales":
        query["sales_id"] = current_user["id"]
    
    deals = await db.deals.find(query, {"_id": 0}).to_list(500)
    
    # Group by stage
    stages = ["lead", "qualified", "site_visit", "proposal", "negotiation", "booking", "deposit", "contract"]
    stage_labels = {
        "lead": "Lead mới",
        "qualified": "Đã xác nhận",
        "site_visit": "Đã tham quan",
        "proposal": "Đã báo giá",
        "negotiation": "Đang đàm phán",
        "booking": "Đã booking",
        "deposit": "Đã đặt cọc",
        "contract": "Đang làm HĐ"
    }
    
    pipeline = []
    for stage in stages:
        stage_deals = [d for d in deals if d["stage"] == stage]
        total_value = sum(d["expected_value"] for d in stage_deals)
        weighted_value = sum(d["weighted_value"] for d in stage_deals)
        
        pipeline.append({
            "stage": stage,
            "label": stage_labels.get(stage, stage),
            "deals": [DealResponse(**d) for d in stage_deals],
            "count": len(stage_deals),
            "total_value": total_value,
            "weighted_value": weighted_value
        })
    
    return pipeline

@sales_router.put("/deals/{deal_id}/stage")
async def update_deal_stage(
    deal_id: str,
    stage: DealStage,
    actual_value: Optional[float] = None,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật stage của deal"""
    deal = await db.deals.find_one({"id": deal_id}, {"_id": 0})
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    stage_labels = {
        "lead": "Lead mới",
        "qualified": "Đã xác nhận",
        "site_visit": "Đã tham quan",
        "proposal": "Đã báo giá",
        "negotiation": "Đang đàm phán",
        "booking": "Đã booking",
        "deposit": "Đã đặt cọc",
        "contract": "Đang làm HĐ",
        "won": "Thắng",
        "lost": "Mất"
    }
    
    update = {
        "stage": stage.value,
        "stage_label": stage_labels.get(stage.value, ""),
        "updated_at": now,
        "last_activity_date": now
    }
    
    if stage in [DealStage.WON, DealStage.LOST]:
        update["actual_close_date"] = now
        if actual_value is not None:
            update["actual_value"] = actual_value
    
    # Update probability based on stage
    probability_map = {
        "lead": 10,
        "qualified": 20,
        "site_visit": 30,
        "proposal": 40,
        "negotiation": 50,
        "booking": 70,
        "deposit": 80,
        "contract": 90,
        "won": 100,
        "lost": 0
    }
    update["probability"] = probability_map.get(stage.value, deal["probability"])
    update["weighted_value"] = deal["expected_value"] * update["probability"] / 100
    
    await db.deals.update_one({"id": deal_id}, {"$set": update})
    
    return {"success": True}

# ==================== DASHBOARD APIs ====================

@sales_router.get("/dashboard")
async def get_sales_dashboard(
    period: str = "month",
    current_user: dict = Depends(get_current_user)
):
    """Lấy tổng quan bán hàng"""
    now = datetime.now(timezone.utc)
    
    if period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "quarter":
        quarter = (now.month - 1) // 3
        start_date = now.replace(month=quarter * 3 + 1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    start_str = start_date.isoformat()
    
    # Active campaigns
    active_campaigns = await db.sales_campaigns.count_documents({"status": CampaignStatus.ACTIVE.value})
    
    # Bookings this period
    bookings = await db.bookings.find(
        {"created_at": {"$gte": start_str}},
        {"_id": 0}
    ).to_list(1000)
    
    total_bookings = len(bookings)
    total_booking_value = sum(b["final_price"] for b in bookings)
    
    # Deals
    deals = await db.deals.find(
        {"created_at": {"$gte": start_str}},
        {"_id": 0}
    ).to_list(1000)
    
    total_deals = len(deals)
    won_deals = sum(1 for d in deals if d["stage"] == DealStage.WON.value)
    lost_deals = sum(1 for d in deals if d["stage"] == DealStage.LOST.value)
    pipeline_value = sum(d["weighted_value"] for d in deals if d["stage"] not in ["won", "lost"])
    
    # Units sold
    sold_units = await db.product_units.count_documents({
        "status": ProductStatus.SOLD.value,
        "updated_at": {"$gte": start_str}
    })
    
    # Revenue from sales
    total_revenue = sum(b["final_price"] for b in bookings if b["status"] == BookingStatus.CONTRACT_SIGNED.value)
    
    # Top performers
    sales_performance = {}
    for booking in bookings:
        sales_id = booking["sales_id"]
        if sales_id not in sales_performance:
            sales_performance[sales_id] = {
                "sales_id": sales_id,
                "sales_name": booking["sales_name"],
                "bookings": 0,
                "revenue": 0
            }
        sales_performance[sales_id]["bookings"] += 1
        if booking["status"] == BookingStatus.CONTRACT_SIGNED.value:
            sales_performance[sales_id]["revenue"] += booking["final_price"]
    
    top_performers = sorted(sales_performance.values(), key=lambda x: x["revenue"], reverse=True)[:5]
    
    # Deals by stage
    deals_by_stage = {}
    for d in deals:
        stage = d["stage"]
        deals_by_stage[stage] = deals_by_stage.get(stage, 0) + 1
    
    return {
        "period": period,
        "summary": {
            "active_campaigns": active_campaigns,
            "total_bookings": total_bookings,
            "total_booking_value": total_booking_value,
            "sold_units": sold_units,
            "total_revenue": total_revenue,
            "total_deals": total_deals,
            "won_deals": won_deals,
            "lost_deals": lost_deals,
            "win_rate": (won_deals / (won_deals + lost_deals) * 100) if (won_deals + lost_deals) > 0 else 0,
            "pipeline_value": pipeline_value
        },
        "top_performers": top_performers,
        "deals_by_stage": deals_by_stage
    }
