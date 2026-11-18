/**
 * Đo độ lệch tâm dọc của chữ trong nút — Range chữ vs box nút.
 * Cách dùng: node scripts/probe-button.mjs <url>
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;
const { spawn } = await import('node:child_process');
const url = process.argv[2] || 'http://127.0.0.1:3000/vanguard-factory/';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--window-size=1440,3200', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-btn-' + Date.now(),
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch {} });

let target = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const list = await (await fetch('http://127.0.0.1:' + PORT + '/json')).json();
    const page = list.find((t) => t.type === 'page');
    if (page) { target = page; break; }
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (m, p = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 7000));

const expr = `(() => {
  const out = [];
  const buttons = [...document.querySelectorAll('.button--primary, .navbar .btn')].slice(0, 4);
  for (const btn of buttons) {
    const br = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    // range của dòng chữ đầu tiên
    const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
    let textNode = null;
    while (walker.nextNode()) { if (walker.currentNode.textContent.trim()) { textNode = walker.currentNode; break; } }
    let tRect = null;
    if (textNode) {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      tRect = range.getBoundingClientRect();
    }
    out.push({
      label: (btn.className + ' | "' + (textNode ? textNode.textContent.trim().slice(0, 20) : '') + '"'),
      box: { h: Math.round(br.height), top: +br.top.toFixed(1), bottom: +br.bottom.toFixed(1) },
      text: tRect ? { h: +tRect.height.toFixed(1), top: +tRect.top.toFixed(1), bottom: +tRect.bottom.toFixed(1) } : null,
      lechTamdoc: tRect ? +(((br.top + br.height / 2) - (tRect.top + tRect.height / 2))).toFixed(1) : null,
      computed: {
        display: cs.display, alignItems: cs.alignItems,
        lineHeight: cs.lineHeight, fontSize: cs.fontSize,
        paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom,
        height: cs.height,
      },
    });
  }
  return JSON.stringify(out, null, 1);
})()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result?.result?.value || JSON.stringify(res));
ws.close(); chrome.kill(); process.exit(0);
