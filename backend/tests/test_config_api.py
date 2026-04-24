"""
ProHouzing Config API Tests
Version: 1.0 - Prompt 3/20

Tests for Dynamic Data Foundation:
- Master Data API endpoints (picklists, statuses, categories)
- Entity Schemas API endpoints (field definitions, forms)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com').rstrip('/')


class TestMasterDataAPI:
    """Test Master Data API endpoints"""
    
    def test_get_all_master_data(self):
        """GET /api/config/master-data returns all master data categories"""
        response = requests.get(f"{BASE_URL}/api/config/master-data")
        assert response.status_code == 200
        
        data = response.json()
        # Should have 21 categories as per requirements
        assert len(data) >= 20, f"Expected at least 20 categories, got {len(data)}"
        
        # Verify key categories exist
        expected_categories = [
            'lead_statuses', 'lead_sources', 'lead_segments',
            'property_types', 'product_statuses', 'deal_stages',
            'task_statuses', 'task_priorities', 'task_types',
            'campaign_types', 'campaign_statuses', 'loss_reasons',
            'provinces', 'price_ranges', 'area_ranges',
            'project_statuses', 'user_roles', 'activity_types',
            'contract_statuses', 'payment_methods', 'booking_statuses'
        ]
        
        for cat in expected_categories:
            assert cat in data, f"Missing category: {cat}"
            assert 'items' in data[cat], f"Category {cat} missing 'items'"
            assert 'label' in data[cat], f"Category {cat} missing 'label'"
    
    def test_get_lead_statuses_category(self):
        """GET /api/config/master-data/lead_statuses returns lead statuses"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert data['key'] == 'lead_statuses'
        assert data['label'] == 'Trạng thái Lead'
        assert len(data['items']) >= 10, f"Expected at least 10 lead statuses, got {len(data['items'])}"
        
        # Verify structure of items
        item = data['items'][0]
        assert 'code' in item
        assert 'label' in item
        assert 'is_active' in item
    
    def test_get_lead_sources_category(self):
        """GET /api/config/master-data/lead_sources returns lead sources"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_sources")
        assert response.status_code == 200
        
        data = response.json()
        assert data['key'] == 'lead_sources'
        assert data['label'] == 'Nguồn Lead'
        assert len(data['items']) >= 10, f"Expected at least 10 lead sources, got {len(data['items'])}"
        
        # Verify specific sources exist
        source_codes = [item['code'] for item in data['items']]
        assert 'facebook' in source_codes
        assert 'website' in source_codes
        assert 'zalo' in source_codes
    
    def test_get_nonexistent_category_returns_404(self):
        """GET /api/config/master-data/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/nonexistent_category")
        assert response.status_code == 404
    
    def test_get_master_data_items(self):
        """GET /api/config/master-data/lead_statuses/items returns items list"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_statuses/items")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10
        
        # Verify item structure
        item = data[0]
        assert 'code' in item
        assert 'label' in item
        assert 'order' in item
    
    def test_get_master_data_select_options(self):
        """GET /api/config/master-data/lead_sources/select-options returns simple options"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_sources/select-options")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify simple format
        option = data[0]
        assert 'value' in option
        assert 'label' in option
    
    def test_get_single_master_data_item(self):
        """GET /api/config/master-data/lead_statuses/item/new returns specific item"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_statuses/item/new")
        assert response.status_code == 200
        
        data = response.json()
        assert data['code'] == 'new'
        assert data['label'] == 'Mới'
    
    def test_get_label_for_code(self):
        """GET /api/config/master-data/lead_statuses/label/hot returns label"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_statuses/label/hot")
        assert response.status_code == 200
        
        data = response.json()
        assert data['code'] == 'hot'
        assert data['label'] == 'Nóng'


