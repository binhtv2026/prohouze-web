"""
ai_copilot_api.py — Staff AI Copilot Endpoint
===============================================
Endpoint dành riêng cho nhân viên nội bộ ProHouzing.
Khác với ai_sales_engine.py (public chatbot để chốt deal với khách),
endpoint này là trợ lý tư vấn nội bộ:
- Biết toàn bộ knowledge base dự án (NOBU Danang + sẽ mở rộng)
- Biết quy trình nội bộ (deal stages, KPI, follow-up)
- Role-aware: sale vs manager vs admin vs director
- Context-aware: biết user đang ở trang nào, xem dự án nào
- Luôn có local fallback nếu LLM API không khả dụng

Endpoint: POST /api/ai/copilot/chat
"""

from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import os, uuid, re

router = APIRouter(prefix="/ai/copilot", tags=["AI Copilot — Internal Staff"])

# ──────────────────────────────────────────────────────────────────────────────
# KNOWLEDGE BASE — DỰ ÁN (sync với frontend aiKnowledgeBase.js)
# ──────────────────────────────────────────────────────────────────────────────
PROJECTS_KNOWLEDGE = """
=== DỰ ÁN 1: NOBU RESIDENCES DANANG ===
Nguồn: Factsheet + FAQ + Booking Form (VCRE)

1. TỔNG QUAN
- Tên: Nobu Residences Danang
- CĐT: Circle Point Real Estate JSC (VCRE / Phoenix Holdings)
- Vận hành: Nobu Hospitality
- Vị trí: Lô A2 góc Võ Nguyên Giáp – Võ Văn Kiệt, Đà Nẵng
- Quy mô: 43 tầng, 264 căn nghỉ dưỡng. Khai trương: 2027

2. CAM KẾT & CHƯƠNG TRÌNH CHO THUÊ (CTCT)
- Cam kết 6%/năm trong 2 năm đầu.
- Sau 2 năm: chia sẻ 40% gross revenue.
- Tầng 19-33: BẮT BUỘC tham gia CTCT.
- 45 điểm nghỉ dưỡng/năm.

3. LOẠI CĂN
- Studio (~36-40m²): 3.8 triệu/đêm
- 1PN (~52-58m²): 5.5 triệu/đêm
- 2PN (~74-82m²): 9.5 triệu/đêm
- 3PN Dual Key: 12 triệu/đêm
- Sky Villa (có hồ bơi): 30 triệu/đêm

=== DỰ ÁN 2: SUN SYMPHONY RESIDENCE ===
Nguồn: Thông tin chính thức từ CĐT S-Realty (Sun Group)

1. TỔNG QUAN
- Tên dự án: Sun Symphony Residence (Phân khu Căn hộ: The Symphony)
- CĐT: Công ty TNHH Bất động sản S-Realty Đà Nẵng (thuộc Sun Group)
- Vị trí: Mặt tiền đường Trần Hưng Đạo, bên Sông Hàn, Đà Nẵng
- Quy mô Symphony: 30 tầng nổi, 3 tầng hầm, 1373 căn hộ.
- Khai trương: 2026.
- Hình thức sở hữu: Lâu dài đối với người Việt Nam.

2. LOẠI CĂN (Khai thác tự do, không bắt buộc cho thuê)
- Studio (35-38m²)
- 1PN (50-55m²)
- 2PN (68-80m²)
- 3PN (90-110m²)
- Duplex / Penthouse (>150m², tầng 29-30)

3. CHÍNH SÁCH BÁN HÀNG & ƯU ĐÃI
- Không vay: Chiết khấu 6%.
- Thanh toán sớm 95%: Chiết khấu 9.5%.
- Vay ngân hàng: Hỗ trợ vay 70%, ân hạn nợ gốc và miễn lãi tối đa 30 tháng (không muộn hơn 31/03/2027). Ngân hàng: NCB, VietinBank, MB.
- Miễn phí 3 năm dịch vụ quản lý căn hộ.
- Chiết khấu 1% - 1.5% khi mua BĐS thứ 2 của Sun Group.

4. USP CHỐT DEAL
- Vị trí kim cương bên bờ sông Hàn, ngắm trọn pháo hoa quốc tế DIFF.
- Tiện ích chuẩn resort nội khu (Bể bơi, Gym, Spa).
- Chủ đầu tư uy tín bậc nhất (Sun Group).
- Sở hữu lâu dài ngay tại trung tâm Đà Nẵng.

=== QUY TRÌNH NỘI BỘ PROHOUZING ===
- Deal stages: Lead mới → Đã liên hệ → Qualified → Đặt lịch xem → Đàm phán → Đặt cọc → Ký HĐ → Chốt
- KPI sale/tháng: 10 lead mới, 4 qualified, 1 booking, 0.5 closing
- Follow-up nguyên tắc: liên hệ trong 2h với HOT, 24h với WARM, 3 ngày với COLD
"""

