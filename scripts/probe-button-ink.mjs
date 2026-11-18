/**
 * Đo vị trí MỰC THẬT của chữ trong nút (bỏ qua line box) — chụp clip 4x rồi phân tích pixel.
 * Cách dùng: node scripts/probe-button-ink.mjs <url>
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9227;
const { spawn } = await import('node:child_process');
const { readFileSync, writeFileSync } = await import('node:fs');
const { inflateSync } = await import('node:zlib');

const url = process.argv[2] || 'http://127.0.0.1:3000/vanguard-factory/';
const SCALE = 4;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--window-size=1440,3200', '--hide-scrollbars', '--force-device-scale-factor=' + SCALE,
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-ink-' + Date.now(),
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

// lấy rect nút: PICK=navbar -> nút navbar, mặc định -> nút hero
const pick = process.env.PICK === 'navbar'
  ? `[...document.querySelectorAll('.navbar .btn')][0]`
  : `[...document.querySelectorAll('.button--primary')].find(x => x.getBoundingClientRect().top > 200 && x.getBoundingClientRect().top < 600)`;
const evalRes = await send('Runtime.evaluate', {
  expression: `(() => { const b = ${pick}; const r = b.getBoundingClientRect(); return JSON.stringify({ x: r.x, y: r.y, w: r.width, h: r.height, label: b.textContent.trim() }); })()`,
  returnByValue: true,
});
const btn = JSON.parse(evalRes.result.result.value);

// chụp vùng nút + đệm 6px mỗi phía
const clip = { x: Math.max(0, btn.x - 6), y: Math.max(0, btn.y - 6), width: btn.w + 12, height: btn.h + 12, scale: SCALE };
const shot = await send('Page.captureScreenshot', { format: 'png', clip });
const png = Buffer.from(shot.result.data, 'base64');
writeFileSync(process.env.TEMP + '\\opencode\\shots\\button-ink.png', png);

// ---- decode PNG (RGBA) ----
function decodePNG(buf) {
  const b = buf; let pos = 8; let w = 0, h = 0, ch = 0; const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos); const t = b.toString('ascii', pos + 4, pos + 8);
    const d = b.subarray(pos + 8, pos + 8 + len);
    if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ch = d[9] === 6 ? 4 : 3; }
    else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)); const stride = w * ch;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? out[x - ch] : 0, c = y > 0 ? px[(y - 1) * stride + x] : 0;
      const bb = x >= ch && y > 0 ? px[(y - 1) * stride + x - ch] : 0;
      let v = row[x];
      if (f === 1) v = (v + a) & 255; else if (f === 2) v = (v + c) & 255;
      else if (f === 3) v = (v + ((a + c) >> 1)) & 255;
      else if (f === 4) { const p = a + c - bb, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - bb); v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? c : bb)) & 255; }
      out[x] = v;
    }
  }
  return { w, h, ch, px };
}
const img = decodePNG(png);
const realScale = Math.round(img.w / (btn.w + 12)); // scale thuc te = img px / CSS px
console.log('Nut:', JSON.stringify(btn));
console.log('Scale anh thuc te: ' + realScale + ' (img ' + img.w + 'x' + img.h + ' cho vung ' + (btn.w + 12) + 'x' + (btn.h + 12) + ' CSS)');

// nút đỏ #e74539, chữ trắng #fff. Mực = pixel trắng-ish BÊN TRONG vùng đỏ.
// ranh giới nút trong ảnh clip: đệm 6 CSS px * SCALE
const pad = 6 * SCALE;
const bx0 = pad, by0 = pad, bx1 = img.w - pad, by1 = img.h - pad;
let inkTop = -1, inkBottom = -1, inkLeft = -1, inkRight = -1;
for (let y = by0; y < by1; y++) {
  for (let x = bx0; x < bx1; x++) {
    const i = (y * img.w + x) * img.ch;
    const r = img.px[i], g = img.px[i + 1], b2 = img.px[i + 2];
    const isRed = r > 180 && g < 120 && b2 < 120;
    const isWhite = r > 220 && g > 220 && b2 > 220;
    if (isWhite && x > bx0 + 2 && x < bx1 - 2) { // tránh viền/sát mép
      if (inkTop < 0) inkTop = y;
      inkBottom = y;
      if (inkLeft < 0 || x < inkLeft) inkLeft = x;
      if (x > inkRight) inkRight = x;
    }
    if (!isRed && !isWhite) { /* pixel khác (antialias) bỏ qua */ }
  }
}
const btnHpx = by1 - by0;
const spaceTop = inkTop - by0, spaceBottom = by1 - 1 - inkBottom;
console.log('Nut (px anh, scale ' + SCALE + '): cao ' + btnHpx + 'px');
console.log('Muc chu : top ' + inkTop + ' -> bottom ' + inkBottom + ' (cao ' + (inkBottom - inkTop + 1) + 'px)');
console.log('Trong tren : ' + spaceTop + 'px anh = ' + (spaceTop / realScale).toFixed(1) + 'px CSS');
console.log('Trong duoi : ' + spaceBottom + 'px anh = ' + (spaceBottom / realScale).toFixed(1) + 'px CSS');
console.log('=> Lech tam doc that: ' + ((spaceTop - spaceBottom) / 2 / realScale).toFixed(1) + 'px CSS (duong = chu thap hon tam)');
ws.close(); chrome.kill(); process.exit(0);
