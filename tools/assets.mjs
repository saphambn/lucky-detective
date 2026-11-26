// Generate + post-process all AI art.
//   node tools/assets.mjs gen [regex] [--concurrency=6] [--force]   generate missing raw images (ai/raw/...)
//   node tools/assets.mjs process                                     cut out / resize into assets/ + catalog.json
//   node tools/assets.mjs list [regex]                                show jobs
//   node tools/assets.mjs batch-submit [regex] | batch-check | batch-wait   same as gen, via the Batch API
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { OUTFITS, SPECIES, BACKGROUNDS, FOODS, HOLD_COLORS, COLORS, variantsOf, items, bgPrompt, PROMPTS } from './catalog.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const RAW = path.join(ROOT, 'ai/raw'), OUT = path.join(ROOT, 'assets');
const STYLE = "Style: soft watercolor and colored-pencil children's picture-book illustration for 3-year-olds, gentle warm brown outlines, pastel colors, soft paper texture, cute and friendly, clean and uncluttered. Absolutely no text, letters or numbers in the image.";
const FLASH = process.env.IMG_MODEL || 'gemini-3.1-flash-lite-image', PRO = process.env.BG_MODEL || 'gemini-3.1-flash-image';
const REF = path.join(ROOT, 'ai/char-bear.png');

function jobs() {
  const J = [];
  for (const k of Object.keys(BACKGROUNDS)) J.push({ type: 'bg', id: k, model: PRO, aspect: '16:9', prompt: bgPrompt(k) });
  for (const o of OUTFITS) J.push({ type: 'char', id: o.id, model: FLASH, aspect: '3:4', prompt: PROMPTS.base(o), input: REF });
  for (const it of items()) J.push({ type: 'item', id: it.id, model: FLASH, aspect: '1:1', prompt: it.prompt });
  OUTFITS.forEach((o, k) => {
    let h = 0;
    for (const v of variantsOf(o, k)) {
      const id = `${o.id}-${v.kind === 'hold' ? 'hold' + h++ : v.kind}`;
      const input = v.from ? path.join(RAW, 'var', `${o.id}-${v.from}.png`) : path.join(RAW, 'char', o.id + '.png');
      J.push({ type: 'var', id, model: FLASH, aspect: '3:4', prompt: PROMPTS.variant(v), input, meta: { outfit: o.id, ...v, prompt: undefined, from: undefined }, stage: v.from ? 2 : 1 });
    }
  });
  return J;
}
const rawPath = (j) => path.join(RAW, j.type, j.id + '.png');

