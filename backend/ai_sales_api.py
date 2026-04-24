"""
AI Sales Assistant API for ProHouzing Homepage
Handles:
1. AI Chat with GPT-5.2 for real estate consultation
2. Lead capture from chat conversations
3. Chat history persistence
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from bson import ObjectId
import os
import uuid
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

# AI System Prompt for Real Estate Sales
AI_SYSTEM_PROMPT = """Bạn là chuyên viên tư vấn bất động sản của ProHouzing - công ty phân phối BĐS trực tiếp từ chủ đầu tư.

NHIỆM VỤ CỦA BẠN:
1. Tư vấn khách hàng về bất động sản một cách chuyên nghiệp, thân thiện
2. Thu thập thông tin nhu cầu khách hàng
3. Gợi ý dự án phù hợp
4. Thu lead (tên, số điện thoại)

QUY TRÌNH TƯ VẤN:
1. Chào hỏi, giới thiệu ngắn gọn
2. Hỏi về ngân sách (bao nhiêu tỷ?)
3. Hỏi về khu vực quan tâm (Q.1, Q.2, Thủ Đức, Bình Dương...?)
4. Hỏi về mục đích: mua ở hay đầu tư?
5. Gợi ý 2-3 dự án phù hợp với thông tin ngắn gọn
6. Mời khách để lại SỐ ĐIỆN THOẠI để nhân viên liên hệ tư vấn chi tiết

DỰ ÁN ĐANG BÁN:
- Vinhomes Grand Park (Thủ Đức): Căn hộ từ 2 tỷ, biệt thự từ 15 tỷ
- The Metropole (Thủ Thiêm): Căn hộ cao cấp từ 8 tỷ
- Eaton Park (Q.2): Căn hộ từ 5 tỷ
- Masteri Centre Point (Q.9): Căn hộ từ 3 tỷ
- Lumière Boulevard (Q.9): Căn hộ từ 4 tỷ
- The Global City (Thủ Đức): Nhà phố từ 12 tỷ

LƯU Ý:
- Trả lời ngắn gọn, dễ hiểu (2-3 câu mỗi lần)
- Không dùng thuật ngữ kỹ thuật khó hiểu
- Luôn hướng đến việc thu lead (số điện thoại)
- Nếu khách cho SĐT, cảm ơn và hứa sẽ liên hệ trong 15 phút
- Thân thiện, chuyên nghiệp, không spam

KHI KHÁCH CUNG CẤP SỐ ĐIỆN THOẠI:
Trả lời: "Cảm ơn anh/chị! Em đã ghi nhận thông tin. Chuyên viên tư vấn sẽ liên hệ trong vòng 15 phút để hỗ trợ chi tiết hơn ạ. Anh/chị có câu hỏi gì thêm không ạ?"
"""

# Fallback responses when AI fails
FALLBACK_RESPONSES = [
    "Xin chào! Em là trợ lý tư vấn BĐS của ProHouzing. Anh/chị đang tìm kiếm căn hộ hay nhà phố ạ?",
    "Dạ, anh/chị có thể cho em biết ngân sách dự kiến và khu vực quan tâm được không ạ?",
    "ProHouzing hiện đang phân phối nhiều dự án từ các chủ đầu tư uy tín như Vingroup, Masterise, Novaland. Anh/chị quan tâm khu vực nào ạ?",
    "Để em tư vấn chính xác hơn, anh/chị vui lòng để lại số điện thoại, chuyên viên sẽ liên hệ trong 15 phút ạ!",
]


# ===================== MODELS =====================

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    user_name: Optional[str] = None
    user_phone: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    message: str
    lead_captured: bool = False
    lead_id: Optional[str] = None


class LeadCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    source: str = "ai_chat"
    interest: Optional[str] = None
    budget: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    session_id: Optional[str] = None


class LeadResponse(BaseModel):
    id: str
    name: str
    phone: str
    status: str
    created_at: datetime


# ===================== HELPER FUNCTIONS =====================

def extract_phone_number(text: str) -> Optional[str]:
    """Extract Vietnamese phone number from text"""
    import re
    # Vietnamese phone patterns: 0xxx, +84xxx, 84xxx
    patterns = [
        r'0[35789]\d{8}',  # 10 digits starting with 03, 05, 07, 08, 09
        r'\+84[35789]\d{8}',  # With +84 prefix
        r'84[35789]\d{8}',  # With 84 prefix
    ]
    for pattern in patterns:
        match = re.search(pattern, text.replace(' ', '').replace('.', '').replace('-', ''))
        if match:
            phone = match.group()
            # Normalize to 0xxx format
            if phone.startswith('+84'):
                phone = '0' + phone[3:]
            elif phone.startswith('84'):
                phone = '0' + phone[2:]
            return phone
    return None


async def get_ai_response(session_id: str, user_message: str, chat_history: List[dict]) -> str:
    """Get AI response using emergentintegrations"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found")
        
        # Create chat instance
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=AI_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Add history to context (last 10 messages)
        for msg in chat_history[-10:]:
            if msg['role'] == 'user':
                user_msg = UserMessage(text=msg['content'])
                await chat.send_message(user_msg)
            # Note: Assistant messages are auto-managed by the library
        
        # Send current message
        user_msg = UserMessage(text=user_message)
        response = await chat.send_message(user_msg)
        
        return response
        
    except Exception as e:
        print(f"AI Error: {e}")
        traceback.print_exc()
        # Return fallback response
        import random
        return random.choice(FALLBACK_RESPONSES)


