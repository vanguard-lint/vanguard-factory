# Bản bổ sung Harness và TestForge — chờ duyệt

Ngày soạn: **17/11/2026**. Nhánh: `docs/harness-testforge-workloop`.

Phạm vi: tài liệu kiến trúc và hướng dẫn cho **Workloop → Harness (DSH) → TestForge**.

## Đọc theo thứ tự

1. `docs/03-user-guides/harness-dsh/gioi-thieu.mdx`: vai trò Harness và lộ trình sử dụng.
2. `docs/03-user-guides/harness-dsh/cai-dat-ket-noi.mdx`: chuẩn bị Harness, plugin và gateway Workloop.
3. `docs/03-user-guides/harness-dsh/van-hanh-workloop.mdx`: chạy task, theo dõi session, xử lý HITL.
4. `docs/03-user-guides/testforge/cai-dat-ket-noi.mdx`: kết nối plugin với broker.
5. `docs/03-user-guides/testforge/quy-trinh-kiem-thu.mdx`: preview → xác nhận → chạy → đọc bằng chứng.
6. `docs/03-user-guides/testforge/tich-hop-workloop.mdx`: workflow hồi quy mẫu và quy trình duyệt.
7. `docs/03-user-guides/testforge/xu-ly-su-co.mdx`: chẩn đoán theo từng lớp.

## Căn cứ và giới hạn

| Nguồn | Phiên bản đối chiếu | Dùng cho |
|---|---|---|
| Repository tài liệu `vanguard-lint/vanguard-factory` | `ce27aab` | Cấu trúc Docusaurus, DSL và luồng dashboard đã có |
| `admin/workloop` | `1947a19ccb532f507394f9ac71fa2b51520f1785` | Gateway DSH, loader YAML, persona và cấu hình factory |
| `admin/vai_testforge` | `f9120a741a7fc28b3c1ef292de0542d83aec881e` | Tên tool, tham số, preview/execute, polling và đường dẫn broker |

Mã nguồn plugin đăng ký **10 tool**. Một số comment và tài liệu đi kèm còn ghi 7/8 tool;
bản bổ sung dùng định nghĩa tool trong `lib/index.js` làm căn cứ.

Các endpoint Harness/TestForge nội bộ timeout trong phiên soạn tài liệu. Hướng dẫn và mẫu
workflow đã đối chiếu mã nguồn; **chưa chạy job TestForge mới hoặc nghiệm thu E2E trên Workloop**.
Mẫu workflow cần QA/admin điền cấu hình môi trường, chuẩn bị suite và duyệt trước khi chạy.

## Trước khi đưa vào hướng dẫn vận hành chính thức

- [ ] Xác nhận địa chỉ Harness, broker và phiên bản plugin đang triển khai.
- [ ] Chạy health từ chính Harness, rồi smoke test một task Workloop.
- [ ] Chạy suite nhỏ trên staging, đối chiếu Workloop job ID, session ID và TestForge job ID.
- [ ] Thử một testcase cố ý FAIL; xác nhận báo cáo giữ FAIL và cổng duyệt chặn bàn giao.
- [ ] Đối chiếu ảnh, log/JUnit và revision ứng dụng đã kiểm thử.
- [ ] Duyệt nội dung và quyết định push nhánh tài liệu.

Chỉ thay đổi repository tài liệu. Không thay deployment, secret, provider/model hoặc factory đang chạy.

## Kiểm tra cục bộ

| Kiểm tra | Kết quả |
|---|---|
| TypeScript `npm run typecheck` | PASS |
| JSON/YAML trong hướng dẫn | 7 ví dụ JSON, 3 khối/tệp YAML hợp lệ |
| Sơ đồ Mermaid | 3 sơ đồ mới/cập nhật parse thành công |
| Loader Workloop | Đọc được workflow 3 node, 2 cạnh và 2 persona, đúng role/cổng duyệt |
| Docusaurus build + kiểm tra link | PASS với cấu hình bundler tương thích bên dưới |
| HTTP bản xem trước | 8 trang HDSD và 3 tệp mẫu trả HTTP 200 |
| `git diff --check` | PASS |
| Kiểm tra giao diện bằng trình duyệt tích hợp | Chưa thực hiện được do phiên trình duyệt không khả dụng |
| TestForge/Workloop E2E trên server | Chưa chạy; kết nối dịch vụ nội bộ timeout |

`npm run build` với cấu hình gốc gặp lỗi nạp native binding SWC/cache trên Windows của phiên
làm việc này. Đã dùng một cấu hình **chỉ dành cho kiểm tra cục bộ**, không sửa
`docusaurus.config.ts`, dependency hoặc lockfile của repository:

```ts
// .cache-loader/review.config.ts (thư mục đã được Git bỏ qua)
import config from '../docusaurus.config';
export default {...config, future: {...config.future, faster: false}};
```

```bash
npm run build -- --config .cache-loader/review.config.ts
npm run serve -- --host 127.0.0.1 --port 4173 --no-open
```

Build này vẫn biên dịch MDX, dựng trang tĩnh và giữ kiểm tra liên kết hỏng. Chưa chạy CI của
GitHub hoặc xác nhận build production trên server. Bản xem trước:
[Harness](http://127.0.0.1:4173/vanguard-factory/docs/user-guides/harness-dsh/gioi-thieu) ·
[TestForge trong Workloop](http://127.0.0.1:4173/vanguard-factory/docs/user-guides/testforge/tich-hop-workloop).
