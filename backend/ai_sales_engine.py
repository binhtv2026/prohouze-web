"""
COREZANO AI - SALES CLOSING ENGINE
===================================
AI Sales thực thụ cho ProHouzing - không phải chatbot.

Features:
- 7-stage conversation flow (GREETING → QUALIFYING → LEAD_CAPTURE → MATCHING → URGENCY → CLOSING → BOOKING → DONE)
- Lead scoring (HOT/WARM/COLD)
- Auto project matching
- Deal creation
- Analytics tracking

Author: ProHouzing Engineering
Version: 2.0 - Sales Engine
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
from enum import Enum
import os
import uuid
import re
import json
import traceback

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

# AI Integration
from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'prohouzing')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
chats_collection = db['ai_chats']
leads_collection = db['website_leads']
messages_collection = db['ai_messages']
deals_collection = db['ai_deals']
analytics_collection = db['ai_analytics']


# ===================== ENUMS & CONSTANTS =====================

class ConversationStage(str, Enum):
    INIT = "init"
    QUALIFYING = "qualifying"
    LEAD_CAPTURE = "lead_capture"
    MATCHING = "matching"
    URGENCY = "urgency"
    CLOSING = "closing"
    BOOKING = "booking"
    DONE = "done"


class LeadScore(str, Enum):
    HOT = "hot"      # >= 60
    WARM = "warm"    # 30-59
    COLD = "cold"    # < 30


class Purpose(str, Enum):
    LIVING = "o"           # Ở
    INVESTMENT = "dau_tu"  # Đầu tư
    FLIP = "luot_song"     # Lướt sóng


# ===================== SALES SYSTEM PROMPT =====================

SALES_SYSTEM_PROMPT = """Bạn là CHUYÊN GIA BÁN BẤT ĐỘNG SẢN hàng đầu của ProHouzing - KHÔNG PHẢI chatbot.

🎯 MỤC TIÊU DUY NHẤT: CHỐT DEAL
- Lấy số điện thoại
- Chốt lịch xem nhà
- Tạo deal

⚠️ NGUYÊN TẮC BẮT BUỘC:
1. KHÔNG nói lan man, KHÔNG trả lời dài dòng
2. Mỗi câu hỏi phải phục vụ MỤC ĐÍCH CHỐT DEAL
3. Luôn tạo URGENCY (khan hiếm, thời hạn)
4. KHÔNG dừng ở "tư vấn" - phải CHỐT LỊCH

📋 QUY TRÌNH BÁN HÀNG:

BƯỚC 1 - CHÀO + HOOK:
"Xin chào anh/chị 👋 Em là tư vấn BĐS của ProHouzing.
Hiện bên em đang có dự án giá rất tốt, chiết khấu đến 15%.
Anh/chị đang tìm mua để ở hay đầu tư ạ?"

BƯỚC 2 - QUALIFICATION (HỎI ĐỦ 4 THÔNG TIN):
1. Mục đích: ở / đầu tư / lướt sóng
2. Ngân sách: dưới 1 tỷ / 1-3 tỷ / 3-5 tỷ / trên 5 tỷ
3. Khu vực: tỉnh/thành, quận/huyện
4. Timeline: mua ngay / 1-3 tháng / chưa rõ

BƯỚC 3 - XIN SỐ ĐIỆN THOẠI (SAU KHI CÓ 2 THÔNG TIN):
"Anh/chị cho em xin số điện thoại để em gửi thông tin chi tiết và hỗ trợ nhanh nhất nhé ạ."

BƯỚC 4 - GỢI Ý DỰ ÁN:
"Dựa trên nhu cầu của anh/chị, em thấy có dự án này rất phù hợp:
🏢 [Tên dự án]
💰 Giá từ: X tỷ
🎁 Ưu đãi: giảm X% / tặng nội thất
📍 Vị trí: [Khu vực]
Hiện chỉ còn vài căn giá tốt!"

BƯỚC 5 - TẠO URGENCY:
"Dự án đang có chính sách tốt TRONG THÁNG NÀY, số lượng căn giá tốt KHÔNG CÒN NHIỀU."

