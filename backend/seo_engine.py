"""
SEO ENGINE - PROHOUZING SEO FACTORY
====================================
Automated SEO content generation system for real estate

Features:
1. Keyword Engine - Generate 1000+ keywords
2. Content Generator (GPT-5.2) - SEO optimized content
3. Landing Page Generator - Dynamic SEO pages
4. Blog Generator - Guide, comparison, analysis
5. Internal Link Engine - Auto link insertion
6. SEO Optimizer - Validate SEO requirements
7. Sitemap Generator - Auto sitemap/robots.txt

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import re
import asyncio
import hashlib
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
seo_pages_collection = db['seo_pages']
seo_keywords_collection = db['seo_keywords']
seo_config_collection = db['seo_config']

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')


# ===================== MODELS =====================

class KeywordGenerateRequest(BaseModel):
    locations: List[str] = Field(default=["Đà Nẵng", "HCM", "Hà Nội"])
    intents: List[str] = Field(default=["mua nhà", "căn hộ", "đất nền", "đầu tư"])
    price_ranges: List[str] = Field(default=["giá rẻ", "dưới 2 tỷ", "2-5 tỷ", "trên 5 tỷ"])
    property_types: List[str] = Field(default=["chung cư", "biệt thự", "nhà phố", "đất nền"])


class ContentGenerateRequest(BaseModel):
    keyword: str
    content_type: str = "landing"  # landing or blog
    regenerate: bool = False


class BatchGenerateRequest(BaseModel):
    keywords: List[str]
    content_type: str = "landing"
    batch_size: int = 50


class SEOPage(BaseModel):
    keyword: str
    slug: str
    content_type: str  # landing | blog
    title: str
    meta_description: str
    content: str
    h1: str
    h2_tags: List[str] = []
    internal_links: List[Dict[str, str]] = []
    seo_score: int = 0
    status: str = "draft"  # draft | published | error
    word_count: int = 0
    created_at: datetime = None
    published_at: datetime = None


# ===================== HELPER FUNCTIONS =====================

def create_slug(text: str) -> str:
    """Convert Vietnamese text to URL-friendly slug"""
    # Remove accents
    slug = unidecode(text)
    # Convert to lowercase
    slug = slug.lower()
    # Replace spaces and special chars with hyphens
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    # Remove duplicate hyphens
    slug = re.sub(r'-+', '-', slug)
    return slug


def calculate_keyword_hash(keyword: str) -> str:
    """Create hash for duplicate detection"""
    normalized = keyword.lower().strip()
    return hashlib.md5(normalized.encode()).hexdigest()


def calculate_content_hash(content: str) -> str:
    """Create hash for content similarity detection"""
    # Normalize content for comparison
    normalized = re.sub(r'\s+', ' ', content.lower().strip())
    return hashlib.md5(normalized.encode()).hexdigest()


def calculate_seo_score(page: dict) -> int:
    """Calculate SEO score based on criteria"""
    score = 0
    
    # Title check (< 60 chars) - 15 points
    title = page.get('title', '')
    if title and len(title) <= 60:
        score += 15
    elif title and len(title) <= 70:
        score += 10
    
    # Meta description (< 160 chars) - 15 points
    meta = page.get('meta_description', '')
    if meta and len(meta) <= 160:
        score += 15
    elif meta and len(meta) <= 180:
        score += 10
    
    # Has H1 - 10 points
    if page.get('h1'):
        score += 10
    
    # Has H2 tags - 10 points
    h2_tags = page.get('h2_tags', [])
    if len(h2_tags) >= 3:
        score += 10
    elif len(h2_tags) >= 1:
        score += 5
    
    # Word count (1200-2000) - 20 points
    word_count = page.get('word_count', 0)
    if 1200 <= word_count <= 2000:
        score += 20
    elif 800 <= word_count <= 2500:
        score += 10
    
    # Keyword in title - 10 points
    keyword = page.get('keyword', '').lower()
    if keyword and keyword in title.lower():
        score += 10
    
    # Internal links - 10 points
    internal_links = page.get('internal_links', [])
    if len(internal_links) >= 5:
        score += 10
    elif len(internal_links) >= 3:
        score += 5
    
    # Has CTA - 10 points
    content = page.get('content', '')
    if 'chat' in content.lower() or 'đặt lịch' in content.lower() or 'liên hệ' in content.lower():
        score += 10
    
    return min(score, 100)


async def check_duplicate_keyword(keyword: str) -> bool:
    """Check if keyword already exists"""
    keyword_hash = calculate_keyword_hash(keyword)
    existing = await seo_keywords_collection.find_one({"hash": keyword_hash})
    return existing is not None


async def check_content_similarity(content: str, threshold: float = 0.8) -> bool:
    """Check if content is too similar to existing content (>80%)"""
    content_hash = calculate_content_hash(content)
    
    # Check exact match
    existing = await seo_pages_collection.find_one({"content_hash": content_hash})
    if existing:
        return True
    
    # For more sophisticated similarity, would need NLP comparison
    # For now, using hash comparison
    return False


# ===================== KEYWORD ENGINE =====================

async def generate_keywords(request: KeywordGenerateRequest) -> List[dict]:
    """Generate SEO keywords from combinations"""
    keywords = []
    seen_hashes = set()
    
    # Get existing keyword hashes
    async for kw in seo_keywords_collection.find({}, {"hash": 1}):
        seen_hashes.add(kw.get("hash"))
    
    # Generate combinations
    patterns = [
        "{intent} {location}",
        "{intent} {price} {location}",
        "{type} {location}",
        "{type} {price} {location}",
        "{intent} {type} {location}",
        "bất động sản {location}",
        "dự án {type} {location}",
        "{location} {type} giá tốt",
        "{intent} {type} {price}",
    ]
    
    for location in request.locations:
        for intent in request.intents:
            for price in request.price_ranges:
                for prop_type in request.property_types:
                    for pattern in patterns:
                        keyword = pattern.format(
                            intent=intent,
                            location=location,
                            price=price,
                            type=prop_type
                        )
                        
                        keyword_hash = calculate_keyword_hash(keyword)
                        
                        # Skip duplicates
                        if keyword_hash in seen_hashes:
                            continue
                        
                        seen_hashes.add(keyword_hash)
                        
                        keywords.append({
                            "keyword": keyword,
                            "slug": create_slug(keyword),
                            "hash": keyword_hash,
                            "location": location,
                            "intent": intent,
                            "price_range": price,
                            "property_type": prop_type,
                            "status": "pending",  # pending | generated | published
                            "created_at": datetime.now(timezone.utc)
                        })
    
    return keywords


# ===================== CONTENT GENERATOR (GPT-5.2) =====================

async def generate_seo_content(keyword: str, content_type: str = "landing") -> dict:
    """Generate SEO content using GPT-5.2"""
    
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    # Create system prompt based on content type
    if content_type == "landing":
        system_prompt = """Bạn là chuyên gia SEO bất động sản Việt Nam với 15 năm kinh nghiệm.

