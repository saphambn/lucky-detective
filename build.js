// node build.js  -> puzzles.json, ideas.md, images/0001.svg ... 1000.svg
const fs = require('fs');
const P = require('./puzzles.js');
const list = P.build(1000);
fs.writeFileSync('puzzles.json', JSON.stringify(list.map(({ sig, ...p }) => p), null, 1));
fs.mkdirSync('images', { recursive: true });
let md = '# Thám Tử Nhí — 1000 câu đố\n\n';
const count = {};
for (const p of list) {
  count[p.label] = (count[p.label] || 0) + 1;
  fs.writeFileSync(`images/${String(p.id).padStart(4, '0')}.svg`, P.compositeSVG(p));
  md += `${p.id}. **[${p.label}]** ${p.question} — Đáp án: bạn ${require('./art.js').SPECIES[p.choices[p.answer].sp].name} (#${p.answer + 1}). _${p.explain}_\n`;
}
fs.writeFileSync('ideas.md', md);
const sigs = new Set(list.map(p => p.sig));
console.log('puzzles:', list.length, 'unique:', sigs.size, count);
