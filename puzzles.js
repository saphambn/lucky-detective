// Thám Tử Nhí — 400 deterministic puzzles built from the AI art catalog (browser + Node)
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
  const EN_T = {
    sp: { bear: 'Bear', panda: 'Panda', bunny: 'Bunny', cat: 'Kitty', fox: 'Fox', sheep: 'Sheep', squirrel: 'Squirrel', dog: 'Puppy', pig: 'Piggy', mouse: 'Mouse', elephant: 'Elephant', frog: 'Frog', duck: 'Duck', penguin: 'Penguin', lion: 'Lion', monkey: 'Monkey', koala: 'Koala', tiger: 'Tiger' },
    bg: { classroom: 'the classroom', park: 'the park', kitchen: 'the kitchen', bedroom: 'the bedroom', livingroom: 'the living room', garden: 'the garden', playground: 'the playground', autumn: 'the autumn park', hallway: 'the front door', snow: 'the snowy yard' },
    acc: { cap: ['a cap', 'heads'], backpack: ['a backpack', 'backs'], scarf: ['a scarf', 'necks'], glasses: ['glasses', 'eyes'] },
    food: { strawberry: 'the strawberry cake', chocolate: 'the chocolate cake', honey: 'the honey', watermelon: 'the watermelon' },
    taken: { balloon: 'took', flower: 'picked', apple: 'picked', lollipop: 'took' },
    mess: {
      mud: { did: 'stepped in the mud', adj: 'muddy', hint: "Look at everyone's shoes!", ex: (n) => `${n}'s shoes are covered in mud.` },
      wet: { did: 'walked in the rain without a raincoat', adj: 'wet from the rain', hint: 'Look for the friend who is all wet!', ex: (n) => `${n} is soaking wet from the rain.` },
      leaves: { did: 'jumped into the pile of leaves', adj: 'covered in leaves', hint: 'Look for leaves stuck on someone!', ex: (n) => `${n} still has leaves stuck on them.` },
      flour: { did: 'spilled the bag of flour', adj: 'covered in flour', hint: 'Look for white flour on someone!', ex: (n) => `${n}'s face and hands are covered in flour.` },
      paint: { adj: 'covered in paint', hint: "Look at everyone's hands!" },
      smear: { adj: 'messy around the mouth', hint: "Look at everyone's mouth!" },
    },
    crimes: ['take the cookies', 'break the flower vase', "hide the baby's toy", 'spill the glass of milk', 'draw on the wall', 'eat all the candy in the box'],
  };
  const CRIMES = ['lấy trộm bánh quy', 'làm vỡ chiếc bình hoa', 'giấu đồ chơi của em bé', 'làm đổ cốc sữa', 'vẽ bậy lên tường', 'ăn hết kẹo trong hộp'];
  const LABEL = { lost: 'Đồ bị bỏ quên', shadow: 'Đoán bóng', ate: 'Ai ăn vụng', paint: 'Đổ sơn', mess: 'Dấu vết', owner: 'Đồ của ai', taken: 'Ai lấy đồ', odd: 'Ai khác biệt', lookalike: 'Giống ảnh',
    negative: 'Bạn nào KHÔNG', peek: 'Ai đang trốn', photoMissing: 'Ai vắng mặt', whatLost: 'Mất đồ gì', count: 'Đếm dấu vết', witness: 'Lời nhân chứng', twoClue: 'Hai manh mối',
    countItems: 'Đếm đồ vật', addSub: 'Thêm và bớt', pattern: 'Quy luật', countAttr: 'Đếm các bạn', position: 'Vị trí', memory: 'Trí nhớ', oddCat: 'Khác nhóm', fitUse: 'Đồ dùng' };
  // countable things: [vi name, vi classifier, en noun]
  const CL = { balloon: ['quả bóng bay', 'quả', 'balloon'], apple: ['quả táo', 'quả', 'apple'], lollipop: ['cái kẹo mút', 'cái', 'lollipop'], flower: ['bông hoa', 'bông', 'flower'] };
  // what to use where: answer kinds + clearly-wrong kinds
  const USES = [
    { sc: 'hallway', ans: ['umbrella'], wrong: ['glasses', 'lollipop', 'flower', 'balloon', 'apple'], vi: ['Trời đang mưa to. Ra ngoài thì con cần mang gì?', 'Trời mưa thì cần mang ô.'], en: ["It's raining hard. What do you need to go outside?", 'When it rains, you need an umbrella.'] },
    { sc: 'snow', ans: ['scarf'], wrong: ['glasses', 'apple', 'balloon', 'lollipop', 'flower', 'watermelon'], vi: ['Trời lạnh có tuyết. Con cần gì để giữ ấm cổ?', 'Khăn quàng giữ ấm cổ.'], en: ["It's cold and snowy. What keeps your neck warm?", 'A scarf keeps your neck warm.'] },
    { sc: 'classroom', ans: ['backpack'], wrong: ['cap', 'apple', 'balloon', 'lollipop', 'flower', 'shoe'], vi: ['Đi học, con đựng sách vở vào đâu?', 'Sách vở được đựng trong ba lô.'], en: ['What do you carry your books in at school?', 'Books go in a backpack.'] },
    { sc: 'playground', ans: ['cap'], wrong: ['scarf', 'shoe', 'apple', 'lollipop', 'backpack'], vi: ['Trời nắng to. Con đội gì để che nắng?', 'Đội mũ để che nắng.'], en: ["It's very sunny. What do you wear on your head?", 'A cap keeps the sun off your head.'] },
    { sc: 'hallway', ans: ['shoe'], wrong: ['cap', 'glasses', 'scarf', 'apple', 'balloon'], vi: ['Chuẩn bị ra ngoài chơi. Con đi gì vào chân?', 'Giày để đi vào chân.'], en: ['Time to go out and play. What goes on your feet?', 'Shoes go on your feet.'] },
    { sc: 'kitchen', ans: ['apple', 'watermelon', 'cake-strawberry', 'cake-chocolate'], wrong: ['shoe', 'cap', 'backpack', 'glasses', 'scarf', 'balloon'], hungry: true, vi: ['', 'Đồ ăn giúp bạn ấy no bụng.'], en: ['', 'Food fills a hungry tummy.'] },
    { sc: 'livingroom', ans: ['glasses'], wrong: ['scarf', 'cap', 'apple', 'lollipop', 'shoe'], owl: true, vi: ['Bác Cú Mèo đọc sách nhưng nhìn chữ không rõ. Bác cần đeo gì?', 'Đeo kính giúp nhìn rõ hơn.'], en: ["Mr. Owl can't read the words clearly. What does he need?", 'Glasses help you see clearly.'] },
    { sc: 'classroom', ans: ['paint'], wrong: ['shoe', 'apple', 'scarf', 'balloon', 'cap'], vi: ['Đến giờ vẽ tranh rồi! Con cần gì để tô màu?', 'Cần sơn màu để vẽ tranh.'], en: ["It's painting time! What do you need?", 'You need paint to paint a picture.'] },
  ];
  const SPECIAL = { 'cake-strawberry': ['bánh kem dâu', 'strawberry cake'], 'cake-chocolate': ['bánh sô-cô-la', 'chocolate cake'], honey: ['mật ong', 'honey'], watermelon: ['dưa hấu', 'watermelon'] };
  const KN = { tshirt: ['áo', 'T-shirt'], umbrella: ['chiếc ô', 'umbrella'], paint: ['hộp sơn', 'paint'] };
  // [unlock tier, weight early, weight in the last tier]
  const SCHEDULE = { lost: [0, 1, 0.4], shadow: [0, 1, 0.5], ate: [0, 1, 0.3], paint: [0, 1, 0.3], mess: [0, 1.6, 0.5], owner: [0, 0.8, 0.5], taken: [0, 1, 0.5], odd: [0, 0.8, 0.5], lookalike: [0, 0.8, 0.8],
    negative: [1, 1.5, 1.2], peek: [1, 1.5, 1.5], photoMissing: [1, 1.2, 1.2], whatLost: [1, 1.5, 1.2], count: [1, 1.2, 1.2], witness: [2, 2.5, 3], twoClue: [2, 2.2, 3],
    countItems: [0, 1.3, 0.6], pattern: [0, 1.2, 1.3], position: [0, 1.1, 1.1], oddCat: [0, 1, 0.5], fitUse: [0, 1, 0.5], addSub: [1, 1.5, 1.4], countAttr: [1, 1.1, 1], memory: [1, 1.3, 1.3] };

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mk(rng) {
    const R = { r: rng, int: (n) => Math.floor(rng() * n), pick: (a) => { if (!a.length) throw new Fail(); return a[Math.floor(rng() * a.length)]; }, chance: (p) => rng() < p };
    R.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return R;
  }
  class Fail extends Error {}
  const need = (x) => { if (!x) throw new Fail(); return x; };

  function build(cat, count = 400, lang = 'vi') {
    const EN = lang === 'en', t = (vi, en) => (EN ? en : vi);
    const sname = (sp) => (EN ? EN_T.sp[sp] : cat.species[sp]);
    const where = (sc) => (EN ? EN_T.bg[sc] : cat.backgrounds[sc]);
    const col = (c) => (EN ? c : VI[c]);
    const thing = (k, c) => (EN ? `${c} ${k === 'glasses' ? 'glasses' : k}` : `${NOUN[k]} màu ${VI[c]}`);
    const itemName = (x) => { if (SPECIAL[x]) return SPECIAL[x][EN ? 1 : 0]; const [k, c] = x.split('-'); if (KN[k]) return EN ? `${c} ${KN[k][1]}` : `${KN[k][0]} màu ${VI[c]}`; return thing(k, c); };
    const itemChoice = (x) => ({ img: `assets/item/${x}.webp`, name: itemName(x) });
    const an = (c) => (/^[aeiou]/.test(c) ? 'an ' : 'a ') + c;
    const numChoices = (R, ans, n, top) => { const lo = Math.max(1, Math.min(ans - R.int(n), Math.max(top, n) + 1 - n)), nums = Array.from({ length: n }, (_, i) => lo + i); return { choiceKind: 'number', choices: nums.map((x) => ({ num: x, name: String(x) })), answer: nums.indexOf(ans) }; };
    const colorsOf = (K) => cat.holdColors[K].filter((c) => items.has(`${K}-${c}`));
    const ME = (k) => (EN ? { ...MESS[k], ...EN_T.mess[k], not: EN_T.mess[k].adj } : MESS[k]);
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
            question: t(`Bạn nào đã để quên một chiếc giày ở ${where(sc)} vậy nhỉ?`, `Who left a shoe in ${where(sc)}?`), hint: t('Con nhìn kỹ chân của các bạn nhé!', "Look carefully at everyone's feet!"), explain: t(`Bạn ${sname(cul.sp)} chỉ còn một chiếc giày.`, `${sname(cul.sp)} has only one shoe.`), key: 'shoe' };
        }
        const acc = R.pick(Object.keys(ACC)), A = ACC[acc];
        const wearers = P((p) => p.kind === 'acc' && p.v.acc === acc);
        const cul = R.pick(P((p) => p.kind === 'base' || (tier >= 2 && ['hold', 'smear'].includes(p.kind))));
        const others = distract(R, cul, n, wearers);
        const taken = new Set(others.map((p) => p.v.color));
        const C = need(R.pick(cat.colors.filter((c) => (tier >= 2 || !taken.has(c)) && items.has(`${acc}-${c}`))));
        const sc = scene(R, A.scenes);
        return { scene: sc, ...place(R, cul, others), props: [{ img: `${acc}-${C}`, x: R.pick([42, 50, 58]), y: 76, w: acc === 'scarf' ? 20 : 15, sparkle: true }],
          question: t(`Bạn nào đã để quên ${A.name} ở ${where(sc)} vậy nhỉ?`, `Who left ${EN_T.acc[acc][0]} in ${where(sc)}?`), hint: t(`Con nhìn kỹ ${A.look} của các bạn nhé!`, `Look carefully at everyone's ${EN_T.acc[acc][1]}!`), explain: t(`Bạn ${sname(cul.sp)} không có ${NOUN[acc]}.`, `${sname(cul.sp)} has no ${acc === 'glasses' ? 'glasses' : acc}.`), key: acc + C };
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
        const ans = R.int(n), T = choices[ans];
        return { scene: scene(R, ['bedroom', 'livingroom', 'classroom']), choices, answer: ans, silhouette: T.img,
          question: t('Cái bóng này là của bạn nào?', 'Whose shadow is this?'), hint: tier >= 2 ? t('Con nhìn xem bạn nào đội mũ, bạn nào cầm đồ nhé!', 'Look for caps and things they are holding!') : t('Con nhìn hình dáng tai và đầu nhé!', 'Look at the shape of the ears and head!'), explain: t(`Đó là cái bóng của bạn ${sname(T.sp)}.`, `It is ${sname(T.sp)}'s shadow.`), key: choices.map((c) => c.id).join() };
      },
      ate(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'smear')), F = foodOf(cul.v.food);
        let pool = P(safe(tier, ['acc', 'hold', 'mud']));
        if (tier >= 2) pool = pool.concat(P((p) => p.kind === 'smear' && p.v.food !== F.id));
        const others = distract(R, cul, n, pool);
        const sc = scene(R, ['kitchen', 'kitchen', 'livingroom', 'garden']);
        return { scene: sc, ...place(R, cul, others), props: [{ img: it(F.prop), x: 50, y: sc === 'kitchen' ? 62 : 74, w: 22, sparkle: true }],
          question: t(`Ai đã ăn vụng ${F.vi}?`, `Who sneaked a bite of ${EN_T.food[F.id]}?`), hint: t('Con nhìn miệng của các bạn nhé!', "Look at everyone's mouth!"), explain: t(`Miệng bạn ${sname(cul.sp)} còn dính ${F.vi}.`, `${sname(cul.sp)}'s mouth is messy with ${EN_T.food[F.id].slice(4)}.`), key: F.id };
      },
      paint(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'paint')), C = cul.v.color;
        let pool = P(safe(tier, ['acc', 'hold', 'mud', 'smear']));
        if (tier >= 1) pool = pool.concat(P((p) => p.kind === 'paint' && p.v.color !== C && (tier >= 3 || !TOUGH[C].includes(p.v.color))));
        const others = distract(R, cul, n, pool);
        return { scene: scene(R, MESS.paint.scenes.concat('kitchen')), ...place(R, cul, others), props: [{ img: it(`paint-${C}`), x: R.pick([40, 55, 62]), y: 76, w: 26 }],
          question: t(`Ai đã làm đổ hộp sơn màu ${VI[C]}?`, `Who spilled the ${C} paint?`), hint: t('Con nhìn tay của các bạn nhé!', "Look at everyone's hands!"), explain: t(`Tay bạn ${sname(cul.sp)} dính sơn màu ${VI[C]}.`, `${sname(cul.sp)} has ${C} paint on their hands.`), key: C };
      },
      // mud / wet / leaves / flour
      mess(R, n, tier) {
        const k = R.pick(['mud', 'mud', 'wet', 'leaves', 'flour']), M = ME(k);
        const cul = R.pick(P((p) => p.kind === k));
        let pool = P(safe(tier, ['acc', 'hold', 'smear']));
        if (tier >= 2) pool = pool.concat(P((p) => ['wet', 'leaves', 'flour', 'mud', 'paint'].includes(p.kind) && p.kind !== k));
        const others = distract(R, cul, n, pool);
        const sc = scene(R, M.scenes), outdoor = ['park', 'playground', 'garden', 'autumn'].includes(sc);
        const q = k === 'mud' ? (outdoor ? t('Ai vừa giẫm vào vũng bùn?', 'Who stepped in the mud puddle?') : sc === 'classroom' ? t('Ai đã mang giày bẩn vào lớp?', 'Who brought muddy shoes into the classroom?') : t('Ai đã mang giày bẩn vào nhà?', 'Who brought muddy shoes into the house?')) : t(`Ai vừa ${M.did}?`, `Who just ${M.did}?`);
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
          question: t('Chiếc ô này là của bạn nào?', 'Whose umbrella is this?'), hint: t('Con nhìn áo của các bạn nhé!', "Look at everyone's shirt!"), explain: t(`Chiếc ô giống hệt áo của bạn ${sname(cul.sp)}.`, `The umbrella matches ${sname(cul.sp)}'s shirt.`), key: um };
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
          question: t(`Ai đã ${T.verb} ${T.name} màu ${VI[C]}?`, `Who ${EN_T.taken[K]} the ${C} ${K}?`), hint: t('Con nhìn xem các bạn đang cầm gì nhé!', 'Look at what everyone is holding!'), explain: t(`Bạn ${sname(cul.sp)} đang cầm ${T.name} màu ${VI[C]}.`, `${sname(cul.sp)} is holding the ${C} ${K}.`), key: K + C + row.join() };
      },
      odd(R, n, tier) {
        const C = R.pick(cat.colors);
        const same = P((p) => p.o.shirt === C && safe(tier, ['acc', 'hold'])(p));
        const Ds = tier >= 2 && R.chance(0.6) ? TOUGH[C] : cat.colors.filter((d) => d !== C && !TOUGH[C].includes(d));
        const cul = R.pick(need(P((p) => Ds.includes(p.o.shirt) && safe(tier, ['acc', 'hold'])(p))));
        const others = distract(R, cul, n, same);
        return { scene: scene(R, ['classroom', 'playground', 'park']), ...place(R, cul, others), props: [{ img: it(`tshirt-${C}`), x: 50, y: 42, w: 20, card: true }],
          question: t(`Cả lớp đều mặc áo màu ${VI[C]}. Bạn nào mặc áo khác màu?`, `Everyone is wearing ${/^[aeiou]/.test(C) ? 'an' : 'a'} ${C} shirt. Who is wearing a different color?`), hint: t('Con nhìn màu áo của từng bạn nhé!', 'Look at the color of each shirt!'), explain: t(`Bạn ${sname(cul.sp)} mặc áo màu ${VI[cul.o.shirt]}.`, `${sname(cul.sp)} is wearing ${/^[aeiou]/.test(cul.o.shirt) ? 'an' : 'a'} ${cul.o.shirt} shirt.`), key: C };
      },
      lookalike(R, n, tier) {
        let choices;
        if (tier === 0) { const f = R.pick(P((p) => p.kind === 'base')); choices = [f, ...distract(R, f, n, P((p) => p.kind === 'base'))]; }
        else if (tier === 1) { const sp = R.pick(cat.outfits).sp; choices = R.shuffle(P((p) => p.sp === sp && clean(p))).slice(0, n); }
        else { const o = R.pick(cat.outfits); choices = R.shuffle(P((p) => p.o.id === o.id)).slice(0, n); }
        need(choices.length === n);
        const ans = R.int(n);
        return { scene: scene(R, ['livingroom', 'bedroom', 'classroom']), choices, answer: ans, photo: choices[ans].img,
          question: t('Bạn nào giống hệt bạn trong bức ảnh?', 'Who looks exactly like the friend in the photo?'), hint: tier >= 2 ? t('Con nhìn kỹ từng chi tiết: tay, miệng, giày, đồ cầm nhé!', 'Check every detail: hands, mouth, shoes and what they hold!') : t('Con so sánh quần áo nhé!', 'Compare their clothes!'), explain: t(`Bạn trong ảnh chính là bạn ${sname(choices[ans].sp)} này.`, `The friend in the photo is ${sname(choices[ans].sp)}.`), key: '' };
      },

      // ---------- harder types ----------
      // everyone is messy except one
      negative(R, n, tier) {
        const k = R.pick(['mud', 'paint', 'smear', 'wet', 'leaves', 'flour']), M = ME(k);
        const cul = R.pick(P((p) => (tier >= 2 ? !shows(p, k) && p.kind !== 'combo' : clean(p))));
        const others = distract(R, cul, n, P((p) => shows(p, k)));
        return { scene: scene(R, M.scenes), ...place(R, cul, others), props: [],
          question: t(`Bạn nào KHÔNG ${M.not}?`, `Who is NOT ${M.not}?`), hint: t(`Bạn nào cũng ${M.not}, chỉ có một bạn là không. Con tìm thử nhé!`, `Everyone is ${M.not} except one friend. Can you find them?`), explain: t(`Chỉ có bạn ${sname(cul.sp)} là không ${M.not}.`, `Only ${sname(cul.sp)} is not ${M.not}.`), key: k };
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
          question: mode === 'feet' ? t('Có một bạn đang trốn sau rèm cửa. Đó là bạn nào?', 'Someone is hiding behind the curtain. Who is it?') : t('Có một bạn đang trốn sau bụi cây. Đó là bạn nào?', 'Someone is hiding behind the bush. Who is it?'),
          hint: mode === 'feet' ? t('Con nhìn màu giày và quần váy của bạn ấy nhé!', 'Look at the color of their shoes and shorts or skirt!') : t('Con nhìn tai, mặt và mũ của bạn ấy nhé!', 'Look at their ears, face and cap!'),
          explain: t(`Bạn ${sname(cul.sp)} đang trốn ở đó!`, `${sname(cul.sp)} was hiding there!`), key: mode };
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
          question: t('Đây là ảnh chụp các bạn hôm qua. Bạn nào KHÔNG có trong ảnh?', 'This is a photo of the friends yesterday. Who is NOT in the photo?'), hint: t('Con so sánh từng bạn với bức ảnh nhé!', 'Compare each friend with the photo!'), explain: t(`Bạn ${sname(missing.sp)} không có trong ảnh.`, `${sname(missing.sp)} is not in the photo.`), key: all.map((p) => p.id).sort().join() };
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
        const nm = (x) => { const [k, c] = x.split('-'); return thing(k, c); };
        const verb = cul.kind === 'hold' ? 'làm mất' : 'để quên';
        return { scene: scene(R, ['classroom', 'park', 'livingroom', 'playground']), choiceKind: 'item', choices: list.map((x) => ({ img: `assets/item/${x}.webp`, name: nm(x) })), answer: ai,
          beforeAfter: [before.img, after.img],
          question: t(`Buổi sáng bạn ${sname(cul.sp)} còn đủ đồ. Bây giờ bạn ấy đã ${verb} cái gì?`, `This morning ${sname(cul.sp)} had everything. What is missing now?`), hint: t('Con so sánh hai bức tranh: sáng nay và bây giờ nhé!', 'Compare the two pictures: this morning and now!'), explain: t(`Bạn ${sname(cul.sp)} đã ${verb} ${nm(ans)}.`, `${sname(cul.sp)} ${cul.kind === 'hold' ? 'lost' : 'left behind'} the ${nm(ans)}.`), key: cul.id };
      },
      // how many are messy?  (choices are numbers)
      count(R, n, tier) {
        const k = R.pick(['mud', 'paint', 'smear', 'wet', 'leaves', 'flour']), M = ME(k);
        const m = tier >= 2 ? 5 : 4, dirty = 1 + R.int(m - (tier >= 2 ? 0 : 1));
        const used = new Set(), crowd = [];
        for (const p of R.shuffle(P((p) => shows(p, k)))) { if (crowd.length === dirty) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        for (const p of R.shuffle(P((p) => (tier >= 2 ? !shows(p, k) && p.kind !== 'combo' : clean(p))))) { if (crowd.length === m) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        need(crowd.length === m);
        const lo = Math.max(1, Math.min(dirty - R.int(n), m + 1 - n)), nums = Array.from({ length: n }, (_, i) => lo + i);
        return { scene: scene(R, M.scenes), crowd: R.shuffle(crowd).map((p) => p.img), choiceKind: 'number', choices: nums.map((x) => ({ num: x, name: String(x) })), answer: nums.indexOf(dirty),
          question: t(`Có bao nhiêu bạn ${M.not}?`, `How many friends are ${M.not}?`), hint: t('Con chỉ tay đếm từng bạn một nhé!', 'Point and count each friend one by one!'), explain: t(`Có ${dirty} bạn ${M.not}.`, dirty === 1 ? `Only 1 friend is ${M.not}.` : `${dirty} friends are ${M.not}.`), key: k + crowd.map((p) => p.id).sort().join() };
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
        const phrase = ([k, v]) => {
          const an = (c) => (/^[aeiou]/.test(c) ? 'an ' : 'a ') + c;
          if (EN) { if (k === 'shirt') return `wearing ${an(v)} shirt`; if (k === 'shoes') return `wearing ${v} shoes`; const [a, c] = v.split('-'); return k === 'acc' ? (a === 'glasses' ? `wearing ${c} glasses` : `wearing ${an(c)} ${a}`) : `holding ${an(c)} ${a}`; }
          if (k === 'shirt') return `mặc áo màu ${VI[v]}`; if (k === 'shoes') return `đi giày màu ${VI[v]}`; const [a, c] = v.split('-'); return k === 'acc' ? `${ACC[a].wear} màu ${VI[c]}` : `cầm ${NOUN[a]} màu ${VI[c]}`; };
        want.forEach((w) => it(icon(w)));
        const crime = R.pick(EN ? EN_T.crimes : CRIMES), words = want.map(phrase).map((w, i, A) => (EN && i && A[i - 1].startsWith('wearing ') && w.startsWith('wearing ') ? w.slice(8) : w));
        const AND = t(' và ', ' and '), said = words.length === 2 ? words[0] + AND + words[1] : `${words[0]}, ${words[1]}${AND}${words[2]}`;
        return { scene: scene(R, ['livingroom', 'classroom', 'kitchen', 'park', 'garden']), ...place(R, cul, others), witness: want.map((w) => `assets/item/${icon(w)}.webp`),
          question: t(`Bác Cú Mèo nhìn thấy bạn ${crime}: bạn ấy ${said}. Đó là ai?`, `Mr. Owl saw a friend ${crime}. That friend was ${said}. Who was it?`), hint: t('Con tìm bạn có ĐỦ tất cả các đồ bác Cú Mèo kể nhé!', 'Find the friend who has ALL the things Mr. Owl saw!'), explain: t(`Chỉ có bạn ${sname(cul.sp)} ${said}.`, `Only ${sname(cul.sp)} is ${said}.`), key: want.flat().join() };
      },
      // two clues at once: only the culprit shows both
      twoClue(R, n, tier) {
        const cul = R.pick(P((p) => p.kind === 'combo'));
        const [a, b] = cul.v.parts, x = (k) => (k === 'paint' ? cul.v.color : k === 'smear' ? cul.v.food : undefined);
        const onlyA = P((p) => p.kind !== 'combo' && shows(p, a, x(a))), onlyB = P((p) => p.kind !== 'combo' && shows(p, b, x(b)));
        const used = new Set([cul.sp]);
        const dA = distract(R, cul, 2, onlyA, used), dB = distract(R, cul, 2, onlyB, used);
        const rest = n - 3 > 0 ? distract(R, cul, n - 2, tier >= 3 ? P((p) => p.kind !== 'combo' && !shows(p, a) && !shows(p, b) && !clean(p)) : P(clean), used) : [];
        const did = (k) => (EN ? (k === 'paint' ? `spilled the ${cul.v.color} paint` : k === 'smear' ? `sneaked a bite of ${EN_T.food[cul.v.food]}` : 'stepped in the mud') : k === 'paint' ? `làm đổ sơn màu ${VI[cul.v.color]}` : k === 'smear' ? `ăn vụng ${foodOf(cul.v.food).vi}` : 'giẫm bùn');
        const pa = messProp(a, cul), pb = messProp(b, cul);
        const props = [{ ...pa, img: it(pa.img), x: 30, y: 74 }, { ...pb, img: it(pb.img), x: 70, y: pb.img === 'mudprints' ? 82 : 74, w: pb.img === 'mudprints' ? 40 : pb.w }];
        return { scene: scene(R, ['livingroom', 'kitchen', 'classroom']), ...place(R, cul, [...dA, ...dB, ...rest]), props,
          question: t(`Ai vừa ${did(a)}, lại còn ${did(b)}?`, `Who ${did(a)} and also ${did(b)}?`), hint: t('Thủ phạm có CẢ HAI dấu vết đấy!', 'The culprit has BOTH clues!'), explain: t(`Bạn ${sname(cul.sp)} có cả hai dấu vết.`, `${sname(cul.sp)} has both clues.`), key: cul.id };
      },
      // ---------- early maths & thinking ----------
      countItems(R, n, tier) {
        const K = R.pick(Object.keys(CL)), max = [3, 5, 6, 7][tier], N = 1 + R.int(max), cols = colorsOf(K);
        const list = Array.from({ length: N }, () => `${K}-${R.pick(cols)}`);
        if (tier >= 2) { const K2 = R.pick(Object.keys(CL).filter((k) => k !== K)), c2 = colorsOf(K2); for (let i = 1 + R.int(3); i > 0; i--) list.push(`${K2}-${R.pick(c2)}`); }
        const slots = R.shuffle(Array.from({ length: 10 }, (_, i) => [20 + (i % 5) * 15 + R.int(5) - 2, (i < 5 ? 36 : 70) + R.int(5) - 2]));
        const order = R.shuffle(list);
        const props = order.map((img, i) => ({ img, x: slots[i][0], y: slots[i][1], w: img.startsWith('balloon') ? 10 : 12, rot: R.int(17) - 8 }));
        const [vi, , en] = CL[K];
        return { scene: scene(R, ['livingroom', 'bedroom', 'park', 'garden', 'kitchen', 'playground']), props, ...numChoices(R, N, n, max),
          question: t(`Có mấy ${vi}?`, `How many ${en}s are there?`), hint: t(`Con chỉ tay đếm từng ${vi} một nhé!`, `Point and count the ${en}s one by one!`),
          explain: t(`Có ${N} ${vi}.`, N === 1 ? `There is 1 ${en}.` : `There are ${N} ${en}s.`), key: order.join() + slots.slice(0, 3).join() };
      },
      addSub(R, n, tier) {
        const K = R.pick(Object.keys(CL)), [vi, cl, en] = CL[K], img = `assets/item/${K}-${R.pick(colorsOf(K))}.webp`;
        const top = tier >= 3 ? 6 : tier >= 2 ? 5 : 4, sub = tier >= 2 && R.chance(0.5);
        let a, b, ans;
        if (sub) { a = 2 + R.int(top - 1); b = 1 + R.int(a - 1); ans = a - b; } else { ans = 2 + R.int(top - 1); a = 1 + R.int(ans - 1); b = ans - a; }
        const A = R.pick(P((p) => p.kind === 'base')), B = R.pick(P((p) => p.kind === 'base' && p.sp !== A.sp)), nA = sname(A.sp), nB = sname(B.sp);
        const pl = (x) => (x === 1 ? en : en + 's');
        const tiles = [{ img: A.img, char: true }];
        if (sub) for (let i = 0; i < a; i++) tiles.push({ img, gone: i >= a - b });
        else { for (let i = 0; i < a; i++) tiles.push({ img }); tiles.push({ op: '+' }); for (let i = 0; i < b; i++) tiles.push({ img }); }
        tiles.push({ op: '=' }, { op: '?' });
        let question;
        if (!sub) question = t(`Bạn ${nA} có ${a} ${vi}. Bạn ${nB} cho thêm ${b} ${cl}. Bây giờ bạn ${nA} có mấy ${vi}?`, `${nA} has ${a} ${pl(a)}. ${nB} gives ${nA} ${b} more. How many ${en}s does ${nA} have now?`);
        else {
          const gone = K === 'balloon' ? t(`${b} quả bay mất`, `${b} float${b === 1 ? 's' : ''} away`) : K === 'flower' ? t(`bạn ấy tặng mẹ ${b} bông`, `${nA} gives ${b} to Mom`) : t(`bạn ấy ăn mất ${b} ${cl}`, `${nA} eats ${b}`);
          question = t(`Bạn ${nA} có ${a} ${vi}, ${gone}. Còn lại mấy ${vi}?`, `${nA} has ${a} ${pl(a)}. ${gone[0].toUpperCase() + gone.slice(1)}. How many are left?`);
        }
        return { scene: scene(R, K === 'flower' ? ['garden'] : K === 'balloon' ? ['park', 'playground'] : ['kitchen', 'livingroom']), tiles, ...numChoices(R, ans, n, top),
          question, hint: sub ? t('Con đếm những cái không bị gạch nhé!', 'Count the ones that are not crossed out!') : t('Con đếm tất cả lại nhé!', 'Count them all together!'),
          explain: sub ? t(`${a} bớt ${b} còn ${ans}.`, `${a} take away ${b} leaves ${ans}.`) : t(`${a} thêm ${b} là ${ans}.`, `${a} and ${b} more makes ${ans}.`), key: [K, a, b, sub, A.sp].join() };
      },
      pattern(R, n, tier) {
        const u = R.pick([['AB'], ['AB', 'AAB', 'ABB'], ['AAB', 'ABB', 'ABC'], ['ABC', 'AABB', 'ABAC']][tier]);
        const letters = [...new Set(u)], map = {};
        if (tier >= 3 && R.chance(0.5)) { const ks = R.shuffle(Object.keys(CL)).slice(0, letters.length); letters.forEach((l, i) => (map[l] = `${ks[i]}-${R.pick(colorsOf(ks[i]))}`)); }
        else { const K = R.pick(Object.keys(CL)), cs = R.shuffle(colorsOf(K)); need(cs.length >= letters.length + 1); letters.forEach((l, i) => (map[l] = `${K}-${cs[i]}`)); }
        const L = Math.min(9, 2 * u.length + R.int(u.length)), seq = Array.from({ length: L + 1 }, (_, i) => map[u[i % u.length]]), ans = seq[L];
        const used = Object.values(map), kinds = [...new Set(used.map((x) => x.split('-')[0]))];
        const extra = R.shuffle(cat.items.filter((x) => kinds.includes(x.split('-')[0]) && !used.includes(x)));
        const others = [...R.shuffle(used.filter((x) => x !== ans)), ...extra].slice(0, n - 1);
        need(others.length === n - 1);
        const ai = R.int(n), list = others.slice(); list.splice(ai, 0, ans);
        return { scene: scene(R, ['classroom', 'livingroom', 'bedroom', 'park']), tiles: [...seq.slice(0, L).map((x) => ({ img: `assets/item/${x}.webp` })), { op: '?' }],
          choiceKind: 'item', choices: list.map(itemChoice), answer: ai,
          question: t('Các đồ vật xếp theo quy luật. Cái tiếp theo là gì?', 'Look at the pattern. What comes next?'),
          hint: t('Con đọc to từng cái từ đầu, rồi đoán cái tiếp theo nhé!', 'Say each one out loud from the start, then guess what comes next!'),
          explain: t(`Tiếp theo là ${itemName(ans)}.`, `Next comes the ${itemName(ans)}.`), key: u + seq.join() };
      },
      countAttr(R, n, tier) {
        const opts = [
          ...['cap', 'glasses', 'backpack', 'scarf'].map((a) => ({ has: (p) => p.kind === 'acc' && p.v.acc === a, vi: ACC[a].wear, en: a === 'glasses' ? 'wearing glasses' : `wearing a ${a}` })),
          { has: (p) => p.kind === 'hold' && p.v.hold === 'balloon', vi: 'cầm bóng bay', en: 'holding a balloon' },
          ...cat.colors.map((c) => ({ has: (p) => p.o.shirt === c, no: (p) => tier >= 2 || !TOUGH[c].includes(p.o.shirt), vi: `mặc áo màu ${VI[c]}`, en: `wearing ${an(c)} shirt` })),
        ];
        const A = R.pick(opts), m = tier >= 2 ? 5 : 4, k = 1 + R.int(m - 1);
        const used = new Set(), crowd = [];
        for (const p of R.shuffle(P((p) => clean(p) && A.has(p)))) { if (crowd.length === k) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        need(crowd.length === k);
        for (const p of R.shuffle(P((p) => clean(p) && !A.has(p) && (!A.no || A.no(p))))) { if (crowd.length === m) break; if (used.has(p.sp)) continue; used.add(p.sp); crowd.push(p); }
        need(crowd.length === m);
        return { scene: scene(R, ['park', 'playground', 'classroom', 'garden']), crowd: R.shuffle(crowd).map((p) => p.img), ...numChoices(R, k, n, m),
          question: t(`Có mấy bạn ${A.vi}?`, `How many friends are ${A.en}?`), hint: t('Con chỉ tay đếm từng bạn một nhé!', 'Point and count each friend one by one!'),
          explain: t(`Có ${k} bạn ${A.vi}.`, k === 1 ? `Only 1 friend is ${A.en}.` : `${k} friends are ${A.en}.`), key: A.en + crowd.map((p) => p.id).sort().join() };
      },
      position(R, n, tier) {
        const pool = P(tier >= 2 ? (p) => p.kind !== 'combo' : clean), first = R.pick(pool);
        const row = R.shuffle([first, ...distract(R, first, n, pool)]), m = row.length, N = (i) => sname(row[i].sp);
        const modes = ['middle', 'left', 'right', 'next', 'between', 'nth'].filter((md) => (md === 'middle' ? m % 2 === 1 : md === 'between' ? tier >= 2 : md === 'nth' ? tier >= 3 : tier >= 1));
        const md = R.pick(modes);
        let ans, question, hint;
        if (md === 'middle') { ans = (m - 1) / 2; question = t('Bạn nào đứng ở giữa?', 'Who is standing in the middle?'); hint = t('Bạn ở giữa có số bạn hai bên bằng nhau đấy!', 'The friend in the middle has the same number of friends on each side!'); }
        else if (md === 'left' || md === 'right') { ans = md === 'left' ? 0 : m - 1; question = t(`Bạn nào đứng ngoài cùng bên ${md === 'left' ? 'trái' : 'phải'}?`, `Who is standing at the far ${md}?`); hint = t(`Con giơ tay ${md === 'left' ? 'trái' : 'phải'} lên rồi nhìn về phía đó nhé!`, `Raise your ${md} hand and look that way!`); }
        else if (md === 'next') { const e = R.pick([0, m - 1]); ans = e === 0 ? 1 : m - 2; question = t(`Bạn nào đứng cạnh bạn ${N(e)}?`, `Who is standing next to ${N(e)}?`); hint = t(`Con tìm bạn ${N(e)} trước nhé!`, `Find ${N(e)} first!`); }
        else if (md === 'between') { ans = 1 + R.int(m - 2); question = t(`Bạn nào đứng giữa bạn ${N(ans - 1)} và bạn ${N(ans + 1)}?`, `Who is standing between ${N(ans - 1)} and ${N(ans + 1)}?`); hint = t(`Con tìm bạn ${N(ans - 1)} và bạn ${N(ans + 1)} trước nhé!`, `Find ${N(ans - 1)} and ${N(ans + 1)} first!`); }
        else { ans = 1 + R.int(m - 2); question = t(`Đếm từ trái sang, bạn nào đứng thứ ${ans + 1}?`, `Counting from the left, who is number ${ans + 1}?`); hint = t('Con đếm từ bên trái: một, hai, ba…', 'Count from the left: one, two, three…'); }
        const choices = R.shuffle(row);
        return { scene: scene(R, ['park', 'playground', 'classroom', 'garden', 'autumn']), crowd: row.map((p) => p.img), choices, answer: choices.indexOf(row[ans]),
          question, hint, explain: t(`Đó là bạn ${N(ans)}.`, `It's ${N(ans)}!`), key: md + row.map((p) => p.id).join() };
      },
      memory(R, n, tier) {
        const m = tier >= 2 ? 4 : 3, memo = { secs: tier === 0 ? 5 : 4, intro: t('Con hãy nhìn thật kỹ và nhớ nhé!', 'Look carefully and remember!') };
        const sc = scene(R, ['livingroom', 'bedroom', 'classroom', 'park']), hint = t('Con thử nhớ lại xem! Chạm vào rèm để xem lại.', 'Try to remember! Tap the curtain to peek again.');
        if (tier >= 1 && R.chance(0.5)) {
          const h = R.pick(P((p) => p.kind === 'hold')), crowd = R.shuffle([h, ...distract(R, h, m, P((p) => clean(p) && p.kind !== 'hold'))]);
          const ans = it(`${h.v.hold}-${h.v.color}`), k = Math.min(n, 4);
          const same = cat.items.filter((x) => x.startsWith(h.v.hold + '-') && x !== ans), diff = cat.items.filter((x) => /^(balloon|apple|lollipop|flower)-/.test(x) && !x.startsWith(h.v.hold + '-'));
          const others = (tier >= 2 ? [...R.shuffle(same).slice(0, 2), ...R.shuffle(diff)] : R.shuffle(diff).filter((x, i, a) => a.findIndex((y) => y.split('-')[0] === x.split('-')[0]) === i)).slice(0, k - 1);
          need(others.length === k - 1);
          const ai = R.int(k), list = others.slice(); list.splice(ai, 0, ans);
          return { scene: sc, crowd: crowd.map((p) => p.img), memory: memo, choiceKind: 'item', choices: list.map(itemChoice), answer: ai,
            question: t(`Lúc nãy bạn ${sname(h.sp)} cầm gì?`, `What was ${sname(h.sp)} holding?`), hint, explain: t(`Bạn ${sname(h.sp)} cầm ${itemName(ans)}.`, `${sname(h.sp)} was holding the ${itemName(ans)}.`), key: 'h' + crowd.map((p) => p.id).join() };
        }
        const first = R.pick(P(clean)), crowd = R.shuffle([first, ...distract(R, first, m, P(clean))]), cul = R.pick(crowd);
        const absent = distract(R, cul, n, P(clean), new Set(crowd.map((p) => p.sp)));
        return { scene: sc, crowd: crowd.map((p) => p.img), memory: memo, ...place(R, cul, absent),
          question: t('Bạn nào vừa ở đây lúc nãy?', 'Which friend was just here?'), hint, explain: t(`Bạn ${sname(cul.sp)} vừa ở đây.`, `${sname(cul.sp)} was here!`), key: 'w' + crowd.map((p) => p.id).join() };
      },
      oddCat(R, n, tier) {
        const FOOD = (x) => /^(apple|lollipop)-/.test(x) || ['cake-strawberry', 'cake-chocolate', 'honey', 'watermelon'].includes(x);
        const WEAR = (x) => /^(cap|scarf|shoe|tshirt|glasses)-/.test(x);
        const groups = [{ f: FOOD, vi: 'đồ ăn', en: 'food', sc: 'kitchen' }, { f: WEAR, vi: 'đồ để mặc hoặc đeo', en: 'something you wear', sc: 'bedroom' }];
        const g = R.int(2), G = groups[g], O = groups[1 - g];
        let inG = cat.items.filter(G.f), outG = cat.items.filter(O.f);
        if (tier >= 2) { const C = R.pick(cat.colors), a = inG.filter((x) => x.endsWith('-' + C)), b = outG.filter((x) => x.endsWith('-' + C)); if (new Set(a.map((x) => x.split('-')[0])).size >= n - 1 && b.length) { inG = a; outG = b; } }
        const kindOf = (x) => (SPECIAL[x] ? x : x.split('-')[0]), seen = new Set(), picked = [];
        for (const x of R.shuffle(inG)) { if (picked.length === n - 1) break; if (seen.has(kindOf(x))) continue; seen.add(kindOf(x)); picked.push(x); }
        need(picked.length === n - 1);
        const odd = R.pick(outG), ai = R.int(n), list = picked.slice(); list.splice(ai, 0, odd);
        const nm = itemName(odd);
        return { scene: G.sc, owl: true, choiceKind: 'item', choices: list.map(itemChoice), answer: ai,
          question: t(`Cái nào KHÔNG phải là ${G.vi}?`, `Which one is NOT ${G.en}?`), hint: t(`Có ${n - 1} cái là ${G.vi}, chỉ một cái là khác. Con tìm nhé!`, `${n - 1} of them are ${G.en}. One is different!`),
          explain: t(`${nm[0].toUpperCase() + nm.slice(1)} không phải là ${G.vi}.`, `The ${nm} is not ${G.en}.`), key: list.join() };
      },
      fitUse(R, n, tier) {
        const U = R.pick(USES), of = (k) => cat.items.filter((x) => x === k || x.startsWith(k + '-'));
        const ak = U.ans.filter((k) => of(k).length); need(ak.length); const ans = R.pick(of(R.pick(ak)));
        const others = R.shuffle(U.wrong).filter((k) => of(k).length).slice(0, n - 1).map((k) => R.pick(of(k)));
        need(others.length === n - 1);
        const ai = R.int(n), list = others.slice(); list.splice(ai, 0, ans);
        const who = sname(R.pick(cat.outfits).sp);
        const question = U.hungry ? t(`Bạn ${who} đói bụng rồi. Bạn ấy nên ăn gì?`, `${who} is hungry. What can ${who} eat?`) : t(U.vi[0], U.en[0]);
        return { scene: U.sc, owl: !!U.owl, choiceKind: 'item', choices: list.map(itemChoice), answer: ai,
          question, hint: t('Con nghĩ xem cái nào dùng được ở đây nhé!', 'Think about which one is useful here!'), explain: t(U.vi[1], U.en[1]), key: U.sc + list.join() };
      },
    };

    const TYPES = Object.keys(GEN);
    const out = [], seen = new Set(), R0 = mk(mulberry32(20261126));
    let prev = '';
    // tiers: first 10% easy, then up to 30%, 60%, rest
    const TB = [0, Math.round(count * 0.1), Math.round(count * 0.3), Math.round(count * 0.6)];
    const tierOf = (lv) => (lv <= TB[1] ? 0 : lv <= TB[2] ? 1 : lv <= TB[3] ? 2 : 3), unlock = (x) => TB[SCHEDULE[x][0]] + 1;
    for (let i = 0; i < count; i++) {
      const lv = i + 1, tier = tierOf(lv), n = tier === 0 ? 3 : tier <= 2 ? 4 : 5;
      const open = TYPES.filter((x) => lv >= unlock(x) && x !== prev);
      const w = open.map((x) => (tier === 3 ? SCHEDULE[x][2] : SCHEDULE[x][1]) * (lv - unlock(x) < 10 && unlock(x) > 1 ? 3 : 1));
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
            silhouette: q.silhouette, photo: q.photo, peek: q.peek, group: q.group, beforeAfter: q.beforeAfter, crowd: q.crowd, witness: q.witness, tiles: q.tiles, memory: q.memory, owl: q.owl };
          prev = type;
        } catch (e) { if (!(e instanceof Fail)) throw e; }
      }
      if (!p) throw new Error('could not build puzzle ' + lv);
      out.push(p);
    }
    return out;
  }
  // number of answer choices per type (count/whatLost stay at 4 so cards stay big)
  const q_n = (type, n) => (['count', 'whatLost', 'countItems', 'addSub', 'countAttr'].includes(type) ? Math.min(n, 4) : n);

  const api = { build, LABEL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzles = api;
})(typeof window !== 'undefined' ? window : globalThis);
