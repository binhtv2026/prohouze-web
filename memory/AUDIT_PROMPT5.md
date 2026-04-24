# PROMPT 5/20 - AUDIT REPORT
## Project / Product / Inventory Domain Analysis

**Audit Date:** 16/03/2026
**Status:** COMPLETED

---

## 1. EXECUTIVE SUMMARY

### Current State Assessment
ProHouzing hiện có **2 SYSTEM RIÊNG BIỆT** cho Project/Product không đồng nhất:

1. **Admin Project System** (`admin_project_api.py` + `admin_projects` collection)
   - Dùng cho CMS/Website public
   - Rich content: images, videos, 360 view, virtual tour
   - price_list items ở dạng simplified
   - Không có product inventory thực sự

2. **Sales System** (`sales_models.py` + `sales_api.py`)
   - Dùng cho internal sales
   - ProductUnit model có đầy đủ fields bán hàng
   - Có Booking/Deal/Payment flow
   - Không khớp với Admin Projects

### Critical Issues Identified

| Issue | Severity | Impact |
|-------|----------|--------|
| **2 Product Systems không liên kết** | CRITICAL | Dữ liệu không đồng nhất, duplicate |
| **ProductStatus thiếu states** | HIGH | Không cover đủ lifecycle BĐS sơ cấp |
| **Không có price history** | HIGH | Mất lịch sử giá, khó audit |
| **Không có hold/lock mechanism** | HIGH | Conflict booking |
| **Block/Tower/Floor chưa chuẩn** | MEDIUM | Khó search, filter, report |
| **Không tách internal vs public** | MEDIUM | Risk leak data nội bộ |
| **Status hardcode nhiều nơi** | MEDIUM | Khó maintain |

---

## 2. DETAILED ENTITY ANALYSIS

### 2.1 Admin Projects (`admin_projects` collection)

**File:** `/app/backend/admin_project_api.py`

**Purpose:** CMS/Website project content management

**Fields:**
```python
- id, name, slug, slogan
- location: {address, district, city, map_url, nearby_places}
- type: apartment|villa|townhouse
- price_from, price_to
- status: opening|coming_soon|sold_out
- developer: {name, logo, description}
- description, highlights, amenities
- images, videos, virtual_tour, view_360
- units_total, units_available, area_range
- unit_types: [{name, area, bedrooms, bathrooms, price_from}]
- price_list: {enabled, items: [{block, floor, type, area, price, status}]}
- payment_schedule
- is_hot, completion_date
```

**Issues:**
1. ❌ `price_list.items` là simplified, không phải real inventory
2. ❌ `status` (opening/coming_soon/sold_out) là project-level, không phải unit-level
3. ❌ `units_available` là static number, không linked to actual inventory
4. ❌ Không có product_id linking to sales inventory
5. ❌ unit_types là template, không phải real units

**Used For:** Public website only

---

### 2.2 Sales Projects (`SalesProject` model)

**File:** `/app/backend/sales_models.py`

**Purpose:** Internal sales project tracking

**Fields:**
```python
- name, code, description
- address, district, city
- developer_name, investor_name
- total_units, total_area, floors
- blocks: List[str]  # Just names, no structure
- construction_start, expected_handover
- price_from, price_to
- images, videos, brochure_url
- amenities, legal_status
- status: upcoming|selling|sold_out|completed
```

**Issues:**
1. ❌ `blocks` là simple list string, không phải structured entities
2. ❌ Không có relationship đến ProductUnit
3. ❌ Không có floor structure
4. ❌ Trùng với admin_projects về concept

---

### 2.3 Product Unit (`ProductUnit` model)

**File:** `/app/backend/sales_models.py`

**Purpose:** Individual sellable unit

**Fields:**
```python
- project_id, campaign_id
- code, name
- type: ProductType (apartment|villa|townhouse|shophouse|land|office)
- status: ProductStatus
- block, floor (int), unit_number
- area, bedrooms, bathrooms, direction, view
- base_price, price_per_sqm, total_price
- discount_percent, discount_amount, final_price
- payment_schedule
- floor_plan_url, images
- current_booking_id, booked_by
```

**Issues:**
1. ⚠️ `block` là string, không link to Block entity
2. ⚠️ `floor` là int, không link to Floor entity  
3. ❌ Không có price_history
4. ❌ Không có status_history
5. ❌ Không có hold/lock fields
6. ❌ Không có ownership (assigned_to, responsible_by)
7. ❌ Không tách internal vs public fields

---

### 2.4 Product Status Enum

**Current States:**
```python
class ProductStatus(str, Enum):
    AVAILABLE = "available"
    BOOKING = "booking"
    DEPOSITED = "deposited"
    SOLD = "sold"
    RESERVED = "reserved"
    UNAVAILABLE = "unavailable"
```

