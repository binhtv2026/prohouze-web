# PROHOUZING ACCESS AUDIT REPORT
## Prompt 4/20 - Part A: Organization & Access Control Audit

**Ngày audit:** December 2025  
**Phiên bản:** 1.0.0  
**Trạng thái:** CRITICAL ISSUES FOUND

---

## EXECUTIVE SUMMARY

Audit đã phát hiện **4 vấn đề nghiêm trọng** ảnh hưởng trực tiếp đến bảo mật và data integrity của hệ thống:

1. **Data Visibility bị lộ:** Tất cả users trong cùng org có thể xem toàn bộ data (leads, deals, customers)
2. **Ownership Model không hoạt động:** Logic kiểm tra owner tồn tại nhưng không được áp dụng
3. **Role mapping không đồng bộ:** 2 hệ thống role riêng biệt, conflict với nhau
4. **Hardcoded permissions:** Permission matrix cứng, không thể config từ database

---

## 1. DATA VISIBILITY AUDIT

### 1.1 CRITICAL: `get_multi()` KHÔNG apply visibility filter

**File:** `/app/backend/core/services/base.py`  
**Lines:** 170-255

```python
def get_multi(
    self,
    db: Session,
    *,
    org_id: UUID,         # CHỈ FILTER THEO ORG_ID
    skip: int = 0,
    limit: int = 20,
    filters: Optional[Dict[str, Any]] = None,
    ...
) -> tuple[List[ModelType], int]:
    # Base query
    query = select(self.model)
    
    # Multi-tenant filter - CHỈ CÓ ORG_ID
    if hasattr(self.model, 'org_id'):
        query = query.where(self.model.org_id == org_id)
    
    # THIẾU: visibility filter dựa trên role/owner
```

**Hậu quả:**
- Sales Agent có thể xem TẤT CẢ leads của công ty
- Không có phân quyền theo team/branch
- Vi phạm nguyên tắc least privilege

---

### 1.2 CRITICAL: Routes không áp dụng visibility

**File:** `/app/backend/core/routes/leads.py`  
**Lines:** 58-113

```python
@router.get("", response_model=APIResponse[List[LeadListItem]])
async def list_leads(
    ...
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    # CHỈ CHECK PERMISSION, KHÔNG FILTER DATA
    leads, total = lead_service.get_multi(
        db,
        org_id=current_user.org_id,  # CHỈ CÓ ORG_ID
        skip=skip,
        limit=limit,
        ...
    )
```

**Tương tự với:**
- `/app/backend/core/routes/deals.py` (lines 60-110)
- `/app/backend/core/routes/customers.py` (lines 60-110)

---

### 1.3 UNUSED: permission_service.build_visibility_filter()

**File:** `/app/backend/core/services/permission.py`  
**Lines:** 284-358

```python
@staticmethod
def build_visibility_filter(
    user_scope: Dict[str, Any],
    model_class: Any
) -> list:
    """
    Build SQLAlchemy filter conditions for visibility.
    """
    # CODE HOÀN CHỈNH NHƯNG KHÔNG ĐƯỢC GỌI Ở ĐÂU!
```

**Vấn đề:** Function này được viết nhưng không được import/sử dụng trong bất kỳ route hay service nào.

---

## 2. OWNERSHIP MODEL AUDIT

### 2.1 Models có fields ownership nhưng không được sử dụng

**Lead Model:** `/app/backend/core/models/lead.py`
```python
owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
created_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
```

**Deal Model:** `/app/backend/core/models/deal.py`
```python
owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
```

**Customer Model:** `/app/backend/core/models/customer.py`
```python
owner_user_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
owner_unit_id = Column(GUID(), ForeignKey("organizational_units.id"), nullable=True)
```

### 2.2 Service layer KHÔNG check ownership

**File:** `/app/backend/core/services/base.py`  
**Method:** `get()`

```python
def get(
    self,
    db: Session,
    *,
    id: UUID,
    org_id: UUID,
    ...
) -> Optional[ModelType]:
    query = select(self.model).where(self.model.id == id)
    
    # CHỈ CHECK ORG_ID
    if hasattr(self.model, 'org_id'):
        query = query.where(self.model.org_id == org_id)
    
    # THIẾU: Check owner_user_id hoặc can_access_entity()
```

### 2.3 Route-level không verify ownership

**File:** `/app/backend/core/routes/leads.py`  
**Lines:** 116-138

