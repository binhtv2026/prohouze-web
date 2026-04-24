"""
ProHouzing Inventory API Tests
Prompt 5/20 - Project/Product/Inventory Domain Standardization

Tests for:
- Config endpoints (statuses, product types, directions, views)
- Project CRUD
- Product CRUD and search
- Status management and transitions
- Hold/release operations
- Status history
- Inventory summary
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

# Use environment variable for backend URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://content-machine-18.preview.emergentagent.com"

# Test credentials
TEST_EMAIL = "admin@prohouzing.vn"
TEST_PASSWORD = "admin123"


class TestSession:
    """Shared session with auth token"""
    session = None
    token = None
    
    @classmethod
    def get_session(cls):
        if cls.session is None:
            cls.session = requests.Session()
            cls.session.headers.update({"Content-Type": "application/json"})
        return cls.session
    
    @classmethod
    def get_auth_token(cls):
        if cls.token is None:
            session = cls.get_session()
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                cls.token = response.json().get("access_token")
                session.headers.update({"Authorization": f"Bearer {cls.token}"})
            else:
                pytest.skip(f"Authentication failed: {response.status_code}")
        return cls.token


@pytest.fixture(scope="module")
def api_client():
    """Get authenticated session"""
    session = TestSession.get_session()
    TestSession.get_auth_token()
    return session


# ============================================
# CONFIG ENDPOINTS TESTS
# ============================================

class TestConfigEndpoints:
    """Tests for inventory config endpoints"""
    
    def test_get_inventory_statuses(self, api_client):
        """GET /api/inventory/config/statuses - Should return 10 inventory statuses"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/statuses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "statuses" in data
        statuses = data["statuses"]
        
        # Should have 10 statuses
        assert len(statuses) == 10, f"Expected 10 statuses, got {len(statuses)}"
        
        # Check required status codes
        status_codes = [s["code"] for s in statuses]
        expected_codes = [
            "not_for_sale", "available", "hold", "booking_pending", "booked",
            "reserved", "deposited", "contract_signing", "sold", "blocked"
        ]
        for code in expected_codes:
            assert code in status_codes, f"Missing status: {code}"
        
        # Check status structure
        for status in statuses:
            assert "code" in status
            assert "name" in status
            assert "color" in status
            print(f"  Status: {status['code']} - {status['name']}")
    
    def test_get_product_types(self, api_client):
        """GET /api/inventory/config/product-types - Should return 9 product types"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/product-types")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "types" in data
        types = data["types"]
        
        # Should have 9 product types
        assert len(types) == 9, f"Expected 9 product types, got {len(types)}"
        
        # Check required type codes
        type_codes = [t["code"] for t in types]
        expected_types = [
            "apartment", "villa", "townhouse", "shophouse", "duplex",
            "penthouse", "land", "office", "retail"
        ]
        for code in expected_types:
            assert code in type_codes, f"Missing product type: {code}"
        
        print(f"  Found {len(types)} product types")
    
    def test_get_directions(self, api_client):
        """GET /api/inventory/config/directions - Should return direction options"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/directions")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "directions" in data
        directions = data["directions"]
        
        # Should have 8 directions (cardinal + intercardinal)
        assert len(directions) == 8, f"Expected 8 directions, got {len(directions)}"
        
        direction_codes = [d["code"] for d in directions]
        assert "east" in direction_codes
        assert "west" in direction_codes
        assert "northeast" in direction_codes
        print(f"  Found {len(directions)} directions")
    
    def test_get_views(self, api_client):
        """GET /api/inventory/config/views - Should return view options"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/views")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "views" in data
        views = data["views"]
        
        # Should have view options
        assert len(views) >= 5, f"Expected at least 5 views, got {len(views)}"
        
        view_codes = [v["code"] for v in views]
        assert "city" in view_codes
        assert "river" in view_codes or "sea" in view_codes
        print(f"  Found {len(views)} view options")
    
    def test_get_project_statuses(self, api_client):
        """GET /api/inventory/config/project-statuses - Should return project status options"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/project-statuses")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "statuses" in data
        statuses = data["statuses"]
        
        status_codes = [s["code"] for s in statuses]
        assert "upcoming" in status_codes
        assert "selling" in status_codes
        print(f"  Found {len(statuses)} project statuses")
    
    def test_get_saved_views(self, api_client):
        """GET /api/inventory/config/saved-views - Should return default saved views"""
        response = api_client.get(f"{BASE_URL}/api/inventory/config/saved-views")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "views" in data
        print(f"  Found {len(data['views'])} saved views")


