"""
E-E-A-T ENGINE - Experience, Expertise, Authoritativeness, Trustworthiness
=========================================================================
Build author profiles, credentials, and trust signals for SEO

Features:
1. Author profiles with real credentials
2. Author pages (/tac-gia/{slug})
3. Person + Organization schema
4. Experience & expertise signals
5. Case studies & real data

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
from unidecode import unidecode

# MongoDB
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv
load_dotenv()

router = APIRouter()

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
authors_collection = db['seo_authors']
case_studies_collection = db['seo_case_studies']
seo_pages_collection = db['seo_pages']

# Site config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')
COMPANY_NAME = "ProHouzing"


# ===================== MODELS =====================

class AuthorCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    title: str  # Chức danh: "Chuyên gia BĐS", "Giám đốc Kinh doanh"
    experience_years: int = 5
    bio: str  # Tiểu sử ngắn
    full_bio: Optional[str] = None  # Tiểu sử đầy đủ
    credentials: List[str] = []  # ["Chứng chỉ môi giới BĐS", "MBA"]
    expertise: List[str] = []  # ["Căn hộ cao cấp", "Đầu tư BĐS"]
    social_links: Dict[str, str] = {}  # {"facebook": "...", "linkedin": "..."}
    phone: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    is_featured: bool = False


class AuthorUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    full_bio: Optional[str] = None
    credentials: Optional[List[str]] = None
    expertise: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class CaseStudyCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    client_type: str  # "Nhà đầu tư", "Gia đình trẻ", "Doanh nghiệp"
    project_name: str
    location: str
    challenge: str  # Vấn đề khách hàng gặp
    solution: str  # Giải pháp ProHouzing đưa ra
    results: Dict[str, Any]  # {"roi": "25%", "time_saved": "3 tháng"}
    testimonial: Optional[str] = None  # Lời chứng thực
    client_name: Optional[str] = None  # Tên khách (có thể ẩn)
    author_id: Optional[str] = None
    images: List[str] = []


class AuthorExperienceSignal(BaseModel):
    """Experience signals to add to content"""
    author_id: str
    signal_type: str  # "transaction", "consultation", "award"
    description: str
    date: Optional[str] = None
    value: Optional[str] = None  # "500 giao dịch", "10 năm"


# ===================== HELPER FUNCTIONS =====================

def create_slug(text: str) -> str:
    """Convert text to URL-friendly slug"""
    slug = unidecode(text)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    slug = re.sub(r'-+', '-', slug)
    return slug


def generate_person_schema(author: dict) -> dict:
    """Generate Person schema for author"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": author.get("name"),
        "jobTitle": author.get("title"),
        "description": author.get("bio"),
        "url": f"{SITE_URL}/tac-gia/{author.get('slug')}",
        "worksFor": {
            "@type": "Organization",
            "name": COMPANY_NAME,
            "url": SITE_URL
        }
    }
    
    if author.get("avatar_url"):
        schema["image"] = author["avatar_url"]
    
    if author.get("email"):
        schema["email"] = author["email"]
    
    if author.get("social_links"):
        same_as = []
        for platform, url in author["social_links"].items():
            if url:
                same_as.append(url)
        if same_as:
            schema["sameAs"] = same_as
    
    # Add credentials
    if author.get("credentials"):
        schema["hasCredential"] = [
            {"@type": "EducationalOccupationalCredential", "name": cred}
            for cred in author["credentials"]
        ]
    
    # Add expertise
    if author.get("expertise"):
        schema["knowsAbout"] = author["expertise"]
    
    return schema


def generate_organization_schema() -> dict:
    """Generate Organization schema for ProHouzing"""
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": COMPANY_NAME,
        "url": SITE_URL,
        "logo": f"{SITE_URL}/logo.png",
        "description": "Nền tảng bất động sản hàng đầu Việt Nam với đội ngũ chuyên gia giàu kinh nghiệm",
        "foundingDate": "2020",
        "numberOfEmployees": {
            "@type": "QuantitativeValue",
            "value": 50
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "123 Nguyễn Huệ",
            "addressLocality": "Quận 1",
            "addressRegion": "TP. Hồ Chí Minh",
            "postalCode": "700000",
            "addressCountry": "VN"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+84-1900-636-019",
            "contactType": "customer service",
            "availableLanguage": ["Vietnamese", "English"]
        },
        "sameAs": [
            "https://facebook.com/prohouzing",
            "https://linkedin.com/company/prohouzing",
            "https://youtube.com/@prohouzing"
        ]
    }


