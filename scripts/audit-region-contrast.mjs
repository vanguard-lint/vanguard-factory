/**
 * Audit contrast: quét mọi element trong vùng chọn, tính contrast màu chữ trên
 * nền đích thực (kể creditor nền tổ tiên kế thừa). Flag mọi cặp < 3:1.
 * Cách dùng: node scripts/audit-region-contrast.mjs <url> [selector] [theme=light|dark]
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9229;
const { spawn } = await import('node:child_process');

const url = process.argv[2] || 'http://127.0.0.1:3000/vanguard-factory/';
const regionSel = process.argv[3] || 'footer, header, .hero, section';
const theme = process.argv[4] || 'light';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--window-size=1440,3200',
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-audit-' + Date.now(),
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
await send('Page.navigate', { url: url + '?docusaurus-theme=' + theme });
await new Promise((r) => setTimeout(r, 7000));

const expr = `(() => {
  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => {
    const m = s.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(',').map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const effBg = (el) => {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const bg = parse(getComputedStyle(cur).backgroundColor);
      if (bg && bg.a > 0.9) return bg;
      const bgImg = getComputedStyle(cur).backgroundImage;
      if (bgImg && bgImg !== 'none') return { r: 128, g: 128, b: 128, a: 1, img: bgImg.slice(0, 40) };
      cur = cur.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const ratio = (c1, c2) => {
    const l1 = lum(c1.r, c1.g, c1.b), l2 = lum(c2.r, c2.g, c2.b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const out = [];
  const els = document.querySelectorAll(${JSON.stringify(regionSel + ' *')});
  const seen = new Set();
  for (const el of els) {
    // chỉ xét element chứa text trực tiếp
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const fg = parse(cs.color);
    const bg = effBg(el);
    const r = ratio(fg, bg);
    if (r < 3) {
      const key = cs.color + '|' + (bg.img || (bg.r + ',' + bg.g + ',' + bg.b)) + '|' + el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : '');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        el: el.tagName + (el.className ? '.' + String(el.className).split(' ').slice(0, 2).join('.') : ''),
        text: (el.textContent || '').trim().slice(0, 30),
        color: cs.color,
        bg: bg.img ? 'IMG ' + bg.img : 'rgb(' + bg.r + ',' + bg.g + ',' + bg.b + ')',
        ratio: +r.toFixed(2),
      });
    }
  }
  return JSON.stringify({ theme: document.documentElement.getAttribute('data-theme'), soLoi: out.length, loi: out.slice(0, 25) }, null, 1);
})()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result?.result?.value || JSON.stringify(res));
ws.close(); chrome.kill(); process.exit(0);