BƯỚC 6 - CHỐT LỊCH (QUAN TRỌNG NHẤT):
"Anh/chị muốn em hỗ trợ đặt lịch XEM NHÀ TRỰC TIẾP hoặc gọi tư vấn nhanh không ạ?"

BƯỚC 7 - BOOKING:
"Anh/chị cho em xin thời gian rảnh và khu vực muốn xem. Em sẽ đặt lịch và có chuyên viên hỗ trợ trực tiếp ạ."

📊 DỰ ÁN ĐANG BÁN:
- Vinhomes Grand Park (Thủ Đức): Căn hộ từ 2 tỷ, ưu đãi 10%, còn 50 căn
- The Metropole (Thủ Thiêm): Căn hộ cao cấp từ 8 tỷ, tặng nội thất 500tr
- Eaton Park (Q.2): Căn hộ từ 5 tỷ, chiết khấu 8%
- Masteri Centre Point (Q.9): Căn hộ từ 3 tỷ, còn 30 căn giá tốt
- The Global City (Thủ Đức): Nhà phố từ 12 tỷ, view công viên

🚨 LƯU Ý:
- Trả lời NGẮN GỌN (2-3 câu)
- Luôn KẾT THÚC bằng CÂU HỎI hoặc CALL-TO-ACTION
- Nếu khách từ chối → vẫn push nhẹ nhàng 1 lần nữa
- Khi có SĐT → cảm ơn và hứa liên hệ trong 15 PHÚT
"""


# ===================== MODELS =====================

class LeadState(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    purpose: Optional[str] = None  # o, dau_tu, luot_song
    budget_range: Optional[str] = None
    location: Optional[str] = None
    timeline: Optional[str] = None
    source: str = "ai_chat"
    score: int = 0
    score_label: str = "cold"
    status: str = "new"
    
    
class ConversationState(BaseModel):
    session_id: str
    stage: str = ConversationStage.INIT.value
    lead_state: LeadState = LeadState()
    questions_asked: int = 0
    info_collected: int = 0
    phone_asked: bool = False
    project_shown: bool = False
    urgency_created: bool = False
    closing_attempted: bool = False
    booking_requested: bool = False
    deal_created: bool = False


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    stage: str
    lead_captured: bool = False
    lead_id: Optional[str] = None
    lead_score: Optional[str] = None
    deal_created: bool = False
    deal_id: Optional[str] = None
    suggested_projects: Optional[List[dict]] = None


class AnalyticsResponse(BaseModel):
    total_chats: int
    total_messages: int
    leads_captured: int
    hot_leads: int
    warm_leads: int
    cold_leads: int
    deals_created: int
    bookings_requested: int
    conversion_rate: float
    lead_capture_rate: float


# ===================== HELPER FUNCTIONS =====================

def extract_phone_number(text: str) -> Optional[str]:
    """Extract Vietnamese phone number from text"""
    patterns = [
        r'0[35789]\d{8}',
        r'\+84[35789]\d{8}',
        r'84[35789]\d{8}',
    ]
    clean_text = text.replace(' ', '').replace('.', '').replace('-', '')
    for pattern in patterns:
        match = re.search(pattern, clean_text)
        if match:
            phone = match.group()
            if phone.startswith('+84'):
                phone = '0' + phone[3:]
            elif phone.startswith('84') and len(phone) > 10:
                phone = '0' + phone[2:]
            return phone
    return None


def extract_purpose(text: str) -> Optional[str]:
    """Extract purchase purpose from text"""
    text_lower = text.lower()
    if any(w in text_lower for w in ['ở', 'sinh sống', 'gia đình', 'để ở', 'mua ở']):
        return 'o'
    if any(w in text_lower for w in ['đầu tư', 'dau tu', 'cho thuê', 'sinh lời', 'lâu dài']):
        return 'dau_tu'
    if any(w in text_lower for w in ['lướt', 'lướt sóng', 'ngắn hạn', 'bán lại']):
        return 'luot_song'
    return None


def extract_budget(text: str) -> Optional[str]:
    """Extract budget range from text"""
    text_lower = text.lower()
    
    # Look for explicit numbers
    billion_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:tỷ|ty|tỉ|ti|b)', text_lower)
    if billion_match:
        amount = float(billion_match.group(1))
        if amount < 1:
            return 'under_1b'
        elif amount <= 3:
            return '1_3b'
        elif amount <= 5:
            return '3_5b'
        else:
            return 'over_5b'
    
    # Look for ranges
    if any(w in text_lower for w in ['dưới 1', 'under 1', '< 1', 'tầm 1']):
        return 'under_1b'
    if any(w in text_lower for w in ['1-3', '1 đến 3', '2 tỷ', '2.5', 'tầm 2', 'khoảng 2']):
        return '1_3b'
    if any(w in text_lower for w in ['3-5', '3 đến 5', '4 tỷ', 'tầm 4', 'khoảng 4']):
        return '3_5b'
    if any(w in text_lower for w in ['trên 5', 'over 5', '> 5', '10 tỷ', '8 tỷ', 'cao cấp']):
        return 'over_5b'
    
    return None


def extract_location(text: str) -> Optional[str]:
    """Extract location from text"""
    text_lower = text.lower()
    
    locations = {
        'thủ đức': 'Thủ Đức',
        'thu duc': 'Thủ Đức',
        'quận 2': 'Quận 2',
        'q2': 'Quận 2',
        'q.2': 'Quận 2',
        'quận 9': 'Quận 9',
        'q9': 'Quận 9',
        'q.9': 'Quận 9',
        'quận 1': 'Quận 1',
        'q1': 'Quận 1',
        'q.1': 'Quận 1',
        'quận 7': 'Quận 7',
        'q7': 'Quận 7',
        'q.7': 'Quận 7',
        'bình dương': 'Bình Dương',
        'binh duong': 'Bình Dương',
        'đà nẵng': 'Đà Nẵng',
        'da nang': 'Đà Nẵng',
        'hà nội': 'Hà Nội',
        'ha noi': 'Hà Nội',
        'hcm': 'TP.HCM',
        'sài gòn': 'TP.HCM',
        'tp.hcm': 'TP.HCM',
        'thủ thiêm': 'Thủ Thiêm',
        'an phú': 'An Phú',
        'bình thạnh': 'Bình Thạnh',
        'tân bình': 'Tân Bình',
        'phú nhuận': 'Phú Nhuận',
    }
    
    for key, value in locations.items():
        if key in text_lower:
            return value
    return None


def extract_timeline(text: str) -> Optional[str]:
    """Extract purchase timeline from text"""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ['ngay', 'luôn', 'sớm', 'gấp', 'tuần này', 'tháng này']):
        return 'now'
    if any(w in text_lower for w in ['1-3 tháng', '2 tháng', '3 tháng', 'vài tháng', 'sắp tới']):
        return '1_3_months'
    if any(w in text_lower for w in ['chưa rõ', 'chưa biết', 'xem thôi', 'tìm hiểu', 'chưa có']):
        return 'unclear'
    
    return None


def calculate_lead_score(lead: LeadState) -> tuple[int, str]:
    """Calculate lead score based on collected info"""
    score = 0
    
    # +30 if timeline = now
    if lead.timeline == 'now':
        score += 30
    
    # +20 if budget > 3 tỷ
    if lead.budget_range in ['3_5b', 'over_5b']:
        score += 20
    
    # +20 if all 4 info collected
    info_count = sum([
        1 if lead.purpose else 0,
        1 if lead.budget_range else 0,
        1 if lead.location else 0,
        1 if lead.timeline else 0,
    ])
    if info_count >= 4:
        score += 20
    elif info_count >= 2:
        score += 10
    
    # +10 if has phone
    if lead.phone:
        score += 10
    
    # Determine label
    if score >= 60:
        label = 'hot'
    elif score >= 30:
        label = 'warm'
    else:
        label = 'cold'
    
    return score, label


def get_matching_projects(budget: Optional[str], location: Optional[str]) -> List[dict]:
    """Get projects matching budget and location"""
    all_projects = [
        {
            "name": "Vinhomes Grand Park",
            "location": "Thủ Đức",
            "price_from": 2,
            "discount": "10%",
            "units_left": 50,
            "budget_match": ["1_3b", "3_5b"],
        },
        {
            "name": "The Metropole",
            "location": "Thủ Thiêm",
            "price_from": 8,
            "discount": "Tặng nội thất 500tr",
            "units_left": 20,
            "budget_match": ["over_5b"],
        },
        {
            "name": "Eaton Park",
            "location": "Quận 2",
            "price_from": 5,
            "discount": "8%",
            "units_left": 35,
            "budget_match": ["3_5b", "over_5b"],
        },
        {
            "name": "Masteri Centre Point",
            "location": "Quận 9",
            "price_from": 3,
            "discount": "5%",
            "units_left": 30,
            "budget_match": ["1_3b", "3_5b"],
        },
        {
            "name": "Lumière Boulevard",
            "location": "Quận 9",
            "price_from": 4,
            "discount": "Tặng gói nội thất",
            "units_left": 40,
            "budget_match": ["3_5b"],
        },
        {
            "name": "The Global City",
            "location": "Thủ Đức",
            "price_from": 12,
            "discount": "CK 3% + vàng SJC",
            "units_left": 15,
            "budget_match": ["over_5b"],
        },
    ]
    
    matches = []
    for p in all_projects:
        # Budget match
        budget_ok = not budget or budget in p["budget_match"]
        
        # Location match (fuzzy)
        location_ok = not location or location.lower() in p["location"].lower() or p["location"].lower() in location.lower()
        
        if budget_ok or location_ok:
            matches.append({
                "name": p["name"],
                "location": p["location"],
                "price_from": f"{p['price_from']} tỷ",
                "discount": p["discount"],
                "units_left": p["units_left"],
            })
    
    return matches[:3]  # Max 3 projects


def determine_next_stage(state: ConversationState) -> str:
    """Determine next conversation stage based on current state"""
    lead = state.lead_state
    
    # Count collected info
    info_count = sum([
        1 if lead.purpose else 0,
        1 if lead.budget_range else 0,
        1 if lead.location else 0,
        1 if lead.timeline else 0,
    ])
    
    # If we have phone and enough info, move to closing stages
    if lead.phone:
        if state.deal_created:
            return ConversationStage.DONE.value
        if state.booking_requested:
            return ConversationStage.BOOKING.value
        if state.closing_attempted:
            return ConversationStage.BOOKING.value
        if state.urgency_created:
            return ConversationStage.CLOSING.value
        if state.project_shown:
            return ConversationStage.URGENCY.value
        return ConversationStage.MATCHING.value
    
    # If we have >= 2 info, ask for phone
    if info_count >= 2 and not state.phone_asked:
        return ConversationStage.LEAD_CAPTURE.value
    
    # Otherwise keep qualifying
    if info_count < 4:
        return ConversationStage.QUALIFYING.value
    
    return ConversationStage.LEAD_CAPTURE.value


def generate_stage_prompt(state: ConversationState) -> str:
    """Generate additional context for AI based on current stage"""
    lead = state.lead_state
    stage = state.stage
    
    prompt = f"\n\n[TRẠNG THÁI HIỆN TẠI]\n"
    prompt += f"Stage: {stage}\n"
    prompt += f"Thông tin đã thu:\n"
    prompt += f"- Mục đích: {lead.purpose or 'chưa có'}\n"
    prompt += f"- Ngân sách: {lead.budget_range or 'chưa có'}\n"
    prompt += f"- Khu vực: {lead.location or 'chưa có'}\n"
    prompt += f"- Timeline: {lead.timeline or 'chưa có'}\n"
    prompt += f"- SĐT: {lead.phone or 'chưa có'}\n"
    prompt += f"- Lead Score: {lead.score} ({lead.score_label.upper()})\n"
    
    # Stage-specific instructions
    if stage == ConversationStage.QUALIFYING.value:
        missing = []
        if not lead.purpose:
            missing.append("mục đích (ở/đầu tư)")
        if not lead.budget_range:
            missing.append("ngân sách")
        if not lead.location:
            missing.append("khu vực")
        if not lead.timeline:
            missing.append("thời gian mua")
        prompt += f"\n[NHIỆM VỤ] Hỏi thêm: {', '.join(missing[:2])}\n"
    
    elif stage == ConversationStage.LEAD_CAPTURE.value:
        prompt += "\n[NHIỆM VỤ] XIN SỐ ĐIỆN THOẠI ngay! Lý do: để gửi thông tin chi tiết và hỗ trợ nhanh nhất.\n"
    
    elif stage == ConversationStage.MATCHING.value:
        projects = get_matching_projects(lead.budget_range, lead.location)
        if projects:
            prompt += f"\n[NHIỆM VỤ] Gợi ý dự án phù hợp:\n"
            for p in projects[:2]:
                prompt += f"- {p['name']} ({p['location']}): từ {p['price_from']}, ưu đãi {p['discount']}, còn {p['units_left']} căn\n"
    
    elif stage == ConversationStage.URGENCY.value:
        prompt += "\n[NHIỆM VỤ] Tạo URGENCY: nhấn mạnh số lượng có hạn, chính sách chỉ trong tháng này.\n"
    
    elif stage == ConversationStage.CLOSING.value:
        prompt += "\n[NHIỆM VỤ] CHỐT LỊCH! Hỏi: 'Anh/chị muốn em hỗ trợ đặt lịch xem nhà hoặc gọi tư vấn nhanh không ạ?'\n"
    
    elif stage == ConversationStage.BOOKING.value:
        prompt += "\n[NHIỆM VỤ] Lấy thông tin đặt lịch: thời gian rảnh, khu vực muốn xem.\n"
    
    return prompt


async def get_ai_response(session_id: str, user_message: str, chat_history: List[dict], state: ConversationState) -> str:
    """Get AI response with sales context"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found")
        
        # Build full system prompt with state
        full_prompt = SALES_SYSTEM_PROMPT + generate_stage_prompt(state)
        
        # Create chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=f"sales_{session_id}",
            system_message=full_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Add recent history (last 6 messages for context)
        for msg in chat_history[-6:]:
            if msg['role'] == 'user':
                user_msg = UserMessage(text=msg['content'])
                await chat.send_message(user_msg)
        
        # Send current message
        user_msg = UserMessage(text=user_message)
        response = await chat.send_message(user_msg)
        
        return response
        
    except Exception as e:
        print(f"AI Error: {e}")
        traceback.print_exc()
        return generate_fallback_response(state)


