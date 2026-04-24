# WEB / APP NAVIGATION SPLIT - PHASE 2 LOCKED

## Muc tieu

Khoa navigation that theo dung mat tran web / app:

- web chi giu menu quan tri, BO, dieu hanh, bao cao, cau hinh
- app chi giu menu thao tac nhanh, hien truong, theo khach, theo booking, theo KPI ca nhan
- role hybrid co 2 shell, nhung shell mac dinh phai ro rang

## Ket luan chot

### Web shell mac dinh

- admin
- bod
- manager
- marketing
- finance
- hr
- legal
- content

### App shell mac dinh

- sales
- agency

## Shell cua role hybrid

### BOD

- Web shell: Tong quan, Kinh doanh, Tai chinh, Canh bao & phe duyet
- App shell: Tong quan, Canh bao & phe duyet

### Manager

- Web shell: Dieu hanh doi, Kinh doanh, Cong viec, My Team
- App shell: Dieu hanh doi, Kinh doanh, Cong viec

### Marketing

- Web shell: Tong quan, Chien dich & kenh, Noi dung, Lead & tracking
- App shell: Tong quan, Chien dich & kenh, Lead & tracking

## Shell cua role app-first

### Sales

- App shell: Tong quan, My Team, Khach hang, San pham, Ban hang, Kenh ban hang, Tai chinh
- Web shell phu: Tong quan, San pham, Tai chinh

### Agency

- App shell: Tong quan, Khach hang, Ban hang, Tai chinh, Tai lieu
- Web shell phu: Tong quan, Tai lieu

## Nguon su that trong code

- `frontend/src/config/platformNavigationSplit.js`
- `frontend/src/components/layout/Sidebar.jsx`
- `frontend/src/pages/RoleWorkspacePage.jsx`
- `frontend/src/pages/Admin/PlatformNavigationSplitPage.jsx`
- `frontend/src/App.js`
- `frontend/src/config/navigation.js`

## Route quan tri

- `/settings/platform-navigation`

## Nguyen tac bat buoc

1. Khong duoc dung mot menu chung cho tat ca role.
2. Shell mac dinh cua moi role phai co nguon su that.
3. Role hybrid phai co ca web shell va app shell, nhung web/app hien thi theo shell mac dinh duoc khoa.
4. Sidebar va workspace phai doc cung mot shell.
5. Tu diem nay, moi thay doi menu phai sua trong `platformNavigationSplit.js` truoc.

Day la buoc 2/8 da khoa cho lo trinh web / app cua ProHouzing.