ROLE_CONTEXT = {
    "sale": "Bạn là trợ lý AI dành cho nhân viên kinh doanh ProHouzing. Tập trung vào: thông tin dự án, script tư vấn, xử lý phản đối, gợi ý follow-up, so sánh loại căn.",
    "manager": "Bạn là trợ lý AI dành cho quản lý kinh doanh ProHouzing. Tập trung vào: phân tích team, giao việc, cảnh báo deal rủi ro, coaching, báo cáo.",
    "admin": "Bạn là trợ lý AI dành cho admin ProHouzing. Tập trung vào: quản lý dữ liệu, phân quyền, cấu hình hệ thống, quy trình nội bộ.",
    "director": "Bạn là trợ lý AI dành cho ban lãnh đạo ProHouzing. Tập trung vào: tổng quan kinh doanh, rủi ro, dòng tiền, quyết định chiến lược.",
    "hr": "Bạn là trợ lý AI dành cho nhân sự ProHouzing. Tập trung vào: tuyển dụng, onboarding, đào tạo, hiệu suất nhân viên.",
}

SYSTEM_PROMPT_TEMPLATE = """Bạn là Trợ lý AI ProHouzing — trợ lý thông minh dành riêng cho nội bộ công ty.

{role_context}

NGUYÊN TẮC TRẢ LỜI:
1. Trả lời NGẮN GỌN, CHÍNH XÁC, THỰC DỤNG
2. Dùng markdown: **bold**, bullet point, bảng khi cần
3. Luôn trả lời bằng Tiếng Việt
4. Nếu không biết → thành thật nói không biết, không bịa
5. Ưu tiên dữ liệu chính thức từ tài liệu VCRE

{context_block}

TRI THỨC DỰ ÁN:
{knowledge}

Người dùng: {user_name} | Vai trò: {role}"""


# ──────────────────────────────────────────────────────────────────────────────
# MODELS
# ──────────────────────────────────────────────────────────────────────────────
class CopilotChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    role: Optional[str] = "sale"
    user_name: Optional[str] = "Nhân viên"
    page_context: Optional[str] = None      # e.g. "project:NBU", "deal:123", "home"
    project_id: Optional[str] = "NBU"
    history: Optional[List[Dict[str, str]]] = []


class CopilotChatResponse(BaseModel):
    session_id: str
    message: str
    source: str  # "gpt" | "local"
    role: str
    timestamp: str
    suggestions: Optional[List[str]] = []


