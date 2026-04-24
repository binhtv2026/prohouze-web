# WEB / APP APP SHELL - PHASE 4 LOCKED

## Muc tieu

Khoa app shell chuan cho cac role dung app:

- sales
- agency
- manager
- bod
- marketing

Tu diem nay, app khong con la khai niem mo ho. Moi role co:

- home route
- bottom navigation
- quick actions
- thong bao bat buoc
- khay duyet nhanh neu can
- diem vao ho so / KPI / thu nhap

## Ket luan chot

### Sales app

- Home: `/sales`
- Bottom nav: Tong quan, Khach hang, Ban hang, San pham, Tai chinh
- Quick actions: Goi khach, Tao lich hen, Cap nhat giao dich, Gui tai lieu, Xem hoa hong

### CTV / Dai ly app

- Home: `/workspace`
- Bottom nav: Tong quan, Khach hang, Ban hang, Tai chinh, Tai lieu
- Quick actions: Goi khach, Gui bang gia, Gui phap ly, Xem booking, Xem hoa hong

### Manager app

- Home: `/workspace`
- Bottom nav: Dieu hanh, Lead nong, Booking, Doi nhom, Duyet nhanh
- Co khay duyet nhanh

### BOD quick app

- Home: `/workspace`
- Bottom nav: Tong quan, Canh bao, Phe duyet, Doanh thu, Doi nhom
- Co khay duyet nhanh

### Marketing quick app

- Home: `/workspace`
- Bottom nav: Tong quan, Chien dich, Lead, Kenh, Bao dong
- Khong can khay duyet nhanh

## Nguyen tac bat buoc

1. App phai tra loi ngay: hom nay lam gi, khach nao can xu ly, tien dang o dau.
2. Bottom nav chi duoc giu 4-5 tab song con.
3. Quick actions la bat buoc voi moi role dung app.
4. Role nao can duyet tren app phai co khay duyet nhanh rieng.
5. Khong copy web shell xuong app shell.

## Nguon su that trong code

- `frontend/src/config/platformAppShellPhaseFour.js`
- `frontend/src/pages/Admin/PlatformAppShellPage.jsx`
- `frontend/src/App.js`
- `frontend/src/config/navigation.js`

## Route quan tri

- `/settings/platform-app-shell`

Day la buoc 4/8 da khoa cho lo trinh web / app cua ProHouzing.
