// Asset catalog: every image the game needs, with the prompt that makes it.
// Game-facing metadata is written to assets/catalog.json by tools/assets.mjs.

export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
const EN = { red: 'red', orange: 'orange', yellow: 'yellow', green: 'green', blue: 'bright blue', purple: 'purple', pink: 'pink' };

export const SPECIES = {
  bear: { vi: 'Gấu', en: 'brown teddy bear', girl: false },
  panda: { vi: 'Gấu Trúc', en: 'black-and-white panda', girl: false },
  bunny: { vi: 'Thỏ', en: 'white bunny with long upright ears', girl: true },
  cat: { vi: 'Mèo', en: 'grey kitten', girl: true },
  fox: { vi: 'Cáo', en: 'orange fox with a fluffy white-tipped tail', girl: false },
  sheep: { vi: 'Cừu', en: 'fluffy white lamb with a cream face', girl: true },
  squirrel: { vi: 'Sóc', en: 'brown squirrel with a big curly tail', girl: false },
  dog: { vi: 'Cún', en: 'beige puppy with floppy brown ears', girl: false },
  pig: { vi: 'Heo', en: 'pink piglet', girl: true },
  mouse: { vi: 'Chuột', en: 'grey mouse with big round ears', girl: true },
  elephant: { vi: 'Voi', en: 'light blue-grey baby elephant', girl: false },
  frog: { vi: 'Ếch', en: 'green frog', girl: false },
  duck: { vi: 'Vịt', en: 'yellow duckling', girl: true },
  penguin: { vi: 'Chim Cánh Cụt', en: 'navy-blue and white baby penguin', girl: true },
  lion: { vi: 'Sư Tử', en: 'lion cub with an orange mane', girl: false },
  monkey: { vi: 'Khỉ', en: 'brown monkey', girl: false },
  koala: { vi: 'Gấu Túi', en: 'grey koala', girl: true },
  tiger: { vi: 'Hổ', en: 'orange tiger cub with stripes', girl: false },
};
export const SPECIES_KEYS = Object.keys(SPECIES);

const BG = 'Centered, full body, isolated on a pure plain white background, no shadow, no ground, nothing else in the picture.';
const STYLE_REF = 'Draw it in exactly the same art style, line quality, colouring and proportions as the reference picture (big head, small body, standing straight facing the viewer, arms relaxed at the sides), but it is a DIFFERENT character.';
const KEEP = 'Keep the character, its face, pose, clothes, colours and the drawing style exactly the same, and keep the plain white background. Change only this:';

// ---- characters: 2 outfits per species -----------------------------------------------
// 12 species are used (colours stay computed from the original index so existing images still match)
export const ACTIVE = ['bear', 'panda', 'bunny', 'cat', 'fox', 'sheep', 'squirrel', 'dog', 'pig', 'mouse', 'elephant', 'duck'];
const ALL_OUTFITS = []; // {id, sp, shirt, pattern, bottom, bottomColor, shoes}
SPECIES_KEYS.forEach((sp, i) => {
  for (let j = 0; j < 2; j++) {
    const shirt = COLORS[(i * 3 + j * 4) % 7];
    let shoes = COLORS[(i * 5 + j * 2 + 3) % 7]; if (shoes === shirt) shoes = COLORS[(COLORS.indexOf(shoes) + 2) % 7];
    let bc = COLORS[(i * 2 + j * 3 + 5) % 7]; if (bc === shirt) bc = COLORS[(COLORS.indexOf(bc) + 3) % 7];
    const pattern = j === 1 ? (i % 2 ? 'dots' : 'stripes') : 'plain';
    ALL_OUTFITS.push({ id: `${sp}${j}`, sp, shirt, pattern, bottom: SPECIES[sp].girl ? 'skirt' : 'shorts', bottomColor: bc, shoes });
  }
});
export const OUTFITS = ALL_OUTFITS.filter((o) => ACTIVE.includes(o.sp));
const shirtText = (o) => `a ${EN[o.shirt]} t-shirt${o.pattern === 'dots' ? ' with big white polka dots' : o.pattern === 'stripes' ? ' with white horizontal stripes' : ' (plain, no pattern)'}`;
const outfitText = (o) => `wearing ${shirtText(o)}, ${EN[o.bottomColor]} ${o.bottom} and ${EN[o.shoes]} sneakers`;