```python
@router.get("/{lead_id}", response_model=APIResponse[LeadResponse])
async def get_lead(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_permission("leads", "view"))
):
    # GET LEAD BY ID - KHÔNG CHECK OWNER
    lead = lead_service.get(
        db,
        id=lead_id,
        org_id=current_user.org_id  # CHỈ CÓ ORG_ID
    )
    # THIẾU: permission_service.can_access_entity(user_scope, lead)
```

---

## 3. ROLE MAPPING AUDIT

### 3.1 HAI HỆ THỐNG ROLE SONG SONG

#### System A: dependencies.py + auth_service.py (PostgreSQL core)

**File:** `/app/backend/core/dependencies.py`

```python
class CurrentUser:
    def has_permission(self, resource: str, action: str) -> bool:
        permission_key = f"{resource}.{action}"
        # HARDCODE: Admin bypass
        if self.role in ["admin", "bod", "super_admin"]:  # Line 47
            return True
        return permission_key in self.permissions
```

**File:** `/app/backend/core/services/auth_service.py`

```python
def _get_default_permissions(self, role: str) -> dict:
    permissions = {
        "bod": {...},      # Roles định nghĩa ở đây
        "admin": {...},
        "manager": {...},
        "sales": {...},
        "marketing": {...}
    }
```

#### System B: rbac_config.py + rbac_router.py (MongoDB legacy)

**File:** `/app/backend/config/rbac_config.py`

```python
class SystemRole(str, Enum):
    SYSTEM_ADMIN = "system_admin"
    CEO = "ceo"
    BRANCH_DIRECTOR = "branch_director"
    DEPARTMENT_HEAD = "department_head"
    TEAM_LEADER = "team_leader"
    SALES_AGENT = "sales_agent"
    ...
```

### 3.2 CONFLICT TABLE

| System A (auth_service.py) | System B (rbac_config.py) | Status |
|---------------------------|--------------------------|--------|
| `admin` | `system_admin` | CONFLICT |
| `bod` | `ceo` | CONFLICT |
| `manager` | `branch_director`, `team_leader` | UNCLEAR |
| `sales` | `sales_agent` | SIMILAR |
| - | `department_head` | MISSING |
| - | `collaborator` | MISSING |

### 3.3 LEGACY_ROLE_MAPPING exists but incomplete

**File:** `/app/backend/config/rbac_config.py`

```python
LEGACY_ROLE_MAPPING = {
    "admin": "system_admin",
    "bod": "ceo",
    "manager": "team_leader",
    "sales": "sales_agent",
    ...
}
```

**Vấn đề:** Mapping này chỉ được dùng trong `/api/rbac/*` routes, không apply cho core routes.

---

## 4. HARDCODED PERMISSION AUDIT

### 4.1 dependencies.py - Admin bypass hardcoded

**File:** `/app/backend/core/dependencies.py`  
**Lines:** 43-49

```python
def has_permission(self, resource: str, action: str) -> bool:
    permission_key = f"{resource}.{action}"
    # HARDCODED BYPASS
    if self.role in ["admin", "bod", "super_admin"]:
        return True
    return permission_key in self.permissions
```

**Vấn đề:** 
- Không thể thay đổi admin roles từ database
- Không support role hierarchy

---

### 4.2 auth_service.py - Permission matrix hardcoded

**File:** `/app/backend/core/services/auth_service.py`  
**Lines:** 308-357

```python
def _get_default_permissions(self, role: str) -> dict:
    permissions = {
        "bod": {
            "leads": ["view", "create", "edit", "delete", "assign", "export"],
            "deals": ["view", "create", "edit", "delete", "approve"],
            ...
        },
        # HARDCODED FOR EACH ROLE
    }
    return permissions.get(role, permissions["sales"])
```

**Vấn đề:**
- Không thể customize permissions per organization
- Thêm role mới = sửa code

---

### 4.3 require_permission() - No scope awareness

**File:** `/app/backend/core/dependencies.py`  
**Lines:** 136-157

```python
def require_permission(resource: str, action: str):
    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user)
    ) -> CurrentUser:
        if not current_user.has_permission(resource, action):
            raise HTTPException(403, detail=f"Permission denied")
        return current_user
    return permission_checker
```

**Vấn đề:**
- Chỉ check "có permission hay không"
- Không return scope (self/team/branch/all)
- Route không biết phải filter data như thế nào

---

### 4.4 rbac_config.py - Static PERMISSION_MATRIX

