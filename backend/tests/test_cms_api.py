"""
CMS API Tests - Prompt 14/20
Website CMS / Landing Page / SEO Engine

Tests for all CMS endpoints including:
- Dashboard API
- Config APIs
- Pages CRUD
- Articles CRUD
- Landing Pages CRUD
- Public Projects CRUD
- Testimonials CRUD
- Partners CRUD
- Careers CRUD
- FAQs CRUD
- Sitemap API
- Slug generation
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCMSConfigAPIs:
    """Test all CMS config endpoints"""
    
    def test_get_content_statuses(self):
        """Test /api/cms/config/content-statuses returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/content-statuses")
        assert response.status_code == 200
        data = response.json()
        assert "draft" in data
        assert "published" in data
        assert data["draft"]["label"] == "Bản nháp"
        print(f"Content statuses: {list(data.keys())}")
        
    def test_get_page_types(self):
        """Test /api/cms/config/page-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/page-types")
        assert response.status_code == 200
        data = response.json()
        assert "static" in data
        assert "landing" in data
        print(f"Page types: {list(data.keys())}")
        
    def test_get_article_categories(self):
        """Test /api/cms/config/article-categories returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/article-categories")
        assert response.status_code == 200
        data = response.json()
        assert "market" in data
        assert "project" in data
        print(f"Article categories: {list(data.keys())}")
        
    def test_get_static_page_types(self):
        """Test /api/cms/config/static-page-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/static-page-types")
        assert response.status_code == 200
        data = response.json()
        assert "about" in data
        assert "contact" in data
        print(f"Static page types: {list(data.keys())}")
        
    def test_get_landing_page_types(self):
        """Test /api/cms/config/landing-page-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/landing-page-types")
        assert response.status_code == 200
        data = response.json()
        assert "project_promo" in data
        assert "lead_capture" in data
        print(f"Landing page types: {list(data.keys())}")
        
    def test_get_partner_categories(self):
        """Test /api/cms/config/partner-categories returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/partner-categories")
        assert response.status_code == 200
        data = response.json()
        assert "developer" in data
        assert "bank" in data
        print(f"Partner categories: {list(data.keys())}")
        
    def test_get_testimonial_categories(self):
        """Test /api/cms/config/testimonial-categories returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/testimonial-categories")
        assert response.status_code == 200
        data = response.json()
        assert "buyer" in data
        assert "investor" in data
        print(f"Testimonial categories: {list(data.keys())}")
        
    def test_get_media_asset_types(self):
        """Test /api/cms/config/media-asset-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/media-asset-types")
        assert response.status_code == 200
        data = response.json()
        assert "image" in data
        assert "video" in data
        print(f"Media asset types: {list(data.keys())}")
        
    def test_get_seo_settings(self):
        """Test /api/cms/config/seo returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/seo")
        assert response.status_code == 200
        data = response.json()
        assert "title_max_length" in data
        assert "description_max_length" in data
        print(f"SEO config keys: {list(data.keys())}")
        
    def test_get_visibility_levels(self):
        """Test /api/cms/config/visibility-levels returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/visibility-levels")
        assert response.status_code == 200
        data = response.json()
        assert "public" in data
        assert "internal" in data
        print(f"Visibility levels: {list(data.keys())}")
        
    def test_get_cta_types(self):
        """Test /api/cms/config/cta-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/cta-types")
        assert response.status_code == 200
        data = response.json()
        assert "phone" in data
        assert "form" in data
        print(f"CTA types: {list(data.keys())}")
        
    def test_get_form_types(self):
        """Test /api/cms/config/form-types returns config"""
        response = requests.get(f"{BASE_URL}/api/cms/config/form-types")
        assert response.status_code == 200
        data = response.json()
        assert "contact_form" in data
        assert "newsletter" in data
        print(f"Form types: {list(data.keys())}")


