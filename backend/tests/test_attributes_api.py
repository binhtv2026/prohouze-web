"""
Attribute Engine API Tests - Prompt 3/20 Phase 3
Tests for EntityAttribute and EntityAttributeValue management

Endpoints tested:
- GET /api/v2/attributes - List all attributes with filters
- GET /api/v2/attributes/schema/{entity_type} - Get schema for entity type
- GET /api/v2/attributes/groups - List attribute groups
- GET /api/v2/attributes/data-types - List supported data types
- GET /api/v2/attributes/stats - Get statistics
- POST /api/v2/attributes - Create custom attribute
- POST /api/v2/attributes/seed - Seed system attributes
- GET /api/v2/attributes/{id} - Get attribute by ID
- PUT /api/v2/attributes/{id} - Update attribute
- DELETE /api/v2/attributes/{id} - Delete attribute
- GET /api/v2/attributes/values/{entity_type}/{entity_id} - Get values for entity
- POST /api/v2/attributes/values/{entity_type}/{entity_id} - Bulk set values
- PUT /api/v2/attributes/values/{entity_type}/{entity_id}/{attribute_code} - Set single value
- DELETE /api/v2/attributes/values/{entity_type}/{entity_id}/{attribute_code} - Remove value
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test entity IDs
TEST_LEAD_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
TEST_CUSTOMER_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"


class TestAttributeListAndFilters:
    """Test GET /api/v2/attributes - List attributes with filters"""

    def test_list_all_attributes(self):
        """List all attributes without filters"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Verify system attributes exist (should have been seeded)
        if len(data) > 0:
            attr = data[0]
            assert "id" in attr
            assert "entity_type" in attr
            assert "attribute_code" in attr
            assert "attribute_name" in attr
            assert "data_type" in attr
            print(f"PASS: Listed {len(data)} attributes")

    def test_filter_by_entity_type_lead(self):
        """Filter attributes by entity_type=lead"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "lead"})
        assert response.status_code == 200
        
        data = response.json()
        for attr in data:
            assert attr["entity_type"] == "lead", f"Expected entity_type=lead, got {attr['entity_type']}"
        print(f"PASS: Found {len(data)} lead attributes")

    def test_filter_by_entity_type_customer(self):
        """Filter attributes by entity_type=customer"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "customer"})
        assert response.status_code == 200
        
        data = response.json()
        for attr in data:
            assert attr["entity_type"] == "customer"
        print(f"PASS: Found {len(data)} customer attributes")

    def test_filter_by_group_code(self):
        """Filter attributes by group_code=contact"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"group_code": "contact"})
        assert response.status_code == 200
        
        data = response.json()
        for attr in data:
            assert attr["group_code"] == "contact"
        print(f"PASS: Found {len(data)} attributes in 'contact' group")

    def test_filter_by_data_type(self):
        """Filter attributes by data_type=select"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"data_type": "select"})
        assert response.status_code == 200
        
        data = response.json()
        for attr in data:
            assert attr["data_type"] == "select"
        print(f"PASS: Found {len(data)} select-type attributes")

    def test_combined_filters(self):
        """Test multiple filters together"""
        response = requests.get(
            f"{BASE_URL}/api/v2/attributes",
            params={"entity_type": "lead", "group_code": "contact"}
        )
        assert response.status_code == 200
        
        data = response.json()
        for attr in data:
            assert attr["entity_type"] == "lead"
            assert attr["group_code"] == "contact"
        print(f"PASS: Found {len(data)} lead contact attributes")


class TestAttributeSchema:
    """Test GET /api/v2/attributes/schema/{entity_type} - Schema per entity type"""

    def test_get_lead_schema(self):
        """Get schema for lead entity type"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/schema/lead")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "lead"
        assert "groups" in data
        assert "total_attributes" in data
        assert isinstance(data["groups"], list)
        
        # Verify groups have required structure
        if len(data["groups"]) > 0:
            group = data["groups"][0]
            assert "code" in group
            assert "name" in group
            assert "sort" in group
            assert "attributes" in group
        print(f"PASS: Lead schema has {data['total_attributes']} attributes in {len(data['groups'])} groups")

    def test_get_customer_schema(self):
        """Get schema for customer entity type"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/schema/customer")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "customer"
        print(f"PASS: Customer schema has {data['total_attributes']} attributes")

    def test_get_deal_schema(self):
        """Get schema for deal entity type"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/schema/deal")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "deal"
        print(f"PASS: Deal schema has {data['total_attributes']} attributes")

    def test_get_product_schema(self):
        """Get schema for product entity type"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/schema/product")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "product"
        print(f"PASS: Product schema has {data['total_attributes']} attributes")

    def test_get_task_schema(self):
        """Get schema for task entity type"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/schema/task")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "task"
        print(f"PASS: Task schema has {data['total_attributes']} attributes")


class TestAttributeGroups:
    """Test GET /api/v2/attributes/groups - List attribute groups"""

    def test_list_groups(self):
        """List all attribute groups"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/groups")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Should have at least one group"
        
        # Verify group structure
        group = data[0]
        assert "code" in group
        assert "name" in group
        assert "sort" in group
        
        # Verify expected groups exist
        group_codes = [g["code"] for g in data]
        expected_groups = ["basic_info", "contact", "status", "financial"]
        for expected in expected_groups:
            assert expected in group_codes, f"Expected group '{expected}' not found"
        
        print(f"PASS: Found {len(data)} attribute groups")