**File:** `/app/backend/config/rbac_config.py`  
**Lines:** 231-400+

```python
PERMISSION_MATRIX: Dict[str, Dict[str, str]] = {
    SystemRole.SYSTEM_ADMIN.value: {
        **{f"{r}.{a.value}": PermissionScope.ALL.value 
           for r in RESOURCES 
           for a in PermissionAction}
    },
    SystemRole.CEO.value: {
        "lead.view": PermissionScope.ALL.value,
        ...
    },
    # 600+ lines of hardcoded permissions
}
```

**Vấn đề:**
- File Python, không phải database table
- Thay đổi = deploy lại code
- Không support per-org customization

---

## 5. RISK ASSESSMENT

### 5.1 Security Risks

| Risk | Severity | Impact | Likelihood |
|------|----------|--------|------------|
| Data exposure between users | CRITICAL | HIGH | CERTAIN |
| Unauthorized access to entities | CRITICAL | HIGH | CERTAIN |
| Role escalation via hardcoded bypass | HIGH | MEDIUM | POSSIBLE |
| Cross-org data leak | MEDIUM | HIGH | UNLIKELY |

### 5.2 Business Risks

| Risk | Impact |
|------|--------|
| GDPR/Privacy compliance failure | Legal liability |
| Sales team conflict (seeing each other's leads) | Business disruption |
| Cannot onboard enterprise clients | Revenue loss |
| Not suitable as SaaS template | Product limitation |

---

## 6. RECOMMENDATIONS

### Phase 1: Critical Fixes (Immediate)

1. **Integrate visibility filter into base service**
   - Modify `get_multi()` to accept `user_scope` parameter
   - Apply `build_visibility_filter()` conditions to all queries
   
2. **Add ownership check to entity access**
   - Modify `get()` to optionally check `can_access_entity()`
   - Routes must pass current_user scope to service

3. **Unify role system**
   - Choose ONE role system (recommend `rbac_config.py`)
   - Update `auth_service.py` to use `SystemRole` enum
   - Remove hardcoded role lists from `dependencies.py`

### Phase 2: Architecture Refactor

1. **Move permissions to database**
   - Create `role_permissions` table
   - CRUD API for permission management
   - Cache layer for performance

2. **Implement proper RBAC**
   - Role → Permission → Scope model
   - Inheritance support (Team Leader inherits Sales permissions)
   - Per-org customization

3. **Add audit logging**
   - Log all permission checks
   - Track data access patterns

---

## 7. FILES REQUIRING CHANGES

| File | Change Type | Priority |
|------|-------------|----------|
| `/app/backend/core/services/base.py` | Major refactor | P0 |
| `/app/backend/core/routes/leads.py` | Add visibility | P0 |
| `/app/backend/core/routes/deals.py` | Add visibility | P0 |
| `/app/backend/core/routes/customers.py` | Add visibility | P0 |
| `/app/backend/core/dependencies.py` | Remove hardcode | P1 |
| `/app/backend/core/services/auth_service.py` | Unify roles | P1 |
| `/app/backend/config/rbac_config.py` | Keep as canonical | P2 |

---

## APPENDIX A: Code Snippets Requiring Attention

### A.1 Where data is exposed (visibility bypass)

```
/app/backend/core/services/base.py:170-255     - get_multi() no visibility
/app/backend/core/routes/leads.py:58-113       - list_leads() no filter
/app/backend/core/routes/deals.py:60-110       - list_deals() no filter
/app/backend/core/routes/customers.py:60-110   - list_customers() no filter
```

### A.2 Where ownership is ignored

```
/app/backend/core/services/base.py:114-145     - get() no owner check
/app/backend/core/services/lead.py:all         - inherits base.get_multi()
/app/backend/core/services/deal.py:all         - inherits base.get_multi()
/app/backend/core/services/customer.py:all     - inherits base.get_multi()
```

### A.3 Where roles don't match business

```
/app/backend/core/dependencies.py:47           - hardcoded admin roles
/app/backend/core/services/auth_service.py:308 - different role names
/app/backend/config/rbac_config.py:43-67       - canonical roles defined
```

### A.4 Where permissions are hardcoded

```
/app/backend/core/dependencies.py:43-49        - has_permission() bypass
/app/backend/core/services/auth_service.py:308-357 - _get_default_permissions()
/app/backend/config/rbac_config.py:231-400+    - PERMISSION_MATRIX
```

---

**End of Audit Report**
