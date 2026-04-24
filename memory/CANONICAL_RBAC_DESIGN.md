# PROHOUZING CANONICAL RBAC DESIGN DOCUMENT
## Prompt 4/20 Part B-H - FINAL OUTPUT

**Version:** 2.0.0  
**Date:** December 2025  
**Status:** IMPLEMENTED

---

## I. CANONICAL ORGANIZATION MODEL

### Structure
```
Company (Organization)
├── Branch (OrganizationalUnit: type=branch)
│   ├── Team (OrganizationalUnit: type=team)
│   │   └── Users (sales_agent, team_leader)
│   │
│   └── Back-office (no team required)
│       └── Users (hr_admin, legal, finance, marketing)
```

### User Fields (Required)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | ✅ | Primary key |
| org_id | UUID | ✅ | Company ID |
| primary_unit_id | UUID | ✅ | Branch/Team ID |
| manager_id | UUID | Optional | Reporting line |
| role | string | ✅ | Primary role code |
| status | enum | ✅ | active/inactive/suspended |

### Rules
- Sales roles (sales_agent, team_leader) MUST have team_id
- Back-office roles (hr_admin, legal, finance) can be branch-level only
- Manager = user with subordinates in same unit
- CEO = full company scope

---

## II. CANONICAL ROLE MODEL (9 ROLES)

| # | Code | Vietnamese | English | Level | Scope |
|---|------|-----------|---------|-------|-------|
| 1 | system_admin | Quản trị hệ thống | System Admin | 0 | global |
| 2 | ceo | Tổng giám đốc | CEO | 1 | all |
| 3 | branch_manager | Giám đốc chi nhánh | Branch Manager | 2 | branch |
| 4 | team_leader | Trưởng nhóm | Team Leader | 3 | team |
| 5 | sales_agent | Nhân viên kinh doanh | Sales Agent | 4 | self |
| 6 | marketing | Marketing | Marketing | 4 | all |
| 7 | hr_admin | Nhân sự | HR Admin | 4 | all |
| 8 | legal | Pháp lý | Legal | 4 | branch |
| 9 | finance | Tài chính | Finance | 4 | branch |

**Rule:** KHÔNG tạo thêm role nếu không thật sự cần

---

## III. PERMISSION MATRIX

### Actions
- `view` - Xem
- `create` - Tạo mới
- `edit` - Chỉnh sửa
- `delete` - Xóa
- `assign` - Phân công
- `approve` - Phê duyệt
- `export` - Xuất báo cáo

### Scopes
- `self` - Chỉ data của mình
- `team` - Data của team
- `branch` - Data của chi nhánh
- `all` - Toàn company

### Matrix (Core Resources)

#### LEADS / CUSTOMERS
| Role | view | create | edit | delete | assign | export |
|------|------|--------|------|--------|--------|--------|
| sales_agent | self | self | self | - | - | - |
| team_leader | team | team | team | - | team | team |
| branch_manager | branch | branch | branch | - | branch | branch |
| ceo | all | all | all | - | all | all |

#### DEALS
| Role | view | create | edit | delete | approve | assign |
|------|------|--------|------|--------|---------|--------|
| sales_agent | self | self | self | - | - | - |
| team_leader | team | team | team | - | - | team |
| branch_manager | branch | branch | branch | - | branch | branch |
| ceo | all | all | all | - | all | all |

#### CONTRACTS
| Role | view | create | edit | approve |
|------|------|--------|------|---------|
| sales_agent | self | - | - | - |
| team_leader | team | - | - | - |
| legal | all | all | all | all |
| ceo | all | all | all | all |

#### COMMISSIONS
| Role | view | edit | approve | export |
|------|------|------|---------|--------|
| sales_agent | self | - | - | - |
| finance | all | all | all | all |
| ceo | all | all | all | all |

---

## IV. OWNERSHIP MODEL

### Required Fields per Entity
```python
# Every business entity must have:
owner_user_id = Column(GUID(), ForeignKey("users.id"))  # Primary owner
created_by = Column(GUID(), ForeignKey("users.id"))     # Creator
assigned_to = Column(GUID(), ForeignKey("users.id"))    # Optional assignee
team_id = Column(GUID(), ForeignKey("organizational_units.id"))
branch_id = Column(GUID(), ForeignKey("organizational_units.id"))
```

