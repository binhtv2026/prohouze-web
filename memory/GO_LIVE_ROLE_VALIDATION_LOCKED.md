# GO-LIVE ĐỢT 1 - BƯỚC 3 ĐÃ KHÓA

## Mục tiêu
- Kiểm thử theo role phải trở thành một phần của hệ thống, không còn là checklist rời.
- Mỗi role có tài khoản demo riêng, home riêng, route kiểm thử riêng và kỳ vọng rõ ràng.
- Mỗi bước test phải biết:
  - đúng scope hay không
  - có route thật hay không
  - đang dùng dữ liệu thật hay dữ liệu kết hợp

## Nguồn sự thật
- Matrix kiểm thử: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/goLiveRoleValidation.js`
- Registry route go-live: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/goLiveRouteRegistry.js`
- Màn hình giám sát: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/pages/Admin/GoLiveValidationPage.jsx`

## Đã khóa trong bước 3
1. Tất cả 10 role đều có checklist kiểm thử
2. Mỗi role có bước:
   - đăng nhập
   - vào đúng home
   - đi qua từng tab con chính trong go-live
3. Mỗi bước có:
   - route
   - kỳ vọng
   - trạng thái dữ liệu
   - kiểm tra đúng scope
   - kiểm tra có route
4. Màn `/settings/go-live-validation` là nơi chốt pass/fail toàn bộ bước 3

## Tiêu chuẩn pass
- `Pass` chỉ khi:
  - route nằm trong go-live scope của role
  - route có trong registry go-live
  - route không bị ẩn bởi policy dữ liệu

## Điều không làm
- Không test theo cảm giác
- Không test truyền miệng
- Không để checklist nằm ngoài hệ thống
