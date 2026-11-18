# Rà soát và bổ sung tài liệu Harness

Ngày đối chiếu: 18/11/2026. Bản tài liệu ban đầu: `1a87e63`, nhánh
`feat/harness_testforge_docs`.

## Bản public

Đã mở trang docs, trang giới thiệu Harness và trang tổng quan kiến trúc trên GitHub Pages.
Trang Harness public đã có nội dung của bản trước, sidebar có hai trang con cài đặt/kết nối
và vận hành Workloop. Tổng cộng ba trang HDSD. Kiến trúc cũng đã mô tả gateway, session,
TaskLoop và plugin.

| Nội dung | Bản public quan sát được | Bản bổ sung local |
|---|---|---|
| Điểm vào Workloop/DSH | Đã có | Giữ và thêm mục lục theo công việc |
| Session/workspace | Giải thích ngắn | Trang thao tác, SDK grouping và nơi lưu file |
| Model/plugin/secret | Rải trong cài đặt | Trang riêng và ma trận cách áp dụng thay đổi |
| TaskLoop | Chưa mô tả kỹ file/schema và terminal | Payload, SDK timeout, ID và ranh giới các loại loop |
| Review đầu ra | Checklist ngắn | Diff, revision, verdict, evidence và quyết định duyệt |
| Sự cố/recovery | Lưu ý chung | Chẩn đoán và đối soát theo profile |
| Hub/contract/iteration ADLC | Chưa phân biệt trong trang Harness đã đọc | Kiến trúc và reference riêng, không coi là năng lực Workloop sẵn có |
| Viết plugin | Khung trong repo còn để chờ bổ sung | Package, service verifier, patch entry và release |

Liên kết đã đọc:

- [Trang docs](https://vanguard-lint.github.io/vanguard-factory/docs/).
- [HDSD Harness](https://vanguard-lint.github.io/vanguard-factory/docs/user-guides/harness-dsh/gioi-thieu).
- [Kiến trúc Harness](https://vanguard-lint.github.io/vanguard-factory/docs/architecture/tang-3-harness/tong-quan-harness).

Nội dung trên website chưa chứng minh một lượt model/TestForge đã được nghiệm thu.
Đợt rà này không kết luận toàn bộ các chương khác đã khớp deployment.

## Source đối chiếu

Đọc repository ADLC và checkout `agent-harness-server` do người dùng chỉ định. Không thay
đổi source, cấu hình deployment hoặc runtime đang chạy.

| Nguồn | Mốc | File/nhóm file |
|---|---|---|
| ADLC | HEAD `e3f96e1`, cùng working tree | `sdk/dsh_web_sdk/client.py`, `config.py`, `taskloop.py`, README |
| ADLC | Cùng snapshot | `adlc-flow/langflow/adlc/harness_models.py`, `harness_client.py` |
| ADLC | Cùng snapshot | Contract v0.1, ADR 0015, milestone H4-H5 và runtime boundary |
| Harness | HEAD `1ce7de9`, có thay đổi local | Dockerfile, Compose, entrypoint, README, WIKI và cấu trúc profile |
| Harness | Cùng working tree | `vai-secrets/lib/index.js`, `vai-adlc-runtime/lib/index.js`, `plugin-integrity.js` |
| Harness | Cùng working tree | `vai-adlc-artifacts-git/lib/collector.js`, `vai-adlc-contract-execution/lib/verification.js` |
| Harness | Cùng working tree | `vai-adlc-contract-recovery/lib/runtime.js`, README recovery và iteration |

HEAD chưa đại diện các local changes đã đọc. Thư mục local `vai-taskloop` không có
implementation để đọc; phần file contract dựa trên SDK Python, README SDK và căn cứ
gateway của bản tài liệu trước.

## Thay đổi

- HDSD Harness từ ba lên tám trang; giữ URL ba trang cũ.
- Thêm kiến trúc contract/evidence và reference giao diện/credential.
- Thêm khung plugin, SDK Python; phân biệt gateway Workloop với hub/iteration ADLC.
- Sửa diễn giải trạng thái: agent cập nhật TaskLoop contract; engine ghi node/events;
  terminal chưa đồng nghĩa kiểm thử đạt.
- Cập nhật biến môi trường và tình trạng tài liệu, giữ Draft chờ review/deployment.

Văn xuôi được viết và rà theo `viet-nhu-nguoi`, giữ thuật ngữ/API/code. Không đưa địa chỉ
nội bộ, đường dẫn máy người dùng hoặc giá trị credential từ source vào docs public.

## Kiểm tra

| Kiểm tra | Kết quả |
|---|---|
| Whitespace/diff | PASS, `git diff --check` |
| TypeScript | PASS, `npm run typecheck` |
| MDX, sidebar và liên kết qua Docusaurus build | PASS, build cuối với cấu hình Windows; giữ kiểm tra link hỏng |
| Payload JSON/YAML và cú pháp Python/JavaScript | PASS: 2 JSON, 2 YAML, 2 Python, 1 JavaScript |
| Mermaid | PASS: 3 sơ đồ parse qua Mermaid với DOM từ jsdom |
| Sidebar và cấu trúc HDSD | PASS: 8 trang, position 1-8, mục cuối là kết quả đúng phải thấy |
| Rà văn phong | Đã quét và rà văn xuôi của 16 trang MDX theo skill được yêu cầu |
| Runtime DSH/Workloop/TestForge | Không chạy trong đợt tài liệu |

Build local dùng cấu hình tương thích Windows sẵn có ở `.cache-loader/review.config.ts`.
Không đổi cấu hình production hay dependency. Ví dụ trong docs chưa thay smoke test
trên release thật.

Kiểm tra code chỉ parse cú pháp/payload, không gọi model, tạo job TestForge hay gửi approval.
Build tạo đủ tám trang HDSD. Điểm quét văn phong chỉ tìm thói quen câu chữ để rà lại, không
được dùng như xác suất hoặc chứng nhận nguồn gốc văn bản.

## Đưa lên website

Các sửa đổi ở repository tài liệu. Workflow Pages build/deploy khi push vào `main` hoặc
được dispatch; sửa local hay cập nhật nhánh PR chưa tự thay bản public. Cần review, đưa
thay đổi vào `main` theo quy trình nhóm và xác nhận deployment thành công.
