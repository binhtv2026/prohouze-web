"""
ProHouzing RBAC API Tests
Prompt 4/20 - Organization & Permission Foundation

Tests for:
- Roles endpoints (GET /api/rbac/roles, GET /api/rbac/roles/{role_code})
- Permission matrix (GET /api/rbac/permissions/matrix)
- Standard departments (GET /api/rbac/standard/departments)
- Organization hierarchy (branches, departments, teams)
- Organization tree
"""

import pytest
import requests
import os

# Get base URL from environment or use default
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '')
if not BASE_URL:
    # Try to read from frontend .env file
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip()
                    break
    except:
        pass
    
if not BASE_URL:
    BASE_URL = 'https://content-machine-18.preview.emergentagent.com'

BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_USER_EMAIL = "admin@prohouzing.vn"
TEST_USER_PASSWORD = "admin123"


class TestAuth:
    """Authentication setup for RBAC tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for testing"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.text}")
        return response.json().get("access_token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}


class TestRolesAPI(TestAuth):
    """Tests for role-related endpoints"""
    
    def test_get_all_roles_returns_12_system_roles(self, auth_headers):
        """GET /api/rbac/roles should return 12 system roles"""
        response = requests.get(f"{BASE_URL}/api/rbac/roles", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "roles" in data, "Response should contain 'roles' key"
        
        roles = data["roles"]
        assert len(roles) == 12, f"Expected 12 roles, got {len(roles)}"
        
        # Verify all expected role codes exist
        expected_role_codes = [
            "system_admin", "ceo", "branch_director", "department_head",
            "team_leader", "sales_agent", "marketing_staff", "content_creator",
            "hr_staff", "finance_staff", "legal_staff", "collaborator"
        ]
        actual_codes = [r["code"] for r in roles]
        
        for expected in expected_role_codes:
            assert expected in actual_codes, f"Missing role: {expected}"
        
        # Verify each role has required fields
        for role in roles:
            assert "code" in role, f"Role missing 'code': {role}"
            assert "name" in role, f"Role missing 'name': {role}"
            assert "name_vi" in role, f"Role missing 'name_vi': {role}"
            assert "level" in role, f"Role missing 'level': {role}"
        
        print(f"✓ Found all 12 system roles: {actual_codes}")
    
    def test_get_role_detail_returns_permissions(self, auth_headers):
        """GET /api/rbac/roles/{role_code} should return role details with permissions"""
        role_code = "system_admin"
        response = requests.get(f"{BASE_URL}/api/rbac/roles/{role_code}", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["code"] == role_code, f"Expected code '{role_code}', got '{data.get('code')}'"
        assert "name" in data, "Response should contain 'name'"
        assert "name_vi" in data, "Response should contain 'name_vi'"
        assert "level" in data, "Response should contain 'level'"
        assert "description" in data, "Response should contain 'description'"
        assert "permissions" in data, "Response should contain 'permissions'"
        
        # Verify permissions structure - system_admin should have full access
        permissions = data["permissions"]
        assert len(permissions) > 0, "system_admin should have permissions"
        
        # Check that permissions have format "resource.action": "scope"
        for perm_key, scope in permissions.items():
            assert "." in perm_key, f"Permission key should be 'resource.action' format: {perm_key}"
            assert scope in ["all", "branch", "department", "team", "self", "none"], f"Invalid scope: {scope}"
        
        print(f"✓ Role '{role_code}' has {len(permissions)} permissions")
    
    def test_get_role_detail_404_for_invalid_role(self, auth_headers):
        """GET /api/rbac/roles/{invalid} should return 404"""
        response = requests.get(f"{BASE_URL}/api/rbac/roles/invalid_role_xyz", headers=auth_headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid role returns 404")
    
    def test_sales_agent_role_has_limited_permissions(self, auth_headers):
        """Sales agent should have self-scoped permissions"""
        response = requests.get(f"{BASE_URL}/api/rbac/roles/sales_agent", headers=auth_headers)
        
        assert response.status_code == 200
        
        data = response.json()
        permissions = data["permissions"]
        
        # Sales agent should have lead.view with self scope
        assert "lead.view" in permissions, "sales_agent should have lead.view permission"
        assert permissions["lead.view"] == "self", f"Expected 'self' scope, got '{permissions['lead.view']}'"
        
        # Sales agent should NOT have lead.assign
        if "lead.assign" in permissions:
            assert permissions["lead.assign"] == "none", "sales_agent should not have assign permission"
        
        print(f"✓ Sales agent has correct limited permissions")


class TestPermissionMatrixAPI(TestAuth):
    """Tests for permission matrix endpoint"""
    
    def test_get_permission_matrix(self, auth_headers):
        """GET /api/rbac/permissions/matrix should return complete matrix"""
        response = requests.get(f"{BASE_URL}/api/rbac/permissions/matrix", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "roles" in data, "Matrix should contain 'roles'"
        assert "resources" in data, "Matrix should contain 'resources'"
        assert "actions" in data, "Matrix should contain 'actions'"
        assert "scopes" in data, "Matrix should contain 'scopes'"
        assert "matrix" in data, "Matrix should contain 'matrix'"
        
        # Verify roles list
        assert len(data["roles"]) == 12, f"Expected 12 roles, got {len(data['roles'])}"
        
        # Verify resources list (should have 23 resources)
        resources = data["resources"]
        assert len(resources) >= 20, f"Expected at least 20 resources, got {len(resources)}"
        
        expected_resources = ["lead", "customer", "deal", "booking", "contract", "task", "user", "role"]
        for res in expected_resources:
            assert res in resources, f"Missing resource: {res}"
        
        # Verify actions list (8 actions)
        actions = data["actions"]
        expected_actions = ["view", "create", "edit", "delete", "assign", "approve", "export", "import"]
        for action in expected_actions:
            assert action in actions, f"Missing action: {action}"
        
        # Verify scopes list (6 scopes)
        scopes = data["scopes"]
        expected_scopes = ["none", "self", "team", "department", "branch", "all"]
        for scope in expected_scopes:
            assert scope in scopes, f"Missing scope: {scope}"
        
        # Verify matrix structure
        matrix = data["matrix"]
        assert len(matrix) > 0, "Matrix should not be empty"
        assert "system_admin" in matrix, "Matrix should include system_admin"
        
        print(f"✓ Permission matrix has {len(data['roles'])} roles, {len(resources)} resources, {len(actions)} actions")


class TestStandardDepartmentsAPI(TestAuth):
    """Tests for standard departments endpoint"""
    
    def test_get_standard_departments_returns_8(self, auth_headers):
        """GET /api/rbac/standard/departments should return 8 departments"""
        response = requests.get(f"{BASE_URL}/api/rbac/standard/departments", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "departments" in data, "Response should contain 'departments'"
        
        departments = data["departments"]
        assert len(departments) == 8, f"Expected 8 departments, got {len(departments)}"
        
        # Verify expected department codes
        expected_codes = ["management", "sales", "marketing", "hr", "finance", "legal", "operations", "it"]
        actual_codes = [d["code"] for d in departments]
        
        for expected in expected_codes:
            assert expected in actual_codes, f"Missing department: {expected}"
        
        # Verify each department has required fields
        for dept in departments:
            assert "code" in dept, f"Department missing 'code': {dept}"
            assert "name" in dept, f"Department missing 'name': {dept}"
            assert "name_en" in dept, f"Department missing 'name_en': {dept}"
        
        print(f"✓ Found 8 standard departments: {actual_codes}")


class TestOrganizationHierarchyAPI(TestAuth):
    """Tests for organization hierarchy endpoints (branches, departments, teams)"""
    
    def test_get_branches_works(self, auth_headers):
        """GET /api/rbac/branches should work (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/rbac/branches", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Branches endpoint works, found {len(data)} branches")
    
    def test_get_departments_works(self, auth_headers):
        """GET /api/rbac/departments should work (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/rbac/departments", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Departments endpoint works, found {len(data)} departments")
    
    def test_get_teams_works(self, auth_headers):
        """GET /api/rbac/teams should work (may be empty)"""
        response = requests.get(f"{BASE_URL}/api/rbac/teams", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        print(f"✓ Teams endpoint works, found {len(data)} teams")


class TestOrganizationTreeAPI(TestAuth):
    """Tests for organization tree endpoint"""
    
    def test_get_organization_tree_works(self, auth_headers):
        """GET /api/rbac/organization/tree should return tree structure"""
        response = requests.get(f"{BASE_URL}/api/rbac/organization/tree", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tree" in data, "Response should contain 'tree'"
        
        tree = data["tree"]
        assert isinstance(tree, list), "Tree should be a list"
        
        # If tree has nodes, verify structure
        if len(tree) > 0:
            node = tree[0]
            assert "id" in node, "Tree node should have 'id'"
            assert "type" in node, "Tree node should have 'type'"
            assert "name" in node, "Tree node should have 'name'"
        
        print(f"✓ Organization tree endpoint works, found {len(tree)} root nodes")


class TestStandardRolesAPI(TestAuth):
    """Tests for standard roles endpoint"""
    
    def test_get_standard_roles(self, auth_headers):
        """GET /api/rbac/standard/roles should return all system roles"""
        response = requests.get(f"{BASE_URL}/api/rbac/standard/roles", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "roles" in data, "Response should contain 'roles'"
        
        roles = data["roles"]
        assert len(roles) == 12, f"Expected 12 roles, got {len(roles)}"
        
        # Verify each role has required fields
        for role in roles:
            assert "code" in role, f"Role missing 'code': {role}"
            assert "name" in role, f"Role missing 'name': {role}"
            assert "name_vi" in role, f"Role missing 'name_vi': {role}"
            assert "level" in role, f"Role missing 'level': {role}"
        
        print(f"✓ Standard roles endpoint works, found {len(roles)} roles")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
