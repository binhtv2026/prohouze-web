# PROHOUZING PRODUCT/INVENTORY AUDIT REPORT
## PROMPT 5/20 - PART A: AUDIT (10/10 LOCKED)

**Ngày tạo:** 2024-12-XX  
**Trạng thái:** HOÀN THÀNH

---

## A. DATA LAYER AUDIT

### 1. PROJECT MODEL

**Vị trí:** `/app/backend/core/models/product.py` (PostgreSQL)

| Field | Type | Mục đích | Vấn đề |
|-------|------|----------|--------|
| `selling_status` | String | Status bán hàng của dự án | ✅ OK - riêng biệt với product |
| `total_units` | Integer | Số căn tổng | ⚠️ DENORMALIZED - không auto sync |
| `available_units` | Integer | Số căn còn | ⚠️ DENORMALIZED - không auto sync |
| `sold_units` | Integer | Số căn đã bán | ⚠️ DENORMALIZED - không auto sync |

**Vấn đề phát hiện:**
- `total_units`, `available_units`, `sold_units` trong Project model là **denormalized** và **KHÔNG TỰ ĐỘNG SYNC** khi product thay đổi status
- Có 2 Project systems song song:
  1. PostgreSQL: `projects` table (core/models/product.py)
  2. MongoDB: `admin_projects` collection (admin_project_api.py)
  
---

### 2. PRODUCT/UNIT MODEL

**Vị trí:** `/app/backend/core/models/product.py` (PostgreSQL)

| Field | Type | Mục đích | Vấn đề |
|-------|------|----------|--------|
| `inventory_status` | String(50) | Status bán hàng | ⚠️ TRÙNG với business_status |
| `business_status` | String(50) | Status kinh doanh | ⚠️ TRÙNG - mục đích không rõ |
| `availability_status` | String(50) | Status khả dụng | ⚠️ BA STATUS - quá phức tạp |
| `status` | String | Soft delete status | ✅ OK |
| `current_holder_type` | String | Ai đang giữ | ⚠️ Không liên kết với booking/deal |
| `current_holder_id` | UUID | ID holder | ⚠️ Không rõ là user hay entity |
| `current_deal_id` | UUID | Deal đang active | ✅ OK |
| `locked_until` | Date | Lock expiry | ⚠️ Không có auto-release mechanism |
| `locked_by` | UUID | Ai lock | ⚠️ Khác với hold_by trong routes |

**VẤN ĐỀ NGHIÊM TRỌNG - 3 STATUS FIELDS:**
```
inventory_status = "available"    # Trạng thái bán
business_status = "active"        # Trạng thái kinh doanh  
availability_status = "open"      # Khả dụng để bán
```
➡️ **Entity confusion:** Product đang giữ 3 loại status, không rõ cái nào là SOURCE OF TRUTH cho "có thể bán hay không"

---

### 3. INVENTORY STATUS - NẰM Ở ĐÂU?

**HIỆN TRẠNG: PHÂN TÁN NHIỀU NƠI**

| Entity | Status Field | Values | Ai quản lý? |
|--------|--------------|--------|-------------|
| **Product (PG)** | `inventory_status` | available, hold, booked, deposited, sold... | Booking/Deal service, Manual |
| **Product (PG)** | `business_status` | active, suspended | Admin |
| **Product (PG)** | `availability_status` | open, restricted, reserved, locked | Admin |
| **Booking** | `booking_status` | pending, confirmed, expired, converted, cancelled | Booking service |
| **Deal** | `current_stage` | new → won/lost | Deal service |

**VẤN ĐỀ:** Không có SINGLE SOURCE OF TRUTH cho trạng thái sản phẩm

---

### 4. CÁC FIELD TRÙNG LẶP

| Field Nhóm | Trong Product | Trong Config | Vấn đề |
|------------|---------------|--------------|--------|
| Status | `inventory_status`, `business_status`, `availability_status` | `InventoryStatus` enum | 3 fields cho cùng 1 concept |
| Lock/Hold | `locked_until`, `locked_by`, `lock_reason` | `hold_by`, `hold_started_at`, `hold_expires_at` trong routes | 2 bộ fields khác nhau |
| Holder | `current_holder_type`, `current_holder_id` | `hold_by` | Mâu thuẫn |

