import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

/**
 * Lỗi "ResizeObserver loop completed with undelivered notifications" là lỗi
 * vô hại của trình duyệt (xảy ra khi một ResizeObserver callback làm thay đổi
 * layout trong cùng frame), nhưng overlay của webpack-dev-server bắt lỗi
 * runtime và che toàn trang ở chế độ dev.
 *
 * Module này ẩn overlay KHI VÀ CHỈ KHI nội dung overlay là lỗi vô hại đó —
 * các lỗi runtime/build khác vẫn hiển thị bình thường. Chỉ ảnh hưởng dev,
 * không ảnh hưởng bản build production.
 */
const benignError =
  /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/i;

function hideOverlayIfBenign(iframe: HTMLIFrameElement): void {
  try {
    const text = iframe.contentDocument?.body?.innerText ?? '';
    if (!text) return;
    iframe.style.display = benignError.test(text) ? 'none' : '';
  } catch {
    // Iframe chưa load xong hoặc cross-origin: bỏ qua, lần mutation sau sẽ
    // được kiểm tra lại.
  }
}

function watchOverlayIframe(iframe: HTMLIFrameElement): void {
  // Nội dung được ghi bởi webpack-dev-server trong sự kiện load của iframe;
  // lắng nghe sau handler của nó nên nội dung đã sẵn sàng khi chạy đến ta.
  iframe.addEventListener('load', () => hideOverlayIfBenign(iframe));
  // Theo dõi thêm thay đổi nội dung bên trong (overlay được cập nhật chỗ ở).
  const doc = iframe.contentDocument;
  if (doc?.body) {
    new MutationObserver(() => hideOverlayIfBenign(iframe)).observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  hideOverlayIfBenign(iframe);
}

export default (function (): {onClientEntry: () => void} | null {
  if (!ExecutionEnvironment.canUseDOM) {
    return null;
  }
  return {
    onClientEntry() {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (
              node instanceof HTMLIFrameElement &&
              node.id === 'webpack-dev-server-client-overlay'
            ) {
              watchOverlayIframe(node);
            }
          }
        }
      });
      // Overlay iframe được webpack-dev-server append vào document.body.
      observer.observe(document.body, {childList: true});
    },
  };
})();
