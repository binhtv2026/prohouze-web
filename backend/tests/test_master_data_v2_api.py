"""
Test Master Data v2 API - Prompt 3/20 Dynamic Data Foundation
Tests all CRUD operations for categories and items with PostgreSQL backend.

P0 Categories to verify:
- lead_source (14 items)
- lead_status (6 items)
- customer_stage (5 items)
- deal_stage (11 items)
- product_type (10 items)
"""

import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_PREFIX = "/api/v2/master-data"

def random_suffix():
    return ''.join(random.choices(string.ascii_lowercase, k=6))


# ═══════════════════════════════════════════════════════════════════════════════
# CATEGORY API TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMasterDataCategories:
    """Test Category CRUD operations"""
    
    def test_list_categories(self):
        """GET /api/v2/master-data/categories - List all categories"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 14, f"Expected at least 14 categories, got {len(data)}"
        
        # Verify P0 categories exist
        category_codes = [c["category_code"] for c in data]
        p0_categories = ["lead_source", "lead_status", "customer_stage", "deal_stage", "product_type"]
        for p0 in p0_categories:
            assert p0 in category_codes, f"P0 category '{p0}' not found"
        
        print(f"✓ List categories: {len(data)} categories found, all P0 categories present")
    
    def test_list_categories_with_item_count(self):
        """GET /api/v2/master-data/categories?include_items_count=true"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories?include_items_count=true")
        assert response.status_code == 200
        
        data = response.json()
        # Verify item_count is present
        for cat in data:
            assert "item_count" in cat, f"item_count missing for {cat['category_code']}"
        
        # Verify P0 item counts
        p0_counts = {
            "lead_source": 14,
            "lead_status": 6,
            "customer_stage": 5,
            "deal_stage": 11,
            "product_type": 10
        }
        
        for code, expected_count in p0_counts.items():
            cat = next((c for c in data if c["category_code"] == code), None)
            assert cat is not None, f"Category {code} not found"
            assert cat["item_count"] == expected_count, f"{code} expected {expected_count} items, got {cat['item_count']}"
        
        print(f"✓ Categories with item count: All P0 counts verified")
    
    def test_get_category_by_code_deal_stage(self):
        """GET /api/v2/master-data/categories/{code} - Get deal_stage category"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories/deal_stage")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category_code"] == "deal_stage"
        assert data["is_system"] == True
        assert data["enum_class_name"] == "DealStage"
        assert data["module_code"] == "Sales"
        assert "item_count" in data
        assert data["item_count"] == 11
        
        print(f"✓ Get category by code: deal_stage with {data['item_count']} items")
    
    def test_get_category_by_code_lead_source(self):
        """GET /api/v2/master-data/categories/{code} - Get lead_source category"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories/lead_source")
        assert response.status_code == 200
        
        data = response.json()
        assert data["category_code"] == "lead_source"
        assert data["item_count"] == 14
        assert data["module_code"] == "CRM"
        
        print(f"✓ Get category by code: lead_source with {data['item_count']} items")
    
    def test_get_category_not_found(self):
        """GET /api/v2/master-data/categories/{code} - 404 for non-existent"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories/nonexistent_code")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent category returns 404")
    
    def test_create_category(self):
        """POST /api/v2/master-data/categories - Create new category"""
        code = f"test_cat_{random_suffix()}"
        payload = {
            "category_code": code,
            "category_name": "Test Category",
            "category_name_en": "Test Category EN",
            "description": "Test description",
            "scope": "org",
            "module_code": "Test",
            "is_system": False,
            "allow_custom": True,
            "sort_order": 100
        }
        
        response = requests.post(f"{BASE_URL}{API_PREFIX}/categories", json=payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["category_code"] == code
        assert data["category_name"] == "Test Category"
        assert data["status"] == "active"
        assert "id" in data
        
        # Store ID for update test
        self.__class__.test_category_id = data["id"]
        self.__class__.test_category_code = code
        print(f"✓ Created category: {code}")
    
    def test_create_duplicate_category_fails(self):
        """POST /api/v2/master-data/categories - 400 for duplicate"""
        payload = {
            "category_code": "lead_source",  # Already exists
            "category_name": "Duplicate"
        }
        
        response = requests.post(f"{BASE_URL}{API_PREFIX}/categories", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Duplicate category returns 400")
    
    def test_update_category(self):
        """PUT /api/v2/master-data/categories/{id} - Update category"""
        # First create a category to update
        code = f"update_cat_{random_suffix()}"
        create_response = requests.post(f"{BASE_URL}{API_PREFIX}/categories", json={
            "category_code": code,
            "category_name": "Original Name"
        })
        assert create_response.status_code == 201
        cat_id = create_response.json()["id"]
        
        # Update
        update_payload = {
            "category_name": "Updated Name",
            "description": "Updated description",
            "sort_order": 50
        }
        
        response = requests.put(f"{BASE_URL}{API_PREFIX}/categories/{cat_id}", json=update_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["category_name"] == "Updated Name"
        assert data["description"] == "Updated description"
        assert data["sort_order"] == 50
        print(f"✓ Updated category: {cat_id}")


# ═══════════════════════════════════════════════════════════════════════════════
# ITEM API TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMasterDataItems:
    """Test Item CRUD operations"""
    
    def test_list_items_by_category_code_lead_source(self):
        """GET /api/v2/master-data/items?category_code=lead_source"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=lead_source")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 14, f"Expected 14 lead_source items, got {len(data)}"
        
        # Verify some known items
        item_codes = [i["item_code"] for i in data]
        expected_codes = ["website", "facebook", "zalo", "tiktok", "google", "referral"]
        for code in expected_codes:
            assert code in item_codes, f"Item '{code}' not found in lead_source"
        
        print(f"✓ List items: lead_source has {len(data)} items")
    
    def test_list_items_by_category_code_deal_stage(self):
        """GET /api/v2/master-data/items?category_code=deal_stage"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=deal_stage")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 11, f"Expected 11 deal_stage items, got {len(data)}"
        
        # Verify deal stage items
        item_codes = [i["item_code"] for i in data]
        expected = ["new", "qualified", "viewing", "proposal", "negotiation", 
                    "booking", "deposit", "contract", "won", "lost", "cancelled"]
        for code in expected:
            assert code in item_codes, f"Deal stage '{code}' not found"
        
        print(f"✓ List items: deal_stage has {len(data)} items")
    
    def test_list_items_by_category_code_lead_status(self):
        """GET /api/v2/master-data/items?category_code=lead_status"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=lead_status")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 6, f"Expected 6 lead_status items, got {len(data)}"
        
        item_codes = [i["item_code"] for i in data]
        expected = ["new", "contacted", "qualified", "converted", "lost", "invalid"]
        for code in expected:
            assert code in item_codes, f"Lead status '{code}' not found"
        
        print(f"✓ List items: lead_status has {len(data)} items")
    
    def test_list_items_by_category_code_customer_stage(self):
        """GET /api/v2/master-data/items?category_code=customer_stage"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=customer_stage")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 5, f"Expected 5 customer_stage items, got {len(data)}"
        
        item_codes = [i["item_code"] for i in data]
        expected = ["lead", "prospect", "customer", "vip", "churned"]
        for code in expected:
            assert code in item_codes, f"Customer stage '{code}' not found"
        
        print(f"✓ List items: customer_stage has {len(data)} items")
    
    def test_list_items_by_category_code_product_type(self):
        """GET /api/v2/master-data/items?category_code=product_type"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=product_type")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 10, f"Expected 10 product_type items, got {len(data)}"
        
        print(f"✓ List items: product_type has {len(data)} items")
    
    def test_get_item_by_id(self):
        """GET /api/v2/master-data/items/{id} - Get item by ID"""
        # First get an item ID
        list_response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=lead_source")
        items = list_response.json()
        assert len(items) > 0
        
        item_id = items[0]["id"]
        
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/{item_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == item_id
        assert "item_code" in data
        assert "item_label" in data
        
        print(f"✓ Get item by ID: {item_id}")
    
    def test_get_item_by_codes_deal_stage_won(self):
        """GET /api/v2/master-data/items/code/{category_code}/{item_code}"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/code/deal_stage/won")
        assert response.status_code == 200
        
        data = response.json()
        assert data["item_code"] == "won"
        assert data["item_label"] == "Won"
        assert data["item_label_vi"] == "Thành công"
        assert data["color_code"] == "#22C55E"
        assert data["is_system"] == True
        assert data["enum_value"] is not None
        
        print(f"✓ Get item by codes: deal_stage/won verified with enum_value")
    
    def test_get_item_by_codes_lead_source_facebook(self):
        """GET /api/v2/master-data/items/code/lead_source/facebook"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/code/lead_source/facebook")
        assert response.status_code == 200
        
        data = response.json()
        assert data["item_code"] == "facebook"
        assert data["color_code"] == "#1877F2"
        assert data["is_system"] == True
        
        print(f"✓ Get item by codes: lead_source/facebook verified")
    
    def test_get_item_by_codes_not_found(self):
        """GET /api/v2/master-data/items/code/{category_code}/{item_code} - 404"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/code/deal_stage/nonexistent")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent item returns 404")
    
    def test_create_item_by_code(self):
        """POST /api/v2/master-data/items/by-code - Create item by category code"""
        item_code = f"test_item_{random_suffix()}"
        payload = {
            "category_code": "lost_reason",  # lost_reason allows custom items
            "item_code": item_code,
            "item_label": "Test Lost Reason",
            "item_label_vi": "Lý do test",
            "color_code": "#FF5733",
            "icon_code": "test-icon",
            "sort_order": 100
        }
        
        response = requests.post(f"{BASE_URL}{API_PREFIX}/items/by-code", json=payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["item_code"] == item_code
        assert data["item_label"] == "Test Lost Reason"
        assert data["is_system"] == False  # User-created items are not system
        
        # Store for later tests
        self.__class__.test_item_id = data["id"]
        self.__class__.test_item_code = item_code
        print(f"✓ Created item by code: {item_code}")
    
    def test_update_item(self):
        """PUT /api/v2/master-data/items/{id} - Update item"""
        # First create item to update
        item_code = f"update_item_{random_suffix()}"
        create_response = requests.post(f"{BASE_URL}{API_PREFIX}/items/by-code", json={
            "category_code": "cancel_reason",
            "item_code": item_code,
            "item_label": "Original Label"
        })
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Update
        update_payload = {
            "item_label": "Updated Label",
            "item_label_vi": "Nhãn cập nhật",
            "color_code": "#00FF00",
            "sort_order": 50
        }
        
        response = requests.put(f"{BASE_URL}{API_PREFIX}/items/{item_id}", json=update_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["item_label"] == "Updated Label"
        assert data["item_label_vi"] == "Nhãn cập nhật"
        assert data["color_code"] == "#00FF00"
        
        print(f"✓ Updated item: {item_id}")
    
    def test_delete_custom_item(self):
        """DELETE /api/v2/master-data/items/{id} - Delete custom item"""
        # Create item to delete
        item_code = f"delete_item_{random_suffix()}"
        create_response = requests.post(f"{BASE_URL}{API_PREFIX}/items/by-code", json={
            "category_code": "cancel_reason",
            "item_code": item_code,
            "item_label": "To Delete"
        })
        assert create_response.status_code == 201
        item_id = create_response.json()["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}{API_PREFIX}/items/{item_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        
        # Verify item is deleted
        get_response = requests.get(f"{BASE_URL}{API_PREFIX}/items/{item_id}")
        assert get_response.status_code == 404
        
        print(f"✓ Deleted custom item: {item_id}")
    
    def test_delete_system_item_fails(self):
        """DELETE /api/v2/master-data/items/{id} - Should fail for system items"""
        # Get a system item (lead_source/facebook)
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/code/lead_source/facebook")
        assert response.status_code == 200
        system_item_id = response.json()["id"]
        
        # Try to delete
        delete_response = requests.delete(f"{BASE_URL}{API_PREFIX}/items/{system_item_id}")
        assert delete_response.status_code == 400, f"Expected 400 for system item delete, got {delete_response.status_code}"
        
        # Verify error message
        error_data = delete_response.json()
        assert "system" in error_data.get("detail", "").lower()
        
        print(f"✓ System item delete correctly rejected")


# ═══════════════════════════════════════════════════════════════════════════════
# LOOKUP API TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMasterDataLookup:
    """Test lookup endpoints for frontend dropdowns"""
    
    def test_lookup_lead_source(self):
        """GET /api/v2/master-data/lookup/lead_source"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/lookup/lead_source")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 14
        
        # Verify lookup response structure
        for item in data:
            assert "code" in item
            assert "label" in item
            assert "label_vi" in item or item.get("label_vi") is None
        
        # Verify specific item
        facebook = next((i for i in data if i["code"] == "facebook"), None)
        assert facebook is not None
        assert facebook["label"] == "Facebook"
        assert facebook["color"] == "#1877F2"
        
        print(f"✓ Lookup lead_source: {len(data)} items")
    
    def test_lookup_deal_stage(self):
        """GET /api/v2/master-data/lookup/deal_stage"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/lookup/deal_stage")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 11
        
        # Verify default item
        new_stage = next((i for i in data if i["code"] == "new"), None)
        assert new_stage is not None
        assert new_stage["is_default"] == True
        
        # Verify won stage
        won_stage = next((i for i in data if i["code"] == "won"), None)
        assert won_stage is not None
        assert won_stage["color"] == "#22C55E"
        
        print(f"✓ Lookup deal_stage: {len(data)} items with default=new")
    
    def test_lookup_nonexistent_category(self):
        """GET /api/v2/master-data/lookup/nonexistent - 404"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/lookup/nonexistent_category")
        assert response.status_code == 404
        print(f"✓ Lookup non-existent category returns 404")


