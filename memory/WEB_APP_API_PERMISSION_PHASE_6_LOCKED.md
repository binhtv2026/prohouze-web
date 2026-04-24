# WEB / APP API + PERMISSION PHASE 6 LOCKED

## Mục tiêu
Khóa tuyệt đối lớp `API + permission theo web/app` để mỗi runtime chỉ dùng đúng:

- backend contract đã chốt
- permission `resource.action` đã chốt
- bề mặt web/app/hybrid của chính role đó

## Nguồn sự thật
- `frontend/src/config/platformApiPermissionPhaseSix.js`
- `frontend/src/config/goLiveBackendContracts.js`
- `frontend/src/config/goLiveActionPermissions.js`

## Runtime đã khóa
- `sales_app_runtime`
- `agency_app_runtime`
- `manager_hybrid_runtime`
- `bod_hybrid_runtime`
- `marketing_hybrid_runtime`
- `admin_web_runtime`
- `finance_web_runtime`
- `hr_web_runtime`
- `legal_web_runtime`
- `cms_web_runtime`

## Quy tắc locked
Một runtime chỉ được coi là `locked` khi:

1. tất cả `contract key` đều tồn tại trong backend contract registry
2. tất cả `permission resource` đều tồn tại trong permission registry
3. tất cả `action` yêu cầu đều tồn tại trong resource đó

## Khóa vào validation tổng
`frontend/src/config/goLiveRoleValidation.js` đã buộc thêm điều kiện:

- `platformApiLocked = true`

Tức là một bước go-live theo role chỉ pass khi:

- đúng scope
- có route
- visible trong data policy
- backend contract đã khóa
- quyền view đã khóa
- dữ liệu nền đã khóa
- runtime API + permission theo web/app đã khóa

## Màn quản trị
- `/settings/platform-api-permissions`

## Kết quả mong muốn
- Web runtime không dùng nhầm app contract
- App runtime không dùng nhầm BO/admin contract
- Hybrid runtime chỉ có đúng phần giao thoa đã chốt
- Validation go-live hiển thị pass/fail thật, không chỉ theo route UI
