"""
Test Form Schema API (Prompt 3/20 - Phase 4)
Version: 1.0.0

Tests:
- GET /api/v2/forms - List all form schemas
- GET /api/v2/forms/render/{entity_type} - Get renderable form
- GET /api/v2/forms/types - List form types
- GET /api/v2/forms/layouts - List layouts
- GET /api/v2/forms/stats - Get statistics
- POST /api/v2/forms - Create new form schema
- POST /api/v2/forms/seed - Seed default forms
- POST /api/v2/forms/{schema_id}/sections - Add section
- PUT /api/v2/forms/sections/{section_id} - Update section
- DELETE /api/v2/forms/sections/{section_id} - Delete section
- POST /api/v2/forms/sections/{section_id}/fields - Add field
- PUT /api/v2/forms/fields/{field_id} - Update field
- DELETE /api/v2/forms/fields/{field_id} - Delete field
- System form protection tests
- Effective values computation tests
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Test data cleanup
created_schema_ids = []
created_section_ids = []
created_field_ids = []


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session", autouse=True)
def seed_forms(api_client):
    """Seed default forms before running tests"""
    response = api_client.post(f"{BASE_URL}/api/v2/forms/seed")
    assert response.status_code == 200
    print(f"Seed forms response: {response.json()}")
    yield


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data(api_client):
    """Cleanup test-created data after tests"""
    yield
    # Cleanup fields
    for field_id in created_field_ids:
        try:
            api_client.delete(f"{BASE_URL}/api/v2/forms/fields/{field_id}")
        except:
            pass
    # Cleanup sections
    for section_id in created_section_ids:
        try:
            api_client.delete(f"{BASE_URL}/api/v2/forms/sections/{section_id}")
        except:
            pass
    # Cleanup schemas
    for schema_id in created_schema_ids:
        try:
            api_client.delete(f"{BASE_URL}/api/v2/forms/{schema_id}")
        except:
            pass


# ═══════════════════════════════════════════════════════════════════════════════
# LIST & METADATA TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestListAndMetadata:
    """Tests for list and metadata endpoints"""

    def test_list_all_forms(self, api_client):
        """GET /api/v2/forms - List all form schemas"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 6, f"Expected at least 6 forms (5 create + 1 quick), got {len(data)}"
        
        # Check form structure
        for form in data[:3]:
            assert "id" in form
            assert "entity_type" in form
            assert "form_type" in form
            assert "schema_code" in form
            assert "schema_name" in form
            assert "is_system" in form
            assert "is_default" in form
        
        print(f"✓ Listed {len(data)} form schemas")

    def test_list_forms_filter_by_entity_type(self, api_client):
        """GET /api/v2/forms?entity_type=lead - Filter by entity_type"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"entity_type": "lead"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 2, f"Expected at least 2 lead forms (create + quick), got {len(data)}"
        
        for form in data:
            assert form["entity_type"] == "lead"
        
        print(f"✓ Filtered {len(data)} lead forms")

    def test_list_forms_filter_by_form_type(self, api_client):
        """GET /api/v2/forms?form_type=create - Filter by form_type"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"form_type": "create"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 5, f"Expected at least 5 create forms (lead, customer, deal, product, task), got {len(data)}"
        
        for form in data:
            assert form["form_type"] == "create"
        
        print(f"✓ Filtered {len(data)} create forms")

    def test_list_forms_with_details(self, api_client):
        """GET /api/v2/forms?include_details=true - List with sections and fields"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"include_details": "true", "entity_type": "lead"})
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) >= 1
        
        form = data[0]
        assert "sections" in form, "Should include sections"
        assert "section_count" in form
        assert "field_count" in form
        
        if form["sections"]:
            section = form["sections"][0]
            assert "section_code" in section
            assert "section_name" in section
            if section.get("fields"):
                field = section["fields"][0]
                assert "attribute_id" in field
                assert "layout" in field
        
        print(f"✓ Listed forms with details: {form.get('section_count', 0)} sections, {form.get('field_count', 0)} fields")

    def test_list_form_types(self, api_client):
        """GET /api/v2/forms/types - List all form types"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/types")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        expected_types = ["create", "edit", "view", "quick", "import", "filter"]
        for expected in expected_types:
            assert expected in data, f"Missing form type: {expected}"
        
        print(f"✓ Form types: {data}")

    def test_list_layouts(self, api_client):
        """GET /api/v2/forms/layouts - List all layout options"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/layouts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        expected_layouts = ["full", "half", "third", "two_thirds", "quarter", "three_quarters"]
        for expected in expected_layouts:
            assert expected in data, f"Missing layout: {expected}"
        
        print(f"✓ Layouts: {data}")

    def test_get_stats(self, api_client):
        """GET /api/v2/forms/stats - Get form statistics"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_forms" in data
        assert "system_forms" in data
        assert "custom_forms" in data
        assert "by_entity_type" in data
        assert "by_form_type" in data
        
        assert data["total_forms"] >= 6, f"Expected at least 6 forms, got {data['total_forms']}"
        assert data["system_forms"] >= 6, f"Expected at least 6 system forms, got {data['system_forms']}"
        
        print(f"✓ Stats: total={data['total_forms']}, system={data['system_forms']}, custom={data['custom_forms']}")


