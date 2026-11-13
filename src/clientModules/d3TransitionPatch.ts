/**
 * Fix lỗi: "TypeError: tooltipElem.transition is not a function" khi render
 * Mermaid diagram.
 *
 * Nguyên nhân: các chunk của Mermaid chỉ `import {select} from "d3"` và gọi
 * `tooltipElem.transition()` — hàm này KHÔNG tồn tại sẵn trong d3-selection,
 * mà được thêm vào prototype bởi module `d3-transition` khi nó được evaluate
 * (side effect của dòng `export * from 'd3-transition'` trong gói umbrella
 * `d3`). Gói `d3` khai báo `"sideEffects": false` (khai báo không chính xác
 * với trường hợp này), nên bundler tree-shake mất `d3-transition` vì không có
 * export nào của nó được dùng trực tiếp → prototype không được patch → lỗi
 * runtime khi hover node trong flowchart.
 *
 * Bare side-effect import từ mã nguồn app luôn được bundler giữ lại, đảm bảo
 * `d3-transition` được evaluate (và patch prototype) trước khi Mermaid render.
 * Hoạt động ở cả chế độ dev và bản build production.
 */
import 'd3-transition';

export default {};