# ===================== AUTHOR MANAGEMENT =====================

async def create_author(data: AuthorCreate) -> dict:
    """Create a new author profile"""
    now = datetime.now(timezone.utc)
    
    slug = data.slug or create_slug(data.name)
    
    # Check duplicate
    existing = await authors_collection.find_one({"slug": slug})
    if existing:
        slug = f"{slug}-{int(now.timestamp())}"
    
    author = {
        "name": data.name,
        "slug": slug,
        "title": data.title,
        "experience_years": data.experience_years,
        "bio": data.bio,
        "full_bio": data.full_bio,
        "credentials": data.credentials,
        "expertise": data.expertise,
        "social_links": data.social_links,
        "phone": data.phone,
        "email": data.email,
        "avatar_url": data.avatar_url,
        "is_featured": data.is_featured,
        "is_active": True,
        "articles_count": 0,
        "created_at": now,
        "updated_at": now
    }
    
    result = await authors_collection.insert_one(author)
    author["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in author:
        del author["_id"]
    
    return author


async def get_author_by_slug(slug: str) -> dict:
    """Get author by slug"""
    author = await authors_collection.find_one({"slug": slug, "is_active": True})
    if not author:
        return None
    
    author["id"] = str(author["_id"])
    del author["_id"]
    
    # Get author's articles
    articles = []
    async for page in seo_pages_collection.find({
        "author_id": author["id"],
        "status": "published"
    }).sort("published_at", -1).limit(10):
        articles.append({
            "id": str(page["_id"]),
            "title": page.get("title"),
            "slug": page.get("slug"),
            "content_type": page.get("content_type"),
            "published_at": page["published_at"].isoformat() if page.get("published_at") else None
        })
    
    author["recent_articles"] = articles
    author["schema"] = generate_person_schema(author)
    
    return author


async def assign_author_to_page(page_id: str, author_id: str) -> bool:
    """Assign author to a page and add E-E-A-T signals"""
    author = await authors_collection.find_one({"_id": ObjectId(author_id)})
    if not author:
        return False
    
    # Update page with author info
    author_info = {
        "author_id": author_id,
        "author_name": author.get("name"),
        "author_title": author.get("title"),
        "author_slug": author.get("slug"),
        "author_bio": author.get("bio"),
        "author_avatar": author.get("avatar_url"),
        "author_credentials": author.get("credentials", []),
        "author_experience_years": author.get("experience_years", 0)
    }
    
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                **author_info,
                "has_eeat": True,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    # Update author article count
    await authors_collection.update_one(
        {"_id": ObjectId(author_id)},
        {"$inc": {"articles_count": 1}}
    )
    
    return True


# ===================== CASE STUDIES =====================

async def create_case_study(data: CaseStudyCreate) -> dict:
    """Create a case study for E-E-A-T"""
    now = datetime.now(timezone.utc)
    
    slug = data.slug or create_slug(data.title)
    
    case_study = {
        "title": data.title,
        "slug": slug,
        "client_type": data.client_type,
        "project_name": data.project_name,
        "location": data.location,
        "challenge": data.challenge,
        "solution": data.solution,
        "results": data.results,
        "testimonial": data.testimonial,
        "client_name": data.client_name,
        "author_id": data.author_id,
        "images": data.images,
        "is_published": False,
        "created_at": now
    }
    
    result = await case_studies_collection.insert_one(case_study)
    case_study["id"] = str(result.inserted_id)
    # Remove MongoDB ObjectId before returning
    if "_id" in case_study:
        del case_study["_id"]
    
    return case_study


# ===================== E-E-A-T CONTENT ENHANCEMENT =====================

def generate_eeat_content_block(author: dict, case_study: dict = None) -> str:
    """Generate E-E-A-T content block to insert into articles"""
    
    html = f"""
<div class="eeat-author-box" itemscope itemtype="https://schema.org/Person">
    <div class="author-header">
        <img src="{author.get('avatar_url', '/default-avatar.png')}" alt="{author['name']}" class="author-avatar" itemprop="image">
        <div class="author-info">
            <h4 itemprop="name">{author['name']}</h4>
            <p class="author-title" itemprop="jobTitle">{author['title']}</p>
            <p class="author-experience">{author.get('experience_years', 5)} năm kinh nghiệm trong ngành BĐS</p>
        </div>
    </div>
    <div class="author-bio" itemprop="description">
        <p>{author['bio']}</p>
    </div>
"""
    
    if author.get('credentials'):
        html += """
    <div class="author-credentials">
        <h5>Chứng chỉ & Bằng cấp:</h5>
        <ul>
"""
        for cred in author['credentials']:
            html += f"            <li>{cred}</li>\n"
        html += """        </ul>
    </div>
"""
    
    if author.get('expertise'):
        html += """
    <div class="author-expertise">
        <h5>Chuyên môn:</h5>
        <div class="expertise-tags">
"""
        for exp in author['expertise']:
            html += f'            <span class="tag">{exp}</span>\n'
        html += """        </div>
    </div>
"""
    
    html += f"""
    <div class="author-cta">
        <a href="/tac-gia/{author['slug']}" class="btn-view-profile">Xem hồ sơ đầy đủ</a>
    </div>
</div>
"""
    
    # Add case study if provided
    if case_study:
        html += f"""
<div class="case-study-box">
    <h4>📊 Case Study: {case_study['title']}</h4>
    <div class="case-study-content">
        <p><strong>Khách hàng:</strong> {case_study['client_type']}</p>
        <p><strong>Dự án:</strong> {case_study['project_name']} - {case_study['location']}</p>
        <p><strong>Thách thức:</strong> {case_study['challenge']}</p>
        <p><strong>Giải pháp:</strong> {case_study['solution']}</p>
        <div class="results">
            <h5>Kết quả đạt được:</h5>
            <ul>
"""
        for key, value in case_study.get('results', {}).items():
            html += f"                <li><strong>{key}:</strong> {value}</li>\n"
        html += """            </ul>
        </div>
"""
        if case_study.get('testimonial'):
            html += f"""
        <blockquote class="testimonial">
            "{case_study['testimonial']}"
            <cite>- {case_study.get('client_name', 'Khách hàng ẩn danh')}</cite>
        </blockquote>
"""
        html += """    </div>
</div>
"""
    
    return html


async def enhance_page_with_eeat(page_id: str, author_id: str, case_study_id: str = None) -> dict:
    """Enhance a page with E-E-A-T signals"""
    
    # Get author
    author = await authors_collection.find_one({"_id": ObjectId(author_id)})
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    
    author["id"] = str(author["_id"])
    
    # Get case study if provided
    case_study = None
    if case_study_id:
        case_study = await case_studies_collection.find_one({"_id": ObjectId(case_study_id)})
        if case_study:
            case_study["id"] = str(case_study["_id"])
    
    # Generate E-E-A-T content block
    eeat_block = generate_eeat_content_block(author, case_study)
    
    # Update page
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Insert E-E-A-T block after first H2 or at beginning
    content = page.get("content", "")
    h2_match = re.search(r'</h2>', content, re.IGNORECASE)
    if h2_match:
        insert_pos = h2_match.end()
        new_content = content[:insert_pos] + "\n" + eeat_block + "\n" + content[insert_pos:]
    else:
        new_content = eeat_block + "\n" + content
    
    # Generate author schema
    author_schema = generate_person_schema(author)
    
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                "content": new_content,
                "author_id": author_id,
                "author_name": author.get("name"),
                "author_slug": author.get("slug"),
                "author_schema": author_schema,
                "case_study_id": case_study_id,
                "has_eeat": True,
                "eeat_score": calculate_eeat_score(author, case_study),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "page_id": page_id,
        "author_id": author_id,
        "eeat_block_added": True,
        "author_schema": author_schema
    }