class TestAttributeDataTypes:
    """Test GET /api/v2/attributes/data-types - List supported data types"""

    def test_list_data_types(self):
        """List all supported data types"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/data-types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify 22 data types as per spec
        expected_types = [
            "string", "text", "number", "decimal", "boolean",
            "date", "datetime", "time", "select", "multi_select",
            "email", "phone", "url", "file", "image",
            "json", "reference", "currency", "percentage", "rating",
            "color", "location"
        ]
        
        for expected in expected_types:
            assert expected in data, f"Expected data type '{expected}' not found"
        
        print(f"PASS: Found {len(data)} data types (expected 22)")
        assert len(data) == 22, f"Expected 22 data types, got {len(data)}"


class TestAttributeStats:
    """Test GET /api/v2/attributes/stats - Statistics"""

    def test_get_stats(self):
        """Get attribute statistics"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_attributes" in data
        assert "system_attributes" in data
        assert "custom_attributes" in data
        assert "by_entity_type" in data
        assert "by_data_type" in data
        assert "total_values" in data
        
        # Verify counts make sense
        assert data["total_attributes"] >= data["system_attributes"]
        assert data["total_attributes"] >= data["custom_attributes"]
        
        print(f"PASS: Stats - total: {data['total_attributes']}, system: {data['system_attributes']}, custom: {data['custom_attributes']}")


