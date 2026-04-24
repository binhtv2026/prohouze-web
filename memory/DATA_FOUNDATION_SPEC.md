# PROHOUZING DATA FOUNDATION SPEC
**Ngày khóa:** 2026-03-23
**Vai trò:** Tài liệu nền cho phase 1 build thật
**Mục tiêu:** Chuẩn hóa dữ liệu lõi để toàn bộ module phase 1 dùng chung một nguồn sự thật

---

## 1. MỤC TIÊU

Data Foundation phải giải quyết 5 việc:

- Chuẩn hóa thực thể lõi
- Xóa mơ hồ giữa dữ liệu legacy và dữ liệu chuẩn
- Tạo nền cho RBAC, audit, approval và timeline
- Làm cơ sở cho dashboard điều hành
- Giúp các module phase 1 giao tiếp với nhau không bị lệch model

---

## 2. SINGLE SOURCE OF TRUTH

### Transactional Source of Truth

- PostgreSQL là nguồn chuẩn cho dữ liệu transactional mới

### Supporting Stores

- Object storage cho file, ảnh, tài liệu, media
- Cache/queue cho automation và tác vụ bất đồng bộ
- Analytics mart / warehouse cho BI giai đoạn sau

### Không được làm

- Không mở rộng thêm model mới trên legacy Mongo nếu dữ liệu đó thuộc core workflow
- Không định nghĩa một thực thể bằng nhiều schema mâu thuẫn nhau

---

## 3. 10 DOMAIN ENTITIES CỐT LÕI

### 3.1. Organization Domain

Thực thể:

- organization
- branch
- department
- team
- position
- role
- user
- user_membership

Mục tiêu:

- Quản trị đa phòng ban, đa team, đa chi nhánh

### 3.2. Customer Domain

Thực thể:

- customer
- customer_identity
- customer_address
- lead
- contact_point
- demand_profile
- interaction
- tag

Mục tiêu:

- Xây Customer 360 và lead lifecycle

### 3.3. Product Domain

Thực thể:

- developer
- project
- project_structure
- product
- price_list
- price_history
- promotion
- inventory_snapshot

Mục tiêu:

- Quản lý dự án và giỏ hàng sơ cấp

### 3.4. Sales Domain

Thực thể:

- deal
- booking
- booking_queue
- sales_event
- allocation_result
- pipeline_stage

Mục tiêu:

- Chuẩn hóa từ lead sang booking

### 3.5. Contract & Legal Domain

Thực thể:

- contract
- contract_version
- contract_approval
- legal_document
- legal_checklist
- compliance_item

Mục tiêu:

- Liên kết pháp lý với giao dịch và hồ sơ

### 3.6. Finance Domain

Thực thể:

- payment
- payment_schedule_item
- receivable
- payable
- expense
- budget
- ledger_event

Mục tiêu:

- Kiểm soát thực thu, thực chi, công nợ, dự báo

### 3.7. Commission Domain

Thực thể:

- commission_rule
- commission_entry
- commission_split
- payout_batch
- payout_item

Mục tiêu:

- Tính hoa hồng rõ rule, có thể đối soát

### 3.8. HR Domain

Thực thể:

- employee_profile
- collaborator_profile
- recruitment_candidate
- onboarding_record
- payroll_record
- attendance_record
- leave_request
- training_record

Mục tiêu:

- Quản trị nhân sự chính thức và CTV

### 3.9. Marketing Domain

Thực thể:

- campaign
- lead_source
- attribution_touchpoint
- content_item
- form_submission
- automation_rule

Mục tiêu:

- Theo dõi nguồn lead và hiệu quả marketing

### 3.10. Governance Domain

Thực thể:

- approval_request
- approval_step
- activity_log
- audit_log
- notification
- domain_event

Mục tiêu:

- Tạo khả năng truy vết và điều hành

---

## 4. CANONICAL RELATIONSHIP MAP

### Customer Flow

- lead -> customer
- customer -> demand_profile
- customer -> interaction
- customer -> deal

### Product Flow

- developer -> project
- project -> project_structure
- project_structure -> product
- product -> price_history
- product -> booking

