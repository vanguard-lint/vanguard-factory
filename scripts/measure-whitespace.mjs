/**
 * Tool đo khoảng trắng + cột nội dung + nhịp dòng từ screenshot PNG.
 * Cách dùng: node scripts/measure-whitespace.mjs <file.png> [...]
 *
 * Đo thêm v2:
 *  - Cột nội dung chính: cạnh trái/phải phổ biến nhất của các dòng có chữ
 *    (bỏ qua navbar/footer full-width) -> độ rộng cột đọc thực tế
 *  - Nhịp dòng: khoảng hở trung bình giữa các "dải mực" liên tiếp (line gap)
 *  - Khoảng cách giữa các khối (paragraph/section gap)
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decodePNG(buf) {
  const b = Buffer.from(buf);
  let pos = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (pos < b.length) {
    const len = b.readUInt32BE(pos);
    const type = b.toString('ascii', pos + 4, pos + 8);
    const data = b.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error('PNG khong ho tro');
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null;
  if (!channels) throw new Error('colorType khong ho tro: ' + colorType);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[x - channels] : 0;
      const c = y > 0 ? px[(y - 1) * stride + x] : 0;
      const bb = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      let v = row[x];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + c) & 255;
      else if (f === 3) v = (v + ((a + c) >> 1)) & 255;
      else if (f === 4) {
        const p = a + c - bb, pa = Math.abs(p - a), pb = Math.abs(p - c), pc = Math.abs(p - bb);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? c : bb)) & 255;
      }
      out[x] = v;
    }
  }
  return { width, height, channels, px };
}

function analyze(file) {
  const { width, height, channels, px } = decodePNG(readFileSync(file));
  const at = (x, y) => { const i = (y * width + x) * channels; return [px[i], px[i + 1], px[i + 2]]; };

  // nen chu dao tu 2 bien
  const count = new Map();
  for (let y = 0; y < height; y += 4)
    for (const x of [Math.floor(width * 0.01), Math.floor(width * 0.99)]) {
      const [r, g, bl] = at(x, y);
      const k = (r >> 3) + ',' + (g >> 3) + ',' + (bl >> 3);
      count.set(k, (count.get(k) || 0) + 1);
    }
  const [bk] = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  const [br, bg2, bb2] = bk.split(',').map((v) => (v << 3) + 4);
  const isBg = (r, g, b) => Math.abs(r - br) <= 10 && Math.abs(g - bg2) <= 10 && Math.abs(b - bb2) <= 10;

  // moi dong: minX, maxX, inkCount — bo navbar (0-90) va footer (150px cuoi)
  const rowMin = new Array(height).fill(-1);
  const rowMax = new Array(height).fill(-1);
  const rowInk = new Array(height).fill(0);
  let ink = 0, total = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const [r, g, b] = at(x, y);
      total++;
      if (!isBg(r, g, b)) { ink++; rowInk[y]++; if (rowMin[y] < 0) rowMin[y] = x; rowMax[y] = x; }
    }
  }
  const yStart = 100, yEnd = height - 160;
  const leftB = new Map(), rightB = new Map();
  let contentRows = 0;
  for (let y = yStart; y < yEnd; y += 2) {
    if (rowInk[y] > 0) {
      contentRows++;
      const lk = Math.round(rowMin[y] / 10) * 10, rk = Math.round(rowMax[y] / 10) * 10;
      leftB.set(lk, (leftB.get(lk) || 0) + 1);
      rightB.set(rk, (rightB.get(rk) || 0) + 1);
    }
  }
  const modeOf = (m) => [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const colL = modeOf(leftB), colR = modeOf(rightB);
  // dong chua: cac dong co muc nam trong cot [colL-20, colR+20] va khong full-width
  const bands = [];
  let inBand = false, start = 0;
  for (let y = yStart; y < yEnd; y += 2) {
    const has = rowInk[y] > 0 && rowMin[y] >= colL - 30 && rowMax[y] <= colR + 30;
    if (has && !inBand) { inBand = true; start = y; }
    else if (!has && inBand) { inBand = false; bands.push([start, y - 2]); }
  }
  if (inBand) bands.push([start, yEnd - 2]);
  const gaps = [];
  for (let i = 1; i < bands.length; i++) gaps.push(bands[i][0] - bands[i - 1][1]);
  const lineGaps = gaps.filter((g) => g <= 30);   // giua cac dong chu trong 1 doan
  const blockGaps = gaps.filter((g) => g > 30);   // giua cac khoi (paragraph/heading)
  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

  const breathe = bands.length
    ? blockGaps.filter((g) => g >= 40).reduce((s, g) => s + g, 0)
    : 0;
  const span = yEnd - yStart;

  console.log('== ' + file.split(/[\\/]/).pop() + ' ==');
  console.log('  Nen chu dao     : rgb(' + br + ',' + bg2 + ',' + bb2 + ')' + (br < 60 ? '  [DARK MODE]' : '  [light]'));
  console.log('  Mat do muc toan trang: ' + ((ink / total) * 100).toFixed(1) + '%');
  console.log('  Cot doc chinh   : x ' + colL + ' -> ' + colR + '  (rong ' + (colR - colL) + 'px = ' + (((colR - colL) / width) * 100).toFixed(0) + '% man hinh)');
  console.log('  Le trai/phai cua cot: ' + colL + 'px / ' + (width - colR) + 'px');
  console.log('  So "dai mực" (band): ' + bands.length + ' | dong co noi dung: ' + contentRows);
  console.log('  Nhiet dong chu (line gap TB)  : ' + avg(lineGaps).toFixed(1) + 'px (n=' + lineGaps.length + ')');
  console.log('  Khoang giua khoi (block gap TB): ' + avg(blockGaps).toFixed(1) + 'px (n=' + blockGaps.length + ')');
  console.log('  Vung tho >=40px trong cot: ' + ((breathe / span) * 100).toFixed(1) + '% chieu cao khung nhin');
  console.log('');
}

for (const f of process.argv.slice(2)) {
  try { analyze(f); } catch (e) { console.log('== ' + f + ' == LOI: ' + e.message); }
}
