# ROLE DASHBOARD MATRIX FINAL 10/10

## I. NGUYÊN TẮC BẮT BUỘC

1. Mỗi role chỉ thấy đúng phần phục vụ công việc của mình.
2. Không dùng dashboard chung giữa các role.
3. Mỗi dashboard có 3 cấp:
- Tab cha
- Tab con
- Tab cháu
4. Tab cháu luôn gắn với:
- Trạng thái
- Phân loại
- Hành động
5. Mỗi màn hình chỉ phục vụ 1 mục tiêu chính.
6. Click từ dashboard phải dẫn đến nơi xử lý công việc, không phải chỉ để xem.
7. KPI trên dashboard phải click được.
8. Tab cháu không được là báo cáo vô hồn, không có hành động tiếp theo.

---

## II. CẤU TRÚC ROUTING BẮT BUỘC

Format chuẩn:

`/{role}/{tab-cha}/{tab-con}/{tab-chau}`

Ví dụ:

- `/sales/customer/source/new`
- `/sales/sales/pipeline/booking`
- `/marketing/campaign/list/active`
- `/finance/debt/list/overdue`

Giai đoạn đầu:
- tab cháu = filter mặc định
- không cần filter UI phức tạp
- mỗi tab cháu map 1 query condition rõ ràng

---

## III. SCREEN KEY NỘI BỘ BẮT BUỘC

Mục tiêu:
- tránh lặp logic route giữa frontend/backend
- tách `route hiển thị` và `màn hình nghiệp vụ`
- dùng chung cho permission, analytics, breadcrumb, API mapping

Format:

`{role}.{tabCha}.{tabCon}.{tabChau}`

Ví dụ:
- `sales.customer.source.new`
- `sales.sales.pipeline.booking`
- `marketing.campaign.list.active`
- `finance.debt.list.overdue`
- `hr.recruitment.candidate.new`

Quy ước:
- `role` = vai trò chính của màn
- `tabCha` = nhóm công việc
- `tabCon` = nhóm chức năng
- `tabChau` = trạng thái / phân loại / hành động

Mỗi screen key phải map:
- route
- title
- permission key
- query preset
- empty state
- primary action

---

## IV. TÁCH RANH GIỚI MARKETING VÀ WEBSITE/CMS

### Marketing
Chỉ gồm:
- chiến dịch
- kênh
- lead
- tracking
- nội dung dùng để kéo khách

### Website / CMS
Chỉ gồm:
- trang
- landing page
- CTA / banner
- form web
- bài viết
- SEO
- hiệu suất nội dung trên web

### Không được trộn
- `tracking` không để trong CMS
- `CTA web` không để trong marketing campaign logic
- `lead theo kênh` không để trong website
- `bài đăng kéo khách` không để lẫn với quản trị trang web tĩnh

---

## V. SPEC THEO ROLE

## 1. NHÂN VIÊN KINH DOANH

### Tab cha
1. Tổng quan
2. My Team
3. Khách hàng
4. Sản phẩm
5. Bán hàng
6. Kênh bán hàng
7. Tài chính

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay
- Thông báo

#### Tab cháu

`Dashboard`
- lead-hot
- booking-open
- revenue-month
- ranking-current

`Việc hôm nay`
- need-call
- need-meet
- need-follow

`Thông báo`
- from-manager
- from-system

### 2. My Team

#### Tab con
- Thủ lĩnh
- Thành viên
- Xếp hạng

#### Tab cháu

`Thủ lĩnh`
- team-lead
- sales-director

`Thành viên`
- active
- top-performer

`Xếp hạng`
- current-rank
- top-10
- gap-to-next

### 3. Khách hàng

#### Tab con
- Nguồn khách
- Khách hàng

#### Tab cháu

`Nguồn khách`
- new
- contacted
- unhandled

`Khách hàng`
- active
- potential
- won
- lost

### 4. Sản phẩm

#### Tab con
- Dự án
- Hàng ngon
- Tài liệu bán hàng

#### Tab cháu

`Dự án`
- selling
- upcoming

`Hàng ngon`
- hot-today
- priority-push

`Tài liệu bán hàng`
- price-list
- sales-policy
- legal
- customer-material

### 5. Bán hàng

