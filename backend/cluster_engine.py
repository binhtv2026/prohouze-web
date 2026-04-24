"""
TOPICAL CLUSTER ENGINE - SEO DOMINATION
========================================
Build topical authority through pillar pages and support articles

Features:
1. Pillar Page Generator - Main authority page
2. Support Article Generator - 5-10 articles per pillar
3. Cluster Link Engine - Bi-directional linking
4. Cluster Management - Track and optimize clusters

Author: ProHouzing Engineering
Version: 2.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import re
import asyncio
import json
from unidecode import unidecode

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

# LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
seo_clusters_collection = db['seo_clusters']
seo_pages_collection = db['seo_pages']
seo_keywords_collection = db['seo_keywords']

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


# ===================== MODELS =====================

class ClusterCreateRequest(BaseModel):
    main_keyword: str  # e.g., "mua nhà Đà Nẵng"
    location: str = ""
    num_support_articles: int = 5


class SupportArticle(BaseModel):
    title: str
    slug: str
    keyword: str
    article_type: str  # guide, comparison, analysis, tips, news


class ClusterResponse(BaseModel):
    id: str
    main_keyword: str
    pillar_slug: str
    pillar_status: str
    support_articles: List[Dict[str, Any]]
    total_articles: int
    published_count: int
    created_at: str


# ===================== HELPER FUNCTIONS =====================

def create_slug(text: str) -> str:
    """Convert Vietnamese text to URL-friendly slug"""
    slug = unidecode(text)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    slug = re.sub(r'-+', '-', slug)
    return slug


# ===================== CTR OPTIMIZED TITLE TEMPLATES =====================

PILLAR_TITLE_TEMPLATES = [
    "{keyword} 2026: Hướng Dẫn Chi Tiết Từ A-Z",
    "{keyword}: Tất Cả Những Gì Bạn Cần Biết",
    "Hướng Dẫn {keyword} Cho Người Mới (Cập Nhật 2026)",
]

SUPPORT_ARTICLE_TEMPLATES = {
    "guide": [
        "Có Nên {keyword}? Sự Thật Ít Người Biết",
        "Kinh Nghiệm {keyword} Từ Chuyên Gia 15 Năm",
        "Bí Quyết {keyword} Thành Công 100%",
    ],
    "comparison": [
        "{keyword}: So Sánh Chi Tiết Các Phương Án",
        "Top 5 Lựa Chọn {keyword} Tốt Nhất 2026",
        "{keyword} - Đâu Là Lựa Chọn Phù Hợp?",
    ],
    "analysis": [
        "Phân Tích Thị Trường {keyword} 2026",
        "Xu Hướng {keyword} Sắp Tới - Dự Báo Chuyên Gia",
        "{keyword}: Cơ Hội Hay Rủi Ro?",
    ],
    "tips": [
        "5 Mẹo {keyword} Không Ai Nói Với Bạn",
        "Sai Lầm Phổ Biến Khi {keyword} (Và Cách Tránh)",
        "Checklist {keyword} Đầy Đủ Nhất 2026",
    ],
    "news": [
        "{keyword}: Tin Mới Nhất Hôm Nay",
        "Cập Nhật {keyword} - Những Thay Đổi Quan Trọng",
        "{keyword} 2026: Điều Gì Đang Xảy Ra?",
    ],
    "location": [
        "Khu Vực Đáng {keyword} Nhất 2026",
        "Top Dự Án {keyword} Hot Nhất Hiện Nay",
        "Giá {keyword} Theo Từng Khu Vực (Chi Tiết)",
    ]
}


async def generate_support_article_ideas(main_keyword: str, num_articles: int = 5) -> List[dict]:
    """Generate support article ideas for a pillar"""
    import random
    
    articles = []
    types = list(SUPPORT_ARTICLE_TEMPLATES.keys())
    
    for i in range(num_articles):
        article_type = types[i % len(types)]
        templates = SUPPORT_ARTICLE_TEMPLATES[article_type]
        template = random.choice(templates)
        
        # Generate title
        title = template.format(keyword=main_keyword)
        
        # Generate specific keyword
        if article_type == "guide":
            keyword = f"kinh nghiệm {main_keyword}"
        elif article_type == "comparison":
            keyword = f"so sánh {main_keyword}"
        elif article_type == "analysis":
            keyword = f"phân tích {main_keyword}"
        elif article_type == "tips":
            keyword = f"mẹo {main_keyword}"
        elif article_type == "location":
            keyword = f"khu vực {main_keyword}"
        else:
            keyword = f"tin tức {main_keyword}"
        
        slug = create_slug(title)
        
        articles.append({
            "title": title,
            "slug": slug,
            "keyword": keyword,
            "article_type": article_type,
            "status": "pending"
        })
    
    return articles


# ===================== PILLAR CONTENT GENERATOR =====================

PILLAR_SYSTEM_PROMPT = """Bạn là chuyên gia SEO bất động sản Việt Nam với 15 năm kinh nghiệm.

