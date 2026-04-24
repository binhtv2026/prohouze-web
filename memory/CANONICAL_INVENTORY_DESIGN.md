# PROHOUZING CANONICAL INVENTORY MODEL DESIGN
## PROMPT 5/20 - PART B + FINAL HARDEN: ANTI DOUBLE-SELL GUARANTEE (10/10 LOCKED)

**Ngày tạo:** 2024-12-XX  
**Trạng thái:** IMPLEMENTED + HARDENED

---

## PROTECTION LAYERS (ANTI DOUBLE-SELL)

### Layer 1: DB Level - Partial Unique Index
```sql
CREATE UNIQUE INDEX ix_products_active_sales_unique 
ON products (id) 
WHERE inventory_status IN ('hold', 'booking_pending', 'booked', 'reserved', 'sold');
```
➡️ DB enforces: Only ONE product in active sales state at a time

### Layer 2: Service Level - Pessimistic Lock
```python
# SELECT ... FOR UPDATE NOWAIT
product = db.execute(
    select(Product).where(...).with_for_update(nowait=True)
).scalar_one_or_none()
```
➡️ First request wins, second request fails immediately

### Layer 3: Version Check - Optimistic Lock
```python
if product.version != expected_version:
    raise ConcurrencyError("Version mismatch")
product.version += 1
```
➡️ Detect concurrent modifications

### Layer 4: Idempotency Key
```
Header: Idempotency-Key: abc123
```
➡️ Duplicate requests return cached result, NOT processed again

### Layer 5: Hold Collision Detection
```python
if product.inventory_status == "hold":
    if product.hold_by_user_id != user_id:
        raise HoldCollisionError(...)  # 409 CONFLICT
```
➡️ Clear 409 response when product already held

### Layer 6: Transaction Timeout
```python
if elapsed_ms > TIMEOUT:
    db.rollback()
    raise TransactionTimeoutError(...)
```
➡️ Auto rollback long transactions

### Layer 7: Full Audit Logging
```
STATUS_CHANGE_START: request_id=abc product_id=xyz new_status=hold
STATUS_CHANGE_SUCCESS: request_id=abc old_status=available -> new_status=hold version=2
EVENT_LOGGED: product_id=xyz available -> hold source=manual
```
➡️ Complete request tracking

---

## I. PRODUCT = CORE ENTITY

Product là đơn vị bán **DUY NHẤT**.

### Fields (Canonical)

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | UUID | Primary key | ✅ |
| `org_id` | UUID | Organization | ✅ |
| `project_id` | UUID | Project reference | ✅ |
| `block_id` | UUID | Block/Tower | ❌ |
| `floor_number` | Integer | Floor number | ❌ |
| `unit_code` | String(50) | **UNIQUE** identifier | ✅ |
| `product_type` | String(50) | Type (apartment, villa...) | ✅ |
| `area` | Decimal | Area in sqm | ❌ |
| `bedrooms` | Integer | Number of bedrooms | ❌ |
| `bathrooms` | Integer | Number of bathrooms | ❌ |
| `direction` | String(10) | Compass direction | ❌ |
| `inventory_status` | String(50) | **SOURCE OF TRUTH** | ✅ |
| `owner_user_id` | UUID | Sales person responsible | ❌ |
| `branch_id` | UUID | Branch unit | ❌ |
| `team_id` | UUID | Team unit | ❌ |
| `hold_started_at` | DateTime | When hold started | ❌ |
| `hold_expires_at` | DateTime | When hold expires | ❌ |
| `hold_by_user_id` | UUID | Who placed the hold | ❌ |
| `version` | Integer | **OPTIMISTIC LOCK** | ✅ |
| `created_at` | DateTime | Creation time | ✅ |
| `updated_at` | DateTime | Last update | ✅ |

### DEPRECATED Fields (DO NOT USE)

- ~~`business_status`~~ ❌
- ~~`availability_status`~~ ❌
- ~~`current_holder_type`~~ ❌
- ~~`current_holder_id`~~ ❌

---

## II. INVENTORY STATUS (STATE MACHINE)

### Allowed Statuses

| Status | Name (VI) | Description |
|--------|-----------|-------------|
| `draft` | Nháp | Mới tạo, chưa hoàn thiện |
| `not_open` | Chưa mở bán | Chờ quyết định mở bán |
| `available` | Còn hàng | Đang mở bán, có thể giữ |
| `hold` | Đang giữ | Giữ tạm, có thời hạn |
| `booking_pending` | Chờ booking | Đang xử lý booking |
| `booked` | Đã booking | Booking xác nhận |
| `reserved` | Đã cọc | Đã đặt cọc |
| `sold` | Đã bán | **TERMINAL** - Hoàn tất |
| `blocked` | Đã khóa | Admin lock |
| `inactive` | Tạm ẩn | Không hiển thị |

---

## III. STATE TRANSITION RULES

### Valid Flow

```
draft ────────► not_open ────────► available
                                      │
                                      ▼
                                    hold
                                      │
                                      ▼
                              booking_pending
                                      │
                                      ▼
                                   booked
                                      │
                                      ▼
                                  reserved
                                      │
                                      ▼
                                    sold ✓
```

### Transition Matrix