#### Tab con
- Pipeline
- Booking
- Hợp đồng

#### Tab cháu

`Pipeline`
- lead
- consulting
- booking
- closing

`Booking`
- soft
- hard

`Hợp đồng`
- processing
- pending-sign
- signed

### 6. Kênh bán hàng

#### Tab con
- Kênh
- Nội dung
- Form lead
- AI

#### Tab cháu

`Kênh`
- facebook
- zalo
- tiktok

`Nội dung`
- post
- video

`Form lead`
- active-form
- lead-from-form

`AI`
- script
- chat-support

### 7. Tài chính

#### Tab con
- Doanh thu
- Hoa hồng
- Thưởng

#### Tab cháu

`Doanh thu`
- today
- month

`Hoa hồng`
- received
- pending

`Thưởng`
- kpi
- hot-bonus

---

## 2. MARKETING

### Tab cha
1. Tổng quan
2. Chiến dịch & kênh
3. Nội dung kéo khách
4. Lead & tracking

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- active-campaign
- lead-today
- best-channel

`Việc hôm nay`
- need-launch
- need-optimize
- need-handover

### 2. Chiến dịch & kênh

#### Tab con
- Chiến dịch
- Kênh

#### Tab cháu

`Chiến dịch`
- active
- paused
- ended

`Kênh`
- facebook
- zalo
- tiktok
- referral

### 3. Nội dung kéo khách

#### Tab con
- Nội dung
- Mẫu cho sale

#### Tab cháu

`Nội dung`
- pending-approval
- published

`Mẫu cho sale`
- post-template
- script-template
- video-template

### 4. Lead & tracking

#### Tab con
- Lead
- Tracking

#### Tab cháu

`Lead`
- by-channel
- by-campaign

`Tracking`
- form
- pixel
- attribution

---

## 3. WEBSITE / CMS

### Tab cha
1. Tổng quan website
2. Trang & landing page
3. Nội dung website
4. Form & CTA
5. SEO & hiệu suất

### 1. Tổng quan website

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- page-update
- seo-warning
- form-warning

`Việc hôm nay`
- need-fix
- need-publish

### 2. Trang & landing page

#### Tab con
- Trang
- Landing page

#### Tab cháu

`Trang`
- active
- draft

`Landing page`
- active
- archived

### 3. Nội dung website

#### Tab con
- Bài viết
- Dự án hiển thị

#### Tab cháu

`Bài viết`
- pending
- published

`Dự án hiển thị`
- active
- hidden

### 4. Form & CTA

#### Tab con
- Form web
- CTA / banner

#### Tab cháu

`Form web`
- active
- inactive

`CTA / banner`
- active
- expired

### 5. SEO & hiệu suất

#### Tab con
- SEO
- Hiệu suất

#### Tab cháu

`SEO`
- warning
- healthy

`Hiệu suất`
- top-page
- low-performance

---

## 4. QUẢN LÝ

### Tab cha
1. Điều hành đội
2. Kinh doanh
3. Công việc
4. My Team

### 1. Điều hành đội

#### Tab con
- Dashboard
- KPI
- Cảnh báo

#### Tab cháu

`Dashboard`
- team-summary
- team-ranking

`KPI`
- by-member
- by-team

`Cảnh báo`
- overdue
- low-performance

### 2. Kinh doanh

#### Tab con
- Lead
- Giao dịch

#### Tab cháu

`Lead`
- new
- hot

`Giao dịch`
- booking
- closing

### 3. Công việc

#### Tab con
- Việc
- Lịch

#### Tab cháu

`Việc`
- overdue
- today

`Lịch`
- meeting
- appointment

### 4. My Team

#### Tab con
- Thành viên
- Xếp hạng
- Thông báo

#### Tab cháu

`Thành viên`
- active
- probation

`Xếp hạng`
- top
- need-push

`Thông báo`
- from-director
- from-system

---

## 5. LÃNH ĐẠO

### Tab cha
1. Tổng quan
2. Kinh doanh
3. Tài chính
4. Cảnh báo & phê duyệt

### 1. Tổng quan

#### Tab con
- Dashboard

#### Tab cháu

`Dashboard`
- revenue
- profit
- growth

### 2. Kinh doanh

#### Tab con
- Theo dự án
- Theo khu vực