// ---- per-outfit variants (image edits of the base) -----------------------------------
const FOODS = [
  { id: 'strawberry', c: 'pink', en: 'pink strawberry cream', vi: 'bánh kem dâu', prop: 'cake-strawberry' },
  { id: 'chocolate', c: 'brown', en: 'brown chocolate cream', vi: 'bánh sô-cô-la', prop: 'cake-chocolate' },
  { id: 'honey', c: 'gold', en: 'sticky golden honey', vi: 'mật ong', prop: 'honey' },
  { id: 'watermelon', c: 'red', en: 'red watermelon juice and a few black seeds', vi: 'dưa hấu', prop: 'watermelon' },
];
export { FOODS };
const ACCS = ['cap', 'backpack', 'scarf', 'glasses'];
const ACC_EN = { cap: (c) => `a ${EN[c]} baseball cap on its head`, backpack: (c) => `a ${EN[c]} backpack (the straps clearly visible on both shoulders and the bag visible behind both sides of the body)`, scarf: (c) => `a ${EN[c]} knitted scarf around its neck`, glasses: (c) => `round glasses with thick ${EN[c]} frames` };
const HOLDS = { balloon: (c) => `holding the string of a ${EN[c]} balloon in one hand, the balloon floating above its shoulder`, flower: (c) => `holding one ${EN[c]} flower with a green stem in one hand`, apple: (c) => `holding one ${EN[c]} apple in one hand`, lollipop: (c) => `holding one big ${EN[c]} swirl lollipop in one hand` };
export const HOLD_COLORS = { balloon: COLORS, flower: ['red', 'yellow', 'purple', 'pink', 'orange', 'blue'], apple: ['red', 'green', 'yellow'], lollipop: COLORS };

// k = index in OUTFITS. Each kind is spread over enough species for 5-choice puzzles,
// but no outfit gets every variant (≈5 images per outfit instead of 11).
export function variantsOf(o, k) {
  const v = [], j = k % 2, i = k >> 1;
  const paint = COLORS.filter((c) => c !== o.shirt)[k % 6];
  const food = FOODS[i % FOODS.length];
  if (j === 0) {
    v.push({ kind: 'oneshoe', prompt: `the sneaker on the character's right foot (the foot on the viewer's LEFT) is gone, that foot is now a bare foot with no shoe and no sock. The other foot still wears its ${EN[o.shoes]} sneaker.` });
    v.push({ kind: 'paint', color: paint, prompt: `both hands are completely covered in thick wet ${EN[paint]} paint, and there are a few ${EN[paint]} paint splashes on the clothes. Make the ${EN[paint]} paint very clearly visible.` });
    v.push({ kind: 'smear', food: food.id, prompt: `there is a big messy smear of ${food.en} around the mouth and on one cheek, as if it just secretly ate some. Make it very clearly visible.` });
    v.push({ kind: 'mud', prompt: 'both sneakers and the lower legs are covered with lots of brown mud splashes and mud blobs, very clearly dirty.' });
    // two clues at once: edit of an existing variant (see "from")
    const combo = i % 3;
    if (combo === 0) v.push({ kind: 'combo', from: 'paint', parts: ['paint', 'mud'], color: paint, prompt: 'both sneakers and the lower legs are now ALSO covered with lots of brown mud splashes. Keep the paint on the hands exactly as it is.' });
    if (combo === 1) v.push({ kind: 'combo', from: 'smear', parts: ['smear', 'mud'], food: food.id, prompt: 'both sneakers and the lower legs are now ALSO covered with lots of brown mud splashes. Keep the food smear on the mouth exactly as it is.' });
  } else {
    const mess = ['wet', 'leaves', 'flour'][i % 3];
    if (mess === 'wet') v.push({ kind: 'wet', prompt: 'the character is soaking wet from the rain: fur and clothes dripping with water, many big water drops falling off, wet droopy fur, a few drops on the face. Make it very clearly wet.' });
    if (mess === 'leaves') v.push({ kind: 'leaves', prompt: 'lots of colourful autumn leaves (orange, red and yellow) are stuck in its fur, on top of its head and on its clothes, as if it just jumped into a leaf pile. Make the leaves big and very clearly visible.' });
    if (mess === 'flour') v.push({ kind: 'flour', prompt: 'its face, nose, hands and clothes are dusted with lots of white flour: white powder on the cheeks and nose, white floury hands, white handprints on the shirt, a little white flour cloud. Make it very clearly visible.' });
    // a second mess kind on every other species so wet/leaves/flour each reach 6 species
    const mess2 = ['leaves', 'flour', 'wet'][i % 3];
    if (i % 2 === 0) v.push({ kind: mess2, prompt: { wet: 'the character is soaking wet from the rain: fur and clothes dripping with water, many big water drops falling off, wet droopy fur, a few drops on the face. Make it very clearly wet.', leaves: 'lots of colourful autumn leaves (orange, red and yellow) are stuck in its fur, on top of its head and on its clothes, as if it just jumped into a leaf pile. Make the leaves big and very clearly visible.', flour: 'its face, nose, hands and clothes are dusted with lots of white flour: white powder on the cheeks and nose, white floury hands, white handprints on the shirt, a little white flour cloud. Make it very clearly visible.' }[mess2] });
  }
  const acc = ACCS[(i + j) % 4], accC = COLORS.filter((c) => c !== o.shirt)[(k * 3 + 1) % 6];
  v.push({ kind: 'acc', acc, color: accC, prompt: `the character now also wears ${ACC_EN[acc](accC)}.` });
  const kinds = Object.keys(HOLDS), hk = kinds[(i + j * 2) % 4], cols = HOLD_COLORS[hk], hc = cols[(k * 2 + 1) % cols.length];
  v.push({ kind: 'hold', hold: hk, color: hc, prompt: `the character is now ${HOLDS[hk](hc)}. Make the object large and clearly visible.` });
  return v;
}

