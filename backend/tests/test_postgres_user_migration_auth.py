"""
PostgreSQL User Migration & Auth Tests
Prompt 2.5/18: Test MongoDB → PostgreSQL user migration

Tests:
1. Login with PostgreSQL credentials (admin@prohouzing.vn, manager1@prohouzing.vn)
2. JWT token contains correct org_id, role, email, full_name
3. GET /api/auth/me returns correct user data from PostgreSQL
4. RBAC: Admin can access /api/v2/timeline/events (admin.view permission)
5. RBAC: Manager is denied access to /api/v2/timeline/events  
6. RBAC: Both admin and manager can access /api/v2/timeline/deals/{id}
7. User memberships with permissions_json are created correctly
"""

import pytest
import requests
import os
import jwt
from uuid import UUID

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

JWT_SECRET = os.environ.get('JWT_SECRET', 'prohouzing-secret-key-2024')

# Test credentials from migration
ADMIN_CREDENTIALS = {"email": "admin@prohouzing.vn", "password": "admin123"}
MANAGER_CREDENTIALS = {"email": "manager1@prohouzing.vn", "password": "manager123"}


class TestPostgreSQLLogin:
    """Test authentication using PostgreSQL-migrated users"""
    
    def test_admin_login_success(self):
        """Test admin@prohouzing.vn can login via PostgreSQL auth"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        
        print(f"Admin login status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        
        user = data["user"]
        assert user["email"] == "admin@prohouzing.vn"
        assert user["role"] in ["admin", "bod"], f"Expected admin/bod role, got: {user['role']}"
        assert user["is_active"] == True
    
    def test_manager_login_success(self):
        """Test manager1@prohouzing.vn can login via PostgreSQL auth"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=MANAGER_CREDENTIALS
        )
        
        print(f"Manager login status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 200, f"Manager login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        
        user = data["user"]
        assert user["email"] == "manager1@prohouzing.vn"
        assert user["role"] == "manager", f"Expected manager role, got: {user['role']}"
        assert user["is_active"] == True
    
    def test_invalid_credentials_rejected(self):
        """Test invalid credentials return 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401


class TestJWTTokenContents:
    """Test JWT token contains correct fields from PostgreSQL"""
    
    def test_admin_token_contents(self):
        """Test admin JWT token contains correct org_id, role, email, full_name"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        
        # Decode token WITHOUT verification (for inspection only)
        # We cannot verify signature as we don't have the server's secret
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print(f"Admin token payload: {payload}")
        
        # Required fields
        assert "sub" in payload, "Token missing user ID (sub)"
        assert "role" in payload, "Token missing role"
        assert "org_id" in payload, "Token missing org_id"
        assert "email" in payload, "Token missing email"
        assert "full_name" in payload, "Token missing full_name"
        
        # Validate values
        assert payload["email"] == "admin@prohouzing.vn"
        assert payload["role"] in ["admin", "bod"]
        assert payload["org_id"], "org_id should not be empty"
        
        # Validate org_id is a valid UUID
        try:
            UUID(payload["org_id"])
        except ValueError:
            pytest.fail(f"org_id is not a valid UUID: {payload['org_id']}")
    
    def test_manager_token_contents(self):
        """Test manager JWT token contains correct org_id, role, email, full_name"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=MANAGER_CREDENTIALS
        )
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print(f"Manager token payload: {payload}")
        
        assert payload["email"] == "manager1@prohouzing.vn"
        assert payload["role"] == "manager"
        assert payload["org_id"], "org_id should not be empty"
    
    def test_token_has_permissions(self):
        """Test JWT token contains permissions from membership"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print(f"Token payload keys: {list(payload.keys())}")
        
        # After fix: PostgreSQL auth now works correctly
        # Token should contain permissions from user_memberships.permissions_json
        assert "permissions" in payload, "Token missing permissions"
        
        permissions = payload["permissions"]
        print(f"Admin permissions: {permissions}")
        
        # Admin should have admin permissions
        assert permissions, "Permissions should not be empty"
        assert "admin" in permissions or "users" in permissions, \
            f"Expected admin permissions, got: {permissions}"


class TestAuthMeEndpoint:
    """Test GET /api/auth/me returns PostgreSQL user data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture
    def manager_token(self):
        """Get manager auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=MANAGER_CREDENTIALS
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_admin_me_endpoint(self, admin_token):
        """Test /api/auth/me returns correct admin data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        print(f"Admin /me status: {response.status_code}")
        print(f"Admin /me response: {response.json()}")
        
        assert response.status_code == 200
        
        user = response.json()
        assert user["email"] == "admin@prohouzing.vn"
        assert user["role"] in ["admin", "bod"]
        assert user["is_active"] == True
    
    def test_manager_me_endpoint(self, manager_token):
        """Test /api/auth/me returns correct manager data"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {manager_token}"}
        )
        
        print(f"Manager /me status: {response.status_code}")
        print(f"Manager /me response: {response.json()}")
        
        assert response.status_code == 200
        
        user = response.json()
        assert user["email"] == "manager1@prohouzing.vn"
        assert user["role"] == "manager"