### Reassignment Tracking
```python
# When ownership changes:
class OwnershipChange:
    entity_type: str
    entity_id: UUID
    old_owner_id: UUID
    new_owner_id: UUID
    changed_by: UUID
    changed_at: datetime
    reason: Optional[str]
```

---

## V. VISIBILITY MODEL

### 4 Levels
1. **Menu visibility (UI)** - What menu items user sees
2. **Page access** - Can user access the page
3. **Record-level access** - Which records user can see (IMPLEMENTED)
4. **Field-level access** - Optional, for sensitive fields

### Field-level (Sensitive Fields)
- `deal_value` - Hidden from junior sales
- `commission_rate` - Visible only to owner + finance
- `legal_notes` - Visible only to legal + admin

---

## VI. APPROVAL FOUNDATION

### Generic Approval Model
```python
class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

# Fields on approvalable entities:
approval_status = Column(String(50), default="pending")
approved_by = Column(GUID(), ForeignKey("users.id"))
approved_at = Column(DateTime)
approval_comment = Column(Text)
```

### Applies To
- Contracts
- Commissions
- Deal stage transitions (optional)
- Listing verification (future)

---

## VII. ROLE-BASED UI

### Sidebar Menu per Role

**sales_agent:**
- Dashboard
- Leads
- Customers
- Deals
- Products
- My Commissions

**team_leader:**
- Dashboard
- Leads
- Customers
- Deals
- Products
- Team

**branch_manager:**
- Dashboard
- Leads
- Customers
- Deals
- Products
- Contracts
- Commissions
- Team
- Reports

**hr_admin:**
- Dashboard
- Employees
- Reports

**finance:**
- Dashboard
- Commissions
- Contracts
- Reports

---

## VIII. MIGRATION STRATEGY

### Legacy Role Mapping
```python
LEGACY_ROLE_MAPPING = {
    "admin": "system_admin",
    "bod": "ceo",
    "super_admin": "system_admin",
    "manager": "team_leader",
    "sales": "sales_agent",
    "ctv": "sales_agent",
    "viewer": "sales_agent",  # Fallback
}
```

### Steps
1. Keep old roles in database
2. Map at runtime using `get_canonical_role()`
3. New users get canonical roles directly
4. Gradually update existing users

---

## IX. FILES CHANGED

### New Files
| File | Purpose |
|------|---------|
| `/app/backend/config/canonical_rbac.py` | Central RBAC configuration |
| `/app/backend/core/routes/rbac_v2.py` | RBAC API endpoints |

### Modified Files
| File | Change |
|------|--------|
| `/app/backend/core/services/permission.py` | Use canonical roles |
| `/app/backend/core/services/auth_service.py` | Dynamic permissions from matrix |
| `/app/backend/core/routes/__init__.py` | Register rbac_v2 router |

---

## X. API ENDPOINTS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v2/rbac/roles` | GET | List all canonical roles |
| `/api/v2/rbac/my-config` | GET | Get current user's RBAC config |
| `/api/v2/rbac/check-permission` | GET | Check specific permission |
| `/api/v2/rbac/permission-matrix` | GET | Full matrix (admin only) |
| `/api/v2/rbac/sidebar-menu/{role}` | GET | Get sidebar for role |

---

## XI. DESIGN PRINCIPLES

1. **Simple over complex** - 9 roles max, no ABAC
2. **Scope-based** - self/team/branch/all
3. **Backward compatible** - Legacy roles mapped
4. **Central config** - Single source of truth
5. **UI-driven** - Sidebar/menu per role
6. **Scale-ready** - Multi-company support built-in

---

## XII. ACCEPTANCE CRITERIA ✅

- [x] Organization model defined (Company > Branch > Team)
- [x] 9 canonical roles defined
- [x] Permission matrix implemented
- [x] Ownership model documented
- [x] Visibility model (4 levels) defined
- [x] Approval foundation ready
- [x] Role-based UI config created
- [x] Legacy role mapping implemented
- [x] API endpoints for frontend
- [x] No breaking changes to existing system

---

**PROMPT 4/20 PART B-H: COMPLETE**
