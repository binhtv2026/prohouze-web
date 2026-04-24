# PROHOUZING PHASE 1 IMPLEMENTATION PLAN
**Ngày khóa kế hoạch:** 2026-03-23
**Phạm vi:** Backoffice cốt lõi + Website public giai đoạn 1
**Mục tiêu:** Tạo nền tảng vận hành thật, dùng được ngay, đủ chuẩn để mở rộng

---

## 1. MỤC TIÊU GIAI ĐOẠN 1

Giai đoạn 1 phải giúp ProHouzing:

- Điều hành doanh nghiệp bằng dữ liệu
- Chuẩn hóa chuỗi bán hàng sơ cấp
- Quản lý được giỏ hàng dự án và giao dịch
- Kiểm soát doanh thu, chi phí, hoa hồng
- Vận hành đội sales và CTV ít phụ thuộc thủ công
- Có website public hỗ trợ thương hiệu và tạo lead

Nguyên tắc:

- Không làm dàn trải
- Không làm giao diện đẹp nhưng nghiệp vụ rỗng
- Không tiếp tục nuôi legacy thiếu chuẩn

---

## 2. MODULE ƯU TIÊN PHẢI HOÀN THÀNH

### Module 1. Executive Dashboard

Mục tiêu:

- Lãnh đạo nhìn thấy toàn bộ doanh nghiệp theo ngày / tuần / tháng

Bắt buộc có:

- Revenue snapshot
- Lead inflow
- Deal pipeline
- Booking status
- Commission payable
- Cash in / cash out
- Alerts trọng yếu
- KPI theo team / dự án

### Module 2. CRM & Customer 360

Mục tiêu:

- Toàn bộ lead và khách hàng đi vào một nơi duy nhất

Bắt buộc có:

- Lead capture
- Deduplication
- Contact 360
- Demand profile
- Assignment
- Lead scoring
- Interaction timeline
- Customer segmentation

### Module 3. Product / Project / Inventory

Mục tiêu:

- Quản được dự án, block, căn, giá, tình trạng hàng

Bắt buộc có:

- Chủ đầu tư
- Dự án
- Cấu trúc sản phẩm
- Inventory status
- Price list
- Sales policy
- Promotion framework
- Public publishing toggle

### Module 4. Sales & Booking

Mục tiêu:

- Chuỗi giao dịch chạy xuyên suốt và đo được

Bắt buộc có:

- Deal pipeline
- Soft booking
- Hard booking
- Queue / allocation
- Sales event
- Booking approval
- Deal probability
- Forecast doanh thu

### Module 5. Finance & Commission

Mục tiêu:

- Không để tiền và hoa hồng bị quản lý rời rạc

Bắt buộc có:

- Receivables
- Payouts
- Commission rules
- Commission entries
- Approval payout
- Cost tracking
- Project financial view
- Forecast view

### Module 6. Website Public Growth Foundation

Mục tiêu:

- Website vừa làm thương hiệu vừa tạo lead

Bắt buộc có:

- Homepage
- About
- Project list
- Project detail
- Contact
- Careers
- News / blog
- Lead forms
- SEO metadata
- Tracking foundation

---

## 3. CÁC MODULE CHƯA LÀM SÂU Ở PHASE 1

Các phần này vẫn phải có khung, nhưng chưa ưu tiên build full trước khi 6 module cốt lõi đạt chuẩn:

- Training & Academy
- Legal advanced compliance
- Full analytics warehouse
- Partner portal độc lập
- Mobile apps
- Customer portal độc lập

---

## 4. THỨ TỰ BUILD KHUYẾN NGHỊ

### Bước 1. Data Foundation

Phải chốt:

- Master data
- Entity model
- Status model
- Permission model
- Audit model
- Approval model
- Migration strategy sang PostgreSQL chuẩn

Deliverables:

- Canonical schema
- Mapping data legacy
- Seed data strategy
- Data import templates

### Bước 2. Executive Dashboard + Core Metrics

Phải có:

- Metric definitions
- Dashboard cards
- Alerts
- Team / project filters

Deliverables:

- Executive dashboard spec
- KPI dictionary
- First live dashboard

### Bước 3. CRM + Customer 360