async function gen(j) {
  const key = process.env.GEMINI_API_KEY;
  const parts = [];
  if (j.input) parts.push({ inlineData: { mimeType: 'image/png', data: fs.readFileSync(j.input).toString('base64') } });
  parts.push({ text: j.prompt + '\n' + STYLE });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${j.model}:generateContent`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: j.aspect } } }),
  });
  const r = await res.json();
  if (r.error) throw new Error(r.error.message);
  const p = r.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
  if (!p) throw new Error('no image: ' + (r.candidates?.[0]?.finishReason || JSON.stringify(r).slice(0, 200)));
  fs.mkdirSync(path.dirname(rawPath(j)), { recursive: true });
  await sharp(Buffer.from(p.inlineData.data, 'base64')).png().toFile(rawPath(j));
}

async function runGen(filter, conc, force) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  // seed old samples so they are not paid for twice
  for (const k of ['classroom', 'park']) { const s = path.join(ROOT, `ai/bg-${k}.png`), d = path.join(RAW, 'bg', k + '.png'); if (fs.existsSync(s) && !fs.existsSync(d)) { fs.mkdirSync(path.dirname(d), { recursive: true }); await sharp(s).png().toFile(d); } }
  const all = jobs().filter((j) => !filter || new RegExp(filter).test(`${j.type}/${j.id}`));
  // variants need their base first: order bases before variants
  const todo = all.filter((j) => force || !fs.existsSync(rawPath(j))).sort((a, b) => (a.stage || 0) - (b.stage || 0));
  console.log(`jobs ${all.length}, to generate ${todo.length}`);
  let done = 0, fail = 0, i = 0;
  async function worker() {
    while (i < todo.length) {
      const j = todo[i++];
      if (j.input) for (let w = 0; w < 60 && !fs.existsSync(j.input); w++) await new Promise((r) => setTimeout(r, 5000)); // base may still be generating
      if (j.input && !fs.existsSync(j.input)) { console.log('SKIP (no base yet)', j.type + '/' + j.id); fail++; continue; }
      for (let a = 1; a <= 3; a++) {
        try { await gen(j); done++; console.log(`ok ${done}/${todo.length} ${j.type}/${j.id}`); break; }
        catch (e) { console.log(`err ${j.type}/${j.id} try ${a}: ${e.message.slice(0, 160)}`); if (/credit|billing|quota|API key|spend(ing)? cap/i.test(e.message)) { i = todo.length; fail++; return; } if (a === 3) fail++; else await new Promise((r) => setTimeout(r, 4000 * a)); }
      }
    }
  }
  await Promise.all(Array.from({ length: conc }, worker));
  console.log(`DONE generated=${done} failed=${fail}`);
}

// flood-fill the light background from the borders into transparency
async function cutout(file) {
  const { data: d, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) border.push(y * W, y * W + W - 1);
  const med = (k) => border.map((i) => d[i * 4 + k]).sort((a, b) => a - b)[border.length >> 1];
  const bg = [med(0), med(1), med(2)];
  const dist = (i) => Math.max(Math.abs(d[i * 4] - bg[0]), Math.abs(d[i * 4 + 1] - bg[1]), Math.abs(d[i * 4 + 2] - bg[2]));
  const HARD = 20, SOFT = 46, seen = new Uint8Array(W * H), st = border.slice();
  while (st.length) {
    const i = st.pop(); if (seen[i]) continue;
    const dd = dist(i); if (dd > SOFT) continue;
    seen[i] = 1; d[i * 4 + 3] = dd <= HARD ? 0 : Math.round((255 * (dd - HARD)) / (SOFT - HARD));
    if (dd > HARD) continue;
    const x = i % W;
    if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (i >= W) st.push(i - W); if (i < W * (H - 1)) st.push(i + W);
  }
  return sharp(d, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer().then((b) => sharp(b).trim({ threshold: 1 }).toBuffer());
}

async function runProcess() {
  const all = jobs(), have = all.filter((j) => fs.existsSync(rawPath(j)));
  let n = 0;
  for (const j of have) {
    const out = path.join(OUT, j.type, j.id + '.webp');
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs > fs.statSync(rawPath(j)).mtimeMs) continue;
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (j.type === 'bg') await sharp(rawPath(j)).resize({ width: 1280 }).webp({ quality: 78 }).toFile(out);
    else await sharp(await cutout(rawPath(j))).resize({ height: j.type === 'item' ? 320 : 520, width: 520, fit: 'inside' }).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
    n++;
  }
  const ok = (j) => fs.existsSync(path.join(OUT, j.type, j.id + '.webp'));
  const cat = {
    species: Object.fromEntries(Object.entries(SPECIES).map(([k, v]) => [k, v.vi])),
    backgrounds: Object.fromEntries(Object.entries(BACKGROUNDS).filter(([k]) => ok({ type: 'bg', id: k })).map(([k, v]) => [k, v.vi])),
    outfits: OUTFITS.filter((o) => ok({ type: 'char', id: o.id })),
    variants: all.filter((j) => j.type === 'var' && ok(j)).map((j) => ({ id: j.id, ...j.meta })),
    items: all.filter((j) => j.type === 'item' && ok(j)).map((j) => j.id),
    foods: FOODS, holdColors: HOLD_COLORS, colors: COLORS,
  };
  fs.writeFileSync(path.join(OUT, 'catalog.json'), JSON.stringify(cat));
  fs.writeFileSync(path.join(OUT, 'catalog.js'), 'window.CATALOG = ' + JSON.stringify(cat) + ';\n');
  console.log(`processed ${n}; catalog: ${cat.outfits.length} outfits, ${cat.variants.length} variants, ${cat.items.length} items, ${Object.keys(cat.backgrounds).length} bgs`);
}

// ---------------- Batch API (≈50% cheaper, results within hours) ----------------
const API = 'https://generativelanguage.googleapis.com';
const STATE = path.join(ROOT, 'ai/batches.json');
const readState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : []);
const hdr = () => ({ 'x-goog-api-key': process.env.GEMINI_API_KEY });
async function api(url, opt = {}) {
  const r = await fetch(url.startsWith('http') ? url : API + url, { ...opt, headers: { ...hdr(), ...(opt.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 300)}`);
  return t;
}
async function requestFor(j) {
  const parts = [];
  if (j.input) parts.push({ inlineData: { mimeType: 'image/jpeg', data: (await sharp(j.input).resize({ width: 1024, height: 1024, fit: 'inside' }).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer()).toString('base64') } });
  parts.push({ text: j.prompt + '\n' + STYLE });
  return { contents: [{ parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: j.aspect } } };
}
async function batchSubmit(filter) {
  const pending = new Set(readState().filter((b) => !b.done).flatMap((b) => b.keys));
  const todo = jobs().filter((j) => (!filter || new RegExp(filter).test(`${j.type}/${j.id}`)) && !fs.existsSync(rawPath(j)) && !pending.has(`${j.type}/${j.id}`));
  const ready = todo.filter((j) => !j.input || fs.existsSync(j.input));
  console.log(`missing ${todo.length}, submittable now ${ready.length} (others wait for their input image)`);
  const byModel = {};
  for (const j of ready) (byModel[j.model] ||= []).push(j);
  const state = readState();
  for (const [model, list] of Object.entries(byModel)) {
    const lines = [];
    for (const j of list) lines.push(JSON.stringify({ key: `${j.type}/${j.id}`, request: await requestFor(j) }));
    const body = Buffer.from(lines.join('\n') + '\n');
    const start = await fetch(`${API}/upload/v1beta/files`, { method: 'POST', headers: { ...hdr(), 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(body.length), 'X-Goog-Upload-Header-Content-Type': 'application/jsonl', 'content-type': 'application/json' }, body: JSON.stringify({ file: { display_name: `detective-${Date.now()}` } }) });
    const up = start.headers.get('x-goog-upload-url');
    if (!up) throw new Error('upload start failed: ' + (await start.text()).slice(0, 300));
    const f = JSON.parse(await api(up, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'content-length': String(body.length) }, body }));
    const created = JSON.parse(await api(`/v1beta/models/${model}:batchGenerateContent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ batch: { display_name: `detective-${model}-${Date.now()}`, input_config: { file_name: f.file.name } } }) }));
    const name = created.name || created.metadata?.name;
    state.push({ name, model, keys: list.map((j) => `${j.type}/${j.id}`), created: new Date().toISOString(), done: false });
    console.log(`submitted ${name}: ${list.length} images with ${model} (${(body.length / 1e6).toFixed(1)} MB)`);
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
}
async function batchCheck() {
  const state = readState();
  for (const b of state.filter((b) => !b.done)) {
    const r = JSON.parse(await api(`/v1beta/${b.name}`));
    const st = r.metadata?.state || r.state || r.batch?.state;
    const file = r.response?.responsesFile || r.metadata?.output?.responsesFile || r.output?.responsesFile || r.dest?.fileName || r.response?.dest?.fileName;
    console.log(`${b.name}: ${st}${r.done ? ' (done)' : ''}`);
    if (!/SUCCEEDED|FAILED|CANCELLED|EXPIRED/.test(st || '') && !r.done) continue;
    if (!file) { console.log('no result file; raw keys:', Object.keys(r), JSON.stringify(r).slice(0, 400)); b.done = true; b.state = st; continue; }
    const text = await api(`/download/v1beta/${file}:download?alt=media`);
    let ok = 0, bad = [];
    for (const line of text.split('\n').filter(Boolean)) {
      const o = JSON.parse(line), [type, id] = o.key.split('/');
      const p = o.response?.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
      if (!p) { bad.push(o.key + ': ' + (o.error?.message || o.response?.candidates?.[0]?.finishReason || 'no image')); continue; }
      const out = path.join(RAW, type, id + '.png');
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(Buffer.from(p.inlineData.data, 'base64')).png().toFile(out); ok++;
    }
    b.done = true; b.state = st; b.saved = ok; b.failed = bad;
    console.log(`  saved ${ok}, failed ${bad.length}`); bad.slice(0, 10).forEach((x) => console.log('   ', x.slice(0, 160)));
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
  return state.filter((b) => !b.done).length;
}

// catalog of everything planned (for testing puzzle generation before images exist)
function planCatalog() {
  const all = jobs();
  return { species: Object.fromEntries(Object.entries(SPECIES).map(([k, v]) => [k, v.vi])), backgrounds: Object.fromEntries(Object.entries(BACKGROUNDS).map(([k, v]) => [k, v.vi])), outfits: OUTFITS,
    variants: all.filter((j) => j.type === 'var').map((j) => ({ id: j.id, ...j.meta })), items: all.filter((j) => j.type === 'item').map((j) => j.id), foods: FOODS, holdColors: HOLD_COLORS, colors: COLORS };
}
const [cmd, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const filter = rest.find((a) => !a.startsWith('--'));
if (cmd === 'gen') await runGen(filter, +(flags.concurrency || 6), 'force' in flags);
else if (cmd === 'process') await runProcess();
else if (cmd === 'batch-submit') await batchSubmit(filter);
else if (cmd === 'batch-check') await batchCheck();
else if (cmd === 'batch-wait') { while (await batchCheck()) await new Promise((r) => setTimeout(r, 5 * 60 * 1000)); console.log('ALL BATCHES FINISHED'); }
else if (cmd === 'plan') { fs.mkdirSync(path.join(ROOT, 'ai'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'ai/plan-catalog.json'), JSON.stringify(planCatalog())); console.log('ai/plan-catalog.json'); }
else { const J = jobs().filter((j) => !filter || new RegExp(filter).test(`${j.type}/${j.id}`)); const c = {}; J.forEach((j) => (c[j.type + ':' + j.model] = (c[j.type + ':' + j.model] || 0) + 1)); console.log(c, J.length); if (filter) J.slice(0, 5).forEach((j) => console.log(j.type, j.id, '|', j.prompt)); }
