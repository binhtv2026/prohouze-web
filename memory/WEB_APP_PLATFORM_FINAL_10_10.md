# WEB / APP PLATFORM STRATEGY - FINAL 10/10

## Muc tieu

Chot mo hinh 2 mat tran cho ProHouzing:

- Web = quan tri, back office, dieu hanh, bao cao, cau hinh
- App = luc luong tien tuyen, xu ly nhanh, di dong, theo khach, theo lich, theo giao dich

Khong lam theo huong web va app cung chua tat ca. Moi role chi duoc gan dung be mat su dung chinh.

## Ket luan theo role

### Web only

- admin
- finance
- hr
- legal
- content

### App first

- sales
- agency

### Hybrid

- bod
- manager
- marketing

## Ket luan theo bo phan

### Web la mat tran chinh

- Admin / He thong
- Finance
- HR
- Legal
- Website / CMS

Ly do:

- can bang du lieu lon
- can loc nhieu cot
- can quy trinh duyet
- can quan tri sau
- can cau hinh he thong

### App la mat tran chinh

- Nhan vien kinh doanh
- Cong tac vien / Dai ly

Ly do:

- lam viec ngoai hien truong
- cham khach theo ngay
- theo lead, lich hen, booking, hoa hong
- can toc do, thao tac nhanh, thong bao ngay

### Hybrid

- BOD
- Manager
- Marketing

Ly do:

- web de xem sau, phan tich, setup
- app de theo doi nhanh, duyet nhanh, nhan canh bao

## Ket luan theo cum module

### App

- Dashboard ngay cua sales
- Khach hang
- San pham
- Ban hang
- Kenh ban hang
- Tai chinh cua toi
- My Team
- Dashboard CTV / dai ly

### Web

- Dieu hanh he thong
- Tai chinh
- Nhan su
- Phap ly
- CMS / Website
- Du lieu nen
- Phan quyen
- Go-live control

### Hybrid

- Executive workspace
- Manager workspace
- Marketing workspace

## Nguyen tac trien khai

1. Web khong lam theo tu duy mobile copy.
2. App khong copy nguyen web.
3. App chi phuc vu:
   - lam viec trong ngay
   - xu ly khach / giao dich
   - nhan canh bao / duyet nhanh
   - xem KPI / thuong / hoa hong
4. Web phuc vu:
   - dieu hanh
   - bao cao
   - cau hinh
   - quan tri
   - back office
5. Role nao da khoa web/app thi dashboard, menu, route va workspace phai ton trong quy tac nay.

## Thu tu rollout toi uu

1. Sales app
2. Manager hybrid
3. Marketing hybrid
4. Finance web
5. HR / Legal web
6. Admin / CMS web
7. BOD hybrid

## Nguon su that trong code

- `frontend/src/config/platformSurfaceStrategy.js`
- `frontend/src/config/roleGovernance.js`
- `frontend/src/pages/Admin/PlatformSurfaceStrategyPage.jsx`
- `frontend/src/config/navigation.js`
- `frontend/src/App.js`

## Route quan tri

- `/settings/platform-surfaces`

Day la ban khoa cuoi cho quyet dinh web/app cua ProHouzing. Tu diem nay, moi quyet dinh UI/UX/module moi phai di theo mat tran nay.
