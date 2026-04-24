# ProHouzing Dashboard Architecture 10/10

## Mục tiêu

Chuẩn hóa toàn bộ `dashboard chính`, `tab chuẩn` và `quyền hiển thị` để:

- dọn trùng lặp menu hiện tại,
- gom dashboard về một nguồn chuẩn duy nhất,
- thống nhất logic giữa `role`, `dashboard`, `tab` và `navigation`,
- làm nền cho bước tiếp theo là tái cấu trúc sidebar và quyền chi tiết.

## Khung chuẩn đã chốt

### 1. Mô hình quyền

Mỗi user được xác định theo:

- `Cấp bậc`
- `Mảng phụ trách`

### 2. Cấp bậc chuẩn

- Quản trị hệ thống
- Lãnh đạo
- Quản lý
- Nhân viên
- Cộng tác viên

### 3. Mảng phụ trách chuẩn

- Điều hành
- Kinh doanh
- Marketing
- Tài chính
- Nhân sự
- Pháp lý
- Vận hành
- Website / CMS

## Dashboard chính

1. Trung tâm quản trị
2. Bảng điều hành lãnh đạo
3. Bảng điều hành quản lý
4. Bảng làm việc nhân viên
5. Bảng kinh doanh
6. Bảng marketing
7. Bảng tài chính
8. Bảng nhân sự
9. Bảng pháp lý
10. Bảng website / CMS

## Nhóm menu mới

1. Điều hành
2. Kinh doanh
3. Doanh nghiệp
4. Tăng trưởng
5. Hệ thống

## Nguồn chuẩn trong code

Frontend source of truth:

- `frontend/src/config/dashboardGovernance.js`

Màn hình kiểm soát:

- `/settings/dashboard-architecture`
- `/settings/roles`

## Ý nghĩa triển khai

Sau bước này:

- role hiện tại được map về `cấp bậc + mảng`,
- mỗi role nhìn thấy dashboard đúng logic,
- tab của từng dashboard được khóa chuẩn,
- menu trái có thể dọn theo 5 nhóm mới,
- không còn phải quyết định dashboard/menu theo cảm tính.

## Bước tiếp theo để đạt 10/10 thật sự

1. Refactor sidebar theo `NHOM_MENU_MOI`
2. Refactor route visibility theo `dashboardGovernance.js`
3. Nối quick actions theo dashboard chính mới
4. Dọn module trùng giữa `navigation`, `dashboards`, `module_registry`
5. Áp cùng logic xuống RBAC backend