# ═══════════════════════════════════════════════════════════════════════════════
# STATISTICS API TEST
# ═══════════════════════════════════════════════════════════════════════════════

class TestMasterDataStats:
    """Test statistics endpoint"""
    
    def test_get_stats(self):
        """GET /api/v2/master-data/stats"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert "items" in data
        assert "categories_by_module" in data
        
        assert data["categories"] >= 14
        assert data["items"] >= 95
        
        # Verify modules
        modules = data["categories_by_module"]
        assert "CRM" in modules
        assert "Sales" in modules
        assert "Inventory" in modules
        
        print(f"✓ Stats: {data['categories']} categories, {data['items']} items")


# ═══════════════════════════════════════════════════════════════════════════════
# ENUM VALUE BACKWARD COMPATIBILITY TEST
# ═══════════════════════════════════════════════════════════════════════════════

class TestEnumValueMapping:
    """Test enum_value mapping for backward compatibility"""
    
    def test_deal_stage_enum_values(self):
        """Verify enum_value is set for deal_stage items"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=deal_stage")
        assert response.status_code == 200
        
        items = response.json()
        for item in items:
            assert "enum_value" in item, f"enum_value missing for {item['item_code']}"
            # enum_value should be set for system items
            if item["is_system"]:
                assert item["enum_value"] is not None, f"enum_value is None for system item {item['item_code']}"
        
        print(f"✓ Enum values verified for deal_stage items")
    
    def test_lead_source_enum_values(self):
        """Verify enum_value is set for lead_source items"""
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items?category_code=lead_source")
        assert response.status_code == 200
        
        items = response.json()
        for item in items:
            if item["is_system"]:
                assert item["enum_value"] is not None
        
        print(f"✓ Enum values verified for lead_source items")


