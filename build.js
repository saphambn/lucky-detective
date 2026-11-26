// node build.js  -> puzzles.json + ideas.md from assets/catalog.json
const fs = require('fs');
const P = require('./puzzles.js');
const cat = JSON.parse(fs.readFileSync('assets/catalog.json', 'utf8'));
const list = P.build(cat, 300);
fs.writeFileSync('puzzles.json', JSON.stringify(list, null, 1));
const count = {};
let md = '# Thám Tử Nhí — 300 câu đố\n\n';
for (const p of list) {
  count[p.label] = (count[p.label] || 0) + 1;
  md += `${p.id}. **[${p.label}]** ${p.question} — Đáp án: bạn ${p.choices[p.answer].name} (#${p.answer + 1}). _${p.explain}_\n`;
}
fs.writeFileSync('ideas.md', md);
console.log('puzzles:', list.length, count);
