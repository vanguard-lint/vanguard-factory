/**
 * Debug :has(.docs-wrapper) + announcement bar trên 1 trang.
 * Cách dùng: node scripts/probe-announcement-debug.mjs <url>
 */
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9225;
const { spawn } = await import('node:child_process');
const url = process.argv[2];

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT,
  '--window-size=1440,3200', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '\\opencode\\chrome-profile-dbg-' + Date.now(),
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
await new Promise((r) => setTimeout(r, 6000));

const expr = `(() => {
  const bar = document.querySelector('.theme-announcement-bar');
  const hasSupport = CSS.supports('selector(body:has(.docs-wrapper))');
  let ruleFound = null;
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.selectorText && rule.selectorText.includes('docs-wrapper') && rule.selectorText.includes('theme-announcement-bar')) {
          ruleFound = rule.selectorText + ' { ' + rule.style.cssText + ' }';
        }
      }
    } catch {}
  }
  const dw = document.querySelector('.docs-wrapper');
  const dwCount = document.querySelectorAll('.docs-wrapper').length;
  return JSON.stringify({
    hasSupport,
    bodyMatches: document.body.matches(':has(.docs-wrapper)'),
    dwExists: !!dw,
    dwCount,
    dwInBody: dw ? document.body.contains(dw) : null,
    dwConnected: dw ? dw.isConnected : null,
    dwRootType: dw ? dw.getRootNode().constructor.name : null,
    dwRootIsDocument: dw ? dw.getRootNode() === document : null,
    barDisplay: bar ? getComputedStyle(bar).display : 'no-bar',
    ruleFound,
  }, null, 1);
})()`;
const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
console.log(res.result?.result?.value || JSON.stringify(res));
ws.close(); chrome.kill(); process.exit(0);
