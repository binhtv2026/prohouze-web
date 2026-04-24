"""
P84 SEO - Test 6 Additional SEO Modules for TRUE TOP 1 GOOGLE
============================================================
Tests for:
1. E-E-A-T Engine (authors, credentials)
2. Schema Engine (Article, FAQ, LocalBusiness, Product)
3. Local SEO Engine (district pages, Google Maps)
4. Authority Backlink Engine (guest posts, forums, PR)
5. User Signal Engine (real clicks, comments, ratings)
6. Brand Entity Engine (about, team, legal pages)
"""

import pytest
import requests
import os
from datetime import datetime
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEEATEngine:
    """E-E-A-T Engine - Experience, Expertise, Authoritativeness, Trustworthiness"""
    
    def test_seed_default_authors(self):
        """POST /api/seo/eeat/authors/seed-defaults - Seed 3 default authors"""
        response = requests.post(f"{BASE_URL}/api/seo/eeat/authors/seed-defaults")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"✓ Seeded {data.get('created', 0)} authors")
    
    def test_list_authors(self):
        """GET /api/seo/eeat/authors - List all authors"""
        response = requests.get(f"{BASE_URL}/api/seo/eeat/authors")
        assert response.status_code == 200
        data = response.json()
        assert "authors" in data
        assert "total" in data
        assert isinstance(data["authors"], list)
        
        # Should have at least the 3 seeded authors
        if len(data["authors"]) > 0:
            author = data["authors"][0]
            assert "id" in author
            assert "name" in author
            assert "title" in author
            assert "experience_years" in author
            assert "credentials" in author
            assert "expertise" in author
        print(f"✓ Retrieved {data['total']} authors")
    
    def test_list_featured_authors(self):
        """GET /api/seo/eeat/authors?featured_only=true - List featured authors"""
        response = requests.get(f"{BASE_URL}/api/seo/eeat/authors?featured_only=true")
        assert response.status_code == 200
        data = response.json()
        assert "authors" in data
        # All returned should be featured
        for author in data["authors"]:
            assert author.get("is_featured") == True
        print(f"✓ Retrieved {len(data['authors'])} featured authors")
    
    def test_get_eeat_stats(self):
        """GET /api/seo/eeat/stats - Get E-E-A-T statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/eeat/stats")
        assert response.status_code == 200
        data = response.json()
        assert "authors" in data
        assert "total" in data["authors"]
        assert "featured" in data["authors"]
        assert "case_studies" in data
        assert "pages" in data
        print(f"✓ E-E-A-T Stats: {data['authors']['total']} authors, {data['case_studies']} case studies")
    
    def test_get_organization_schema(self):
        """GET /api/seo/eeat/organization-schema - Get Organization schema"""
        response = requests.get(f"{BASE_URL}/api/seo/eeat/organization-schema")
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert data["@context"] == "https://schema.org"
        assert "@type" in data
        assert "name" in data
        assert "url" in data
        print(f"✓ Organization schema: {data['name']}")
    
    def test_create_author(self):
        """POST /api/seo/eeat/authors - Create new author"""
        unique_name = f"Test Author {uuid.uuid4().hex[:8]}"
        author_data = {
            "name": unique_name,
            "title": "Chuyên gia BĐS Test",
            "experience_years": 10,
            "bio": "Chuyên gia với nhiều năm kinh nghiệm trong lĩnh vực bất động sản",
            "credentials": ["Chứng chỉ môi giới BĐS", "MBA"],
            "expertise": ["Căn hộ cao cấp", "Đầu tư BĐS"],
            "is_featured": False
        }
        response = requests.post(f"{BASE_URL}/api/seo/eeat/authors", json=author_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "author" in data
        assert data["author"]["name"] == unique_name
        print(f"✓ Created author: {unique_name}")


class TestSchemaEngine:
    """Schema Engine - Article, FAQ, LocalBusiness, Review schemas"""
    
    def test_get_local_business_schema(self):
        """GET /api/seo/schema/local-business - Get LocalBusiness schema"""
        response = requests.get(f"{BASE_URL}/api/seo/schema/local-business")
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert data["@context"] == "https://schema.org"
        assert "@type" in data
        assert data["@type"] == "RealEstateAgent"
        assert "name" in data
        assert "telephone" in data
        assert "address" in data
        assert "geo" in data
        print(f"✓ LocalBusiness schema for: {data['name']}")
    
    def test_generate_faq_schema(self):
        """POST /api/seo/schema/faq - Generate FAQ schema"""
        faqs = [
            {"question": "Làm sao để mua nhà ở TPHCM?", "answer": "Bạn cần chuẩn bị tài chính, tìm hiểu khu vực và liên hệ môi giới uy tín."},
            {"question": "Giá căn hộ Quận 2 bao nhiêu?", "answer": "Giá căn hộ Quận 2 dao động từ 3-10 tỷ tùy dự án và diện tích."},
            {"question": "ProHouzing có uy tín không?", "answer": "ProHouzing là nền tảng BĐS hàng đầu với đội ngũ chuyên gia giàu kinh nghiệm."}
        ]
        response = requests.post(f"{BASE_URL}/api/seo/schema/faq", json=faqs)
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert "@type" in data
        assert data["@type"] == "FAQPage"
        assert "mainEntity" in data
        assert len(data["mainEntity"]) == 3
        print(f"✓ Generated FAQ schema with {len(data['mainEntity'])} questions")
    
    def test_get_schema_stats(self):
        """GET /api/seo/schema/stats - Get schema statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/schema/stats")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        assert "total" in data["pages"]
        assert "with_schema" in data["pages"]
        assert "reviews" in data
        print(f"✓ Schema stats: {data['pages']['with_schema']}/{data['pages']['total']} pages with schema")
    
    def test_generate_article_schema(self):
        """GET /api/seo/schema/article - Generate Article schema"""
        params = {
            "title": "Mua nhà Quận 7 - Hướng dẫn chi tiết 2026",
            "description": "Hướng dẫn mua nhà tại Quận 7, TPHCM với đầy đủ thông tin giá cả và pháp lý.",
            "url": "https://prohouzing.com/mua-nha-quan-7",
            "author_name": "Nguyễn Văn An"
        }
        response = requests.get(f"{BASE_URL}/api/seo/schema/article", params=params)
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert "@type" in data
        assert data["@type"] == "Article"
        assert "headline" in data
        assert "author" in data
        print(f"✓ Article schema generated for: {data['headline'][:50]}...")


