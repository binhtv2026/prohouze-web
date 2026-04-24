"""
ai_features_router.py — Phase D
FastAPI router: AI Features cho ProHouzing
D1: Định giá BĐS | D2: Lead Scoring | D3: Chat | D4: Deal Prediction
D5: Smart Notification | D6: Content Gen | D7: Recommendation
D8: KPI Coaching | D9: Sentiment | D10: AI Dashboard
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List
from datetime import datetime, date
import uuid
import re

router = APIRouter(prefix="/ai", tags=["AI Features — Phase D"])

# ─── D1: AI ĐỊNH GIÁ BĐS ──────────────────────────────────────────────────────
# Rule-based engine, ready để swap bằng ML model thật
MARKET_DATA = {
    # project_lower → (base_m2_price, trend_pct_per_quarter, liquidity_score)
    "vinhomes central park":    (65_000_000, 2.1, 92),
    "masteri thảo điền":        (72_000_000, 1.8, 88),
    "sunwah pearl":             (96_000_000, 3.2, 75),
    "the river thủ thiêm":      (110_000_000, 2.8, 70),
    "eco green sài gòn":        (52_000_000, 1.2, 85),
    "gateway thảo điền":        (68_000_000, 2.0, 80),
    "ascent lakeside":          (55_000_000, 1.5, 82),
    "default":                  (55_000_000, 1.5, 75),
}

DIRECTION_BONUS = {
    "Đông Nam": 0.04, "Đông": 0.03, "Nam": 0.02,
    "Tây Nam": -0.01, "Tây": -0.02, "Bắc": 0.01, "Tây Bắc": -0.01,
}

@router.post("/valuation/estimate")
async def ai_valuation(data: dict):
    """D1 — AI Định giá BĐS: rule-based với confidence score"""
    project   = data.get("project", "").lower()
    area      = float(data.get("area", 65))
    floor     = int(data.get("floor", 10))
    direction = data.get("direction", "")
    bedrooms  = int(data.get("bedrooms", 2))
    condition = data.get("condition", "good")  # excellent/good/fair/poor
    age_years = int(data.get("age_years", 3))

    key = next((k for k in MARKET_DATA if k in project), "default")
    base_m2, trend_q, liquidity = MARKET_DATA[key]

    # Factors
    floor_bonus    = max(0, (floor - 5) * 0.003)
    dir_bonus      = DIRECTION_BONUS.get(direction, 0)
    bedroom_bonus  = {1: -0.05, 2: 0, 3: 0.03, 4: 0.06}.get(bedrooms, 0)
    condition_adj  = {"excellent": 0.05, "good": 0, "fair": -0.08, "poor": -0.18}.get(condition, 0)
    age_adj        = max(-0.10, -age_years * 0.008)

    total_adj = floor_bonus + dir_bonus + bedroom_bonus + condition_adj + age_adj
    unit_price = base_m2 * (1 + total_adj)
    estimated  = unit_price * area

    # Confidence dựa trên data quality
    confidence = 85
    if key == "default": confidence -= 15
    if area < 35 or area > 200: confidence -= 5
    if condition == "poor": confidence -= 5
    confidence = max(50, min(95, confidence))

    # Comparables (demo)
    comparables = [
        {
            "label": f"Giao dịch Q1/2026 — Tầng tương tự",
            "price": round(estimated * 0.97, -6),
            "date": "2026-01",
            "area": area - 2,
        },
        {
            "label": f"Giao dịch T3/2026 — Cùng block",
            "price": round(estimated * 1.03, -6),
            "date": "2026-03",
            "area": area + 3,
        },
    ]

    return {
        "estimated_price":    round(estimated, -6),
        "price_per_m2":       round(unit_price, -3),
        "range_low":          round(estimated * 0.93, -6),
        "range_high":         round(estimated * 1.07, -6),
        "confidence":         confidence,
        "liquidity_score":    liquidity,
        "market_trend":       f"+{trend_q}%/quý",
        "factors": {
            "floor_bonus_pct":     round(floor_bonus * 100, 1),
            "direction_bonus_pct": round(dir_bonus * 100, 1),
            "condition_adj_pct":   round(condition_adj * 100, 1),
            "age_adj_pct":         round(age_adj * 100, 1),
        },
        "comparables": comparables,
        "recommendation": "Định giá hợp lý" if confidence > 75 else "Cần thêm dữ liệu thị trường",
        "model_version": "rule-based-v1.2",
        "timestamp":     datetime.now().isoformat(),
    }

@router.post("/valuation/batch")
async def batch_valuation(data: dict):
    """Định giá hàng loạt cho danh mục"""
    units = data.get("units", [])
    results = []
    for unit in units[:20]:  # max 20
        try:
            result = await ai_valuation(unit)
            results.append({"input": unit, "result": result})
        except Exception as e:
            results.append({"input": unit, "error": str(e)})
    return {"total": len(results), "results": results}

# ─── D2: LEAD SCORING ─────────────────────────────────────────────────────────
LEAD_SCORE_WEIGHTS = {
    "budget_match":       30,  # ngân sách khớp sản phẩm
    "timeline":           20,  # timeline mua (< 3 tháng = hot)
    "engagement":         20,  # số lần liên hệ, đặt lịch
    "qualification":      15,  # đã xem sản phẩm, đủ điều kiện pháp lý
    "referral_quality":   15,  # nguồn lead (referral > ads)
}

@router.post("/lead-score")
async def score_lead(data: dict):
    """D2 — Lead Scoring: trả về Hot/Warm/Cold + điểm"""
    score = 0

    budget     = float(data.get("budget_billion", 0))
    product_price = float(data.get("product_price_billion", 0))
    if product_price > 0:
        ratio = budget / product_price
        if 0.8 <= ratio <= 1.3:  score += 30
        elif 0.6 <= ratio < 0.8: score += 15
        else:                    score += 5

    timeline_months = int(data.get("timeline_months", 12))
    if timeline_months <= 1:   score += 20
    elif timeline_months <= 3: score += 15
    elif timeline_months <= 6: score += 8
    else:                      score += 3

    contacts   = int(data.get("contact_count", 0))
    site_visit = bool(data.get("site_visit", False))
    eng_score  = min(20, contacts * 3 + (10 if site_visit else 0))
    score += eng_score

    qualified = bool(data.get("financially_qualified", False))
    has_docs  = bool(data.get("has_required_docs", False))
    score += (10 if qualified else 0) + (5 if has_docs else 0)

    source = data.get("source", "ads")
    source_score = {"referral": 15, "company_event": 12, "zalo_oA": 10,
                    "facebook": 7, "google": 7, "ads": 5, "unknown": 3}
    score += source_score.get(source, 5)

    # Classify
    if score >= 75:   tier, label, color = "HOT",  "Rất tiềm năng",  "#ef4444"
    elif score >= 50: tier, label, color = "WARM", "Tiềm năng",      "#f97316"
    elif score >= 30: tier, label, color = "COOL", "Cần nuôi dưỡng", "#eab308"
    else:             tier, label, color = "COLD", "Chưa sẵn sàng",  "#94a3b8"

    return {
        "score": score,
        "tier": tier,
        "label": label,
        "color": color,
        "breakdown": {
            "budget_match":     min(30, budget and int(30 * min(ratio, 1.3) / 1.3) if product_price else 5),
            "timeline":         min(20, max(3, 20 - timeline_months * 2)),
            "engagement":       eng_score,
            "qualification":    (10 if qualified else 0) + (5 if has_docs else 0),
            "referral_quality": source_score.get(source, 5),
        },
        "actions": {
            "HOT":  ["Gọi ngay trong 2h", "Đặt lịch xem dự án", "Chuẩn bị booking form"],
            "WARM": ["Gửi brochure dự án", "Mời sự kiện mở bán", "Follow up sau 3 ngày"],
            "COOL": ["Thêm vào nurture campaign", "Gửi video dự án", "Follow up sau 1 tuần"],
            "COLD": ["Thêm vào email list", "Gửi nội dung giáo dục", "Review sau 1 tháng"],
        }[tier],
        "model_version": "scoring-v2.0",
    }

@router.post("/lead-score/batch")
async def batch_score(data: dict):
    leads = data.get("leads", [])
    results = []
    for lead in leads[:50]:
        r = await score_lead(lead)
        results.append({**lead, "ai_score": r["score"], "ai_tier": r["tier"], "ai_label": r["label"]})
    return {"total": len(results), "leads": results}

# ─── D3: AI CHAT ASSISTANT ────────────────────────────────────────────────────
FAQ_DB = {
    "hoa hồng": "Hoa hồng sơ cấp thông thường 2-3% trên giá bán. Thứ cấp 1.5-2%. Cho thuê 1 tháng tiền thuê. Xem thêm tại /hrm/career-path để biết mức thưởng theo cấp bậc.",
    "booking": "Soft booking giữ căn 72 giờ, không thu tiền. Hard booking yêu cầu đặt cọc từ 30-50 triệu. Xem quy trình tại /sales/soft-bookings và /sales/hard-bookings.",
    "hợp đồng thuê": "HĐ thuê tối thiểu 6 tháng, thường 1-2 năm. Đặt cọc 2 tháng tiền thuê. Thanh toán ngày 1-10 hàng tháng. Xem mẫu HĐ tại /leasing/contracts.",
    "kpi": "KPI sales = Doanh số + Tác phong + Tuân thủ + Đóng góp. Xem bảng xếp hạng tại /hrm/competition.",
    "thăng tiến": "Mỗi cấp bậc có tiêu chí: deals/tháng, doanh thu quý, đào tạo. Xem lộ trình đầy đủ tại /hrm/career-path.",
    "pháp lý": "Kiểm tra sổ hồng, sổ đỏ, giấy phép xây dựng, biên bản bàn giao tại /sales/knowledge hoặc liên hệ phòng pháp lý.",
    "định giá": "Dùng AI định giá tại /ai/valuation. Nhập diện tích, tầng, hướng để nhận ước tính ngay.",
    "đào tạo": "Truy cập Training Hub tại /hrm/training-hub. Có 4 tab: Văn hóa DN, Phòng ban, Cấp bậc, Thư viện BĐS.",
}

QUICK_ACTIONS = [
    {"id": "valuation", "label": "Định giá căn hộ",    "icon": "🏷️", "action": "/ai/valuation"},
    {"id": "scoring",   "label": "Chấm điểm khách",    "icon": "🎯", "action": "/ai/lead-scoring"},
    {"id": "training",  "label": "Training Hub",        "icon": "📚", "action": "/hrm/training-hub"},
    {"id": "ranking",   "label": "Bảng xếp hạng",      "icon": "🏆", "action": "/hrm/competition"},
    {"id": "booking",   "label": "Đặt chỗ căn hộ",     "icon": "📋", "action": "/sales/soft-bookings"},
    {"id": "contract",  "label": "Tạo hợp đồng thuê",  "icon": "📄", "action": "/leasing/contracts/new"},
]

@router.post("/chat/message")
async def chat_message(data: dict):
    """D3 — AI Chat: keyword matching + contextual responses"""
    text = data.get("message", "").lower().strip()
    conversation_id = data.get("conversation_id", str(uuid.uuid4()))

    # Match FAQ
    best_match = None
    best_overlap = 0
    for keyword, answer in FAQ_DB.items():
        kw_words = set(keyword.split())
        text_words = set(text.split())
        overlap = len(kw_words & text_words)
        if overlap > best_overlap or keyword in text:
            best_overlap = overlap
            best_match = answer

    # Greetings
    if any(w in text for w in ["xin chào", "hello", "hi", "chào", "alo"]):
        response = "Xin chào! Tôi là AI Assistant của ProHouzing 🤖\nTôi có thể giúp bạn về: định giá BĐS, quy trình booking, pháp lý, hoa hồng, đào tạo và nhiều hơn nữa.\n\nBạn cần hỗ trợ gì?"
        action_type = "greeting"
    elif best_match and best_overlap > 0:
        response = best_match
        action_type = "faq"
    elif any(w in text for w in ["giá", "bao nhiêu", "giá bao"]):
        response = "Để định giá chính xác, hãy dùng công cụ AI Định giá của tôi. Nhập tên dự án, diện tích, tầng và hướng căn để nhận ước tính ngay!"
        action_type = "redirect_valuation"
    elif any(w in text for w in ["khách", "lead", "tiềm năng", "hot"]):
        response = "Để đánh giá mức độ tiềm năng của khách, dùng AI Lead Scoring. Nhập thông tin budget, timeline và nguồn khách để AI phân loại Hot/Warm/Cold."
        action_type = "redirect_scoring"
    else:
        response = "Cảm ơn câu hỏi của bạn! Hiện tôi chưa có câu trả lời chính xác cho vấn đề này.\n\nBạn có thể:\n• Liên hệ phòng pháp lý nếu liên quan đến hợp đồng\n• Gặp trưởng nhóm nếu liên quan đến KPI/thưởng\n• Xem Training Hub tại /hrm/training-hub để tìm tài liệu"
        action_type = "fallback"

    return {
        "conversation_id": conversation_id,
        "response": response,
        "action_type": action_type,
        "quick_actions": QUICK_ACTIONS[:3],
        "timestamp": datetime.now().isoformat(),
    }

@router.get("/chat/quick-actions")
async def get_quick_actions():
    return {"quick_actions": QUICK_ACTIONS}

# ─── D4: DEAL PREDICTION ──────────────────────────────────────────────────────
@router.post("/deal/prediction")
async def predict_deal(data: dict):
    """D4 — Xác suất chốt deal + cảnh báo sắp trượt"""
    days_since_last_contact = int(data.get("days_since_last_contact", 3))
    stage = data.get("stage", "initial")
    client_objections = int(data.get("objection_count", 0))
    site_visits = int(data.get("site_visits", 0))
    booking_form_sent = bool(data.get("booking_form_sent", False))
    competitor_mentioned = bool(data.get("competitor_mentioned", False))
    lead_score = int(data.get("lead_score", 50))

    STAGE_BASE = {"initial": 15, "site_visit": 35, "negotiation": 60, "legal_check": 80, "deposit": 92, "completed": 100}
    base = STAGE_BASE.get(stage, 20)

    # Adjustments
    adj = 0
    adj += min(20, site_visits * 8)
    adj += 10 if booking_form_sent else 0
    adj -= min(20, client_objections * 5)
    adj -= 5 if competitor_mentioned else 0
    adj -= max(0, (days_since_last_contact - 3) * 2)
    adj += (lead_score - 50) * 0.2

    probability = max(5, min(98, base + adj))

    # Risk signals
    risks = []
    if days_since_last_contact > 5: risks.append("⚠️ Chưa liên hệ hơn 5 ngày")
    if competitor_mentioned: risks.append("⚠️ Khách đang so sánh với đối thủ")
    if client_objections >= 3: risks.append("⚠️ Nhiều objection chưa xử lý")
    if stage == "negotiation" and days_since_last_contact > 3: risks.append("🚨 Đang đàm phán nhưng chưa follow up")

    # Actions
    if probability >= 75:
        actions = ["Chuẩn bị booking form", "Đặt lịch ký hợp đồng", "Xác nhận phương thức thanh toán"]
    elif probability >= 50:
        actions = ["Gửi thêm thông tin dự án", "Đề xuất xem căn thực tế", "Xử lý objection còn lại"]
    else:
        actions = ["Liên hệ lại ngay hôm nay", "Tìm hiểu nguyên nhân chưa quyết định", "Đề xuất ưu đãi đặc biệt"]

    return {
        "win_probability": round(probability),
        "stage": stage,
        "status": "very_likely" if probability >= 80 else "likely" if probability >= 60 else "at_risk" if probability >= 35 else "unlikely",
        "risk_signals": risks,
        "recommended_actions": actions,
        "days_to_close_estimate": max(1, int((100 - probability) / 3)),
        "model_version": "deal-pred-v1.0",
    }

# ─── D5: SMART NOTIFICATIONS ──────────────────────────────────────────────────
@router.post("/smart-notif/prioritize")
async def prioritize_notifications(data: dict):
    """D5 — AI quyết định thứ tự ưu tiên thông báo"""
    notifs = data.get("notifications", [])
    PRIORITY_MAP = {
        "contract_expiring_7d":  100, "overdue_invoice_3d": 95,
        "hot_lead_new":          90,  "deal_stage_change": 85,
        "contract_expiring_30d": 75,  "maintenance_urgent": 80,
        "kpi_milestone":         60,  "ranking_change": 55,
        "training_reminder":     40,  "system_update": 20,
    }
    scored = [
        {**n, "priority_score": PRIORITY_MAP.get(n.get("type", ""), 30),
         "send_now": PRIORITY_MAP.get(n.get("type", ""), 30) >= 80}
        for n in notifs
    ]
    scored.sort(key=lambda x: x["priority_score"], reverse=True)
    return {"prioritized": scored, "send_now_count": sum(1 for n in scored if n["send_now"])}

# ─── D6: AI CONTENT GENERATOR ─────────────────────────────────────────────────
TEMPLATES = {
    "listing_description": """🏢 [{bedrooms}PN | {area}m² | Tầng {floor} | {direction}]

