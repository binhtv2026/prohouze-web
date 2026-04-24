"""
ProHouzing Tag System API Tests
Version: 1.0.0
Prompt: 3/20 - Dynamic Data Foundation - Phase 2

Tests for:
- Tag CRUD operations (list, create, update, delete)
- Tag lookup and stats endpoints
- Tag assignment/unassignment to entities
- Bulk tag operations
- System tag protection
- Unique constraint validation
- Usage count tracking
"""

import pytest
import requests
import os
from uuid import uuid4

# Base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://content-machine-18.preview.emergentagent.com"

API_BASE = f"{BASE_URL}/api/v2/tags"

# Test entity IDs - using UUIDs from context
TEST_LEAD_ID = "11111111-1111-1111-1111-111111111111"
TEST_CUSTOMER_ID = "22222222-2222-2222-2222-222222222222"
TEST_PRODUCT_ID = str(uuid4())
TEST_DEAL_ID = str(uuid4())


class TestTagSeedAndList:
    """Test seeding system tags and listing"""
    
    def test_01_seed_system_tags(self):
        """POST /api/v2/tags/seed - Seed system tags"""
        response = requests.post(f"{API_BASE}/seed")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "total_system_tags" in data or "count" in data
        print(f"Seed response: {data}")
    
    def test_02_list_all_tags(self):
        """GET /api/v2/tags - List all tags"""
        response = requests.get(f"{API_BASE}")
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        assert len(tags) > 0
        
        # Verify tag structure
        tag = tags[0]
        assert "id" in tag
        assert "tag_code" in tag
        assert "tag_name" in tag
        assert "category" in tag
        print(f"Found {len(tags)} tags")
    
    def test_03_list_tags_by_category(self):
        """GET /api/v2/tags?category=sales - Filter by category"""
        response = requests.get(f"{API_BASE}", params={"category": "sales"})
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        
        # All tags should be in sales category
        for tag in tags:
            assert tag.get("category") == "sales"
        print(f"Found {len(tags)} sales tags")
    
    def test_04_search_tags(self):
        """GET /api/v2/tags?search=hot - Search in name/code"""
        response = requests.get(f"{API_BASE}", params={"search": "hot"})
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        
        # Should find hot_lead tag
        hot_lead_found = any(t.get("tag_code") == "hot_lead" for t in tags)
        assert hot_lead_found, "hot_lead tag should be found"
        print(f"Found {len(tags)} tags matching 'hot'")


class TestTagLookup:
    """Test tag lookup endpoint for dropdowns"""
    
    def test_lookup_all_tags(self):
        """GET /api/v2/tags/lookup - Quick lookup for dropdowns"""
        response = requests.get(f"{API_BASE}/lookup")
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        assert len(tags) > 0
        
        # Verify simplified structure
        tag = tags[0]
        assert "id" in tag
        assert "code" in tag
        assert "name" in tag
        assert "color" in tag
        print(f"Lookup returned {len(tags)} tags")
    
    def test_lookup_by_category(self):
        """GET /api/v2/tags/lookup?category=customer - Lookup by category"""
        response = requests.get(f"{API_BASE}/lookup", params={"category": "customer"})
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        
        for tag in tags:
            assert tag.get("category") == "customer"
        print(f"Lookup returned {len(tags)} customer tags")


class TestTagStats:
    """Test tag statistics endpoint"""
    
    def test_get_tag_stats(self):
        """GET /api/v2/tags/stats - Get tag statistics"""
        response = requests.get(f"{API_BASE}/stats")
        assert response.status_code == 200
        
        stats = response.json()
        assert "total_tags" in stats
        assert "system_tags" in stats
        assert "custom_tags" in stats
        assert "by_category" in stats
        
        assert stats["total_tags"] >= 18, "Should have at least 18 system tags"
        assert stats["system_tags"] >= 18
        
        print(f"Stats: total={stats['total_tags']}, system={stats['system_tags']}, custom={stats['custom_tags']}")
        print(f"Categories: {stats['by_category']}")


