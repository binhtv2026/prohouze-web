# PROHOUZING BLUEPRINT 10/10
**Ngày khóa định hướng:** 2026-03-23
**Trạng thái:** APPROVED BY USER
**Mục tiêu:** Xây ProHouzing thành hệ điều hành số toàn diện cho doanh nghiệp môi giới bất động sản sơ cấp

---

## 1. TẦM NHÌN CHUNG

ProHouzing sẽ không dừng ở một website bán hàng hay một CRM đơn lẻ.
Hệ thống đích cần trở thành:

- Trung tâm điều hành doanh nghiệp cho ban lãnh đạo
- Sales OS cho đội ngũ kinh doanh và cộng tác viên
- Finance OS cho doanh thu, chi phí, hoa hồng, payroll và dự báo
- HR OS cho tuyển dụng, đào tạo, đánh giá, thăng tiến
- Legal & Contract OS cho pháp lý dự án, hồ sơ, hợp đồng và tuân thủ
- Growth Engine cho website, SEO, landing page, content, tracking và automation

Mục tiêu cuối cùng là:

- Giảm mạnh nhân sự vận hành lặp lại
- Quản trị doanh nghiệp bằng dữ liệu thời gian thực
- Chuẩn hóa toàn bộ quy trình từ lead đến doanh thu
- Xây nền tảng có thể mở rộng đa dự án, đa team, đa chi nhánh, đa đối tác

---

## 2. CÁC QUYẾT ĐỊNH ĐÃ CHỐT

### 2.1. Thứ tự ưu tiên triển khai

Triển khai theo thứ tự:

1. Sales
2. Product
3. CRM
4. Finance
5. HR
6. Legal
7. Marketing
8. SEO
9. App

### 2.2. Phạm vi giai đoạn 1

Giai đoạn 1 tập trung:

- Backoffice quản trị doanh nghiệp
- Website public tăng trưởng
- Web responsive chuẩn mobile

Chưa ưu tiên:

- App native iOS/Android ngay từ đầu
- Customer app độc lập

### 2.3. Nhóm người dùng chính

- Ban lãnh đạo
- Sales director / quản lý kinh doanh
- Trưởng nhóm
- Sales chính thức
- Cộng tác viên
- Marketing
- HR
- Kế toán / tài chính
- Pháp lý
- Admin vận hành

Giai đoạn sau:

- Đại lý / đối tác phân phối
- Khách hàng

### 2.4. Chuẩn dữ liệu

- PostgreSQL là nguồn dữ liệu chuẩn cho phần build tiếp theo
- Loại bỏ dần phụ thuộc legacy data không chuẩn hóa
- Mọi dữ liệu quan trọng phải có:
- RBAC
- Audit log
- Approval state
- Timeline
- Truy vết thay đổi

### 2.5. Kiến trúc triển khai

Kiến trúc 3 lớp:

1. Website public
2. Backoffice quản trị
3. App mobile giai đoạn 2

---

## 3. KIẾN TRÚC TỔNG THỂ 3 LỚP

### 3.1. Lớp 1: Website Public Growth Layer

Vai trò:

- Xây thương hiệu
- Thu lead
- SEO phủ thị trường
- Hỗ trợ tuyển dụng
- Hỗ trợ chiến dịch bán hàng

Phân hệ:

- Trang chủ thương hiệu
- Giới thiệu doanh nghiệp
- Trang dự án
- Trang sản phẩm / giỏ hàng public
- Landing page chiến dịch
- Tin tức / blog / cẩm nang
- Tuyển dụng
- Form đăng ký tư vấn
- Chat / callback / tracking
- Thư viện media / chứng thực / đối tác

Nguyên tắc:

- SEO-first
- Tốc độ cao
- Schema chuẩn
- CTA rõ
- Tracking chặt
- Nội dung theo cụm chủ đề

### 3.2. Lớp 2: Backoffice Management Layer

Vai trò:

- Điều hành doanh nghiệp
- Chuẩn hóa quy trình
- Quản lý dữ liệu lõi
- Kiểm soát tài chính, pháp lý, nhân sự
- Tự động hóa tác vụ vận hành

Phân hệ cốt lõi:

- Executive Control Tower
- CRM & Customer 360
- Product / Project / Inventory
- Sales & Booking
- Contract & Legal
- Finance & Commission
- HR & Recruitment
- Training & Academy
- Marketing & Growth Ops
- Workflow & Operations
- Partner / Agency / Collaborator
- CMS / Content / SEO
- Analytics & BI
- System & Security