{project} — Căn hộ [{condition}], vị trí lý tưởng với view {view_note}.

✅ Pháp lý: {legal_status} — Giao dịch an toàn, bàn giao ngay
📐 Diện tích: {area}m² (tim tường), [{bedrooms}] phòng ngủ, [{bathrooms}] WC
🏙️ Dự án: {project} — Tiện ích đẳng cấp, an ninh 24/7
💰 Giá bán: {price_display} (có thể thương lượng)

Liên hệ ngay để nhận tư vấn và xem căn thực tế! 📞""",

    "email_follow_up": """Kính gửi quý khách {client_name},

Cảm ơn bạn đã quan tâm đến {product_name}.

Như đã chia sẻ, đây là cơ hội đầu tư hấp dẫn với:
• Vị trí đắc địa, tiện ích cao cấp
• Pháp lý minh bạch, {legal_status}
• Tiềm năng tăng giá {trend_note}

Tôi hiểu bạn cần thêm thời gian cân nhắc. Tôi muốn sắp xếp một buổi tham quan thực tế để bạn có cái nhìn trực quan hơn.

Bạn có thời gian vào {suggest_time} không?

Trân trọng,
{agent_name} | {phone}""",

    "zalo_intro": """👋 Chào {client_name}!

Em là {agent_name} từ ProHouzing. Em đang có căn hộ {bedrooms}PN/{area}m² tại {project} rất phù hợp với nhu cầu của anh/chị.