NHIỆM VỤ: Viết PILLAR PAGE chuẩn SEO - trang chủ đề chính, chi tiết và toàn diện nhất.

YÊU CẦU BẮT BUỘC:
1. Title: CTR cao, chứa từ khóa, < 60 ký tự
2. Meta: Hook reader, chứa từ khóa, < 160 ký tự
3. Nội dung: 2000-3000 từ, chia 7-10 sections với H2/H3
4. Phải có:
   - Table of Contents (đầu bài)
   - Số liệu thống kê thực tế (thị trường BĐS VN 2025-2026)
   - Bảng so sánh (dùng HTML table)
   - Ví dụ cụ thể
   - FAQ section (5-7 câu hỏi)
5. Viết tự nhiên như chuyên gia, KHÔNG AI smell
6. CTA giữa bài và cuối bài

INTERNAL LINKS PLACEHOLDER:
Thêm {{SUPPORT_ARTICLES}} ở cuối mỗi section chính để chèn link support articles.

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "meta_description": "...",
  "h1": "...",
  "toc": ["Section 1", "Section 2", ...],
  "content": "... (HTML với <h2>, <h3>, <p>, <table>, <ul>)",
  "faq": [{"q": "...", "a": "..."}, ...]
}"""

SUPPORT_SYSTEM_PROMPT = """Bạn là chuyên gia viết content SEO cho blog BĐS.

NHIỆM VỤ: Viết BÀI HỖ TRỢ cho PILLAR PAGE về "{pillar_keyword}".

YÊU CẦU:
1. Bài viết: 1500-2000 từ
2. Title: CTR cao, gây tò mò, < 60 ký tự
3. Meta: Hook reader, < 160 ký tự  
4. Nội dung:
   - Opening hook (câu hỏi hoặc fact thú vị)
   - 5-6 sections với H2
   - Số liệu, ví dụ cụ thể
   - CTA giữa và cuối bài
5. PHẢI link về PILLAR: {{PILLAR_LINK}}
6. Viết tự nhiên, không máy móc

LOẠI BÀI: {article_type}
- guide: hướng dẫn chi tiết từng bước
- comparison: so sánh các option với bảng
- analysis: phân tích thị trường với data
- tips: mẹo thực tế, actionable
- location: review khu vực cụ thể

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "meta_description": "...",
  "h1": "...",
  "h2_tags": ["...", "..."],
  "content": "... (HTML format)"
}"""


async def generate_pillar_content(keyword: str, support_articles: List[dict]) -> dict:
    """Generate pillar page content with GPT-5.2"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"pillar-{create_slug(keyword)}-{datetime.now().timestamp()}",
            system_message=PILLAR_SYSTEM_PROMPT
        ).with_model("openai", "gpt-5.2")
        
        # Build support articles list for linking
        support_list = "\n".join([f"- {a['title']}: /blog/{a['slug']}" for a in support_articles])
        
        user_message = UserMessage(
            text=f"""Viết PILLAR PAGE cho từ khóa chính: "{keyword}"

Support Articles sẽ được link:
{support_list}

Yêu cầu:
- Đây là trang CHÍNH, toàn diện nhất về chủ đề
- Phải mention và link đến các support articles trong nội dung
- Thị trường BĐS Việt Nam 2025-2026
- Có bảng so sánh HTML
- Có FAQ section

Trả về JSON theo format."""
        )
        
        response = await chat.send_message(user_message)
        
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content_data = json.loads(json_match.group())
        else:
            raise ValueError("Could not parse JSON from response")
        
        return content_data
        
    except Exception as e:
        print(f"[PILLAR] Error generating content for '{keyword}': {e}")
        raise


async def generate_support_article_content(keyword: str, article_type: str, pillar_slug: str, pillar_keyword: str) -> dict:
    """Generate support article content"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    try:
        system_prompt = SUPPORT_SYSTEM_PROMPT.format(
            pillar_keyword=pillar_keyword,
            article_type=article_type
        )
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"support-{create_slug(keyword)}-{datetime.now().timestamp()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(
            text=f"""Viết bài HỖ TRỢ cho từ khóa: "{keyword}"

