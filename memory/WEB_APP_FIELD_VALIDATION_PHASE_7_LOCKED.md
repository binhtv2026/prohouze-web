# WEB / APP FIELD VALIDATION PHASE 7 LOCKED

## Mục tiêu
Khóa tuyệt đối bước `kiểm thử thực địa theo role` để mỗi role chỉ được coi là pass khi:

- có scope đợt 1
- có navigation split đúng
- có shell đúng web/app
- có chuẩn màn hình theo surface
- có checkpoint vận hành thật theo web/app
- mỗi checkpoint đi qua route sống, có data policy, có contract backend, có permission, có dữ liệu nền

## Nguồn sự thật
- `frontend/src/config/platformFieldValidationPhaseSeven.js`

## Vai trò bắt buộc kiểm thử
- Admin
- BOD
- Manager
- Sales
- Marketing
- Finance
- HR
- Legal
- Website / CMS
- Agency

## Nguyên tắc checkpoint
Mỗi role có checkpoint riêng theo đúng surface phải dùng:

- `Web`: workspace, list, detail, action, approval
- `App`: home, list, detail, quick action, approval tray nếu role cần

## Điều kiện locked theo role
Một role chỉ được coi là `locked` khi đồng thời:

1. `launchLocked = true`
2. `navigationLocked = true`
3. `webShellLocked = true` nếu role cần web
4. `appShellLocked = true` nếu role cần app
5. `screenStandardLocked = true`
6. `checkpointsLocked = true`

## Điều kiện locked theo checkpoint
Một checkpoint chỉ pass khi:

1. route đã đăng ký go-live
2. visible trong data policy
3. role có quyền view route đó
4. backend contract cho route đã khóa
5. dữ liệu nền cho route đã khóa
6. runtime API + permission theo web/app cho route đã khóa

## Tích hợp vào validation tổng
`frontend/src/config/goLiveRoleValidation.js` đã buộc thêm:

- `platformFieldLocked`

Tức là một role không thể pass go-live tổng nếu chưa pass kiểm thử thực địa web/app.

## Màn quản trị
- `/settings/platform-field-validation`