def calculate_eeat_score(author: dict, case_study: dict = None) -> int:
    """Calculate E-E-A-T score for a page (0-100)"""
    score = 0
    
    # Experience signals
    if author.get("experience_years", 0) >= 10:
        score += 20
    elif author.get("experience_years", 0) >= 5:
        score += 15
    elif author.get("experience_years", 0) >= 2:
        score += 10
    
    # Expertise signals
    if author.get("credentials"):
        score += min(len(author["credentials"]) * 5, 20)
    
    if author.get("expertise"):
        score += min(len(author["expertise"]) * 3, 15)
    
    # Authoritativeness
    if author.get("articles_count", 0) >= 20:
        score += 15
    elif author.get("articles_count", 0) >= 10:
        score += 10
    elif author.get("articles_count", 0) >= 5:
        score += 5
    
    # Trust signals
    if author.get("social_links"):
        score += min(len(author["social_links"]) * 3, 10)
    
    if author.get("avatar_url"):
        score += 5
    
    # Case study bonus
    if case_study:
        score += 15
        if case_study.get("testimonial"):
            score += 5
    
    return min(score, 100)


# ===================== SEED DEFAULT AUTHORS =====================

async def seed_default_authors():
    """Seed default expert authors"""
    
    default_authors = [
        {
            "name": "Nguyễn Văn An",
            "slug": "nguyen-van-an",
            "title": "Giám đốc Tư vấn Đầu tư BĐS",
            "experience_years": 12,
            "bio": "Với hơn 12 năm kinh nghiệm trong ngành bất động sản, anh An đã tư vấn thành công cho hơn 500 khách hàng đầu tư và sở hữu BĐS tại các thành phố lớn.",
            "full_bio": "Anh Nguyễn Văn An tốt nghiệp Thạc sĩ Quản trị Kinh doanh tại Đại học Kinh tế TP.HCM và có chứng chỉ môi giới BĐS quốc gia. Anh từng làm việc tại các tập đoàn BĐS lớn như Vingroup, Novaland trước khi gia nhập ProHouzing.",
            "credentials": ["Thạc sĩ Quản trị Kinh doanh", "Chứng chỉ môi giới BĐS", "Chứng chỉ định giá BĐS"],
            "expertise": ["Đầu tư căn hộ cao cấp", "Phân tích thị trường", "Tư vấn pháp lý BĐS"],
            "social_links": {"linkedin": "https://linkedin.com/in/nguyenvanan", "facebook": "https://facebook.com/nguyenvanan"},
            "email": "an.nguyen@prohouzing.vn",
            "is_featured": True
        },
        {
            "name": "Trần Thị Bình",
            "slug": "tran-thi-binh",
            "title": "Chuyên gia Phân tích Thị trường",
            "experience_years": 8,
            "bio": "Chị Bình là chuyên gia phân tích thị trường với 8 năm kinh nghiệm, đã xuất bản hơn 200 báo cáo nghiên cứu thị trường BĐS.",
            "credentials": ["Cử nhân Kinh tế", "Chứng chỉ CFA Level 2", "Chứng chỉ phân tích đầu tư"],
            "expertise": ["Phân tích giá BĐS", "Dự báo xu hướng", "Nghiên cứu thị trường"],
            "social_links": {"linkedin": "https://linkedin.com/in/tranthibinh"},
            "email": "binh.tran@prohouzing.vn",
            "is_featured": True
        },
        {
            "name": "Lê Minh Cường",
            "slug": "le-minh-cuong",
            "title": "Trưởng phòng Kinh doanh Dự án",
            "experience_years": 10,
            "bio": "Anh Cường có 10 năm kinh nghiệm phát triển kinh doanh các dự án BĐS cao cấp, từng tham gia bán hàng thành công hơn 2000 căn hộ.",
            "credentials": ["Cử nhân Quản trị Kinh doanh", "Chứng chỉ môi giới BĐS"],
            "expertise": ["Bán hàng dự án mới", "Phát triển kinh doanh", "Đào tạo sales"],
            "social_links": {"facebook": "https://facebook.com/leminhcuong"},
            "email": "cuong.le@prohouzing.vn",
            "is_featured": False
        }
    ]
    
    created = 0
    for author_data in default_authors:
        existing = await authors_collection.find_one({"slug": author_data["slug"]})
        if not existing:
            author_data["is_active"] = True
            author_data["articles_count"] = 0
            author_data["created_at"] = datetime.now(timezone.utc)
            author_data["updated_at"] = datetime.now(timezone.utc)
            await authors_collection.insert_one(author_data)
            created += 1
    
    return created