# ═══════════════════════════════════════════════════════════════════════════════
# SYSTEM PROTECTION TEST
# ═══════════════════════════════════════════════════════════════════════════════

class TestSystemProtection:
    """Test system category/item protection"""
    
    def test_cannot_deactivate_system_category(self):
        """PUT /api/v2/master-data/categories/{id} - Cannot deactivate system category"""
        # Get lead_source category (is_system=True)
        response = requests.get(f"{BASE_URL}{API_PREFIX}/categories/lead_source")
        assert response.status_code == 200
        cat_id = response.json()["id"]
        
        # Try to deactivate
        update_response = requests.put(f"{BASE_URL}{API_PREFIX}/categories/{cat_id}", 
                                        json={"status": "inactive"})
        assert update_response.status_code == 400, f"Expected 400, got {update_response.status_code}"
        
        print(f"✓ System category deactivation correctly rejected")
    
    def test_cannot_delete_system_item(self):
        """DELETE /api/v2/master-data/items/{id} - Cannot delete system item"""
        # Get a system item
        response = requests.get(f"{BASE_URL}{API_PREFIX}/items/code/deal_stage/new")
        assert response.status_code == 200
        item_id = response.json()["id"]
        
        # Try to delete
        delete_response = requests.delete(f"{BASE_URL}{API_PREFIX}/items/{item_id}")
        assert delete_response.status_code == 400, f"Expected 400, got {delete_response.status_code}"
        
        print(f"✓ System item deletion correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
