# GO LIVE ACTION PERMISSIONS - LOCKED

## Mục tiêu

Khóa bước 5 của lộ trình go-live: quyền hành động thật theo role.

Từ bước này trở đi:
- Không chỉ ẩn menu.
- Không chỉ khóa phạm vi route.
- Mỗi route go-live phải map được tới `resource.action`.
- Mỗi role chỉ được vào route khi có quyền `view` tương ứng.

## Nguồn sự thật

File nguồn sự thật:
- `frontend/src/config/goLiveActionPermissions.js`

Các lớp đã khóa:
- `resource`
- `action`
- `scope`
- `route -> resource.action`
- `role -> resource.action -> allow/deny`

## Quy ước action

Các action chuẩn:
- `view`
- `create`
- `edit`
- `approve`
- `export`
- `configure`

Các scope chuẩn:
- `none`
- `self`
- `team`
- `department`
- `company`
- `system`

## Route guard

Route guard đã được nối tại:
- `frontend/src/App.js`

Nguyên tắc:
- Route ngoài go-live scope: chặn.
- Route trong scope nhưng role không có `view`: chặn.
- Khi bị chặn, người dùng quay về home của role.

## Permission context

Context quyền đã được nối lại tại:
- `frontend/src/contexts/PermissionContext.jsx`

Nguyên tắc:
- Không phụ thuộc ma trận backend cũ.
- Tính trực tiếp từ `goLiveActionPermissions.js`.
- `canAccessMenu(path)` dùng cùng một nguồn với route guard.

## Validation

Validation go-live theo role đã được buộc thêm điều kiện:
- `actionLocked = true`

File liên quan:
- `frontend/src/config/goLiveRoleValidation.js`
- `frontend/src/pages/Admin/GoLiveValidationPage.jsx`

Một bước test chỉ được coi là `ready` khi:
- đúng scope
- có route
- dữ liệu không bị hidden
- backend contract đã khóa
- quyền `view` đã khóa

## Màn quản trị

Màn admin để kiểm tra ma trận quyền hành động:
- `frontend/src/pages/Admin/GoLiveActionPermissionsPage.jsx`

Route:
- `/settings/action-permissions`

Mục đích:
- xem tổng số quyền theo role
- xem summary scope
- xem chi tiết resource/action/role

## Kết quả khóa bước 5

Bước 5 được coi là locked vì:
- Có nguồn sự thật duy nhất cho action permissions.
- Có route guard thật.
- Có menu guard thật.
- Có validation thật.
- Có màn admin thật.

## Trạng thái

Locked cho pha go-live hiện tại.
