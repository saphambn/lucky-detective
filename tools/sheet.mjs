// node tools/sheet.mjs <out.png> <cols> <files...>  — contact sheet via headless Chrome
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [out, cols, ...files] = process.argv.slice(2);
const cell = 260, rows = Math.ceil(files.length / cols);
const html = `<html><body style="margin:0;background:#ddd;font:13px sans-serif;display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:4px">` +
  files.map((f) => `<div style="background:#fff;height:${cell}px;display:flex;flex-direction:column;align-items:center"><img src="file://${path.resolve(f)}" style="max-width:100%;height:${cell - 18}px;object-fit:contain"><span>${path.basename(f).replace(/\.\w+$/, '')}</span></div>`).join('') + '</body></html>';
const tmp = out.replace(/\.png$/, '.html'); fs.writeFileSync(tmp, html);
execFileSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--window-size=${cols * (cell + 4)},${rows * (cell + 4)}`, '--virtual-time-budget=5000', `--screenshot=${out}`, 'file://' + path.resolve(tmp)], { stdio: 'ignore' });
console.log(out);
