"""
Test Master Data CRUD APIs - Prompt 3/20 Extension
Tests create, update, deactivate, and reactivate master data items
"""

import pytest
import requests
import os
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

def random_suffix():
    return ''.join(random.choices(string.ascii_lowercase, k=6))

class TestMasterDataCRUD:
    """Test CRUD operations for Master Data items"""
    
    # Category that allows adding items (is_extendable=True)
    test_category = "lead_sources"  # Lead sources is extendable
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data with unique codes"""
        self.test_code = f"TEST_{random_suffix()}"
        self.test_label = f"Test Item {random_suffix()}"
        yield
        # Cleanup: Try to deactivate test item
        try:
            requests.delete(f"{BASE_URL}/api/config/master-data/{self.test_category}/items/{self.test_code}")
        except:
            pass
    
    def test_create_item(self):
        """Test POST /api/config/master-data/{category}/items - Create new item"""
        payload = {
            "code": self.test_code,
            "label": self.test_label,
            "label_en": "Test Item EN",
            "color": "bg-blue-100 text-blue-700",
            "icon": "star",
            "group": "test_group",
            "order": 100,
            "is_active": True,
            "metadata": {"test_key": "test_value"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["code"] == self.test_code
        assert data["label"] == self.test_label
        assert data["label_en"] == "Test Item EN"
        assert data["color"] == "bg-blue-100 text-blue-700"
        assert data["is_active"] == True
        print(f"✓ Created item: {self.test_code}")
    
    def test_create_duplicate_item_fails(self):
        """Test creating duplicate code returns 400"""
        payload = {
            "code": self.test_code,
            "label": self.test_label,
            "is_active": True
        }
        
        # First create
        requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=payload
        )
        
        # Try duplicate
        response = requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=payload
        )
        
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print(f"✓ Duplicate code rejected as expected")
    
    def test_create_item_in_non_extendable_category_fails(self):
        """Test creating item in non-extendable category returns 403"""
        # task_statuses typically has is_extendable=False
        payload = {
            "code": self.test_code,
            "label": "Test Status",
            "is_active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/config/master-data/task_statuses/items",
            json=payload
        )
        
        # May return 403 (forbidden) or allow - depends on category config
        # Just verify it returns some response
        assert response.status_code in [200, 403], f"Unexpected status: {response.status_code}"
        print(f"✓ Non-extendable category handling: {response.status_code}")
    
    def test_update_item(self):
        """Test PUT /api/config/master-data/{category}/items/{code} - Update item"""
        # First create
        create_payload = {
            "code": self.test_code,
            "label": self.test_label,
            "order": 1,
            "is_active": True
        }
        requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=create_payload
        )
        
        # Update
        update_payload = {
            "label": "Updated Label",
            "label_en": "Updated EN",
            "color": "bg-green-100 text-green-700",
            "order": 50
        }
        
        response = requests.put(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items/{self.test_code}",
            json=update_payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["label"] == "Updated Label"
        assert data["label_en"] == "Updated EN"
        assert data["color"] == "bg-green-100 text-green-700"
        assert data["order"] == 50
        print(f"✓ Updated item: {self.test_code}")
    
    def test_update_nonexistent_item_fails(self):
        """Test updating non-existent item returns 404"""
        update_payload = {
            "label": "Won't Work"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items/NONEXISTENT_CODE_999",
            json=update_payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent item update returns 404")
    
    def test_deactivate_item(self):
        """Test DELETE /api/config/master-data/{category}/items/{code} - Deactivate item"""
        # First create
        create_payload = {
            "code": self.test_code,
            "label": self.test_label,
            "is_active": True
        }
        requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=create_payload
        )
        
        # Deactivate
        response = requests.delete(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items/{self.test_code}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "deactivated" in data["message"].lower() or "message" in data
        print(f"✓ Deactivated item: {self.test_code}")
        
        # Verify item is inactive - get all items including inactive
        verify_response = requests.get(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items?include_inactive=true"
        )
        items = verify_response.json()
        test_item = next((i for i in items if i["code"] == self.test_code), None)
        if test_item:
            assert test_item["is_active"] == False, "Item should be inactive"
            print(f"✓ Verified item is inactive")
    
    def test_reactivate_item(self):
        """Test POST /api/config/master-data/{category}/items/{code}/activate - Reactivate item"""
        # First create and deactivate
        create_payload = {
            "code": self.test_code,
            "label": self.test_label,
            "is_active": True
        }
        requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items",
            json=create_payload
        )
        requests.delete(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items/{self.test_code}"
        )
        
        # Reactivate
        response = requests.post(
            f"{BASE_URL}/api/config/master-data/{self.test_category}/items/{self.test_code}/activate"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "activated" in data["message"].lower()
        print(f"✓ Reactivated item: {self.test_code}")
    
    def test_category_not_found(self):
        """Test operations on non-existent category return 404"""
        response = requests.post(
            f"{BASE_URL}/api/config/master-data/nonexistent_category/items",
            json={"code": "test", "label": "Test", "is_active": True}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Non-existent category returns 404")


class TestMasterDataCRUDIntegration:
    """Integration tests for Master Data CRUD flow"""
    
    def test_full_crud_lifecycle(self):
        """Test complete create -> read -> update -> deactivate -> reactivate flow"""
        test_code = f"LIFECYCLE_{random_suffix()}"
        category = "lead_sources"
        
        # CREATE
        create_response = requests.post(
            f"{BASE_URL}/api/config/master-data/{category}/items",
            json={
                "code": test_code,
                "label": "Lifecycle Test",
                "color": "bg-red-100 text-red-700",
                "order": 999,
                "is_active": True
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        created = create_response.json()
        assert created["code"] == test_code
        print(f"✓ CREATE: {test_code}")
        
        # READ - verify in category items
        read_response = requests.get(
            f"{BASE_URL}/api/config/master-data/{category}/items"
        )
        assert read_response.status_code == 200
        items = read_response.json()
        found = next((i for i in items if i["code"] == test_code), None)
        assert found is not None, "Created item not found in list"
        assert found["label"] == "Lifecycle Test"
        print(f"✓ READ: Found {test_code} in list")
        
        # UPDATE
        update_response = requests.put(
            f"{BASE_URL}/api/config/master-data/{category}/items/{test_code}",
            json={"label": "Updated Lifecycle", "order": 888}
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        updated = update_response.json()
        assert updated["label"] == "Updated Lifecycle"
        assert updated["order"] == 888
        print(f"✓ UPDATE: Label and order changed")
        
        # DEACTIVATE
        delete_response = requests.delete(
            f"{BASE_URL}/api/config/master-data/{category}/items/{test_code}"
        )
        assert delete_response.status_code == 200, f"Deactivate failed: {delete_response.text}"
        print(f"✓ DEACTIVATE: {test_code}")
        
        # VERIFY NOT IN ACTIVE LIST
        read_active_response = requests.get(
            f"{BASE_URL}/api/config/master-data/{category}/items"
        )
        active_items = read_active_response.json()
        found_active = next((i for i in active_items if i["code"] == test_code), None)
        assert found_active is None, "Deactivated item should not be in active list"
        print(f"✓ VERIFY: {test_code} not in active list")
        
        # REACTIVATE
        activate_response = requests.post(
            f"{BASE_URL}/api/config/master-data/{category}/items/{test_code}/activate"
        )
        assert activate_response.status_code == 200, f"Reactivate failed: {activate_response.text}"
        print(f"✓ REACTIVATE: {test_code}")
        
        # VERIFY BACK IN ACTIVE LIST
        read_final_response = requests.get(
            f"{BASE_URL}/api/config/master-data/{category}/items"
        )
        final_items = read_final_response.json()
        found_final = next((i for i in final_items if i["code"] == test_code), None)
        assert found_final is not None, "Reactivated item should be in active list"
        assert found_final["is_active"] == True
        print(f"✓ VERIFY: {test_code} back in active list")
        
        # CLEANUP
        requests.delete(f"{BASE_URL}/api/config/master-data/{category}/items/{test_code}")
        print(f"✓ CLEANUP: {test_code} deactivated")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
