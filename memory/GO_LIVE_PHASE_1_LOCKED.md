# GO-LIVE ĐỢT 1 ĐÃ KHÓA

## Mục tiêu
- Chỉ cho phép truy cập các vùng làm việc đã được chốt cho go-live đợt 1.
- Không để sidebar, workspace và truy cập trực tiếp lộ ra các màn legacy ngoài phạm vi.
- Mỗi role chỉ nhìn thấy đúng nhóm việc phục vụ công việc của mình.

## Nguồn sự thật
- Spec role dashboard: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/roleDashboardSpec.js`
- Guard route go-live: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/App.js`
- Sidebar theo scope: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/components/layout/Sidebar.jsx`
- Workspace theo scope: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/pages/RoleWorkspacePage.jsx`

## Quy tắc khóa
1. Role `sales` vào home tại `/sales`
2. Các role còn lại vào home tại `/workspace`
3. `/me` và `/dashboard` được giữ như điểm vào chung
4. Route ngoài scope role sẽ bị điều hướng về home của role đó
5. Sidebar chỉ hiển thị các tab lấy từ spec cuối cùng, không đọc module legacy
6. Workspace chỉ hiển thị các tab lấy từ spec cuối cùng, không đọc module legacy

## Role đang nằm trong đợt go-live 1
- Quản trị hệ thống
- Lãnh đạo
- Quản lý
- Nhân viên kinh doanh
- Nhân viên marketing
- Nhân viên tài chính
- Nhân viên nhân sự
- Nhân viên pháp lý
- Nhân viên website / CMS
- Cộng tác viên / Đại lý

## Trạng thái hiện tại
- Phạm vi go-live đã được khóa ở lớp spec
- Route truy cập trực tiếp ngoài scope đã bị chặn ở lớp app
- Sidebar và workspace đã đọc cùng một nguồn sự thật