def generate_fallback_response(state: ConversationState) -> str:
    """Generate fallback response based on stage"""
    stage = state.stage
    
    if stage == ConversationStage.INIT.value:
        return "Xin chào anh/chị 👋 Em là tư vấn BĐS của ProHouzing. Hiện bên em đang có dự án giá rất tốt. Anh/chị đang tìm mua để ở hay đầu tư ạ?"
    
    elif stage == ConversationStage.QUALIFYING.value:
        if not state.lead_state.budget_range:
            return "Dạ, anh/chị dự kiến ngân sách khoảng bao nhiêu ạ? (VD: 2-3 tỷ, 5 tỷ...)"
        if not state.lead_state.location:
            return "Anh/chị quan tâm khu vực nào ạ? (VD: Thủ Đức, Q.2, Q.9...)"
        return "Anh/chị dự định mua trong thời gian tới hay đang tìm hiểu ạ?"
    
    elif stage == ConversationStage.LEAD_CAPTURE.value:
        return "Anh/chị cho em xin số điện thoại để em gửi thông tin chi tiết và hỗ trợ nhanh nhất nhé ạ. 📱"
    
    elif stage == ConversationStage.MATCHING.value:
        return "Dựa trên nhu cầu của anh/chị, em thấy có Vinhomes Grand Park (Thủ Đức) rất phù hợp - giá từ 2 tỷ, đang ưu đãi 10%. Hiện chỉ còn 50 căn giá tốt!"
    
    elif stage == ConversationStage.URGENCY.value:
        return "⚡ Dự án đang có chính sách tốt trong tháng này, số căn giá tốt không còn nhiều. Anh/chị nên quyết định sớm để giữ được giá ưu đãi ạ!"
    
    elif stage == ConversationStage.CLOSING.value:
        return "Anh/chị muốn em hỗ trợ đặt lịch XEM NHÀ TRỰC TIẾP hoặc gọi tư vấn chi tiết không ạ? 📅"
    
    elif stage == ConversationStage.BOOKING.value:
        return "Anh/chị cho em xin thời gian rảnh (VD: T7, CN) và khu vực muốn xem. Em sẽ sắp xếp chuyên viên hỗ trợ trực tiếp ạ!"
    
    return "Cảm ơn anh/chị đã quan tâm! Em sẽ liên hệ lại trong 15 phút ạ. 🙏"