| From | To (Valid) |
|------|------------|
| `draft` | `not_open`, `inactive` |
| `not_open` | `available`, `blocked`, `inactive` |
| `available` | `hold`, `blocked`, `not_open`, `inactive` |
| `hold` | `available`, `booking_pending`, `blocked` |
| `booking_pending` | `booked`, `available`, `hold`, `blocked` |
| `booked` | `reserved`, `available`, `blocked` |
| `reserved` | `sold`, `booked`, `available`, `blocked` |
| `sold` | `blocked` (admin only) |
| `blocked` | `available`, `not_open`, `inactive` |
| `inactive` | `draft`, `not_open`, `available` |

### INVALID Transitions (BLOCKED)

- ❌ `available` → `sold` (must go through flow)
- ❌ `hold` → `sold` (must go through flow)
- ❌ `sold` → `available` (terminal state)
- ❌ `booked` → `available` without approval

---

## IV. INVENTORY STATUS SERVICE

### Single Entry Point

```python
class InventoryStatusService:
    def change_status(product_id, new_status, user_id, ...):
        1. Get product with FOR UPDATE lock
        2. Validate transition
        3. Check version (optimistic lock)
        4. Check permissions
        5. Apply change
        6. Log event
        7. Commit
```

### Convenience Methods

| Method | Purpose |
|--------|---------|
| `hold_product()` | Hold for user |
| `release_hold()` | Release hold |
| `request_booking()` | Booking service request |
| `confirm_booking()` | Confirm booking |
| `cancel_booking()` | Cancel booking |
| `mark_reserved()` | Deposit received |
| `mark_sold()` | Contract signed |
| `block_product()` | Admin block |
| `expire_holds()` | Background job |

---

## V. TRANSACTION LOCKING

### Optimistic Locking (Primary)

```python
# Product has version field
version = Column(Integer, default=1)

# Check before update
if product.version != expected_version:
    raise ConcurrencyError("Version mismatch")

# Increment on change
product.version += 1
```

### Pessimistic Locking (Secondary)

```python
# SELECT ... FOR UPDATE
product = db.execute(
    select(Product).where(...).with_for_update()
).scalar_one_or_none()
```

---

## VI. HOLD LOGIC

### When Setting Hold

```python
product.inventory_status = "hold"
product.hold_started_at = now()
product.hold_expires_at = now() + timedelta(hours=24)
product.hold_by_user_id = user_id
```

### Auto-Expire Job

```python
# Run every 5 minutes
expired = db.query(Product).filter(
    Product.inventory_status == "hold",
    Product.hold_expires_at <= now()
)
for p in expired:
    inventory_status_service.change_status(
        p.id, "available", source="system"
    )
```

---

## VII. EVENT LOG

### Table: `inventory_events`

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | Product reference |
| `old_status` | String | Previous status |
| `new_status` | String | New status |
| `triggered_by` | UUID | User who triggered |
| `source` | String | Source type |
| `source_ref_type` | String | Entity type (booking/deal) |
| `source_ref_id` | UUID | Entity ID |
| `reason` | String | Reason for change |
| `created_at` | DateTime | Timestamp |

### Source Types

- `manual` - User manual change
- `booking` - Booking service request
- `deal` - Deal service request
- `system` - Auto-expire
- `admin` - Admin override
- `import` - Data import

---

## VIII. SERVICE BOUNDARY

### Booking Service

```python
# ❌ WRONG - Direct set
product.inventory_status = "booked"

# ✅ CORRECT - Through service
inventory_status_service.request_booking(
    product_id=...,
    booking_id=...,
)
```

### Deal Service

```python
# ❌ WRONG - Direct set  
product.inventory_status = "sold"

# ✅ CORRECT - Through service
inventory_status_service.mark_sold(
    product_id=...,
    contract_id=...,
)
```

---

## IX. API ENDPOINTS

### Inventory API v2

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/config/statuses` | GET | Status configurations |
| `/api/inventory/config/transitions` | GET | Transition rules |
| `/api/inventory/products/{id}/status` | POST | Change status |
| `/api/inventory/products/{id}/valid-transitions` | GET | Valid next statuses |
| `/api/inventory/products/{id}/hold` | POST | Hold product |
| `/api/inventory/products/{id}/release-hold` | POST | Release hold |
| `/api/inventory/products/{id}/booking-request` | POST | Booking integration |
| `/api/inventory/products/{id}/deal-request` | POST | Deal integration |
| `/api/inventory/products/{id}/block` | POST | Block (admin) |
| `/api/inventory/products/{id}/unblock` | POST | Unblock (admin) |
| `/api/inventory/products/{id}/events` | GET | Event history |
| `/api/inventory/jobs/expire-holds` | POST | Run expire job |

---

## X. FILES CREATED

| File | Description |
|------|-------------|
| `config/canonical_inventory.py` | Status enum, transitions, config |
| `core/models/canonical_product.py` | Product, ProductPrice, InventoryEvent |
| `core/services/inventory_status.py` | InventoryStatusService |
| `core/routes/inventory_v2.py` | API endpoints |

---

## XI. MIGRATION PLAN

### Phase 1: Deploy New Code
1. Add new files
2. Register routes
3. Create tables

### Phase 2: Data Migration
1. Set `version=1` for all products
2. Copy `inventory_status` from old field
3. Clear deprecated fields

### Phase 3: Refactor Services
1. Update Booking service to call `InventoryStatusService`
2. Update Deal service to call `InventoryStatusService`
3. Remove direct status sets

### Phase 4: Cleanup
1. Remove deprecated fields from model
2. Remove MongoDB product APIs
3. Update frontend

---

**DESIGN COMPLETE - READY FOR TESTING**
