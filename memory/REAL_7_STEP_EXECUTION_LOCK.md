# REAL 7-STEP EXECUTION LOCK

Cap nhat: 2026-04-02

## Da khoa bang code va audit

### 1. App kinh doanh that
- App shell da co route, layout va page that:
  - `/app`
  - `/app/:sectionKey`
  - `/app/ho-so`
- Roles dung app:
  - `sales`
  - `agency`
  - `manager`
  - `bod`
  - `marketing`

### 2. Du lieu/API that cho dot 1
- App Home va App Module da noi API that theo role cho:
  - sales / agency
  - manager
  - bod
  - marketing
- Fallback chi giu vai tro an toan, khong con la nguon chinh duy nhat.

### 3. Permission backend that
- Canonical RBAC backend da map du cac route `require_permission(...)`.
- Audit:
  - `python3 backend/scripts/audit_canonical_permissions.py`

### 4. Foundation / seed / baseline that
- Manifest tai san du lieu nen da khoa:
  - `backend/config/go_live_foundation_assets.py`
- Audit:
  - `python3 backend/scripts/audit_foundation_assets.py`

### 5. Test/UAT preflight
- Route audit:
  - `npm run audit:routes`
- Role/session/app runtime tests:
  - `npm run test:role-flows`
- Go-live preflight:
  - `npm run preflight:go-live`

## Da tao tai san van hanh nhung chua the khoa 100% tai local

### 6. Production env
- Example env:
  - `backend/.env.production.example`
  - `frontend/.env.production.example`
- Audit:
  - `npm run audit:production-env`
- Chi co the pass khi co bien moi truong production that.

### 7. Pilot / rollback / hypercare
- Chua the khoa 100% trong local vi can:
  - domain that
  - DB production/staging
  - user pilot that
  - hinh ha tang va support roster

## Tieu chuan go/no-go hien tai
- Permission backend pass
- Foundation audit pass
- Route audit pass
- Role flow tests pass
- Build production pass

## Con blocker that
- Chua co project app native rieng, hien tai la app shell trong web frontend.
- Chua co env production that nen buoc production env audit chua the pass tai local.
- Chua co pilot user va ha tang production/staging that nen chua the khoa buoc pilot/go-live cuoi cung bang thuc dia.