---

### 5. PRODUCT KHÔNG CÓ STATUS - CÓ XẢY RA KHÔNG?

**Câu trả lời:** CÓ THỂ XẢY RA

```python
# Product model có default:
inventory_status = Column(String(50), default="available")
business_status = Column(String(50), default="active")
availability_status = Column(String(50), default="open")
```

Nhưng:
- MongoDB products (`routes/product_router.py`) dùng `inventory_status` enum từ `inventory_config.py`
- Default trong config là `NOT_FOR_SALE` không khớp với default `available` trong model
- **RỦI RO:** Tạo product từ PostgreSQL model → `available`, tạo từ MongoDB API → `not_for_sale`

---

## B. API / SERVICE LAYER AUDIT

### 1. TẤT CẢ API CREATE/UPDATE PRODUCT

| API Endpoint | Service | Đổi Status? | Vấn đề |
|--------------|---------|-------------|--------|
| `POST /products` (core/routes) | Direct query | Không | ⚠️ Chỉ tạo, không set status |
| `POST /api/inventory/products` (routes/product_router) | MongoDB | Có - `inventory_status` | ✅ Có validation |
| `PUT /products/{id}` | Direct query | KHÔNG CHO PHÉP | ⚠️ Bị block nhưng không có API thay thế |
| `PUT /api/inventory/products/{id}` | MongoDB | KHÔNG | ✅ Đúng - có endpoint riêng |

---

### 2. API UPDATE STATUS

| API Endpoint | Logic | Vấn đề |
|--------------|-------|--------|
| `POST /api/inventory/products/{id}/status` | Check `can_transition_status()` | ✅ Có state machine validation |
| `POST /api/inventory/products/{id}/hold` | Set `HOLD` status + expiry | ✅ Có deadline |
| `POST /api/inventory/products/{id}/release-hold` | Reset to `AVAILABLE` | ⚠️ Không check ai release |
| Booking service `_lock_product()` | Set `booked` | ⚠️ BYPASS state machine |
| Deal service `_hold_product()` | Set `hold` | ⚠️ BYPASS state machine |

**VẤN ĐỀ NGHIÊM TRỌNG - BYPASS LOGIC:**
```python
# booking.py line 133:
product.inventory_status = status  # Trực tiếp set, không check transition

# deal.py line 144:
product.inventory_status = "hold"  # Trực tiếp set, không check transition
```

---

### 3. API BOOKING

| Action | Status Change | Vấn đề |
|--------|---------------|--------|
| `create_booking()` | Product → `booked` | ⚠️ Không dùng `can_transition_status()` |
| `cancel_booking()` | Product → `available` | ⚠️ Không check có Deal active không |
| `confirm_booking()` | Không đổi product status | ✅ OK |
| `convert_to_deposit()` | Không đổi product status | ⚠️ Thiếu - nên đổi sang `deposited` |

**Booking TỰ SET STATUS:** CÓ - booking.py line 133:
```python
def _lock_product(...):
    product.inventory_status = status  # "booked"
    product.current_holder_type = "booking"
```

---

### 4. API DEAL

| Action | Status Change | Vấn đề |
|--------|---------------|--------|
| `create_deal()` | Product → `hold` (nếu có product_id) | ⚠️ Không dùng state machine |
| `change_stage("won")` | Product → `sold` | ⚠️ Không dùng state machine |
| `change_stage("lost/cancelled")` | Product → `available` | ⚠️ Không check có Booking active |
| `assign_product()` | Product → `hold` | ⚠️ Không dùng state machine |

**Deal TỰ SET STATUS:** CÓ - deal.py lines 144, 274, 299:
```python
# _hold_product - line 144:
product.inventory_status = "hold"

# _on_deal_won - line 274:
product.inventory_status = "sold"

# _release_product - line 299:
product.inventory_status = "available"
```

