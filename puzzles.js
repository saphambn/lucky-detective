// Thám Tử Nhí — 300 deterministic puzzles built from the AI art catalog (browser + Node)
(function (root) {
  const VI = { red: 'đỏ', orange: 'cam', yellow: 'vàng', green: 'xanh lá', blue: 'xanh dương', purple: 'tím', pink: 'hồng' };
  const TOUGH = { red: ['orange', 'pink'], orange: ['red', 'yellow'], yellow: ['orange', 'green'], green: ['blue', 'yellow'], blue: ['purple', 'green'], purple: ['pink', 'blue'], pink: ['purple', 'red'] };
  const NOUN = { cap: 'mũ', backpack: 'ba lô', scarf: 'khăn quàng', glasses: 'kính', shoe: 'giày', balloon: 'bóng bay', flower: 'bông hoa', apple: 'quả táo', lollipop: 'kẹo mút' };
  const ACC = {
    cap: { name: 'chiếc mũ', look: 'đầu', wear: 'đội mũ', scenes: ['park', 'playground', 'beach'] },
    backpack: { name: 'chiếc ba lô', look: 'lưng', wear: 'đeo ba lô', scenes: ['classroom', 'park'] },
    scarf: { name: 'chiếc khăn quàng', look: 'cổ', wear: 'quàng khăn', scenes: ['snow', 'livingroom', 'classroom'] },
    glasses: { name: 'chiếc kính', look: 'mắt', wear: 'đeo kính', scenes: ['livingroom', 'bedroom', 'classroom'] },
  };
  const TAKEN = {
    balloon: { verb: 'lấy', name: 'quả bóng bay', scenes: ['park', 'playground'] },
    flower: { verb: 'hái', name: 'bông hoa', scenes: ['garden'] },
    apple: { verb: 'hái', name: 'quả táo', scenes: ['garden', 'autumn'] },
    lollipop: { verb: 'lấy', name: 'chiếc kẹo mút', scenes: ['kitchen', 'livingroom', 'bedroom'] },
  };
  // single-clue "mess" kinds
  const MESS = {
    mud: { scenes: ['livingroom', 'bedroom', 'classroom', 'hallway', 'park', 'playground', 'garden'], prop: { img: 'mudprints', x: 50, y: 80, w: 56 }, did: 'giẫm bùn', not: 'bị dính bùn', hint: 'Con nhìn giày của các bạn nhé!', ex: (n) => `Giày của bạn ${n} dính đầy bùn.` },
    wet: { scenes: ['hallway', 'livingroom'], prop: { img: 'wetumbrella', x: 72, y: 70, w: 14 }, did: 'đi mưa về mà không mặc áo mưa', not: 'bị ướt mưa', hint: 'Con nhìn xem bạn nào bị ướt nhé!', ex: (n) => `Bạn ${n} ướt sũng nước mưa.` },
    leaves: { scenes: ['autumn', 'park', 'garden'], prop: { img: 'leafpile', x: 50, y: 78, w: 34 }, did: 'nhảy vào đống lá khô', not: 'bị lá cây dính vào người', hint: 'Con nhìn xem bạn nào có lá dính trên người nhé!', ex: (n) => `Trên người bạn ${n} còn dính lá cây.` },
    flour: { scenes: ['kitchen'], prop: { img: 'flour', x: 50, y: 62, w: 24 }, did: 'làm đổ túi bột mì', not: 'bị dính bột mì', hint: 'Con nhìn xem bạn nào bị dính bột trắng nhé!', ex: (n) => `Mặt và tay bạn ${n} dính đầy bột mì.` },
    paint: { scenes: ['classroom', 'livingroom', 'bedroom'], did: 'làm đổ sơn', not: 'bị dính sơn', hint: 'Con nhìn tay của các bạn nhé!', ex: (n) => `Tay bạn ${n} dính sơn.` },
    smear: { scenes: ['kitchen', 'livingroom'], did: 'ăn vụng', not: 'bị dính bánh kẹo ở miệng', hint: 'Con nhìn miệng của các bạn nhé!', ex: (n) => `Miệng bạn ${n} còn dính đồ ăn.` },
  };
  const CRIMES = ['lấy trộm bánh quy', 'làm vỡ chiếc bình hoa', 'giấu đồ chơi của em bé', 'làm đổ cốc sữa', 'vẽ bậy lên tường', 'ăn hết kẹo trong hộp'];
  const LABEL = { lost: 'Đồ bị bỏ quên', shadow: 'Đoán bóng', ate: 'Ai ăn vụng', paint: 'Đổ sơn', mess: 'Dấu vết', owner: 'Đồ của ai', taken: 'Ai lấy đồ', odd: 'Ai khác biệt', lookalike: 'Giống ảnh',
    negative: 'Bạn nào KHÔNG', peek: 'Ai đang trốn', photoMissing: 'Ai vắng mặt', whatLost: 'Mất đồ gì', count: 'Đếm dấu vết', witness: 'Lời nhân chứng', twoClue: 'Hai manh mối' };
  // [unlock level, weight early, weight late(>180)]
  const SCHEDULE = { lost: [1, 1, 0.4], shadow: [1, 1, 0.5], ate: [1, 1, 0.3], paint: [1, 1, 0.3], mess: [1, 1.6, 0.5], owner: [1, 0.8, 0.5], taken: [1, 1, 0.5], odd: [1, 0.8, 0.5], lookalike: [1, 0.8, 0.8],
    negative: [31, 1.5, 1.2], peek: [31, 1.5, 1.5], photoMissing: [31, 1.2, 1.2], whatLost: [31, 1.5, 1.2], count: [31, 1.2, 1.2], witness: [91, 2.5, 3], twoClue: [91, 2.2, 3] };

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mk(rng) {
    const R = { r: rng, int: (n) => Math.floor(rng() * n), pick: (a) => { if (!a.length) throw new Fail(); return a[Math.floor(rng() * a.length)]; }, chance: (p) => rng() < p };
    R.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return R;
  }
  class Fail extends Error {}
  const need = (x) => { if (!x) throw new Fail(); return x; };

  function build(cat, count = 300) {
    const sname = (sp) => cat.species[sp];
    const bgs = Object.keys(cat.backgrounds), items = new Set(cat.items);
    const outfit = Object.fromEntries(cat.outfits.map((o) => [o.id, o]));
    const poses = [];
    for (const o of cat.outfits) poses.push({ id: o.id, img: `assets/char/${o.id}.webp`, kind: 'base', o, sp: o.sp });
    for (const v of cat.variants) if (outfit[v.outfit]) poses.push({ id: v.id, img: `assets/var/${v.id}.webp`, kind: v.kind, o: outfit[v.outfit], sp: outfit[v.outfit].sp, v });
    const P = (f) => poses.filter(f);
    const scene = (R, list) => { const ok = list.filter((s) => bgs.includes(s)); return need(ok.length ? R.pick(ok) : R.pick(bgs)); };
    const it = (id) => need(items.has(id) && id);
    // does pose p show mess kind k (optionally matching colour / food)?
    const shows = (p, k, x) => {
      const parts = p.kind === 'combo' ? p.v.parts : [p.kind];
      if (!parts.includes(k)) return false;
      if (x && k === 'paint') return p.v.color === x;
      if (x && k === 'smear') return p.v.food === x;
      return true;
    };
    const clean = (p) => ['base', 'acc', 'hold'].includes(p.kind);
    function distract(R, culprit, n, pool, used = new Set([culprit.sp])) {
      const out = [];
      for (const p of R.shuffle(pool)) { if (out.length === n - 1) break; if (used.has(p.sp)) continue; used.add(p.sp); out.push(p); }
      need(out.length === n - 1);
      return out;
    }
    const place = (R, culprit, others) => { const ans = R.int(others.length + 1); const c = others.slice(); c.splice(ans, 0, culprit); return { choices: c, answer: ans }; };
    const safe = (tier, kinds) => (p) => p.kind === 'base' || (tier >= 1 && kinds.includes(p.kind));
    const messProp = (k, p) => (k === 'paint' ? { img: `paint-${p.v.color}`, x: 58, y: 76, w: 26 } : k === 'smear' ? { img: cat.foods.find((f) => f.id === p.v.food).prop, x: 50, y: 70, w: 22 } : MESS[k].prop);
    const foodOf = (id) => cat.foods.find((f) => f.id === id);

    const GEN = {
      lost(R, n, tier) {
        if (R.chance(0.4)) {
          const cul = R.pick(P((p) => p.kind === 'oneshoe'));
          const others = distract(R, cul, n, P(safe(tier, ['acc', 'hold', 'smear', 'paint'])));
          const sc = scene(R, ['classroom', 'livingroom', 'bedroom', 'playground', 'hallway']);
          return { scene: sc, ...place(R, cul, others), props: [{ img: it(`shoe-${cul.o.shoes}`), x: R.pick([42, 50, 58]), y: 76, w: 15, rot: -6, sparkle: true }],
            question: `Bạn nào đã để quên một chiếc giày ở ${cat.backgrounds[sc]} vậy nhỉ?`, hint: 'Con nhìn kỹ chân của các bạn nhé!', explain: `Bạn ${sname(cul.sp)} chỉ còn một chiếc giày.`, key: 'shoe' };
        }
        const acc = R.pick(Object.keys(ACC)), A = ACC[acc];
        const wearers = P((p) => p.kind === 'acc' && p.v.acc === acc);
        const cul = R.pick(P((p) => p.kind === 'base' || (tier >= 2 && ['hold', 'smear'].includes(p.kind))));
        const others = distract(R, cul, n, wearers);
        const taken = new Set(others.map((p) => p.v.color));
        const C = need(R.pick(cat.colors.filter((c) => (tier >= 2 || !taken.has(c)) && items.has(`${acc}-${c}`))));
        const sc = scene(R, A.scenes);
        return { scene: sc, ...place(R, cul, others), props: [{ img: `${acc}-${C}`, x: R.pick([42, 50, 58]), y: 76, w: acc === 'scarf' ? 20 : 15, sparkle: true }],
          question: `Bạn nào đã để quên ${A.name} ở ${cat.backgrounds[sc]} vậy nhỉ?`, hint: `Con nhìn kỹ ${A.look} của các bạn nhé!`, explain: `Bạn ${sname(cul.sp)} không có ${NOUN[acc]}.`, key: acc + C };
      },
      shadow(R, n, tier) {
        const sig = (p) => (p.kind === 'base' ? 'plain' : p.kind === 'acc' && ['cap', 'backpack'].includes(p.v.acc) ? p.v.acc : p.kind === 'hold' ? 'hold-' + p.v.hold : null);
        let choices;
        if (tier >= 2) {
          const sp = R.pick(cat.outfits).sp, seen = new Set();
          choices = [];
          for (const p of R.shuffle(P((p) => p.sp === sp && sig(p)))) { if (seen.has(sig(p))) continue; seen.add(sig(p)); choices.push(p); if (choices.length === n) break; }
          need(choices.length === n);
        } else {
          const first = R.pick(P(safe(tier, ['acc', 'hold'])));
          choices = [first, ...distract(R, first, n, P(safe(tier, ['acc', 'hold'])))];
        }
        const ans = R.int(n), t = choices[ans];
        return { scene: scene(R, ['bedroom', 'livingroom', 'classroom']), choices, answer: ans, silhouette: t.img,
          question: 'Cái bóng này là của bạn nào?', hint: tier >= 2 ? 'Con nhìn xem bạn nào đội mũ, bạn nào cầm đồ nhé!' : 'Con nhìn hình dáng tai và đầu nhé!', explain: `Đó là cái bóng của bạn ${sname(t.sp)}.`, key: choices.map((c) => c.id).join() };
      },
      ate(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'smear')), F = foodOf(cul.v.food);
        let pool = P(safe(tier, ['acc', 'hold', 'mud']));
        if (tier >= 2) pool = pool.concat(P((p) => p.kind === 'smear' && p.v.food !== F.id));
        const others = distract(R, cul, n, pool);
        const sc = scene(R, ['kitchen', 'kitchen', 'livingroom', 'garden']);
        return { scene: sc, ...place(R, cul, others), props: [{ img: it(F.prop), x: 50, y: sc === 'kitchen' ? 62 : 74, w: 22, sparkle: true }],
          question: `Ai đã ăn vụng ${F.vi}?`, hint: 'Con nhìn miệng của các bạn nhé!', explain: `Miệng bạn ${sname(cul.sp)} còn dính ${F.vi}.`, key: F.id };
      },
      paint(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'paint')), C = cul.v.color;
        let pool = P(safe(tier, ['acc', 'hold', 'mud', 'smear']));
        if (tier >= 1) pool = pool.concat(P((p) => p.kind === 'paint' && p.v.color !== C && (tier >= 3 || !TOUGH[C].includes(p.v.color))));
        const others = distract(R, cul, n, pool);
        return { scene: scene(R, MESS.paint.scenes.concat('kitchen')), ...place(R, cul, others), props: [{ img: it(`paint-${C}`), x: R.pick([40, 55, 62]), y: 76, w: 26 }],
          question: `Ai đã làm đổ hộp sơn màu ${VI[C]}?`, hint: 'Con nhìn tay của các bạn nhé!', explain: `Tay bạn ${sname(cul.sp)} dính sơn màu ${VI[C]}.`, key: C };
      },
      // mud / wet / leaves / flour
      mess(R, n, tier) {
        const k = R.pick(['mud', 'mud', 'wet', 'leaves', 'flour']), M = MESS[k];
        const cul = R.pick(P((p) => p.kind === k));
        let pool = P(safe(tier, ['acc', 'hold', 'smear']));
        if (tier >= 2) pool = pool.concat(P((p) => ['wet', 'leaves', 'flour', 'mud', 'paint'].includes(p.kind) && p.kind !== k));
        const others = distract(R, cul, n, pool);
        const sc = scene(R, M.scenes), outdoor = ['park', 'playground', 'garden', 'autumn'].includes(sc);
        const q = k === 'mud' ? (outdoor ? 'Ai vừa giẫm vào vũng bùn?' : sc === 'classroom' ? 'Ai đã mang giày bẩn vào lớp?' : 'Ai đã mang giày bẩn vào nhà?') : `Ai vừa ${M.did}?`;
        return { scene: sc, ...place(R, cul, others), props: [{ ...M.prop, img: it(M.prop.img) }], question: q, hint: M.hint, explain: M.ex(sname(cul.sp)), key: k };
      },
      owner(R, n, tier) {
        const cul = R.pick(P((p) => p.o.pattern !== 'plain' && clean(p) && (tier >= 1 || p.kind === 'base')));
        const o = cul.o, um = it(`umbrella-${o.shirt}-${o.pattern}`);
        const differs = (p) => p.o.shirt !== o.shirt || p.o.pattern !== o.pattern;
        let pool = P((p) => differs(p) && safe(tier, ['acc', 'hold'])(p));
        if (tier >= 2) { const near = pool.filter((p) => p.o.shirt === o.shirt || p.o.pattern === o.pattern); if (near.length >= n) pool = near.concat(pool.slice(0, 6)); }
        const others = distract(R, cul, n, pool);
        return { scene: scene(R, ['livingroom', 'park', 'classroom', 'hallway']), ...place(R, cul, others), props: [{ img: um, x: 50, y: 72, w: 28, rot: -10, sparkle: true }],
          question: 'Chiếc ô này là của bạn nào?', hint: 'Con nhìn áo của các bạn nhé!', explain: `Chiếc ô giống hệt áo của bạn ${sname(cul.sp)}.`, key: um };
      },
      taken(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'hold')), K = cul.v.hold, C = cul.v.color, T = TAKEN[K];
        const avail = cat.holdColors[K].filter((c) => c !== C && items.has(`${K}-${c}`));
        const shown = R.shuffle(avail).slice(0, K === 'apple' ? 2 : R.pick([2, 3, 3, 4]));
        const row = R.shuffle([...shown, null]);
        let pool = P(safe(tier, ['acc', 'smear']));
        if (tier >= 1) pool = pool.concat(P((p) => p.kind === 'hold' && p.v.hold !== K));
        if (tier >= 2) pool = pool.concat(P((p) => p.kind === 'hold' && p.v.hold === K && p.v.color !== C));
        const others = distract(R, cul, n, pool);
        const span = 44, x0 = 50 - span / 2;
        const props = row.map((c, i) => ({ x: x0 + (row.length > 1 ? (span * i) / (row.length - 1) : span / 2), y: K === 'balloon' ? 44 : 64, w: K === 'balloon' ? 10 : 9, ...(c ? { img: `${K}-${c}` } : { missing: true }) }));
        return { scene: scene(R, T.scenes), ...place(R, cul, others), props,
          question: `Ai đã ${T.verb} ${T.name} màu ${VI[C]}?`, hint: 'Con nhìn xem các bạn đang cầm gì nhé!', explain: `Bạn ${sname(cul.sp)} đang cầm ${T.name} màu ${VI[C]}.`, key: K + C + row.join() };
      },
      odd(R, n, tier) {
        const C = R.pick(cat.colors);
        const same = P((p) => p.o.shirt === C && safe(tier, ['acc', 'hold'])(p));
        const Ds = tier >= 2 && R.chance(0.6) ? TOUGH[C] : cat.colors.filter((d) => d !== C && !TOUGH[C].includes(d));
        const cul = R.pick(need(P((p) => Ds.includes(p.o.shirt) && safe(tier, ['acc', 'hold'])(p))));
        const others = distract(R, cul, n, same);
        return { scene: scene(R, ['classroom', 'playground', 'park']), ...place(R, cul, others), props: [{ img: it(`tshirt-${C}`), x: 50, y: 42, w: 20, card: true }],
          question: `Cả lớp đều mặc áo màu ${VI[C]}. Bạn nào mặc áo khác màu?`, hint: 'Con nhìn màu áo của từng bạn nhé!', explain: `Bạn ${sname(cul.sp)} mặc áo màu ${VI[cul.o.shirt]}.`, key: C };
      },
      lookalike(R, n, tier) {
        let choices;
        if (tier === 0) { const f = R.pick(P((p) => p.kind === 'base')); choices = [f, ...distract(R, f, n, P((p) => p.kind === 'base'))]; }
        else if (tier === 1) { const sp = R.pick(cat.outfits).sp; choices = R.shuffle(P((p) => p.sp === sp && clean(p))).slice(0, n); }
        else { const o = R.pick(cat.outfits); choices = R.shuffle(P((p) => p.o.id === o.id)).slice(0, n); }
        need(choices.length === n);
        const ans = R.int(n);
        return { scene: scene(R, ['livingroom', 'bedroom', 'classroom']), choices, answer: ans, photo: choices[ans].img,
          question: 'Bạn nào giống hệt bạn trong bức ảnh?', hint: tier >= 2 ? 'Con nhìn kỹ từng chi tiết: tay, miệng, giày, đồ cầm nhé!' : 'Con so sánh quần áo nhé!', explain: `Bạn trong ảnh chính là bạn ${sname(choices[ans].sp)} này.`, key: '' };
      },

      // ---------- harder types ----------
      // everyone is messy except one
      negative(R, n, tier) {
        const k = R.pick(['mud', 'paint', 'smear', 'wet', 'leaves', 'flour']), M = MESS[k];
        const cul = R.pick(P((p) => (tier >= 2 ? !shows(p, k) && p.kind !== 'combo' : clean(p))));
        const others = distract(R, cul, n, P((p) => shows(p, k)));
        return { scene: scene(R, M.scenes), ...place(R, cul, others), props: [],
          question: `Bạn nào KHÔNG ${M.not}?`, hint: `Bạn nào cũng ${M.not}, chỉ có một bạn là không. Con tìm thử nhé!`, explain: `Chỉ có bạn ${sname(cul.sp)} là không ${M.not}.`, key: k };
      },
      // only feet (behind a curtain) or only the head (behind a bush) are visible
      peek(R, n, tier) {
        const mode = R.pick(['feet', 'head']);
        let cul, others;
        if (mode === 'feet') {
          cul = R.pick(P(clean));
          const look = (p) => p.o.shoes + p.o.bottomColor + p.o.bottom;
          const pool = P((p) => clean(p) && look(p) !== look(cul) && (tier >= 2 || p.o.shoes !== cul.o.shoes));
          others = distract(R, cul, n, pool);
        } else if (tier >= 2) {
          const sig = (p) => (p.kind === 'acc' && ['cap', 'glasses'].includes(p.v.acc) ? p.v.acc : p.kind === 'smear' ? 'smear' : p.kind === 'hold' && p.v.hold === 'balloon' ? 'balloon' : p.kind === 'base' ? 'plain' : null);
          const sp = R.pick(cat.outfits).sp, seen = new Set(), ch = [];
          for (const p of R.shuffle(P((p) => p.sp === sp && sig(p)))) { if (seen.has(sig(p))) continue; seen.add(sig(p)); ch.push(p); }
          need(ch.length >= n);
          cul = ch[0]; others = ch.slice(1, n);
        } else {
          cul = R.pick(P(clean)); others = distract(R, cul, n, P(clean));
        }
        const sc = scene(R, mode === 'feet' ? ['livingroom', 'bedroom', 'classroom'] : ['park', 'garden', 'playground', 'autumn']);
        return { scene: sc, ...place(R, cul, others), peek: { img: cul.img, mode },
          question: mode === 'feet' ? 'Có một bạn đang trốn sau rèm cửa. Đó là bạn nào?' : 'Có một bạn đang trốn sau bụi cây. Đó là bạn nào?',
          hint: mode === 'feet' ? 'Con nhìn màu giày và quần váy của bạn ấy nhé!' : 'Con nhìn tai, mặt và mũ của bạn ấy nhé!',
          explain: `Bạn ${sname(cul.sp)} đang trốn ở đó!`, key: mode };
      },
      // who is missing from the photo
      photoMissing(R, n, tier) {
        let all;
        if (tier >= 2) {
          // two friends of the same species in different outfits: one in the photo, one not
          const sp = R.pick(cat.outfits).sp;
          const pair = R.shuffle(P((p) => p.sp === sp && p.kind === 'base'));
          need(pair.length >= 2);
          all = [pair[0], pair[1], ...distract(R, pair[0], n - 1, P(clean), new Set([sp]))];
        } else { const f = R.pick(P(clean)); all = [f, ...distract(R, f, n, P(clean))]; }
        const ans = tier >= 2 ? 1 : R.int(n);
        const missing = all[ans], inPhoto = R.shuffle(all.filter((_, i) => i !== ans));
        const choices = R.shuffle(all);
        return { scene: scene(R, ['livingroom', 'bedroom', 'classroom']), choices, answer: choices.indexOf(missing), group: inPhoto.map((p) => p.img),
          question: 'Đây là ảnh chụp các bạn hôm qua. Bạn nào KHÔNG có trong ảnh?', hint: 'Con so sánh từng bạn với bức ảnh nhé!', explain: `Bạn ${sname(missing.sp)} không có trong ảnh.`, key: all.map((p) => p.id).sort().join() };
      },
      // before / after: what did they lose?  (choices are items)
      whatLost(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'acc' || p.kind === 'hold' || p.kind === 'oneshoe'));
        const base = P((p) => p.kind === 'base' && p.o.id === cul.o.id)[0];
        let before, after, ans;
        if (cul.kind === 'oneshoe') { before = base; after = cul; ans = `shoe-${cul.o.shoes}`; }
        else { before = cul; after = base; ans = cul.kind === 'acc' ? `${cul.v.acc}-${cul.v.color}` : `${cul.v.hold}-${cul.v.color}`; }
        it(ans);
        const [type, color] = ans.split('-');
        const pool = cat.items.filter((x) => /^(cap|backpack|scarf|glasses|shoe|balloon|flower|apple|lollipop)-/.test(x) && x !== ans);
        const near = pool.filter((x) => (tier >= 2 ? x.startsWith(type + '-') || x.endsWith('-' + color) : !x.endsWith('-' + color) && !x.startsWith(type + '-')));
        const others = R.shuffle(near.length >= n - 1 ? near : pool).slice(0, n - 1);
        need(others.length === n - 1);
        const ai = R.int(n), list = others.slice(); list.splice(ai, 0, ans);
        const nm = (x) => { const [t, c] = x.split('-'); return `${NOUN[t]} màu ${VI[c]}`; };
        const verb = cul.kind === 'hold' ? 'làm mất' : 'để quên';
        return { scene: scene(R, ['classroom', 'park', 'livingroom', 'playground']), choiceKind: 'item', choices: list.map((x) => ({ img: `assets/item/${x}.webp`, name: nm(x) })), answer: ai,
          beforeAfter: [before.img, after.img],
          question: `Buổi sáng bạn ${sname(cul.sp)} còn đủ đồ. Bây giờ bạn ấy đã ${verb} cái gì?`, hint: 'Con so sánh hai bức tranh: sáng nay và bây giờ nhé!', explain: `Bạn ${sname(cul.sp)} đã ${verb} ${nm(ans)}.`, key: cul.id };
      },
      // how many are messy?  (choices are numbers)
      count(R, n, tier) {
        const k = R.pick(['mud', 'paint', 'smear', 'wet', 'leaves', 'flour']), M = MESS[k];
        const m = tier >= 2 ? 5 : 4, dirty = 1 + R.int(m - (tier >= 2 ? 0 : 1));
        const used = new Set(), crowd = [];
        for (const p of R.shuffle(P((p) => shows(p, k)))) { if (crowd.length === dirty) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        for (const p of R.shuffle(P((p) => (tier >= 2 ? !shows(p, k) && p.kind !== 'combo' : clean(p))))) { if (crowd.length === m) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        need(crowd.length === m);
        const lo = Math.max(1, Math.min(dirty - R.int(n), m + 1 - n)), nums = Array.from({ length: n }, (_, i) => lo + i);
        return { scene: scene(R, M.scenes), crowd: R.shuffle(crowd).map((p) => p.img), choiceKind: 'number', choices: nums.map((x) => ({ num: x, name: String(x) })), answer: nums.indexOf(dirty),
          question: `Có bao nhiêu bạn ${M.not}?`, hint: 'Con chỉ tay đếm từng bạn một nhé!', explain: `Có ${dirty} bạn ${M.not}.`, key: k + crowd.map((p) => p.id).sort().join() };
      },
      // an eye-witness owl describes 2–3 features
      witness(R, n, tier) {
        const k = tier >= 3 ? 3 : 2;
        const attrsOf = (p) => {
          const a = [['shirt', p.o.shirt], ['shoes', p.o.shoes]];
          if (p.kind === 'acc') a.push(['acc', p.v.acc + '-' + p.v.color]);
          if (p.kind === 'hold') a.push(['hold', p.v.hold + '-' + p.v.color]);
          return a;
        };
        const cul = R.pick(P((p) => p.kind === 'acc' || p.kind === 'hold'));
        const all = attrsOf(cul), extra = all.find((a) => a[0] === 'acc' || a[0] === 'hold');
        const want = k === 3 ? all : [all[0], R.chance(0.5) ? extra : all[1]];
        const has = (p) => { const m = new Map(attrsOf(p)); return want.filter(([t, v]) => m.get(t) === v || (t === 'acc' && attrsOf(p).some((x) => x[0] === 'acc' && x[1] === v)) ).length; };
        const pool = P((p) => clean(p) && has(p) < want.length);
        const near = pool.filter((p) => has(p) === want.length - 1);
        const used = new Set([cul.sp]), others = [];
        for (const p of R.shuffle(near).concat(R.shuffle(pool))) { if (others.length === n - 1) break; if (used.has(p.sp)) continue; used.add(p.sp); others.push(p); }
        need(others.length === n - 1 && others.filter((p) => has(p) === want.length - 1).length >= Math.min(2, n - 1));
        const icon = ([t, v]) => (t === 'shirt' ? `tshirt-${v}` : t === 'shoes' ? `shoe-${v}` : v);
        const phrase = ([t, v]) => { if (t === 'shirt') return `mặc áo màu ${VI[v]}`; if (t === 'shoes') return `đi giày màu ${VI[v]}`; const [a, c] = v.split('-'); return t === 'acc' ? `${ACC[a].wear} màu ${VI[c]}` : `cầm ${NOUN[a]} màu ${VI[c]}`; };
        want.forEach((w) => it(icon(w)));
        const crime = R.pick(CRIMES), words = want.map(phrase);
        const said = words.length === 2 ? `${words[0]} và ${words[1]}` : `${words[0]}, ${words[1]} và ${words[2]}`;
        return { scene: scene(R, ['livingroom', 'classroom', 'kitchen', 'park', 'garden']), ...place(R, cul, others), witness: want.map((w) => `assets/item/${icon(w)}.webp`),
          question: `Bác Cú Mèo nhìn thấy bạn ${crime}: bạn ấy ${said}. Đó là ai?`, hint: 'Con tìm bạn có ĐỦ tất cả các đồ bác Cú Mèo kể nhé!', explain: `Chỉ có bạn ${sname(cul.sp)} ${said}.`, key: want.flat().join() };
      },
      // two clues at once: only the culprit shows both
      twoClue(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'combo'));
        const [a, b] = cul.v.parts, x = (k) => (k === 'paint' ? cul.v.color : k === 'smear' ? cul.v.food : undefined);
        const onlyA = P((p) => p.kind !== 'combo' && shows(p, a, x(a))), onlyB = P((p) => p.kind !== 'combo' && shows(p, b, x(b)));
        const used = new Set([cul.sp]);
        const dA = distract(R, cul, 2, onlyA, used), dB = distract(R, cul, 2, onlyB, used);
        const rest = n - 3 > 0 ? distract(R, cul, n - 2, tier >= 3 ? P((p) => p.kind !== 'combo' && !shows(p, a) && !shows(p, b) && !clean(p)) : P(clean), used) : [];
        const did = (k) => (k === 'paint' ? `làm đổ sơn màu ${VI[cul.v.color]}` : k === 'smear' ? `ăn vụng ${foodOf(cul.v.food).vi}` : 'giẫm bùn');
        const pa = messProp(a, cul), pb = messProp(b, cul);
        const props = [{ ...pa, img: it(pa.img), x: 30, y: 74 }, { ...pb, img: it(pb.img), x: 70, y: pb.img === 'mudprints' ? 82 : 74, w: pb.img === 'mudprints' ? 40 : pb.w }];
        return { scene: scene(R, ['livingroom', 'kitchen', 'classroom']), ...place(R, cul, [...dA, ...dB, ...rest]), props,
          question: `Ai vừa ${did(a)}, lại còn ${did(b)}?`, hint: 'Thủ phạm có CẢ HAI dấu vết đấy!', explain: `Bạn ${sname(cul.sp)} có cả hai dấu vết.`, key: cul.id };
      },
    };

    const TYPES = Object.keys(GEN);
    const out = [], seen = new Set(), R0 = mk(mulberry32(20261126));
    let prev = '';
    for (let i = 0; i < count; i++) {
      const lv = i + 1, tier = lv <= 30 ? 0 : lv <= 90 ? 1 : lv <= 180 ? 2 : 3, n = lv <= 30 ? 3 : lv <= 180 ? 4 : 5;
      const open = TYPES.filter((t) => lv >= SCHEDULE[t][0] && t !== prev);
      const w = open.map((t) => (lv > 180 ? SCHEDULE[t][2] : SCHEDULE[t][1]) * (lv - SCHEDULE[t][0] < 10 && SCHEDULE[t][0] > 1 ? 3 : 1));
      const order = [];
      { const ww = w.slice(), oo = open.slice(); while (oo.length) { let r = R0.r() * ww.reduce((s, x) => s + x, 0), j = 0; while (r > ww[j]) r -= ww[j++]; order.push(oo[j]); oo.splice(j, 1); ww.splice(j, 1); } }
      let p = null;
      for (let attempt = 0; attempt < 200 && !p; attempt++) {
        const type = order[Math.floor(attempt / 25) % order.length];
        try {
          const q = GEN[type](mk(mulberry32(lv * 7919 + attempt * 104729)), q_n(type, n), tier);
          const sig = [type, q.scene, q.key, q.choices.map((c) => c.id || c.img || c.num).sort().join(), q.answer].join('|');
          if (seen.has(sig)) continue;
          seen.add(sig);
          p = { id: lv, type, label: LABEL[type], tier, scene: q.scene, question: q.question, hint: q.hint, explain: q.explain, answer: q.answer, choiceKind: q.choiceKind || 'char',
            choices: q.choices.map((c) => (c.o ? { img: c.img, name: sname(c.sp) } : c)),
            props: (q.props || []).map((x) => (x.img ? { ...x, img: `assets/item/${x.img}.webp` } : x)),
            silhouette: q.silhouette, photo: q.photo, peek: q.peek, group: q.group, beforeAfter: q.beforeAfter, crowd: q.crowd, witness: q.witness };
          prev = type;
        } catch (e) { if (!(e instanceof Fail)) throw e; }
      }
      if (!p) throw new Error('could not build puzzle ' + lv);
      out.push(p);
    }
    return out;
  }
  // number of answer choices per type (count/whatLost stay at 4 so cards stay big)
  const q_n = (type, n) => (type === 'count' || type === 'whatLost' ? Math.min(n, 4) : n);

  const api = { build, LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzles = api;
})(typeof window !== 'undefined' ? window : globalThis);
