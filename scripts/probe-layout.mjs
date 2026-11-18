/**
 * Probe layout qua Chrome DevTools Protocol — hỏi computed style thật của trang.
 * Cách dùng: node scripts/probe-layout.mjs <url>
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const { spawn } = await import('node:child_process');

const url = process.argv[2];
if (!url) { console.error('thieu url'); process.exit(1); }

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--window-size=1440,3200', '--force-device-scale-factor=1', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-' + Date.now(),
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch {} });

// đợi CDP sẵn sàng
let target = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const res = await fetch('http://127.0.0.1:' + PORT + '/json');
    const list = await res.json();
    const page = list.find((t) => t.type === 'page');
    if (page) { target = page; break; }
  } catch {}
}
if (!target) { console.error('khong ket noi duoc CDP'); process.exit(1); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve) => {
  const mid = ++id;
  pending.set(mid, resolve);
  ws.send(JSON.stringify({ id: mid, method, params }));
});
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Page.navigate', { url });
await new Promise((r) => setTimeout(r, 7000));

const expr = `(() => {
  const md = document.querySelector('article .markdown') || document.querySelector('.markdown');
  const art = document.querySelector('article');
  const h1 = document.querySelector('.markdown h1');
  const h2 = document.querySelector('.markdown h2');
  const pick = (el) => el ? {
    tag: el.tagName + '.' + (el.className.toString().split(' ').slice(0,2).join('.')),
    offsetWidth: el.offsetWidth,
    rectX: Math.round(el.getBoundingClientRect().x),
    rectRight: Math.round(el.getBoundingClientRect().right),
    csMaxWidth: getComputedStyle(el).maxWidth,
    csWidth: getComputedStyle(el).width,
  } : null;
  const fs = (el) => el ? getComputedStyle(el).fontSize : null;
  const p = document.querySelector('.markdown p');
  const pAll = [...document.querySelectorAll('.markdown > *')].slice(0, 8).map((el) => ({
    tag: el.tagName,
    w: Math.round(el.getBoundingClientRect().width),
    x: Math.round(el.getBoundingClientRect().x),
    right: Math.round(el.getBoundingClientRect().right),
    maxW: getComputedStyle(el).maxWidth,
  }));
  return JSON.stringify({
    article: pick(art),
    markdown: pick(md),
    firstP: p ? { w: Math.round(p.getBoundingClientRect().width), right: Math.round(p.getBoundingClientRect().right), maxW: getComputedStyle(p).maxWidth, width: getComputedStyle(p).width } : null,
    children: pAll,
    h1: { fontSize: fs(h1), cs: h1 ? getComputedStyle(h1).fontSize : null },
    h2: { fontSize: fs(h2) },
    viewport: window.innerWidth,
  }, null, 1);
})()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result?.result?.value || JSON.stringify(res));
ws.close();
chrome.kill();
process.exit(0);
