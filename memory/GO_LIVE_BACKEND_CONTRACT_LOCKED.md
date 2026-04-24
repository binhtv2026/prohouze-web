# GO-LIVE ĐỢT 1 - BƯỚC 4 ĐÃ KHÓA

## Mục tiêu
- Mỗi route go-live phải map được tới contract backend cụ thể.
- Không để frontend mở route go-live mà không có endpoint chịu trách nhiệm.
- Role validation chỉ pass nếu route đã có contract backend khóa.

## Nguồn sự thật
- Registry contract: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/goLiveBackendContracts.js`
- Matrix kiểm thử theo role: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/config/goLiveRoleValidation.js`
- Màn quản trị contract: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/pages/Admin/GoLiveBackendContractsPage.jsx`
- Màn kiểm thử theo role: `/Users/binhtv/Desktop/ANKAPU/ProHouzing/ProHouzing_Mã  nguồn/prohouzing-source-code/frontend/src/pages/Admin/GoLiveValidationPage.jsx`

## Đã khóa trong bước 4
1. Có registry contract backend cho:
   - Auth
   - CRM
   - Sales
   - Marketing
   - Finance
   - Payroll
   - HR
   - Legal
   - Work
   - KPI
   - Analytics
   - CMS
   - Settings
2. Mỗi contract có:
   - key
   - method
   - endpoint
   - owner
   - consumer
   - routePrefixes
   - requestShape
   - responseShape
   - status
3. Màn `/settings/backend-contracts` là nơi chốt toàn bộ contract go-live
4. Màn `/settings/go-live-validation` chỉ pass bước test khi:
   - route đúng scope
   - route có trong registry go-live
   - route có contract backend đã khóa

## Tiêu chuẩn pass
- Route go-live không được “mồ côi backend”
- Không có bước kiểm thử nào pass nếu `backendLocked = false`
- Toàn bộ contract trong đợt 1 phải ở trạng thái `locked`
