# Prompt 4/20 - AUDIT REPORT
## Organization, User, Role & Permission Foundation

**Audit Date:** 16/03/2026
**Status:** COMPLETED

---

## 1. FINDINGS SUMMARY

### 1.1 Current Role Definitions

**Backend (`server.py`):**
```python
class UserRole(str, Enum):
    BOD = "bod"           # Ban giám đốc
    MANAGER = "manager"   # Quản lý
    SALES = "sales"       # Sales
    MARKETING = "marketing"
    CONTENT = "content"   # Content creator
    ADMIN = "admin"
```

**Frontend (`navigation.js`):**
```javascript
ROLES = {
  BOD: 'bod',
  ADMIN: 'admin',
  MANAGER: 'manager',
  SALES: 'sales',
  MARKETING: 'marketing',
  HR: 'hr',          // MISSING IN BACKEND!
  CONTENT: 'content',
  LEGAL: 'legal',    // MISSING IN BACKEND!
}
```

### 1.2 Critical Issues Found

| # | Issue | Severity | Location | Impact |
|---|-------|----------|----------|--------|
| 1 | **Role mismatch** FE/BE | HIGH | `server.py`, `navigation.js` | HR, LEGAL roles only exist in FE |
| 2 | **Hardcoded permission checks** | HIGH | `server.py` (30+ places) | Not configurable |
| 3 | **No Organization hierarchy** | HIGH | Database | No Company/Branch/Team structure |
| 4 | **No Permission matrix** | HIGH | Missing | Ad-hoc role checks |
| 5 | **No Approval workflow** | MEDIUM | Missing | Manual processes |
| 6 | **No Ownership tracking** | MEDIUM | Partial | Only `created_by`, missing `assigned_to` history |
| 7 | **Inconsistent visibility** | MEDIUM | `server.py` | Sales/Manager filters scattered |

---

## 2. HARDCODED PERMISSION ANALYSIS

### 2.1 Backend Permission Checks (server.py)

| Line | Endpoint | Allowed Roles | Action |
|------|----------|---------------|--------|
| 1181 | `POST /channels` | bod, admin | Create channel |
| 1208 | `GET /channels` | bod, admin, marketing | View channels |
| 1216 | `PUT /channels/{id}/toggle` | bod, admin | Toggle channel |
| 1248 | `POST /content/generate` | bod, admin, marketing, content | AI generate |
| 1260 | `POST /content` | bod, admin, marketing, content | Create content |
| 1314 | (nested) | bod, admin | Filter all content |
| 1332 | `POST /content/{id}/submit` | owner OR bod, admin | Submit review |
| 1364 | `POST /content/{id}/approve` | bod, admin, manager | Approve content |
| 1439 | `POST /response-templates` | bod, admin, marketing, manager | Create template |
| 1485 | `PUT /templates/{id}/approve` | bod, admin, manager | Approve template |
| 1627-1629 | `GET /leads` | sales: own only, manager: branch only | Visibility |
| 1706 | `POST /leads/{id}/reassign` | bod, admin, manager | Reassign lead |
| 1721 | `POST /distribution-rules` | bod, admin | Create rules |
| 1750 | `GET /distribution-rules` | bod, admin, manager | View rules |
| 1758 | `PUT /rules/{id}/toggle` | bod, admin | Toggle rule |
| 1950 | `GET /tasks` | sales: assigned only | Visibility |
| 1986-1988 | `GET /activities` | sales: own, manager: branch | Visibility |
| 2034-2036 | `GET /notifications` | sales: own, manager: branch | Visibility |
| 2088 | `POST /customers` | bod, admin, manager, marketing | Create customer |
| 2307 | `POST /collaborators` | bod, admin, manager | Create CTV |
| 2337 | `GET /campaign-analytics` | bod, admin, marketing | View analytics |
| 2431 | `POST /projects` | bod, admin | Create project |
| 2470 | `PUT /projects/{id}` | bod, admin | Update project |

### 2.2 Frontend Permission Checks

| File | Component | Check | Action |
|------|-----------|-------|--------|
| `Sidebar.jsx:261` | Menu | `hasRole([role])` | Filter nav items |
| `LeadsPage.jsx:341` | SourceColumn | `hasRole(['bod', 'admin', 'manager', 'marketing'])` | Show source |
| `ProjectsPage.jsx:60` | AddButton | `hasRole(['bod', 'admin'])` | Show add button |
| `KPIPage.jsx:149` | KPITable | `hasRole(['bod', 'admin', 'manager'])` | Show all KPIs |
| `AutomationPage.jsx:59` | Rules | `hasRole(...)` | Access |

### 2.3 Navigation Role Groups

```javascript
ROLE_GROUPS = {
  ALL: [bod, admin, manager, sales, marketing, hr, content, legal],
  MANAGEMENT: [bod, admin, manager],
  SALES_TEAM: [bod, admin, manager, sales],
  MARKETING_TEAM: [bod, admin, marketing, content],
  HR_TEAM: [bod, admin, hr],
  ADMIN_ONLY: [bod, admin],
}
```