---

### 5. CÓ CHỖ NÀO BYPASS LOGIC?

**CÓ - NHIỀU CHỖ:**

| Chỗ bypass | File | Line | Hậu quả |
|------------|------|------|---------|
| `_lock_product()` trong booking | booking.py | 133 | Không validate transition |
| `_hold_product()` trong deal | deal.py | 144 | Không validate transition |
| `_on_deal_won()` | deal.py | 274 | Có thể sold product đang hold bởi người khác |
| `_release_product()` | deal.py | 299 | Có thể release product đang có booking |
| Direct update trong routes | products.py | - | Không dùng service |

---

## C. WORKFLOW LAYER AUDIT (QUAN TRỌNG NHẤT)

### 1. SALE CHỌN SẢN PHẨM NHƯ THẾ NÀO?

**Flow hiện tại:**
```
1. Sale vào /api/inventory/products?available_only=true
2. Filter theo project, block, bedrooms, price...
3. Chọn product có inventory_status = "available"
4. KHÔNG có giao diện "giỏ hàng" hoặc "chọn tạm"
```

**VẤN ĐỀ:**
- Không có cơ chế "quick hold" khi sale đang tư vấn
- Sale A đang tư vấn khách → Sale B có thể booking cùng căn

---

### 2. KHI HOLD - HỆ THỐNG LÀM GÌ?

**Flow:**
```
POST /api/inventory/products/{id}/hold
  ↓
Check inventory_status in ["available"] (get_holdable_statuses)
  ↓
Set inventory_status = "hold"
Set hold_by, hold_started_at, hold_expires_at
  ↓
Record to product_status_history
```

**VẤN ĐỀ:**
- ⚠️ **KHÔNG CÓ AUTO-EXPIRE MECHANISM** - hold_expires_at chỉ là field, không có cronjob
- ⚠️ Ai cũng có thể release hold (không check ownership)

---

### 3. KHI BOOKING - STATUS THAY ĐỔI RA SAO?

**Flow:**
```
POST /api/bookings (booking_service.create)
  ↓
Generate booking_code
  ↓
_lock_product() → product.inventory_status = "booked"
  ↓
_update_deal_booking() → deal.current_stage = "booking" (if applicable)
```

**VẤN ĐỀ:**
- ⚠️ **KHÔNG CHECK PRODUCT AVAILABILITY** - có thể book product đang `hold` bởi người khác
- ⚠️ `_lock_product()` không dùng `can_transition_status()`
- ⚠️ Không có idempotency check (có field nhưng không bắt buộc)

---

### 4. CÓ XẢY RA 2 SALE GIỮ CÙNG 1 CĂN KHÔNG?

**CÂU TRẢ LỜI: CÓ THỂ XẢY RA - RACE CONDITION**

**Scenario 1: Double Hold**
```
T0: Sale A GET /products/X → status = "available"
T1: Sale B GET /products/X → status = "available"  
T2: Sale A POST /hold → status = "hold" by A
T3: Sale B POST /hold → SHOULD FAIL but...
```

**Phân tích:**
- MongoDB API (`product_router.py`) có check `get_holdable_statuses()` ✅
- Nhưng KHÔNG có `FOR UPDATE` lock ❌
- Race condition window: ~100ms

**Scenario 2: Double Booking**
```
T0: Sale A GET /products/X → status = "available"
T1: Sale B GET /products/X → status = "available"
T2: Sale A POST /bookings → _lock_product() sets "booked"
T3: Sale B POST /bookings → _lock_product() OVERWRITES to "booked" by B
```

**Phân tích của booking_service.create():**
- Không có `check_product_available()` ❌
- Không có `FOR UPDATE` lock ❌
- Không dùng `idempotency_key` ❌
- **DOUBLE SELL POSSIBLE** 🚨

**Scenario 3: Booking Override Hold**
```
T0: Sale A holds product X
T1: Sale B creates booking for product X
T2: booking_service._lock_product() → OVERWRITES hold → "booked" by B
```
- Sale A mất hold mà không biết
- **CRITICAL BUG** 🚨