Loại bài: {article_type}
Pillar page: /{pillar_slug}
Pillar keyword: {pillar_keyword}

Phải link về pillar trong nội dung với anchor text "{pillar_keyword}".

Trả về JSON theo format."""
        )
        
        response = await chat.send_message(user_message)
        
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content_data = json.loads(json_match.group())
        else:
            raise ValueError("Could not parse JSON from response")
        
        return content_data
        
    except Exception as e:
        print(f"[SUPPORT] Error generating content for '{keyword}': {e}")
        raise


# ===================== CTA HTML GENERATORS =====================

def generate_mid_article_cta(keyword: str) -> str:
    """Generate mid-article CTA"""
    return f'''
<div class="mid-cta" style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0 0 10px 0; font-weight: 600; color: #0369a1;">💡 Bạn quan tâm đến {keyword}?</p>
  <p style="margin: 0 0 15px 0; color: #475569;">Nhận tư vấn miễn phí từ chuyên gia ngay!</p>
  <a href="/#ai-chat" style="display: inline-block; padding: 10px 20px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">Chat với AI →</a>
</div>
'''

def generate_end_cta(keyword: str) -> str:
    """Generate end-of-article CTA"""
    return f'''
<div class="end-cta" style="background: linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%); padding: 40px; border-radius: 12px; margin: 40px 0; text-align: center; color: white;">
  <h3 style="margin: 0 0 15px 0; font-size: 24px;">Sẵn Sàng {keyword.title()}?</h3>
  <p style="margin: 0 0 25px 0; opacity: 0.9;">Đội ngũ chuyên gia 15 năm kinh nghiệm sẵn sàng hỗ trợ bạn 24/7</p>
  <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
    <a href="/#ai-chat" style="padding: 14px 28px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">💬 Chat Ngay</a>
    <a href="/#booking" style="padding: 14px 28px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">📅 Đặt Lịch Tư Vấn</a>
    <a href="tel:1900636019" style="padding: 14px 28px; background: white; color: #1e3a5f; text-decoration: none; border-radius: 8px; font-weight: 600;">📞 1900 636 019</a>
  </div>
</div>
'''

def generate_toc_html(toc_items: List[str]) -> str:
    """Generate Table of Contents HTML"""
    items_html = "".join([f'<li><a href="#{create_slug(item)}">{item}</a></li>' for item in toc_items])
    return f'''
<div class="toc" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <h3 style="margin: 0 0 15px 0; font-size: 18px;">📑 Nội Dung Bài Viết</h3>
  <ol style="margin: 0; padding-left: 20px;">{items_html}</ol>
</div>
'''

def generate_faq_html(faqs: List[dict]) -> str:
    """Generate FAQ schema HTML"""
    faq_items = ""
    for faq in faqs:
        faq_items += f'''
<div class="faq-item" style="border-bottom: 1px solid #e2e8f0; padding: 15px 0;" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
  <h4 style="margin: 0 0 10px 0; font-weight: 600;" itemprop="name">{faq.get('q', '')}</h4>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p style="margin: 0; color: #475569;" itemprop="text">{faq.get('a', '')}</p>
  </div>
</div>
'''
    
    return f'''
<div class="faq-section" itemscope itemtype="https://schema.org/FAQPage" style="margin: 40px 0;">
  <h2 style="margin: 0 0 20px 0;">❓ Câu Hỏi Thường Gặp</h2>
  {faq_items}
</div>
'''


# ===================== API ENDPOINTS =====================

@router.post("/create")
async def api_create_cluster(request: ClusterCreateRequest):
    """Create a new topical cluster"""
    
    main_keyword = request.main_keyword
    pillar_slug = create_slug(main_keyword)
    
    # Check if cluster exists
    existing = await seo_clusters_collection.find_one({"pillar_slug": pillar_slug})
    if existing:
        raise HTTPException(status_code=400, detail="Cluster already exists for this keyword")
    
    # Generate support article ideas
    support_articles = await generate_support_article_ideas(main_keyword, request.num_support_articles)
    
    # Create cluster document
    cluster = {
        "main_keyword": main_keyword,
        "location": request.location,
        "pillar_slug": pillar_slug,
        "pillar_page_id": None,
        "pillar_status": "pending",
        "support_articles": support_articles,
        "total_articles": len(support_articles) + 1,  # +1 for pillar
        "published_count": 0,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await seo_clusters_collection.insert_one(cluster)
    
    return {
        "success": True,
        "cluster_id": str(result.inserted_id),
        "pillar_slug": pillar_slug,
        "support_articles": support_articles
    }


@router.post("/{cluster_id}/generate-pillar")
async def api_generate_pillar(cluster_id: str):
    """Generate pillar page content for a cluster"""
    
    cluster = await seo_clusters_collection.find_one({"_id": ObjectId(cluster_id)})
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    
    main_keyword = cluster["main_keyword"]
    pillar_slug = cluster["pillar_slug"]
    support_articles = cluster.get("support_articles", [])
    
    # Generate pillar content
    content_data = await generate_pillar_content(main_keyword, support_articles)
    
    # Build full content with TOC, CTAs, FAQ
    toc_html = generate_toc_html(content_data.get("toc", []))
    mid_cta = generate_mid_article_cta(main_keyword)
    end_cta = generate_end_cta(main_keyword)
    faq_html = generate_faq_html(content_data.get("faq", []))
    
    # Build support article links
    support_links_html = '<div class="related-articles" style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;"><h3>📚 Bài Viết Liên Quan</h3><ul>'
    for article in support_articles:
        support_links_html += f'<li><a href="/blog/{article["slug"]}">{article["title"]}</a></li>'
    support_links_html += '</ul></div>'
    
    # Combine content
    full_content = f'''
{toc_html}
{content_data.get("content", "")}
{mid_cta}
{support_links_html}
{faq_html}
{end_cta}
'''
    
    # Calculate word count
    text_only = re.sub(r'<[^>]+>', '', full_content)
    word_count = len(text_only.split())
    
    # Create page document
    page_doc = {
        "keyword": main_keyword,
        "slug": pillar_slug,
        "content_type": "pillar",
        "cluster_id": cluster_id,
        "title": content_data.get("title", ""),
        "meta_description": content_data.get("meta_description", ""),
        "h1": content_data.get("h1", ""),
        "h2_tags": content_data.get("toc", []),
        "content": full_content,
        "faq": content_data.get("faq", []),
        "internal_links": [{"url": f"/blog/{a['slug']}", "anchor": a["title"]} for a in support_articles],
        "word_count": word_count,
        "seo_score": 0,
        "status": "draft",
        "is_pillar": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Calculate SEO score
    from seo_engine import calculate_seo_score
    page_doc["seo_score"] = calculate_seo_score(page_doc)
    
    # Save page
    result = await seo_pages_collection.insert_one(page_doc)
    
    # Update cluster
    await seo_clusters_collection.update_one(
        {"_id": ObjectId(cluster_id)},
        {
            "$set": {
                "pillar_page_id": str(result.inserted_id),
                "pillar_status": "draft",
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "page_id": str(result.inserted_id),
        "title": page_doc["title"],
        "word_count": word_count,
        "seo_score": page_doc["seo_score"]
    }


@router.post("/{cluster_id}/generate-support/{article_index}")
async def api_generate_support_article(cluster_id: str, article_index: int):
    """Generate a specific support article"""
    
    cluster = await seo_clusters_collection.find_one({"_id": ObjectId(cluster_id)})
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    
    support_articles = cluster.get("support_articles", [])
    if article_index >= len(support_articles):
        raise HTTPException(status_code=400, detail="Article index out of range")
    
    article_info = support_articles[article_index]
    main_keyword = cluster["main_keyword"]
    pillar_slug = cluster["pillar_slug"]
    
    # Generate content
    content_data = await generate_support_article_content(
        keyword=article_info["keyword"],
        article_type=article_info["article_type"],
        pillar_slug=pillar_slug,
        pillar_keyword=main_keyword
    )
    
    # Build CTAs
    mid_cta = generate_mid_article_cta(article_info["keyword"])
    end_cta = generate_end_cta(article_info["keyword"])
    
    # Add pillar link
    pillar_link = f'<div class="pillar-link" style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;"><p>📖 Xem thêm: <a href="/{pillar_slug}" style="font-weight: 600; color: #047857;">{main_keyword}</a> - Hướng dẫn chi tiết từ A-Z</p></div>'
    
    # Combine content
    full_content = f'''
{content_data.get("content", "")}
{mid_cta}
{pillar_link}
{end_cta}
'''
    
    # Calculate word count
    text_only = re.sub(r'<[^>]+>', '', full_content)
    word_count = len(text_only.split())
    
    # Create page document
    page_doc = {
        "keyword": article_info["keyword"],
        "slug": article_info["slug"],
        "content_type": "blog",
        "cluster_id": cluster_id,
        "pillar_slug": pillar_slug,
        "article_type": article_info["article_type"],
        "title": content_data.get("title", ""),
        "meta_description": content_data.get("meta_description", ""),
        "h1": content_data.get("h1", ""),
        "h2_tags": content_data.get("h2_tags", []),
        "content": full_content,
        "internal_links": [{"url": f"/{pillar_slug}", "anchor": main_keyword, "type": "pillar"}],
        "word_count": word_count,
        "seo_score": 0,
        "status": "draft",
        "is_pillar": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Calculate SEO score
    from seo_engine import calculate_seo_score
    page_doc["seo_score"] = calculate_seo_score(page_doc)
    
    # Save page
    result = await seo_pages_collection.insert_one(page_doc)
    
    # Update cluster support article status
    support_articles[article_index]["status"] = "draft"
    support_articles[article_index]["page_id"] = str(result.inserted_id)
    
    await seo_clusters_collection.update_one(
        {"_id": ObjectId(cluster_id)},
        {
            "$set": {
                "support_articles": support_articles,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "page_id": str(result.inserted_id),
        "title": page_doc["title"],
        "word_count": word_count,
        "seo_score": page_doc["seo_score"]
    }


@router.get("/list")
async def api_list_clusters(limit: int = 50, skip: int = 0):
    """List all clusters"""
    clusters = []
    async for cluster in seo_clusters_collection.find().sort("created_at", -1).skip(skip).limit(limit):
        clusters.append({
            "id": str(cluster["_id"]),
            "main_keyword": cluster.get("main_keyword"),
            "pillar_slug": cluster.get("pillar_slug"),
            "pillar_status": cluster.get("pillar_status"),
            "total_articles": cluster.get("total_articles", 0),
            "published_count": cluster.get("published_count", 0),
            "support_articles_count": len(cluster.get("support_articles", [])),
            "created_at": cluster["created_at"].isoformat() if cluster.get("created_at") else None
        })
    
    total = await seo_clusters_collection.count_documents({})
    
    return {
        "clusters": clusters,
        "total": total
    }


@router.get("/{cluster_id}")
async def api_get_cluster(cluster_id: str):
    """Get cluster details"""
    cluster = await seo_clusters_collection.find_one({"_id": ObjectId(cluster_id)})
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    
    # Get pillar page if exists
    pillar_page = None
    if cluster.get("pillar_page_id"):
        page = await seo_pages_collection.find_one({"_id": ObjectId(cluster["pillar_page_id"])})
        if page:
            pillar_page = {
                "id": str(page["_id"]),
                "title": page.get("title"),
                "seo_score": page.get("seo_score"),
                "word_count": page.get("word_count"),
                "status": page.get("status")
            }
    
    return {
        "id": str(cluster["_id"]),
        "main_keyword": cluster.get("main_keyword"),
        "pillar_slug": cluster.get("pillar_slug"),
        "pillar_status": cluster.get("pillar_status"),
        "pillar_page": pillar_page,
        "support_articles": cluster.get("support_articles", []),
        "total_articles": cluster.get("total_articles", 0),
        "published_count": cluster.get("published_count", 0),
        "created_at": cluster["created_at"].isoformat() if cluster.get("created_at") else None
    }


@router.get("/stats/overview")
async def api_cluster_stats():
    """Get cluster statistics"""
    total_clusters = await seo_clusters_collection.count_documents({})
    
    # Count by pillar status
    pending_pillars = await seo_clusters_collection.count_documents({"pillar_status": "pending"})
    draft_pillars = await seo_clusters_collection.count_documents({"pillar_status": "draft"})
    published_pillars = await seo_clusters_collection.count_documents({"pillar_status": "published"})
    
    # Count total articles
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_articles"}, "published": {"$sum": "$published_count"}}}
    ]
    result = await seo_clusters_collection.aggregate(pipeline).to_list(1)
    
    return {
        "total_clusters": total_clusters,
        "pillar_status": {
            "pending": pending_pillars,
            "draft": draft_pillars,
            "published": published_pillars
        },
        "total_articles": result[0]["total"] if result else 0,
        "published_articles": result[0]["published"] if result else 0
    }