# ============================================
# PROJECT ENDPOINTS TESTS
# ============================================

class TestProjectEndpoints:
    """Tests for project CRUD endpoints"""
    
    created_project_id = None
    
    def test_create_project(self, api_client):
        """POST /api/inventory/projects - Create a new project"""
        unique_code = f"TEST_PRJ_{uuid.uuid4().hex[:8].upper()}"
        
        project_data = {
            "data": {
                "code": unique_code,
                "name": f"Test Project {unique_code}",
                "address": "123 Test Street, District 1",
                "district": "Quận 1",
                "city": "Hồ Chí Minh",
                "developer_name": "Test Developer Corp",
                "project_type": "residential",
                "status": "upcoming"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/projects", json=project_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"] == unique_code
        assert data["name"] == project_data["data"]["name"]
        
        TestProjectEndpoints.created_project_id = data["id"]
        print(f"  Created project: {data['id']}")
    
    def test_get_projects(self, api_client):
        """GET /api/inventory/projects - Get project list"""
        response = api_client.get(f"{BASE_URL}/api/inventory/projects")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should return a list
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"  Found {len(data)} projects")
    
    def test_get_project_by_id(self, api_client):
        """GET /api/inventory/projects/{id} - Get project by ID"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project created")
        
        project_id = TestProjectEndpoints.created_project_id
        response = api_client.get(f"{BASE_URL}/api/inventory/projects/{project_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == project_id
        print(f"  Retrieved project: {data['name']}")
    
    def test_get_project_not_found(self, api_client):
        """GET /api/inventory/projects/{id} - Non-existent project returns 404"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/inventory/projects/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("  404 returned for non-existent project")


# ============================================
# PRODUCT ENDPOINTS TESTS
# ============================================