---

## D. SOURCE OF TRUTH (BẮT BUỘC)

### 1. Product có phải thực thể bán duy nhất không?

**TRẢ LỜI: KHÔNG RÕ RÀNG**

- PostgreSQL `products` table = thực thể bán (core)
- MongoDB `products` collection = thực thể bán (inventory API)
- **Không có foreign key constraint** giữa 2 systems
- Deal/Booking reference `product_id` nhưng không validate nguồn

**ĐỀ XUẤT:** Product trong PostgreSQL phải là SINGLE SOURCE OF TRUTH

---

### 2. Inventory status nằm ở entity nào?

**TRẢ LỜI: NẰM Ở PRODUCT, NHƯNG KHÔNG NHẤT QUÁN**

| System | Field | Values |
|--------|-------|--------|
| PostgreSQL Product | `inventory_status` | Enum cứng trong code |
| MongoDB Product | `inventory_status` | Từ `inventory_config.py` |
| Booking | `booking_status` | Độc lập |
| Deal | `current_stage` | Độc lập |

**VẤN ĐỀ:** 3 entity có thể mâu thuẫn:
```
Product.inventory_status = "hold"
Booking.booking_status = "confirmed"  
Deal.current_stage = "won"
```
→ Product đã sold hay đang hold?

---

### 3. Ai được phép đổi status?

**HIỆN TẠI: AI CŨNG ĐỔI ĐƯỢC**

| Actor | Có thể đổi? | Qua API nào? |
|-------|-------------|--------------|
| Sale | ✅ | `/api/inventory/products/{id}/hold` |
| Sale | ✅ | `/api/bookings` (indirect) |
| Manager | ✅ | Tất cả |
| Admin | ✅ | Tất cả + bulk update |
| System (Booking) | ✅ | `_lock_product()` - BYPASS |
| System (Deal) | ✅ | `_hold_product()`, `_release_product()` - BYPASS |

**VẤN ĐỀ:** Không có RBAC cho status change

---

### 4. Booking/Deal có được đổi status không?

**TRẢ LỜI: CÓ - VÀ KHÔNG CÓ KIỂM SOÁT**

| Entity | Có đổi product status? | Vấn đề |
|--------|------------------------|--------|
| Booking | CÓ - `_lock_product()` | Bypass state machine |
| Deal | CÓ - `_hold_product()`, `_on_deal_won()` | Bypass state machine |

**HÀNH VI NGUY HIỂM:**
- Booking có thể override Deal hold
- Deal có thể override Booking hold
- Không có priority/ownership check

---

### 5. Availability derive từ đâu?

**HIỆN TẠI: TỪ `inventory_status`**

```python
# Product model (product.py line 246)
@property
def is_available(self):
    return (
        self.inventory_status == "available" and
        self.business_status == "active" and
        self.availability_status == "open" and
        self.status == "active"
    )
```

**VẤN ĐỀ:**
- Phải check 4 fields → phức tạp
- MongoDB API chỉ check `inventory_status`
- Không nhất quán giữa 2 systems

---

## E. VẤN ĐỀ HIỆN CÓ - TÓM TẮT

### 1. Entity Confusion

| Vấn đề | Chi tiết | Severity |
|--------|----------|----------|
| 3 status fields | `inventory_status`, `business_status`, `availability_status` | 🔴 HIGH |
| 2 systems song song | PostgreSQL + MongoDB | 🔴 HIGH |
| Holder fields mâu thuẫn | `current_holder_*` vs `hold_by` | 🟡 MEDIUM |

### 2. Workflow Sai

| Vấn đề | Chi tiết | Severity |
|--------|----------|----------|
| Bypass state machine | Booking/Deal trực tiếp set status | 🔴 CRITICAL |
| No ownership check | Ai cũng release được hold | 🔴 HIGH |
| No auto-expire | Hold không tự hết hạn | 🟡 MEDIUM |

### 3. Rủi ro Production

