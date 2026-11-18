/**
 * Probe sự hiện diện của announcement bar trên nhiều trang.
 * Cách dùng: node scripts/probe-announcement.mjs <url1> <url2> ...
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;
const { spawn } = await import('node:child_process');

const urls = process.argv.slice(2);
if (!urls.length) { console.error('thieu url'); process.exit(1); }

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--window-size=1440,3200', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-ann-' + Date.now(),
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
if (!target) { console.error('khong ket noi CDP'); process.exit(1); }

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

for (const url of urls) {
  await send('Page.navigate', { url });
  await new Promise((r) => setTimeout(r, 6000));
  const expr = `(() => {
    const bar = document.querySelector('.theme-announcement-bar');
    if (!bar) return JSON.stringify({ bar: false });
    const cs = getComputedStyle(bar);
    const r = bar.getBoundingClientRect();
    const nav = document.querySelector('.navbar');
    const main = document.querySelector('.main-wrapper') || document.querySelector('main');
    const navRect = nav ? nav.getBoundingClientRect() : null;
    const mainRect = main ? main.getBoundingClientRect() : null;
    return JSON.stringify({
      bar: true,
      display: cs.display,
      height: Math.round(r.height),
      top: Math.round(r.top),
      visible: r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden',
      navbarTop: navRect ? Math.round(navRect.top) : null,
      navbarBottom: navRect ? Math.round(navRect.bottom) : null,
      mainTop: mainRect ? Math.round(mainRect.top) : null,
      gapNavToMain: navRect && mainRect ? Math.round(mainRect.top - navRect.bottom) : null,
      htmlClass: document.documentElement.className,
      dismissedAttr: document.documentElement.getAttribute('data-announcement-bar-initially-dismissed'),
      localStorage: localStorage.getItem('docusaurus.announcement.dismissed'),
    });
  })()`;
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  const short = url.replace('http://127.0.0.1:3000', '');
  console.log('== ' + short + ' ==');
  try { console.log(res.result.result.value); } catch { console.log(JSON.stringify(res)); }
}
ws.close();
chrome.kill();
process.exit(0);