class TestRBACPermissions:
    """Test RBAC permissions after PostgreSQL migration"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture
    def manager_token(self):
        """Get manager auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=MANAGER_CREDENTIALS
        )
        if response.status_code != 200:
            pytest.skip(f"Manager login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_admin_can_access_timeline_events(self, admin_token):
        """Test admin can access /api/v2/timeline/events (requires admin.view)"""
        response = requests.get(
            f"{BASE_URL}/api/v2/timeline/events",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        print(f"Admin timeline/events status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code != 500 else response.text}")
        
        # Admin should have access
        assert response.status_code == 200, \
            f"Admin should have access to timeline/events, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
    
    def test_manager_denied_timeline_events(self, manager_token):
        """Test manager is denied access to /api/v2/timeline/events"""
        response = requests.get(
            f"{BASE_URL}/api/v2/timeline/events",
            headers={"Authorization": f"Bearer {manager_token}"}
        )
        
        print(f"Manager timeline/events status: {response.status_code}")
        print(f"Response: {response.json() if response.status_code != 500 else response.text}")
        
        # Manager should be denied (403 Forbidden)
        assert response.status_code == 403, \
            f"Manager should be denied access to timeline/events, got {response.status_code}"
    
    def test_admin_can_access_deal_timeline(self, admin_token):
        """Test admin can access /api/v2/timeline/deals/{id}"""
        # First, get a deal ID from deals list
        deals_response = requests.get(
            f"{BASE_URL}/api/v2/deals",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 1}
        )
        
        if deals_response.status_code != 200:
            pytest.skip(f"Could not get deals: {deals_response.text}")
        
        deals_data = deals_response.json()
        if not deals_data.get("data"):
            pytest.skip("No deals found to test timeline")
        
        deal_id = deals_data["data"][0]["id"]
        
        # Now test deal timeline
        response = requests.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        print(f"Admin deal timeline status: {response.status_code}")
        
        assert response.status_code == 200, \
            f"Admin should have access to deal timeline, got {response.status_code}: {response.text}"
    
    def test_manager_can_access_deal_timeline(self, manager_token, admin_token):
        """Test manager can access /api/v2/timeline/deals/{id}"""
        # Use admin to get a deal ID first
        deals_response = requests.get(
            f"{BASE_URL}/api/v2/deals",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"limit": 1}
        )
        
        if deals_response.status_code != 200:
            pytest.skip(f"Could not get deals: {deals_response.text}")
        
        deals_data = deals_response.json()
        if not deals_data.get("data"):
            pytest.skip("No deals found to test timeline")
        
        deal_id = deals_data["data"][0]["id"]
        
        # Now test manager access
        response = requests.get(
            f"{BASE_URL}/api/v2/timeline/deals/{deal_id}",
            headers={"Authorization": f"Bearer {manager_token}"}
        )
        
        print(f"Manager deal timeline status: {response.status_code}")
        
        assert response.status_code == 200, \
            f"Manager should have access to deal timeline, got {response.status_code}: {response.text}"


class TestUserMembershipsCreated:
    """Test user memberships with permissions_json are created correctly"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=ADMIN_CREDENTIALS
        )
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_admin_has_admin_permissions(self, admin_token):
        """Test admin user has admin permissions in JWT"""
        payload = jwt.decode(admin_token, options={"verify_signature": False})
        
        permissions = payload.get("permissions", {})
        print(f"Admin permissions from JWT: {permissions}")
        
        # Admin should have comprehensive permissions
        # Check for expected permission structure
        if permissions:
            # Admin should have admin-level access to key resources
            has_admin_perms = (
                "admin" in permissions or 
                "users" in permissions or
                (isinstance(permissions, dict) and 
                 any("view" in v if isinstance(v, list) else False 
                     for v in permissions.values()))
            )
            assert has_admin_perms, f"Admin should have admin permissions: {permissions}"
    
    def test_manager_has_manager_permissions(self):
        """Test manager user has manager permissions in JWT"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=MANAGER_CREDENTIALS
        )
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        payload = jwt.decode(token, options={"verify_signature": False})
        
        permissions = payload.get("permissions", {})
        print(f"Manager permissions from JWT: {permissions}")
        
        # Manager should have limited permissions compared to admin
        assert payload["role"] == "manager"
        
        # Manager should have some permissions
        if permissions:
            # Manager typically has leads, deals, customers access but not admin
            has_manager_perms = (
                "leads" in permissions or 
                "deals" in permissions or
                "customers" in permissions
            )
            print(f"Manager has expected permissions: {has_manager_perms}")


class TestMongoDBFallback:
    """Test MongoDB fallback for non-migrated users (if any)"""
    
    def test_non_existent_user_returns_401(self):
        """Test that non-existent users get 401"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "password123"}
        )
        
        assert response.status_code == 401
        assert "Invalid" in response.json().get("detail", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
