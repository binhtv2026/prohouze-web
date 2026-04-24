"""
SCHEMA ENGINE - Full Schema Markup for SEO
==========================================
Generate structured data for all content types

Features:
1. Article schema
2. FAQ schema
3. Breadcrumb schema
4. LocalBusiness schema
5. Product/RealEstateListing schema
6. Review/Rating schema

Author: ProHouzing Engineering
Version: 1.0
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import os
import json

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
seo_pages_collection = db['seo_pages']
reviews_collection = db['seo_reviews']

# Site config
SITE_URL = os.environ.get('FRONTEND_URL', 'https://prohouzing.com')
COMPANY_NAME = "ProHouzing"
COMPANY_LOGO = f"{SITE_URL}/logo.png"


# ===================== MODELS =====================

class FAQItem(BaseModel):
    question: str
    answer: str


class ReviewData(BaseModel):
    page_id: str
    reviewer_name: str
    rating: int = Field(ge=1, le=5)
    review_text: str
    date: Optional[str] = None


class LocalBusinessData(BaseModel):
    name: str = COMPANY_NAME
    address: str = "123 Nguyễn Huệ, Quận 1, TP.HCM"
    city: str = "Hồ Chí Minh"
    region: str = "TP. Hồ Chí Minh"
    postal_code: str = "700000"
    phone: str = "+84-1900-636-019"
    opening_hours: List[str] = ["Mo-Fr 08:00-21:00", "Sa 08:00-18:00"]
    geo_lat: float = 10.7769
    geo_lng: float = 106.7009


class RealEstateListingData(BaseModel):
    name: str
    description: str
    price: float
    price_currency: str = "VND"
    address: str
    city: str
    num_bedrooms: Optional[int] = None
    num_bathrooms: Optional[int] = None
    floor_size: Optional[float] = None  # m2
    property_type: str = "Apartment"  # Apartment, House, Villa, Land
    images: List[str] = []
    url: str


# ===================== SCHEMA GENERATORS =====================

def generate_article_schema(page: dict, author: dict = None) -> dict:
    """Generate Article schema"""
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": page.get("title", "")[:110],  # Max 110 chars
        "description": page.get("meta_description", ""),
        "url": f"{SITE_URL}/{page.get('slug', '')}",
        "datePublished": page.get("published_at", datetime.now(timezone.utc)).isoformat() if isinstance(page.get("published_at"), datetime) else page.get("published_at"),
        "dateModified": page.get("updated_at", datetime.now(timezone.utc)).isoformat() if isinstance(page.get("updated_at"), datetime) else page.get("updated_at"),
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": f"{SITE_URL}/{page.get('slug', '')}"
        },
        "publisher": {
            "@type": "Organization",
            "name": COMPANY_NAME,
            "logo": {
                "@type": "ImageObject",
                "url": COMPANY_LOGO
            }
        },
        "image": page.get("featured_image", COMPANY_LOGO),
        "wordCount": page.get("word_count", 0)
    }
    
    # Add author if available
    if author:
        schema["author"] = {
            "@type": "Person",
            "name": author.get("name"),
            "url": f"{SITE_URL}/tac-gia/{author.get('slug', '')}"
        }
    else:
        schema["author"] = {
            "@type": "Organization",
            "name": COMPANY_NAME
        }
    
    return schema


def generate_faq_schema(faqs: List[dict]) -> dict:
    """Generate FAQ schema"""
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": faq["question"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq["answer"]
                }
            }
            for faq in faqs
        ]
    }


def generate_breadcrumb_schema(items: List[dict]) -> dict:
    """Generate BreadcrumbList schema"""
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": idx + 1,
                "name": item["name"],
                "item": f"{SITE_URL}{item['url']}"
            }
            for idx, item in enumerate(items)
        ]
    }


def generate_local_business_schema(data: LocalBusinessData = None) -> dict:
    """Generate LocalBusiness schema"""
    if not data:
        data = LocalBusinessData()
    
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": data.name,
        "url": SITE_URL,
        "logo": COMPANY_LOGO,
        "image": COMPANY_LOGO,
        "telephone": data.phone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": data.address,
            "addressLocality": data.city,
            "addressRegion": data.region,
            "postalCode": data.postal_code,
            "addressCountry": "VN"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": data.geo_lat,
            "longitude": data.geo_lng
        },
        "openingHoursSpecification": [
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "08:00",
                "closes": "21:00"
            },
            {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "08:00",
                "closes": "18:00"
            }
        ],
        "priceRange": "$$$",
        "sameAs": [
            "https://facebook.com/prohouzing",
            "https://linkedin.com/company/prohouzing",
            "https://youtube.com/@prohouzing"
        ]
    }


def generate_real_estate_listing_schema(data: RealEstateListingData) -> dict:
    """Generate RealEstateListing/Product schema"""
    schema = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": data.name,
        "description": data.description,
        "url": data.url,
        "offers": {
            "@type": "Offer",
            "price": data.price,
            "priceCurrency": data.price_currency,
            "availability": "https://schema.org/InStock"
        },
        "address": {
            "@type": "PostalAddress",
            "streetAddress": data.address,
            "addressLocality": data.city,
            "addressCountry": "VN"
        }
    }
    
    if data.num_bedrooms:
        schema["numberOfBedrooms"] = data.num_bedrooms
    if data.num_bathrooms:
        schema["numberOfBathroomsTotal"] = data.num_bathrooms
    if data.floor_size:
        schema["floorSize"] = {
            "@type": "QuantitativeValue",
            "value": data.floor_size,
            "unitCode": "MTK"  # Square meter
        }
    if data.images:
        schema["image"] = data.images
    
    return schema


def generate_review_schema(reviews: List[dict], page_url: str) -> dict:
    """Generate AggregateRating and Review schema"""
    if not reviews:
        return {}
    
    total_rating = sum(r.get("rating", 5) for r in reviews)
    avg_rating = round(total_rating / len(reviews), 1)
    
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": COMPANY_NAME,
        "url": page_url,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": avg_rating,
            "reviewCount": len(reviews),
            "bestRating": 5,
            "worstRating": 1
        },
        "review": [
            {
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": r.get("reviewer_name", "Khách hàng")
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": r.get("rating", 5),
                    "bestRating": 5
                },
                "reviewBody": r.get("review_text", ""),
                "datePublished": r.get("date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
            }
            for r in reviews[:10]  # Max 10 reviews in schema
        ]
    }


def generate_howto_schema(title: str, steps: List[dict]) -> dict:
    """Generate HowTo schema for guide content"""
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title,
        "step": [
            {
                "@type": "HowToStep",
                "position": idx + 1,
                "name": step.get("name", f"Bước {idx + 1}"),
                "text": step.get("text", "")
            }
            for idx, step in enumerate(steps)
        ]
    }


# ===================== PAGE SCHEMA ENHANCEMENT =====================

async def get_full_page_schema(page_id: str) -> dict:
    """Get all schemas for a page"""
    page = await seo_pages_collection.find_one({"_id": ObjectId(page_id)})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    schemas = []
    
    # 1. Article schema
    author = None
    if page.get("author_id"):
        from eeat_engine import authors_collection
        author = await authors_collection.find_one({"_id": ObjectId(page["author_id"])})
    
    article_schema = generate_article_schema(page, author)
    schemas.append(article_schema)
    
    # 2. Breadcrumb schema
    breadcrumbs = [
        {"name": "Trang chủ", "url": "/"},
    ]
    if page.get("content_type") == "blog":
        breadcrumbs.append({"name": "Blog", "url": "/blog"})
    breadcrumbs.append({"name": page.get("keyword", page.get("title", "")), "url": f"/{page.get('slug', '')}"})
    
    breadcrumb_schema = generate_breadcrumb_schema(breadcrumbs)
    schemas.append(breadcrumb_schema)
    
    # 3. FAQ schema if FAQs exist
    if page.get("faqs") and len(page["faqs"]) > 0:
        faq_schema = generate_faq_schema(page["faqs"])
        schemas.append(faq_schema)
    
    # 4. LocalBusiness schema (for location pages)
    if page.get("is_local_page") or "quận" in page.get("keyword", "").lower():
        local_schema = generate_local_business_schema()
        schemas.append(local_schema)
    
    # 5. Review schema if reviews exist
    reviews = await reviews_collection.find({"page_id": page_id}).to_list(20)
    if reviews:
        review_schema = generate_review_schema(reviews, f"{SITE_URL}/{page.get('slug', '')}")
        schemas.append(review_schema)
    
    return {
        "page_id": page_id,
        "schemas": schemas,
        "schema_count": len(schemas),
        "json_ld": [json.dumps(s, ensure_ascii=False) for s in schemas]
    }


async def add_schema_to_page(page_id: str) -> bool:
    """Add schema markup to page content"""
    schema_data = await get_full_page_schema(page_id)
    
    # Create script tags
    script_tags = "\n".join([
        f'<script type="application/ld+json">{s}</script>'
        for s in schema_data["json_ld"]
    ])
    
    # Update page with schemas
    await seo_pages_collection.update_one(
        {"_id": ObjectId(page_id)},
        {
            "$set": {
                "schemas": schema_data["schemas"],
                "schema_script": script_tags,
                "has_schema": True,
                "schema_count": schema_data["schema_count"],
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return True


# ===================== API ENDPOINTS =====================

@router.get("/page/{page_id}")
async def api_get_page_schema(page_id: str):
    """Get all schemas for a page"""
    return await get_full_page_schema(page_id)


@router.post("/page/{page_id}/add")
async def api_add_schema_to_page(page_id: str):
    """Add schema markup to page"""
    success = await add_schema_to_page(page_id)
    return {"success": success}


@router.post("/batch-add")
async def api_batch_add_schemas(page_ids: List[str]):
    """Add schemas to multiple pages"""
    results = []
    for page_id in page_ids[:50]:  # Limit 50
        try:
            await add_schema_to_page(page_id)
            results.append({"page_id": page_id, "success": True})
        except Exception as e:
            results.append({"page_id": page_id, "success": False, "error": str(e)})
    
    success_count = sum(1 for r in results if r["success"])
    return {
        "total": len(results),
        "success": success_count,
        "failed": len(results) - success_count,
        "results": results
    }


@router.get("/article")
async def api_generate_article_schema(
    title: str,
    description: str,
    url: str,
    author_name: Optional[str] = None,
    published_date: Optional[str] = None
):
    """Generate Article schema"""
    page = {
        "title": title,
        "meta_description": description,
        "slug": url.replace(SITE_URL, "").strip("/"),
        "published_at": published_date or datetime.now(timezone.utc).isoformat()
    }
    author = {"name": author_name, "slug": "author"} if author_name else None
    return generate_article_schema(page, author)


@router.post("/faq")
async def api_generate_faq_schema(faqs: List[FAQItem]):
    """Generate FAQ schema"""
    return generate_faq_schema([f.dict() for f in faqs])


@router.post("/breadcrumb")
async def api_generate_breadcrumb_schema(items: List[Dict[str, str]]):
    """Generate Breadcrumb schema"""
    return generate_breadcrumb_schema(items)


@router.get("/local-business")
async def api_generate_local_business_schema():
    """Generate LocalBusiness schema"""
    return generate_local_business_schema()


@router.post("/real-estate")
async def api_generate_real_estate_schema(data: RealEstateListingData):
    """Generate RealEstateListing schema"""
    return generate_real_estate_listing_schema(data)


@router.post("/reviews")
async def api_add_review(data: ReviewData):
    """Add a review for a page"""
    review = {
        "page_id": data.page_id,
        "reviewer_name": data.reviewer_name,
        "rating": data.rating,
        "review_text": data.review_text,
        "date": data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "is_verified": False,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await reviews_collection.insert_one(review)
    
    # Update page review count
    await seo_pages_collection.update_one(
        {"_id": ObjectId(data.page_id)},
        {"$inc": {"review_count": 1}}
    )
    
    return {"success": True, "review_id": str(result.inserted_id)}


@router.get("/reviews/{page_id}")
async def api_get_page_reviews(page_id: str, limit: int = 20):
    """Get reviews for a page"""
    reviews = []
    async for r in reviews_collection.find({"page_id": page_id}).sort("created_at", -1).limit(limit):
        reviews.append({
            "id": str(r["_id"]),
            "reviewer_name": r.get("reviewer_name"),
            "rating": r.get("rating"),
            "review_text": r.get("review_text"),
            "date": r.get("date"),
            "is_verified": r.get("is_verified", False)
        })
    
    # Calculate aggregate
    if reviews:
        avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    else:
        avg_rating = 0
    
    return {
        "reviews": reviews,
        "total": len(reviews),
        "average_rating": round(avg_rating, 1)
    }


@router.get("/stats")
async def api_get_schema_stats():
    """Get schema statistics"""
    total_pages = await seo_pages_collection.count_documents({})
    pages_with_schema = await seo_pages_collection.count_documents({"has_schema": True})
    total_reviews = await reviews_collection.count_documents({})
    
    return {
        "pages": {
            "total": total_pages,
            "with_schema": pages_with_schema,
            "coverage": round(pages_with_schema / total_pages * 100, 1) if total_pages > 0 else 0
        },
        "reviews": total_reviews
    }