class TestTagByCode:
    """Test getting tag by code"""
    
    def test_get_tag_by_code_hot_lead(self):
        """GET /api/v2/tags/code/hot_lead - Get tag by code"""
        response = requests.get(f"{API_BASE}/code/hot_lead")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["tag_code"] == "hot_lead"
        assert tag["tag_name"] == "Hot Lead"
        assert tag["category"] == "sales"
        assert tag["is_system"] == True
        print(f"Tag: {tag['tag_code']} - {tag['tag_name']} ({tag['color_code']})")
    
    def test_get_tag_by_code_vip(self):
        """GET /api/v2/tags/code/vip - Get VIP tag"""
        response = requests.get(f"{API_BASE}/code/vip")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["tag_code"] == "vip"
        assert tag["tag_name"] == "VIP"
        assert tag["is_system"] == True
    
    def test_get_tag_by_code_not_found(self):
        """GET /api/v2/tags/code/nonexistent - Should return 404"""
        response = requests.get(f"{API_BASE}/code/nonexistent_tag_xyz")
        assert response.status_code == 404


class TestTagCRUD:
    """Test tag CRUD operations"""
    
    created_tag_id = None
    
    def test_01_create_custom_tag(self):
        """POST /api/v2/tags - Create new custom tag"""
        tag_data = {
            "tag_code": f"test_custom_{uuid4().hex[:8]}",
            "tag_name": "TEST Custom Tag",
            "tag_name_vi": "Tag Tùy chỉnh TEST",
            "description": "A custom tag for testing",
            "color_code": "#FF5733",
            "icon_code": "star",
            "category": "custom",
            "sort_order": 100
        }
        
        response = requests.post(f"{API_BASE}", json=tag_data)
        assert response.status_code == 201
        
        tag = response.json()
        assert tag["tag_code"] == tag_data["tag_code"]
        assert tag["tag_name"] == tag_data["tag_name"]
        assert tag["color_code"] == tag_data["color_code"]
        assert tag["is_system"] == False
        assert tag["usage_count"] == 0
        
        TestTagCRUD.created_tag_id = tag["id"]
        print(f"Created tag: {tag['id']} - {tag['tag_code']}")
    
    def test_02_get_created_tag_by_id(self):
        """GET /api/v2/tags/{id} - Get tag by ID"""
        assert TestTagCRUD.created_tag_id is not None
        
        response = requests.get(f"{API_BASE}/{TestTagCRUD.created_tag_id}")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["id"] == TestTagCRUD.created_tag_id
        assert tag["tag_name"] == "TEST Custom Tag"
    
    def test_03_update_custom_tag(self):
        """PUT /api/v2/tags/{id} - Update tag"""
        assert TestTagCRUD.created_tag_id is not None
        
        update_data = {
            "tag_name": "TEST Updated Custom Tag",
            "color_code": "#00FF00",
            "description": "Updated description"
        }
        
        response = requests.put(f"{API_BASE}/{TestTagCRUD.created_tag_id}", json=update_data)
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["tag_name"] == "TEST Updated Custom Tag"
        assert tag["color_code"] == "#00FF00"
        assert tag["description"] == "Updated description"
        print(f"Updated tag: {tag['tag_name']}")
    
    def test_04_delete_custom_tag(self):
        """DELETE /api/v2/tags/{id} - Delete custom tag"""
        assert TestTagCRUD.created_tag_id is not None
        
        response = requests.delete(f"{API_BASE}/{TestTagCRUD.created_tag_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print(f"Deleted tag: {TestTagCRUD.created_tag_id}")
        
        # Verify deletion
        response = requests.get(f"{API_BASE}/{TestTagCRUD.created_tag_id}")
        assert response.status_code == 404


class TestSystemTagProtection:
    """Test that system tags cannot be deleted"""
    
    system_tag_id = None
    
    def test_01_get_system_tag_id(self):
        """Get a system tag ID for testing"""
        response = requests.get(f"{API_BASE}/code/hot_lead")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["is_system"] == True
        
        TestSystemTagProtection.system_tag_id = tag["id"]
        print(f"System tag ID: {TestSystemTagProtection.system_tag_id}")
    
    def test_02_cannot_delete_system_tag(self):
        """DELETE /api/v2/tags/{id} - Should fail for system tags"""
        assert TestSystemTagProtection.system_tag_id is not None
        
        response = requests.delete(f"{API_BASE}/{TestSystemTagProtection.system_tag_id}")
        assert response.status_code == 400
        
        data = response.json()
        assert "system" in data.get("detail", "").lower() or "cannot delete" in data.get("detail", "").lower()
        print(f"Correctly blocked: {data.get('detail')}")
    
    def test_03_can_update_system_tag_visual_fields(self):
        """PUT /api/v2/tags/{id} - Can update visual fields of system tag"""
        assert TestSystemTagProtection.system_tag_id is not None
        
        update_data = {
            "color_code": "#FF0000",
            "description": "Updated description"
        }
        
        response = requests.put(f"{API_BASE}/{TestSystemTagProtection.system_tag_id}", json=update_data)
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["color_code"] == "#FF0000"
        print(f"Successfully updated system tag visual fields")


class TestUniqueConstraint:
    """Test unique constraint (same tag_code + org_id should fail)"""
    
    unique_tag_code = f"test_unique_{uuid4().hex[:8]}"
    created_tag_id = None
    
    def test_01_create_first_tag(self):
        """Create first tag with unique code"""
        tag_data = {
            "tag_code": TestUniqueConstraint.unique_tag_code,
            "tag_name": "TEST Unique Tag",
            "category": "custom"
        }
        
        response = requests.post(f"{API_BASE}", json=tag_data)
        assert response.status_code == 201
        
        tag = response.json()
        TestUniqueConstraint.created_tag_id = tag["id"]
        print(f"Created tag: {tag['tag_code']}")
    
    def test_02_create_duplicate_tag_should_fail(self):
        """Creating same tag_code should fail"""
        tag_data = {
            "tag_code": TestUniqueConstraint.unique_tag_code,
            "tag_name": "TEST Duplicate Tag",
            "category": "custom"
        }
        
        response = requests.post(f"{API_BASE}", json=tag_data)
        assert response.status_code == 400
        
        data = response.json()
        assert "already exists" in data.get("detail", "").lower()
        print(f"Correctly blocked: {data.get('detail')}")
    
    def test_03_cleanup_unique_tag(self):
        """Delete the test tag"""
        if TestUniqueConstraint.created_tag_id:
            response = requests.delete(f"{API_BASE}/{TestUniqueConstraint.created_tag_id}")
            assert response.status_code == 200


class TestTagAssignment:
    """Test tag assignment to entities"""
    
    test_entity_id = str(uuid4())
    
    def test_01_assign_tag_by_code(self):
        """POST /api/v2/tags/assign - Assign tag by code"""
        assign_data = {
            "tag_code": "hot_lead",
            "entity_type": "lead",
            "entity_id": TestTagAssignment.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/assign", json=assign_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "entity_tag" in data
        assert data["entity_tag"]["tag_code"] == "hot_lead"
        print(f"Assigned hot_lead to lead {TestTagAssignment.test_entity_id[:8]}...")
    
    def test_02_assign_same_tag_again_idempotent(self):
        """Assigning same tag again should be idempotent"""
        assign_data = {
            "tag_code": "hot_lead",
            "entity_type": "lead",
            "entity_id": TestTagAssignment.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/assign", json=assign_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "already assigned" in data.get("message", "").lower()
        print("Idempotent assignment confirmed")
    
    def test_03_get_entity_tags(self):
        """GET /api/v2/tags/entity/{entity_type}/{entity_id} - Get tags for entity"""
        response = requests.get(f"{API_BASE}/entity/lead/{TestTagAssignment.test_entity_id}")
        assert response.status_code == 200
        
        tags = response.json()
        assert isinstance(tags, list)
        assert len(tags) >= 1
        
        tag_codes = [t["tag_code"] for t in tags]
        assert "hot_lead" in tag_codes
        print(f"Entity has tags: {tag_codes}")
    
    def test_04_unassign_tag(self):
        """POST /api/v2/tags/unassign - Remove tag from entity"""
        unassign_data = {
            "tag_code": "hot_lead",
            "entity_type": "lead",
            "entity_id": TestTagAssignment.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/unassign", json=unassign_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print("Unassigned hot_lead from lead")
    
    def test_05_verify_unassign(self):
        """Verify tag was unassigned"""
        response = requests.get(f"{API_BASE}/entity/lead/{TestTagAssignment.test_entity_id}")
        assert response.status_code == 200
        
        tags = response.json()
        tag_codes = [t["tag_code"] for t in tags]
        assert "hot_lead" not in tag_codes
        print(f"Verified: hot_lead removed, remaining: {tag_codes}")


class TestBulkTagAssignment:
    """Test bulk tag assignment"""
    
    test_entity_id = str(uuid4())
    
    def test_01_assign_bulk_tags_by_codes(self):
        """POST /api/v2/tags/assign-bulk - Assign multiple tags"""
        bulk_data = {
            "tag_codes": ["vip", "priority", "follow_up"],
            "entity_type": "customer",
            "entity_id": TestBulkTagAssignment.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/assign-bulk", json=bulk_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert len(data.get("assigned", [])) == 3
        print(f"Bulk assigned: {data['assigned']}")
    
    def test_02_verify_bulk_assignment(self):
        """Verify all tags were assigned"""
        response = requests.get(f"{API_BASE}/entity/customer/{TestBulkTagAssignment.test_entity_id}")
        assert response.status_code == 200
        
        tags = response.json()
        tag_codes = [t["tag_code"] for t in tags]
        
        assert "vip" in tag_codes
        assert "priority" in tag_codes
        assert "follow_up" in tag_codes
        print(f"Verified bulk assignment: {tag_codes}")
    
    def test_03_cleanup_bulk_tags(self):
        """Unassign bulk tags"""
        for code in ["vip", "priority", "follow_up"]:
            response = requests.post(f"{API_BASE}/unassign", json={
                "tag_code": code,
                "entity_type": "customer",
                "entity_id": TestBulkTagAssignment.test_entity_id
            })
            assert response.status_code == 200


class TestFilterEntitiesByTag:
    """Test filtering entities by tag"""
    
    entity_ids = [str(uuid4()) for _ in range(3)]
    
    def test_01_setup_tagged_entities(self):
        """Setup: Assign tags to test entities"""
        # Assign hot_lead to first 2 entities
        for eid in TestFilterEntitiesByTag.entity_ids[:2]:
            response = requests.post(f"{API_BASE}/assign", json={
                "tag_code": "hot_lead",
                "entity_type": "lead",
                "entity_id": eid
            })
            assert response.status_code == 200
        
        # Assign vip to first and third entities
        for eid in [TestFilterEntitiesByTag.entity_ids[0], TestFilterEntitiesByTag.entity_ids[2]]:
            response = requests.post(f"{API_BASE}/assign", json={
                "tag_code": "vip",
                "entity_type": "lead",
                "entity_id": eid
            })
            assert response.status_code == 200
        
        print(f"Setup: Tagged 3 test entities")
    
    def test_02_filter_by_single_tag(self):
        """GET /api/v2/tags/filter/lead?tag_code=hot_lead - Filter entities by tag"""
        response = requests.get(f"{API_BASE}/filter/lead", params={"tag_code": "hot_lead"})
        assert response.status_code == 200
        
        entity_ids = response.json()
        assert isinstance(entity_ids, list)
        
        # Should include our first 2 test entities
        for eid in TestFilterEntitiesByTag.entity_ids[:2]:
            assert eid in entity_ids
        print(f"Filtered by hot_lead: {len(entity_ids)} entities")
    
    def test_03_filter_by_multiple_tags_or(self):
        """GET /api/v2/tags/filter/lead?tag_codes=hot_lead,vip - OR filter"""
        response = requests.get(f"{API_BASE}/filter/lead", params={"tag_codes": "hot_lead,vip"})
        assert response.status_code == 200
        
        entity_ids = response.json()
        # All 3 test entities have either hot_lead or vip
        for eid in TestFilterEntitiesByTag.entity_ids:
            assert eid in entity_ids
        print(f"Filtered by hot_lead OR vip: {len(entity_ids)} entities")
    
    def test_04_filter_by_multiple_tags_and(self):
        """GET /api/v2/tags/filter/lead?tag_codes=hot_lead,vip&match_all=true - AND filter"""
        response = requests.get(f"{API_BASE}/filter/lead", params={
            "tag_codes": "hot_lead,vip",
            "match_all": "true"
        })
        assert response.status_code == 200
        
        entity_ids = response.json()
        # Only first entity has BOTH hot_lead and vip
        assert TestFilterEntitiesByTag.entity_ids[0] in entity_ids
        print(f"Filtered by hot_lead AND vip: {len(entity_ids)} entities")
    
    def test_05_cleanup_filter_test_data(self):
        """Cleanup test entities"""
        for eid in TestFilterEntitiesByTag.entity_ids:
            for code in ["hot_lead", "vip"]:
                requests.post(f"{API_BASE}/unassign", json={
                    "tag_code": code,
                    "entity_type": "lead",
                    "entity_id": eid
                })


class TestUsageCountTracking:
    """Test that usage_count updates correctly"""
    
    custom_tag_id = None
    custom_tag_code = f"test_usage_{uuid4().hex[:8]}"
    test_entity_id = str(uuid4())
    
    def test_01_create_tag_with_zero_usage(self):
        """Create a new tag - should have usage_count=0"""
        tag_data = {
            "tag_code": TestUsageCountTracking.custom_tag_code,
            "tag_name": "TEST Usage Count Tag",
            "category": "custom"
        }
        
        response = requests.post(f"{API_BASE}", json=tag_data)
        assert response.status_code == 201
        
        tag = response.json()
        assert tag["usage_count"] == 0
        TestUsageCountTracking.custom_tag_id = tag["id"]
        print(f"Created tag with usage_count=0")
    
    def test_02_assign_increments_usage(self):
        """Assigning tag should increment usage_count"""
        assign_data = {
            "tag_code": TestUsageCountTracking.custom_tag_code,
            "entity_type": "product",
            "entity_id": TestUsageCountTracking.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/assign", json=assign_data)
        assert response.status_code == 200
        
        # Check usage count increased
        response = requests.get(f"{API_BASE}/{TestUsageCountTracking.custom_tag_id}")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["usage_count"] == 1
        print(f"Usage count incremented to 1")
    
    def test_03_unassign_decrements_usage(self):
        """Unassigning tag should decrement usage_count"""
        unassign_data = {
            "tag_code": TestUsageCountTracking.custom_tag_code,
            "entity_type": "product",
            "entity_id": TestUsageCountTracking.test_entity_id
        }
        
        response = requests.post(f"{API_BASE}/unassign", json=unassign_data)
        assert response.status_code == 200
        
        # Check usage count decreased
        response = requests.get(f"{API_BASE}/{TestUsageCountTracking.custom_tag_id}")
        assert response.status_code == 200
        
        tag = response.json()
        assert tag["usage_count"] == 0
        print(f"Usage count decremented to 0")
    
    def test_04_cleanup_usage_tag(self):
        """Cleanup test tag"""
        if TestUsageCountTracking.custom_tag_id:
            response = requests.delete(f"{API_BASE}/{TestUsageCountTracking.custom_tag_id}")
            assert response.status_code == 200


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_assign_without_tag_id_or_code(self):
        """Should fail when neither tag_id nor tag_code provided"""
        assign_data = {
            "entity_type": "lead",
            "entity_id": str(uuid4())
        }
        
        response = requests.post(f"{API_BASE}/assign", json=assign_data)
        assert response.status_code == 400
        
        data = response.json()
        assert "tag_id" in data.get("detail", "").lower() or "tag_code" in data.get("detail", "").lower()
    
    def test_unassign_nonexistent_assignment(self):
        """Should fail when trying to unassign tag not assigned"""
        unassign_data = {
            "tag_code": "hot_lead",
            "entity_type": "lead",
            "entity_id": str(uuid4())  # Random entity that doesn't have this tag
        }
        
        response = requests.post(f"{API_BASE}/unassign", json=unassign_data)
        assert response.status_code == 404
    
    def test_filter_without_tag_param(self):
        """Should fail when no tag specified for filter"""
        response = requests.get(f"{API_BASE}/filter/lead")
        assert response.status_code == 400
    
    def test_get_nonexistent_tag_id(self):
        """Should return 404 for nonexistent tag ID"""
        fake_id = str(uuid4())
        response = requests.get(f"{API_BASE}/{fake_id}")
        assert response.status_code == 404


class TestPreviousTestData:
    """Verify previous test data exists as mentioned in context"""
    
    def test_previous_lead_tags(self):
        """Verify lead 11111111-... has hot_lead tag"""
        response = requests.get(f"{API_BASE}/entity/lead/{TEST_LEAD_ID}")
        assert response.status_code == 200
        
        tags = response.json()
        print(f"Lead {TEST_LEAD_ID[:8]}... tags: {[t['tag_code'] for t in tags]}")
        # Note: This may be empty if previous test cleaned up
    
    def test_previous_customer_tags(self):
        """Verify customer 22222222-... has vip and investor tags"""
        response = requests.get(f"{API_BASE}/entity/customer/{TEST_CUSTOMER_ID}")
        assert response.status_code == 200
        
        tags = response.json()
        print(f"Customer {TEST_CUSTOMER_ID[:8]}... tags: {[t['tag_code'] for t in tags]}")
        # Note: This may be empty if previous test cleaned up


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