async def save_lead(lead: LeadState, session_id: str) -> str:
    """Save or update lead in MongoDB"""
    lead_doc = {
        "name": lead.name or "Khách từ AI Chat",
        "phone": lead.phone,
        "purpose": lead.purpose,
        "budget_range": lead.budget_range,
        "location": lead.location,
        "timeline": lead.timeline,
        "source": "ai_sales_engine",
        "score": lead.score,
        "score_label": lead.score_label,
        "status": lead.status,
        "session_id": session_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Check existing by phone
    if lead.phone:
        existing = await leads_collection.find_one({"phone": lead.phone})
        if existing:
            await leads_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "score": lead.score,
                    "score_label": lead.score_label,
                    "updated_at": datetime.now(timezone.utc),
                }}
            )
            return str(existing["_id"])
    
    result = await leads_collection.insert_one(lead_doc)
    return str(result.inserted_id)


async def create_deal(lead_id: str, lead: LeadState, session_id: str) -> str:
    """Auto-create deal when conditions are met"""
    deal_doc = {
        "lead_id": lead_id,
        "session_id": session_id,
        "customer_name": lead.name or "Khách từ AI",
        "phone": lead.phone,
        "budget": lead.budget_range,
        "location": lead.location,
        "purpose": lead.purpose,
        "status": "new",
        "source": "ai_sales_engine",
        "assigned_to": None,  # Auto-assign later
        "created_at": datetime.now(timezone.utc),
    }
    
    result = await deals_collection.insert_one(deal_doc)
    return str(result.inserted_id)