class TestSeedSystemAttributes:
    """Test POST /api/v2/attributes/seed - Seed system attributes"""

    def test_seed_without_force(self):
        """Seed system attributes (without force - should be idempotent)"""
        response = requests.post(f"{BASE_URL}/api/v2/attributes/seed")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "count" in data or "total_system_attributes" in data
        print(f"PASS: Seed response - {data.get('message', 'OK')}")

    def test_seed_specific_entity_types(self):
        """Seed only specific entity types"""
        response = requests.post(
            f"{BASE_URL}/api/v2/attributes/seed",
            params={"entity_types": "lead,customer"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"PASS: Seed specific types response - {data.get('message', 'OK')}")


class TestAttributeCRUD:
    """Test Create, Read, Update, Delete for custom attributes"""

    @pytest.fixture(autouse=True)
    def setup_cleanup(self):
        """Clean up test attributes after each test"""
        self.created_attribute_ids = []
        yield
        # Cleanup
        for attr_id in self.created_attribute_ids:
            try:
                requests.delete(f"{BASE_URL}/api/v2/attributes/{attr_id}")
            except:
                pass

    def test_create_custom_attribute_string(self):
        """Create a custom string attribute"""
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_custom_field_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Custom Field",
            "data_type": "string",
            "validation_rules": {"min_length": 1, "max_length": 100},
            "is_required": False,
            "group_code": "custom"
        }
        
        response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["attribute_code"] == payload["attribute_code"]
        assert data["attribute_name"] == payload["attribute_name"]
        assert data["data_type"] == "string"
        assert data["is_system"] == False
        assert data["scope"] == "org"
        
        self.created_attribute_ids.append(data["id"])
        print(f"PASS: Created custom string attribute with id {data['id']}")

    def test_create_custom_attribute_select(self):
        """Create a custom select attribute with options"""
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_budget_range_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Budget Range",
            "data_type": "select",
            "options": [
                {"value": "lt_1b", "label": "<1 tỷ"},
                {"value": "1_3b", "label": "1-3 tỷ"},
                {"value": "3_5b", "label": "3-5 tỷ"},
                {"value": "gt_5b", "label": ">5 tỷ"}
            ],
            "is_required": False,
            "group_code": "financial"
        }
        
        response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response.status_code == 201
        
        data = response.json()
        assert data["data_type"] == "select"
        assert data["options"] is not None
        assert len(data["options"]) == 4
        
        self.created_attribute_ids.append(data["id"])
        print(f"PASS: Created custom select attribute with 4 options")

    def test_create_custom_attribute_number_with_validation(self):
        """Create a number attribute with min/max validation"""
        payload = {
            "entity_type": "customer",
            "attribute_code": f"TEST_age_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Age",
            "data_type": "number",
            "validation_rules": {"min": 18, "max": 120},
            "is_required": False
        }
        
        response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response.status_code == 201
        
        data = response.json()
        assert data["data_type"] == "number"
        assert data["validation_rules"]["min"] == 18
        assert data["validation_rules"]["max"] == 120
        
        self.created_attribute_ids.append(data["id"])
        print(f"PASS: Created custom number attribute with validation rules")

    def test_create_duplicate_attribute_code_fails(self):
        """Creating duplicate attribute_code + entity_type should fail"""
        unique_code = f"TEST_unique_{uuid.uuid4().hex[:8]}"
        payload = {
            "entity_type": "lead",
            "attribute_code": unique_code,
            "attribute_name": "Test Unique",
            "data_type": "string"
        }
        
        # Create first
        response1 = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response1.status_code == 201
        self.created_attribute_ids.append(response1.json()["id"])
        
        # Try to create duplicate
        response2 = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response2.status_code == 400, f"Expected 400 for duplicate, got {response2.status_code}"
        print("PASS: Duplicate attribute code correctly rejected with 400")

    def test_create_invalid_data_type_fails(self):
        """Creating attribute with invalid data_type should fail"""
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_invalid_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Invalid",
            "data_type": "invalid_type"
        }
        
        response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert response.status_code == 400, f"Expected 400 for invalid data_type, got {response.status_code}"
        print("PASS: Invalid data_type correctly rejected with 400")

    def test_get_attribute_by_id(self):
        """Get attribute by ID"""
        # Create attribute first
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_getbyid_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Get By ID",
            "data_type": "string"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert create_response.status_code == 201
        created = create_response.json()
        self.created_attribute_ids.append(created["id"])
        
        # Get by ID
        get_response = requests.get(f"{BASE_URL}/api/v2/attributes/{created['id']}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == created["id"]
        assert data["attribute_code"] == payload["attribute_code"]
        print(f"PASS: Got attribute by ID successfully")

    def test_update_custom_attribute(self):
        """Update a custom attribute"""
        # Create attribute first
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_update_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Update",
            "data_type": "string"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert create_response.status_code == 201
        created = create_response.json()
        self.created_attribute_ids.append(created["id"])
        
        # Update
        update_payload = {
            "attribute_name": "Updated Name",
            "is_required": True
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/v2/attributes/{created['id']}",
            json=update_payload
        )
        assert update_response.status_code == 200
        
        updated = update_response.json()
        assert updated["attribute_name"] == "Updated Name"
        assert updated["is_required"] == True
        print("PASS: Updated custom attribute successfully")

    def test_delete_custom_attribute(self):
        """Delete a custom attribute (without values)"""
        # Create attribute first
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_delete_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Delete",
            "data_type": "string"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        assert create_response.status_code == 201
        created = create_response.json()
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/v2/attributes/{created['id']}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/v2/attributes/{created['id']}")
        assert get_response.status_code == 404
        print("PASS: Deleted custom attribute successfully")


class TestSystemAttributeProtection:
    """Test that system attributes cannot be deleted"""

    def test_cannot_delete_system_attribute(self):
        """System attributes should not be deletable"""
        # First, get a system attribute
        response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "lead"})
        assert response.status_code == 200
        
        data = response.json()
        system_attrs = [a for a in data if a.get("is_system") == True]
        
        if len(system_attrs) == 0:
            pytest.skip("No system attributes found to test deletion protection")
        
        system_attr = system_attrs[0]
        
        # Try to delete
        delete_response = requests.delete(f"{BASE_URL}/api/v2/attributes/{system_attr['id']}")
        assert delete_response.status_code == 400, f"Expected 400 for system attr delete, got {delete_response.status_code}"
        print(f"PASS: System attribute '{system_attr['attribute_code']}' correctly protected from deletion")


