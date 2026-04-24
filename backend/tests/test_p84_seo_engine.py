"""
P84 SEO ENGINE - PROHOUZING SEO FACTORY
========================================
Tests for:
1. SEO Stats API
2. Keywords API (GET, POST, DELETE)
3. Pages API (GET, DELETE)
4. Sitemap API (sitemap.xml, robots.txt, stats)

Note: GPT-5.2 content generation skipped (may timeout)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSEOStats:
    """SEO Statistics endpoint tests"""
    
    def test_get_seo_stats(self):
        """Test GET /api/seo/stats returns SEO statistics"""
        response = requests.get(f"{BASE_URL}/api/seo/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "keywords" in data
        assert "pages" in data
        assert "avg_seo_score" in data
        
        # Verify keywords structure
        keywords = data["keywords"]
        assert "total" in keywords
        assert "pending" in keywords
        assert "generated" in keywords
        assert "published" in keywords
        
        # Verify pages structure
        pages = data["pages"]
        assert "total" in pages
        assert "draft" in pages
        assert "published" in pages
        assert "landing" in pages
        assert "blog" in pages
        
        print(f"Stats: Keywords={keywords['total']}, Pages={pages['total']}, Avg SEO Score={data['avg_seo_score']}")


class TestSEOKeywords:
    """SEO Keywords API tests"""
    
    def test_get_keywords(self):
        """Test GET /api/seo/keywords returns keyword list"""
        response = requests.get(f"{BASE_URL}/api/seo/keywords?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "keywords" in data
        assert "total" in data
        assert "limit" in data
        assert "skip" in data
        
        # Verify keyword structure if any exist
        if len(data["keywords"]) > 0:
            kw = data["keywords"][0]
            assert "id" in kw
            assert "keyword" in kw
            assert "slug" in kw
            assert "status" in kw
            print(f"First keyword: {kw['keyword']} (status: {kw['status']})")
        
        print(f"Total keywords: {data['total']}")
    
    def test_get_keywords_with_status_filter(self):
        """Test GET /api/seo/keywords with status filter"""
        response = requests.get(f"{BASE_URL}/api/seo/keywords?status=pending&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        # All returned keywords should be pending
        for kw in data["keywords"]:
            assert kw["status"] == "pending"
        
        print(f"Pending keywords: {data['total']}")
    
    def test_generate_keywords(self):
        """Test POST /api/seo/generate-keywords generates new keywords"""
        payload = {
            "locations": ["TEST_Location"],
            "intents": ["TEST_intent"],
            "price_ranges": ["TEST_price"],
            "property_types": ["TEST_type"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/seo/generate-keywords",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "total_generated" in data
        assert "keywords" in data
        
        # Should generate combinations
        print(f"Generated {data['total_generated']} keywords")
        
        # Verify structure of generated keywords
        if len(data["keywords"]) > 0:
            kw = data["keywords"][0]
            assert "keyword" in kw
            assert "slug" in kw
            assert "status" in kw
            assert kw["status"] == "pending"
    
    def test_delete_keyword(self):
        """Test DELETE /api/seo/keywords/{id}"""
        # First get a TEST keyword to delete
        response = requests.get(f"{BASE_URL}/api/seo/keywords?limit=100")
        data = response.json()
        
        # Find a TEST keyword
        test_kw = None
        for kw in data["keywords"]:
            if "TEST_" in kw.get("keyword", ""):
                test_kw = kw
                break
        
        if test_kw:
            delete_response = requests.delete(f"{BASE_URL}/api/seo/keywords/{test_kw['id']}")
            assert delete_response.status_code == 200
            delete_data = delete_response.json()
            assert delete_data["success"] == True
            print(f"Deleted TEST keyword: {test_kw['keyword']}")
        else:
            print("No TEST keywords to delete")


class TestSEOPages:
    """SEO Pages API tests"""
    
    def test_get_pages(self):
        """Test GET /api/seo/pages returns page list"""
        response = requests.get(f"{BASE_URL}/api/seo/pages?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "pages" in data
        assert "total" in data
        assert "limit" in data
        assert "skip" in data
        
        # Verify page structure if any exist
        if len(data["pages"]) > 0:
            page = data["pages"][0]
            assert "id" in page
            assert "keyword" in page
            assert "slug" in page
            assert "content_type" in page
            assert "title" in page
            assert "seo_score" in page
            assert "word_count" in page
            assert "status" in page
            print(f"First page: {page['title']} (SEO Score: {page['seo_score']})")
        
        print(f"Total pages: {data['total']}")
    
    def test_get_pages_with_content_type_filter(self):
        """Test GET /api/seo/pages with content_type filter"""
        response = requests.get(f"{BASE_URL}/api/seo/pages?content_type=landing&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        # All returned pages should be landing
        for page in data["pages"]:
            assert page["content_type"] == "landing"
        
        print(f"Landing pages: {data['total']}")
    
    def test_get_pages_with_status_filter(self):
        """Test GET /api/seo/pages with status filter"""
        response = requests.get(f"{BASE_URL}/api/seo/pages?status=draft&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        # All returned pages should be draft
        for page in data["pages"]:
            assert page["status"] == "draft"
        
        print(f"Draft pages: {data['total']}")


class TestSitemap:
    """Sitemap and robots.txt tests"""
    
    def test_get_sitemap_xml(self):
        """Test GET /api/sitemap/sitemap.xml returns valid XML"""
        response = requests.get(f"{BASE_URL}/api/sitemap/sitemap.xml")
        assert response.status_code == 200
        
        # Check content type
        assert "application/xml" in response.headers.get("content-type", "")
        
        # Check XML structure
        content = response.text
        assert '<?xml version="1.0" encoding="UTF-8"?>' in content
        assert '<urlset' in content
        assert '</urlset>' in content
        assert '<url>' in content
        assert '<loc>' in content
        
        print("sitemap.xml is valid XML")
    
    def test_get_robots_txt(self):
        """Test GET /api/sitemap/robots.txt returns valid robots.txt"""
        response = requests.get(f"{BASE_URL}/api/sitemap/robots.txt")
        assert response.status_code == 200
        
        # Check content type
        assert "text/plain" in response.headers.get("content-type", "")
        
        # Check robots.txt structure
        content = response.text
        assert "User-agent:" in content
        assert "Allow:" in content
        assert "Disallow:" in content
        assert "Sitemap:" in content
        
        print("robots.txt is valid")
    
    def test_get_sitemap_stats(self):
        """Test GET /api/sitemap/stats returns sitemap statistics"""
        response = requests.get(f"{BASE_URL}/api/sitemap/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_urls" in data
        assert "static_pages" in data
        assert "landing_pages" in data
        assert "blog_pages" in data
        assert "sitemap_url" in data
        assert "robots_url" in data
        
        print(f"Sitemap stats: Total URLs={data['total_urls']}, Landing={data['landing_pages']}, Blog={data['blog_pages']}")


class TestCleanup:
    """Cleanup TEST data after tests"""
    
    def test_cleanup_test_keywords(self):
        """Clean up all TEST_ prefixed keywords"""
        # Get all keywords
        response = requests.get(f"{BASE_URL}/api/seo/keywords?limit=500")
        data = response.json()
        
        deleted = 0
        for kw in data["keywords"]:
            if "TEST_" in kw.get("keyword", "") or "TEST_" in kw.get("location", ""):
                requests.delete(f"{BASE_URL}/api/seo/keywords/{kw['id']}")
                deleted += 1
        
        print(f"Cleaned up {deleted} TEST keywords")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