class TestProductEndpoints:
    """Tests for product CRUD and search endpoints"""
    
    created_product_id = None
    
    def test_create_product(self, api_client):
        """POST /api/inventory/products - Create a new product"""
        # Ensure we have a project
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        unique_code = f"TEST_UNIT_{uuid.uuid4().hex[:6].upper()}"
        
        product_data = {
            "data": {
                "project_id": TestProjectEndpoints.created_project_id,
                "code": unique_code,
                "name": f"Unit {unique_code}",
                "product_type": "apartment",
                "area": 75.5,
                "bedrooms": 2,
                "bathrooms": 2,
                "direction": "east",
                "view": "city",
                "base_price": 3500000000,
                "price_per_sqm": 46357615,
                "inventory_status": "available"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products", json=product_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"] == unique_code
        assert data["inventory_status"] == "available"
        
        TestProductEndpoints.created_product_id = data["id"]
        print(f"  Created product: {data['id']}")
    
    def test_search_products(self, api_client):
        """GET /api/inventory/products - Search products with filters"""
        response = api_client.get(f"{BASE_URL}/api/inventory/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total" in data
        assert "items" in data
        assert "by_status" in data
        assert "by_type" in data
        
        print(f"  Found {data['total']} products")
        print(f"  By status: {data['by_status']}")
    
    def test_search_products_with_filters(self, api_client):
        """GET /api/inventory/products - Search with status filter"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        params = {
            "project_id": TestProjectEndpoints.created_project_id,
            "inventory_statuses": "available"
        }
        response = api_client.get(f"{BASE_URL}/api/inventory/products", params=params)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # All returned items should have available status
        for item in data.get("items", []):
            assert item["inventory_status"] == "available", f"Expected available, got {item['inventory_status']}"
        
        print(f"  Found {data['total']} available products in project")
    
    def test_get_product_by_id(self, api_client):
        """GET /api/inventory/products/{id} - Get product by ID"""
        if not TestProductEndpoints.created_product_id:
            pytest.skip("No product created")
        
        product_id = TestProductEndpoints.created_product_id
        response = api_client.get(f"{BASE_URL}/api/inventory/products/{product_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == product_id
        assert "status_label" in data
        assert "status_color" in data
        print(f"  Retrieved product: {data['code']} - {data.get('status_label', 'N/A')}")
    
    def test_get_product_not_found(self, api_client):
        """GET /api/inventory/products/{id} - Non-existent product returns 404"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/inventory/products/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


# ============================================
# STATUS MANAGEMENT TESTS
# ============================================

class TestStatusManagement:
    """Tests for status transitions and history"""
    
    def test_change_product_status(self, api_client):
        """POST /api/inventory/products/{id}/status - Change product status"""
        if not TestProductEndpoints.created_product_id:
            pytest.skip("No product available")
        
        product_id = TestProductEndpoints.created_product_id
        
        # Change from available to hold
        status_data = {
            "data": {
                "product_id": product_id,
                "new_status": "hold",
                "reason": "Testing status change",
                "hold_hours": 24
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/status", json=status_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("new_status") == "hold"
        print(f"  Status changed: {data.get('old_status')} -> {data.get('new_status')}")
    
    def test_invalid_status_transition(self, api_client):
        """POST /api/inventory/products/{id}/status - Invalid transition should fail"""
        if not TestProductEndpoints.created_product_id:
            pytest.skip("No product available")
        
        product_id = TestProductEndpoints.created_product_id
        
        # Try invalid transition: hold -> sold (not allowed directly)
        status_data = {
            "data": {
                "product_id": product_id,
                "new_status": "sold",
                "reason": "Testing invalid transition"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/status", json=status_data)
        
        # Should return 400 for invalid transition
        assert response.status_code == 400, f"Expected 400 for invalid transition, got {response.status_code}"
        print("  Invalid transition correctly rejected")
    
    def test_get_status_history(self, api_client):
        """GET /api/inventory/products/{id}/status-history - Get status change history"""
        if not TestProductEndpoints.created_product_id:
            pytest.skip("No product available")
        
        product_id = TestProductEndpoints.created_product_id
        response = api_client.get(f"{BASE_URL}/api/inventory/products/{product_id}/status-history")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "history" in data
        history = data["history"]
        
        # Should have at least 2 entries (creation + status change)
        assert len(history) >= 2, f"Expected at least 2 history entries, got {len(history)}"
        
        # Check history structure
        for entry in history:
            assert "old_status" in entry or entry.get("old_status") is None
            assert "new_status" in entry
            assert "changed_at" in entry
        
        print(f"  Found {len(history)} status history entries")


# ============================================
# HOLD OPERATIONS TESTS
# ============================================

class TestHoldOperations:
    """Tests for hold and release operations"""
    
    hold_test_product_id = None
    
    def test_create_product_for_hold(self, api_client):
        """Create a product specifically for hold testing"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        unique_code = f"TEST_HOLD_{uuid.uuid4().hex[:6].upper()}"
        
        product_data = {
            "data": {
                "project_id": TestProjectEndpoints.created_project_id,
                "code": unique_code,
                "name": f"Hold Test Unit {unique_code}",
                "product_type": "apartment",
                "area": 65.0,
                "bedrooms": 2,
                "base_price": 3000000000,
                "inventory_status": "available"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products", json=product_data)
        assert response.status_code == 200
        
        data = response.json()
        TestHoldOperations.hold_test_product_id = data["id"]
        print(f"  Created product for hold test: {data['id']}")
    
    def test_hold_product(self, api_client):
        """POST /api/inventory/products/{id}/hold - Hold a product"""
        if not TestHoldOperations.hold_test_product_id:
            pytest.skip("No product available for hold test")
        
        product_id = TestHoldOperations.hold_test_product_id
        
        hold_data = {
            "data": {
                "product_id": product_id,
                "hold_hours": 24,
                "reason": "Customer interested",
                "customer_name": "Test Customer",
                "customer_phone": "0901234567"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/hold", json=hold_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "hold_started_at" in data
        assert "hold_expires_at" in data
        assert data.get("product_id") == product_id
        
        print(f"  Product held until: {data.get('hold_expires_at')}")
    
    def test_hold_already_held_product(self, api_client):
        """POST /api/inventory/products/{id}/hold - Cannot hold already held product"""
        if not TestHoldOperations.hold_test_product_id:
            pytest.skip("No product available")
        
        product_id = TestHoldOperations.hold_test_product_id
        
        hold_data = {
            "data": {
                "product_id": product_id,
                "hold_hours": 12,
                "reason": "Second attempt"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/hold", json=hold_data)
        
        # Should fail because product is already on hold
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("  Cannot hold already held product - correct behavior")
    
    def test_release_hold(self, api_client):
        """POST /api/inventory/products/{id}/release-hold - Release product hold"""
        if not TestHoldOperations.hold_test_product_id:
            pytest.skip("No product available")
        
        product_id = TestHoldOperations.hold_test_product_id
        
        release_data = {
            "data": {
                "product_id": product_id,
                "reason": "Customer declined"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/release-hold", json=release_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        # Verify product is back to available
        verify_response = api_client.get(f"{BASE_URL}/api/inventory/products/{product_id}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["inventory_status"] == "available"
        
        print("  Hold released successfully, product is available again")
    
    def test_release_non_held_product(self, api_client):
        """POST /api/inventory/products/{id}/release-hold - Cannot release non-held product"""
        if not TestHoldOperations.hold_test_product_id:
            pytest.skip("No product available")
        
        product_id = TestHoldOperations.hold_test_product_id
        
        release_data = {
            "data": {
                "product_id": product_id,
                "reason": "Testing"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/products/{product_id}/release-hold", json=release_data)
        
        # Should fail because product is not on hold
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("  Cannot release non-held product - correct behavior")


# ============================================
# PROJECT INVENTORY SUMMARY TESTS
# ============================================

class TestInventorySummary:
    """Tests for inventory summary endpoints"""
    
    def test_get_project_summary(self, api_client):
        """GET /api/inventory/projects/{id}/summary - Get project inventory summary"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        project_id = TestProjectEndpoints.created_project_id
        response = api_client.get(f"{BASE_URL}/api/inventory/projects/{project_id}/summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_units" in data
        assert "by_status" in data
        assert "by_type" in data
        assert "available_count" in data
        assert "sold_count" in data
        assert "hold_count" in data
        
        print(f"  Project summary: {data['total_units']} total units")
        print(f"    Available: {data['available_count']}, Sold: {data['sold_count']}, Hold: {data['hold_count']}")


# ============================================
# BLOCK AND FLOOR TESTS
# ============================================

class TestBlockAndFloor:
    """Tests for block/tower and floor management"""
    
    created_block_id = None
    
    def test_create_block(self, api_client):
        """POST /api/inventory/projects/{project_id}/blocks - Create a block"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        project_id = TestProjectEndpoints.created_project_id
        unique_code = f"BLK_{uuid.uuid4().hex[:4].upper()}"
        
        block_data = {
            "data": {
                "project_id": project_id,
                "code": unique_code,
                "name": f"Block {unique_code}",
                "total_floors": 25,
                "basement_floors": 2,
                "units_per_floor": 8
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/projects/{project_id}/blocks", json=block_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"] == unique_code
        
        TestBlockAndFloor.created_block_id = data["id"]
        print(f"  Created block: {data['id']}")
    
    def test_get_project_blocks(self, api_client):
        """GET /api/inventory/projects/{project_id}/blocks - Get project blocks"""
        if not TestProjectEndpoints.created_project_id:
            pytest.skip("No project available")
        
        project_id = TestProjectEndpoints.created_project_id
        response = api_client.get(f"{BASE_URL}/api/inventory/projects/{project_id}/blocks")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"  Found {len(data)} blocks")
    
    def test_create_floor(self, api_client):
        """POST /api/inventory/blocks/{block_id}/floors - Create a floor"""
        if not TestBlockAndFloor.created_block_id:
            pytest.skip("No block available")
        
        block_id = TestBlockAndFloor.created_block_id
        
        floor_data = {
            "data": {
                "project_id": TestProjectEndpoints.created_project_id,
                "block_id": block_id,
                "floor_number": 10,
                "floor_name": "Tầng 10",
                "total_units": 8,
                "floor_type": "residential"
            }
        }
        
        response = api_client.post(f"{BASE_URL}/api/inventory/blocks/{block_id}/floors", json=floor_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["floor_number"] == 10
        print(f"  Created floor: {data['floor_name']}")
    
    def test_get_block_floors(self, api_client):
        """GET /api/inventory/blocks/{block_id}/floors - Get block floors"""
        if not TestBlockAndFloor.created_block_id:
            pytest.skip("No block available")
        
        block_id = TestBlockAndFloor.created_block_id
        response = api_client.get(f"{BASE_URL}/api/inventory/blocks/{block_id}/floors")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"  Found {len(data)} floors")


# ============================================
# PRICE HISTORY TESTS
# ============================================

class TestPriceHistory:
    """Tests for price history tracking"""
    
    def test_get_price_history(self, api_client):
        """GET /api/inventory/products/{id}/price-history - Get price history"""
        if not TestProductEndpoints.created_product_id:
            pytest.skip("No product available")
        
        product_id = TestProductEndpoints.created_product_id
        response = api_client.get(f"{BASE_URL}/api/inventory/products/{product_id}/price-history")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "history" in data
        print(f"  Found {len(data['history'])} price history entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
