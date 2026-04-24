# PHASE 1 MODULE ACCEPTANCE MATRIX
**Ngày tạo:** 2026-03-23
**Mục đích:** Chuyển blueprint và implementation plan thành tiêu chí build và nghiệm thu rõ ràng

---

## 1. CÁCH DÙNG TÀI LIỆU NÀY

Mỗi module phase 1 phải được build và nghiệm thu theo 4 lớp:

1. Business outcome
2. Core workflows
3. Data and control
4. UI and reporting

Module nào chưa đạt đủ 4 lớp thì chưa được xem là hoàn thành.

---

## 2. MODULE 1: EXECUTIVE DASHBOARD

### Business outcome

- Lãnh đạo có thể nhìn sức khỏe doanh nghiệp trong 5 phút
- Có thể phát hiện điểm nghẽn mà không cần đợi báo cáo thủ công

### Core workflows

- Xem dashboard toàn công ty
- Lọc theo dự án
- Lọc theo team
- Lọc theo thời gian
- Drill-down từ chỉ số sang dữ liệu nguồn

### Data and control

- Metric dictionary thống nhất
- Có owner cho từng chỉ số
- Có thời điểm cập nhật dữ liệu
- Có phân quyền theo vai trò

### UI and reporting

- Revenue cards
- Lead funnel
- Deal funnel
- Booking snapshot
- Cash snapshot
- Alerts panel
- Top project / top team / top risk

### Done when

- CEO có thể xem số liệu ngày / tuần / tháng
- Chỉ số không mâu thuẫn giữa dashboard và dữ liệu nguồn
- Có ít nhất một luồng drill-down hoạt động ở mỗi nhóm chỉ số

---

## 3. MODULE 2: CRM & CUSTOMER 360

### Business outcome

- Không thất lạc lead
- Không trùng khách hàng quá mức
- Có thể theo dõi đầy đủ lịch sử chăm sóc

### Core workflows

- Tạo lead từ nhiều nguồn
- Chống trùng theo số điện thoại / email / identity
- Chuyển lead thành contact / customer
- Gán lead cho sales
- Ghi chú, cuộc gọi, lịch hẹn, trạng thái
- Quản lý nhu cầu

### Data and control

- Canonical customer model
- Ownership model
- Timeline model
- Lead source model
- Dedup rules
- Audit log cho thay đổi quan trọng

### UI and reporting

- Lead list
- Customer profile 360
- Timeline interaction
- Demand profile
- Assignment and scoring view
- Segmentation filters

### Done when

- Một lead mới từ website vào được CRM
- Có thể gán cho sales
- Sales cập nhật được trạng thái và timeline
- Có thể tìm lại toàn bộ lịch sử chăm sóc của khách

---

## 4. MODULE 3: PRODUCT / PROJECT / INVENTORY

### Business outcome

- Giỏ hàng phản ánh đúng thực tế bán hàng
- Lãnh đạo và sales không nhìn hai con số tồn kho khác nhau

### Core workflows

- Tạo chủ đầu tư
- Tạo dự án
- Tạo cấu trúc block / tower / unit
- Cập nhật trạng thái hàng
- Cập nhật bảng giá
- Cập nhật chính sách và khuyến mãi
- Publish sang website public khi đủ điều kiện

### Data and control

- Project model
- Product hierarchy
- Inventory state machine
- Price history
- Promotion validity
- Approval cho thay đổi nhạy cảm

### UI and reporting

- Project list
- Project detail
- Product inventory table
- Price list manager
- Promotion manager
- Availability filters

### Done when

- Một căn có thể đi từ available -> reserved -> booked đúng rule
- Có lịch sử thay đổi trạng thái và giá
- Sales và quản lý nhìn cùng một nguồn tồn kho

---

## 5. MODULE 4: SALES & BOOKING

### Business outcome

- Chuỗi lead -> deal -> booking được chuẩn hóa
- Giảm tranh chấp và sai lệch khi giữ chỗ / chốt căn

### Core workflows

- Tạo deal từ CRM
- Cập nhật stage deal
- Tạo soft booking
- Chạy queue / allocation
- Tạo hard booking
- Gắn deal với sản phẩm
- Tạo sales event
- Duyệt booking ngoại lệ

### Data and control

- Deal stage model
- Booking model
- Allocation rule set
- Reservation expiry rules
- Approval and override flow
- Audit trail

### UI and reporting

- Deal pipeline
- Booking board
- Queue status
- Sales event dashboard
- Conversion reporting
- Forecast reporting

### Done when

- Một lead đủ điều kiện có thể đi đến hard booking
- Booking gắn đúng sản phẩm, đúng người, đúng trạng thái
- Có thể xem tỷ lệ chuyển đổi theo team và dự án

---

## 6. MODULE 5: FINANCE & COMMISSION

### Business outcome

- Kiểm soát được doanh thu, công nợ, payout và hoa hồng
- Giảm sai lệch đối soát thủ công

### Core workflows

- Ghi nhận khoản thu
- Theo dõi tiến độ thanh toán
- Ghi nhận khoản chi
- Tính hoa hồng theo chính sách
- Duyệt payout
- Theo dõi dòng tiền theo dự án

### Data and control

- Payment schedule model
- Commission rules
- Commission calculation log
- Payout approval model
- Cost center model
- Finance event ledger

### UI and reporting

- Receivables dashboard
- Payout dashboard
- Commission list
- My income
- Project financial view
- Forecast view

### Done when

- Có thể tính hoa hồng của một giao dịch theo rule
- Có thể truy ngược nguồn gốc từng payout
- Lãnh đạo xem được thực thu, dự kiến thu, phải chi

---

## 7. MODULE 6: WEBSITE PUBLIC GROWTH FOUNDATION

### Business outcome

- Website tạo lead, tăng trust, hỗ trợ SEO và tuyển dụng

### Core workflows

- Publish bài viết
- Publish trang dự án
- Nhận lead từ form
- Nhận CV ứng tuyển
- Gắn tracking cho CTA
- Tạo landing page chiến dịch

### Data and control

- CMS content model
- Public project publishing rules
- SEO metadata rules
- Form submission routing
- Source / UTM attribution

### UI and reporting

- Homepage
- About
- Project list
- Project detail
- News list / detail
- Careers
- Contact
- Lead form

### Done when

- Website public có thể tạo lead vào CRM
- Dự án public có metadata SEO chuẩn
- Có tracking cho form và CTA chính

---

## 8. CÁC TIÊU CHÍ XUYÊN SUỐT CHO MỌI MODULE

Mọi module phase 1 đều phải đáp ứng:

- Role-based access control
- Audit log cho thao tác quan trọng
- Trạng thái rõ ràng
- Timeline rõ ràng
- Bộ lọc và tìm kiếm đủ dùng
- Empty state và error state rõ
- Có seed / import path để nhập dữ liệu ban đầu

---

## 9. THỨ TỰ NGHIỆM THU

Nghiệm thu theo thứ tự:

1. Data model
2. API and logic
3. Workflow end-to-end
4. UI and usability
5. Reporting and auditability

Không nghiệm thu chỉ dựa trên giao diện.

---

## 10. KẾT LUẬN

Tài liệu này là chuẩn đánh giá chất lượng phase 1.
Từ đây trở đi, mọi phần build mới phải trả lời được 3 câu hỏi:

- Nó giải quyết business outcome gì?
- Nó nằm ở đâu trong workflow thật?
- Nó đã đủ dữ liệu, kiểm soát và nghiệm thu để vận hành chưa?