#### Tab cháu

`Theo dự án`
- top-project
- weak-project

`Theo khu vực`
- top-region
- weak-region

### 3. Tài chính

#### Tab con
- Dòng tiền
- Công nợ

#### Tab cháu

`Dòng tiền`
- inflow
- outflow

`Công nợ`
- receivable
- overdue

### 4. Cảnh báo & phê duyệt

#### Tab con
- Phê duyệt
- Cảnh báo

#### Tab cháu

`Phê duyệt`
- booking
- expense
- legal

`Cảnh báo`
- finance
- hr
- legal
- website

---

## 6. TÀI CHÍNH

### Tab cha
1. Tổng quan
2. Thu chi
3. Công nợ
4. Hoa hồng
5. Lương thưởng

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- revenue
- expense
- pending-approval

`Việc hôm nay`
- need-reconcile
- need-approve

### 2. Thu chi

#### Tab con
- Phiếu thu
- Phiếu chi

#### Tab cháu

`Phiếu thu`
- today
- pending

`Phiếu chi`
- pending
- approved

### 3. Công nợ

#### Tab con
- Danh sách
- Đối soát

#### Tab cháu

`Danh sách`
- receivable
- overdue

`Đối soát`
- need-check
- completed

### 4. Hoa hồng

#### Tab con
- Danh sách
- Chi trả

#### Tab cháu

`Danh sách`
- pending
- approved

`Chi trả`
- not-paid
- paid

### 5. Lương thưởng

#### Tab con
- Bảng lương
- Thưởng

#### Tab cháu

`Bảng lương`
- current-month
- history

`Thưởng`
- kpi
- campaign

---

## 7. NHÂN SỰ

### Tab cha
1. Tổng quan
2. Tuyển dụng
3. Hồ sơ nhân sự
4. Đào tạo
5. Phát triển

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- new-candidate
- missing-profile
- training-this-week

`Việc hôm nay`
- need-call
- need-onboard

### 2. Tuyển dụng

#### Tab con
- Ứng viên
- Onboard

#### Tab cháu

`Ứng viên`
- new
- interviewing
- accepted

`Onboard`
- pending
- completed

### 3. Hồ sơ nhân sự

#### Tab con
- Hồ sơ
- Hợp đồng
- Chấm công

#### Tab cháu

`Hồ sơ`
- missing
- completed

`Hợp đồng`
- pending-sign
- signed

`Chấm công`
- today
- anomaly

### 4. Đào tạo

#### Tab con
- Lịch đào tạo
- Khóa học

#### Tab cháu

`Lịch đào tạo`
- upcoming
- completed

`Khóa học`
- assigned
- completed

### 5. Phát triển

#### Tab con
- KPI / năng lực
- Lộ trình thăng tiến

#### Tab cháu

`KPI / năng lực`
- by-role
- low-score

`Lộ trình thăng tiến`
- in-progress
- qualified

---

## 8. PHÁP LÝ

### Tab cha
1. Tổng quan
2. Hồ sơ dự án
3. Hợp đồng
4. Tài liệu cho sale

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- pending-review
- risk-warning

`Việc hôm nay`
- need-review
- need-update

### 2. Hồ sơ dự án

#### Tab con
- Danh sách
- Tiến độ

#### Tab cháu

`Danh sách`
- active
- missing

`Tiến độ`
- in-progress
- completed

### 3. Hợp đồng

#### Tab con
- Danh sách
- Chờ ký

#### Tab cháu

`Danh sách`
- processing
- reviewed

`Chờ ký`
- pending-sign
- signed

### 4. Tài liệu cho sale

#### Tab con
- Tài liệu
- Biểu mẫu

#### Tab cháu

`Tài liệu`
- ready
- need-update

`Biểu mẫu`
- active
- archived

---

## 9. QUẢN TRỊ HỆ THỐNG

### Tab cha
1. Tổng quan hệ thống
2. Người dùng & quyền
3. Dữ liệu chuẩn
4. Quy trình
5. Website / CMS

### 1. Tổng quan hệ thống

#### Tab con
- Dashboard
- Cảnh báo

#### Tab cháu

`Dashboard`
- pending-change
- active-user

`Cảnh báo`
- security
- workflow

