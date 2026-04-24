# GO LIVE FOUNDATION BASELINE - LOCKED

## Mục tiêu

Khóa bước 6 của lộ trình go-live: chuẩn hóa dữ liệu nền.

Từ bước này trở đi:
- Mỗi route go-live phải có dependency dữ liệu nền rõ ràng.
- Validation chỉ pass khi dependency dữ liệu nền đã khóa.
- Dữ liệu nền không còn là khái niệm rời rạc, mà là registry trung tâm.

## Nguồn sự thật

File nguồn sự thật:
- `frontend/src/config/goLiveFoundationBaseline.js`

Các domain nền đã khóa:
- `user_directory`
- `organization_hierarchy`
- `master_data_catalog`
- `status_models`
- `project_catalog`
- `pricing_catalog`
- `sales_policy_catalog`
- `legal_catalog`

## Những gì được coi là dữ liệu nền

- Người dùng & vai trò
- Cơ cấu công ty / chi nhánh / team
- Master data
- State machine canonical
- Danh mục dự án / sản phẩm
- Bảng giá chuẩn
- Chính sách bán hàng chuẩn
- Pháp lý & tài liệu chuẩn

## Route dependency

Mỗi route go-live giờ đều map được về dependency nền:
- `/crm/*`
- `/sales/*`
- `/marketing/*`
- `/finance/*`
- `/payroll/*`
- `/hr/*`
- `/legal/*`
- `/work/*`
- `/kpi/*`
- `/cms/*`
- `/settings/*`

## Validation

Validation go-live theo role đã buộc thêm điều kiện:
- `foundationLocked = true`

File liên quan:
- `frontend/src/config/goLiveRoleValidation.js`
- `frontend/src/pages/Admin/GoLiveValidationPage.jsx`

Một bước test chỉ pass khi:
- đúng scope
- có route
- dữ liệu visible
- contract backend đã khóa
- quyền view đã khóa
- dependency dữ liệu nền đã khóa

## Màn quản trị

Màn admin để kiểm tra dữ liệu nền:
- `frontend/src/pages/Admin/GoLiveFoundationBaselinePage.jsx`

Route:
- `/settings/foundation-baseline`

## Kết quả khóa bước 6

Bước 6 được coi là locked vì:
- Có registry dữ liệu nền trung tâm.
- Có dependency map từ route sang dữ liệu nền.
- Có validation thật theo role.
- Có màn admin để nghiệm thu.

## Trạng thái

Locked cho pha go-live hiện tại.