async def save_lead(lead_data: dict) -> str:
    """Save lead to MongoDB"""
    lead_doc = {
        **lead_data,
        "status": "new",
        "source": lead_data.get("source", "ai_chat"),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "assigned_to": None,
        "follow_up_count": 0,
    }
    result = await leads_collection.insert_one(lead_doc)
    return str(result.inserted_id)


# ===================== API ENDPOINTS =====================

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Main chat endpoint for AI Sales Assistant"""
    
    # Generate or use existing session ID
    session_id = request.session_id or str(uuid.uuid4())
    
    # Get chat history
    history = []
    async for msg in messages_collection.find({"session_id": session_id}).sort("timestamp", 1):
        history.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    
    # Check for phone number in message
    phone = extract_phone_number(request.message)
    lead_captured = False
    lead_id = None
    
    if phone:
        # Check if this phone already exists
        existing_lead = await leads_collection.find_one({"phone": phone})
        if not existing_lead:
            # Create new lead
            lead_data = {
                "name": request.user_name or "Khách từ AI Chat",
                "phone": phone,
                "source": "ai_chat",
                "session_id": session_id,
                "notes": f"Thu từ AI chat. Tin nhắn: {request.message[:200]}",
            }
            lead_id = await save_lead(lead_data)
            lead_captured = True
    
    # Save user message
    await messages_collection.insert_one({
        "session_id": session_id,
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(timezone.utc),
        "lead_captured": lead_captured,
    })
    
    # Get AI response
    ai_response = await get_ai_response(session_id, request.message, history)
    
    # Save AI response
    await messages_collection.insert_one({
        "session_id": session_id,
        "role": "assistant",
        "content": ai_response,
        "timestamp": datetime.now(timezone.utc),
    })
    
    # Update or create chat session
    await chats_collection.update_one(
        {"session_id": session_id},
        {
            "$set": {
                "updated_at": datetime.now(timezone.utc),
                "last_message": request.message[:100],
                "lead_captured": lead_captured or (await chats_collection.find_one({"session_id": session_id, "lead_captured": True})) is not None,
            },
            "$setOnInsert": {
                "created_at": datetime.now(timezone.utc),
            },
            "$inc": {"message_count": 2}
        },
        upsert=True
    )
    
    return ChatResponse(
        session_id=session_id,
        message=ai_response,
        lead_captured=lead_captured,
        lead_id=lead_id,
    )


@router.get("/chat/{session_id}/history")
async def get_chat_history(session_id: str):
    """Get chat history for a session"""
    messages = []
    async for msg in messages_collection.find({"session_id": session_id}).sort("timestamp", 1):
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
            "timestamp": msg["timestamp"].isoformat() if msg.get("timestamp") else None,
        })
    return {"session_id": session_id, "messages": messages}


@router.post("/lead", response_model=LeadResponse)
async def create_lead(lead: LeadCreate):
    """Create a new lead from form submission"""
    
    # Check for duplicate phone
    existing = await leads_collection.find_one({"phone": lead.phone})
    if existing:
        # Update existing lead
        await leads_collection.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                    "notes": f"{existing.get('notes', '')}\n[Update] {lead.notes or 'Form resubmit'}",
                }
            }
        )
        return LeadResponse(
            id=str(existing["_id"]),
            name=existing["name"],
            phone=existing["phone"],
            status=existing.get("status", "new"),
            created_at=existing["created_at"],
        )
    
    # Create new lead
    lead_doc = {
        "name": lead.name,
        "phone": lead.phone,
        "email": lead.email,
        "source": lead.source,
        "interest": lead.interest,
        "budget": lead.budget,
        "location": lead.location,
        "notes": lead.notes,
        "session_id": lead.session_id,
        "status": "new",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "assigned_to": None,
    }
    
    result = await leads_collection.insert_one(lead_doc)
    
    return LeadResponse(
        id=str(result.inserted_id),
        name=lead.name,
        phone=lead.phone,
        status="new",
        created_at=lead_doc["created_at"],
    )


@router.get("/leads")
async def list_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
):
    """List leads for internal use"""
    query = {}
    if status:
        query["status"] = status
    if source:
        query["source"] = source
    
    leads = []
    async for lead in leads_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        leads.append({
            "id": str(lead["_id"]),
            "name": lead["name"],
            "phone": lead["phone"],
            "email": lead.get("email"),
            "source": lead.get("source"),
            "status": lead.get("status", "new"),
            "created_at": lead["created_at"].isoformat() if lead.get("created_at") else None,
        })
    
    total = await leads_collection.count_documents(query)
    
    return {
        "total": total,
        "items": leads,
    }


@router.get("/stats")
async def get_chat_stats():
    """Get AI chat statistics"""
    total_chats = await chats_collection.count_documents({})
    total_messages = await messages_collection.count_documents({})
    total_leads = await leads_collection.count_documents({"source": "ai_chat"})
    leads_today = await leads_collection.count_documents({
        "source": "ai_chat",
        "created_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
    })
    
    return {
        "total_chats": total_chats,
        "total_messages": total_messages,
        "total_leads_from_ai": total_leads,
        "leads_today": leads_today,
    }