class TestEntitySchemasAPI:
    """Test Entity Schemas API endpoints"""
    
    def test_list_all_entity_schemas(self):
        """GET /api/config/entity-schemas returns all entity schemas"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 5, f"Expected 5 entity schemas, got {len(data)}"
        
        # Verify expected entities exist
        entity_names = [e['entity'] for e in data]
        assert 'lead' in entity_names
        assert 'task' in entity_names
        assert 'project' in entity_names
        assert 'deal' in entity_names
        assert 'customer' in entity_names
    
    def test_get_lead_entity_schema(self):
        """GET /api/config/entity-schemas/lead returns lead schema with fields and sections"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/lead")
        assert response.status_code == 200
        
        data = response.json()
        assert data['entity'] == 'lead'
        assert data['label'] == 'Lead'
        assert data['primary_field'] == 'full_name'
        
        # Verify fields exist
        assert 'fields' in data
        assert len(data['fields']) >= 15, f"Expected at least 15 fields, got {len(data['fields'])}"
        
        # Verify sections exist
        assert 'sections' in data
        assert len(data['sections']) >= 5, f"Expected at least 5 sections, got {len(data['sections'])}"
        
        # Verify key fields
        field_keys = [f['key'] for f in data['fields']]
        assert 'full_name' in field_keys
        assert 'phone' in field_keys
        assert 'email' in field_keys
        assert 'status' in field_keys
        assert 'source' in field_keys
    
    def test_get_lead_form_config(self):
        """GET /api/config/entity-schemas/lead/form-config returns form configuration"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/lead/form-config")
        assert response.status_code == 200
        
        data = response.json()
        assert data['entity'] == 'lead'
        assert 'sections' in data
        
        # Verify sections have fields
        for section in data['sections']:
            assert 'key' in section
            assert 'label' in section
            assert 'fields' in section
            
            # Verify field structure
            for field in section['fields']:
                assert 'key' in field
                assert 'label' in field
                assert 'type' in field
    
    def test_get_task_entity_schema(self):
        """GET /api/config/entity-schemas/task returns task schema"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/task")
        assert response.status_code == 200
        
        data = response.json()
        assert data['entity'] == 'task'
        assert data['label'] == 'Task'
        assert data['primary_field'] == 'title'
    
    def test_get_project_entity_schema(self):
        """GET /api/config/entity-schemas/project returns project schema"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/project")
        assert response.status_code == 200
        
        data = response.json()
        assert data['entity'] == 'project'
        assert data['label'] == 'Dự án'
    
    def test_get_entity_fields_with_filter(self):
        """GET /api/config/entity-schemas/lead/fields?flag=required returns filtered fields"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/lead/fields?flag=required")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # All returned fields should have 'required' flag
        for field in data:
            assert 'required' in field['flags'], f"Field {field['key']} missing 'required' flag"
    
    def test_get_entity_list_config(self):
        """GET /api/config/entity-schemas/lead/list-config returns list/table config"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/lead/list-config")
        assert response.status_code == 200
        
        data = response.json()
        assert data['entity'] == 'lead'
        assert 'columns' in data
        assert 'filters' in data
        assert 'primary_field' in data
    
    def test_get_nonexistent_entity_returns_404(self):
        """GET /api/config/entity-schemas/nonexistent returns 404"""
        response = requests.get(f"{BASE_URL}/api/config/entity-schemas/nonexistent_entity")
        assert response.status_code == 404


class TestUtilityEndpoints:
    """Test utility endpoints"""
    
    def test_list_all_categories(self):
        """GET /api/config/categories returns list of all category/entity keys"""
        response = requests.get(f"{BASE_URL}/api/config/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert 'categories' in data
        assert 'entities' in data
        assert len(data['categories']) >= 20
        assert len(data['entities']) == 5
    
    def test_resolve_labels(self):
        """GET /api/config/resolve-labels resolves multiple codes at once"""
        response = requests.get(f"{BASE_URL}/api/config/resolve-labels?category=lead_statuses&codes=new,hot,contacted")
        assert response.status_code == 200
        
        data = response.json()
        assert 'new' in data
        assert 'hot' in data
        assert 'contacted' in data
        assert data['new'] == 'Mới'
        assert data['hot'] == 'Nóng'


class TestMasterDataContent:
    """Verify master data content correctness"""
    
    def test_lead_statuses_content(self):
        """Verify lead_statuses has correct content"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/lead_statuses")
        data = response.json()
        
        items = {item['code']: item for item in data['items']}
        
        # Verify key statuses
        assert 'new' in items
        assert 'hot' in items
        assert 'closed_won' in items
        assert 'closed_lost' in items
        
        # Verify groups
        assert items['new']['group'] == 'prospect'
        assert items['hot']['group'] == 'engaged'
    
    def test_provinces_content(self):
        """Verify provinces has key Vietnamese cities"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/provinces")
        data = response.json()
        
        province_codes = [item['code'] for item in data['items']]
        
        assert 'HN' in province_codes  # Hà Nội
        assert 'HCM' in province_codes  # TP. Hồ Chí Minh
        assert 'DN' in province_codes  # Đà Nẵng
    
    def test_deal_stages_content(self):
        """Verify deal_stages has pipeline stages"""
        response = requests.get(f"{BASE_URL}/api/config/master-data/deal_stages")
        data = response.json()
        
        stage_codes = [item['code'] for item in data['items']]
        
        assert 'lead' in stage_codes
        assert 'qualified' in stage_codes
        assert 'negotiation' in stage_codes
        assert 'won' in stage_codes
        assert 'lost' in stage_codes


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