# ===================== API ENDPOINTS =====================

@router.get("/authors")
async def api_list_authors(featured_only: bool = False):
    """List all authors"""
    query = {"is_active": True}
    if featured_only:
        query["is_featured"] = True
    
    authors = []
    async for author in authors_collection.find(query).sort("articles_count", -1):
        authors.append({
            "id": str(author["_id"]),
            "name": author.get("name"),
            "slug": author.get("slug"),
            "title": author.get("title"),
            "bio": author.get("bio"),
            "experience_years": author.get("experience_years"),
            "credentials": author.get("credentials", []),
            "expertise": author.get("expertise", []),
            "avatar_url": author.get("avatar_url"),
            "articles_count": author.get("articles_count", 0),
            "is_featured": author.get("is_featured", False)
        })
    
    return {"authors": authors, "total": len(authors)}


@router.get("/authors/{slug}")
async def api_get_author(slug: str):
    """Get author profile by slug"""
    author = await get_author_by_slug(slug)
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author


@router.post("/authors")
async def api_create_author(data: AuthorCreate):
    """Create new author"""
    author = await create_author(data)
    return {"success": True, "author": author}


@router.put("/authors/{author_id}")
async def api_update_author(author_id: str, data: AuthorUpdate):
    """Update author profile"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await authors_collection.update_one(
        {"_id": ObjectId(author_id)},
        {"$set": update_data}
    )
    return {"success": True}


@router.post("/authors/seed-defaults")
async def api_seed_default_authors():
    """Seed default expert authors"""
    created = await seed_default_authors()
    return {"success": True, "created": created}


@router.get("/case-studies")
async def api_list_case_studies(limit: int = 20):
    """List case studies"""
    cases = []
    async for cs in case_studies_collection.find({"is_published": True}).sort("created_at", -1).limit(limit):
        cases.append({
            "id": str(cs["_id"]),
            "title": cs.get("title"),
            "slug": cs.get("slug"),
            "client_type": cs.get("client_type"),
            "project_name": cs.get("project_name"),
            "location": cs.get("location"),
            "results": cs.get("results")
        })
    return {"case_studies": cases}


@router.post("/case-studies")
async def api_create_case_study(data: CaseStudyCreate):
    """Create case study"""
    case_study = await create_case_study(data)
    return {"success": True, "case_study": case_study}


@router.post("/enhance-page/{page_id}")
async def api_enhance_page_eeat(
    page_id: str, 
    author_id: str, 
    case_study_id: Optional[str] = None
):
    """Enhance page with E-E-A-T signals"""
    result = await enhance_page_with_eeat(page_id, author_id, case_study_id)
    return result


@router.post("/assign-author")
async def api_assign_author(page_id: str, author_id: str):
    """Assign author to page"""
    success = await assign_author_to_page(page_id, author_id)
    return {"success": success}


@router.get("/organization-schema")
async def api_get_organization_schema():
    """Get Organization schema for ProHouzing"""
    return generate_organization_schema()


@router.get("/stats")
async def api_get_eeat_stats():
    """Get E-E-A-T statistics"""
    total_authors = await authors_collection.count_documents({"is_active": True})
    featured_authors = await authors_collection.count_documents({"is_active": True, "is_featured": True})
    total_case_studies = await case_studies_collection.count_documents({})
    pages_with_eeat = await seo_pages_collection.count_documents({"has_eeat": True})
    total_pages = await seo_pages_collection.count_documents({})
    
    return {
        "authors": {
            "total": total_authors,
            "featured": featured_authors
        },
        "case_studies": total_case_studies,
        "pages": {
            "total": total_pages,
            "with_eeat": pages_with_eeat,
            "eeat_coverage": round(pages_with_eeat / total_pages * 100, 1) if total_pages > 0 else 0
        }
    }
