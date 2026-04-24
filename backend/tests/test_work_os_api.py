"""
ProHouzing Work OS API Tests
Prompt 10/20 - Task, Reminder & Follow-up Operating System

Tests for:
- Task types, statuses, priorities, outcomes config APIs
- Task CRUD with validation (owner, deadline, entity required)
- Task completion with mandatory outcome notes
- Task rescheduling
- Daily Workboard API
- Next Best Actions API
- Manager Workload API
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://content-machine-18.preview.emergentagent.com')


class TestWorkConfigAPIs:
    """Test configuration endpoints for Work OS"""
    
    def test_get_task_types_returns_19_types(self):
        """GET /api/work/config/task-types - should return 19 task types"""
        response = requests.get(f"{BASE_URL}/api/work/config/task-types")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 19, f"Expected 19 task types, got {len(data)}"
        
        # Verify each type has required fields
        for task_type in data:
            assert "code" in task_type
            assert "label" in task_type
            assert "category" in task_type
        
        # Verify specific important types exist
        codes = [t["code"] for t in data]
        assert "call_customer" in codes
        assert "booking_follow_up" in codes
        assert "payment_reminder" in codes
        assert "contract_review" in codes
        print(f"✅ 19 task types verified: {codes}")
    
    def test_get_task_statuses_returns_9_statuses(self):
        """GET /api/work/config/task-statuses - should return 9 statuses"""
        response = requests.get(f"{BASE_URL}/api/work/config/task-statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 9, f"Expected 9 statuses, got {len(data)}"
        
        # Verify structure
        for status in data:
            assert "code" in status
            assert "label" in status
            assert "color" in status
            assert "is_active" in status
            assert "is_final" in status
        
        codes = [s["code"] for s in data]
        required_statuses = ["new", "pending", "in_progress", "completed", "cancelled", "overdue"]
        for req in required_statuses:
            assert req in codes, f"Missing status: {req}"
        print(f"✅ 9 task statuses verified: {codes}")
    
    def test_get_task_priorities_returns_4_priorities(self):
        """GET /api/work/config/task-priorities - should return 4 priorities"""
        response = requests.get(f"{BASE_URL}/api/work/config/task-priorities")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 4, f"Expected 4 priorities, got {len(data)}"
        
        codes = [p["code"] for p in data]
        assert "urgent" in codes
        assert "high" in codes
        assert "medium" in codes
        assert "low" in codes
        print(f"✅ 4 priorities verified: {codes}")
    
    def test_get_task_outcomes_returns_6_outcomes(self):
        """GET /api/work/config/task-outcomes - should return 6 outcomes"""
        response = requests.get(f"{BASE_URL}/api/work/config/task-outcomes")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 6, f"Expected 6 outcomes, got {len(data)}"
        
        # Verify structure
        for outcome in data:
            assert "code" in outcome
            assert "label" in outcome
            assert "next_action_required" in outcome
        
        codes = [o["code"] for o in data]
        assert "success" in codes
        assert "partial" in codes
        assert "rescheduled" in codes
        assert "no_answer" in codes
        assert "customer_refused" in codes
        print(f"✅ 6 outcomes verified: {codes}")


class TestTaskCRUDWithValidation:
    """Test Task CRUD with required field validation"""
    
    def test_create_task_success_with_all_required_fields(self):
        """POST /api/work/tasks - create task with all required fields"""
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        payload = {
            "title": "TEST_Call new lead for testing",
            "task_type": "call_customer",
            "owner_id": "user-001",
            "due_at": due_at,
            "related_entity_type": "lead",
            "related_entity_id": "lead-test-001",
            "priority": "high"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] is not None
        assert data["code"].startswith("TASK-")
        assert data["title"] == payload["title"]
        assert data["owner_id"] == "user-001"
        assert data["status"] == "new"
        assert data["priority_score"] > 0, "Priority score should be calculated"
        
        print(f"✅ Task created: {data['code']} with priority_score={data['priority_score']}")
        return data["id"]
    
    def test_create_task_fails_without_owner_id(self):
        """POST /api/work/tasks - should fail without owner_id"""
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        payload = {
            "title": "TEST_Task without owner",
            "task_type": "call_customer",
            # Missing: owner_id
            "due_at": due_at,
            "related_entity_type": "lead",
            "related_entity_id": "lead-test-001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks",
            json=payload
        )
        
        # Should fail with 422 (validation error) or 400 (business error)
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ Correctly rejected task without owner_id: {response.status_code}")
    
    def test_create_task_fails_without_due_at(self):
        """POST /api/work/tasks - should fail without due_at"""
        payload = {
            "title": "TEST_Task without deadline",
            "task_type": "call_customer",
            "owner_id": "user-001",
            # Missing: due_at
            "related_entity_type": "lead",
            "related_entity_id": "lead-test-001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks",
            json=payload
        )
        
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ Correctly rejected task without due_at: {response.status_code}")
    
    def test_create_task_fails_without_entity_type(self):
        """POST /api/work/tasks - should fail without related_entity_type"""
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        payload = {
            "title": "TEST_Task without entity",
            "task_type": "call_customer",
            "owner_id": "user-001",
            "due_at": due_at,
            # Missing: related_entity_type
            "related_entity_id": "lead-test-001"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks",
            json=payload
        )
        
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ Correctly rejected task without related_entity_type: {response.status_code}")
    
    def test_get_task_by_id(self):
        """GET /api/work/tasks/{id} - get created task"""
        # First create a task
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        create_payload = {
            "title": "TEST_Task for retrieval test",
            "task_type": "call_customer",
            "owner_id": "user-001",
            "due_at": due_at,
            "related_entity_type": "deal",
            "related_entity_id": "deal-test-001",
            "priority": "high"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/work/tasks", json=create_payload)
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        
        # Now GET the task
        get_response = requests.get(f"{BASE_URL}/api/work/tasks/{task_id}")
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert data["id"] == task_id
        assert data["title"] == create_payload["title"]
        assert data["task_type_label"] != "", "Task type label should be enriched"
        assert data["status_label"] != "", "Status label should be enriched"
        print(f"✅ Task retrieved with enriched labels: type={data['task_type_label']}, status={data['status_label']}")


class TestTaskCompletionWithOutcome:
    """Test task completion with mandatory outcome notes"""
    
    @pytest.fixture
    def created_task(self):
        """Create a task for completion tests"""
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        payload = {
            "title": "TEST_Task for completion test",
            "task_type": "call_customer",
            "owner_id": "user-001",
            "due_at": due_at,
            "related_entity_type": "lead",
            "related_entity_id": "lead-complete-001",
            "priority": "high"
        }
        
        response = requests.post(f"{BASE_URL}/api/work/tasks", json=payload)
        assert response.status_code == 200
        return response.json()
    
    def test_complete_task_with_outcome_success(self, created_task):
        """POST /api/work/tasks/{id}/complete - complete with outcome"""
        task_id = created_task["id"]
        
        complete_payload = {
            "outcome": "success",
            "outcome_notes": "Da lien lac thanh cong, khach hen tham quan ngay mai"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks/{task_id}/complete",
            json=complete_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["outcome"] == "success"
        assert data["outcome_notes"] == complete_payload["outcome_notes"]
        assert data["completed_at"] is not None
        print(f"✅ Task completed with outcome: {data['outcome']}")
    
    def test_complete_task_fails_without_outcome_notes(self, created_task):
        """POST /api/work/tasks/{id}/complete - should fail without outcome_notes"""
        task_id = created_task["id"]
        
        complete_payload = {
            "outcome": "success"
            # Missing: outcome_notes
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks/{task_id}/complete",
            json=complete_payload
        )
        
        # Should fail with 422 (validation) or 400 (business rule)
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ Correctly rejected completion without outcome_notes: {response.status_code}")
    
    def test_complete_task_fails_with_empty_outcome_notes(self, created_task):
        """POST /api/work/tasks/{id}/complete - should fail with empty outcome_notes"""
        task_id = created_task["id"]
        
        complete_payload = {
            "outcome": "success",
            "outcome_notes": "   "  # Empty/whitespace only
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks/{task_id}/complete",
            json=complete_payload
        )
        
        # Should fail
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        print(f"✅ Correctly rejected completion with empty outcome_notes: {response.status_code}")


class TestTaskReschedule:
    """Test task rescheduling"""
    
    def test_reschedule_task_success(self):
        """POST /api/work/tasks/{id}/reschedule - reschedule task"""
        # First create a task
        due_at = (datetime.utcnow() + timedelta(hours=4)).isoformat() + "Z"
        
        create_payload = {
            "title": "TEST_Task for reschedule test",
            "task_type": "arrange_site_visit",
            "owner_id": "user-001",
            "due_at": due_at,
            "related_entity_type": "deal",
            "related_entity_id": "deal-reschedule-001",
            "priority": "high"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/work/tasks", json=create_payload)
        assert create_response.status_code == 200
        task_id = create_response.json()["id"]
        old_due = create_response.json()["due_at"]
        
        # Now reschedule
        new_due_at = (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"
        reschedule_payload = {
            "new_due_at": new_due_at,
            "reason": "Khach ban, hen lai ngay khac"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/work/tasks/{task_id}/reschedule",
            json=reschedule_payload
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["due_at"] != old_due, "Due date should be changed"
        print(f"✅ Task rescheduled from {old_due[:10]} to {data['due_at'][:10]}")


class TestDailyWorkboard:
    """Test Daily Workboard API"""
    
    def test_get_daily_workboard_for_user(self):
        """GET /api/work/tasks/my-day?user_id=user-001 - Daily Workboard API"""
        response = requests.get(
            f"{BASE_URL}/api/work/tasks/my-day",
            params={"user_id": "user-001"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "greeting" in data
        assert "date_display" in data
        assert "stats" in data
        assert "overdue_tasks" in data
        assert "today_tasks" in data
        assert "upcoming_tasks" in data
        assert "recent_activities" in data
        
        # Verify stats structure
        stats = data["stats"]
        assert "overdue_count" in stats
        assert "today_count" in stats
        assert "completed_today" in stats
        assert "total_this_week" in stats
        
        print(f"✅ Daily workboard returned: greeting='{data['greeting']}', stats={stats}")
        return data
    
    def test_workboard_has_overdue_today_upcoming_sections(self):
        """Verify workboard has all three task sections"""
        response = requests.get(
            f"{BASE_URL}/api/work/tasks/my-day",
            params={"user_id": "user-001"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All sections should be lists (may be empty)
        assert isinstance(data["overdue_tasks"], list)
        assert isinstance(data["today_tasks"], list)
        assert isinstance(data["upcoming_tasks"], list)
        
        # If tasks exist, verify structure
        for task in data["overdue_tasks"][:1]:  # Check first one if exists
            assert "id" in task
            assert "title" in task
            assert "task_type" in task
            assert "due_at" in task
            assert "is_overdue" in task
        
        print(f"✅ Workboard sections: overdue={len(data['overdue_tasks'])}, today={len(data['today_tasks'])}, upcoming={len(data['upcoming_tasks'])}")


class TestNextBestActions:
    """Test Next Best Actions API"""
    
    def test_get_next_best_actions_for_user(self):
        """GET /api/work/follow-up/next-actions?user_id=user-001 - Next Best Actions API"""
        response = requests.get(
            f"{BASE_URL}/api/work/follow-up/next-actions",
            params={"user_id": "user-001"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "urgent_actions" in data
        assert "important_actions" in data
        assert "total_pending" in data
        
        assert isinstance(data["urgent_actions"], list)
        assert isinstance(data["important_actions"], list)
        
        # If actions exist, verify structure
        all_actions = data["urgent_actions"] + data["important_actions"]
        for action in all_actions[:1]:  # Check first one
            assert "task_id" in action
            assert "task_code" in action
            assert "title" in action
            assert "priority_score" in action
            assert "urgency_level" in action
            assert "urgency_reason" in action
        
        print(f"✅ Next best actions: urgent={len(data['urgent_actions'])}, important={len(data['important_actions'])}, total_pending={data['total_pending']}")


class TestManagerWorkload:
    """Test Manager Workload API"""
    
    def test_get_manager_workload(self):
        """GET /api/work/manager/workload - Manager Workload API"""
        response = requests.get(f"{BASE_URL}/api/work/manager/workload")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_team_tasks" in data
        assert "total_overdue" in data
        assert "total_completed_today" in data
        assert "team_completion_rate" in data
        assert "users" in data
        assert "bottleneck_alerts" in data
        
        assert isinstance(data["users"], list)
        assert isinstance(data["bottleneck_alerts"], list)
        
        # Verify user workload structure if users exist
        for user in data["users"][:1]:
            assert "user_id" in user
            assert "total_active" in user
            assert "overdue" in user
            assert "completed_today" in user
            assert "completion_rate" in user
            assert "is_overloaded" in user
        
        # Verify bottleneck alert structure if alerts exist
        for alert in data["bottleneck_alerts"][:1]:
            assert "alert_type" in alert
            assert "alert_level" in alert
            assert "title" in alert
            assert "count" in alert
        
        print(f"✅ Manager workload: team_tasks={data['total_team_tasks']}, overdue={data['total_overdue']}, users={len(data['users'])}, alerts={len(data['bottleneck_alerts'])}")


class TestEntityTypeConfig:
    """Test entity type config API"""
    
    def test_get_entity_types(self):
        """GET /api/work/config/entity-types - get entity types"""
        response = requests.get(f"{BASE_URL}/api/work/config/entity-types")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 7, f"Expected at least 7 entity types, got {len(data)}"
        
        codes = [e["code"] for e in data]
        required_entities = ["lead", "contact", "deal", "booking", "contract"]
        for req in required_entities:
            assert req in codes, f"Missing entity type: {req}"
        
        print(f"✅ Entity types: {codes}")


class TestTaskCategories:
    """Test task categories config API"""
    
    def test_get_task_categories(self):
        """GET /api/work/config/task-categories - get task categories"""
        response = requests.get(f"{BASE_URL}/api/work/config/task-categories")
        
        assert response.status_code == 200
        data = response.json()
        
        codes = [c["code"] for c in data]
        required_categories = ["sales", "finance", "admin", "legal", "recovery", "general"]
        for req in required_categories:
            assert req in codes, f"Missing category: {req}"
        
        # Verify structure
        for cat in data:
            assert "code" in cat
            assert "label" in cat
            assert "types" in cat
            assert isinstance(cat["types"], list)
        
        print(f"✅ Task categories: {codes}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