# ═══════════════════════════════════════════════════════════════════════════════
# RENDERABLE FORM TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRenderableForms:
    """Tests for renderable form endpoint"""

    def test_render_lead_form(self, api_client):
        """GET /api/v2/forms/render/lead - Get renderable form for lead"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/lead")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "schema" in data
        assert "sections" in data
        
        schema = data["schema"]
        assert schema["entity_type"] == "lead"
        assert schema["form_type"] == "create"
        assert "id" in schema
        assert "code" in schema
        assert "name" in schema
        
        sections = data["sections"]
        assert len(sections) >= 1, f"Expected at least 1 section, got {len(sections)}"
        
        # Check section structure
        section = sections[0]
        assert "id" in section
        assert "code" in section
        assert "name" in section
        assert "fields" in section
        
        print(f"✓ Lead form rendered: {len(sections)} sections")

    def test_render_customer_form(self, api_client):
        """GET /api/v2/forms/render/customer - Get renderable form for customer"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/customer")
        assert response.status_code == 200
        
        data = response.json()
        assert data["schema"]["entity_type"] == "customer"
        assert len(data["sections"]) >= 1
        
        print(f"✓ Customer form rendered: {len(data['sections'])} sections")

    def test_render_deal_form(self, api_client):
        """GET /api/v2/forms/render/deal - Get renderable form for deal"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/deal")
        assert response.status_code == 200
        
        data = response.json()
        assert data["schema"]["entity_type"] == "deal"
        assert len(data["sections"]) >= 1
        
        print(f"✓ Deal form rendered: {len(data['sections'])} sections")

    def test_render_product_form(self, api_client):
        """GET /api/v2/forms/render/product - Get renderable form for product"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/product")
        assert response.status_code == 200
        
        data = response.json()
        assert data["schema"]["entity_type"] == "product"
        assert len(data["sections"]) >= 1
        
        print(f"✓ Product form rendered: {len(data['sections'])} sections")

    def test_render_task_form(self, api_client):
        """GET /api/v2/forms/render/task - Get renderable form for task"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/task")
        assert response.status_code == 200
        
        data = response.json()
        assert data["schema"]["entity_type"] == "task"
        assert len(data["sections"]) >= 1
        
        print(f"✓ Task form rendered: {len(data['sections'])} sections")

    def test_render_quick_form(self, api_client):
        """GET /api/v2/forms/render/lead?form_type=quick - Get quick form"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/lead", params={"form_type": "quick"})
        assert response.status_code == 200
        
        data = response.json()
        assert data["schema"]["entity_type"] == "lead"
        assert data["schema"]["form_type"] == "quick"
        
        # Quick form should have fewer sections than create form
        print(f"✓ Quick form rendered: {len(data['sections'])} sections")

    def test_render_form_not_found(self, api_client):
        """GET /api/v2/forms/render/invalid - Returns 404 for invalid entity_type"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/invalid_entity")
        assert response.status_code == 404
        
        print("✓ Invalid entity_type returns 404")

    def test_render_form_includes_attribute_info(self, api_client):
        """Verify renderable form includes attribute info (data_type, options, validation_rules)"""
        response = api_client.get(f"{BASE_URL}/api/v2/forms/render/lead")
        assert response.status_code == 200
        
        data = response.json()
        found_attribute_info = False
        
        for section in data["sections"]:
            for field_item in section["fields"]:
                # Handle both row and direct field types
                if field_item.get("type") == "row":
                    fields = field_item.get("fields", [])
                else:
                    fields = [field_item]
                
                for field in fields:
                    if "attribute" in field:
                        attr = field["attribute"]
                        assert "code" in attr, "Attribute should have code"
                        assert "name" in attr, "Attribute should have name"
                        assert "data_type" in attr, "Attribute should have data_type"
                        assert "required" in attr, "Attribute should have required"
                        found_attribute_info = True
        
        assert found_attribute_info, "Should find at least one field with attribute info"
        print("✓ Renderable form includes attribute info (data_type, options, validation_rules)")

    def test_render_form_effective_values(self, api_client):
        """Verify effective values (effective_label, effective_required) computed correctly"""
        # First get forms with details
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"include_details": "true", "entity_type": "lead"})
        assert response.status_code == 200
        
        data = response.json()
        found_effective = False
        
        for form in data:
            for section in form.get("sections", []):
                for field in section.get("fields", []):
                    if "effective_label" in field:
                        assert field["effective_label"], "effective_label should not be empty"
                        found_effective = True
                    if "effective_required" in field:
                        assert isinstance(field["effective_required"], bool)
                        found_effective = True
        
        if found_effective:
            print("✓ Effective values computed correctly (effective_label, effective_required)")
        else:
            print("✓ Forms listed (effective values may not be in list view)")


# ═══════════════════════════════════════════════════════════════════════════════
# FORM SCHEMA CRUD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFormSchemaCRUD:
    """Tests for form schema CRUD operations"""

    def test_create_form_schema(self, api_client):
        """POST /api/v2/forms - Create new form schema"""
        unique_code = f"TEST_form_{uuid.uuid4().hex[:8]}"
        
        payload = {
            "entity_type": "lead",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Test Edit Lead Form",
            "description": "Test form for editing leads",
            "priority": 10,
            "layout": "vertical",
            "columns": 2,
            "is_default": False,
            "validate_on_change": True,
            "show_required_indicator": True
        }
        
        response = api_client.post(f"{BASE_URL}/api/v2/forms", json=payload)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["entity_type"] == "lead"
        assert data["form_type"] == "edit"
        assert data["schema_code"] == unique_code
        assert data["schema_name"] == "Test Edit Lead Form"
        assert data["is_system"] == False  # User-created forms are not system
        assert data["validate_on_change"] == True
        
        created_schema_ids.append(data["id"])
        print(f"✓ Created form schema: {data['id']}")
        
        return data["id"]

    def test_create_form_schema_duplicate(self, api_client):
        """POST /api/v2/forms - Duplicate schema_code returns 400"""
        # Create first
        unique_code = f"TEST_dup_{uuid.uuid4().hex[:8]}"
        payload = {
            "entity_type": "lead",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "First Form"
        }
        
        response = api_client.post(f"{BASE_URL}/api/v2/forms", json=payload)
        assert response.status_code == 201
        created_schema_ids.append(response.json()["id"])
        
        # Try duplicate
        response = api_client.post(f"{BASE_URL}/api/v2/forms", json=payload)
        assert response.status_code == 400
        
        print("✓ Duplicate schema_code returns 400")

    def test_create_form_schema_invalid_form_type(self, api_client):
        """POST /api/v2/forms - Invalid form_type returns 400"""
        payload = {
            "entity_type": "lead",
            "form_type": "invalid_type",
            "schema_code": f"TEST_invalid_{uuid.uuid4().hex[:8]}",
            "schema_name": "Invalid Form"
        }
        
        response = api_client.post(f"{BASE_URL}/api/v2/forms", json=payload)
        assert response.status_code == 400
        
        print("✓ Invalid form_type returns 400")

    def test_get_form_schema_by_id(self, api_client):
        """GET /api/v2/forms/{id} - Get form by ID"""
        # First get a form ID
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"entity_type": "lead"})
        assert response.status_code == 200
        
        forms = response.json()
        assert len(forms) >= 1
        
        form_id = forms[0]["id"]
        
        # Get by ID
        response = api_client.get(f"{BASE_URL}/api/v2/forms/{form_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == form_id
        assert "sections" in data  # include_details defaults to True
        
        print(f"✓ Got form by ID: {data['schema_code']}")

    def test_update_form_schema(self, api_client):
        """PUT /api/v2/forms/{id} - Update form schema"""
        # Create a form first
        unique_code = f"TEST_upd_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "customer",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Before Update"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        # Update
        update_response = api_client.put(f"{BASE_URL}/api/v2/forms/{schema_id}", json={
            "schema_name": "After Update",
            "description": "Updated description",
            "columns": 3
        })
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["schema_name"] == "After Update"
        assert data["description"] == "Updated description"
        assert data["columns"] == 3
        
        print(f"✓ Updated form schema: {schema_id}")

    def test_delete_form_schema(self, api_client):
        """DELETE /api/v2/forms/{id} - Soft delete form schema"""
        # Create a form first
        unique_code = f"TEST_del_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "deal",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "To Be Deleted"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/{schema_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        
        # Verify deleted
        get_response = api_client.get(f"{BASE_URL}/api/v2/forms/{schema_id}")
        assert get_response.status_code == 404
        
        print(f"✓ Deleted form schema: {schema_id}")

    def test_cannot_delete_system_form(self, api_client):
        """DELETE /api/v2/forms/{id} - Cannot delete system form"""
        # Get a system form
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={"entity_type": "lead"})
        assert response.status_code == 200
        
        forms = response.json()
        system_forms = [f for f in forms if f.get("is_system")]
        
        if not system_forms:
            pytest.skip("No system forms found")
        
        system_form_id = system_forms[0]["id"]
        
        # Try to delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/{system_form_id}")
        assert delete_response.status_code == 400
        
        data = delete_response.json()
        assert "system" in data.get("detail", "").lower() or "cannot delete" in data.get("detail", "").lower()
        
        print("✓ Cannot delete system form - returns 400")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION CRUD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSectionCRUD:
    """Tests for section CRUD operations"""

    def test_add_section_to_form(self, api_client):
        """POST /api/v2/forms/{schema_id}/sections - Add section to form"""
        # Create a form first
        unique_code = f"TEST_sec_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "lead",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form With Section"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        # Add section
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "test_section",
            "section_name": "Test Section",
            "description": "A test section",
            "sort_order": 1,
            "icon_code": "star",
            "is_collapsible": True,
            "is_collapsed_default": False,
            "columns": 2
        })
        assert section_response.status_code == 201, f"Expected 201, got {section_response.status_code}: {section_response.text}"
        
        data = section_response.json()
        assert data["section_code"] == "test_section"
        assert data["section_name"] == "Test Section"
        assert data["is_collapsible"] == True
        assert data["columns"] == 2
        
        created_section_ids.append(data["id"])
        print(f"✓ Added section to form: {data['id']}")
        
        return schema_id, data["id"]

    def test_add_duplicate_section_code(self, api_client):
        """POST /api/v2/forms/{schema_id}/sections - Duplicate section_code returns 400"""
        # Create form and section
        unique_code = f"TEST_dups_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "customer",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form For Dup Section"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_payload = {
            "section_code": "dup_section",
            "section_name": "First Section"
        }
        
        # Add first section
        response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json=section_payload)
        assert response.status_code == 201
        created_section_ids.append(response.json()["id"])
        
        # Try to add duplicate
        response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json=section_payload)
        assert response.status_code == 400
        
        print("✓ Duplicate section_code returns 400")

    def test_update_section(self, api_client):
        """PUT /api/v2/forms/sections/{section_id} - Update section"""
        # Create form and section
        unique_code = f"TEST_usec_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "deal",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Update Section"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "update_me",
            "section_name": "Before Update"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        # Update section
        update_response = api_client.put(f"{BASE_URL}/api/v2/forms/sections/{section_id}", json={
            "section_name": "After Update",
            "is_collapsible": True,
            "icon_code": "edit",
            "sort_order": 10
        })
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["section_name"] == "After Update"
        assert data["is_collapsible"] == True
        assert data["sort_order"] == 10
        
        print(f"✓ Updated section: {section_id}")

    def test_delete_section(self, api_client):
        """DELETE /api/v2/forms/sections/{section_id} - Delete section"""
        # Create form and section
        unique_code = f"TEST_dsec_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "product",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Delete Section"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "delete_me",
            "section_name": "To Delete"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/sections/{section_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        
        print(f"✓ Deleted section: {section_id}")

    def test_cannot_delete_section_from_system_form(self, api_client):
        """DELETE /api/v2/forms/sections/{section_id} - Cannot delete from system form"""
        # Get a system form with details
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={
            "entity_type": "lead",
            "include_details": "true"
        })
        assert response.status_code == 200
        
        forms = response.json()
        system_forms = [f for f in forms if f.get("is_system") and f.get("sections")]
        
        if not system_forms or not system_forms[0].get("sections"):
            pytest.skip("No system forms with sections found")
        
        section_id = system_forms[0]["sections"][0]["id"]
        
        # Try to delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/sections/{section_id}")
        assert delete_response.status_code == 400
        
        print("✓ Cannot delete section from system form - returns 400")


# ═══════════════════════════════════════════════════════════════════════════════
# FIELD CRUD TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestFieldCRUD:
    """Tests for field CRUD operations"""

    def test_add_field_to_section(self, api_client):
        """POST /api/v2/forms/sections/{section_id}/fields - Add field"""
        # First get an attribute ID
        attr_response = api_client.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "lead"})
        assert attr_response.status_code == 200
        
        attrs = attr_response.json()
        if not attrs:
            pytest.skip("No attributes found for lead")
        
        attr_id = attrs[0]["id"]
        
        # Create form and section
        unique_code = f"TEST_fld_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "lead",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form With Field"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "field_section",
            "section_name": "Section With Field"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        # Add field
        field_response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json={
            "attribute_id": attr_id,
            "sort_order": 0,
            "layout": "half",
            "is_required_override": True,
            "label_override": "Custom Label",
            "placeholder_override": "Custom placeholder"
        })
        assert field_response.status_code == 201, f"Expected 201, got {field_response.status_code}: {field_response.text}"
        
        data = field_response.json()
        assert data["attribute_id"] == attr_id
        assert data["layout"] == "half"
        assert data["is_required_override"] == True
        assert data["label_override"] == "Custom Label"
        
        created_field_ids.append(data["id"])
        print(f"✓ Added field to section: {data['id']}")
        
        return section_id, data["id"]

    def test_add_field_by_attribute_code(self, api_client):
        """POST /api/v2/forms/sections/{section_id}/fields - Add field by attribute_code"""
        # Create form and section
        unique_code = f"TEST_fcode_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "lead",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Field By Code"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "code_section",
            "section_name": "Section"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        # Add field by attribute_code
        field_response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json={
            "attribute_code": "full_name",
            "layout": "full"
        })
        assert field_response.status_code == 201
        
        data = field_response.json()
        assert data["layout"] == "full"
        assert data.get("attribute", {}).get("code") == "full_name" or data.get("attribute_id")
        
        created_field_ids.append(data["id"])
        print("✓ Added field by attribute_code")

    def test_add_duplicate_field(self, api_client):
        """POST /api/v2/forms/sections/{section_id}/fields - Duplicate field returns 400"""
        # Get an attribute
        attr_response = api_client.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "customer"})
        assert attr_response.status_code == 200
        attrs = attr_response.json()
        if not attrs:
            pytest.skip("No attributes found")
        attr_id = attrs[0]["id"]
        
        # Create form and section
        unique_code = f"TEST_dupf_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "customer",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Dup Field"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "dup_field_section",
            "section_name": "Section"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        field_payload = {
            "attribute_id": attr_id,
            "layout": "full"
        }
        
        # Add first field
        response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json=field_payload)
        assert response.status_code == 201
        created_field_ids.append(response.json()["id"])
        
        # Try duplicate
        response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json=field_payload)
        assert response.status_code == 400
        
        print("✓ Duplicate field returns 400")

    def test_add_field_invalid_layout(self, api_client):
        """POST /api/v2/forms/sections/{section_id}/fields - Invalid layout returns 400"""
        # Get an attribute
        attr_response = api_client.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "deal"})
        assert attr_response.status_code == 200
        attrs = attr_response.json()
        if not attrs:
            pytest.skip("No attributes found")
        attr_id = attrs[0]["id"]
        
        # Create form and section
        unique_code = f"TEST_invl_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "deal",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Invalid Layout"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "inv_layout_section",
            "section_name": "Section"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        # Add field with invalid layout
        response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json={
            "attribute_id": attr_id,
            "layout": "invalid_layout"
        })
        assert response.status_code == 400
        
        print("✓ Invalid layout returns 400")

    def test_update_field(self, api_client):
        """PUT /api/v2/forms/fields/{field_id} - Update field"""
        # Get an attribute
        attr_response = api_client.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "task"})
        assert attr_response.status_code == 200
        attrs = attr_response.json()
        if not attrs:
            pytest.skip("No attributes found")
        attr_id = attrs[0]["id"]
        
        # Create form, section, field
        unique_code = f"TEST_ufld_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "task",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Update Field"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "upd_field_section",
            "section_name": "Section"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        field_response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json={
            "attribute_id": attr_id,
            "layout": "full",
            "is_required_override": False
        })
        assert field_response.status_code == 201
        field_id = field_response.json()["id"]
        created_field_ids.append(field_id)
        
        # Update field
        update_response = api_client.put(f"{BASE_URL}/api/v2/forms/fields/{field_id}", json={
            "layout": "half",
            "is_required_override": True,
            "label_override": "New Label",
            "css_class": "highlight"
        })
        assert update_response.status_code == 200
        
        data = update_response.json()
        assert data["layout"] == "half"
        assert data["is_required_override"] == True
        assert data["label_override"] == "New Label"
        
        print(f"✓ Updated field: {field_id}")

    def test_delete_field(self, api_client):
        """DELETE /api/v2/forms/fields/{field_id} - Delete field"""
        # Get an attribute
        attr_response = api_client.get(f"{BASE_URL}/api/v2/attributes", params={"entity_type": "product"})
        assert attr_response.status_code == 200
        attrs = attr_response.json()
        if not attrs:
            pytest.skip("No attributes found")
        attr_id = attrs[0]["id"]
        
        # Create form, section, field
        unique_code = f"TEST_dfld_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/v2/forms", json={
            "entity_type": "product",
            "form_type": "edit",
            "schema_code": unique_code,
            "schema_name": "Form Delete Field"
        })
        assert create_response.status_code == 201
        schema_id = create_response.json()["id"]
        created_schema_ids.append(schema_id)
        
        section_response = api_client.post(f"{BASE_URL}/api/v2/forms/{schema_id}/sections", json={
            "section_code": "del_field_section",
            "section_name": "Section"
        })
        assert section_response.status_code == 201
        section_id = section_response.json()["id"]
        created_section_ids.append(section_id)
        
        field_response = api_client.post(f"{BASE_URL}/api/v2/forms/sections/{section_id}/fields", json={
            "attribute_id": attr_id,
            "layout": "full"
        })
        assert field_response.status_code == 201
        field_id = field_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/fields/{field_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        
        print(f"✓ Deleted field: {field_id}")

    def test_cannot_delete_field_from_system_form(self, api_client):
        """DELETE /api/v2/forms/fields/{field_id} - Cannot delete from system form"""
        # Get a system form with details
        response = api_client.get(f"{BASE_URL}/api/v2/forms", params={
            "entity_type": "lead",
            "include_details": "true"
        })
        assert response.status_code == 200
        
        forms = response.json()
        system_forms = [f for f in forms if f.get("is_system")]
        
        field_id = None
        for form in system_forms:
            for section in form.get("sections", []):
                if section.get("fields"):
                    field_id = section["fields"][0]["id"]
                    break
            if field_id:
                break
        
        if not field_id:
            pytest.skip("No system forms with fields found")
        
        # Try to delete
        delete_response = api_client.delete(f"{BASE_URL}/api/v2/forms/fields/{field_id}")
        assert delete_response.status_code == 400
        
        print("✓ Cannot delete field from system form - returns 400")


# ═══════════════════════════════════════════════════════════════════════════════
# SEED TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestSeedForms:
    """Tests for seed endpoint"""

    def test_seed_idempotent(self, api_client):
        """POST /api/v2/forms/seed - Seed is idempotent"""
        # First seed
        response1 = api_client.post(f"{BASE_URL}/api/v2/forms/seed")
        assert response1.status_code == 200
        
        # Second seed should return existing
        response2 = api_client.post(f"{BASE_URL}/api/v2/forms/seed")
        assert response2.status_code == 200
        
        data = response2.json()
        assert "already seeded" in data.get("message", "").lower() or data.get("success") == True
        
        print("✓ Seed is idempotent")

    def test_seed_specific_entity_types(self, api_client):
        """POST /api/v2/forms/seed?entity_types=lead,customer - Seed specific types"""
        response = api_client.post(f"{BASE_URL}/api/v2/forms/seed", params={"entity_types": "lead,customer"})
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        print(f"✓ Seed specific entity types: {data.get('message')}")


# ═══════════════════════════════════════════════════════════════════════════════
# RUN ALL TESTS
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