class TestAttributeValues:
    """Test attribute value CRUD operations"""

    @pytest.fixture(autouse=True)
    def setup_test_attribute(self):
        """Create a test attribute for value testing"""
        self.test_entity_id = str(uuid.uuid4())
        
        # Create a custom test attribute
        payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_value_attr_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Value Attr",
            "data_type": "string",
            "validation_rules": {"min_length": 1, "max_length": 50}
        }
        
        response = requests.post(f"{BASE_URL}/api/v2/attributes", json=payload)
        if response.status_code == 201:
            self.test_attr = response.json()
        else:
            self.test_attr = None
        
        yield
        
        # Cleanup: remove value first, then attribute
        if self.test_attr:
            try:
                requests.delete(
                    f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.test_attr['attribute_code']}"
                )
            except:
                pass
            try:
                requests.delete(f"{BASE_URL}/api/v2/attributes/{self.test_attr['id']}")
            except:
                pass

    def test_get_entity_values_empty(self):
        """Get values for entity with no values set"""
        response = requests.get(f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "lead"
        assert data["entity_id"] == self.test_entity_id
        assert "values" in data
        print("PASS: Got empty values for new entity")

    def test_set_single_value(self):
        """Set a single attribute value"""
        if not self.test_attr:
            pytest.skip("Test attribute not created")
        
        payload = {"value": "test_string_value"}
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.test_attr['attribute_code']}",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["action"] in ["created", "updated"]
        print(f"PASS: Set single value - action: {data['action']}")

    def test_get_value_after_set(self):
        """Get values after setting a value"""
        if not self.test_attr:
            pytest.skip("Test attribute not created")
        
        # Set value first
        requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.test_attr['attribute_code']}",
            json={"value": "my_value"}
        )
        
        # Get values
        response = requests.get(f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}")
        assert response.status_code == 200
        
        data = response.json()
        attr_code = self.test_attr['attribute_code']
        assert attr_code in data["values"]
        assert data["values"][attr_code]["value"] == "my_value"
        assert data["values"][attr_code]["is_set"] == True
        print("PASS: Retrieved value after setting")

    def test_bulk_set_values(self):
        """Set multiple values at once"""
        if not self.test_attr:
            pytest.skip("Test attribute not created")
        
        # Get an existing system attribute code
        attrs_response = requests.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "lead"})
        lead_attrs = attrs_response.json()
        
        # Find full_name attribute
        full_name_attr = next((a for a in lead_attrs if a["attribute_code"] == "full_name"), None)
        
        values_to_set = {
            self.test_attr["attribute_code"]: "bulk_test_value"
        }
        
        if full_name_attr:
            values_to_set["full_name"] = "Test Lead Name"
        
        payload = {"values": values_to_set}
        
        response = requests.post(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert len(data["errors"]) == 0
        print(f"PASS: Bulk set values - created: {data['created']}, updated: {data['updated']}")

    def test_delete_value(self):
        """Delete an attribute value"""
        if not self.test_attr:
            pytest.skip("Test attribute not created")
        
        # Set value first
        requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.test_attr['attribute_code']}",
            json={"value": "to_delete"}
        )
        
        # Delete
        delete_response = requests.delete(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.test_attr['attribute_code']}"
        )
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        print("PASS: Deleted attribute value")