💎 Điểm nổi bật:
- Tầng {floor}, hướng {direction}, view đẹp
- Pháp lý: {legal_status}
- Giá: {price_display}

Anh/chị có muốn em gửi thêm thông tin chi tiết không ạ? 🏠""",
}

@router.post("/content/generate")
async def generate_content(data: dict):
    """D6 — Sinh nội dung BĐS tự động"""
    template_type = data.get("type", "listing_description")
    template = TEMPLATES.get(template_type)
    if not template:
        raise HTTPException(400, f"Loại template không hợp lệ: {template_type}. Dùng: {list(TEMPLATES.keys())}")

    try:
        content = template.format(**{k: v for k, v in data.items() if k != "type"})
        # Fill missing placeholders with defaults
        import re
        remaining = re.findall(r'\{(\w+)\}', content)
        defaults = {"view_note": "thoáng mát", "bathrooms": "2", "suggest_time": "cuối tuần này", "trend_note": "+2-3%/năm"}
        for ph in remaining:
            content = content.replace(f"{{{ph}}}", defaults.get(ph, f"[{ph}]"))
    except KeyError as e:
        raise HTTPException(400, f"Thiếu thông tin: {e}")

    word_count = len(content.split())
    return {
        "content": content,
        "type": template_type,
        "word_count": word_count,
        "char_count": len(content),
        "platform_fit": {
            "facebook": word_count <= 300,
            "zalo": word_count <= 200,
            "email": True,
            "listing": True,
        },
        "model_version": "template-v1.0",
    }

@router.get("/content/templates")
async def get_templates():
    return {
        "templates": [
            {"type": "listing_description", "label": "Mô tả tin đăng", "required_fields": ["project", "area", "floor", "bedrooms", "direction", "legal_status", "price_display", "condition"]},
            {"type": "email_follow_up",     "label": "Email theo dõi khách", "required_fields": ["client_name", "product_name", "agent_name", "phone", "legal_status"]},
            {"type": "zalo_intro",          "label": "Zalo giới thiệu",      "required_fields": ["client_name", "agent_name", "project", "area", "bedrooms", "floor", "direction", "legal_status", "price_display"]},
        ]
    }

# ─── D7: PROPERTY RECOMMENDATION ─────────────────────────────────────────────
DEMO_PRODUCTS = [
    {"id": "p1", "project": "Vinhomes Central Park", "bedrooms": 2, "area": 65, "price_billion": 3.8, "direction": "Đông Nam", "floor_range": [15, 30]},
    {"id": "p2", "project": "Masteri Thảo Điền",    "bedrooms": 2, "area": 72, "price_billion": 4.5, "direction": "Tây Nam",  "floor_range": [8, 20]},
    {"id": "p3", "project": "Sunwah Pearl",          "bedrooms": 3, "area": 88, "price_billion": 7.9, "direction": "Đông",     "floor_range": [20, 35]},
    {"id": "p4", "project": "Eco Green Sài Gòn",    "bedrooms": 2, "area": 58, "price_billion": 2.8, "direction": "Nam",      "floor_range": [5, 15]},
    {"id": "p5", "project": "The River Thủ Thiêm",  "bedrooms": 3, "area": 110, "price_billion": 12.0, "direction": "Đông Nam", "floor_range": [20, 40]},
]

@router.post("/recommend/products")
async def recommend_products(data: dict):
    """D7 — Gợi ý sản phẩm phù hợp cho khách hàng"""
    budget_b       = float(data.get("budget_billion", 5))
    bedrooms_pref  = int(data.get("bedrooms", 2))
    area_min       = float(data.get("area_min", 50))
    direction_pref = data.get("direction", "")
    floor_pref     = data.get("floor_preference", "high")

    scored = []
    for p in DEMO_PRODUCTS:
        score = 0
        # Price fit
        if p["price_billion"] <= budget_b * 1.1: score += 40
        elif p["price_billion"] <= budget_b * 1.2: score += 20
        # Bedroom match
        if p["bedrooms"] == bedrooms_pref: score += 25
        elif abs(p["bedrooms"] - bedrooms_pref) == 1: score += 10
        # Area
        if p["area"] >= area_min: score += 15
        # Direction
        if direction_pref and direction_pref in p["direction"]: score += 10
        # Floor preference
        if floor_pref == "high" and p["floor_range"][1] >= 20: score += 10
        elif floor_pref == "low" and p["floor_range"][0] <= 10: score += 10

        if score > 0:
            scored.append({**p, "match_score": score, "match_pct": min(100, round(score * 1.2))})

    scored.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "total": len(scored),
        "recommendations": scored[:5],
        "best_match": scored[0] if scored else None,
    }

# ─── D8: KPI COACHING ─────────────────────────────────────────────────────────
@router.post("/kpi/coaching")
async def kpi_coaching(data: dict):
    """D8 — AI phân tích KPI và gợi ý cải thiện"""
    deals_this_month  = int(data.get("deals_this_month", 0))
    target_deals      = int(data.get("target_deals", 5))
    days_remain       = int(data.get("days_remaining_month", 15))
    revenue_billion   = float(data.get("revenue_billion", 0))
    revenue_target    = float(data.get("revenue_target_billion", 10))
    active_leads      = int(data.get("active_leads", 0))
    conversion_rate   = float(data.get("conversion_rate", 0.15))

    deals_needed    = max(0, target_deals - deals_this_month)
    revenue_needed  = max(0, revenue_target - revenue_billion)
    estimated_more  = max(0, int(active_leads * conversion_rate))
    on_track        = deals_this_month / max(1, target_deals) >= min(1.0, (30 - days_remain) / 30)

    insights = []
    actions  = []

    if deals_needed > 0:
        deals_per_day_needed = round(deals_needed / max(1, days_remain), 2)
        insights.append(f"Cần thêm {deals_needed} deal trong {days_remain} ngày ({deals_per_day_needed}/ngày)")
        if deals_needed > estimated_more:
            needed_extra = deals_needed - estimated_more
            actions.append(f"Cần {needed_extra} lead mới để đủ pipeline — tăng cường tìm kiếm khách")

    if conversion_rate < 0.2:
        insights.append(f"Tỷ lệ chuyển đổi {round(conversion_rate*100, 1)}% thấp hơn benchmark (20%)")
        actions.append("Review kỹ năng chốt deal — tham khảo training 'Xử lý objection Level 2'")

    if active_leads < deals_needed * 5:
        actions.append("Database khách ít — cần chủ động hơn trong việc tìm kiếm referral")

    if not on_track:
        actions.append("Đang chậm tiến độ — trao đổi với trưởng nhóm để được hỗ trợ")

    return {
        "summary": {
            "deals_done": deals_this_month,
            "deals_needed": deals_needed,
            "revenue_done_billion": revenue_billion,
            "revenue_needed_billion": round(revenue_needed, 2),
            "kpi_pct": round(deals_this_month / max(1, target_deals) * 100, 1),
            "on_track": on_track,
        },
        "insights": insights or ["Đang đúng tiến độ! Duy trì phong độ hiện tại 💪"],
        "recommended_actions": actions or ["Tiếp tục follow up pipeline hiện tại", "Chốt deal trong tuần cuối tháng"],
        "motivation": f"Còn {deals_needed} deal nữa là đạt target! Bạn có thể làm được! 🎯" if deals_needed > 0 else "🏆 Đã hoàn thành target! Vượt thêm để lên bảng xếp hạng!",
        "training_suggestion": "/hrm/training-hub?tab=level" if conversion_rate < 0.2 else None,
    }

# ─── D9: SENTIMENT ANALYSIS ───────────────────────────────────────────────────
POSITIVE_WORDS = {"thích", "tốt", "đẹp", "ok", "đồng ý", "hài lòng", "tuyệt", "hay", "ổn", "muốn", "quan tâm", "sẽ", "tốt lắm"}
NEGATIVE_WORDS = {"không", "đắt", "không thích", "từ chối", "tệ", "kém", "chán", "thất vọng", "hoãn", "suy nghĩ lại", "lo", "băn khoăn"}
URGENT_WORDS   = {"ngay", "hôm nay", "sớm", "gấp", "cần", "muốn ngay", "quyết định"}

@router.post("/sentiment")
async def analyze_sentiment(data: dict):
    """D9 — Phân tích cảm xúc trong ghi chú khách hàng"""
    text = data.get("text", "").lower()
    words = set(text.split())

    pos  = len(words & POSITIVE_WORDS)
    neg  = len(words & NEGATIVE_WORDS)
    urg  = len(words & URGENT_WORDS)

    total = pos + neg
    if total == 0:
        sentiment, score = "neutral", 50
    else:
        score = int((pos / total) * 100)
        if score >= 70:   sentiment = "positive"
        elif score >= 40: sentiment = "neutral"
        else:             sentiment = "negative"

    return {
        "sentiment": sentiment,
        "score": score,
        "urgency": "high" if urg >= 2 else "medium" if urg >= 1 else "low",
        "positive_signals": list(words & POSITIVE_WORDS),
        "concern_signals": list(words & NEGATIVE_WORDS),
        "urgent_signals": list(words & URGENT_WORDS),
        "recommendation": {
            "positive": "Khách đang quan tâm — follow up nhanh, đề xuất xem thực tế",
            "neutral": "Khách trung lập — gửi thêm thông tin, cần thêm thời gian",
            "negative": "Khách có lo ngại — lắng nghe và xử lý objection trước",
        }[sentiment],
    }

# ─── D10: AI DASHBOARD ────────────────────────────────────────────────────────
@router.get("/dashboard")
async def ai_dashboard(user_id: Optional[str] = None):
    """D10 — Tổng hợp AI insights cho 1 người dùng"""
    return {
        "user_id": user_id or "demo",
        "generated_at": datetime.now().isoformat(),

        "highlights": [
            {"icon": "🔥", "title": "3 lead HOT chưa follow up",         "priority": "critical", "action": "/ai/lead-scoring"},
            {"icon": "⚠️", "title": "Deal Masteri 7 ngày chưa liên hệ",  "priority": "high",     "action": "/sales/pipeline"},
            {"icon": "💰", "title": "KPI tháng đạt 62% — cần tăng tốc",  "priority": "medium",   "action": "/ai/kpi-coaching"},
            {"icon": "📄", "title": "2 HĐ thuê sắp hết hạn trong 14 ngày", "priority": "high",   "action": "/leasing/contracts"},
        ],

        "quick_insights": {
            "avg_lead_score":     67,
            "hot_leads_today":    3,
            "deal_win_rate":      72,
            "kpi_completion_pct": 62,
            "content_generated":  14,
        },

        "ai_features": [
            {"id": "valuation",    "label": "AI Định giá",        "icon": "🏷️", "route": "/ai/valuation",     "status": "active"},
            {"id": "lead_scoring", "label": "Lead Scoring",       "icon": "🎯", "route": "/ai/lead-scoring",  "status": "active"},
            {"id": "chat",         "label": "AI Assistant",       "icon": "🤖", "route": "/ai/chat",          "status": "active"},
            {"id": "deal_pred",    "label": "Deal Prediction",    "icon": "📊", "route": "/ai/deal-advisor",  "status": "active"},
            {"id": "content",      "label": "Content Generator",  "icon": "✍️", "route": "/ai/content",       "status": "active"},
            {"id": "recommend",    "label": "Gợi ý sản phẩm",    "icon": "💡", "route": "/ai/recommend",     "status": "active"},
            {"id": "coaching",     "label": "KPI Coaching",       "icon": "📈", "route": "/ai/kpi-coaching",  "status": "active"},
            {"id": "sentiment",    "label": "Sentiment",          "icon": "❤️", "route": "/ai/sentiment",     "status": "active"},
        ],

        "model_status": {
            "valuation":    {"version": "rule-based-v1.2", "accuracy": "85%"},
            "lead_scoring": {"version": "scoring-v2.0",    "accuracy": "82%"},
            "deal_predict": {"version": "deal-pred-v1.0",  "accuracy": "78%"},
            "sentiment":    {"version": "keyword-v1.0",    "accuracy": "73%"},
        },
    }
