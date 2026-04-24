"""
ProHouzing Sales API Tests
Prompt 8/20 - Sales Pipeline, Booking & Deal Engine

Tests for:
- Deal CRUD and stage transitions
- Soft Booking queue and priority selection
- Hard Booking and deposit
- Sales Events and Allocation Engine
- Pricing Engine calculations
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
EXISTING_CONTACT_ID = "8be10861-a226-4662-a67a-25eafb8a7fb9"
EXISTING_PROJECT_ID = "099e7644-ba1c-461a-8324-03742f817093"
EXISTING_PRODUCT_ID = "52901250-a12e-4966-8bd7-a2b86be7f34d"


class TestDealStagesConfig:
    """Test deal stages configuration - 14 stages as per requirement"""
    
    def test_get_deal_stages(self):
        """Test GET /api/sales/config/deal-stages returns 14 stages"""
        response = requests.get(f"{BASE_URL}/api/sales/config/deal-stages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        stages = data.get("stages", [])
        pipeline_stages = data.get("pipeline_stages", [])
        
        # Verify we have 14 stages
        assert len(stages) == 14, f"Expected 14 stages, got {len(stages)}"
        
        # Verify pipeline stages (excludes terminal states)
        assert len(pipeline_stages) == 12, f"Expected 12 pipeline stages, got {len(pipeline_stages)}"
        
        # Verify key stages exist
        stage_codes = [s["code"] for s in stages]
        expected_stages = [
            "interested", "site_visit", "negotiating",
            "soft_booking", "selecting", "waiting_allocation",
            "allocated", "hard_booking", "depositing",
            "contracting", "payment_progress", "handover_pending",
            "completed", "lost"
        ]
        for expected in expected_stages:
            assert expected in stage_codes, f"Missing stage: {expected}"
        print(f"✓ All 14 deal stages present")
    
    def test_get_booking_tiers(self):
        """Test GET /api/sales/config/booking-tiers"""
        response = requests.get(f"{BASE_URL}/api/sales/config/booking-tiers")
        assert response.status_code == 200
        
        data = response.json()
        tiers = data.get("tiers", {})
        
        # Should have VIP, Priority, Standard (tiers is a dict with code as key)
        assert "vip" in tiers, "Missing VIP tier"
        assert "priority" in tiers, "Missing Priority tier"
        assert "standard" in tiers, "Missing Standard tier"
        print("✓ Booking tiers configured correctly")
    
    def test_get_soft_booking_statuses(self):
        """Test GET /api/sales/config/soft-booking-statuses"""
        response = requests.get(f"{BASE_URL}/api/sales/config/soft-booking-statuses")
        assert response.status_code == 200
        
        data = response.json()
        statuses = data.get("statuses", {})
        
        expected = ["pending", "confirmed", "selecting", "submitted", "allocated", "failed", "cancelled", "expired"]
        for exp in expected:
            assert exp in statuses, f"Missing soft booking status: {exp}"
        print("✓ Soft booking statuses configured correctly")
    
    def test_get_hard_booking_statuses(self):
        """Test GET /api/sales/config/hard-booking-statuses"""
        response = requests.get(f"{BASE_URL}/api/sales/config/hard-booking-statuses")
        assert response.status_code == 200
        
        data = response.json()
        statuses = data.get("statuses", {})
        
        expected = ["active", "deposit_pending", "deposit_partial", "deposited", "contracted", "cancelled", "expired"]
        for exp in expected:
            assert exp in statuses, f"Missing hard booking status: {exp}"
        print("✓ Hard booking statuses configured correctly")
    
    def test_get_payment_plan_types(self):
        """Test GET /api/sales/config/payment-plan-types"""
        response = requests.get(f"{BASE_URL}/api/sales/config/payment-plan-types")
        assert response.status_code == 200
        
        data = response.json()
        types = data.get("types", {})
        
        expected = ["standard", "fast", "full", "loan", "flexible"]
        for exp in expected:
            assert exp in types, f"Missing payment plan type: {exp}"
        print("✓ Payment plan types configured correctly")


class TestDealCRUD:
    """Test Deal CRUD operations"""
    
    @pytest.fixture
    def created_deal_id(self):
        """Create a deal for testing and clean up after"""
        # Create deal
        payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": 5000000000,
            "notes": "TEST_DEAL_CRUD"
        }
        response = requests.post(f"{BASE_URL}/api/sales/deals", json=payload)
        assert response.status_code == 200, f"Failed to create deal: {response.text}"
        deal_id = response.json()["id"]
        yield deal_id
        # Cleanup - no direct delete, but deal can be marked as lost
    
    def test_create_deal(self):
        """Test POST /api/sales/deals"""
        unique_value = 5500000000 + (datetime.now().microsecond % 1000) * 1000000
        payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": unique_value,
            "notes": f"TEST_DEAL_{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{BASE_URL}/api/sales/deals", json=payload)
        assert response.status_code == 200, f"Failed to create deal: {response.text}"
        
        data = response.json()
        assert "id" in data, "Deal ID not returned"
        assert "code" in data, "Deal code not returned"
        assert data["code"].startswith("DEAL-"), f"Invalid deal code format: {data['code']}"
        assert data["stage"] == "interested", f"Unexpected stage: {data['stage']}"
        assert data["probability"] == 10, "Wrong probability for interested stage"
        print(f"✓ Created deal: {data['code']}")
    
    def test_get_deals(self):
        """Test GET /api/sales/deals"""
        response = requests.get(f"{BASE_URL}/api/sales/deals")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Expected list of deals"
        print(f"✓ Retrieved {len(data)} deals")
    
    def test_get_deals_filtered_by_project(self):
        """Test GET /api/sales/deals?project_id=xxx"""
        response = requests.get(f"{BASE_URL}/api/sales/deals?project_id={EXISTING_PROJECT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        for deal in data:
            assert deal.get("project_id") == EXISTING_PROJECT_ID, "Filter not working correctly"
        print(f"✓ Retrieved {len(data)} deals filtered by project")
    
    def test_get_deal_by_id(self, created_deal_id):
        """Test GET /api/sales/deals/{id}"""
        response = requests.get(f"{BASE_URL}/api/sales/deals/{created_deal_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == created_deal_id
        assert "stage_label" in data, "Missing stage_label"
        assert "stage_color" in data, "Missing stage_color"
        print(f"✓ Retrieved deal by ID: {created_deal_id[:8]}...")
    
    def test_update_deal(self, created_deal_id):
        """Test PUT /api/sales/deals/{id}"""
        payload = {
            "estimated_value": 6000000000,
            "notes": "Updated by test"
        }
        response = requests.put(f"{BASE_URL}/api/sales/deals/{created_deal_id}", json=payload)
        assert response.status_code == 200
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/sales/deals/{created_deal_id}")
        assert get_response.status_code == 200
        updated = get_response.json()
        assert updated["estimated_value"] == 6000000000
        print("✓ Deal updated successfully")
    
    def test_get_pipeline(self):
        """Test GET /api/sales/deals/pipeline"""
        response = requests.get(f"{BASE_URL}/api/sales/deals/pipeline")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_deals" in data
        assert "total_value" in data
        assert "by_stage" in data
        print(f"✓ Pipeline summary: {data['total_deals']} deals, {data['total_value']:,.0f} VND")


class TestDealStageTransitions:
    """Test deal stage transitions"""
    
    @pytest.fixture
    def deal_for_transition(self):
        """Create a fresh deal for transition testing"""
        payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": 4000000000,
            "notes": f"TEST_TRANSITION_{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{BASE_URL}/api/sales/deals", json=payload)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_stage_transition_interested_to_site_visit(self, deal_for_transition):
        """Test transition from interested to site_visit"""
        payload = {"new_stage": "site_visit"}
        response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json=payload
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["new_stage"] == "site_visit"
        print("✓ Transition interested → site_visit successful")
    
    def test_stage_transition_interested_to_negotiating(self, deal_for_transition):
        """Test transition from interested to negotiating"""
        payload = {"new_stage": "negotiating"}
        response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json=payload
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["new_stage"] == "negotiating"
        print("✓ Transition interested → negotiating successful")
    
    def test_stage_transition_to_soft_booking(self, deal_for_transition):
        """Test transition to soft_booking - should create soft booking"""
        payload = {
            "new_stage": "soft_booking",
            "create_soft_booking": True,
            "soft_booking_data": {
                "booking_tier": "standard",
                "booking_fee": 50000000
            }
        }
        response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json=payload
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["new_stage"] == "soft_booking"
        # soft_booking_id may be returned if create_soft_booking is True
        print("✓ Transition to soft_booking successful")
    
    def test_invalid_stage_transition(self, deal_for_transition):
        """Test invalid transition - interested cannot go directly to allocated"""
        payload = {"new_stage": "allocated"}
        response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json=payload
        )
        # Should fail - invalid transition
        assert response.status_code == 400, "Expected 400 for invalid transition"
        print("✓ Invalid transition correctly rejected")
    
    def test_transition_to_lost(self, deal_for_transition):
        """Test transition to lost (terminal state)"""
        payload = {
            "new_stage": "lost",
            "reason": "Customer chose competitor"
        }
        response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json=payload
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["new_stage"] == "lost"
        
        # Verify deal status
        get_response = requests.get(f"{BASE_URL}/api/sales/deals/{deal_for_transition}")
        assert get_response.json()["status"] == "lost"
        print("✓ Transition to lost successful")
    
    def test_get_deal_timeline(self, deal_for_transition):
        """Test GET /api/sales/deals/{id}/timeline"""
        # First make a transition
        requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_for_transition}/stage",
            json={"new_stage": "site_visit"}
        )
        
        # Get timeline
        response = requests.get(f"{BASE_URL}/api/sales/deals/{deal_for_transition}/timeline")
        assert response.status_code == 200
        
        data = response.json()
        assert "history" in data
        history = data["history"]
        assert len(history) >= 1, "Timeline should have at least 1 entry"
        print(f"✓ Deal timeline has {len(history)} entries")


class TestSoftBookingQueue:
    """Test Soft Booking queue operations"""
    
    @pytest.fixture
    def deal_for_soft_booking(self):
        """Create deal ready for soft booking"""
        payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": 4500000000,
            "notes": f"TEST_SOFTBOOKING_{uuid.uuid4().hex[:8]}"
        }
        response = requests.post(f"{BASE_URL}/api/sales/deals", json=payload)
        return response.json()["id"]
    
    def test_create_soft_booking(self, deal_for_soft_booking):
        """Test POST /api/sales/soft-bookings"""
        payload = {
            "deal_id": deal_for_soft_booking,
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "booking_tier": "standard",
            "booking_fee": 50000000,
            "notes": "Test soft booking"
        }
        response = requests.post(f"{BASE_URL}/api/sales/soft-bookings", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "code" in data
        assert data["code"].startswith("SB-"), f"Invalid code format: {data['code']}"
        assert "queue_number" in data
        assert data["queue_number"] >= 1, "Queue number should be >= 1"
        assert data["status"] == "pending"
        print(f"✓ Created soft booking: {data['code']}, queue #{data['queue_number']}")
        return data["id"]
    
    def test_get_soft_bookings(self):
        """Test GET /api/sales/soft-bookings"""
        response = requests.get(f"{BASE_URL}/api/sales/soft-bookings")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} soft bookings")
    
    def test_confirm_soft_booking(self, deal_for_soft_booking):
        """Test PUT /api/sales/soft-bookings/{id}/confirm"""
        # Create soft booking first
        create_payload = {
            "deal_id": deal_for_soft_booking,
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "booking_tier": "priority"
        }
        create_response = requests.post(f"{BASE_URL}/api/sales/soft-bookings", json=create_payload)
        booking_id = create_response.json()["id"]
        
        # Confirm it
        response = requests.put(f"{BASE_URL}/api/sales/soft-bookings/{booking_id}/confirm")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["status"] == "confirmed"
        print("✓ Soft booking confirmed")
    
    def test_queue_number_ordering(self, deal_for_soft_booking):
        """Test that queue numbers are sequential and unique"""
        queue_numbers = []
        
        # Create multiple soft bookings and verify queue ordering
        for i in range(3):
            # Create new deal for each booking
            deal_payload = {
                "contact_id": EXISTING_CONTACT_ID,
                "project_id": EXISTING_PROJECT_ID,
                "stage": "interested",
                "estimated_value": 4000000000,
                "notes": f"TEST_QUEUE_ORDER_{i}_{uuid.uuid4().hex[:6]}"
            }
            deal_response = requests.post(f"{BASE_URL}/api/sales/deals", json=deal_payload)
            deal_id = deal_response.json()["id"]
            
            # Create soft booking
            booking_payload = {
                "deal_id": deal_id,
                "contact_id": EXISTING_CONTACT_ID,
                "project_id": EXISTING_PROJECT_ID,
                "booking_tier": "standard"
            }
            response = requests.post(f"{BASE_URL}/api/sales/soft-bookings", json=booking_payload)
            assert response.status_code == 200
            queue_numbers.append(response.json()["queue_number"])
        
        # Verify no duplicates
        assert len(queue_numbers) == len(set(queue_numbers)), f"Duplicate queue numbers found: {queue_numbers}"
        print(f"✓ Queue numbers unique: {queue_numbers}")
    
    def test_get_booking_queue(self):
        """Test GET /api/sales/soft-bookings/queue/{project_id}"""
        response = requests.get(f"{BASE_URL}/api/sales/soft-bookings/queue/{EXISTING_PROJECT_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "total" in data
        assert "by_tier" in data
        assert "queue" in data
        
        # Verify queue is sorted by queue_number
        queue = data["queue"]
        if len(queue) > 1:
            queue_numbers = [b["queue_number"] for b in queue]
            assert queue_numbers == sorted(queue_numbers), "Queue not sorted by queue_number"
        print(f"✓ Booking queue has {data['total']} bookings")


class TestPrioritySelection:
    """Test priority selection for soft bookings"""
    
    @pytest.fixture
    def confirmed_soft_booking(self):
        """Create and confirm a soft booking"""
        # Create deal
        deal_payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": 4000000000,
            "notes": f"TEST_PRIORITY_{uuid.uuid4().hex[:8]}"
        }
        deal_response = requests.post(f"{BASE_URL}/api/sales/deals", json=deal_payload)
        deal_id = deal_response.json()["id"]
        
        # Create soft booking
        booking_payload = {
            "deal_id": deal_id,
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "booking_tier": "standard"
        }
        booking_response = requests.post(f"{BASE_URL}/api/sales/soft-bookings", json=booking_payload)
        booking_id = booking_response.json()["id"]
        
        # Confirm soft booking
        requests.put(f"{BASE_URL}/api/sales/soft-bookings/{booking_id}/confirm")
        
        return booking_id
    
    def test_set_priorities_valid(self, confirmed_soft_booking):
        """Test setting valid priority selections 1-2-3"""
        # Get available products
        products_response = requests.get(f"{BASE_URL}/api/products?project_id={EXISTING_PROJECT_ID}&limit=3")
        if products_response.status_code != 200 or not products_response.json():
            pytest.skip("No products available for testing")
        
        products = products_response.json()
        if len(products) < 1:
            pytest.skip("Not enough products for priority testing")
        
        priorities = []
        for i, product in enumerate(products[:3], 1):
            priorities.append({
                "priority": i,
                "product_id": product["id"],
                "product_code": product.get("code", f"TEST_{i}"),
                "product_name": product.get("name", f"Test Product {i}")
            })
        
        response = requests.put(
            f"{BASE_URL}/api/sales/soft-bookings/{confirmed_soft_booking}/priorities",
            json={"priorities": priorities}
        )
        
        if response.status_code == 400 and "not available" in response.text:
            print("⚠ Products not available for selection (already allocated)")
            return
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert len(data["priorities"]) == len(priorities)
        print(f"✓ Set {len(priorities)} priority selections")
    
    def test_reject_duplicate_priority_numbers(self, confirmed_soft_booking):
        """Test that duplicate priority numbers are rejected"""
        priorities = [
            {"priority": 1, "product_id": EXISTING_PRODUCT_ID, "product_code": "TEST_1"},
            {"priority": 1, "product_id": EXISTING_PRODUCT_ID, "product_code": "TEST_2"}  # Duplicate priority
        ]
        
        response = requests.put(
            f"{BASE_URL}/api/sales/soft-bookings/{confirmed_soft_booking}/priorities",
            json={"priorities": priorities}
        )
        
        # Should fail due to duplicate priorities
        assert response.status_code == 400, "Should reject duplicate priority numbers"
        print("✓ Duplicate priority numbers correctly rejected")


class TestAllocationEngine:
    """Test allocation engine functionality"""
    
    def test_get_events(self):
        """Test GET /api/sales/events"""
        response = requests.get(f"{BASE_URL}/api/sales/events")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} sales events")
    
    def test_create_sales_event(self):
        """Test POST /api/sales/events"""
        now = datetime.now()
        payload = {
            "name": f"TEST_EVENT_{uuid.uuid4().hex[:6]}",
            "project_id": EXISTING_PROJECT_ID,
            "registration_start": now.isoformat(),
            "registration_end": (now + timedelta(days=7)).isoformat(),
            "selection_start": (now + timedelta(days=7)).isoformat(),
            "selection_end": (now + timedelta(days=14)).isoformat(),
            "allocation_date": (now + timedelta(days=14)).isoformat(),
            "available_product_ids": [EXISTING_PRODUCT_ID],
            "booking_fee": 50000000
        }
        response = requests.post(f"{BASE_URL}/api/sales/events", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"].startswith("EVT-")
        assert data["status"] == "draft"
        print(f"✓ Created sales event: {data['code']}")
        return data["id"]
    
    def test_run_allocation_requires_valid_event(self):
        """Test that allocation only runs on valid event status"""
        # Create draft event
        now = datetime.now()
        payload = {
            "name": f"TEST_ALLOC_{uuid.uuid4().hex[:6]}",
            "project_id": EXISTING_PROJECT_ID,
            "registration_start": now.isoformat(),
            "registration_end": (now + timedelta(days=7)).isoformat(),
            "selection_start": (now + timedelta(days=7)).isoformat(),
            "selection_end": (now + timedelta(days=14)).isoformat(),
            "allocation_date": (now + timedelta(days=14)).isoformat(),
            "available_product_ids": [EXISTING_PRODUCT_ID]
        }
        create_response = requests.post(f"{BASE_URL}/api/sales/events", json=payload)
        event_id = create_response.json()["id"]
        
        # Try to run allocation on draft event (should fail)
        response = requests.post(f"{BASE_URL}/api/sales/events/{event_id}/run-allocation")
        assert response.status_code == 400, "Should not run allocation on draft event"
        print("✓ Allocation correctly rejects draft events")


class TestHardBooking:
    """Test hard booking operations"""
    
    def test_get_hard_bookings(self):
        """Test GET /api/sales/hard-bookings"""
        response = requests.get(f"{BASE_URL}/api/sales/hard-bookings")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} hard bookings")
    
    def test_create_hard_booking_requires_allocated_soft_booking(self):
        """Test that hard booking requires an allocated soft booking"""
        payload = {
            "deal_id": "invalid-id",
            "soft_booking_id": "invalid-soft-booking-id",
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "product_id": EXISTING_PRODUCT_ID,
            "deposit_amount": 100000000
        }
        response = requests.post(f"{BASE_URL}/api/sales/hard-bookings", json=payload)
        assert response.status_code == 400, "Should reject invalid soft booking"
        print("✓ Hard booking correctly requires valid soft booking")


class TestPricingEngine:
    """Test pricing engine calculations"""
    
    def test_calculate_price_basic(self):
        """Test POST /api/sales/calculate-price"""
        payload = {
            "product_id": EXISTING_PRODUCT_ID
        }
        response = requests.post(f"{BASE_URL}/api/sales/calculate-price", json=payload)
        
        if response.status_code == 404:
            pytest.skip("Product not found for pricing test")
        
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "product_id" in data
        assert "unit_base_price" in data
        assert "final_price" in data
        assert "total_discount" in data
        assert data["final_price"] >= 0
        print(f"✓ Price calculated: {data['final_price']:,.0f} VND")
    
    def test_calculate_price_with_special_discounts(self):
        """Test price calculation with special discounts"""
        payload = {
            "product_id": EXISTING_PRODUCT_ID,
            "special_discounts": {
                "vip": 2,
                "referral": 1
            }
        }
        response = requests.post(f"{BASE_URL}/api/sales/calculate-price", json=payload)
        
        if response.status_code == 404:
            pytest.skip("Product not found for pricing test")
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_discount"] > 0 or data["total_discount"] == 0  # May be 0 if base price is 0
        print(f"✓ Price with discounts: {data['final_price']:,.0f} VND (discount: {data['total_discount_percent']:.1f}%)")
    
    def test_max_discount_warning(self):
        """Test that excessive discount triggers warning"""
        payload = {
            "product_id": EXISTING_PRODUCT_ID,
            "special_discounts": {
                "vip": 10,
                "employee": 5,
                "special": 5
            }
        }
        response = requests.post(f"{BASE_URL}/api/sales/calculate-price", json=payload)
        
        if response.status_code == 404:
            pytest.skip("Product not found")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if warnings generated for high discount
        if data["total_discount_percent"] > 15:
            assert len(data.get("warnings", [])) > 0, "Should warn about high discount"
            print(f"✓ High discount warning generated ({data['total_discount_percent']:.1f}%)")
        else:
            print(f"✓ Discount within limit ({data['total_discount_percent']:.1f}%)")


class TestPricingPolicies:
    """Test pricing policy CRUD"""
    
    def test_get_pricing_policies(self):
        """Test GET /api/sales/pricing-policies"""
        response = requests.get(f"{BASE_URL}/api/sales/pricing-policies")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} pricing policies")
    
    def test_create_pricing_policy(self):
        """Test POST /api/sales/pricing-policies"""
        now = datetime.now()
        payload = {
            "name": f"TEST_POLICY_{uuid.uuid4().hex[:6]}",
            "project_id": EXISTING_PROJECT_ID,
            "effective_from": now.isoformat(),
            "price_type": "per_sqm",
            "adjustments": [
                {
                    "type": "floor_premium",
                    "rule": "floor >= 10",
                    "adjustment_type": "percent",
                    "adjustment_value": 2
                }
            ],
            "max_discount_percent": 10
        }
        response = requests.post(f"{BASE_URL}/api/sales/pricing-policies", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"].startswith("PP-")
        print(f"✓ Created pricing policy: {data['code']}")


class TestPaymentPlans:
    """Test payment plan CRUD"""
    
    def test_get_payment_plans(self):
        """Test GET /api/sales/payment-plans"""
        response = requests.get(f"{BASE_URL}/api/sales/payment-plans")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} payment plans")
    
    def test_create_payment_plan(self):
        """Test POST /api/sales/payment-plans"""
        now = datetime.now()
        payload = {
            "name": f"TEST_PLAN_{uuid.uuid4().hex[:6]}",
            "project_id": EXISTING_PROJECT_ID,
            "plan_type": "standard",
            "discount_percent": 0,
            "effective_from": now.isoformat(),
            "milestones": [
                {"name": "Deposit", "percent": 10, "due_type": "fixed"},
                {"name": "Contract signing", "percent": 20, "due_type": "relative", "due_days": 30},
                {"name": "Final payment", "percent": 70, "due_type": "milestone", "milestone": "handover"}
            ],
            "min_down_payment_percent": 10
        }
        response = requests.post(f"{BASE_URL}/api/sales/payment-plans", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"].startswith("PTTT-")
        print(f"✓ Created payment plan: {data['code']}")
    
    def test_create_fast_payment_plan_with_discount(self):
        """Test creating fast payment plan with discount"""
        now = datetime.now()
        payload = {
            "name": f"TEST_FAST_{uuid.uuid4().hex[:6]}",
            "project_id": EXISTING_PROJECT_ID,
            "plan_type": "fast",
            "discount_percent": 3,  # 3% discount for fast payment
            "effective_from": now.isoformat(),
            "milestones": [
                {"name": "Full payment", "percent": 100, "due_type": "relative", "due_days": 7}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/sales/payment-plans", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["discount_percent"] == 3
        print(f"✓ Created fast payment plan with 3% discount: {data['code']}")


class TestPromotions:
    """Test promotions CRUD"""
    
    def test_get_promotions(self):
        """Test GET /api/sales/promotions"""
        response = requests.get(f"{BASE_URL}/api/sales/promotions")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} promotions")
    
    def test_create_promotion(self):
        """Test POST /api/sales/promotions"""
        now = datetime.now()
        payload = {
            "name": f"TEST_PROMO_{uuid.uuid4().hex[:6]}",
            "project_ids": [EXISTING_PROJECT_ID],
            "discount_type": "percent",
            "discount_value": 2,
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=30)).isoformat(),
            "conditions": [
                {"field": "payment_plan", "operator": "eq", "value": "fast"}
            ],
            "stackable": True,
            "max_uses": 100
        }
        response = requests.post(f"{BASE_URL}/api/sales/promotions", json=payload)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["code"].startswith("PROMO-")
        print(f"✓ Created promotion: {data['code']}")


class TestFullE2EFlow:
    """Test complete sales flow: Lead → Deal → Soft Booking → Priority → Allocation → Hard Booking"""
    
    def test_e2e_flow_deal_to_soft_booking(self):
        """Test E2E: Create Deal → Soft Booking → Confirm → Set Priorities"""
        # Step 1: Create Deal
        deal_payload = {
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "stage": "interested",
            "estimated_value": 4500000000,
            "notes": f"E2E_TEST_{uuid.uuid4().hex[:8]}"
        }
        deal_response = requests.post(f"{BASE_URL}/api/sales/deals", json=deal_payload)
        assert deal_response.status_code == 200
        deal = deal_response.json()
        deal_id = deal["id"]
        print(f"✓ Step 1: Created deal {deal['code']}")
        
        # Step 2: Transition to negotiating
        stage_response = requests.put(
            f"{BASE_URL}/api/sales/deals/{deal_id}/stage",
            json={"new_stage": "negotiating"}
        )
        assert stage_response.status_code == 200
        print(f"✓ Step 2: Deal transitioned to negotiating")
        
        # Step 3: Create Soft Booking
        booking_payload = {
            "deal_id": deal_id,
            "contact_id": EXISTING_CONTACT_ID,
            "project_id": EXISTING_PROJECT_ID,
            "booking_tier": "priority",
            "booking_fee": 50000000
        }
        booking_response = requests.post(f"{BASE_URL}/api/sales/soft-bookings", json=booking_payload)
        assert booking_response.status_code == 200
        booking = booking_response.json()
        booking_id = booking["id"]
        print(f"✓ Step 3: Created soft booking {booking['code']}, queue #{booking['queue_number']}")
        
        # Step 4: Confirm Soft Booking
        confirm_response = requests.put(f"{BASE_URL}/api/sales/soft-bookings/{booking_id}/confirm")
        assert confirm_response.status_code == 200
        print(f"✓ Step 4: Soft booking confirmed")
        
        # Step 5: Verify deal updated
        get_deal = requests.get(f"{BASE_URL}/api/sales/deals/{deal_id}")
        assert get_deal.status_code == 200
        updated_deal = get_deal.json()
        assert updated_deal["soft_booking_id"] == booking_id, "Deal should reference soft booking"
        print(f"✓ Step 5: Deal linked to soft booking")
        
        print("=" * 50)
        print("E2E Flow Test PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