### 2. Người dùng & quyền

#### Tab con
- Người dùng
- Vai trò

#### Tab cháu

`Người dùng`
- active
- locked

`Vai trò`
- role-list
- permission-matrix

### 3. Dữ liệu chuẩn

#### Tab con
- Danh mục
- Mapping

#### Tab cháu

`Danh mục`
- active
- mismatch

`Mapping`
- missing
- completed

### 4. Quy trình

#### Tab con
- Phê duyệt
- Change management

#### Tab cháu

`Phê duyệt`
- pending
- applied

`Change management`
- draft
- approved

### 5. Website / CMS

#### Tab con
- Nội dung web
- Công khai

#### Tab cháu

`Nội dung web`
- pending
- published

`Công khai`
- active
- warning

---

## 10. CỘNG TÁC VIÊN / ĐẠI LÝ

### Tab cha
1. Tổng quan
2. Khách hàng
3. Bán hàng
4. Tài chính
5. Tài liệu

### 1. Tổng quan

#### Tab con
- Dashboard
- Việc hôm nay

#### Tab cháu

`Dashboard`
- customer-active
- booking-open
- commission-pending

`Việc hôm nay`
- need-call
- need-follow

### 2. Khách hàng

#### Tab con
- Nguồn khách
- Khách của tôi

#### Tab cháu

`Nguồn khách`
- new
- active

`Khách của tôi`
- following
- won

### 3. Bán hàng

#### Tab con
- Giao dịch
- Booking

#### Tab cháu

`Giao dịch`
- pipeline
- closing

`Booking`
- soft
- hard

### 4. Tài chính

#### Tab con
- Hoa hồng
- Thưởng

#### Tab cháu

`Hoa hồng`
- pending
- received

`Thưởng`
- campaign
- hot

### 5. Tài liệu

#### Tab con
- Bảng giá
- Chính sách
- Tài liệu gửi khách

#### Tab cháu

`Bảng giá`
- current

`Chính sách`
- active

`Tài liệu gửi khách`
- ready

---

## VI. BACKEND – QUY ƯỚC CHUNG

1. Tab cháu = filter mặc định.
2. Không cần filter UI phức tạp giai đoạn đầu.
3. API trả danh sách + phân trang.
4. Mỗi tab cháu map 1 điều kiện query.
5. API nên nhận:
- `screen_key`
- `status`
- `type`
- `action`
- `page`
- `limit`

Ví dụ:

`GET /api/screens?sales.customer.source.new&page=1&limit=20`

hoặc

`GET /api/sales/customers?screen_key=sales.customer.customer.active`

---

## VII. FRONTEND – QUY ƯỚC CHUNG

1. Sidebar load theo role.
2. Tab cha -> tab con -> tab cháu load động theo config.
3. Click tab cháu -> load list tương ứng.
4. Tất cả list dùng chung 1 component list.
5. KPI phải click được.
6. Dashboard card phải đi tới tab cháu, không đi tới tab cha chung chung.
7. Empty state phải có hành động tiếp theo.

---

## VIII. NHỮNG THỨ BẮT BUỘC KHÔNG LÀM

1. Không tạo tab dư.
2. Không tạo dashboard chung.
3. Không tạo báo cáo trùng.
4. Không tách nhỏ CMS / tracking quá mức.
5. Không làm màn hình chỉ để xem.
6. Không để 1 role nhìn thấy phần không giúp ích cho công việc hôm nay.
7. Không trộn `quản trị hệ thống` vào dashboard nghiệp vụ.

---

## IX. THỨ TỰ TRIỂN KHAI ĐÚNG

1. Khóa config role -> tab cha -> tab con -> tab cháu
2. Khóa `screen key`
3. Khóa route chuẩn
4. Refactor sidebar theo spec này
5. Refactor workspace/dashboard theo spec này
6. Dùng list component chung cho tab cháu
7. Nối query preset theo screen key
8. Rà và xóa toàn bộ tab linh tinh còn sót

---

## X. KẾT LUẬN

Đây là bản chốt cuối để triển khai.

Từ đây:
- không tranh luận lại cấu trúc nữa
- không thêm tab linh tinh
- không làm theo cảm tính

Tất cả dashboard và route phải bám đúng bản FINAL này.
