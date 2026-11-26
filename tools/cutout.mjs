// node tools/cutout.mjs in.png out.png  — flood-fill the light paper background from the edges into transparency
import fs from 'node:fs';
import { PNG } from 'pngjs';
const [inp, out] = process.argv.slice(2);
const img = PNG.sync.read(fs.readFileSync(inp));
const { width: W, height: H, data: d } = img;
// background colour = median of the border pixels
const border = [];
for (let x = 0; x < W; x += 4) border.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y += 4) border.push(y * W, y * W + W - 1);
const med = (k) => border.map((i) => d[i * 4 + k]).sort((a, b) => a - b)[border.length >> 1];
const bg = [med(0), med(1), med(2)];
const dist = (i) => Math.max(Math.abs(d[i * 4] - bg[0]), Math.abs(d[i * 4 + 1] - bg[1]), Math.abs(d[i * 4 + 2] - bg[2]));
const HARD = 22, SOFT = 48;
const seen = new Uint8Array(W * H), stack = [];
for (const i of border) stack.push(i);
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (seen[i]) continue;
  const dd = dist(i);
  if (dd > SOFT) continue;
  seen[i] = 1;
  d[i * 4 + 3] = dd <= HARD ? 0 : Math.round(255 * (dd - HARD) / (SOFT - HARD));
  if (dd > HARD) continue; // soft edge pixel: keep but do not spread further
  const x = i % W, y = (i / W) | 0;
  if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W);
}
// crop to content
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
const pad = 8; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(W - 1, x1 + pad); y1 = Math.min(H - 1, y1 + pad);
const o = new PNG({ width: x1 - x0 + 1, height: y1 - y0 + 1 });
PNG.bitblt(img, o, x0, y0, o.width, o.height, 0, 0);
fs.writeFileSync(out, PNG.sync.write(o));
console.log(out, o.width + 'x' + o.height, 'bg', bg.join(','));