NHIỆM VỤ: Viết landing page chuẩn SEO cho từ khóa được cung cấp.

YÊU CẦU BẮT BUỘC:
1. Title: Hấp dẫn, chứa từ khóa, < 60 ký tự
2. Meta description: Mô tả ngắn gọn, chứa từ khóa, < 160 ký tự
3. H1: Chứa từ khóa chính
4. Nội dung: 1200-2000 từ, chia thành các section với H2/H3
5. Phải có ví dụ thực tế, số liệu cụ thể, so sánh
6. Viết tự nhiên như người thật, KHÔNG được "AI smell"
7. Phải có CTA: nút chat AI và nút đặt lịch xem nhà

QUAN TRỌNG:
- Sử dụng số liệu thị trường BĐS Việt Nam 2025-2026
- Đề cập đến các dự án nổi tiếng trong khu vực
- Có phần so sánh ưu/nhược điểm
- Kết thúc bằng CTA mạnh

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "meta_description": "...",
  "h1": "...",
  "h2_tags": ["...", "...", "..."],
  "content": "... (HTML format với <h2>, <p>, <ul>, <strong>)",
  "cta_text": "..."
}"""
    else:  # blog
        system_prompt = """Bạn là chuyên gia viết blog BĐS với phong cách tự nhiên, dễ hiểu.

NHIỆM VỤ: Viết bài blog SEO cho từ khóa được cung cấp.

YÊU CẦU BẮT BUỘC:
1. Title: Hấp dẫn như báo chí, chứa từ khóa, < 60 ký tự
2. Meta description: Hook reader, < 160 ký tự
3. Nội dung: 1500-2000 từ, chia thành 5-7 sections
4. Mở đầu bằng câu hỏi hoặc tình huống thực tế
5. Có data, thống kê, ví dụ cụ thể
6. Viết như người có kinh nghiệm, KHÔNG được máy móc
7. Có CTA cuối bài

LOẠI BÀI:
- Guide: Hướng dẫn chi tiết
- So sánh: So sánh options
- Phân tích: Phân tích thị trường
- Tips: Mẹo đầu tư