### Sales Flow

- lead -> deal
- deal -> booking
- booking -> contract
- contract -> payment_schedule_item
- payment -> commission_entry

### HR / Commission Flow

- user -> employee_profile
- user -> collaborator_profile
- deal / booking / payment -> commission_entry
- commission_entry -> payout_item

---

## 5. ID, STATUS, TIMESTAMP, OWNERSHIP RULES

### 5.1. ID Rule

Mọi bản ghi quan trọng phải có:

- id
- code nếu là thực thể nghiệp vụ
- tenant_id hoặc organization_id nếu đa công ty

### 5.2. Timestamp Rule

Mọi bản ghi quan trọng phải có:

- created_at
- updated_at
- created_by
- updated_by

### 5.3. Ownership Rule

Với lead, deal, task, booking, candidate:

- owner_user_id
- owner_team_id nếu cần
- visibility_scope nếu cần

### 5.4. Status Rule

Không dùng status tự do.
Mỗi domain phải có state machine riêng.

Ví dụ:

- lead_status
- deal_stage
- booking_status
- contract_status
- payment_status
- payout_status
- candidate_status

---

## 6. APPROVAL MODEL CHUẨN

Mọi approval quan trọng phải đi chung một khung:

- approval_request
- resource_type
- resource_id
- requested_by
- approval_level
- current_step
- final_status
- approved_at / rejected_at

Áp dụng cho:

- Booking ngoại lệ
- Payout
- Contract
- Expense
- Legal exceptions

---

## 7. AUDIT & TIMELINE MODEL

### Audit log

Phải ghi:

- resource_type
- resource_id
- action
- actor_id
- before_value
- after_value
- created_at

### Timeline

Phải thể hiện được:

- lead created
- lead assigned
- interaction logged
- deal created
- booking created
- contract approved
- payment recorded
- payout approved

---

## 8. MASTER DATA PHẢI KHÓA TRƯỚC

Danh mục bắt buộc:

- Loại nguồn lead
- Kênh marketing
- Phân loại nhu cầu khách
- Loại dự án
- Loại sản phẩm
- Trạng thái tồn kho
- Loại hợp đồng
- Loại thanh toán
- Vai trò và quyền
- Phòng ban / team / chức danh
- Loại chi phí
- Loại hoa hồng
- Loại tài liệu pháp lý

---

## 9. DATA QUALITY RULES

### Customer data

- Chuẩn hóa số điện thoại
- Chuẩn hóa email
- Chống trùng theo phone / email / identity

### Product data

- Một sản phẩm chỉ thuộc một cấu trúc dự án chuẩn
- Mọi thay đổi giá phải có history

### Sales data

- Deal không tồn tại nếu không gắn customer
- Booking không tồn tại nếu không gắn product

### Finance data

- Payout không tồn tại nếu không truy được commission source
- Báo cáo không lấy dữ liệu từ field free-text thiếu chuẩn

---

## 10. DATA MIGRATION PRIORITY

Thứ tự migrate đề xuất:

1. organization / users / roles
2. projects / products / price histories
3. customers / leads / demands
4. deals / bookings / contracts
5. payments / commission / payouts
6. hr / payroll / training

---

## 11. DATA FOUNDATION DELIVERABLES

Phase Data Foundation chỉ hoàn thành khi có đủ:

- Canonical entity list
- Relationship map
- State machine list
- Approval model
- Audit model
- Master data list
- Migration mapping
- Import templates

---

## 12. QUY TẮC THỰC THI

Từ thời điểm này:

- Mọi màn hình mới phải map được về canonical entities
- Mọi API mới phải dùng đúng status model
- Mọi dashboard mới phải chỉ ra nguồn dữ liệu chuẩn
- Mọi workflow mới phải có auditability

---

## 13. KẾT LUẬN

Nếu không khóa Data Foundation, hệ thống sẽ tiếp tục rộng nhưng không sâu.
Nếu khóa đúng Data Foundation, ProHouzing có thể build phase 1 nhanh hơn, ít sửa lại hơn và đủ nền để lên chuẩn 10/10.