// ---- items -------------------------------------------------------------------------
const ITEM = 'Centered, isolated on a pure plain white background, no shadow, nothing else in the picture.';
export function items() {
  const L = [];
  const need = neededItems();
  for (const c of COLORS) {
    L.push({ id: `shoe-${c}`, prompt: `A single small ${EN[c]} children's sneaker with white laces and a white sole, seen from the side, lying alone. ${ITEM}` });
    L.push({ id: `cap-${c}`, prompt: `A single small ${EN[c]} children's baseball cap, seen from the side. ${ITEM}` });
    L.push({ id: `backpack-${c}`, prompt: `A small ${EN[c]} children's backpack standing upright, front view. ${ITEM}` });
    L.push({ id: `scarf-${c}`, prompt: `A ${EN[c]} knitted children's scarf lying loosely in a soft curve. ${ITEM}` });
    L.push({ id: `glasses-${c}`, prompt: `A pair of small round children's glasses with thick ${EN[c]} frames, front view. ${ITEM}` });
    L.push({ id: `tshirt-${c}`, prompt: `A plain ${EN[c]} children's t-shirt on a wooden clothes hanger, front view. ${ITEM}` });
    L.push({ id: `paint-${c}`, prompt: `A tipped-over paint tin lying on its side with thick ${EN[c]} paint spilled out into a big puddle, seen from slightly above. ${ITEM}` });
  }
  for (const [k, cols] of Object.entries(HOLD_COLORS))
    for (const c of cols) L.push({ id: `${k}-${c}`, prompt: { balloon: `One ${EN[c]} balloon with a short string.`, flower: `One ${EN[c]} flower with a green stem and two leaves.`, apple: `One ${EN[c]} apple with a little leaf.`, lollipop: `One big ${EN[c]} swirl lollipop on a white stick.` }[k] + ' ' + ITEM });
  for (const o of OUTFITS.filter((o) => o.pattern !== 'plain')) {
    const id = `umbrella-${o.shirt}-${o.pattern}`;
    if (!L.find((x) => x.id === id)) L.push({ id, prompt: `An open children's umbrella lying on the floor, its canopy is ${EN[o.shirt]}${o.pattern === 'dots' ? ' with big white polka dots' : ' with white stripes'}, exactly like a ${shirtText(o)}. ${ITEM}` });
  }
  L.push({ id: 'cake-strawberry', prompt: `A round pink strawberry cream cake on a white plate with one slice clearly missing and a few crumbs. ${ITEM}` });
  L.push({ id: 'cake-chocolate', prompt: `A round chocolate cake with brown chocolate cream on a white plate with one slice clearly missing and a few crumbs. ${ITEM}` });
  L.push({ id: 'honey', prompt: `An open honey pot with golden honey dripping down the side and a honey dipper next to it, a little honey spilled. ${ITEM}` });
  L.push({ id: 'watermelon', prompt: `A half watermelon on a plate with one slice cut out and missing, a few black seeds scattered. ${ITEM}` });
  L.push({ id: 'owl', prompt: `A cute wise brown owl wearing small round glasses, standing and pointing with one wing, friendly face. ${ITEM}` });
  L.push({ id: 'wetumbrella', prompt: `A closed wet yellow umbrella leaning upright, water dripping from it into a small puddle on the floor. ${ITEM}` });
  L.push({ id: 'leafpile', prompt: `A big messy pile of orange, red and yellow autumn leaves, scattered as if someone jumped into it, leaves flying. ${ITEM}` });
  L.push({ id: 'flour', prompt: `A paper bag of flour tipped over on its side with white flour spilled out in a big white cloud and heap. ${ITEM}` });
  L.push({ id: 'bush', prompt: `A big wide round leafy green garden bush, full and dense, front view, flat bottom edge. ${ITEM}` });
  L.push({ id: 'curtain', prompt: `A pair of long closed red velvet curtains hanging from a wooden rod, front view, the curtains reach the floor but leave a small gap at the very bottom. ${ITEM}` });
  L.push({ id: 'mudprints', prompt: `A trail of five brown muddy children's shoe footprints walking from left to right, seen from above, on white. ${ITEM}` });
  return L.filter((x) => need.has(x.id));
}
function neededItems() {
  const N = new Set(['bush', 'curtain', 'owl', 'wetumbrella', 'leafpile', 'flour', 'mudprints', ...FOODS.map((f) => f.prop)]);
  const byKind = {};
  OUTFITS.forEach((o, k) => {
    N.add(`shoe-${o.shoes}`); N.add(`tshirt-${o.shirt}`);
    if (o.pattern !== 'plain') N.add(`umbrella-${o.shirt}-${o.pattern}`);
    for (const v of variantsOf(o, k)) {
      if (v.kind === 'paint') N.add(`paint-${v.color}`);
      if (v.kind === 'acc') (byKind[v.acc] ||= new Set()).add(v.color);
      if (v.kind === 'hold') (byKind[v.hold] ||= new Set()).add(v.color);
    }
  });
  // every accessory / held object in at least 4 colours (decoys + the missing-item row)
  for (const [kind, set] of Object.entries(byKind)) {
    const pool = HOLD_COLORS[kind] || COLORS;
    for (const c of pool) if (set.size < Math.min(4, pool.length)) set.add(c);
    for (const c of set) N.add(`${kind}-${c}`);
  }
  return N;
}