class TestValidation:
    """Test validation rules for attributes"""

    @pytest.fixture(autouse=True)
    def setup_validation_attrs(self):
        """Create attributes with validation rules"""
        self.test_entity_id = str(uuid.uuid4())
        self.created_attrs = []
        
        # Create string attribute with length validation
        string_payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_str_val_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test String Validation",
            "data_type": "string",
            "validation_rules": {"min_length": 3, "max_length": 10}
        }
        
        resp = requests.post(f"{BASE_URL}/api/v2/attributes", json=string_payload)
        if resp.status_code == 201:
            self.string_attr = resp.json()
            self.created_attrs.append(self.string_attr["id"])
        else:
            self.string_attr = None
        
        # Create number attribute with min/max
        number_payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_num_val_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Number Validation",
            "data_type": "number",
            "validation_rules": {"min": 0, "max": 100}
        }
        
        resp = requests.post(f"{BASE_URL}/api/v2/attributes", json=number_payload)
        if resp.status_code == 201:
            self.number_attr = resp.json()
            self.created_attrs.append(self.number_attr["id"])
        else:
            self.number_attr = None
        
        # Create select attribute
        select_payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_sel_val_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Select Validation",
            "data_type": "select",
            "options": [
                {"value": "option1", "label": "Option 1"},
                {"value": "option2", "label": "Option 2"}
            ]
        }
        
        resp = requests.post(f"{BASE_URL}/api/v2/attributes", json=select_payload)
        if resp.status_code == 201:
            self.select_attr = resp.json()
            self.created_attrs.append(self.select_attr["id"])
        else:
            self.select_attr = None
        
        # Create required attribute
        required_payload = {
            "entity_type": "lead",
            "attribute_code": f"TEST_req_val_{uuid.uuid4().hex[:8]}",
            "attribute_name": "Test Required",
            "data_type": "string",
            "is_required": True
        }
        
        resp = requests.post(f"{BASE_URL}/api/v2/attributes", json=required_payload)
        if resp.status_code == 201:
            self.required_attr = resp.json()
            self.created_attrs.append(self.required_attr["id"])
        else:
            self.required_attr = None
        
        yield
        
        # Cleanup
        for attr_id in self.created_attrs:
            # Delete values first
            for attr in [self.string_attr, self.number_attr, self.select_attr, self.required_attr]:
                if attr and attr["id"] == attr_id:
                    try:
                        requests.delete(
                            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{attr['attribute_code']}"
                        )
                    except:
                        pass
            try:
                requests.delete(f"{BASE_URL}/api/v2/attributes/{attr_id}")
            except:
                pass

    def test_string_min_length_validation(self):
        """String shorter than min_length should fail"""
        if not self.string_attr:
            pytest.skip("String attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.string_attr['attribute_code']}",
            json={"value": "ab"}  # Too short (min is 3)
        )
        assert response.status_code == 400, f"Expected 400 for short string, got {response.status_code}"
        print("PASS: Min length validation works")

    def test_string_max_length_validation(self):
        """String longer than max_length should fail"""
        if not self.string_attr:
            pytest.skip("String attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.string_attr['attribute_code']}",
            json={"value": "a" * 15}  # Too long (max is 10)
        )
        assert response.status_code == 400, f"Expected 400 for long string, got {response.status_code}"
        print("PASS: Max length validation works")

    def test_string_valid_length(self):
        """String within length limits should succeed"""
        if not self.string_attr:
            pytest.skip("String attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.string_attr['attribute_code']}",
            json={"value": "valid"}
        )
        assert response.status_code == 200
        print("PASS: Valid string length accepted")

    def test_number_below_min(self):
        """Number below min should fail"""
        if not self.number_attr:
            pytest.skip("Number attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.number_attr['attribute_code']}",
            json={"value": -5}  # Below min (0)
        )
        assert response.status_code == 400, f"Expected 400 for number below min, got {response.status_code}"
        print("PASS: Number min validation works")

    def test_number_above_max(self):
        """Number above max should fail"""
        if not self.number_attr:
            pytest.skip("Number attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.number_attr['attribute_code']}",
            json={"value": 150}  # Above max (100)
        )
        assert response.status_code == 400, f"Expected 400 for number above max, got {response.status_code}"
        print("PASS: Number max validation works")

    def test_number_valid(self):
        """Number within range should succeed"""
        if not self.number_attr:
            pytest.skip("Number attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.number_attr['attribute_code']}",
            json={"value": 50}
        )
        assert response.status_code == 200
        print("PASS: Valid number accepted")

    def test_select_invalid_option(self):
        """Select value not in options should fail"""
        if not self.select_attr:
            pytest.skip("Select attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.select_attr['attribute_code']}",
            json={"value": "invalid_option"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid option, got {response.status_code}"
        print("PASS: Select validation works - invalid option rejected")

    def test_select_valid_option(self):
        """Select value in options should succeed"""
        if not self.select_attr:
            pytest.skip("Select attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.select_attr['attribute_code']}",
            json={"value": "option1"}
        )
        assert response.status_code == 200
        print("PASS: Valid select option accepted")

    def test_required_empty_value(self):
        """Required field with empty value should fail"""
        if not self.required_attr:
            pytest.skip("Required attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.required_attr['attribute_code']}",
            json={"value": ""}
        )
        assert response.status_code == 400, f"Expected 400 for empty required field, got {response.status_code}"
        print("PASS: Required field validation works - empty value rejected")

    def test_required_with_value(self):
        """Required field with value should succeed"""
        if not self.required_attr:
            pytest.skip("Required attribute not created")
        
        response = requests.put(
            f"{BASE_URL}/api/v2/attributes/values/lead/{self.test_entity_id}/{self.required_attr['attribute_code']}",
            json={"value": "required_value"}
        )
        assert response.status_code == 200
        print("PASS: Required field with value accepted")


class TestExistingTestDataValues:
    """Test that existing test data values can be retrieved"""

    def test_get_lead_values(self):
        """Get values for the test lead mentioned in context"""
        test_lead_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        
        response = requests.get(f"{BASE_URL}/api/v2/attributes/values/lead/{test_lead_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["entity_type"] == "lead"
        assert "values" in data
        print(f"PASS: Got values for test lead - {len(data['values'])} attributes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
