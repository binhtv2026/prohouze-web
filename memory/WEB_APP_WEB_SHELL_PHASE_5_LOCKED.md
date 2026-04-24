# WEB / APP WEB SHELL - PHASE 5 LOCKED

## Muc tieu

Khoa web shell chuan cho cac role dung web:

- admin
- bod
- manager
- marketing
- finance
- hr
- legal
- content

Tu diem nay, web khong con la tap hop page roi rac. Moi role dung web phai co:

- home web
- menu trai
- hang cho xu ly
- trung tam phe duyet
- bao cao / phan tich
- diem vao ho so / quyen loi

## Ket luan chot

### Admin web shell

- Home: `/workspace`
- Menu trai: Tong quan he thong, Nguoi dung & quyen, Du lieu chuan, Quy trinh, Website / CMS

### BOD web shell

- Home: `/workspace`
- Menu trai: Tong quan, Kinh doanh, Tai chinh, Canh bao & phe duyet

### Manager web shell

- Home: `/workspace`
- Menu trai: Dieu hanh doi, Kinh doanh, Cong viec, My Team

### Marketing web shell

- Home: `/workspace`
- Menu trai: Tong quan, Chien dich & kenh, Noi dung, Lead & tracking

### Finance web shell

- Home: `/workspace`
- Menu trai: Tong quan, Thu chi, Cong no, Hoa hong, Luong thuong

### HR web shell

- Home: `/workspace`
- Menu trai: Tong quan, Tuyen dung, Ho so nhan su, Dao tao, Phat trien

### Legal web shell

- Home: `/workspace`
- Menu trai: Tong quan, Ho so du an, Hop dong, Tai lieu cho sale

### CMS web shell

- Home: `/workspace`
- Menu trai: Tong quan website, Trang & landing, Noi dung web, Form & CTA, SEO & hieu suat

## Nguyen tac bat buoc

1. Web phai dua nguoi dung vao viec can xu ly va cho phe duyet, khong chi de xem KPI.
2. Menu trai phai la nhom cong viec that, khong phai cay module lon xon.
3. Web shell role nao cung phai co home route ro rang.
4. Role hybrid dung web van phai co web shell day du, khong duoc dua app shell len web.
5. Moi thay doi web shell tu nay phai sua trong nguon su that nay truoc.

## Nguon su that trong code

- `frontend/src/config/platformWebShellPhaseFive.js`
- `frontend/src/pages/Admin/PlatformWebShellPage.jsx`
- `frontend/src/App.js`
- `frontend/src/config/navigation.js`

## Route quan tri

- `/settings/platform-web-shell`

Day la buoc 5/8 da khoa cho lo trinh web / app cua ProHouzing.
