// English voice-over with Gemini TTS -> audio/en/<id>.m4a + audio/en/voice.js
//   node tools/voice.mjs sample <Voice> ["text"]   one clip into ai/voice-sample-<Voice>.m4a
//   node tools/voice.mjs batch-submit [Voice]      all missing lines via the Batch API
//   node tools/voice.mjs batch-wait                poll, save clips, write the manifest
//   node tools/voice.mjs manifest                  rewrite audio/en/voice.js from existing clips
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'audio/en'), TMP = path.join(ROOT, 'ai/voice'), STATE = path.join(ROOT, 'ai/voice-batches.json');
const MODEL = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const DEFAULT_VOICE = 'Sulafat';
const API = 'https://generativelanguage.googleapis.com';
const STYLE = process.env.TTS_STYLE ?? ''; // a style line gets read aloud by this model, so keep it empty
// must match UI.en in index.html
const FIXED = ['Great job!', "That's right!", 'Awesome!', 'Super detective!', 'Hooray!', 'Not quite. Try again!'];

const idOf = (text) => crypto.createHash('sha1').update(text).digest('hex').slice(0, 12);
function lines() {
  const P = require(path.join(ROOT, 'puzzles.js')), cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/catalog.json'), 'utf8'));
  const set = new Set(FIXED);
  for (const p of P.build(cat, 400, 'en')) { set.add(p.question); set.add(p.hint); set.add(p.explain); if (p.memory) set.add(p.memory.intro); }
  return [...set];
}
const hdr = () => ({ 'x-goog-api-key': process.env.GEMINI_API_KEY });
async function api(url, opt = {}) {
  const r = await fetch(url.startsWith('http') ? url : API + url, { ...opt, headers: { ...hdr(), ...(opt.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${t.slice(0, 300)}`);
  return t;
}
const request = (text, voice) => ({ contents: [{ parts: [{ text: STYLE ? `${STYLE}\n${text}` : text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });

// raw 16-bit PCM -> wav -> AAC m4a
function savePcm(b64, mime, out) {
  const raw = Buffer.from(b64, 'base64');
  if (raw.subarray(0, 4).toString() === 'RIFF') { // already a wav file
    fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });
    const wav = path.join(TMP, path.basename(out, '.m4a') + '.wav');
    fs.writeFileSync(wav, raw);
    execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '40000', wav, out]);
    return (raw.length - 44) / raw.readUInt32LE(28);
  }
  const pcm = raw, rate = +((mime || '').match(/rate=(\d+)/) || [0, 24000])[1];
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });
  const wav = path.join(TMP, path.basename(out, '.m4a') + '.wav');
  fs.writeFileSync(wav, Buffer.concat([h, pcm]));
  execFileSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '40000', wav, out]);
  return pcm.length / 2 / rate; // seconds
}
const audioPart = (resp) => resp?.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);

function manifest() {
  const map = {};
  for (const t of lines()) if (fs.existsSync(path.join(OUT, idOf(t) + '.m4a'))) map[t] = idOf(t);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'voice.js'), 'window.VOICE_EN = ' + JSON.stringify(map) + ';\n');
  console.log(`manifest: ${Object.keys(map).length}/${lines().length} lines have audio`);
}

const readState = () => (fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : []);
async function batchSubmit(voice) {
  const pending = new Set(readState().filter((b) => !b.done).flatMap((b) => b.keys));
  const todo = lines().filter((t) => !fs.existsSync(path.join(OUT, idOf(t) + '.m4a')) && !pending.has(idOf(t)));
  if (!todo.length) return console.log('nothing to do');
  const body = Buffer.from(todo.map((t) => JSON.stringify({ key: idOf(t), request: request(t, voice) })).join('\n') + '\n');
  const start = await fetch(`${API}/upload/v1beta/files`, { method: 'POST', headers: { ...hdr(), 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(body.length), 'X-Goog-Upload-Header-Content-Type': 'application/jsonl', 'content-type': 'application/json' }, body: JSON.stringify({ file: { display_name: `detective-voice-${Date.now()}` } }) });
  const up = start.headers.get('x-goog-upload-url');
  if (!up) throw new Error('upload start failed: ' + (await start.text()).slice(0, 300));
  const f = JSON.parse(await api(up, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'content-length': String(body.length) }, body }));
  const created = JSON.parse(await api(`/v1beta/models/${MODEL}:batchGenerateContent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ batch: { display_name: `detective-voice-${Date.now()}`, input_config: { file_name: f.file.name } } }) }));
  const state = readState();
  state.push({ name: created.name || created.metadata?.name, voice, keys: todo.map(idOf), created: new Date().toISOString(), done: false });
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
  console.log(`submitted ${state.at(-1).name}: ${todo.length} lines, voice ${voice}, model ${MODEL}`);
}
async function batchCheck() {
  const state = readState(), byId = Object.fromEntries(lines().map((t) => [idOf(t), t]));
  for (const b of state.filter((b) => !b.done)) {
    const r = JSON.parse(await api(`/v1beta/${b.name}`));
    const st = r.metadata?.state || r.state;
    console.log(`${b.name}: ${st}`);
    if (!/SUCCEEDED|FAILED|CANCELLED|EXPIRED/.test(st || '')) continue;
    const file = r.response?.responsesFile || r.metadata?.output?.responsesFile;
    b.done = true; b.state = st;
    if (!file) { console.log('  no result file'); continue; }
    const text = await api(`/download/v1beta/${file}:download?alt=media`);
    let ok = 0; const bad = [], odd = [];
    for (const line of text.split('\n').filter(Boolean)) {
      const o = JSON.parse(line), p = audioPart(o.response);
      if (!p) { bad.push(o.key + ': ' + (o.error?.message || o.response?.candidates?.[0]?.finishReason || 'no audio')); continue; }
      const secs = savePcm(p.inlineData.data, p.inlineData.mimeType, path.join(OUT, o.key + '.m4a')); ok++;
      // sanity: roughly 1.5–5 words per second; flag clips that are far off (e.g. the style line read aloud)
      const words = (byId[o.key] || '').split(/\s+/).length, wps = words / secs;
      if (wps < 0.8 || wps > 5) odd.push(`${o.key} ${secs.toFixed(1)}s for ${words} words: ${byId[o.key]}`);
    }
    b.saved = ok; b.failed = bad; b.odd = odd;
    console.log(`  saved ${ok}, failed ${bad.length}, suspicious length ${odd.length}`);
    [...bad, ...odd].slice(0, 15).forEach((x) => console.log('   ', x.slice(0, 160)));
  }
  fs.writeFileSync(STATE, JSON.stringify(state, null, 1));
  manifest();
  return state.filter((b) => !b.done).length;
}