# ──────────────────────────────────────────────────────────────────────────────
# LOCAL RULE ENGINE — fallback khi không có API
# ──────────────────────────────────────────────────────────────────────────────
def local_answer(question: str, role: str = "sale") -> str:
    q = question.lower()

    if any(w in q for w in ["xin chào", "chào", "hello", "hi"]):
        return f"Xin chào! 👋 Tôi là trợ lý AI ProHouzing. Tôi biết thông tin về **NOBU Danang** và **Sun Symphony Residence**. Hỏi tôi nhé!"

    if any(w in q for w in ["cam kết", "roi", "6%", "lợi nhuận", "sinh lời"]):
        return "**Cam kết lợi nhuận:**\n\n✅ **NOBU Danang:** 6%/năm trong 2 năm đầu, sau đó 40% doanh thu gộp.\n✅ **Sun Symphony:** Không có cam kết thuê, khách tự do để ở hoặc tự khai thác kinh doanh."

    if any(w in q for w in ["ctct", "chương trình cho thuê", "25 năm", "10 năm", "bắt buộc"]):
        return "**CTCT:**\n\n• **NOBU:** 25 năm / 4 kỳ. Bắt buộc tham gia 10 năm đầu cho tầng 19-33.\n• **Sun Symphony:** Không có CTCT bắt buộc. Khách sở hữu lâu dài tự quyết định."

    if any(w in q for w in ["symphony", "sun", "ssr"]):
        return "**Sun Symphony Residence (Đà Nẵng):**\n\n🏢 Chủ đầu tư: Sun Group\n📍 Vị trí: Sông Hàn, ngắm pháo hoa DIFF\n💰 Ưu đãi: Vay 70% ân hạn 30 tháng, hoặc CK 6% (không vay), thanh toán 95% CK 9.5%.\🎁 Quà tặng: Miễn phí 3 năm dịch vụ quản lý."

    if any(w in q for w in ["điểm", "45 điểm", "đổi đêm", "miễn phí", "nghỉ dưỡng"]):
        return "**Nghỉ dưỡng:**\n\n• **NOBU:** 45 điểm/năm đổi đêm nghỉ miễn phí trên toàn cầu.\n• **Sun Symphony:** Không có đổi đêm. Nhận gói trải nghiệm Sun Group (CK 0.5-2%)."

    if any(w in q for w in ["pháp lý", "gcn", "gpxd", "ms065", "giấy tờ"]):
        return "**Pháp lý NOBU (4 loại đầy đủ):**\n\n✅ GCN QSDĐ\n✅ GCN Đăng ký DN\n✅ GPXD + Phụ lục\n✅ GCN ĐT **MS0650824421**\n\n🏦 NH hỗ trợ: **MB Bank + BVBank**\n💳 TK: **617 7979 686868 – BVBank**"

    if any(w in q for w in ["phản đối", "objection", "từ chối", "lo ngại", "băn khoăn", "condotel"]):
        return "**Xử lý phản đối chính:**\n\n1. **Condotel 50 năm?** → ĐN bền vững, vị trí di sản, Nobu 5 sao, branded tăng giá, gia hạn PL\n2. **VCRE mới?** → Phoenix Holdings = BVBank+Vietcap+7-Eleven+McDonald's\n3. **Không tự cho thuê?** → Bù lại: 40%+45đêm+kiểm toán minh bạch\n4. **Phí QL?** → 45k/m²/tháng đã tính trong ROI 6%"

    if any(w in q for w in ["soạn", "viết", "follow-up", "email", "tin nhắn", "script", "kịch bản"]):
        if "hot" in q or "nóng" in q:
            return "**Script follow-up NÓNG 🔴:**\n\n> \"Anh/chị [Tên] ơi, em [Sale] từ ProHouzing. Căn [Mã căn] anh/chị đang hold còn hiệu lực đến [Ngày]. Em cần confirm để giữ ưu tiên. Anh/chị có thể xác nhận hôm nay không ạ?\"\n\n*→ Thay nội dung trong [ ] theo thực tế*"
        elif "lạnh" in q or "cold" in q:
            return "**Script follow-up LẠNH 🔵:**\n\n> \"Anh/chị [Tên] ơi, em [Sale] từ ProHouzing. Hôm trước anh/chị có tìm hiểu về [Dự án]. Anh/chị có tiện chia sẻ thêm nhu cầu để em hỗ trợ tốt hơn không ạ?\""
        else:
            return "**Script follow-up ẤM 🟡:**\n\n> \"Anh/chị [Tên] ơi, em [Sale]. Dự án [Dự án] vừa có thông tin về [Chính sách mới]. Em muốn chia sẻ với anh/chị vì biết mình đang quan tâm. Anh/chị có 2 phút không ạ?\"\n\n*Muốn script cụ thể hơn? Nói rõ: KH đang ở giai đoạn nào?*"

    if any(w in q for w in ["so sánh", "khác nhau", "studio vs", "1pn", "2pn", "3dk", "sky villa"]):
        return "**So sánh loại căn NOBU:**\n\n| Loại | Diện tích | Giá thuê | CTCT |\n|------|-----------|----------|------|\n| Studio | 36-40m² | 3.8 tr/đêm | Bắt buộc |\n| 1PN | 52-58m² | 5.5 tr/đêm | Bắt buộc |\n| 2PN | 74-82m² | 9.5 tr/đêm | Bắt buộc |\n| 3DK | 110-120m² | 12 tr/đêm | Bắt buộc T19-33 |\n| Sky Villa | 145m²+ | 30 tr/đêm | Tùy chọn |\n| PH | 280m²+ | Liên hệ | Tùy chọn |"

    if any(w in q for w in ["kpi", "chỉ tiêu", "mục tiêu", "doanh số", "target"]) and role == "sale":
        return "**KPI chuẩn sale/tháng:**\n\n📞 10 lead mới\n✅ 4 lead qualified\n📅 1 booking/đặt cọc\n💰 0.5 closing (= 1 deal/2 tháng)\n\n💡 Follow-up: HOT→trong 2h | WARM→24h | COLD→3 ngày"

    if any(w in q for w in ["nobu là gì", "nobu hospitality", "robert de niro", "matsuhisa", "thương hiệu"]):
        return "**Nobu Hospitality:**\n\n👥 Đồng sáng lập: **Robert De Niro + Nobu Matsuhisa + Meir Teper**\n🏆 Top 25 Most Innovative Luxury Brands – Robb Report\n🌍 5 châu lục\n\n💡 10-15% khách nhà hàng Nobu → lưu trú KS → tăng công suất tự nhiên"

    if any(w in q for w in ["tiện ích", "facilities", "hồ bơi", "spa", "gym", "nhà hàng"]):
        return "**Tiện ích NOBU Danang:**\n\n🏊 Heated Pool (Katamochi) · 🍽️ Nobu Restaurant (T42) · 🍜 Taste of Asia (T6) · 🏋️ Sky Gym · 💆 Wellness & Retreat Spa (T3-4) · 🎉 Ballroom (T5) · 🍹 Tsukimidai Sky Bar (T43) · 👶 Kids Club · 🛍️ Retail Area"

    # Default
    if role == "manager":
        return "Câu hỏi này liên quan đến quản lý. Bạn có thể hỏi tôi về: phân tích pipeline team, gợi ý coaching, cảnh báo deal rủi ro, hay báo cáo tháng?"
    return "Tôi có thể hỗ trợ về **NOBU Danang** (dự án, chính sách, pháp lý, script bán hàng). Hãy hỏi cụ thể hơn nhé!\n\nVD: *\"Cam kết thuê NOBU là bao nhiêu?\"* hoặc *\"Soạn script follow-up khách warm\"*"


