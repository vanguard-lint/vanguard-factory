# Hình minh họa — quy ước & nguồn

Quy tắc số 4 của bộ docs: **mỗi trang kiến trúc mở bằng 1 sơ đồ**, tái dùng hình từ các slide gốc.

## Nguồn slide

| Slide | Dùng cho |
|---|---|
| ADLC (deck chính) | 01 · 02 tổng quan, tầng 1–2, luồng E2E, kiểm chứng |
| sandbox-kit | Tầng 4, bảo mật nhiều lớp |
| agent_memory (pptx) | Agent Memory (Cognee) |
| TestForge-AI | TestForge |
| Ma trận năng lực Agent trong SDLC | 06 · ma-tran-nang-luc |

## Quy ước đặt tên

```
static/img/<ten-phan>/<ten-slide>-slide-<so>.png
```

Ví dụ:

```
static/img/02-architecture/adlc-slide-kientruc.png
static/img/02-architecture/sandbox-kit-slide-broker.png
static/img/03-user-guides/workloop-dashboard-runs.png
```

## Slot đang chờ hình

- `02-architecture/` — tổng quan 4 tầng, từng tầng, luồng E2E, data flow, security
- `03-user-guides/` — ảnh chụp dashboard (Runs, Duyệt), TestForge, Sandbox
- `06-reference/` — ma trận năng lực

> Lưu ý: chỉ xuất hình **không chứa** thông tin nhạy cảm (token, URL nội bộ thật, tên workflow/agent
> của tenant). Kiểm tra trước khi commit.