---

## 3. DATA VISIBILITY ANALYSIS

### 3.1 Current Visibility Rules

| Entity | Role | Visibility Scope |
|--------|------|------------------|
| Leads | sales | `assigned_to = current_user.id` |
| Leads | manager | `branch_id = current_user.branch_id` |
| Leads | bod/admin | ALL |
| Tasks | sales | `assigned_to = current_user.id` |
| Tasks | others | ALL (no filter) |
| Activities | sales | `user_id = current_user.id` |
| Activities | manager | `branch_id` filter |
| Customers | ALL | No visibility control! |
| Projects | ALL | No visibility control! |
| Content | non-admin | `created_by = current_user.id` |

### 3.2 Issues

1. **Customers** - Anyone can see all customers (data leak risk)
2. **Projects** - No organization-level filtering
3. **Inconsistent** - Some entities filter by `branch_id`, others don't
4. **No team-level** - Missing `team_id` filtering

---

## 4. ORGANIZATION MODEL ANALYSIS

### 4.1 Current User Model

```python
UserCreate:
  - email, password, full_name, phone
  - role: UserRole
  - department: Department
  - branch_id: Optional[str]  # References non-existent collection
  - team_id: Optional[str]    # References non-existent collection
  - specializations: List[str]
  - regions: List[str]
```

### 4.2 Missing Models

- **Company** - Root organization
- **Branch** - Physical locations (Chi nhánh)
- **Department** - Functional units (Phòng ban)
- **Team** - Work groups within departments
- **Position** - Job titles (Chức danh) vs Role (Permission set)

---

## 5. OWNERSHIP MODEL ANALYSIS

### 5.1 Current Ownership Fields

| Entity | Fields | Missing |
|--------|--------|---------|
| Lead | `created_by`, `assigned_to`, `assigned_at` | `previous_owners[]`, `ownership_history[]` |
| Customer | `created_by` | `assigned_to`, `current_owner` |
| Task | `assigned_to`, `created_by` | History |
| Content | `created_by`, `approved_by` | OK |
| Project | `created_by` | `owner_branch_id` |

### 5.2 Missing Features

- **Ownership transfer audit** - No history of reassignments
- **Handover process** - No formal transfer mechanism
- **Bulk reassignment** - Not supported

---

## 6. APPROVAL WORKFLOW ANALYSIS

### 6.1 Current Approvals

| Entity | Flow | Approvers |
|--------|------|-----------|
| Content | Draft → Pending Review → Approved/Rejected | bod, admin, manager |
| Template | Created → Approved (auto for admin) | bod, admin, manager |

### 6.2 Missing Approval Types

- Commission payout approval
- Contract approval
- Budget approval
- Leave request approval
- Expense approval

---

## 7. RECOMMENDATIONS

### 7.1 Phase 1: Foundation Models

1. **Create Organization hierarchy collections:**
   - `companies` (tenants)
   - `branches` (chi nhánh)
   - `departments` (phòng ban)
   - `teams` (nhóm)

2. **Enhance User model:**
   - Link to organization hierarchy
   - Add `position_id` separate from `role`
   - Add `reports_to` for manager chain

### 7.2 Phase 2: Permission System

1. **Create centralized permission config:**
   ```python
   PERMISSIONS = {
     "lead.view": ["self", "team", "branch", "all"],
     "lead.create": [...],
     "lead.edit": [...],
     "lead.delete": [...],
     "lead.assign": [...],
     ...
   }
   ```

2. **Role-Permission mapping:**
   ```python
   ROLE_PERMISSIONS = {
     "sales": {
       "lead.view": "self",
       "lead.create": True,
       "lead.edit": "self",
     },
     "manager": {
       "lead.view": "branch",
       "lead.assign": "branch",
     }
   }
   ```

### 7.3 Phase 3: Implementation

1. **Backend middleware** for permission checking
2. **Frontend permission context** for UI control
3. **Admin UI** for role/permission management

---

## 8. PRIORITY MATRIX

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Fix FE/BE role mismatch | P0 | Low | High |
| Create permission config | P0 | Medium | Critical |
| Create Organization models | P1 | Medium | High |
| Backend permission middleware | P1 | Medium | Critical |
| Frontend permission hook | P1 | Medium | High |
| Admin UI for roles | P2 | High | Medium |
| Approval workflows | P2 | High | Medium |
| Ownership audit trail | P3 | Medium | Medium |

---

## NEXT STEPS

1. ✅ **Audit Complete** - This document
2. ⏳ **Design Phase** - Create canonical models
3. ⏳ **Backend Implementation** - New permission system
4. ⏳ **Frontend Implementation** - Permission-aware UI
5. ⏳ **Admin UI** - Role/User management
6. ⏳ **Testing** - Full RBAC verification
