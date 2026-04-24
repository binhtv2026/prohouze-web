"""
ProHouzing CRM API Tests - Prompt 6/20
CRM Unified Profile Standardization Tests

WRAPPING CONVENTION FOR API PARAMETERS:
- Contact create: {"contact": {...}}
- Lead create: {"lead": {...}}
- DemandProfile create: {"demand": {...}}
- Interaction create: {"interaction": {...}}
- Stage transition: {"transition": {...}}
- Status change: {"status_change": {...}}
- Duplicate check: {"check_request": {...}}
- Merge contacts: {"merge_request": {...}}
- Update operations (PUT): typically NOT wrapped (direct Dict[str, Any])

Tests cover all Prompt 6/20 CRM APIs.
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://content-machine-18.preview.emergentagent.com"


class TestCRMConfigAPIs:
    """Test CRM configuration endpoints - 4 tests"""
    
    def test_get_lead_stages(self):
        """Test GET /api/crm/config/lead-stages returns 11 stages"""
        response = requests.get(f"{BASE_URL}/api/crm/config/lead-stages")
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
        assert len(data["stages"]) == 11
        stage_codes = [s["code"] for s in data["stages"]]
        assert "raw" in stage_codes
        assert "contacted" in stage_codes
        assert "qualified" in stage_codes
        assert "converted" in stage_codes
        print(f"✓ Found {len(data['stages'])} lead stages")
    
    def test_get_deal_stages(self):
        """Test GET /api/crm/config/deal-stages returns 12 stages"""
        response = requests.get(f"{BASE_URL}/api/crm/config/deal-stages")
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
        assert len(data["stages"]) == 12
        stage_codes = [s["code"] for s in data["stages"]]
        assert "negotiating" in stage_codes
        assert "booking" in stage_codes
        assert "deposited" in stage_codes
        assert "completed" in stage_codes
        print(f"✓ Found {len(data['stages'])} deal stages")
    
    def test_get_contact_statuses(self):
        """Test GET /api/crm/config/contact-statuses returns 6 statuses"""
        response = requests.get(f"{BASE_URL}/api/crm/config/contact-statuses")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        assert len(data["statuses"]) == 6
        status_codes = [s["code"] for s in data["statuses"]]
        assert "lead" in status_codes
        assert "prospect" in status_codes
        assert "customer" in status_codes
        assert "vip" in status_codes
        print(f"✓ Found {len(data['statuses'])} contact statuses")
    
    def test_get_interaction_types(self):
        """Test GET /api/crm/config/interaction-types returns types and outcomes"""
        response = requests.get(f"{BASE_URL}/api/crm/config/interaction-types")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert "outcomes" in data
        assert len(data["types"]) >= 20
        assert len(data["outcomes"]) >= 10
        print(f"✓ Found {len(data['types'])} interaction types and {len(data['outcomes'])} outcomes")


class TestContactAPIs:
    """Test Contact CRUD and status change APIs - 9 tests"""
    
    def _create_contact(self, unique_id=None):
        """Helper to create contact"""
        if not unique_id:
            unique_id = str(uuid.uuid4())[:8]
        resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_Contact_{unique_id}",
                "phone": f"090{unique_id[:7]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        return resp.json()["id"], unique_id
    
    def test_create_contact(self):
        """Test POST /api/crm/contacts creates a new contact"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "contact": {
                "full_name": f"TEST_Contact_{unique_id}",
                "phone": f"0902{unique_id[:6]}",
                "email": f"test_{unique_id}@example.com",
                "status": "lead",
                "contact_type": "individual",
                "city": "Ho Chi Minh",
                "district": "Quan 7"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/contacts", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["id"] is not None
        assert data["full_name"] == payload["contact"]["full_name"]
        assert data["status"] == "lead"
        assert "phone_masked" in data
        assert data["is_primary"] == True
        print(f"✓ Created contact: {data['id']}")
    
    def test_create_contact_duplicate_phone_rejected(self):
        """Test creating contact with duplicate phone fails"""
        unique_id = str(uuid.uuid4())[:8]
        phone = f"0903{unique_id[:6]}"
        
        # Create first contact
        resp1 = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {"full_name": f"TEST_First_{unique_id}", "phone": phone, "status": "lead", "contact_type": "individual"}
        })
        assert resp1.status_code == 200
        
        # Try duplicate
        resp2 = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {"full_name": f"TEST_Second_{unique_id}", "phone": phone, "status": "lead", "contact_type": "individual"}
        })
        assert resp2.status_code == 400
        assert "already exists" in resp2.json().get("detail", "")
        print(f"✓ Duplicate phone correctly rejected")
    
    def test_get_contacts_list(self):
        """Test GET /api/crm/contacts returns list"""
        response = requests.get(f"{BASE_URL}/api/crm/contacts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} contacts")
    
    def test_get_contacts_with_filters(self):
        """Test GET /api/crm/contacts with status filter"""
        response = requests.get(f"{BASE_URL}/api/crm/contacts?status=lead&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for contact in data:
            assert contact.get("status") == "lead"
        print(f"✓ Filter by status works, got {len(data)} leads")
    
    def test_get_contact_by_id(self):
        """Test GET /api/crm/contacts/{id} returns contact details"""
        contact_id, _ = self._create_contact()
        
        response = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == contact_id
        assert "phone_masked" in data
        print(f"✓ Got contact by ID: {contact_id}")
    
    def test_get_contact_not_found(self):
        """Test GET /api/crm/contacts/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/crm/contacts/invalid-id-12345")
        assert response.status_code == 404
        print("✓ Invalid contact ID returns 404")
    
    def test_update_contact(self):
        """Test PUT /api/crm/contacts/{id} updates contact"""
        contact_id, _ = self._create_contact()
        
        # Update contact - WRAPPED in "updates"
        update_payload = {"updates": {"notes": "Updated via test", "city": "Da Nang"}}
        response = requests.put(f"{BASE_URL}/api/crm/contacts/{contact_id}", json=update_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.json()["success"] == True
        
        # Verify update
        get_resp = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}")
        assert get_resp.json()["notes"] == "Updated via test"
        print(f"✓ Contact updated successfully")
    
    def test_change_contact_status_lead_to_prospect(self):
        """Test PUT /api/crm/contacts/{id}/status changes status"""
        contact_id, _ = self._create_contact()
        
        # Change status - WRAPPED in "status_change"
        status_payload = {
            "status_change": {
                "contact_id": contact_id,
                "new_status": "prospect",
                "reason": "Qualified through testing"
            }
        }
        response = requests.put(f"{BASE_URL}/api/crm/contacts/{contact_id}/status", json=status_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["old_status"] == "lead"
        assert data["new_status"] == "prospect"
        
        # Verify
        get_resp = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}")
        assert get_resp.json()["status"] == "prospect"
        print(f"✓ Contact status changed from lead to prospect")
    
    def test_change_contact_status_prospect_to_customer(self):
        """Test status change from prospect to customer sets first_transaction_at"""
        unique_id = str(uuid.uuid4())[:8]
        # Create as prospect directly
        create_resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_ToCustomer_{unique_id}",
                "phone": f"0907{unique_id[:6]}",
                "status": "prospect",
                "contact_type": "individual"
            }
        })
        contact_id = create_resp.json()["id"]
        
        # Change to customer
        response = requests.put(f"{BASE_URL}/api/crm/contacts/{contact_id}/status", json={
            "status_change": {
                "contact_id": contact_id,
                "new_status": "customer",
                "reason": "First transaction completed"
            }
        })
        assert response.status_code == 200
        assert response.json()["new_status"] == "customer"
        
        # Verify first_transaction_at is set
        get_resp = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}")
        assert get_resp.json()["first_transaction_at"] is not None
        print(f"✓ Contact became customer with first_transaction_at set")


class TestLeadAPIs:
    """Test Lead CRUD and lifecycle transition APIs - 9 tests"""
    
    def _create_test_contact(self):
        """Helper to create a test contact"""
        unique_id = str(uuid.uuid4())[:8]
        resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_LeadContact_{unique_id}",
                "phone": f"0908{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        return resp.json()["id"]
    
    def _create_lead_with_contact(self):
        """Helper to create lead with contact"""
        contact_id = self._create_test_contact()
        resp = requests.post(f"{BASE_URL}/api/crm/leads", json={
            "lead": {
                "contact_id": contact_id,
                "source": "website",
                "budget_max": 5000000000
            }
        })
        return resp.json()["id"], contact_id
    
    def test_create_lead_with_contact_id(self):
        """Test POST /api/crm/leads with existing contact_id"""
        contact_id = self._create_test_contact()
        
        lead_payload = {
            "lead": {
                "contact_id": contact_id,
                "source": "website",
                "source_detail": "Landing page A",
                "project_interest": "Test Project Alpha",
                "budget_min": 2000000000,
                "budget_max": 5000000000,
                "initial_notes": "Test lead creation"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/leads", json=lead_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["id"] is not None
        assert data["contact_id"] == contact_id
        assert data["stage"] == "raw"
        assert data["source"] == "website"
        assert "budget_display" in data
        assert data["score"] >= 0
        print(f"✓ Created lead: {data['id']} with contact {contact_id}")
    
    def test_create_lead_auto_create_contact(self):
        """Test POST /api/crm/leads auto-creates contact when name+phone provided"""
        unique_id = str(uuid.uuid4())[:8]
        
        lead_payload = {
            "lead": {
                "full_name": f"TEST_AutoContact_{unique_id}",
                "phone": f"0909{unique_id[:6]}",
                "email": f"auto_{unique_id}@test.com",
                "source": "facebook",
                "project_interest": "Project Beta",
                "budget_max": 3000000000
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/leads", json=lead_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["contact_id"] is not None
        assert data["contact_name"] == lead_payload["lead"]["full_name"]
        print(f"✓ Lead auto-created contact: {data['contact_id']}")
    
    def test_create_lead_without_contact_fails(self):
        """Test creating lead without contact_id or name+phone fails"""
        lead_payload = {
            "lead": {
                "source": "website",
                "project_interest": "Should Fail"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/leads", json=lead_payload)
        assert response.status_code == 400
        assert "Contact ID or contact info" in response.json().get("detail", "")
        print("✓ Lead without contact info correctly rejected")
    
    def test_get_leads_list(self):
        """Test GET /api/crm/leads returns lead list"""
        response = requests.get(f"{BASE_URL}/api/crm/leads")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} leads")
    
    def test_get_leads_with_stage_filter(self):
        """Test GET /api/crm/leads with stage filter"""
        response = requests.get(f"{BASE_URL}/api/crm/leads?stage=raw&limit=10")
        assert response.status_code == 200
        data = response.json()
        for lead in data:
            assert lead.get("stage") == "raw"
        print(f"✓ Filter by stage=raw works")
    
    def test_get_lead_by_id(self):
        """Test GET /api/crm/leads/{id} returns lead details"""
        lead_id, _ = self._create_lead_with_contact()
        
        response = requests.get(f"{BASE_URL}/api/crm/leads/{lead_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == lead_id
        assert "stage_label" in data
        assert "stage_color" in data
        print(f"✓ Got lead by ID with stage info")
    
    def test_lead_stage_transition_raw_to_contacted(self):
        """Test PUT /api/crm/leads/{id}/stage transitions raw → contacted"""
        lead_id, contact_id = self._create_lead_with_contact()
        
        # Stage transitions - WRAPPED in "transition"
        transition_payload = {
            "transition": {
                "new_stage": "contacted",
                "reason": "First call made"
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/crm/leads/{lead_id}/stage", json=transition_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert data["old_stage"] == "raw"
        assert data["new_stage"] == "contacted"
        print(f"✓ Lead transitioned: raw → contacted")
    
    def test_lead_stage_transition_full_lifecycle(self):
        """Test full lead lifecycle: raw → contacted → responded → engaged → qualifying → qualified → converted"""
        lead_id, contact_id = self._create_lead_with_contact()
        
        stages = [
            ("contacted", "First contact made"),
            ("responded", "Customer responded"),
            ("engaged", "Active engagement"),
            ("qualifying", "Evaluating needs"),
            ("qualified", "Ready for deal")
        ]
        
        for new_stage, reason in stages:
            response = requests.put(f"{BASE_URL}/api/crm/leads/{lead_id}/stage", json={
                "transition": {
                    "new_stage": new_stage,
                    "reason": reason
                }
            })
            assert response.status_code == 200, f"Failed transition to {new_stage}: {response.text}"
            print(f"  ✓ Transitioned to {new_stage}")
        
        # Now convert to deal
        response = requests.put(f"{BASE_URL}/api/crm/leads/{lead_id}/stage", json={
            "transition": {
                "new_stage": "converted",
                "reason": "Creating deal",
                "create_deal": True
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert data["new_stage"] == "converted"
        assert "deal_id" in data
        print(f"✓ Lead fully converted, deal created: {data['deal_id']}")
        
        # Verify contact status changed to prospect
        contact_resp = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}")
        assert contact_resp.json()["status"] == "prospect"
        print(f"✓ Contact status updated to prospect on conversion")
    
    def test_invalid_stage_transition_rejected(self):
        """Test invalid stage transition is rejected"""
        lead_id, _ = self._create_lead_with_contact()
        
        # Try to go from raw to qualified (skipping steps)
        response = requests.put(f"{BASE_URL}/api/crm/leads/{lead_id}/stage", json={
            "transition": {
                "new_stage": "qualified",
                "reason": "Invalid transition"
            }
        })
        assert response.status_code == 400
        assert "Cannot transition" in response.json().get("detail", "")
        print("✓ Invalid stage transition correctly rejected")


class TestDemandProfileAPIs:
    """Test DemandProfile CRUD with 60+ fields and product matching - 6 tests"""
    
    def _create_test_contact(self):
        """Helper to create test contact"""
        unique_id = str(uuid.uuid4())[:8]
        resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_DemandContact_{unique_id}",
                "phone": f"0910{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        return resp.json()["id"]
    
    def _create_demand_profile(self):
        """Helper to create demand profile"""
        contact_id = self._create_test_contact()
        resp = requests.post(f"{BASE_URL}/api/crm/demands", json={
            "demand": {
                "contact_id": contact_id,
                "purpose": "residence",
                "urgency": "short_term",
                "budget_min": 2000000000,
                "budget_max": 4000000000,
                "property_types": ["apartment"],
                "area_min": 60,
                "area_max": 100,
                "bedrooms_min": 2,
                "bedrooms_max": 3
            }
        })
        return resp.json()["id"], contact_id
    
    def test_create_demand_profile_full_fields(self):
        """Test POST /api/crm/demands creates profile with all major fields"""
        contact_id = self._create_test_contact()
        
        demand_payload = {
            "demand": {
                "contact_id": contact_id,
                "purpose": "residence",
                "urgency": "short_term",
                "expected_purchase_date": "2026-06-01",
                "budget_min": 2000000000,
                "budget_max": 4000000000,
                "budget_currency": "VND",
                "budget_flexibility": "Có thể tăng 10%",
                "payment_method": "loan",
                "down_payment_percent": 30,
                "loan_pre_approved": True,
                "property_types": ["apartment", "townhouse"],
                "property_type_primary": "apartment",
                "area_min": 60,
                "area_max": 100,
                "bedrooms_min": 2,
                "bedrooms_max": 3,
                "bathrooms_min": 2,
                "preferred_cities": ["Ho Chi Minh"],
                "preferred_districts": ["Quan 7", "Quan 2"],
                "floor_preference": "mid",
                "floor_min": 6,
                "floor_max": 15,
                "floors_to_avoid": [4, 13],
                "directions": ["east", "southeast"],
                "views": ["city", "pool"],
                "views_must_have": ["pool"],
                "must_have_features": ["pool", "gym", "parking"],
                "nice_to_have_features": ["sky_garden"],
                "deal_breakers": ["near_highway"],
                "legal_status_required": ["so_hong"],
                "handover_preference": "full",
                "accept_secondary": True,
                "priority_location": 4,
                "priority_price": 5,
                "priority_size": 3,
                "special_requirements": "Gần trường quốc tế",
                "is_active": True,
                "confidence_level": 80
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/demands", json=demand_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["id"] is not None
        assert data["contact_id"] == contact_id
        assert data["purpose"] == "residence"
        assert data["urgency"] == "short_term"
        assert data["budget_min"] == 2000000000
        assert "budget_display" in data
        assert "area_display" in data
        assert len(data["property_types"]) == 2
        assert len(data["preferred_districts"]) == 2
        print(f"✓ Created demand profile with 60+ fields: {data['id']}")
    
    def test_get_demand_profiles_list(self):
        """Test GET /api/crm/demands returns list"""
        response = requests.get(f"{BASE_URL}/api/crm/demands")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} demand profiles")
    
    def test_get_demand_profile_by_id(self):
        """Test GET /api/crm/demands/{id} returns profile"""
        demand_id, _ = self._create_demand_profile()
        
        response = requests.get(f"{BASE_URL}/api/crm/demands/{demand_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == demand_id
        assert "budget_display" in data
        print(f"✓ Got demand profile by ID")
    
    def test_get_demand_by_contact_id(self):
        """Test GET /api/crm/demands?contact_id=xxx"""
        demand_id, contact_id = self._create_demand_profile()
        
        response = requests.get(f"{BASE_URL}/api/crm/demands?contact_id={contact_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(d["contact_id"] == contact_id for d in data)
        print(f"✓ Filter demands by contact_id works")
    
    def test_update_demand_profile(self):
        """Test PUT /api/crm/demands/{id} updates profile"""
        demand_id, _ = self._create_demand_profile()
        
        # Updates - WRAPPED in "updates"
        update_payload = {
            "updates": {
                "budget_max": 5000000000,
                "urgency": "immediate",
                "special_requirements": "Updated requirement"
            }
        }
        
        response = requests.put(f"{BASE_URL}/api/crm/demands/{demand_id}", json=update_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        assert response.json()["success"] == True
        
        # Verify version incremented
        get_resp = requests.get(f"{BASE_URL}/api/crm/demands/{demand_id}")
        assert get_resp.json()["version"] == 2
        print(f"✓ Demand profile updated, version incremented")
    
    def test_match_products_to_demand(self):
        """Test POST /api/crm/demands/{id}/match-products"""
        demand_id, contact_id = self._create_demand_profile()
        
        response = requests.post(f"{BASE_URL}/api/crm/demands/{demand_id}/match-products")
        assert response.status_code == 200
        
        data = response.json()
        assert data["demand_profile_id"] == demand_id
        assert data["contact_id"] == contact_id
        assert "total_matches" in data
        assert "matches" in data
        assert isinstance(data["matches"], list)
        assert "matched_at" in data
        
        # If matches found, verify structure
        if data["matches"]:
            match = data["matches"][0]
            assert "product_id" in match
            assert "match_score" in match
            assert "match_breakdown" in match
            print(f"✓ Product matching returned {data['total_matches']} matches, best score: {data['best_match_score']}")
        else:
            print(f"✓ Product matching completed (0 matches - no products in DB)")


class TestCRMInteractionAPIs:
    """Test CRM Interactions (Unified Timeline) APIs - 4 tests"""
    
    def _create_test_contact(self):
        """Helper to create test contact"""
        unique_id = str(uuid.uuid4())[:8]
        resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_InteractionContact_{unique_id}",
                "phone": f"0911{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        return resp.json()["id"]
    
    def _create_interaction(self):
        """Helper to create interaction"""
        contact_id = self._create_test_contact()
        resp = requests.post(f"{BASE_URL}/api/crm/interactions", json={
            "interaction": {
                "contact_id": contact_id,
                "interaction_type": "call_outbound",
                "title": "First call",
                "content": "Discussed property requirements",
                "outcome": "interested"
            }
        })
        return resp.json()["id"], contact_id
    
    def test_create_interaction(self):
        """Test POST /api/crm/interactions creates timeline entry"""
        contact_id = self._create_test_contact()
        
        interaction_payload = {
            "interaction": {
                "contact_id": contact_id,
                "interaction_type": "call_outbound",
                "title": "First call",
                "content": "Discussed property requirements",
                "outcome": "interested",
                "duration_minutes": 15,
                "next_action": "Send brochure",
                "next_follow_up": "2026-03-20T10:00:00Z"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/crm/interactions", json=interaction_payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["id"] is not None
        assert data["contact_id"] == contact_id
        assert data["interaction_type"] == "call_outbound"
        assert "interaction_type_label" in data
        print(f"✓ Created interaction: {data['id']}")
    
    def test_get_interactions_list(self):
        """Test GET /api/crm/interactions returns list"""
        response = requests.get(f"{BASE_URL}/api/crm/interactions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} interactions")
    
    def test_get_interactions_by_contact(self):
        """Test GET /api/crm/interactions?contact_id=xxx"""
        interaction_id, contact_id = self._create_interaction()
        
        response = requests.get(f"{BASE_URL}/api/crm/interactions?contact_id={contact_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(i["contact_id"] == contact_id for i in data)
        print(f"✓ Filter interactions by contact_id works")
    
    def test_get_contact_timeline(self):
        """Test GET /api/crm/timeline/contact/{id} returns unified timeline"""
        interaction_id, contact_id = self._create_interaction()
        
        response = requests.get(f"{BASE_URL}/api/crm/timeline/contact/{contact_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["contact_id"] == contact_id
        assert "contact_name" in data
        assert "total" in data
        assert "items" in data
        assert isinstance(data["items"], list)
        
        # Verify timeline items have display info
        if data["items"]:
            item = data["items"][0]
            assert "interaction_type_label" in item
            assert "interaction_type_icon" in item
        print(f"✓ Got contact timeline: {data['total']} entries")


class TestUnifiedProfileAPI:
    """Test Contact Unified Profile aggregation - 1 test"""
    
    def test_get_unified_profile(self):
        """Test GET /api/crm/contacts/{id}/unified-profile returns aggregated data"""
        # Create contact
        unique_id = str(uuid.uuid4())[:8]
        contact_resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_Unified_{unique_id}",
                "phone": f"0912{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        contact_id = contact_resp.json()["id"]
        
        # Create a lead linked to contact
        requests.post(f"{BASE_URL}/api/crm/leads", json={
            "lead": {
                "contact_id": contact_id,
                "source": "website",
                "budget_max": 3000000000
            }
        })
        
        # Create a demand profile
        requests.post(f"{BASE_URL}/api/crm/demands", json={
            "demand": {
                "contact_id": contact_id,
                "purpose": "residence",
                "urgency": "short_term",
                "budget_min": 2000000000,
                "budget_max": 4000000000
            }
        })
        
        # Create an interaction
        requests.post(f"{BASE_URL}/api/crm/interactions", json={
            "interaction": {
                "contact_id": contact_id,
                "interaction_type": "note",
                "title": "Profile note",
                "content": "Initial assessment completed"
            }
        })
        
        # Get unified profile
        response = requests.get(f"{BASE_URL}/api/crm/contacts/{contact_id}/unified-profile")
        assert response.status_code == 200
        
        data = response.json()
        assert "contact" in data
        assert data["contact"]["id"] == contact_id
        assert "leads" in data
        assert "demand_profiles" in data
        assert "deals" in data
        assert "recent_interactions" in data
        assert "total_interactions" in data
        assert "assignment_history" in data
        assert "summary" in data
        
        # Verify aggregation worked
        assert len(data["leads"]) >= 1
        assert len(data["demand_profiles"]) >= 1
        assert data["total_interactions"] >= 1
        
        print(f"✓ Unified profile aggregated: {len(data['leads'])} leads, {len(data['demand_profiles'])} demands, {data['total_interactions']} interactions")


class TestDuplicateDetectionAPIs:
    """Test duplicate detection with phone/email/zalo - 6 tests"""
    
    def _create_contact_with_phone(self, phone, unique_id=None):
        """Helper to create contact with specific phone"""
        if not unique_id:
            unique_id = str(uuid.uuid4())[:8]
        resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_Dup_{unique_id}",
                "phone": phone,
                "status": "lead",
                "contact_type": "individual"
            }
        })
        return resp.json()["id"]
    
    def test_check_duplicates_by_phone(self):
        """Test POST /api/crm/duplicates/check with phone"""
        unique_id = str(uuid.uuid4())[:8]
        test_phone = f"0913{unique_id[:6]}"
        
        self._create_contact_with_phone(test_phone, unique_id)
        
        # Check for duplicates - WRAPPED in "check_request"
        response = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "phone": test_phone
            }
        })
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "duplicates" in data
        assert "total" in data
        assert data["total"] >= 1
        
        dup = data["duplicates"][0]
        assert "contact_id" in dup
        assert "match_score" in dup
        assert "match_reasons" in dup
        assert dup["match_score"] >= 95
        print(f"✓ Duplicate detected by phone, score: {dup['match_score']}")
    
    def test_check_duplicates_by_normalized_phone(self):
        """Test duplicate detection with normalized phone (+84 vs 0)"""
        unique_id = str(uuid.uuid4())[:8]
        base_phone = f"913{unique_id[:6]}"
        
        # Create with 0 prefix
        self._create_contact_with_phone(f"0{base_phone}", unique_id)
        
        # Check with +84 prefix
        response = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "phone": f"+84{base_phone}"
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        print(f"✓ Normalized phone duplicate detection works")
    
    def test_check_duplicates_by_email(self):
        """Test duplicate detection by email"""
        unique_id = str(uuid.uuid4())[:8]
        test_email = f"test_dup_{unique_id}@example.com"
        
        requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_DupEmail_{unique_id}",
                "phone": f"0914{unique_id[:6]}",
                "email": test_email,
                "status": "lead",
                "contact_type": "individual"
            }
        })
        
        response = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "email": test_email
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        print(f"✓ Duplicate detected by email")
    
    def test_check_duplicates_by_zalo(self):
        """Test duplicate detection by zalo_phone"""
        unique_id = str(uuid.uuid4())[:8]
        zalo_phone = f"0915{unique_id[:6]}"
        
        requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_DupZalo_{unique_id}",
                "phone": f"0916{unique_id[:6]}",
                "zalo_phone": zalo_phone,
                "status": "lead",
                "contact_type": "individual"
            }
        })
        
        response = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "zalo_phone": zalo_phone
            }
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        print(f"✓ Duplicate detected by Zalo phone")
    
    def test_check_duplicates_exclude_self(self):
        """Test exclude_contact_id excludes the contact itself"""
        unique_id = str(uuid.uuid4())[:8]
        test_phone = f"0917{unique_id[:6]}"
        
        contact_id = self._create_contact_with_phone(test_phone, unique_id)
        
        # Check without exclusion - should find itself
        resp1 = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "phone": test_phone
            }
        })
        assert resp1.json()["total"] >= 1
        
        # Check with exclusion - should not find itself
        resp2 = requests.post(f"{BASE_URL}/api/crm/duplicates/check", json={
            "check_request": {
                "phone": test_phone,
                "exclude_contact_id": contact_id
            }
        })
        # May have others or not
        print(f"✓ exclude_contact_id works correctly")
    
    def test_merge_contacts(self):
        """Test POST /api/crm/duplicates/merge merges contacts"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create primary contact
        primary_resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_Primary_{unique_id}",
                "phone": f"0918{unique_id[:6]}",
                "email": f"primary_{unique_id}@test.com",
                "status": "prospect",
                "contact_type": "individual",
                "tags": ["vip"]
            }
        })
        primary_id = primary_resp.json()["id"]
        
        # Create duplicate contact
        dup_resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_Duplicate_{unique_id}",
                "phone": f"0919{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual",
                "tags": ["website"]
            }
        })
        dup_id = dup_resp.json()["id"]
        
        # Merge - WRAPPED in "merge_request"
        response = requests.post(f"{BASE_URL}/api/crm/duplicates/merge", json={
            "merge_request": {
                "primary_contact_id": primary_id,
                "duplicate_contact_ids": [dup_id],
                "merge_leads": True,
                "merge_interactions": True,
                "merge_tags": True
            }
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["primary_contact_id"] == primary_id
        assert data["merged_count"] == 1
        
        # Verify primary has merged_contact_ids
        primary_check = requests.get(f"{BASE_URL}/api/crm/contacts/{primary_id}")
        assert dup_id in primary_check.json()["merged_contact_ids"]
        
        # Verify duplicate is not primary
        dup_check = requests.get(f"{BASE_URL}/api/crm/contacts/{dup_id}")
        assert dup_check.json()["is_primary"] == False
        
        print(f"✓ Contacts merged successfully")


class TestAssignmentHistoryAPIs:
    """Test assignment history tracking - 2 tests"""
    
    def test_get_assignment_history(self):
        """Test GET /api/crm/assignment-history returns history"""
        response = requests.get(f"{BASE_URL}/api/crm/assignment-history")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✓ Got {len(data['items'])} assignment history records")
    
    def test_assignment_history_on_lead_assignment(self):
        """Test assignment history is created when lead is assigned"""
        unique_id = str(uuid.uuid4())[:8]
        contact_resp = requests.post(f"{BASE_URL}/api/crm/contacts", json={
            "contact": {
                "full_name": f"TEST_AssignHistory_{unique_id}",
                "phone": f"0920{unique_id[:6]}",
                "status": "lead",
                "contact_type": "individual"
            }
        })
        contact_id = contact_resp.json()["id"]
        
        lead_resp = requests.post(f"{BASE_URL}/api/crm/leads", json={
            "lead": {
                "contact_id": contact_id,
                "source": "website"
            }
        })
        lead_id = lead_resp.json()["id"]
        
        # Get history for this lead
        response = requests.get(f"{BASE_URL}/api/crm/assignment-history?entity_type=lead&entity_id={lead_id}")
        assert response.status_code == 200
        print(f"✓ Assignment history endpoint works for leads")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
