# GO-LIVE ĐỢT 1 - CHÍNH SÁCH DỮ LIỆU ĐÃ KHÓA

## Mục tiêu
- Không để fallback/demo xuất hiện vô tổ chức.
- Mỗi route trong đợt go-live phải có trạng thái dữ liệu rõ ràng.
- Các route chỉ mang tính seed nội bộ sẽ không lộ ra trong sidebar/workspace và không đi được bằng truy cập trực tiếp.

## 3 trạng thái dữ liệu

### 1. Dữ liệu thật
- Dùng cho hồ sơ cá nhân và cấu hình hệ thống đã có nguồn thật.
- Hiển thị badge `Dữ liệu thật`.

### 2. Dữ liệu kết hợp
- Ưu tiên dữ liệu thật.
- Nếu API chưa sẵn, lỗi hoặc rỗng thì dùng seed dự phòng để không trắng màn.
- Đây là trạng thái mặc định của đợt go-live 1 cho các module nghiệp vụ.

### 3. Seed nội bộ
- Chỉ dùng cho rà nội bộ.
- Không hiển thị trong phạm vi go-live chính thức.
- Truy cập trực tiếp sẽ bị chặn bởi guard của app.

## File nguồn sự thật
- Policy dữ liệu: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/goLiveDataPolicy.js`
- Scope role/tabs: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/roleDashboardSpec.js`
- Guard route: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/App.js`

## Đang mở chính thức trong đợt 1
- `/workspace`
- `/sales`
- `/crm/*`
- `/marketing/*`
- `/communications/*`
- `/finance/*`
- `/commission/*`
- `/payroll/*`
- `/hr/*`
- `/training/*`
- `/contracts/*`
- `/legal/*`
- `/cms/*`
- `/work/*`
- `/kpi/*`
- `/analytics/*`
- `/me`
- `/settings/*`

## Chỉ giữ nội bộ, không mở go-live
- `/control/*`
- `/automation/*`
- `/email/*`
- `/inventory/*`
- `/agency/*`
- `/dashboard/*` legacy

## Quy tắc triển khai
1. Sidebar chỉ hiển thị route đang `visibleInGoLive = true`
2. Workspace chỉ hiển thị route đang `visibleInGoLive = true`
3. Route truy cập trực tiếp ngoài phạm vi sẽ bị điều hướng về home theo role
4. Badge dữ liệu phải hiện ở workspace để người dùng biết rõ màn đó đang ở chế độ nào