async def update_analytics(event: str):
    """Update analytics counters"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await analytics_collection.update_one(
        {"date": today},
        {
            "$inc": {event: 1},
            "$setOnInsert": {"date": today}
        },
        upsert=True
    )


async def get_or_create_state(session_id: str) -> ConversationState:
    """Get or create conversation state"""
    chat = await chats_collection.find_one({"session_id": session_id})
    
    if chat and chat.get("state"):
        state_data = chat["state"]
        lead_data = state_data.get("lead_state", {})
        lead = LeadState(**lead_data) if lead_data else LeadState()
        return ConversationState(
            session_id=session_id,
            stage=state_data.get("stage", ConversationStage.INIT.value),
            lead_state=lead,
            questions_asked=state_data.get("questions_asked", 0),
            info_collected=state_data.get("info_collected", 0),
            phone_asked=state_data.get("phone_asked", False),
            project_shown=state_data.get("project_shown", False),
            urgency_created=state_data.get("urgency_created", False),
            closing_attempted=state_data.get("closing_attempted", False),
            booking_requested=state_data.get("booking_requested", False),
            deal_created=state_data.get("deal_created", False),
        )
    
    return ConversationState(session_id=session_id)


async def save_state(state: ConversationState):
    """Save conversation state"""
    state_dict = {
        "stage": state.stage,
        "lead_state": state.lead_state.dict(),
        "questions_asked": state.questions_asked,
        "info_collected": state.info_collected,
        "phone_asked": state.phone_asked,
        "project_shown": state.project_shown,
        "urgency_created": state.urgency_created,
        "closing_attempted": state.closing_attempted,
        "booking_requested": state.booking_requested,
        "deal_created": state.deal_created,
    }
    
    await chats_collection.update_one(
        {"session_id": state.session_id},
        {
            "$set": {
                "state": state_dict,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {"created_at": datetime.now(timezone.utc)},
            "$inc": {"message_count": 1}
        },
        upsert=True
    )


# ===================== API ENDPOINTS =====================

@router.post("/chat", response_model=ChatResponse)
async def sales_chat(request: ChatRequest):
    """Main sales chat endpoint - AI SALES ENGINE"""
    
    # Generate or use session ID
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get conversation state
    state = await get_or_create_state(session_id)
    
    # Get chat history
    history = []
    async for msg in messages_collection.find({"session_id": session_id}).sort("timestamp", 1):
        history.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Extract info from user message
    user_message = request.message
    
    # Extract phone
    phone = extract_phone_number(user_message)
    if phone:
        state.lead_state.phone = phone
    
    # Extract purpose
    purpose = extract_purpose(user_message)
    if purpose:
        state.lead_state.purpose = purpose
    
    # Extract budget
    budget = extract_budget(user_message)
    if budget:
        state.lead_state.budget_range = budget
    
    # Extract location
    location = extract_location(user_message)
    if location:
        state.lead_state.location = location
    
    # Extract timeline
    timeline = extract_timeline(user_message)
    if timeline:
        state.lead_state.timeline = timeline
    
    # Update user name if provided
    if request.user_name:
        state.lead_state.name = request.user_name
    
    # Calculate lead score
    score, label = calculate_lead_score(state.lead_state)
    state.lead_state.score = score
    state.lead_state.score_label = label
    
    # Determine next stage
    state.stage = determine_next_stage(state)
    
    # Track stage transitions
    if state.stage == ConversationStage.LEAD_CAPTURE.value:
        state.phone_asked = True
    elif state.stage == ConversationStage.MATCHING.value:
        state.project_shown = True
    elif state.stage == ConversationStage.URGENCY.value:
        state.urgency_created = True
    elif state.stage == ConversationStage.CLOSING.value:
        state.closing_attempted = True
    elif state.stage == ConversationStage.BOOKING.value:
        state.booking_requested = True
    
    # Save user message
    await messages_collection.insert_one({
        "session_id": session_id,
        "role": "user",
        "content": user_message,
        "timestamp": datetime.now(timezone.utc),
        "extracted_info": {
            "phone": phone,
            "purpose": purpose,
            "budget": budget,
            "location": location,
            "timeline": timeline,
        }
    })
    
    # Get AI response
    ai_response = await get_ai_response(session_id, user_message, history, state)
    
    # Save AI response
    await messages_collection.insert_one({
        "session_id": session_id,
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.now(timezone.utc),
        "stage": state.stage,
    })
    
    # Handle lead capture
    lead_captured = False
    lead_id = None
    if phone and not state.deal_created:
        lead_id = await save_lead(state.lead_state, session_id)
        lead_captured = True
        await update_analytics("leads_captured")
        
        if label == "hot":
            await update_analytics("hot_leads")
        elif label == "warm":
            await update_analytics("warm_leads")
        else:
            await update_analytics("cold_leads")
    
    # Auto-create deal if conditions met
    deal_created = False
    deal_id = None
    if (state.lead_state.phone and 
        state.lead_state.budget_range and 
        state.lead_state.location and 
        not state.deal_created):
        
        if not lead_id:
            lead_id = await save_lead(state.lead_state, session_id)
        
        deal_id = await create_deal(lead_id, state.lead_state, session_id)
        deal_created = True
        state.deal_created = True
        await update_analytics("deals_created")
    
    # Save state
    await save_state(state)
    
    # Update analytics
    await update_analytics("total_messages")
    if len(history) == 0:
        await update_analytics("total_chats")
    
    # Get matching projects for response
    projects = None
    if state.stage in [ConversationStage.MATCHING.value, ConversationStage.URGENCY.value]:
        projects = get_matching_projects(state.lead_state.budget_range, state.lead_state.location)
    
    return ChatResponse(
        session_id=session_id,
        message=ai_response,
        stage=state.stage,
        lead_captured=lead_captured,
        lead_id=lead_id,
        lead_score=label if lead_captured else None,
        deal_created=deal_created,
        deal_id=deal_id,
        suggested_projects=projects,
    )


@router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history with state"""
    messages = []
    async for msg in messages_collection.find({"session_id": session_id}).sort("timestamp", 1):
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat() if msg.get("timestamp") else None,
            "stage": msg.get("stage"),
        })
    
    state = await get_or_create_state(session_id)
    
    return {
        "session_id": session_id,
        "messages": messages,
        "state": {
            "stage": state.stage,
            "lead_score": state.lead_state.score,
            "lead_score_label": state.lead_state.score_label,
            "phone_captured": bool(state.lead_state.phone),
            "deal_created": state.deal_created,
        }
    }


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics():
    """Get AI sales analytics"""
    # Aggregate all time stats
    pipeline = [
        {
            "$group": {
                "_id": None,
                "total_chats": {"$sum": "$total_chats"},
                "total_messages": {"$sum": "$total_messages"},
                "leads_captured": {"$sum": "$leads_captured"},
                "hot_leads": {"$sum": "$hot_leads"},
                "warm_leads": {"$sum": "$warm_leads"},
                "cold_leads": {"$sum": "$cold_leads"},
                "deals_created": {"$sum": "$deals_created"},
                "bookings_requested": {"$sum": {"$ifNull": ["$bookings_requested", 0]}},
            }
        }
    ]
    
    result = await analytics_collection.aggregate(pipeline).to_list(1)
    
    if result:
        stats = result[0]
        total_chats = stats.get("total_chats", 0) or 1
        leads = stats.get("leads_captured", 0)
        deals = stats.get("deals_created", 0)
        
        return AnalyticsResponse(
            total_chats=stats.get("total_chats", 0),
            total_messages=stats.get("total_messages", 0),
            leads_captured=leads,
            hot_leads=stats.get("hot_leads", 0),
            warm_leads=stats.get("warm_leads", 0),
            cold_leads=stats.get("cold_leads", 0),
            deals_created=deals,
            bookings_requested=stats.get("bookings_requested", 0),
            conversion_rate=round((deals / leads * 100) if leads > 0 else 0, 1),
            lead_capture_rate=round((leads / total_chats * 100), 1),
        )
    
    return AnalyticsResponse(
        total_chats=0,
        total_messages=0,
        leads_captured=0,
        hot_leads=0,
        warm_leads=0,
        cold_leads=0,
        deals_created=0,
        bookings_requested=0,
        conversion_rate=0,
        lead_capture_rate=0,
    )