def get_suggestions(role: str, message: str) -> List[str]:
    """Gợi ý câu hỏi tiếp theo dựa vào context."""
    q = message.lower()
    if "roi" in q or "cam kết" in q:
        return ["So sánh cam kết NOBU và Sun Symphony?", "Chi phí chủ sở hữu gồm những gì?"]
    if "ctct" in q or "cho thuê" in q:
        return ["Nobu bắt buộc CTCT ở tầng nào?", "Sun Symphony có được tự cho thuê không?"]
    if "symphony" in q or "sun" in q:
        return ["Chính sách thanh toán ưu đãi của Sun Symphony?", "Giá trị chiết khấu khi không vay?", "Các tiện ích của The Symphony?"]
    if "soạn" in q or "script" in q:
        return ["Soạn email mời khách xem Sun Symphony nóng", "Cách xử lý phản đối giá cao?", "So sánh NOBU và Sun Symphony cho khách?"]
    if role == "manager":
        return ["Deal nào cần theo dõi ngay?", "Gợi ý coaching cho sale mới?", "Bottleneck nằm ở giai đoạn nào?"]
    return ["So sánh NOBU và Sun Symphony?", "Chính sách vay ngân hàng Sun Symphony?", "Xử lý phản đối condotel 50 năm?"]


# ──────────────────────────────────────────────────────────────────────────────
# API ENDPOINT
# ──────────────────────────────────────────────────────────────────────────────
@router.post("/chat", response_model=CopilotChatResponse)
async def copilot_chat(req: CopilotChatRequest):
    """
    AI Staff Copilot — trả lời câu hỏi nội bộ của nhân viên ProHouzing.
    Thử GPT trước, fallback về local rule engine nếu API không khả dụng.
    """
    session_id = req.session_id or str(uuid.uuid4())
    role = req.role or "sale"
    source = "local"
    answer = ""

    # Build context block
    context_parts = []
    if req.page_context:
        context_parts.append(f"Người dùng đang ở: {req.page_context}")
    if req.project_id:
        context_parts.append(f"Dự án đang xem: {req.project_id}")
    context_block = f"CONTEXT HIỆN TẠI: {' | '.join(context_parts)}" if context_parts else ""

    # ── Thử GPT ──────────────────────────────────────────────────────────────
    api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage

            system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
                role_context=ROLE_CONTEXT.get(role, ROLE_CONTEXT["sale"]),
                context_block=context_block,
                knowledge=PROJECTS_KNOWLEDGE,
                user_name=req.user_name,
                role=role,
            )

            chat = LlmChat(
                api_key=api_key,
                session_id=f"copilot_{session_id}",
                system_message=system_prompt,
            ).with_model("openai", "gpt-5.2")

            # Add recent history (last 6 messages)
            for msg in (req.history or [])[-6:]:
                if msg.get("role") == "user":
                    await chat.send_message(UserMessage(text=msg["content"]))

            user_msg = UserMessage(text=req.message)
            response = await chat.send_message(user_msg)
            answer = response
            source = "gpt"

        except Exception as e:
            print(f"[AI Copilot] GPT error: {e} — falling back to local engine")
            answer = ""

    # ── Local fallback ────────────────────────────────────────────────────────
    if not answer:
        answer = local_answer(req.message, role)
        source = "local"

    suggestions = get_suggestions(role, req.message)

    return CopilotChatResponse(
        session_id=session_id,
        message=answer,
        source=source,
        role=role,
        timestamp=datetime.now(timezone.utc).isoformat(),
        suggestions=suggestions,
    )


@router.get("/health")
async def copilot_health():
    """Check AI Copilot + GPT API connectivity."""
    has_gpt = bool(os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY"))
    return {
        "status": "ok",
        "gpt_available": has_gpt,
        "mode": "gpt" if has_gpt else "local-only",
        "knowledge_base": ["NOBU_DANANG"],
        "supported_roles": list(ROLE_CONTEXT.keys()),
        "version": "1.0.0",
    }