// ask a Gemini text model what is actually said in a clip
async function transcribe(file) {
  const data = fs.readFileSync(file).toString('base64');
  const r = JSON.parse(await api(`/v1beta/models/${process.env.STT_MODEL || 'gemini-3.1-flash-lite'}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'audio/mp4', data } }, { text: 'Transcribe exactly every word spoken in this audio. Output only the transcript. Then on a new line, rate the English pronunciation clarity 1-10.' }] }] }) }));
  return r.candidates?.[0]?.content?.parts?.map((x) => x.text).join('') || JSON.stringify(r).slice(0, 200);
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'transcribe') { console.log(await transcribe(a1)); process.exit(0); }
if (cmd === 'sample') {
  const voice = a1 || DEFAULT_VOICE, text = a2 || 'Mr. Owl saw a friend spill the glass of milk. That friend was wearing a red shirt and yellow glasses. Who was it?';
  const r = JSON.parse(await api(`/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request(text, voice)) }));
  const p = audioPart(r); if (!p) throw new Error('no audio: ' + JSON.stringify(r).slice(0, 300));
  const out = path.join(ROOT, `ai/voice-sample-${voice}.m4a`);
  console.log(`${out} (${savePcm(p.inlineData.data, p.inlineData.mimeType, out).toFixed(1)}s, ${p.inlineData.mimeType})`);
} else if (cmd === 'batch-submit') await batchSubmit(a1 || DEFAULT_VOICE);
else if (cmd === 'batch-wait') { while (await batchCheck()) await new Promise((r) => setTimeout(r, 3 * 60 * 1000)); console.log('ALL VOICE BATCHES FINISHED'); }
else if (cmd === 'manifest') manifest();
else if (cmd === 'regen') { // regenerate the clips listed (one id per line) with direct calls
  const want = new Set(fs.readFileSync(a1, 'utf8').split('\n').filter(Boolean)), voice = a2 || DEFAULT_VOICE;
  const todo = lines().filter((t) => want.has(idOf(t)));
  for (let i = 0; i < todo.length; i += 5) await Promise.all(todo.slice(i, i + 5).map(async (t) => {
    for (let k = 0; k < 3; k++) {
      try {
        const r = JSON.parse(await api(`/v1beta/models/${MODEL}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request(t, voice)) }));
        const p = audioPart(r); if (!p) continue;
        savePcm(p.inlineData.data, p.inlineData.mimeType, path.join(OUT, idOf(t) + '.m4a')); return;
      } catch (e) { console.log('  retry', idOf(t), String(e).slice(0, 120)); await new Promise((r) => setTimeout(r, 5000)); }
    }
    console.log('FAILED', idOf(t), t);
  }));
  console.log(`regenerated ${todo.length}`);
}
else console.log('usage: sample [Voice] [text] | batch-submit [Voice] | batch-wait | manifest');