**Missing States for Primary Real Estate:**
- `draft` - Mới tạo, chưa active
- `not_open_for_sale` - Chưa mở bán
- `hold` - Đang giữ tạm (có expiry)
- `booking_pending` - Chờ xác nhận booking
- `blocked` - Khóa bởi admin/system
- `inactive` - Tạm ẩn
- `archived` - Đã archive

---

### 2.5 Booking Model

**File:** `/app/backend/sales_models.py`

**Status:** Good foundation, needs linking improvements

**Issues:**
1. ❌ Không có auto-lock product khi booking created
2. ❌ Không có auto-release khi booking expired/cancelled
3. ❌ Booking status và Product status không sync

---

## 3. RELATIONSHIP ANALYSIS

### Current Relationships (Broken)

```
admin_projects (CMS) ─── NO LINK ─── sales_projects (Sales)
                                           │
                                           └── product_units
                                                    │
                                                    └── bookings
                                                    └── deals
```

### Required Relationships (Target)

```
projects (Master)
    │
    ├── project_structures (Block/Tower/Floor)
    │       │
    │       └── products/units
    │               │
    │               ├── inventory_status
    │               ├── price_history
    │               ├── status_history
    │               │
    │               ├── bookings
    │               ├── deals
    │               └── contracts
    │
    └── project_content (CMS/Public)
```

---

## 4. DATA FLOW ISSUES

### Issue 1: Duplicate Project Data
- Admin creates project in `admin_projects` for website
- Sales creates project in `sales_projects` for sales
- No sync, no link, duplicate effort

### Issue 2: Product Inventory Confusion
- `admin_projects.price_list.items` is NOT real inventory
- `product_units` is real inventory but not linked to admin_projects
- Sales sees different data than website shows

### Issue 3: Status Mismatch
- Product sold but admin_project still shows units_available
- Booking created but product status not updated
- No single source of truth

---

## 5. UI/PAGE ANALYSIS

### Pages Found:

| Page | Route | Purpose | Issues |
|------|-------|---------|--------|
| ProjectsPage | `/inventory/projects` | Sales view projects | Uses sales API |
| AdminProjectsPage | `/cms/projects` | Admin manage CMS | Uses admin API |
| (Missing) | - | Product/Unit management | No dedicated page |
| (Missing) | - | Inventory status dashboard | No real-time view |

### UI Issues:
1. ❌ No unified product inventory page
2. ❌ No real-time status visualization
3. ❌ No product detail with full lifecycle view
4. ❌ No filter by block/floor/status properly
5. ❌ Status colors hardcoded in multiple places

---

## 6. CODE ORGANIZATION ISSUES

### Backend Issues:
1. `admin_project_api.py` - Standalone router, not in routes folder
2. `sales_models.py` - All sales models in one file
3. `sales_api.py` - All sales APIs in one file
4. No service layer - Business logic mixed with API
5. Status enums duplicated concepts

### Frontend Issues:
1. Status colors defined in multiple components
2. No central product config
3. API calls scattered, not centralized for products

---

## 7. RECOMMENDATIONS SUMMARY

### Phase 1: Canonical Model Design
1. Merge Project concepts into single source of truth
2. Create proper Block/Floor entity structure
3. Design comprehensive ProductStatus lifecycle
4. Design InventoryStatus separate from ProductStatus

### Phase 2: Data Model Implementation  
1. Create `inventory_config.py` - Single source of truth
2. Create `product_models.py` - Clean product models
3. Create `product_router.py` - Dedicated product APIs
4. Add price_history, status_history collections

### Phase 3: Migration & Compatibility
1. Create adapter for existing admin_projects
2. Create migration for existing product_units
3. Maintain backward compatibility for existing bookings

### Phase 4: UI Enhancement
1. Create unified Product Inventory page
2. Create real-time status dashboard
3. Apply consistent status badges everywhere

---

## 8. FILES TO CREATE/MODIFY

### New Files:
- `/app/backend/config/inventory_config.py` - Product/Inventory status config
- `/app/backend/models/product_models.py` - Clean product domain models
- `/app/backend/routes/product_router.py` - Product CRUD + inventory APIs
- `/app/frontend/src/pages/Inventory/ProductInventoryPage.jsx`
- `/app/frontend/src/pages/Inventory/ProductDetailPage.jsx`

### Modify Files:
- `/app/backend/sales_models.py` - Refactor, keep for Booking/Deal
- `/app/backend/admin_project_api.py` - Add link to unified projects
- `/app/frontend/src/config/navigation.js` - Add Inventory routes

### Keep Unchanged:
- Existing booking flow (enhance linking only)
- Existing deal flow (enhance linking only)
- Admin projects CMS features (add linking)

---

## NEXT STEPS

1. ✅ **Audit Complete** - This document
2. ⏳ **Design Canonical Model** - inventory_config.py
3. ⏳ **Implement Backend** - product_models.py, product_router.py
4. ⏳ **Implement Frontend** - ProductInventoryPage, ProductDetailPage
5. ⏳ **Test & Verify** - Full lifecycle testing
