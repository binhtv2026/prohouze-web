# WEB / APP SCREEN STANDARDS - PHASE 3 LOCKED

## Muc tieu

Khoa chuan man hinh that theo surface:

- web
- app
- hybrid

Tu diem nay, khong con lam page theo kieu legacy, truong hop nao cung co the nhom vao mot dashboard lon.

## Quy tac bat buoc

### Web

Moi cum module web phai co:

- Workspace
- List
- Detail
- Action

Khong duoc:

- chi co dashboard KPI ma khong co diem vao xu ly
- tron nhieu muc tieu trong mot page
- dung generic page khong ro role

### App

Moi cum module app phai co:

- Workspace
- List
- Detail
- Quick action

Khong duoc:

- copy nguyen web xuong app
- bang nhieu cot kieu back office
- dua cau hinh sau vao app

### Hybrid

Moi cum hybrid phai co:

- Workspace
- List
- Detail
- Action
- Quick action
- Approval

Khong duoc:

- dung mot man chung cho ca web va app
- tron duyet nhanh vao page phan tich sau
- dung cung mot shell menu cho moi boi canh

## Ket luan theo cum module

- Sales app -> home ngay, list khach/giao dich, detail khach/giao dich, quick action
- Agency app -> tuong tu sales nhung rut gon theo pham vi ca nhan
- Manager hybrid -> web de KPI / workload, app de lead nong / booking / duyet nhanh
- BOD hybrid -> web de dieu hanh sau, app de canh bao / phe duyet nhanh
- Marketing hybrid -> web de setup, app de theo doi nhanh
- Admin / Finance / HR / Legal / CMS -> web shell day du theo chuan workspace-list-detail-action

## Nguon su that trong code

- `frontend/src/config/platformScreenStandardsPhaseThree.js`
- `frontend/src/pages/Admin/PlatformScreenStandardsPage.jsx`
- `frontend/src/App.js`
- `frontend/src/config/navigation.js`

## Route quan tri

- `/settings/platform-screen-standards`

## Y nghia trien khai

Tu diem nay:

- module nao muon len web/app phai map vao bo man hinh chuan nay
- khong duoc mo them page neu chua ro no la workspace, list, detail hay action
- khong tiep tuc dung man legacy lam chuan cho surface moi

Day la buoc 3/8 da khoa cho lo trinh web / app cua ProHouzing.