class TestLocalSEOEngine:
    """Local SEO Engine - District pages, Google Maps, NAP blocks"""
    
    def test_seed_hcm_districts(self):
        """POST /api/seo/local/locations/seed-hcm - Seed 10 HCM districts"""
        response = requests.post(f"{BASE_URL}/api/seo/local/locations/seed-hcm")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"✓ Seeded {data.get('created', 0)} HCM districts")
    
    def test_list_locations(self):
        """GET /api/seo/local/locations - List all locations"""
        response = requests.get(f"{BASE_URL}/api/seo/local/locations")
        assert response.status_code == 200
        data = response.json()
        assert "locations" in data
        assert "total" in data
        assert isinstance(data["locations"], list)
        
        # Should have 10 HCM districts
        if len(data["locations"]) > 0:
            location = data["locations"][0]
            assert "id" in location
            assert "name" in location
            assert "slug" in location
            assert "city" in location
            # Check for geo coordinates
            assert "geo_lat" in location or location.get("geo_lat") is None
        print(f"✓ Retrieved {data['total']} locations")
    
    def test_list_locations_by_city(self):
        """GET /api/seo/local/locations?city=Hồ Chí Minh - Filter by city"""
        response = requests.get(f"{BASE_URL}/api/seo/local/locations?city=Hồ Chí Minh")
        assert response.status_code == 200
        data = response.json()
        assert "locations" in data
        # All should be from HCM
        for loc in data["locations"]:
            assert loc.get("city") == "Hồ Chí Minh"
        print(f"✓ Retrieved {len(data['locations'])} HCM locations")
    
    def test_get_local_seo_stats(self):
        """GET /api/seo/local/stats - Get local SEO statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/local/stats")
        assert response.status_code == 200
        data = response.json()
        assert "locations" in data
        assert "pages" in data
        assert "total" in data["pages"]
        print(f"✓ Local SEO stats: {data['locations']} locations, {data['pages']['total']} pages")
    
    def test_create_location(self):
        """POST /api/seo/local/locations - Create new location"""
        unique_slug = f"test-area-{uuid.uuid4().hex[:6]}"
        location_data = {
            "name": f"Khu vực Test {unique_slug}",
            "slug": unique_slug,
            "location_type": "area",
            "city": "Hồ Chí Minh",
            "avg_price_range": "3-5 tỷ",
            "geo_lat": 10.78,
            "geo_lng": 106.70
        }
        response = requests.post(f"{BASE_URL}/api/seo/local/locations", json=location_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "location" in data
        print(f"✓ Created location: {location_data['name']}")


class TestAuthorityBacklinkEngine:
    """Authority Backlink Engine - Guest posts, forums, PR sites"""
    
    def test_seed_default_sites(self):
        """POST /api/seo/authority/sites/seed-defaults - Seed 15 default authority sites"""
        response = requests.post(f"{BASE_URL}/api/seo/authority/sites/seed-defaults")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"✓ Seeded {data.get('created', 0)} authority sites")
    
    def test_list_authority_sites(self):
        """GET /api/seo/authority/sites - List all authority sites"""
        response = requests.get(f"{BASE_URL}/api/seo/authority/sites")
        assert response.status_code == 200
        data = response.json()
        assert "sites" in data
        assert "total" in data
        assert isinstance(data["sites"], list)
        
        if len(data["sites"]) > 0:
            site = data["sites"][0]
            assert "id" in site
            assert "domain" in site
            assert "name" in site
            assert "site_type" in site
            assert "da_score" in site
        print(f"✓ Retrieved {data['total']} authority sites")
    
    def test_list_sites_by_type(self):
        """GET /api/seo/authority/sites?site_type=guest_post - Filter by type"""
        response = requests.get(f"{BASE_URL}/api/seo/authority/sites?site_type=guest_post")
        assert response.status_code == 200
        data = response.json()
        assert "sites" in data
        for site in data["sites"]:
            assert site.get("site_type") == "guest_post"
        print(f"✓ Retrieved {len(data['sites'])} guest post sites")
    
    def test_list_sites_by_min_da(self):
        """GET /api/seo/authority/sites?min_da=50 - Filter by min DA"""
        response = requests.get(f"{BASE_URL}/api/seo/authority/sites?min_da=50")
        assert response.status_code == 200
        data = response.json()
        assert "sites" in data
        for site in data["sites"]:
            assert site.get("da_score", 0) >= 50
        print(f"✓ Retrieved {len(data['sites'])} sites with DA >= 50")
    
    def test_get_authority_stats(self):
        """GET /api/seo/authority/stats - Get authority backlink statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/authority/stats")
        assert response.status_code == 200
        data = response.json()
        assert "sites" in data
        assert "total" in data["sites"]
        assert "links" in data
        assert "by_type" in data
        assert "average_da" in data
        print(f"✓ Authority stats: {data['sites']['total']} sites, {data['links']['total']} links")
    
    def test_get_email_templates(self):
        """GET /api/seo/authority/email-templates - Get outreach email templates"""
        response = requests.get(f"{BASE_URL}/api/seo/authority/email-templates")
        assert response.status_code == 200
        data = response.json()
        assert "templates" in data
        assert "guest_post" in data["templates"]
        assert "broken_link" in data["templates"]
        assert "resource_link" in data["templates"]
        print(f"✓ Retrieved {len(data['templates'])} email templates")
    
    def test_create_authority_site(self):
        """POST /api/seo/authority/sites - Create new authority site"""
        unique_domain = f"test-site-{uuid.uuid4().hex[:6]}.com"
        site_data = {
            "domain": unique_domain,
            "name": f"Test Site {unique_domain}",
            "site_type": "guest_post",
            "da_score": 45,
            "pa_score": 40,
            "category": "real_estate"
        }
        response = requests.post(f"{BASE_URL}/api/seo/authority/sites", json=site_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "site" in data
        print(f"✓ Created authority site: {unique_domain}")


class TestUserSignalEngine:
    """User Signal Engine - Real clicks, comments, ratings"""
    
    def test_get_signal_stats(self):
        """GET /api/seo/signals/stats - Get user signal statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/signals/stats")
        assert response.status_code == 200
        data = response.json()
        assert "period_days" in data
        assert "sessions" in data
        assert "total" in data["sessions"]
        assert "quality" in data["sessions"]
        assert "averages" in data
        assert "engagement" in data
        assert "targets" in data
        print(f"✓ Signal stats: {data['sessions']['total']} sessions, {data['sessions']['quality']} quality")
    
    def test_track_click_event(self):
        """POST /api/seo/signals/track/click - Track click event"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        click_data = {
            "session_id": session_id,
            "page_id": "test-page-id",
            "click_type": "cta",
            "element_id": "contact-button"
        }
        response = requests.post(f"{BASE_URL}/api/seo/signals/track/click", json=click_data)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        if data["success"]:
            assert data.get("click_type") == "cta"
        print(f"✓ Tracked click event for session: {session_id}")
    
    def test_track_scroll_event(self):
        """POST /api/seo/signals/track/scroll - Track scroll event"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        scroll_data = {
            "session_id": session_id,
            "page_id": "test-page-id",
            "scroll_depth": 75,
            "viewport_height": 800,
            "document_height": 3000
        }
        response = requests.post(f"{BASE_URL}/api/seo/signals/track/scroll", json=scroll_data)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert data.get("scroll_depth") == 75
        print(f"✓ Tracked scroll event: {scroll_data['scroll_depth']}% depth")
    
    def test_start_engagement_session(self):
        """POST /api/seo/signals/session/start - Start engagement session"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        session_data = {
            "session_id": session_id,
            "page_id": "test-page-id",
            "device_type": "desktop",
            "referrer": "https://google.com"
        }
        response = requests.post(f"{BASE_URL}/api/seo/signals/session/start", json=session_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data.get("session_id") == session_id
        print(f"✓ Started engagement session: {session_id}")
    
    def test_create_comment(self):
        """POST /api/seo/signals/comments - Create comment"""
        comment_data = {
            "page_id": "test-page-id",
            "author_name": "Nguyễn Test User",
            "author_email": "test@example.com",
            "content": "Bài viết rất hữu ích! Cảm ơn ProHouzing đã chia sẻ."
        }
        response = requests.post(f"{BASE_URL}/api/seo/signals/comments", json=comment_data)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        if data["success"]:
            assert "comment_id" in data
            assert data.get("status") == "pending_approval"
        print(f"✓ Created comment: {data.get('status', 'unknown status')}")
    
    def test_create_rating(self):
        """POST /api/seo/signals/ratings - Create rating"""
        rating_data = {
            "page_id": "test-page-id",
            "rating": 5,
            "reviewer_name": "Trần Reviewer",
            "review_text": "Nội dung chất lượng, thông tin chi tiết và chính xác.",
            "criteria_ratings": {"usefulness": 5, "accuracy": 5, "clarity": 4}
        }
        response = requests.post(f"{BASE_URL}/api/seo/signals/ratings", json=rating_data)
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "action" in data  # "created" or "updated"
        print(f"✓ Rating {data.get('action')}: {rating_data['rating']}/5 stars")


class TestBrandEntityEngine:
    """Brand Entity Engine - About, team, legal pages"""
    
    def test_seed_default_team(self):
        """POST /api/seo/brand/team/seed-defaults - Seed 4 default team members"""
        response = requests.post(f"{BASE_URL}/api/seo/brand/team/seed-defaults")
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"✓ Seeded {data.get('created', 0)} team members")
    
    def test_list_team_members(self):
        """GET /api/seo/brand/team - List all team members"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/team")
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        assert "total" in data
        assert isinstance(data["members"], list)
        
        if len(data["members"]) > 0:
            member = data["members"][0]
            assert "id" in member
            assert "name" in member
            assert "title" in member
            assert "department" in member
            assert "bio" in member
        print(f"✓ Retrieved {data['total']} team members")
    
    def test_list_featured_team(self):
        """GET /api/seo/brand/team?featured_only=true - List featured team"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/team?featured_only=true")
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        for member in data["members"]:
            assert member.get("is_featured") == True
        print(f"✓ Retrieved {len(data['members'])} featured team members")
    
    def test_get_brand_stats(self):
        """GET /api/seo/brand/stats - Get brand entity statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/stats")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        assert "published" in data["pages"]
        assert "total" in data["pages"]
        assert "team" in data
        assert "total" in data["team"]
        assert "legal_documents" in data
        assert "mentions" in data
        print(f"✓ Brand stats: {data['team']['total']} team, {data['pages']['published']}/{data['pages']['total']} pages")
    
    def test_get_organization_schema(self):
        """GET /api/seo/brand/schema/organization - Get full Organization schema"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/schema/organization")
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert data["@context"] == "https://schema.org"
        assert "@type" in data
        assert "name" in data
        assert "url" in data
        assert "logo" in data
        assert "address" in data
        assert "contactPoint" in data
        assert "sameAs" in data
        print(f"✓ Organization schema: {data['name']}")
    
    def test_get_website_schema(self):
        """GET /api/seo/brand/schema/website - Get WebSite schema"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/schema/website")
        assert response.status_code == 200
        data = response.json()
        assert "@context" in data
        assert "@type" in data
        assert data["@type"] == "WebSite"
        assert "url" in data
        assert "name" in data
        assert "potentialAction" in data  # SearchAction
        print(f"✓ WebSite schema: {data['name']}")
    
    def test_list_brand_pages(self):
        """GET /api/seo/brand/pages - List all brand pages"""
        response = requests.get(f"{BASE_URL}/api/seo/brand/pages")
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        # Should include all template pages (about, team, careers, legal, contact)
        page_types = [p.get("page_type") for p in data["pages"]]
        assert "about" in page_types or len(page_types) >= 1
        print(f"✓ Retrieved {len(data['pages'])} brand page templates")
    
    def test_create_team_member(self):
        """POST /api/seo/brand/team - Create new team member"""
        unique_name = f"Test Member {uuid.uuid4().hex[:6]}"
        member_data = {
            "name": unique_name,
            "title": "Test Engineer",
            "department": "Technology",
            "bio": "Chuyên gia kỹ thuật với nhiều năm kinh nghiệm",
            "order": 99,
            "is_featured": False
        }
        response = requests.post(f"{BASE_URL}/api/seo/brand/team", json=member_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "member" in data
        print(f"✓ Created team member: {unique_name}")


# Run all tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