Phải có:

- Lead lifecycle
- Contact model
- Demand model
- Timeline
- Assignment rules

Deliverables:

- CRM process map
- CRM entities
- CRM API / UI spec

### Bước 4. Product / Project / Inventory

Phải có:

- Project structure
- Product catalog
- Price lists
- Inventory state machine

Deliverables:

- Inventory model
- Pricing model
- Import / sync process

### Bước 5. Sales & Booking

Phải có:

- Deal stage
- Booking rules
- Allocation logic
- Sales event logic

Deliverables:

- Sales SOP
- Booking rules matrix
- Approval and exception flow

### Bước 6. Finance & Commission

Phải có:

- Receivable events
- Commission calculation engine
- Payout approval
- Financial reporting basis

Deliverables:

- Commission policy model
- Finance event map
- Monthly close checklist

### Bước 7. Website Public Foundation

Phải có:

- Headless-ready content structure
- Project page templates
- Lead form events
- SEO template

Deliverables:

- Information architecture
- SEO content architecture
- Conversion tracking plan

---

## 5. DEFINITION OF DONE CHO PHASE 1

Phase 1 chỉ được coi là hoàn thành khi:

- Lead đi được đến deal
- Deal đi được đến booking
- Booking liên kết được với sản phẩm và giá
- Tài chính nhìn được thực thu / dự kiến thu / payout
- Hoa hồng tính được theo rule
- Lãnh đạo xem được dashboard điều hành
- Website public tạo lead về CRM
- Dữ liệu trọng yếu đã chạy trên PostgreSQL chuẩn

---

## 6. RỦI RO CẦN KHÓA NGAY

### Rủi ro 1: Legacy chồng chéo

Hành động:

- Khóa canonical model
- Không mở rộng thêm mô hình dữ liệu cũ

### Rủi ro 2: UI đi trước nghiệp vụ

Hành động:

- Mỗi module phải có process map trước khi build sâu

### Rủi ro 3: Báo cáo sai do dữ liệu không chuẩn

Hành động:

- Metric dictionary
- Owner cho từng chỉ số

### Rủi ro 4: SEO tốt kỹ thuật nhưng yếu nội dung / chuyển đổi

Hành động:

- Tách rõ content strategy, landing templates và CTA plan

### Rủi ro 5: Quá tham scope

Hành động:

- Bám đúng 6 module cốt lõi phase 1

---

## 7. KPI NGHIỆM THU PHASE 1

### KPI vận hành

- 100% lead mới vào một pipeline chuẩn
- 100% booking gắn với sản phẩm cụ thể
- 100% payout hoa hồng có nguồn gốc đối soát
- 100% chỉ số lãnh đạo xem có định nghĩa chuẩn

### KPI hiệu quả

- Thời gian phản hồi lead giảm rõ rệt
- Thời gian tổng hợp báo cáo điều hành giảm mạnh
- Sai lệch dữ liệu deal / booking / commission giảm rõ rệt

### KPI hệ thống

- Audit log hoạt động
- Permission model hoạt động
- Data import chạy ổn
- Dashboard load ổn định

---

## 8. OUTPUT CẦN TẠO RA SAU PHASE 1

- Core backoffice usable
- Website public usable
- Bộ SOP nghiệp vụ lõi
- Bộ schema dữ liệu chuẩn
- Bộ dashboard điều hành
- Bộ tài liệu để bước sang phase 2

---

## 9. BƯỚC TIẾP THEO SAU PHASE 1

Sau khi phase 1 đạt chuẩn sẽ mở tiếp:

- HR / Recruitment full depth
- Legal & Contract lifecycle nâng cao
- Marketing automation nâng cao
- Analytics & BI warehouse
- Partner portal
- Sales / Leader / CTV mobile app

---

## 10. KẾT LUẬN

Phase 1 không phải là bản demo.
Phase 1 là nền móng vận hành thật.

Nếu làm đúng phase này, ProHouzing sẽ có:

- Một lõi dữ liệu chuẩn
- Một chuỗi kinh doanh chạy xuyên suốt
- Một nền quản trị đủ để giảm phụ thuộc vào vận hành thủ công
- Một nền website đủ để tăng trưởng bài bản