| Rủi ro | Likelihood | Impact |
|--------|------------|--------|
| Double booking | 🔴 HIGH (no lock) | 🔴 CRITICAL - mất tiền, mất khách |
| Double sell | 🔴 HIGH (no validation) | 🔴 CRITICAL - legal issue |
| Hold override | 🔴 HIGH | 🟡 MEDIUM - sale confusion |
| Data inconsistency | 🔴 HIGH (2 DBs) | 🟡 MEDIUM |

---

## F. ĐIỂM CẦN REFACTOR

### Priority 1 (P0) - CRITICAL

1. **Hợp nhất status fields**
   - Xóa `business_status`, `availability_status`
   - `inventory_status` là SINGLE SOURCE OF TRUTH
   
2. **Centralized Status Change Service**
   - Tất cả status change PHẢI đi qua service
   - Booking/Deal không được trực tiếp set
   
3. **Transaction Lock (Optimistic Locking)**
   - Thêm `version` field vào Product
   - Check version trước khi update
   - Fail fast nếu conflict

4. **Validate trước khi Booking/Deal**
   - `check_product_available()` bắt buộc
   - Không cho phép book product đang hold bởi người khác

### Priority 2 (P1) - HIGH

5. **Auto-expire holds**
   - Cronjob check `hold_expires_at`
   - Tự động release expired holds
   
6. **Ownership check**
   - Chỉ holder mới được release
   - Manager/Admin có thể override
   
7. **Hợp nhất PostgreSQL + MongoDB**
   - PostgreSQL là source of truth
   - MongoDB chỉ là cache/read model

### Priority 3 (P2) - MEDIUM

8. **Status History Audit Trail**
   - Log đầy đủ who/what/when/why
   - Link to booking/deal/user
   
9. **RBAC cho status change**
   - Sale chỉ được hold/book
   - Manager có thể force release
   - Admin có thể block

---

## G. KIẾN TRÚC ĐỀ XUẤT

```
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY STATUS FLOW                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   NOT_FOR_SALE ──────► AVAILABLE ◄─────── BLOCKED          │
│                            │                                │
│                            ▼                                │
│                          HOLD ◄───────┐                    │
│                            │          │                    │
│                            ▼          │                    │
│                    BOOKING_PENDING    │                    │
│                            │          │                    │
│                            ▼          │                    │
│                         BOOKED        │                    │
│                            │          │                    │
│                            ▼          │ (cancel/expire)    │
│                       DEPOSITED ──────┘                    │
│                            │                                │
│                            ▼                                │
│                   CONTRACT_SIGNING                          │
│                            │                                │
│                            ▼                                │
│                          SOLD                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

                    STATUS OWNERSHIP
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Status Change Request                                     │
│           │                                                 │
│           ▼                                                 │
│   InventoryStatusService.change_status()                   │
│           │                                                 │
│           ├── validate_transition()                        │
│           ├── check_ownership()                            │
│           ├── acquire_lock(version)                        │
│           ├── update_status()                              │
│           ├── record_history()                             │
│           └── release_lock()                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## H. CHECKLIST TRƯỚC KHI DESIGN

✅ Product hiện tại là gì? → Unit bán, nhưng có 3 status fields
✅ Inventory đang nằm ở đâu? → Product entity, cả PG và MongoDB
✅ Status nằm ở đâu? → Product.inventory_status + Booking.booking_status + Deal.current_stage
✅ Có trùng field không? → CÓ - 3 status fields trong Product
✅ Có product nào không có status không? → CÓ THỂ - khác default giữa 2 systems
✅ API nào đang đổi status? → 5+ endpoints + 2 internal services
✅ Booking có tự set status không? → CÓ - _lock_product()
✅ Deal có tự set status không? → CÓ - _hold_product(), _on_deal_won(), _release_product()
✅ Có chỗ nào bypass logic không? → CÓ - Booking/Deal services
✅ 2 sale giữ cùng 1 căn? → CÓ THỂ XẢY RA - no transaction lock

---

**AUDIT HOÀN THÀNH - SẴN SÀNG CHO PART B: DESIGN**
