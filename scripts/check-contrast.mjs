/**
 * Tool đánh giá tương phản màu — WCAG 2.1 / 2.2
 * Cách dùng: node scripts/check-contrast.mjs
 *
 * Luật áp dụng:
 *  - WCAG 2.1 SC 1.4.3 (AA): text thường >= 4.5:1, text lớn (>=18pt hoặc 14pt bold) >= 3:1
 *  - WCAG 2.1 SC 1.4.11 (AA): UI components / graphical objects >= 3:1
 *  - WCAG 2.1 SC 1.4.6 (AAA): text thường >= 7:1, text lớn >= 4.5:1
 */

// ---- Độ sáng tương đối theo WCAG 2.1 ----
function luminance(hex) {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

function verdict(ratio, { large = false, ui = false } = {}) {
  if (ui) return ratio >= 3 ? 'PASS (AA 1.4.11, >=3:1)' : 'FAIL (AA 1.4.11, can 3:1)';
  const aa = large ? 3 : 4.5;
  const aaa = large ? 4.5 : 7;
  if (ratio >= aaa) return `PASS AAA (>=${aaa}:1) & AA`;
  if (ratio >= aa) return `PASS AA (>=${aa}:1) — thua AAA`;
  return `FAIL (can >=${aa}:1)`;
}

// ---- Cặp màu thực tế trong theme Vanguard ----
const BLACK = '#0a0a0b'; // nền dark mode
const PAPER = '#f6f5f4'; // nền light mode
const INK = '#16181d'; // text light mode
const ORANGE_LIGHT = '#e74539'; // accent light mode (đỏ cam)
const ORANGE_DARK = '#f2564a'; // accent dark mode (đỏ cam sáng hơn)
const WHITE = '#ffffff';
const TEXT_DARK = '#f5f5f5'; // text dark mode

const pairs = [
  { fg: ORANGE_DARK, bg: BLACK, desc: 'Cam #f2564a tren nen den #0a0a0b (dark mode accent / text)' },
  { fg: ORANGE_LIGHT, bg: BLACK, desc: 'Cam #e74539 tren nen den #0a0a0b (accent light dung trong dark)' },
  { fg: ORANGE_LIGHT, bg: PAPER, desc: 'Cam #e74539 tren nen giay #f6f5f4 (light mode accent / text)' },
  { fg: ORANGE_DARK, bg: PAPER, desc: 'Cam #f2564a tren nen giay #f6f5f4 (accent dark dung trong light)' },
  { fg: WHITE, bg: ORANGE_LIGHT, desc: 'Chu trang tren nut cam #e74539 (button primary)' },
  { fg: WHITE, bg: ORANGE_DARK, desc: 'Chu trang tren nut cam #f2564a (button primary dark)' },
  { fg: INK, bg: PAPER, desc: 'Chu #16181d tren nen giay #f6f5f4 (body text light)' },
  { fg: TEXT_DARK, bg: BLACK, desc: 'Chu #f5f5f5 tren nen den #0a0a0b (body text dark)' },
];

console.log('== BAO CAO TUONG PHAN WCAG 2.1 ==\n');
let fails = 0;
for (const p of pairs) {
  const r = contrast(p.fg, p.bg);
  const body = verdict(r);
  const large = verdict(r, { large: true });
  const ui = verdict(r, { ui: true });
  if (body.startsWith('FAIL')) fails++;
  console.log(`- ${p.desc}`);
  console.log(`    Ty le: ${r.toFixed(2)}:1`);
  console.log(`    Text thuong : ${body}`);
  console.log(`    Text lon    : ${large}`);
  console.log(`    UI/graphic  : ${ui}\n`);
}
console.log(fails === 0 ? '=> Tat ca PASS text thuong AA.' : `=> ${fails} cap FAIL o muc text thuong AA.`);
process.exit(0);
