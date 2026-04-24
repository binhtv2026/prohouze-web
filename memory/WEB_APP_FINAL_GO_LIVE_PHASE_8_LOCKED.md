# WEB / APP FINAL GO-LIVE PHASE 8 LOCKED

## Mục tiêu
Khóa tuyệt đối lớp cuối cùng trước khi mở vận hành:

- final gates
- launch waves
- hypercare runbook
- rollback / support control

## Nguồn sự thật
- `frontend/src/config/platformFinalGoLivePhaseEight.js`

## Các gate cuối
Go-live final chỉ được coi là `locked` khi toàn bộ gate sau đều pass:

1. Scope đợt 1 đã khóa
2. Navigation split web / app đã khóa
3. Chuẩn màn hình theo surface đã khóa
4. App shell đã khóa
5. Web shell đã khóa
6. API + permission đã khóa
7. Kiểm thử thực địa web / app đã khóa
8. Validation go-live tổng đã khóa

## Launch waves
- `Wave 0 - Pilot nội bộ`
- `Wave 1 - Controlled launch`
- `Wave 2 - Back office completion`

Mỗi wave chỉ hợp lệ khi có:
- roles
- owners
- exit criteria

## Hypercare runbook
Đã khóa các mục:
- support roster
- issue triage board
- rollback plan
- field feedback loop
- launch command center

## Màn quản trị
- `/settings/platform-go-live-final`

## Ý nghĩa locked
Khi bước 8 locked:
- không còn chỉ là “đã làm xong config”
- mà đã có command center cuối cùng để quyết định go/no-go
- toàn bộ bước 1-7 trở thành input bắt buộc của quyết định vận hành
