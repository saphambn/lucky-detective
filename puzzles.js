// Thám Tử Nhí — 1000 deterministic puzzles (browser + Node)
(function (root) {
  const Art = typeof module !== 'undefined' && module.exports ? require('./art.js') : root.Art;
  const { COLORS, COLOR_KEYS, SPECIES, SPECIES_KEYS, SCENES, item, sparkle, PROPS, takenProp } = Art;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const mk = (rng) => ({
    r: rng,
    int: (n) => Math.floor(rng() * n),
    pick: (a) => a[Math.floor(rng() * a.length)],
    chance: (p) => rng() < p,
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample: function (a, n) { return this.shuffle(a).slice(0, n); },
  });
  const cn = (c) => (COLORS[c] ? COLORS[c][0] : c);
  const nm = (sp) => SPECIES[sp].name;
  const TOUGH = { red: ['orange', 'pink'], orange: ['red', 'yellow'], yellow: ['orange', 'green'], green: ['blue', 'yellow'], blue: ['purple', 'green'], purple: ['pink', 'blue'], pink: ['purple', 'red'] };

  function base(R, sp) {
    return {
      sp,
      shirt: { color: R.pick(COLOR_KEYS), pattern: R.pick(['plain', 'plain', 'dots', 'stripes']) },
      bottom: { type: R.chance(0.35) ? 'skirt' : 'pants', color: R.pick(COLOR_KEYS) },
      shoes: { color: R.pick(COLOR_KEYS) },
    };
  }
  // random harmless extras (to make distractors richer at higher tiers)
  function decorate(R, c, avoid = []) {
    if (!avoid.includes('hat') && R.chance(0.25)) c.hat = { type: R.pick(['cap', 'beanie']), color: R.pick(COLOR_KEYS) };
    else if (!avoid.includes('bow') && R.chance(0.2)) c.bow = R.pick(COLOR_KEYS);
    if (!avoid.includes('glasses') && R.chance(0.15)) c.glasses = R.pick(COLOR_KEYS);
    if (!avoid.includes('backpack') && R.chance(0.2)) c.backpack = R.pick(COLOR_KEYS);
    if (!avoid.includes('scarf') && R.chance(0.12)) c.scarf = R.pick(COLOR_KEYS);
    return c;
  }
  const other = (R, c, pool = COLOR_KEYS) => R.pick(pool.filter((x) => x !== c));

  // ----------------------------------------------------------------- types
  const LOST = {
    shoe: { name: 'một chiếc giày', short: 'giày', scenes: ['classroom', 'livingroom', 'bedroom', 'playground'], look: 'chân' },
    cap: { name: 'chiếc mũ lưỡi trai', short: 'mũ', scenes: ['park', 'playground', 'beach'], look: 'đầu' },
    beanie: { name: 'chiếc mũ len', short: 'mũ len', scenes: ['snow', 'livingroom'], look: 'đầu' },
    backpack: { name: 'chiếc ba lô', short: 'ba lô', scenes: ['classroom', 'park'], look: 'lưng' },
    scarf: { name: 'chiếc khăn quàng', short: 'khăn quàng', scenes: ['snow', 'classroom', 'livingroom'], look: 'cổ' },
    glasses: { name: 'chiếc kính', short: 'kính', scenes: ['livingroom', 'bedroom', 'beach', 'classroom'], look: 'mắt' },
    bow: { name: 'chiếc nơ', short: 'nơ', scenes: ['bedroom', 'classroom', 'garden'], look: 'đầu' },
  };
  const FOODS = [
    { prop: 'cake', c: 'pink', name: 'bánh kem dâu' },
    { prop: 'cake', c: '#8d5a3b', name: 'bánh sô-cô-la' },
    { prop: 'cake', c: 'yellow', name: 'bánh kem xoài' },
    { prop: 'bowl', c: 'pink', name: 'kem dâu' },
    { prop: 'bowl', c: 'green', name: 'kem trà xanh' },
    { prop: 'bowl', c: '#8d5a3b', name: 'kem sô-cô-la' },
    { prop: 'jar', c: '#f5a623', name: 'mật ong' },
    { prop: 'jar', c: 'red', name: 'mứt dâu' },
    { prop: 'jar', c: 'purple', name: 'mứt việt quất' },
    { prop: 'melon', c: 'red', name: 'dưa hấu' },
  ];
  const OWN = {
    umbrella: { name: 'Chiếc ô', scenes: ['livingroom', 'park', 'classroom'] },
    kite: { name: 'Con diều', scenes: ['park', 'beach', 'playground'] },
    towel: { name: 'Chiếc khăn tắm', scenes: ['beach'] },
  };
  const TAKEN = {
    balloon: { verb: 'lấy', name: 'quả bóng bay', scenes: ['park', 'playground'], colors: COLOR_KEYS },
    flower: { verb: 'hái', name: 'bông hoa', scenes: ['garden'], colors: ['red', 'yellow', 'purple', 'pink', 'orange', 'blue'] },
    apple: { verb: 'hái', name: 'quả táo', scenes: ['garden', 'park'], colors: ['red', 'green', 'yellow'] },
    lollipop: { verb: 'lấy', name: 'chiếc kẹo mút', scenes: ['kitchen', 'livingroom', 'bedroom'], colors: COLOR_KEYS },
  };
  const ODD = {
    shirt: { q: (c) => `Cả lớp đều mặc áo màu ${cn(c)}. Bạn nào mặc áo khác màu?`, e: (n, d) => `Bạn ${n} mặc áo màu ${cn(d)}.`, look: 'áo', scenes: ['classroom', 'playground'] },
    hat: { q: (c) => `Các bạn đều đội mũ màu ${cn(c)}. Bạn nào đội mũ khác màu?`, e: (n, d) => `Bạn ${n} đội mũ màu ${cn(d)}.`, look: 'mũ', scenes: ['park', 'beach', 'playground'] },
    shoes: { q: (c) => `Các bạn đều đi giày màu ${cn(c)}. Bạn nào đi giày khác màu?`, e: (n, d) => `Bạn ${n} đi giày màu ${cn(d)}.`, look: 'giày', scenes: ['classroom', 'park', 'livingroom'] },
  };

  const GEN = {
    lost(R, n, tier) {
      const key = R.pick(Object.keys(LOST)), L = LOST[key], C = R.pick(COLOR_KEYS);
      const sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp), [key === 'cap' || key === 'beanie' ? 'hat' : key, 'bow', 'hat']) : base(R, sp);
        if (key === 'shoe') c.shoes = { color: i === ans ? C : tier >= 2 && R.chance(0.6) ? C : other(R, C) };
        if (i === ans) { if (key === 'shoe') c.shoes.missing = 'L'; return c; }
        const col = tier >= 2 && R.chance(0.5) ? C : other(R, C);
        if (key === 'cap' || key === 'beanie') c.hat = { type: key, color: col };
        else if (key !== 'shoe') c[key] = col;
        return c;
      });
      const scene = R.pick(L.scenes), spot = R.pick([[400, 375], [320, 385], [480, 370]]);
      return {
        scene, choices, answer: ans, clue: { item: key, color: C, spot },
        question: `Bạn nào đã để quên ${L.name} ở ${SCENES[scene].name} vậy nhỉ?`,
        hint: `Con nhìn kỹ ${L.look} của các bạn nhé!`,
        explain: key === 'shoe' ? `Bạn ${nm(sps[ans])} chỉ còn một chiếc giày.` : `Bạn ${nm(sps[ans])} không có ${L.short}.`,
        sig: `${key}|${C}`,
      };
    },
    shadow(R, n, tier) {
      const ans = R.int(n), scene = R.pick(['bedroom', 'livingroom', 'classroom']);
      let choices;
      if (tier >= 2) {
        const sp = R.pick(SPECIES_KEYS);
        const combos = R.sample([].concat(...['none', 'cap', 'beanie'].map((h) => ['none', 'balloon', 'lollipop', 'flower'].map((x) => [h, x]))), n);
        choices = combos.map(([h, x]) => {
          const c = base(R, sp);
          if (h !== 'none') c.hat = { type: h, color: R.pick(COLOR_KEYS) };
          if (x !== 'none') c.held = { type: x, color: R.pick(COLOR_KEYS) };
          return c;
        });
      } else {
        choices = R.sample(SPECIES_KEYS, n).map((sp) => (tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp)));
      }
      return {
        scene, choices, answer: ans, clue: {},
        question: 'Cái bóng này là của bạn nào?',
        hint: tier >= 2 ? 'Con nhìn xem bạn nào đội mũ, bạn nào cầm đồ nhé!' : 'Con nhìn hình dáng tai và đầu nhé!',
        explain: `Đó là cái bóng của bạn ${nm(choices[ans].sp)}.`,
        sig: choices.map((c) => c.sp + (c.hat ? c.hat.type : '') + (c.held ? c.held.type : '')).join(','),
      };
    },
    ate(R, n, tier) {
      const F = R.pick(FOODS), sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const decoys = FOODS.filter((f) => Art.hex(f.c) !== Art.hex(F.c) && !(TOUGH[F.c] || []).includes(f.c));
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp);
        if (i === ans) c.smear = F.c;
        else if (tier >= 2 && R.chance(0.45)) c.smear = R.pick(decoys).c;
        return c;
      });
      const scene = R.pick(['kitchen', 'kitchen', 'livingroom', 'garden']);
      return {
        scene, choices, answer: ans, clue: { food: F },
        question: `Ai đã ăn vụng ${F.name}?`,
        hint: 'Con nhìn miệng của các bạn nhé!',
        explain: `Miệng bạn ${nm(sps[ans])} còn dính ${F.name}.`,
        sig: F.name,
      };
    },
    paint(R, n, tier) {
      const C = R.pick(COLOR_KEYS), sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const pool = COLOR_KEYS.filter((x) => x !== C && (tier >= 3 || !TOUGH[C].includes(x)));
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp);
        if (i === ans) c.paint = C;
        else if (tier >= 1 && R.chance(0.5)) c.paint = R.pick(pool);
        return c;
      });
      return {
        scene: R.pick(['classroom', 'livingroom', 'bedroom', 'kitchen']), choices, answer: ans, clue: { color: C },
        question: `Ai đã làm đổ hộp sơn màu ${cn(C)}?`,
        hint: 'Con nhìn tay của các bạn nhé!',
        explain: `Tay bạn ${nm(sps[ans])} dính sơn màu ${cn(C)}.`,
        sig: C,
      };
    },
    mud(R, n, tier) {
      const sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const scene = R.pick(['livingroom', 'bedroom', 'classroom', 'kitchen', 'park', 'playground', 'garden']);
      const outdoor = ['park', 'playground', 'garden'].includes(scene);
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp);
        if (i === ans) c.shoes.muddy = true;
        else if (tier >= 2 && R.chance(0.35)) c.paint = R.pick(COLOR_KEYS);
        return c;
      });
      return {
        scene, choices, answer: ans, clue: { outdoor },
        question: outdoor ? 'Ai vừa giẫm vào vũng bùn?' : scene === 'classroom' ? 'Ai đã mang giày bẩn vào lớp?' : 'Ai đã mang giày bẩn vào nhà?',
        hint: 'Con nhìn giày của các bạn nhé!',
        explain: `Giày của bạn ${nm(sps[ans])} dính đầy bùn.`,
        sig: '',
      };
    },
    owner(R, n, tier) {
      const key = R.pick(Object.keys(OWN)), O = OWN[key];
      const C = R.pick(COLOR_KEYS), P = R.pick(['dots', 'stripes']);
      const sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const used = new Set([C + P]);
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp);
        if (i === ans) { c.shirt = { color: C, pattern: P }; return c; }
        let s;
        do {
          if (tier >= 2 && R.chance(0.5)) s = R.chance(0.5) ? { color: C, pattern: R.pick(['plain', P === 'dots' ? 'stripes' : 'dots']) } : { color: other(R, C), pattern: P };
          else s = { color: other(R, C), pattern: R.pick(['plain', 'dots', 'stripes']) };
        } while (used.has(s.color + s.pattern));
        used.add(s.color + s.pattern);
        c.shirt = s;
        return c;
      });
      return {
        scene: R.pick(O.scenes), choices, answer: ans, clue: { obj: key, color: C, pattern: P },
        question: `${O.name} này là của bạn nào?`,
        hint: 'Con nhìn áo của các bạn nhé!',
        explain: `${O.name} giống hệt áo của bạn ${nm(sps[ans])}.`,
        sig: key + C + P,
      };
    },
    taken(R, n, tier) {
      const key = R.pick(Object.keys(TAKEN)), T = TAKEN[key];
      const k = Math.min(T.colors.length, key === 'apple' ? 3 : R.pick([3, 4, 4, 5]));
      const colors = R.sample(T.colors, k), miss = R.int(k), C = colors[miss];
      const sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const remain = colors.filter((_, j) => j !== miss);
      const kinds = Object.keys(TAKEN).filter((x) => x !== key);
      const choices = sps.map((sp, i) => {
        const c = tier >= 1 ? decorate(R, base(R, sp)) : base(R, sp);
        if (i === ans) c.held = { type: key, color: C };
        else if (tier >= 2 && R.chance(0.6)) c.held = { type: key, color: R.pick(T.colors.filter((x) => x !== C)) };
        else if (tier >= 1 && R.chance(0.4)) c.held = { type: R.pick(kinds), color: R.pick(COLOR_KEYS) };
        return c;
      });
      return {
        scene: R.pick(T.scenes), choices, answer: ans, clue: { kind: key, colors, miss },
        question: `Ai đã ${T.verb} ${T.name} màu ${cn(C)}?`,
        hint: 'Con nhìn xem các bạn đang cầm gì nhé!',
        explain: `Bạn ${nm(sps[ans])} đang cầm ${T.name} màu ${cn(C)}.`,
        sig: key + colors.join('') + miss,
        _remain: remain,
      };
    },
    odd(R, n, tier) {
      const key = R.pick(Object.keys(ODD)), O = ODD[key], C = R.pick(COLOR_KEYS);
      const D = tier >= 2 && R.chance(0.6) ? R.pick(TOUGH[C]) : R.pick(COLOR_KEYS.filter((x) => x !== C && !TOUGH[C].includes(x)));
      const sps = R.sample(SPECIES_KEYS, n), ans = R.int(n);
      const choices = sps.map((sp, i) => {
        const c = base(R, sp);
        if (tier >= 1) decorate(R, c, ['hat']);
        const col = i === ans ? D : C;
        if (key === 'shirt') { c.shirt = { color: col, pattern: 'plain' }; if (c.bottom.color === C || c.bottom.color === D) c.bottom.color = R.pick(COLOR_KEYS.filter((x) => x !== C && x !== D)); }
        if (key === 'hat') c.hat = { type: 'cap', color: col };
        if (key === 'shoes') c.shoes = { color: col };
        return c;
      });
      return {
        scene: R.pick(O.scenes), choices, answer: ans, clue: { part: key, color: C },
        question: O.q(C),
        hint: `Con nhìn ${O.look} của từng bạn nhé!`,
        explain: O.e(nm(sps[ans]), D),
        sig: key + C + D,
      };
    },
    lookalike(R, n, tier) {
      const ans = R.int(n);
      let choices;
      if (tier === 0) choices = R.sample(SPECIES_KEYS, n).map((sp) => base(R, sp));
      else if (tier === 1) {
        const sp = R.pick(SPECIES_KEYS), cols = R.sample(COLOR_KEYS, n);
        choices = cols.map((col) => { const c = base(R, sp); c.shirt = { color: col, pattern: 'plain' }; return c; });
      } else {
        const sp = R.pick(SPECIES_KEYS), proto = base(R, sp);
        const feats = R.sample([
          (c) => (c.hat = { type: 'cap', color: 'red' }), (c) => (c.hat = { type: 'beanie', color: 'blue' }),
          (c) => (c.glasses = 'purple'), (c) => (c.scarf = 'green'), (c) => (c.bow = 'pink'),
          (c) => (c.held = { type: 'balloon', color: 'yellow' }), (c) => (c.backpack = 'orange'), () => {},
        ], n);
        choices = feats.map((f) => { const c = JSON.parse(JSON.stringify(proto)); f(c); return c; });
      }
      return {
        scene: R.pick(['livingroom', 'bedroom', 'classroom']), choices, answer: ans, clue: {},
        question: 'Bạn nào giống hệt bạn trong bức ảnh?',
        hint: tier >= 2 ? 'Con nhìn kỹ mũ, kính, khăn và đồ các bạn cầm nhé!' : 'Con so sánh màu áo nhé!',
        explain: `Bạn trong ảnh chính là bạn ${nm(choices[ans].sp)} này.`,
        sig: JSON.stringify(choices[ans]),
      };
    },
  };
  const TYPES = Object.keys(GEN);
  const TYPE_LABEL = { lost: 'Đồ bị bỏ quên', shadow: 'Đoán bóng', ate: 'Ai ăn vụng', paint: 'Đổ sơn', mud: 'Giày bẩn', owner: 'Đồ của ai', taken: 'Ai lấy đồ', odd: 'Ai khác biệt', lookalike: 'Giống ảnh' };

  function build(count = 1000) {
    const out = [], seen = new Set();
    const order = [];
    const R0 = mk(mulberry32(20261126));
    while (order.length < count) order.push(...R0.shuffle(TYPES));
    for (let i = 0; i < count; i++) {
      const tier = i < 200 ? 0 : i < 500 ? 1 : i < 800 ? 2 : 3;
      const n = i < 200 ? 3 : 4;
      const type = order[i];
      let p, attempt = 0;
      do {
        const R = mk(mulberry32(i * 7919 + 13 + attempt * 104729));
        p = GEN[type](R, n, tier);
        p.sig = [type, p.scene, p.choices[p.answer].sp, p.sig, p.choices.map((c) => c.sp).sort().join('')].join('|');
        attempt++;
      } while (seen.has(p.sig) && attempt < 50);
      seen.add(p.sig);
      delete p._remain;
      out.push({ id: i + 1, type, label: TYPE_LABEL[type], tier, ...p });
    }
    return out;
  }

  // ----------------------------------------------------------------- render scene
  function sceneExtras(p) {
    const k = p.clue;
    switch (p.type) {
      case 'lost': {
        const [x, y] = k.spot;
        const s = { shoe: 1.5, cap: 1.3, beanie: 1.3, backpack: 1.2, scarf: 1.5, glasses: 1.5, bow: 1.5 }[k.item];
        return `<ellipse cx="${x}" cy="${y + 30}" rx="60" ry="10" fill="#000" opacity=".12"/>` + item(k.item, k.color, x, y, s) + sparkle(x, y - 10);
      }
      case 'shadow': return Art.PROPS.spotlight(p.choices[p.answer], 400, 225);
      case 'ate': {
        const F = k.food;
        let s = '', x = 430, y = 258;
        if (p.scene !== 'kitchen') { s += PROPS.table(400, 340); x = 410; y = 328; }
        if (F.prop === 'cake') s += PROPS.cake(F.c, x, y);
        else if (F.prop === 'bowl') s += PROPS.bowl(F.c, x, y);
        else if (F.prop === 'jar') s += PROPS.jar(F.c, x, y);
        else s += PROPS.melon(x, y - 30);
        return s + sparkle(x - 10, y - 80);
      }
      case 'paint': return PROPS.paintSpill(k.color, 540, 380);
      case 'mud':
        return k.outdoor ? PROPS.mudTrail(500, 370) : [0, 1, 2, 3, 4].map((j) => `<g transform="translate(${620 - j * 90} ${360 + (j % 2) * 34}) rotate(-80)"><path d="M-22 -10 Q-24 -22 0 -22 Q24 -22 22 -6 L22 10 Q0 18 -22 10 Z" fill="#7a5230" opacity=".85"/><circle cx="-26" cy="0" r="4" fill="#7a5230"/></g>`).join('');
      case 'owner': {
        const s = { umbrella: 2, kite: 1.6, towel: 1.9 }[k.obj];
        const y = k.obj === 'kite' ? 280 : 360;
        return item(k.obj, k.color, 400, y, s, k.obj === 'umbrella' ? -12 : 0, k.pattern) + sparkle(400, y - 50 * s + 20);
      }
      case 'taken': return takenProp(k.kind, k.colors, k.miss);
      case 'odd': return PROPS.hanger(k.part, k.color, 400, 190);
      case 'lookalike': return PROPS.photo(p.choices[p.answer], 400, 200);
    }
    return '';
  }
  function sceneSVG(p, attrs) { return Art.sceneSVG(p.scene, sceneExtras(p), attrs); }

  // full composite image (scene + lineup + caption) for export
  function compositeSVG(p) {
    const n = p.choices.length, W = 800, cardW = 180, gap = (W - n * cardW) / (n + 1);
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} 820" width="${W}" height="820">${Art.defs()}<rect width="${W}" height="820" fill="#fffaf0"/>`;
    s += `<text x="400" y="42" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="${p.question.length > 52 ? 19 : p.question.length > 40 ? 22 : 26}" font-weight="800" fill="#5a4636">${p.id}. ${p.question}</text>`;
    s += `<g transform="translate(0 60)"><svg width="800" height="450" viewBox="0 0 800 450">${Art.SCENES[p.scene].draw()}${sceneExtras(p)}</svg></g>`;
    p.choices.forEach((c, i) => {
      const x = gap + i * (cardW + gap);
      s += `<rect x="${x}" y="530" width="${cardW}" height="270" rx="22" fill="#fff" stroke="#f0d9b5" stroke-width="4"/>`;
      s += `<svg x="${x + 10}" y="540" width="${cardW - 20}" height="220" viewBox="-30 -40 260 290">${Art.character(c)}</svg>`;
      s += `<text x="${x + cardW / 2}" y="788" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="20" font-weight="700" fill="#5a4636">${SPECIES[c.sp].name}</text>`;
    });
    return s + '</svg>';
  }

  const api = { build, sceneSVG, compositeSVG, TYPES, TYPE_LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzles = api;
})(typeof window !== 'undefined' ? window : globalThis);