// ---- backgrounds (16:9) ------------------------------------------------------------
const EMPTY = 'No frames, no borders, no blank panels. The floor or ground fills the lower 40% of the picture and is completely empty in the middle so items can be placed there. No people, no animals, no text, no letters, no writing anywhere (book spines and posters must have no letters).';
export const BACKGROUNDS = {
  classroom: { vi: 'lớp học', prompt: 'Empty kindergarten classroom interior seen from the front: green chalkboard, a window with a light green curtain, a small wooden bookshelf with colourful books and a globe, children\'s drawings on the wall. Warm wooden floor.' },
  park: { vi: 'công viên', prompt: 'Sunny city park for kids: soft blue sky with a few clouds, round green trees on the left and right, a wooden bench, flower bushes. Green grass.' },
  kitchen: { vi: 'nhà bếp', prompt: 'Cosy family kitchen seen from the front: pastel cupboards, a window, pots on a shelf, and a low round wooden table with a white tablecloth in the centre front whose empty tabletop is clearly visible. Tiled floor.' },
  bedroom: { vi: 'phòng ngủ', prompt: 'Cosy child bedroom seen from the front: a small bed with a blue blanket on the right, a lamp, a window with stars curtain, a soft round rug. Wooden floor.' },
  livingroom: { vi: 'phòng khách', prompt: 'Cosy living room seen from the front: an orange sofa on the left, a framed landscape painting on the wall, a potted plant, a wooden door on the right. Wooden floor with a rug.' },
  garden: { vi: 'khu vườn', prompt: 'Sunny garden: white picket fence, blue sky, a few flower bushes at the sides, a big apple tree with no apples on one side. Green grass.' },
  playground: { vi: 'sân chơi', prompt: 'Children\'s playground: a colourful slide on the right, a swing set on the left, blue sky. Green grass.' },
  // beach: { vi: 'bãi biển', prompt: 'Sunny beach: blue sea with gentle waves, a palm tree on the right, a starfish, soft yellow sand.' },
  autumn: { vi: 'công viên mùa thu', prompt: 'Autumn park: trees with orange, red and yellow leaves, a path, fallen leaves at the sides, soft sky. Grass with a few leaves.' },
  hallway: { vi: 'cửa ra vào', prompt: 'Cosy home entrance hall seen from inside: an open front door on the right showing rain falling outside, a coat rack, a shoe shelf, a doormat. Wooden floor.' },
  snow: { vi: 'sân tuyết', prompt: 'Snowy winter yard: pine trees with snow, a little snowman on the right, falling snowflakes, soft white snow ground.' },
};
export const bgPrompt = (k) => `${BACKGROUNDS[k].prompt} ${EMPTY}`;

export const PROMPTS = {
  base: (o) => `${STYLE_REF} The new character: one cute chibi ${SPECIES[o.sp].en} child, ${outfitText(o)}, happy smile. The clothes and shoe colours must be bright, saturated and easy to name (not pale). ${BG}`,
  variant: (v) => `${KEEP} ${v.prompt}`,
};
