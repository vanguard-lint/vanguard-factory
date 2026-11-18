# Đối chiếu PR #5 với tài liệu Harness/Workloop

Ngày kiểm tra: **17/11/2026**.

**Kết luận: cần kết hợp nội dung, giữ hai phần đóng góp riêng.** PR #5 phụ trách TestForge
ở cấp sản phẩm; nhánh của Hiếu phụ trách Harness và điều phối từ Workloop. Không cần sao chép
11 trang mới của tác giả vào PR Harness.

## Trạng thái và bằng chứng

- [PR #5](https://github.com/vanguard-lint/vanguard-factory/pull/5) của `hquannnguyen` đang
  **open**, chưa merge; chưa có review/comment tại thời điểm đọc.
- PR thay đổi 12 tệp: thêm 11 trang và sửa `testforge/gioi-thieu.mdx`.
- Đối chiếu nhánh `feat/harness_testforge_docs` tại `f644abb` với PR #5 tại `1d07999`.
- `git merge-tree` phát hiện xung đột nội dung tại **một tệp**:
  `docs/03-user-guides/testforge/gioi-thieu.mdx`.
- PR #5 cũng đang xung đột trang này với `main` hiện tại (`ce27aab`), chưa liên quan tới
  các bổ sung Harness. Tác giả/maintainer cần cập nhật nhánh và giải quyết mục lục khi merge.
- Sidebar PR #5 dùng position 2–12; bốn trang tích hợp của Hiếu đang dùng 2–5 nên cần đổi.

## Phần nào dùng từ đâu?

| Nội dung | Nơi giữ chi tiết |
|---|---|
| Cài Python/Node, Broker, Docker, dependency | PR #5: `cai-dat`, `cau-hinh`, `trien-khai-docker` |
| Cognee Adapter, Standard Test Input, CLI/API | PR #5: `cognee`, `su-dung-co-ban`, `dieu-phoi-va-api` |
| Performance và phân tích ảnh hưởng | PR #5: `kiem-thu-hieu-nang`, `hoi-quy-impact` |
| Vận hành dịch vụ TestForge | PR #5: `van-hanh-su-co`, `tham-chieu` |
| Cài plugin vào DSH, secret/profile, schema tool | Nhánh Harness: `cai-dat-ket-noi`, `quy-trinh-kiem-thu` |
| DAG, duyệt, report, định danh Workloop/session/job | Nhánh Harness: `tich-hop-workloop`, mẫu spec/persona |
| Lỗi tại ranh giới Workloop–Harness–broker | Nhánh Harness: `xu-ly-su-co` |

## Các điểm đã sửa trong patch đi kèm

1. Đổi tiêu đề/nhãn để rõ hướng dẫn plugin Harness khác cài đặt sản phẩm TestForge.
2. Dành position **13–16** cho bốn trang tích hợp, tránh trùng 2–12 của PR #5.
3. Phân biệt hot reload phía plugin với env broker đọc lúc khởi động.
4. Phân biệt Cognee Adapter HTTP của broker với plugin Agent Memory/MCP trong DSH.
5. Thêm cách xử lý `result/{job_id}` trả 404 sau restart khi chỉ mục job nằm trong RAM.
6. Bổ sung ma trận tương thích: broker mới có cancel/impact, nhưng plugin 10 tool được tham
   chiếu chưa expose cancel/impact và chưa chuyển tiếp các trường staging impact.
7. Giữ mẫu Workloop ở phạm vi suite cố định đã duyệt; chưa tuyên bố tự chọn test theo impact.

Các nhận xét về broker mới dựa trên tài liệu trong PR #5, **chưa phải xác nhận deployment đang
chạy bản đó**. Mã plugin tham chiếu được kiểm tra riêng ở `lib/index.js`.

## Các điểm cần thống nhất trước khi merge

| Điểm | Vì sao cần thống nhất |
|---|---|
| `plugin/testforge-ai` trong trang API/kiến trúc PR #5 so với `vai_testforge` ở Harness | Có thể là hai cách đóng gói hoặc revision khác nhau; không coi là thay thế tương đương chỉ từ tên |
| Cancel | PR #5 có endpoint, nhưng ghi rõ không bền vững qua restart; plugin cũ không có tool cancel |
| Impact | Broker nhận thêm trường, wrapper staging cũ bỏ các trường chưa hỗ trợ; cần adapter/schema tương thích |
| Build SUT | `target_revision` là khai báo của caller trong PR #5; tích hợp cần lấy metadata triển khai thực |
| Nội suy image tag của Docker Compose | Nếu `TESTFORGE_SOURCE_REVISION` chỉ nằm trong `opt/broker.env`, cần `--env-file opt/broker.env` ở lệnh build/up; `env_file` của service không tự cấp biến để nội suy image tag |
| Giới thiệu TestForge | Giữ mục lục 11 trang sản phẩm và thêm 4 trang Harness/Workloop; không giữ hai mục lục thay thế nhau |

Điểm Docker ở trên dựa trên [quy tắc nội suy của Docker Compose](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/).
Phần Docker trong PR #5 tạo `opt/broker.env`, nhưng chuỗi lệnh build/up đầu tiên chưa truyền
`--env-file`. Cần chọn một cách nhất quán, ví dụ:

```bash
docker compose --env-file opt/broker.env build broker
docker compose --env-file opt/broker.env up -d broker
```

Đây là vấn đề có điều kiện: nếu shell hoặc `.env` đã cấp biến thì lệnh ngắn vẫn có thể chạy.
Không đọc/in nội dung secret chỉ để kiểm tra ví dụ này.

## Cách đưa hai PR về chung

1. Áp dụng patch tương thích vào nhánh Harness; patch không thêm 11 trang đang thuộc PR #5.
2. Tác giả/maintainer cập nhật PR #5 với `main` và xử lý xung đột trang giới thiệu.
3. Sau khi PR #5 được merge, cập nhật `origin/main` rồi merge/rebase nhánh Harness theo quy
   trình nhóm. Giải quyết trang giới thiệu bằng mục lục hợp nhất đã chuẩn bị.
4. Chỉ dùng bản mục lục hợp nhất **sau khi** 11 trang đích đã có; dùng sớm sẽ tạo link hỏng.
5. Build lại và kiểm tra sidebar; nghiệm thu runtime là bước riêng trước khi công bố tích hợp.

Không gửi comment/review lên PR #5, không commit/push hoặc merge vào repository của nhóm trong
lượt đối chiếu này. Patch được chuẩn bị từ bản sao của đúng commit nhánh người dùng; repository
gốc không thay đổi.

## Kiểm tra patch và bản ghép thử

| Kiểm tra | Kết quả |
|---|---|
| `git diff --check` trên patch | PASS |
| `git apply --check` trên nhánh người dùng tại `f644abb` | PASS, không ghi thay đổi vào repository người dùng |
| Frontmatter và sidebar bản ghép | 16 trang, position 1–16, không trùng |
| Mục lục hợp nhất | Có liên kết tới 11 trang sản phẩm và 4 trang tích hợp |
| Docusaurus build bản ghép | PASS, giữ `onBrokenLinks: throw` |
| Runtime TestForge/Workloop | Chưa nghiệm thu trong lượt đối chiếu tài liệu |

Build dùng cấu hình cục bộ tương thích Windows: `future.faster: false` và tắt Webpack cache
dùng chung giữa các bản sao. Không thay cấu hình production hoặc dependency trong patch.
Hai lượt build đầu dùng chung cache qua junction đã lỗi SSG; kết quả PASS ở trên là lượt
build bản ghép chạy riêng sau khi tách cache. Không ghi nhận standalone full-build PASS từ
các lượt bị lỗi đó.

Tệp bàn giao:

- `harness-testforge-pr5-alignment.patch`: 6 trang/tệp tài liệu chỉnh tương thích và bản đối chiếu này.
- `harness-testforge-merged-intro.mdx`: mục lục hợp nhất, chỉ dùng sau khi các trang PR #5 đã có.

Patch tương thích không chứa hoặc tự merge 11 trang PR #5.