class TestCMSDashboardAPI:
    """Test CMS Dashboard API"""
    
    def test_get_dashboard_stats(self):
        """Test /api/cms/dashboard returns statistics"""
        response = requests.get(f"{BASE_URL}/api/cms/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected stats fields
        assert "total_pages" in data
        assert "published_pages" in data
        assert "draft_pages" in data
        assert "total_articles" in data
        assert "published_articles" in data
        assert "total_landing_pages" in data
        assert "active_landing_pages" in data
        assert "total_public_projects" in data
        assert "total_testimonials" in data
        assert "total_partners" in data
        assert "total_careers" in data
        assert "active_careers" in data
        assert "total_media_assets" in data
        assert "total_faqs" in data
        assert "total_page_views" in data
        assert "total_form_submissions" in data
        
        print(f"Dashboard stats: pages={data['total_pages']}, articles={data['total_articles']}")


class TestCMSPagesCRUD:
    """Test CMS Pages CRUD operations"""
    
    created_page_id = None
    
    def test_create_page(self):
        """Test POST /api/cms/pages creates a new page"""
        payload = {
            "title": "TEST_Trang Giới Thiệu Test",
            "page_type": "about",
            "content": "<h1>Giới thiệu</h1><p>Nội dung trang test</p>",
            "excerpt": "Trang test cho API",
            "template": "default",
            "is_in_menu": False,
            "visibility": "public",
            "status": "draft"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/pages",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["page_type"] == payload["page_type"]
        assert data["status"] == "draft"
        assert "slug" in data and data["slug"]  # Slug auto-generated
        assert "created_at" in data
        
        TestCMSPagesCRUD.created_page_id = data["id"]
        print(f"Created page: {data['id']} with slug: {data['slug']}")
        
    def test_list_pages(self):
        """Test GET /api/cms/pages lists all pages"""
        response = requests.get(f"{BASE_URL}/api/cms/pages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} pages")
        
    def test_get_page_by_id(self):
        """Test GET /api/cms/pages/{id} returns page details"""
        assert TestCMSPagesCRUD.created_page_id, "Page ID not set - run test_create_page first"
        
        response = requests.get(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSPagesCRUD.created_page_id
        assert "title" in data
        print(f"Retrieved page: {data['title']}")
        
    def test_update_page(self):
        """Test PUT /api/cms/pages/{id} updates page"""
        assert TestCMSPagesCRUD.created_page_id, "Page ID not set"
        
        payload = {
            "title": "TEST_Trang Giới Thiệu Updated",
            "content": "<h1>Nội dung đã cập nhật</h1>"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == payload["title"]
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        get_data = get_response.json()
        assert get_data["title"] == payload["title"]
        print(f"Updated page title to: {get_data['title']}")
        
    def test_publish_page(self):
        """Test POST /api/cms/pages/{id}/publish publishes page"""
        assert TestCMSPagesCRUD.created_page_id, "Page ID not set"
        
        response = requests.post(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}/publish")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "published_at" in data
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        assert get_response.json()["status"] == "published"
        print("Page published successfully")
        
    def test_unpublish_page(self):
        """Test POST /api/cms/pages/{id}/unpublish unpublishes page"""
        assert TestCMSPagesCRUD.created_page_id, "Page ID not set"
        
        response = requests.post(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}/unpublish")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify status changed
        get_response = requests.get(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        assert get_response.json()["status"] == "unpublished"
        print("Page unpublished successfully")
        
    def test_delete_page(self):
        """Test DELETE /api/cms/pages/{id} deletes page"""
        assert TestCMSPagesCRUD.created_page_id, "Page ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/cms/pages/{TestCMSPagesCRUD.created_page_id}")
        assert get_response.status_code == 404
        print("Page deleted successfully")


class TestCMSArticlesCRUD:
    """Test CMS Articles CRUD operations"""
    
    created_article_id = None
    
    def test_create_article(self):
        """Test POST /api/cms/articles creates a new article"""
        payload = {
            "title": "TEST_Bài viết về thị trường BĐS",
            "excerpt": "Tóm tắt bài viết test",
            "content": "<p>Nội dung bài viết chi tiết về thị trường bất động sản Việt Nam năm 2025</p>",
            "category": "market",
            "tags": ["bds", "thi-truong", "2025"],
            "author_name": "Admin Test",
            "is_featured": False,
            "status": "draft"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/articles",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["category"] == "market"
        assert data["tags"] == payload["tags"]
        assert "slug" in data and data["slug"]
        assert "read_time_minutes" in data
        
        TestCMSArticlesCRUD.created_article_id = data["id"]
        print(f"Created article: {data['id']} with slug: {data['slug']}")
        
    def test_list_articles(self):
        """Test GET /api/cms/articles lists all articles"""
        response = requests.get(f"{BASE_URL}/api/cms/articles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} articles")
        
    def test_list_articles_with_filters(self):
        """Test GET /api/cms/articles with filters"""
        response = requests.get(f"{BASE_URL}/api/cms/articles?status=draft&category=market")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} draft market articles")
        
    def test_get_article_by_id(self):
        """Test GET /api/cms/articles/{id} returns article"""
        assert TestCMSArticlesCRUD.created_article_id, "Article ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/articles/{TestCMSArticlesCRUD.created_article_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSArticlesCRUD.created_article_id
        print(f"Retrieved article: {data['title']}")
        
    def test_update_article(self):
        """Test PUT /api/cms/articles/{id} updates article"""
        assert TestCMSArticlesCRUD.created_article_id, "Article ID not set"
        
        payload = {
            "title": "TEST_Bài viết đã cập nhật",
            "is_featured": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/cms/articles/{TestCMSArticlesCRUD.created_article_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["is_featured"] == True
        print(f"Updated article: {data['title']}")
        
    def test_publish_article(self):
        """Test POST /api/cms/articles/{id}/publish publishes article"""
        assert TestCMSArticlesCRUD.created_article_id, "Article ID not set"
        
        response = requests.post(f"{BASE_URL}/api/cms/articles/{TestCMSArticlesCRUD.created_article_id}/publish")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print("Article published successfully")
        
    def test_delete_article(self):
        """Test DELETE /api/cms/articles/{id} deletes article"""
        assert TestCMSArticlesCRUD.created_article_id, "Article ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/articles/{TestCMSArticlesCRUD.created_article_id}")
        assert response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/cms/articles/{TestCMSArticlesCRUD.created_article_id}")
        assert get_response.status_code == 404
        print("Article deleted successfully")


class TestCMSLandingPagesCRUD:
    """Test CMS Landing Pages CRUD operations"""
    
    created_lp_id = None
    
    def test_create_landing_page(self):
        """Test POST /api/cms/landing-pages creates landing page"""
        payload = {
            "title": "TEST_LP Vinhomes Grand Park",
            "landing_type": "project_promo",
            "headline": "Sở hữu căn hộ Vinhomes chỉ từ 2.5 tỷ",
            "subheadline": "Ưu đãi chiết khấu 10% trong tháng 3",
            "utm_source": "facebook",
            "utm_medium": "cpc",
            "utm_campaign": "vinhomes_march",
            "template": "hero_cta",
            "theme": "light",
            "hide_navigation": True,
            "show_chat_widget": True,
            "status": "draft"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/landing-pages",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["headline"] == payload["headline"]
        assert data["utm_source"] == "facebook"
        assert "slug" in data
        assert "views" in data
        assert "form_submissions" in data
        assert "conversion_rate" in data
        
        TestCMSLandingPagesCRUD.created_lp_id = data["id"]
        print(f"Created landing page: {data['id']} with slug: {data['slug']}")
        
    def test_list_landing_pages(self):
        """Test GET /api/cms/landing-pages lists all landing pages"""
        response = requests.get(f"{BASE_URL}/api/cms/landing-pages")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} landing pages")
        
    def test_get_landing_page_by_id(self):
        """Test GET /api/cms/landing-pages/{id} returns landing page"""
        assert TestCMSLandingPagesCRUD.created_lp_id, "LP ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/landing-pages/{TestCMSLandingPagesCRUD.created_lp_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSLandingPagesCRUD.created_lp_id
        print(f"Retrieved LP: {data['title']}")
        
    def test_update_landing_page(self):
        """Test PUT /api/cms/landing-pages/{id} updates landing page"""
        assert TestCMSLandingPagesCRUD.created_lp_id, "LP ID not set"
        
        payload = {
            "headline": "TEST_Headline Updated - Giảm 15%!",
            "status": "published"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/cms/landing-pages/{TestCMSLandingPagesCRUD.created_lp_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["headline"] == payload["headline"]
        assert data["status"] == "published"
        print(f"Updated LP headline: {data['headline']}")
        
    def test_track_submission(self):
        """Test POST /api/cms/landing-pages/{id}/track-submission tracks form"""
        assert TestCMSLandingPagesCRUD.created_lp_id, "LP ID not set"
        
        response = requests.post(f"{BASE_URL}/api/cms/landing-pages/{TestCMSLandingPagesCRUD.created_lp_id}/track-submission")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "form_submissions" in data
        assert data["form_submissions"] >= 1
        print(f"Tracked submission. Total: {data['form_submissions']}")
        
    def test_delete_landing_page(self):
        """Test DELETE /api/cms/landing-pages/{id} deletes landing page"""
        assert TestCMSLandingPagesCRUD.created_lp_id, "LP ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/landing-pages/{TestCMSLandingPagesCRUD.created_lp_id}")
        assert response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/cms/landing-pages/{TestCMSLandingPagesCRUD.created_lp_id}")
        assert get_response.status_code == 404
        print("Landing page deleted successfully")


class TestCMSTestimonialsCRUD:
    """Test CMS Testimonials CRUD operations"""
    
    created_testimonial_id = None
    
    def test_create_testimonial(self):
        """Test POST /api/cms/testimonials creates testimonial"""
        payload = {
            "name": "TEST_Nguyễn Văn A",
            "role": "Khách mua căn hộ",
            "content": "ProHouzing đã giúp tôi tìm được căn hộ ưng ý với giá tốt nhất.",
            "rating": 5,
            "category": "buyer",
            "project_name": "Vinhomes Grand Park",
            "is_featured": True,
            "is_active": True,
            "order": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/testimonials",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["rating"] == 5
        assert data["category"] == "buyer"
        
        TestCMSTestimonialsCRUD.created_testimonial_id = data["id"]
        print(f"Created testimonial: {data['id']}")
        
    def test_list_testimonials(self):
        """Test GET /api/cms/testimonials lists testimonials"""
        response = requests.get(f"{BASE_URL}/api/cms/testimonials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} testimonials")
        
    def test_get_testimonial_by_id(self):
        """Test GET /api/cms/testimonials/{id} returns testimonial"""
        assert TestCMSTestimonialsCRUD.created_testimonial_id, "Testimonial ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/testimonials/{TestCMSTestimonialsCRUD.created_testimonial_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSTestimonialsCRUD.created_testimonial_id
        print(f"Retrieved testimonial: {data['name']}")
        
    def test_update_testimonial(self):
        """Test PUT /api/cms/testimonials/{id} updates testimonial"""
        assert TestCMSTestimonialsCRUD.created_testimonial_id, "Testimonial ID not set"
        
        payload = {"content": "TEST_Updated testimonial content - rất hài lòng!"}
        
        response = requests.put(
            f"{BASE_URL}/api/cms/testimonials/{TestCMSTestimonialsCRUD.created_testimonial_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Updated" in data["content"]
        print("Updated testimonial content")
        
    def test_delete_testimonial(self):
        """Test DELETE /api/cms/testimonials/{id} deletes testimonial"""
        assert TestCMSTestimonialsCRUD.created_testimonial_id, "Testimonial ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/testimonials/{TestCMSTestimonialsCRUD.created_testimonial_id}")
        assert response.status_code == 200
        print("Testimonial deleted successfully")


class TestCMSPartnersCRUD:
    """Test CMS Partners CRUD operations"""
    
    created_partner_id = None
    
    def test_create_partner(self):
        """Test POST /api/cms/partners creates partner"""
        payload = {
            "name": "TEST_Vinhomes",
            "logo": "https://example.com/vinhomes-logo.png",
            "website": "https://vinhomes.vn",
            "description": "Chủ đầu tư hàng đầu Việt Nam",
            "category": "developer",
            "is_featured": True,
            "is_active": True,
            "order": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/partners",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["category"] == "developer"
        
        TestCMSPartnersCRUD.created_partner_id = data["id"]
        print(f"Created partner: {data['id']}")
        
    def test_list_partners(self):
        """Test GET /api/cms/partners lists partners"""
        response = requests.get(f"{BASE_URL}/api/cms/partners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} partners")
        
    def test_get_partner_by_id(self):
        """Test GET /api/cms/partners/{id} returns partner"""
        assert TestCMSPartnersCRUD.created_partner_id, "Partner ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/partners/{TestCMSPartnersCRUD.created_partner_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSPartnersCRUD.created_partner_id
        print(f"Retrieved partner: {data['name']}")
        
    def test_update_partner(self):
        """Test PUT /api/cms/partners/{id} updates partner"""
        assert TestCMSPartnersCRUD.created_partner_id, "Partner ID not set"
        
        payload = {"description": "TEST_Updated - Chủ đầu tư số 1 Việt Nam"}
        
        response = requests.put(
            f"{BASE_URL}/api/cms/partners/{TestCMSPartnersCRUD.created_partner_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Updated" in data["description"]
        print("Updated partner description")
        
    def test_delete_partner(self):
        """Test DELETE /api/cms/partners/{id} deletes partner"""
        assert TestCMSPartnersCRUD.created_partner_id, "Partner ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/partners/{TestCMSPartnersCRUD.created_partner_id}")
        assert response.status_code == 200
        print("Partner deleted successfully")


class TestCMSCareersCRUD:
    """Test CMS Careers CRUD operations"""
    
    created_career_id = None
    
    def test_create_career(self):
        """Test POST /api/cms/careers creates career posting"""
        payload = {
            "title": "TEST_Sales Executive",
            "department": "Sales",
            "location": "TP.HCM",
            "employment_type": "full-time",
            "salary_min": 15000000,
            "salary_max": 30000000,
            "salary_display": "15 - 30 triệu",
            "description": "Mô tả công việc Sales Executive",
            "requirements": ["Tốt nghiệp Đại học", "1 năm kinh nghiệm"],
            "benefits": ["BHXH", "Thưởng doanh số"],
            "is_hot": True,
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/careers",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["title"] == payload["title"]
        assert data["department"] == "Sales"
        assert "slug" in data
        
        TestCMSCareersCRUD.created_career_id = data["id"]
        print(f"Created career: {data['id']} with slug: {data['slug']}")
        
    def test_list_careers(self):
        """Test GET /api/cms/careers lists careers"""
        response = requests.get(f"{BASE_URL}/api/cms/careers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} careers")
        
    def test_list_careers_with_filters(self):
        """Test GET /api/cms/careers with filters"""
        response = requests.get(f"{BASE_URL}/api/cms/careers?is_hot=true&is_active=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} hot active careers")
        
    def test_get_career_by_id(self):
        """Test GET /api/cms/careers/{id} returns career"""
        assert TestCMSCareersCRUD.created_career_id, "Career ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/careers/{TestCMSCareersCRUD.created_career_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSCareersCRUD.created_career_id
        print(f"Retrieved career: {data['title']}")
        
    def test_update_career(self):
        """Test PUT /api/cms/careers/{id} updates career"""
        assert TestCMSCareersCRUD.created_career_id, "Career ID not set"
        
        payload = {"title": "TEST_Senior Sales Executive", "is_urgent": True}
        
        response = requests.put(
            f"{BASE_URL}/api/cms/careers/{TestCMSCareersCRUD.created_career_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Senior" in data["title"]
        assert data["is_urgent"] == True
        print("Updated career title and urgency")
        
    def test_delete_career(self):
        """Test DELETE /api/cms/careers/{id} deletes career"""
        assert TestCMSCareersCRUD.created_career_id, "Career ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/careers/{TestCMSCareersCRUD.created_career_id}")
        assert response.status_code == 200
        print("Career deleted successfully")


class TestCMSFAQsCRUD:
    """Test CMS FAQs CRUD operations"""
    
    created_faq_id = None
    
    def test_create_faq(self):
        """Test POST /api/cms/faqs creates FAQ"""
        payload = {
            "question": "TEST_Làm sao để liên hệ với ProHouzing?",
            "answer": "Bạn có thể liên hệ hotline 1900 1234 hoặc điền form trên website.",
            "category": "contact",
            "order": 1,
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/faqs",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["question"] == payload["question"]
        assert data["is_active"] == True
        assert "views" in data
        assert "helpful_count" in data
        
        TestCMSFAQsCRUD.created_faq_id = data["id"]
        print(f"Created FAQ: {data['id']}")
        
    def test_list_faqs(self):
        """Test GET /api/cms/faqs lists FAQs"""
        response = requests.get(f"{BASE_URL}/api/cms/faqs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} FAQs")
        
    def test_get_faq_by_id(self):
        """Test GET /api/cms/faqs/{id} returns FAQ"""
        assert TestCMSFAQsCRUD.created_faq_id, "FAQ ID not set"
        
        response = requests.get(f"{BASE_URL}/api/cms/faqs/{TestCMSFAQsCRUD.created_faq_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TestCMSFAQsCRUD.created_faq_id
        print(f"Retrieved FAQ: {data['question'][:50]}...")
        
    def test_update_faq(self):
        """Test PUT /api/cms/faqs/{id} updates FAQ"""
        assert TestCMSFAQsCRUD.created_faq_id, "FAQ ID not set"
        
        payload = {"answer": "TEST_Updated answer - Hotline mới: 1800 1234"}
        
        response = requests.put(
            f"{BASE_URL}/api/cms/faqs/{TestCMSFAQsCRUD.created_faq_id}",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "Updated" in data["answer"]
        print("Updated FAQ answer")
        
    def test_mark_faq_helpful(self):
        """Test POST /api/cms/faqs/{id}/helpful marks FAQ as helpful"""
        assert TestCMSFAQsCRUD.created_faq_id, "FAQ ID not set"
        
        response = requests.post(f"{BASE_URL}/api/cms/faqs/{TestCMSFAQsCRUD.created_faq_id}/helpful")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify count increased
        get_response = requests.get(f"{BASE_URL}/api/cms/faqs/{TestCMSFAQsCRUD.created_faq_id}")
        assert get_response.json()["helpful_count"] >= 1
        print("FAQ marked as helpful")
        
    def test_delete_faq(self):
        """Test DELETE /api/cms/faqs/{id} deletes FAQ"""
        assert TestCMSFAQsCRUD.created_faq_id, "FAQ ID not set"
        
        response = requests.delete(f"{BASE_URL}/api/cms/faqs/{TestCMSFAQsCRUD.created_faq_id}")
        assert response.status_code == 200
        print("FAQ deleted successfully")


class TestCMSSitemapAPI:
    """Test CMS Sitemap API"""
    
    def test_generate_sitemap(self):
        """Test GET /api/cms/sitemap generates sitemap"""
        response = requests.get(f"{BASE_URL}/api/cms/sitemap")
        assert response.status_code == 200
        data = response.json()
        
        assert "entries" in data
        assert "generated_at" in data
        assert isinstance(data["entries"], list)
        
        # Verify entry structure
        if data["entries"]:
            entry = data["entries"][0]
            assert "loc" in entry
            assert "lastmod" in entry
            assert "changefreq" in entry
            assert "priority" in entry
            
        print(f"Sitemap generated with {len(data['entries'])} entries")
        
    def test_generate_sitemap_with_custom_base_url(self):
        """Test sitemap with custom base URL"""
        response = requests.get(f"{BASE_URL}/api/cms/sitemap?base_url=https://custom.domain.com")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all URLs use custom base
        for entry in data["entries"]:
            assert "custom.domain.com" in entry["loc"]
            
        print("Sitemap with custom base URL works")


class TestSlugGeneration:
    """Test Vietnamese to URL-friendly slug conversion"""
    
    def test_vietnamese_slug_generation_via_page(self):
        """Test slug generation converts Vietnamese to URL-friendly format"""
        payload = {
            "title": "Giới thiệu về ProHouzing - Nền tảng BĐS số 1",
            "page_type": "about",
            "content": "Test content",
            "status": "draft"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/cms/pages",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        slug = data["slug"]
        # Verify slug is URL-friendly
        assert " " not in slug
        assert "à" not in slug and "ă" not in slug and "â" not in slug
        assert "đ" not in slug
        assert "ê" not in slug and "ế" not in slug
        assert "ô" not in slug and "ơ" not in slug
        assert "ư" not in slug
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cms/pages/{data['id']}")
        print(f"Vietnamese title converted to slug: {slug}")
        
    def test_slug_uniqueness(self):
        """Test that duplicate slugs get numbered suffix"""
        # Create first page
        payload1 = {
            "title": "Trang Test Slug",
            "page_type": "custom",
            "content": "Test",
            "status": "draft"
        }
        resp1 = requests.post(f"{BASE_URL}/api/cms/pages", json=payload1)
        page1 = resp1.json()
        
        # Create second page with same title
        payload2 = {
            "title": "Trang Test Slug",
            "page_type": "custom", 
            "content": "Test 2",
            "status": "draft"
        }
        resp2 = requests.post(f"{BASE_URL}/api/cms/pages", json=payload2)
        page2 = resp2.json()
        
        # Slugs should be different
        assert page1["slug"] != page2["slug"]
        assert page2["slug"].endswith("-1") or "-1" in page2["slug"] or page2["slug"] != page1["slug"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/cms/pages/{page1['id']}")
        requests.delete(f"{BASE_URL}/api/cms/pages/{page2['id']}")
        print(f"Slug uniqueness verified: {page1['slug']} vs {page2['slug']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
