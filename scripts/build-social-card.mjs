/**
 * Render social card 1200x630 theo brand Vanguard (nen den + logo do + chu trang)
 * qua Chrome headless -> static/img/social-card.png
 * Cach dung: node scripts/build-social-card.mjs
 */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ROOT = process.cwd();
const LOGO = ROOT + '/static/img/logo-vanguard.svg';
const OUT = ROOT + '/static/img/social-card.png';
const WORK = tmpdir() + '/social-card-' + Date.now();
mkdirSync(WORK, { recursive: true });

const logoB64 = readFileSync(LOGO).toString('base64');
const title = 'ADLC Factory';
const tagline = 'T\u00e0i li\u1ec7u h\u1ec7 th\u1ed1ng ADLC \u2014 workflow \u0111i\u1ec1u ph\u1ed1i v\u00e0 ki\u1ec3m th\u1ee9 t\u1ef1 \u0111\u1ed9ng';

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@600&family=Overpass:wght@400;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; background: #0a0a0b; }
  body {
    display: flex; align-items: center;
    padding: 0 90px;
    font-family: 'Overpass', system-ui, sans-serif;
    border-left: 16px solid #e74539;
  }
  .logo { width: 220px; height: auto; margin-right: 80px; flex-shrink: 0; }
  h1 { color: #ffffff; font-size: 104px; font-weight: 700; letter-spacing: -1px; line-height: 1; }
  p {
    margin-top: 28px;
    color: #9aa0a6;
    font-family: 'Overpass Mono', monospace;
    font-size: 30px; font-weight: 600;
    max-width: 720px; line-height: 1.45;
  }
  .accent { color: #e74539; }
</style></head>
<body>
  <img class="logo" src="data:image/svg+xml;base64,${logoB64}">
  <div>
    <h1>${title}</h1>
    <p><span class="accent">\u25b6</span> ${tagline}</p>
  </div>
</body></html>`;

const htmlPath = WORK + '/card.html';
writeFileSync(htmlPath, html);

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=9230', '--window-size=1200,630',
  '--user-data-dir=' + WORK + '/profile',
  'about:blank',
], { stdio: 'ignore' });
process.on('exit', () => { try { chrome.kill(); } catch {} });

let target = null;
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 500));
  try {
    const list = await (await fetch('http://127.0.0.1:9230/json')).json();
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
const send = (m, p = {}) => new Promise((res) => { const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method: m, params: p })); });
await new Promise((r) => (ws.onopen = r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'file:///' + htmlPath.replace(/\\/g, '/') });
await new Promise((r) => setTimeout(r, 8000)); // doi font Google load

// xac minh da render day du truoc khi chup
const check = await send('Runtime.evaluate', {
  expression: `JSON.stringify({ font: document.fonts.check('700 104px Overpass'), imgs: [...document.images].every(i => i.complete && i.naturalWidth > 0) })`,
  returnByValue: true,
});
console.log('render check:', check.result.result.value);

const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
console.log('written: static/img/social-card.png (' + readFileSync(OUT).length + ' bytes)');
ws.close(); chrome.kill();
try { rmSync(WORK, { recursive: true, force: true }); } catch {}
process.exit(0);