### 3.3. Lớp 3: Mobile App Layer

Giai đoạn 2 triển khai theo thứ tự:

1. Sales App
2. Leader App
3. Collaborator App
4. Customer Portal / App

Vai trò của app:

- Tác nghiệp nhanh ngoài hiện trường
- Nhận thông báo real-time
- Theo dõi booking / deal / commission
- Duyệt tác vụ cấp quản lý

---

## 4. 12 PHÂN HỆ BẮT BUỘC ĐẠT 10/10

### 4.1. Executive Control Tower

Mục tiêu:

- Lãnh đạo nhìn toàn doanh nghiệp trên một màn hình
- Cảnh báo điểm nghẽn ngay lập tức
- Có đề xuất hành động ưu tiên

Chức năng chính:

- Doanh thu theo ngày / tuần / tháng / quý
- Pipeline theo dự án, team, cá nhân
- Lead inflow và conversion
- Booking, deal risk, tồn kho, pháp lý, dòng tiền
- Headcount, tuyển dụng, churn, hiệu suất
- Báo cáo dự báo và deviation so với kế hoạch

### 4.2. CRM & Customer 360

Mục tiêu:

- Hợp nhất toàn bộ dữ liệu khách hàng

Chức năng chính:

- Lead capture từ mọi nguồn
- Contact / household / organization profile
- Nhu cầu, năng lực tài chính, lịch sử tương tác
- Timeline 360
- Segmentation và scoring
- Lead ownership và assignment
- Tệp khách đã giao dịch / khách tái mua / referral / khách CTV

### 4.3. Product / Project / Inventory

Mục tiêu:

- Quản lý giỏ hàng sơ cấp theo thực tế vận hành

Chức năng chính:

- Chủ đầu tư
- Dự án
- Phase / block / tower / unit
- Tình trạng hàng
- Bảng giá
- Chính sách bán hàng
- Khuyến mãi
- Giỏ hàng public / internal
- Lịch sử thay đổi giá và trạng thái

### 4.4. Sales & Booking

Mục tiêu:

- Chuẩn hóa luồng giao dịch từ lead đến đóng tiền

Chức năng chính:

- Lead -> deal
- Soft booking
- Hard booking
- Queue / allocation
- Sự kiện mở bán
- Reservation rules
- Stage management
- Forecast theo pipeline
- KPI theo cá nhân / team / dự án

### 4.5. Contract & Legal

Mục tiêu:

- Quản trị pháp lý và hợp đồng thành một dòng xuyên suốt

Chức năng chính:

- Hồ sơ pháp lý dự án
- Checklists tuân thủ
- Tài liệu bắt buộc theo loại dự án
- Contract templates
- Approval workflow
- E-sign readiness
- Amendment / appendix / versioning
- Alert hết hạn / thiếu hồ sơ / sai trạng thái

### 4.6. Finance & Commission

Mục tiêu:

- Kiểm soát toàn bộ dòng tiền doanh nghiệp

Chức năng chính:

- Thu / chi
- Receivables / payables
- Hoa hồng theo rule
- Payroll integration
- Cost center theo team / dự án
- Dự báo tài chính
- Kế hoạch ngân sách
- Tax-ready reports
- Dòng tiền theo hợp đồng / dự án / kỳ

### 4.7. HR & Recruitment

Mục tiêu:

- Tuyển đúng, onboard nhanh, giữ người tốt

Chức năng chính:

- Recruitment funnel
- KYC / eKYC
- Hợp đồng điện tử
- Hồ sơ nhân sự 360
- CTV lifecycle
- Chấm công / nghỉ phép / payroll
- Lộ trình nghề nghiệp
- Khung năng lực
- Đánh giá định kỳ

### 4.8. Training & Academy

Mục tiêu:

- Đào tạo liên tục và chuẩn hóa chất lượng lực lượng bán hàng

Chức năng chính:

- Chương trình đào tạo theo vai trò
- Khóa học onboarding
- Bài test
- Chứng chỉ nội bộ
- Lịch tái đào tạo
- KPI đào tạo

### 4.9. Marketing & Growth Ops

Mục tiêu:

- Tạo lead đều, đo được ROI từng kênh

Chức năng chính:

- Campaign management
- Lead source
- UTM / attribution
- Form builder
- Content calendar
- Response templates
- Automation
- Lead routing
- Retargeting readiness

### 4.10. Partner / Agency / Collaborator OS

Mục tiêu:

- Quản lý hệ sinh thái phân phối thay vì chỉ quản lý sales nội bộ

Chức năng chính:

- Agency profiles
- Partner contracts
- CTV onboarding
- Source tracking
- Referral logic
- Partner performance
- Partner payout / debt / policy

### 4.11. CMS / SEO / Brand Media

Mục tiêu:

- Biến website thành cỗ máy tăng trưởng bền vững

Chức năng chính:

- CMS pages
- Articles
- Landing pages
- Public projects
- Testimonials
- Partner showcases
- Structured data
- Sitemap / robots / canonical
- SEO cluster publishing
- Local SEO
- E-E-A-T signals

### 4.12. Analytics & BI

Mục tiêu:

- Ra quyết định dựa trên dữ liệu thay vì cảm tính

Chức năng chính:

- Data mart theo miền
- Unified metrics layer
- Executive dashboards
- Funnel analytics
- Revenue analytics
- Recruitment analytics
- Marketing ROI
- Commission analytics
- Forecast / variance / alert

---

## 5. LUỒNG NGHIỆP VỤ CHUẨN TOÀN DOANH NGHIỆP

### 5.1. Luồng kinh doanh chuẩn

1. Lead vào từ website, ads, social, CTV, event, referral
2. Hệ thống chuẩn hóa và chống trùng lead
3. Lead được chấm điểm và phân bổ
4. Sales tư vấn, ghi timeline và nhu cầu
5. Matching sản phẩm phù hợp
6. Tạo deal
7. Thực hiện soft booking / đăng ký sự kiện
8. Chốt hard booking / giữ chỗ / đặt cọc
9. Sinh hợp đồng / phụ lục / tiến độ thanh toán
10. Theo dõi thu tiền và công nợ
11. Tính hoa hồng theo rule
12. Đối soát và chi trả
13. Chuyển khách sang hậu mãi / referral / tái mua

### 5.2. Luồng tuyển dụng - nhân sự chuẩn

1. Ứng viên đăng ký
2. OTP / KYC / consent
3. Sàng lọc
4. Test / chấm điểm
5. Duyệt tuyển
6. Sinh hợp đồng
7. Onboarding
8. Đào tạo bắt buộc
9. Gắn KPI
10. Theo dõi hiệu suất và lộ trình thăng tiến

### 5.3. Luồng tài chính chuẩn

1. Phát sinh giao dịch hoặc chi phí
2. Gắn nguồn phát sinh và cost center
3. Duyệt nhiều cấp nếu cần
4. Ghi nhận vào sổ quản trị
5. Theo dõi thực thu / thực chi
6. Dự báo dòng tiền
7. Đối soát
8. Xuất báo cáo quản trị và báo cáo phục vụ thuế

### 5.4. Luồng pháp lý chuẩn

1. Nhập hồ sơ pháp lý dự án
2. Kiểm checklist theo loại dự án
3. Kiểm trạng thái hiệu lực
4. Liên kết hồ sơ pháp lý với giỏ hàng / hợp đồng
5. Cảnh báo thiếu, sai, hết hạn
6. Khóa giao dịch nếu thiếu điều kiện bắt buộc

---

## 6. KIẾN TRÚC DỮ LIỆU MỤC TIÊU

### 6.1. Nguyên tắc

- Một thực thể có một nguồn chuẩn
- Không trùng định nghĩa khách hàng, sản phẩm, deal, hợp đồng
- Dùng event log và timeline để truy vết
- Tách rõ operational data và analytics data

### 6.2. Các domain data chính

- Organization
- User / Role / Permission
- Partner / Agency / Collaborator
- Customer / Lead / Contact / Demand
- Project / Product / Inventory / Pricing
- Deal / Booking / Contract / Payment
- Finance / Commission / Payroll
- Recruitment / Employee / Training
- Marketing / Campaign / Attribution / Content
- Legal / Document / Compliance
- Activity / Notification / Audit / Domain Event

### 6.3. Chuẩn kỹ thuật dữ liệu

- PostgreSQL cho transactional core
- Object storage cho document / media
- Event bus cho automation
- Data mart / warehouse cho BI
- Strict ID policy, status model, approval model, audit model

---

## 7. NGUYÊN TẮC THIẾT KẾ WEBSITE VÀ SEO

### 7.1. Mục tiêu website

- Tăng lead chất lượng
- Tăng traffic organic
- Tăng độ tin cậy thương hiệu
- Hỗ trợ tuyển dụng
- Hỗ trợ giỏ hàng dự án và chiến dịch bán hàng