OUTPUT FORMAT (JSON):
{
  "title": "...",
  "meta_description": "...",
  "h1": "...",
  "h2_tags": ["...", "...", "..."],
  "content": "... (HTML format)",
  "cta_text": "..."
}"""

    try:
        # Initialize GPT-5.2 chat
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"seo-{create_slug(keyword)}-{datetime.now().timestamp()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-5.2")
        
        # Create user message
        user_message = UserMessage(
            text=f"""Viết {content_type} page cho từ khóa: "{keyword}"

Lưu ý:
- Từ khóa chính: {keyword}
- Khu vực: Việt Nam
- Đối tượng: Người mua nhà, nhà đầu tư BĐS
- Ngữ cảnh: Thị trường BĐS 2025-2026

Trả về JSON theo format đã định."""
        )
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        
        # Try to extract JSON from response
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            content_data = json.loads(json_match.group())
        else:
            raise ValueError("Could not parse JSON from response")
        
        return content_data
        
    except Exception as e:
        print(f"[SEO] Error generating content for '{keyword}': {e}")
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")


# ===================== INTERNAL LINK ENGINE =====================

async def add_internal_links(content: str, current_slug: str, content_type: str) -> tuple:
    """Add internal links to content"""
    internal_links = []
    modified_content = content
    
    # Get related pages (3 blogs + 2 landings)
    blog_pages = await seo_pages_collection.find({
        "content_type": "blog",
        "status": "published",
        "slug": {"$ne": current_slug}
    }).limit(3).to_list(3)
    
    landing_pages = await seo_pages_collection.find({
        "content_type": "landing",
        "status": "published",
        "slug": {"$ne": current_slug}
    }).limit(2).to_list(2)
    
    # Build link list
    for page in blog_pages:
        internal_links.append({
            "url": f"/blog/{page['slug']}",
            "anchor": page.get('keyword', page['slug']),
            "type": "blog"
        })
    
    for page in landing_pages:
        internal_links.append({
            "url": f"/{page['slug']}",
            "anchor": page.get('keyword', page['slug']),
            "type": "landing"
        })
    
    # Auto-insert links into content (at the end of random paragraphs)
    if internal_links:
        link_section = "\n\n<div class='internal-links'>\n<h3>Bài viết liên quan:</h3>\n<ul>\n"
        for link in internal_links:
            link_section += f'<li><a href="{link["url"]}">{link["anchor"]}</a></li>\n'
        link_section += "</ul>\n</div>"
        
        # Insert before CTA section if exists, otherwise at end
        if '</article>' in modified_content:
            modified_content = modified_content.replace('</article>', f'{link_section}</article>')
        else:
            modified_content += link_section
    
    return modified_content, internal_links


# ===================== CTA GENERATOR =====================

def generate_cta_html(keyword: str) -> str:
    """Generate CTA section with chat AI and booking buttons"""
    return f'''
<div class="seo-cta-section" style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 40px; border-radius: 12px; margin: 40px 0; text-align: center;">
  <h3 style="color: white; font-size: 24px; margin-bottom: 16px;">Bạn quan tâm đến {keyword}?</h3>
  <p style="color: #e0e0e0; margin-bottom: 24px;">Nhận tư vấn miễn phí từ chuyên gia BĐS ngay hôm nay!</p>
  <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
    <a href="/#ai-chat" class="cta-chat-btn" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      Chat với AI ngay
    </a>
    <a href="/#booking" class="cta-booking-btn" style="background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; gap: 8px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
      Đặt lịch xem nhà
    </a>
  </div>
</div>
'''


# ===================== API ENDPOINTS =====================

@router.post("/generate-keywords")
async def api_generate_keywords(request: KeywordGenerateRequest):
    """Generate SEO keywords from combinations"""
    keywords = await generate_keywords(request)
    
    # Save to database
    if keywords:
        await seo_keywords_collection.insert_many(keywords)
    
    # Convert for JSON response (remove ObjectId issues)
    keywords_response = []
    for kw in keywords[:100]:
        keywords_response.append({
            "keyword": kw.get("keyword"),
            "slug": kw.get("slug"),
            "location": kw.get("location"),
            "intent": kw.get("intent"),
            "status": kw.get("status"),
            "created_at": kw["created_at"].isoformat() if kw.get("created_at") else None
        })
    
    return {
        "success": True,
        "total_generated": len(keywords),
        "keywords": keywords_response
    }


@router.post("/generate-content")
async def api_generate_content(request: ContentGenerateRequest):
    """Generate SEO content for a keyword"""
    
    # Check duplicate keyword
    if not request.regenerate:
        existing = await seo_pages_collection.find_one({"keyword": request.keyword})
        if existing:
            raise HTTPException(status_code=400, detail="Keyword already has content. Use regenerate=true to overwrite.")
    
    # Generate content
    content_data = await generate_seo_content(request.keyword, request.content_type)
    
    # Add CTA
    cta_html = generate_cta_html(request.keyword)
    full_content = content_data.get('content', '') + cta_html
    
    # Add internal links
    slug = create_slug(request.keyword)
    full_content, internal_links = await add_internal_links(full_content, slug, request.content_type)
    
    # Calculate word count
    text_only = re.sub(r'<[^>]+>', '', full_content)
    word_count = len(text_only.split())
    
    # Create page document
    page_doc = {
        "keyword": request.keyword,
        "slug": slug,
        "content_type": request.content_type,
        "title": content_data.get('title', ''),
        "meta_description": content_data.get('meta_description', ''),
        "h1": content_data.get('h1', ''),
        "h2_tags": content_data.get('h2_tags', []),
        "content": full_content,
        "content_hash": calculate_content_hash(full_content),
        "internal_links": internal_links,
        "word_count": word_count,
        "status": "draft",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Calculate SEO score
    page_doc["seo_score"] = calculate_seo_score(page_doc)
    
    # Save or update
    if request.regenerate:
        await seo_pages_collection.update_one(
            {"keyword": request.keyword},
            {"$set": page_doc},
            upsert=True
        )
    else:
        await seo_pages_collection.insert_one(page_doc)
    
    # Update keyword status
    await seo_keywords_collection.update_one(
        {"keyword": request.keyword},
        {"$set": {"status": "generated"}}
    )
    
    return {
        "success": True,
        "page": {
            "keyword": page_doc["keyword"],
            "slug": page_doc["slug"],
            "title": page_doc["title"],
            "seo_score": page_doc["seo_score"],
            "word_count": page_doc["word_count"],
            "status": page_doc["status"]
        }
    }


@router.post("/generate-batch")
async def api_generate_batch(request: BatchGenerateRequest, background_tasks: BackgroundTasks):
    """Generate content for multiple keywords in batch"""
    
    # Limit batch size
    keywords_to_process = request.keywords[:request.batch_size]
    
    # Queue background task
    background_tasks.add_task(
        process_batch_generation,
        keywords_to_process,
        request.content_type
    )
    
    return {
        "success": True,
        "message": f"Batch generation started for {len(keywords_to_process)} keywords",
        "batch_id": datetime.now().timestamp()
    }


async def process_batch_generation(keywords: List[str], content_type: str):
    """Background task to process batch content generation"""
    for keyword in keywords:
        try:
            # Check if already exists
            existing = await seo_pages_collection.find_one({"keyword": keyword})
            if existing:
                continue
            
            # Generate content
            content_data = await generate_seo_content(keyword, content_type)
            
            # Add CTA
            cta_html = generate_cta_html(keyword)
            full_content = content_data.get('content', '') + cta_html
            
            # Add internal links
            slug = create_slug(keyword)
            full_content, internal_links = await add_internal_links(full_content, slug, content_type)
            
            # Calculate word count
            text_only = re.sub(r'<[^>]+>', '', full_content)
            word_count = len(text_only.split())
            
            # Create page document
            page_doc = {
                "keyword": keyword,
                "slug": slug,
                "content_type": content_type,
                "title": content_data.get('title', ''),
                "meta_description": content_data.get('meta_description', ''),
                "h1": content_data.get('h1', ''),
                "h2_tags": content_data.get('h2_tags', []),
                "content": full_content,
                "content_hash": calculate_content_hash(full_content),
                "internal_links": internal_links,
                "word_count": word_count,
                "status": "draft",
                "created_at": datetime.now(timezone.utc),
            }
            
            page_doc["seo_score"] = calculate_seo_score(page_doc)
            
            await seo_pages_collection.insert_one(page_doc)
            await seo_keywords_collection.update_one(
                {"keyword": keyword},
                {"$set": {"status": "generated"}}
            )
            
            print(f"[SEO BATCH] Generated: {keyword}")
            
            # Rate limiting - wait between requests
            await asyncio.sleep(2)
            
        except Exception as e:
            print(f"[SEO BATCH] Error for '{keyword}': {e}")
            continue


@router.post("/publish/{page_id}")
async def api_publish_page(page_id: str):
    """Publish a SEO page"""
    
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check SEO score
    if page.get("seo_score", 0) < 50:
        raise HTTPException(status_code=400, detail="SEO score too low. Minimum 50 required.")
    
    # Update status
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                "status": "published",
                "published_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update keyword status
    await seo_keywords_collection.update_one(
        {"keyword": page["keyword"]},
        {"$set": {"status": "published"}}
    )
    
    return {"success": True, "message": "Page published"}


@router.get("/pages")
async def api_get_pages(
    status: Optional[str] = None,
    content_type: Optional[str] = None,
    slug: Optional[str] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get SEO pages with filters"""
    query = {}
    if status:
        query["status"] = status
    if content_type:
        query["content_type"] = content_type
    if slug:
        query["slug"] = slug
    
    pages = []
    async for page in seo_pages_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        pages.append({
            "id": str(page["_id"]),
            "keyword": page.get("keyword"),
            "slug": page.get("slug"),
            "content_type": page.get("content_type"),
            "title": page.get("title"),
            "seo_score": page.get("seo_score", 0),
            "word_count": page.get("word_count", 0),
            "status": page.get("status"),
            "created_at": page["created_at"].isoformat() if page.get("created_at") else None,
            "published_at": page["published_at"].isoformat() if page.get("published_at") else None,
        })
    
    total = await seo_pages_collection.count_documents(query)
    
    return {
        "pages": pages,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/pages/{page_id}")
async def api_get_page_detail(page_id: str):
    """Get full page content"""
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return {
        "id": str(page["_id"]),
        "keyword": page.get("keyword"),
        "slug": page.get("slug"),
        "content_type": page.get("content_type"),
        "title": page.get("title"),
        "meta_description": page.get("meta_description"),
        "h1": page.get("h1"),
        "h2_tags": page.get("h2_tags", []),
        "content": page.get("content"),
        "internal_links": page.get("internal_links", []),
        "seo_score": page.get("seo_score", 0),
        "word_count": page.get("word_count", 0),
        "status": page.get("status"),
        "created_at": page["created_at"].isoformat() if page.get("created_at") else None,
        "published_at": page["published_at"].isoformat() if page.get("published_at") else None,
    }


@router.get("/keywords")
async def api_get_keywords(
    status: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """Get SEO keywords"""
    query = {}
    if status:
        query["status"] = status
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    keywords = []
    async for kw in seo_keywords_collection.find(query).sort("created_at", -1).skip(skip).limit(limit):
        keywords.append({
            "id": str(kw["_id"]),
            "keyword": kw.get("keyword"),
            "slug": kw.get("slug"),
            "location": kw.get("location"),
            "intent": kw.get("intent"),
            "status": kw.get("status"),
            "created_at": kw["created_at"].isoformat() if kw.get("created_at") else None,
        })
    
    total = await seo_keywords_collection.count_documents(query)
    
    return {
        "keywords": keywords,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.delete("/keywords/{keyword_id}")
async def api_delete_keyword(keyword_id: str):
    """Delete a keyword"""
    result = await seo_keywords_collection.delete_one({"_id": ObjectId(keyword_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return {"success": True}


@router.delete("/pages/{page_id}")
async def api_delete_page(page_id: str):
    """Delete a page"""
    result = await seo_pages_collection.delete_one({"_id": ObjectId(page_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    return {"success": True}


@router.get("/stats")
async def api_get_stats():
    """Get SEO statistics"""
    total_keywords = await seo_keywords_collection.count_documents({})
    pending_keywords = await seo_keywords_collection.count_documents({"status": "pending"})
    generated_keywords = await seo_keywords_collection.count_documents({"status": "generated"})
    published_keywords = await seo_keywords_collection.count_documents({"status": "published"})
    
    total_pages = await seo_pages_collection.count_documents({})
    draft_pages = await seo_pages_collection.count_documents({"status": "draft"})
    published_pages = await seo_pages_collection.count_documents({"status": "published"})
    
    landing_pages = await seo_pages_collection.count_documents({"content_type": "landing"})
    blog_pages = await seo_pages_collection.count_documents({"content_type": "blog"})
    
    # Average SEO score
    pipeline = [
        {"$group": {"_id": None, "avg_score": {"$avg": "$seo_score"}}}
    ]
    avg_result = await seo_pages_collection.aggregate(pipeline).to_list(1)
    avg_seo_score = avg_result[0]["avg_score"] if avg_result else 0
    
    return {
        "keywords": {
            "total": total_keywords,
            "pending": pending_keywords,
            "generated": generated_keywords,
            "published": published_keywords
        },
        "pages": {
            "total": total_pages,
            "draft": draft_pages,
            "published": published_pages,
            "landing": landing_pages,
            "blog": blog_pages
        },
        "avg_seo_score": round(avg_seo_score, 1)
    }