@router.get("/leads")
async def list_leads(
    score: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """List leads from AI sales engine"""
    query = {"source": {"$in": ["ai_sales_engine", "ai_chat"]}}
    if score:
        query["score_label"] = score
    if status:
        query["status"] = status
    
    leads = []
    async for lead in leads_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        leads.append({
            "id": str(lead["_id"]),
            "name": lead.get("name"),
            "phone": lead.get("phone"),
            "purpose": lead.get("purpose"),
            "budget_range": lead.get("budget_range"),
            "location": lead.get("location"),
            "timeline": lead.get("timeline"),
            "score": lead.get("score", 0),
            "score_label": lead.get("score_label", "cold"),
            "status": lead.get("status", "new"),
            "created_at": lead["created_at"].isoformat() if lead.get("created_at") else None,
        })
    
    total = await leads_collection.count_documents(query)
    
    return {
        "total": total,
        "items": leads,
    }


@router.get("/deals")
async def list_deals(
    status: Optional[str] = None,
    limit: int = 50,
):
    """List deals created by AI sales engine"""
    query = {"source": "ai_sales_engine"}
    if status:
        query["status"] = status
    
    deals = []
    async for deal in deals_collection.find(query).sort("created_at", -1).limit(limit):
        deals.append({
            "id": str(deal["_id"]),
            "lead_id": deal.get("lead_id"),
            "customer_name": deal.get("customer_name"),
            "phone": deal.get("phone"),
            "budget": deal.get("budget"),
            "location": deal.get("location"),
            "status": deal.get("status", "new"),
            "created_at": deal["created_at"].isoformat() if deal.get("created_at") else None,
        })
    
    total = await deals_collection.count_documents(query)
    
    return {
        "total": total,
        "items": deals,
    }