### 7.2. Chuẩn cần đạt

- SEO-first architecture
- Tối ưu technical SEO
- Chuẩn Core Web Vitals
- Structured data đầy đủ
- Trang dự án và cụm nội dung có khả năng scale hàng loạt
- Tracking chuẩn cho attribution

### 7.3. Hướng nâng cấp

- Tách public website sang kiến trúc SSR/SSG phù hợp
- Dùng CMS làm headless content source
- Đồng bộ brand system và media assets
- Chuẩn hóa landing page templates cho chiến dịch

---

## 8. CHIẾN LƯỢC APP GIAI ĐOẠN 2

### 8.1. Sales App

- Nhận lead
- Cập nhật follow-up
- Xem giỏ hàng
- Tạo booking
- Xem deal và hoa hồng
- Nhận thông báo

### 8.2. Leader App

- Dashboard real-time
- Duyệt booking
- Duyệt payout
- Theo dõi KPI team
- Nhận cảnh báo deal risk

### 8.3. CTV App

- Đăng ký nhanh
- KYC
- Nhận tài liệu bán hàng
- Gửi lead
- Theo dõi giao dịch và hoa hồng

### 8.4. Customer App / Portal

- Hồ sơ giao dịch
- Tiến độ thanh toán
- Hồ sơ hợp đồng
- Thông báo CSKH
- Referral / loyalty

---

## 9. KPI KỲ VỌNG SAU CHUYỂN ĐỔI SỐ

### 9.1. Vận hành

- Giảm 25-40% khối lượng thao tác nhập liệu và điều phối thủ công
- Giảm 50-70% thời gian tổng hợp báo cáo điều hành
- 100% dữ liệu kinh doanh trọng yếu có truy vết

### 9.2. Kinh doanh

- Tăng 15-30% tốc độ phản hồi lead
- Tăng 10-20% tỷ lệ lead sang lịch hẹn / booking
- Tăng khả năng dự báo doanh thu theo team / dự án

### 9.3. Nhân sự

- Giảm 30-50% thời gian onboarding
- Chuẩn hóa đánh giá và lộ trình phát triển
- Giảm phụ thuộc vào đào tạo miệng

### 9.4. Tài chính

- Giảm sai lệch hoa hồng và đối soát
- Thấy được dòng tiền theo dự án và kỳ
- Nâng chất lượng dự báo tài chính

### 9.5. Marketing

- Đo được ROI theo nguồn lead và chiến dịch
- Tăng lead organic bền vững
- Giảm lãng phí ngân sách marketing nhờ attribution rõ hơn

---

## 10. LỘ TRÌNH TRIỂN KHAI TỔNG THỂ

### Phase 1: Core Operating System

Ưu tiên:

- Executive dashboard
- CRM
- Product / Project / Inventory
- Sales / Booking
- Finance / Commission

### Phase 2: People + Legal + Growth Foundation

Ưu tiên:

- HR / Recruitment / Training
- Contract & Legal
- Marketing operations
- CMS / website public

### Phase 3: Intelligence + Scale

Ưu tiên:

- Analytics & BI
- Automation nâng cao
- AI copilot
- Partner portal
- Mobile apps

---

## 11. TIÊU CHÍ 10/10 ĐỂ NGHIỆM THU

Hệ thống chỉ được coi là đạt chuẩn khi đồng thời thỏa các điều kiện sau:

- Quy trình lõi chạy được end-to-end
- Dữ liệu xuyên suốt giữa các phân hệ
- Có phân quyền và audit log đầy đủ
- Có dashboard điều hành cho lãnh đạo
- Có automation cho các tác vụ lặp lại
- Có website public tăng trưởng tốt
- Có khả năng scale thêm dự án, team, chi nhánh
- Có tài liệu nghiệp vụ và kỹ thuật đủ để bàn giao / vận hành

---

## 12. KẾT LUẬN

ProHouzing cần được xây như một nền tảng vận hành doanh nghiệp bất động sản sơ cấp, không phải chỉ là CRM, website hay app rời rạc.

Mọi quyết định xây tiếp từ thời điểm này phải bám đúng blueprint này:

- Ưu tiên giá trị vận hành thực
- Dữ liệu là tài sản lõi
- SEO và thương hiệu là động cơ tăng trưởng
- Tự động hóa là đòn bẩy giảm nhân sự
- Kiến trúc phải đủ chuẩn để dùng lâu dài
