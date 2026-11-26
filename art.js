// Thám Tử Nhí — SVG art engine (works in browser and Node)
(function (root) {
  const INK = '#5a4636';

  const COLORS = {
    red: ['đỏ', '#ef5350'],
    orange: ['cam', '#ffa040'],
    yellow: ['vàng', '#ffd54f'],
    green: ['xanh lá', '#66bb6a'],
    blue: ['xanh dương', '#42a5f5'],
    purple: ['tím', '#ab7ae0'],
    pink: ['hồng', '#f48fb1'],
  };
  const COLOR_KEYS = Object.keys(COLORS);
  const hex = (c) => (COLORS[c] ? COLORS[c][1] : c);

  function shade(h, amt) {
    h = hex(h).replace('#', '');
    const n = parseInt(h, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  // ---------- shared defs ----------
  function defs() {
    let s = '<defs>';
    s += '<filter id="sil"><feFlood flood-color="#3e3a5e"/><feComposite operator="in" in2="SourceAlpha"/></filter>';
    s += '<clipPath id="shirtclip"><rect x="62" y="132" width="76" height="52" rx="22"/></clipPath>';
    for (const k of COLOR_KEYS) {
      const c = hex(k);
      s += `<pattern id="pat-dots-${k}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${c}"/><circle cx="4" cy="4" r="3" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#fff"/></pattern>`;
      s += `<pattern id="pat-stripes-${k}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${c}"/><rect y="0" width="14" height="5" fill="#fff"/></pattern>`;
      s += `<pattern id="pat-plain-${k}" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${c}"/></pattern>`;
    }
    s += '<pattern id="planks" width="120" height="40" patternUnits="userSpaceOnUse"><rect width="120" height="40" fill="#e9c48f"/><path d="M0 39.5H120M60 0V40" stroke="#d4a86c" stroke-width="2"/></pattern>';
    s += '<pattern id="tiles" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="50" height="50" fill="#e3f2fd"/><path d="M0 49H50M49 0V50" stroke="#c5ddf0" stroke-width="2"/></pattern>';
    s += '</defs>';
    return s;
  }
  const fillOf = (color, pattern) => `url(#pat-${pattern || 'plain'}-${color})`;

  // ---------- species ----------
  const SPECIES = {
    bear: { name: 'Gấu', fur: '#c98b55', light: '#f2d4b0', inner: '#f2b8a0' },
    panda: { name: 'Gấu Trúc', fur: '#fbfbfb', light: '#fbfbfb', inner: '#3d3d4f', limb: '#3d3d4f' },
    bunny: { name: 'Thỏ', fur: '#fdf3f5', light: '#ffffff', inner: '#f8b4c8' },
    cat: { name: 'Mèo', fur: '#b8bfcc', light: '#eef0f5', inner: '#f8b4c8' },
    fox: { name: 'Cáo', fur: '#f08a3c', light: '#fff6ec', inner: '#5a4636' },
    sheep: { name: 'Cừu', fur: '#fff0dc', light: '#fff0dc', inner: '#f5cbb0' },
    squirrel: { name: 'Sóc', fur: '#c07a45', light: '#f4dcc0', inner: '#f2b8a0' },
    dog: { name: 'Cún', fur: '#e8c090', light: '#fff1de', inner: '#a8703c' },
    pig: { name: 'Heo', fur: '#f9c4d6', light: '#f9c4d6', inner: '#f48fb1' },
    mouse: { name: 'Chuột', fur: '#aeb5c4', light: '#e8ebf1', inner: '#f8b4c8' },
    elephant: { name: 'Voi', fur: '#9fb6cd', light: '#c9d7e6', inner: '#f3c1cf' },
    frog: { name: 'Ếch', fur: '#8bd17c', light: '#d9f2c8', inner: '#8bd17c' },
    duck: { name: 'Vịt', fur: '#ffe27a', light: '#fff4bf', inner: '#ff9f43' },
    penguin: { name: 'Chim Cánh Cụt', fur: '#4a5a8c', light: '#ffffff', inner: '#ff9f43' },
    lion: { name: 'Sư Tử', fur: '#ffd27a', light: '#fff0cc', inner: '#e8913a' },
    monkey: { name: 'Khỉ', fur: '#a0703f', light: '#f3d6b3', inner: '#f3d6b3' },
    koala: { name: 'Gấu Túi', fur: '#a7a9b8', light: '#e6e7ee', inner: '#ffffff' },
    tiger: { name: 'Hổ', fur: '#ffa64d', light: '#fff5e6', inner: '#ffe0c0' },
  };
  const SPECIES_KEYS = Object.keys(SPECIES);

  const eye = (x, y) =>
    `<ellipse cx="${x}" cy="${y}" rx="6.5" ry="8.5" fill="#2e2530" stroke="none"/><circle cx="${x + 2}" cy="${y - 3}" r="2.6" fill="#fff" stroke="none"/>`;
  const cheeks = `<ellipse cx="64" cy="106" rx="9" ry="6" fill="#ff8fa3" opacity=".45" stroke="none"/><ellipse cx="136" cy="106" rx="9" ry="6" fill="#ff8fa3" opacity=".45" stroke="none"/>`;
  const smile = (y = 108) =>
    `<path d="M90 ${y} Q100 ${y + 13} 110 ${y} Z" fill="#e85d75" stroke="${INK}" stroke-width="2.2"/>`;
  const nose = (y = 98) => `<ellipse cx="100" cy="${y}" rx="6" ry="4.5" fill="#4a3038" stroke="none"/>`;
  const whiskers = `<path d="M60 100 L40 96 M60 106 L40 108 M140 100 L160 96 M140 106 L160 108" stroke="${INK}" stroke-width="1.6" fill="none"/>`;

  function head(sp) {
    const S = SPECIES[sp];
    const f = S.fur, l = S.light, i = S.inner;
    let back = '', headShape = `<circle cx="100" cy="80" r="58" fill="${f}"/>`, face = '', front = '';
    const eyes = eye(78, 84) + eye(122, 84);
    const muzzle = `<ellipse cx="100" cy="104" rx="22" ry="16" fill="${l}" stroke="none"/>`;
    switch (sp) {
      case 'bear':
        back = `<circle cx="52" cy="34" r="18" fill="${f}"/><circle cx="52" cy="34" r="9" fill="${i}" stroke="none"/><circle cx="148" cy="34" r="18" fill="${f}"/><circle cx="148" cy="34" r="9" fill="${i}" stroke="none"/>`;
        face = muzzle + eyes + nose() + smile() + cheeks;
        break;
      case 'tiger':
        back = `<circle cx="54" cy="36" r="16" fill="${f}"/><circle cx="54" cy="36" r="8" fill="${i}" stroke="none"/><circle cx="146" cy="36" r="16" fill="${f}"/><circle cx="146" cy="36" r="8" fill="${i}" stroke="none"/>`;
        face = `<path d="M100 24 L100 42 M86 26 L90 40 M114 26 L110 40 M44 72 L60 76 M44 84 L58 84 M156 72 L140 76 M156 84 L142 84" stroke="#5a3a24" stroke-width="4" fill="none"/>` +
          `<ellipse cx="100" cy="106" rx="26" ry="18" fill="${l}" stroke="none"/>` + eyes + nose(98) + smile() + cheeks;
        break;
      case 'panda':
        back = `<circle cx="52" cy="34" r="18" fill="${i}"/><circle cx="148" cy="34" r="18" fill="${i}"/>`;
        face = `<ellipse cx="78" cy="86" rx="13" ry="17" fill="${i}" stroke="none" transform="rotate(25 78 86)"/><ellipse cx="122" cy="86" rx="13" ry="17" fill="${i}" stroke="none" transform="rotate(-25 122 86)"/>` +
          `<circle cx="79" cy="85" r="6" fill="#fff" stroke="none"/><circle cx="80" cy="85" r="3.6" fill="#2e2530" stroke="none"/><circle cx="121" cy="85" r="6" fill="#fff" stroke="none"/><circle cx="120" cy="85" r="3.6" fill="#2e2530" stroke="none"/>` +
          nose(100) + smile(108) + cheeks;
        break;
      case 'bunny':
        back = `<ellipse cx="78" cy="10" rx="14" ry="38" fill="${f}" transform="rotate(-8 78 10)"/><ellipse cx="78" cy="12" rx="7" ry="28" fill="${i}" stroke="none" transform="rotate(-8 78 12)"/>` +
          `<ellipse cx="122" cy="10" rx="14" ry="38" fill="${f}" transform="rotate(8 122 10)"/><ellipse cx="122" cy="12" rx="7" ry="28" fill="${i}" stroke="none" transform="rotate(8 122 12)"/>`;
        face = eyes + `<ellipse cx="100" cy="98" rx="5" ry="3.6" fill="#f48fb1" stroke="none"/>` + `<path d="M93 104 Q100 112 100 103 Q100 112 107 104" fill="none" stroke="${INK}" stroke-width="2"/>` + cheeks;
        break;
      case 'cat':
        back = `<path d="M48 56 L56 10 L92 32 Z" fill="${f}"/><path d="M58 46 L61 22 L82 34 Z" fill="${i}" stroke="none"/><path d="M152 56 L144 10 L108 32 Z" fill="${f}"/><path d="M142 46 L139 22 L118 34 Z" fill="${i}" stroke="none"/>`;
        face = muzzle + eyes + `<path d="M95 97 L105 97 L100 102 Z" fill="#f48fb1" stroke="none"/>` + `<path d="M92 105 Q96 111 100 104 Q104 111 108 105" fill="none" stroke="${INK}" stroke-width="2"/>` + whiskers + cheeks;
        break;
      case 'fox':
        back = `<path d="M46 56 L54 6 L92 30 Z" fill="${f}"/><path d="M54 18 L54 6 L66 14 Z" fill="${i}" stroke="none"/><path d="M154 56 L146 6 L108 30 Z" fill="${f}"/><path d="M146 18 L146 6 L134 14 Z" fill="${i}" stroke="none"/>`;
        face = `<path d="M44 90 Q70 84 100 120 Q130 84 156 90 Q150 132 100 138 Q50 132 44 90 Z" fill="${l}" stroke="none"/>` + eyes + nose(104) + smile(112) + cheeks;
        break;
      case 'sheep': {
        back = `<ellipse cx="36" cy="88" rx="20" ry="10" fill="${f}" transform="rotate(20 36 88)"/><ellipse cx="164" cy="88" rx="20" ry="10" fill="${f}" transform="rotate(-20 164 88)"/>`;
        let wool = '';
        const pts = [[56, 50], [70, 32], [88, 24], [108, 22], [128, 28], [144, 44], [150, 64], [50, 68]];
        for (const [x, y] of pts) wool += `<circle cx="${x}" cy="${y}" r="17" fill="#ffffff"/>`;
        headShape = `<ellipse cx="100" cy="86" rx="50" ry="52" fill="${f}"/>` + wool + `<ellipse cx="100" cy="56" rx="40" ry="14" fill="#ffffff" stroke="none"/>`;
        face = eye(80, 88) + eye(120, 88) + `<ellipse cx="100" cy="104" rx="5" ry="3.5" fill="#d98c8c" stroke="none"/>` + smile(110) + cheeks;
        break;
      }
      case 'squirrel':
        back = `<path d="M54 50 L58 12 L86 34 Z" fill="${f}"/><path d="M57 14 q-2 -10 4 -12" fill="none" stroke="${INK}" stroke-width="3"/><path d="M146 50 L142 12 L114 34 Z" fill="${f}"/><path d="M143 14 q2 -10 -4 -12" fill="none" stroke="${INK}" stroke-width="3"/>`;
        face = `<ellipse cx="100" cy="106" rx="28" ry="20" fill="${l}" stroke="none"/>` + eyes + nose(98) + smile() + `<rect x="95" y="110" width="10" height="8" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + cheeks;
        break;
      case 'dog':
        face = `<ellipse cx="122" cy="82" rx="16" ry="14" fill="#c99a63" stroke="none"/>` + muzzle + eyes + `<ellipse cx="100" cy="97" rx="8" ry="6" fill="#4a3038" stroke="none"/>` + smile() + `<path d="M96 114 Q100 126 104 114 Z" fill="#ff7b93" stroke="${INK}" stroke-width="1.5"/>` + cheeks;
        front = `<ellipse cx="46" cy="76" rx="15" ry="32" fill="${i}" transform="rotate(18 46 76)"/><ellipse cx="154" cy="76" rx="15" ry="32" fill="${i}" transform="rotate(-18 154 76)"/>`;
        break;
      case 'pig':
        back = `<path d="M52 50 L56 16 L86 32 Z" fill="${f}"/><path d="M148 50 L144 16 L114 32 Z" fill="${f}"/>`;
        face = eyes + `<ellipse cx="100" cy="102" rx="17" ry="12" fill="${i}"/><ellipse cx="94" cy="102" rx="3" ry="4" fill="#a0506a" stroke="none"/><ellipse cx="106" cy="102" rx="3" ry="4" fill="#a0506a" stroke="none"/>` +
          `<path d="M92 118 Q100 126 108 118" fill="none" stroke="${INK}" stroke-width="2.2"/>` + cheeks;
        break;
      case 'mouse':
        back = `<circle cx="46" cy="38" r="27" fill="${f}"/><circle cx="46" cy="38" r="16" fill="${i}" stroke="none"/><circle cx="154" cy="38" r="27" fill="${f}"/><circle cx="154" cy="38" r="16" fill="${i}" stroke="none"/>`;
        face = eyes + `<circle cx="100" cy="100" r="6" fill="#f48fb1" stroke="none"/>` + smile(108) + whiskers + cheeks;
        break;
      case 'elephant':
        back = `<ellipse cx="38" cy="86" rx="30" ry="38" fill="${f}"/><ellipse cx="40" cy="86" rx="18" ry="26" fill="${i}" stroke="none"/><ellipse cx="162" cy="86" rx="30" ry="38" fill="${f}"/><ellipse cx="160" cy="86" rx="18" ry="26" fill="${i}" stroke="none"/>`;
        face = eye(78, 80) + eye(122, 80) + cheeks + `<path d="M118 112 Q114 118 110 112" fill="none" stroke="${INK}" stroke-width="2"/>` +
          `<path d="M90 90 Q88 120 98 136 Q104 146 114 140 L110 132 Q104 134 102 126 Q100 112 110 90 Z" fill="${f}"/>`;
        break;
      case 'frog':
        headShape = `<ellipse cx="100" cy="86" rx="60" ry="50" fill="${f}"/><circle cx="72" cy="40" r="22" fill="${f}"/><circle cx="128" cy="40" r="22" fill="${f}"/>`;
        face = `<circle cx="72" cy="40" r="14" fill="#fff" stroke="none"/><circle cx="128" cy="40" r="14" fill="#fff" stroke="none"/>` + eye(72, 41) + eye(128, 41) +
          `<path d="M66 96 Q100 126 134 96" fill="#e85d75" stroke="${INK}" stroke-width="2.5"/>` + cheeks;
        break;
      case 'duck':
        back = `<path d="M96 26 Q92 6 104 10 Q100 16 108 22" fill="${f}"/>`;
        face = eyes + `<ellipse cx="100" cy="104" rx="22" ry="10" fill="${i}"/><path d="M80 104 Q100 110 120 104" fill="none" stroke="${INK}" stroke-width="2"/>` + cheeks;
        break;
      case 'penguin':
        face = `<path d="M100 66 Q80 46 62 62 Q46 84 60 112 Q78 136 100 134 Q122 136 140 112 Q154 84 138 62 Q120 46 100 66 Z" fill="${l}" stroke="none"/>` +
          eye(80, 88) + eye(120, 88) + `<path d="M90 102 L110 102 L100 114 Z" fill="${i}"/>` + cheeks;
        break;
      case 'lion': {
        let mane = `<circle cx="100" cy="82" r="72" fill="${i}"/>`;
        for (let a = 0; a < 360; a += 30) {
          const x = 100 + Math.cos((a * Math.PI) / 180) * 70, y = 82 + Math.sin((a * Math.PI) / 180) * 70;
          mane += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="16" fill="${i}"/>`;
        }
        mane += `<circle cx="100" cy="82" r="70" fill="${i}" stroke="none"/>`;
        back = mane + `<circle cx="58" cy="36" r="13" fill="${f}"/><circle cx="142" cy="36" r="13" fill="${f}"/>`;
        face = muzzle + eyes + nose() + smile() + cheeks;
        break;
      }
      case 'monkey':
        back = `<circle cx="40" cy="86" r="17" fill="${f}"/><circle cx="40" cy="86" r="9" fill="${l}" stroke="none"/><circle cx="160" cy="86" r="17" fill="${f}"/><circle cx="160" cy="86" r="9" fill="${l}" stroke="none"/>`;
        face = `<path d="M100 70 Q84 52 68 64 Q54 78 60 100 Q66 132 100 134 Q134 132 140 100 Q146 78 132 64 Q116 52 100 70 Z" fill="${l}" stroke="none"/>` + eye(82, 86) + eye(118, 86) +
          `<ellipse cx="96" cy="102" rx="2" ry="3" fill="#4a3038" stroke="none"/><ellipse cx="104" cy="102" rx="2" ry="3" fill="#4a3038" stroke="none"/>` + smile(112) + cheeks;
        break;
      case 'koala':
        back = `<circle cx="44" cy="50" r="26" fill="${f}"/><circle cx="46" cy="52" r="15" fill="${i}" stroke="none"/><circle cx="156" cy="50" r="26" fill="${f}"/><circle cx="154" cy="52" r="15" fill="${i}" stroke="none"/>`;
        face = eye(76, 84) + eye(124, 84) + `<ellipse cx="100" cy="98" rx="11" ry="15" fill="#3d3440" stroke="none"/>` + `<path d="M92 118 Q100 126 108 118" fill="none" stroke="${INK}" stroke-width="2.2"/>` + cheeks;
        break;
    }
    return back + headShape + face + front;
  }

  function tail(sp) {
    const S = SPECIES[sp];
    switch (sp) {
      case 'fox':
        return `<path d="M128 200 Q190 196 196 150 Q198 128 184 120 Q176 160 128 180 Z" fill="${S.fur}"/><path d="M196 150 Q198 128 184 120 Q180 138 186 150 Z" fill="#fff"/>`;
      case 'squirrel':
        return `<path d="M124 200 Q196 200 190 120 Q186 70 150 76 Q130 82 150 100 Q172 112 160 150 Q150 180 124 180 Z" fill="${S.fur}"/>`;
      case 'cat':
      case 'tiger':
      case 'lion':
      case 'monkey':
      case 'mouse':
        return `<path d="M130 196 Q176 200 172 166 Q170 150 182 146" fill="none" stroke="${INK}" stroke-width="10"/><path d="M130 196 Q176 200 172 166 Q170 150 182 146" fill="none" stroke="${sp === 'mouse' ? '#f8b4c8' : S.fur}" stroke-width="6"/>`;
      case 'bunny':
      case 'sheep':
        return `<circle cx="134" cy="196" r="12" fill="#fff"/>`;
      case 'pig':
        return `<path d="M134 192 q12 -4 10 6 q-2 8 8 4" fill="none" stroke="${S.inner}" stroke-width="4"/>`;
      default:
        return '';
    }
  }

  // ---------- items (standalone, centered at 0,0, ~80px) ----------
  const ITEMS = {
    shoe: (c) => `<path d="M-34 12 Q-38 -16 -14 -18 L2 -18 Q8 -2 28 2 Q42 6 40 18 L-34 18 Z" fill="${hex(c)}"/><path d="M-36 14 L40 14 L40 22 Q2 26 -36 22 Z" fill="#fff"/><path d="M-6 -12 L6 -4 M-10 -6 L2 2 M-2 -14 L10 -8" stroke="#fff" stroke-width="3"/>`,
    cap: (c) => `<path d="M-30 10 Q-30 -30 6 -30 Q36 -30 36 10 Z" fill="${hex(c)}"/><path d="M30 6 Q60 2 62 14 Q40 18 28 14 Z" fill="${shade(c, -0.2)}"/><circle cx="4" cy="-30" r="5" fill="${shade(c, -0.2)}"/>`,
    beanie: (c) => `<path d="M-32 14 Q-32 -34 0 -34 Q32 -34 32 14 Z" fill="${hex(c)}"/><rect x="-36" y="4" width="72" height="16" rx="7" fill="${shade(c, 0.35)}"/><circle cx="0" cy="-38" r="11" fill="#fff"/>`,
    backpack: (c) => `<rect x="-30" y="-34" width="60" height="70" rx="18" fill="${hex(c)}"/><path d="M-14 -34 Q0 -50 14 -34" fill="none" stroke="${INK}" stroke-width="5"/><rect x="-20" y="2" width="40" height="24" rx="8" fill="${shade(c, 0.3)}"/><path d="M-30 -10 Q0 4 30 -10" fill="none"/><circle cx="0" cy="-12" r="4" fill="#fff"/>`,
    scarf: (c) => `<path d="M-40 -14 Q0 -2 40 -14 L40 2 Q0 14 -40 2 Z" fill="${hex(c)}"/><path d="M14 -2 L22 34 L8 36 L2 2 Z" fill="${hex(c)}"/><path d="M-24 -9 L-24 7 M-8 -5 L-8 11 M24 -12 L24 4 M10 18 L20 17" stroke="#fff" stroke-width="4"/><path d="M8 36 l0 6 M13 36 l0 6 M18 35 l0 6" stroke="${hex(c)}" stroke-width="3"/>`,
    glasses: (c) => `<circle cx="-18" cy="0" r="15" fill="#e8f6ff" stroke="${hex(c)}" stroke-width="6"/><circle cx="18" cy="0" r="15" fill="#e8f6ff" stroke="${hex(c)}" stroke-width="6"/><path d="M-4 -2 Q0 -6 4 -2" fill="none" stroke="${hex(c)}" stroke-width="5"/><path d="M-33 -4 L-42 -10 M33 -4 L42 -10" stroke="${hex(c)}" stroke-width="5"/>`,
    bow: (c) => `<path d="M0 0 L-30 -18 Q-36 0 -30 18 Z" fill="${hex(c)}"/><path d="M0 0 L30 -18 Q36 0 30 18 Z" fill="${hex(c)}"/><circle r="8" fill="${shade(c, -0.15)}"/>`,
    balloon: (c) => `<path d="M0 26 Q-6 40 4 56" fill="none" stroke="${INK}" stroke-width="2"/><ellipse cx="0" cy="0" rx="22" ry="27" fill="${hex(c)}"/><path d="M-4 26 L4 26 L0 31 Z" fill="${hex(c)}"/><ellipse cx="-8" cy="-10" rx="5" ry="8" fill="#fff" opacity=".6" stroke="none"/>`,
    flower: (c) => { let p = ''; for (let a = 0; a < 360; a += 72) { const x = Math.cos(a * Math.PI / 180) * 12, y = Math.sin(a * Math.PI / 180) * 12 - 14; p += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="${hex(c)}"/>`; } return `<path d="M0 0 L0 36" stroke="#4caf50" stroke-width="4"/><ellipse cx="9" cy="22" rx="9" ry="4" fill="#81c784" transform="rotate(-30 9 22)"/>` + p + `<circle cx="0" cy="-14" r="7" fill="#ffd54f"/>`; },
    apple: (c) => `<path d="M0 -14 Q-24 -26 -26 0 Q-24 26 0 22 Q24 26 26 0 Q24 -26 0 -14 Z" fill="${hex(c)}"/><path d="M0 -14 L2 -26" stroke="${INK}" stroke-width="3"/><ellipse cx="9" cy="-24" rx="8" ry="4" fill="#81c784" transform="rotate(-25 9 -24)"/><ellipse cx="-10" cy="-4" rx="4" ry="7" fill="#fff" opacity=".5" stroke="none"/>`,
    lollipop: (c) => `<path d="M0 10 L0 52" stroke="#fff" stroke-width="5"/><circle r="20" fill="${hex(c)}"/><path d="M0 0 m-12 0 a12 12 0 1 1 12 12 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4" fill="none" stroke="#fff" stroke-width="3.5"/>`,
    umbrella: (c, p) => `<path d="M0 0 L0 44 Q0 52 -8 52 Q-14 52 -14 46" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-46 4 Q-44 -40 0 -42 Q44 -40 46 4 Q38 -4 30 4 Q22 -4 15 4 Q7 -4 0 4 Q-7 -4 -15 4 Q-22 -4 -30 4 Q-38 -4 -46 4 Z" fill="${fillOf(c, p)}"/><circle cx="0" cy="-44" r="3" fill="${INK}"/>`,
    kite: (c, p) => `<path d="M0 -44 L30 -4 L0 40 L-30 -4 Z" fill="${fillOf(c, p)}"/><path d="M0 -44 L0 40 M-30 -4 L30 -4" stroke="${INK}" stroke-width="2"/><path d="M0 40 Q10 52 0 62 Q-10 72 4 82" fill="none" stroke="${INK}" stroke-width="2"/><path d="M-4 54 l8 -6 M-2 70 l8 -6" stroke="${hex(c)}" stroke-width="5"/>`,
    towel: (c, p) => `<rect x="-44" y="-20" width="88" height="46" rx="6" fill="${fillOf(c, p)}"/><path d="M-44 26 l0 6 M-30 26 l0 6 M-16 26 l0 6 M-2 26 l0 6 M12 26 l0 6 M26 26 l0 6 M40 26 l0 6" stroke="${INK}" stroke-width="2"/>`,
    mitten: (c) => `<path d="M-14 26 L-16 -8 Q-16 -26 2 -26 Q18 -26 18 -8 L18 26 Z" fill="${hex(c)}"/><path d="M-16 -2 Q-30 -8 -26 -18 Q-20 -24 -14 -14" fill="${hex(c)}"/><rect x="-18" y="18" width="40" height="12" rx="4" fill="#fff"/>`,
    icecream: (c) => `<path d="M-14 0 L0 40 L14 0 Z" fill="#f5c27a"/><path d="M-10 8 L6 20 M-6 2 L10 14" stroke="#d99b4a" stroke-width="2"/><circle cx="0" cy="-8" r="16" fill="${hex(c)}"/>`,
  };
  function item(type, color, x, y, scale = 1, rot = 0, pattern) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${scale})" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${ITEMS[type](color, pattern)}</g>`;
  }
  const sparkle = (x, y) =>
    `<g stroke="#ffc400" stroke-width="5" stroke-linecap="round"><path d="M${x - 30} ${y - 34} l-10 -10"/><path d="M${x} ${y - 44} l0 -14"/><path d="M${x + 30} ${y - 34} l10 -10"/></g>`;

  // ---------- character ----------
  // c = {sp, shirt:{color,pattern}, bottom:{type,color}, shoes:{color,missing,muddy}, hat:{type,color}, glasses, scarf, bow, backpack, held:{type,color}, smear, paint}
  function character(c) {
    const S = SPECIES[c.sp];
    const limb = S.limb || S.fur;
    let o = `<ellipse cx="100" cy="232" rx="66" ry="11" fill="#cfe6f7" stroke="none"/>`;
    o += `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">`;
    o += tail(c.sp);
    if (c.backpack) o += `<rect x="40" y="124" width="120" height="72" rx="22" fill="${hex(c.backpack)}"/>`;
    // legs
    o += `<rect x="74" y="186" width="20" height="34" rx="9" fill="${limb}"/><rect x="106" y="186" width="20" height="34" rx="9" fill="${limb}"/>`;
    // shoes
    const sh = c.shoes || { color: 'blue' };
    const shoe = (x, missing) => {
      if (missing) {
        return `<ellipse cx="${x}" cy="222" rx="13" ry="9" fill="#ffffff"/><path d="M${x - 12} 216 Q${x} 212 ${x + 12} 216" stroke="#f48fb1" stroke-width="4" fill="none"/>`;
      }
      return `<path d="M${x - 17} 228 Q${x - 18} 212 ${x} 212 Q${x + 18} 212 ${x + 17} 228 Z" fill="${hex(sh.color)}"/><path d="M${x - 17} 227 L${x + 17} 227" stroke="#fff" stroke-width="3"/><path d="M${x - 5} 216 L${x + 5} 216 M${x - 5} 220 L${x + 5} 220" stroke="#fff" stroke-width="2"/>` +
        (sh.muddy ? `<ellipse cx="${x - 6}" cy="224" rx="7" ry="4" fill="#7a5230" stroke="none"/><circle cx="${x + 9}" cy="219" r="4" fill="#7a5230" stroke="none"/><circle cx="${x + 3}" cy="206" r="3" fill="#7a5230" stroke="none"/>` : '');
    };
    o += shoe(84, sh.missing === 'L') + shoe(116, sh.missing === 'R');
    // bottom
    const b = c.bottom || { type: 'pants', color: 'blue' };
    if (b.type === 'skirt') o += `<path d="M66 168 L134 168 L148 202 Q100 210 52 202 Z" fill="${hex(b.color)}"/>`;
    else o += `<rect x="66" y="172" width="68" height="26" rx="9" fill="${hex(b.color)}"/><path d="M100 184 L100 198"/>`;
    // shirt
    const st = c.shirt || { color: 'red', pattern: 'plain' };
    o += `<rect x="62" y="132" width="76" height="52" rx="22" fill="${fillOf(st.color, st.pattern)}"/>`;
    if (c.paint) o += `<circle cx="84" cy="164" r="5" fill="${hex(c.paint)}" stroke="none"/><circle cx="112" cy="150" r="4" fill="${hex(c.paint)}" stroke="none"/><circle cx="120" cy="172" r="3" fill="${hex(c.paint)}" stroke="none"/>`;
    if (c.backpack) o += `<path d="M78 136 L76 180 M122 136 L124 180" stroke="${hex(c.backpack)}" stroke-width="10"/>`;
    // arms
    const paw = c.paint ? hex(c.paint) : limb;
    o += `<ellipse cx="60" cy="158" rx="12" ry="20" fill="${fillOf(st.color, st.pattern)}" transform="rotate(25 60 158)"/><circle cx="53" cy="177" r="${c.paint ? 13 : 10}" fill="${paw}"/>` + (c.paint ? `<path d="M48 188 q2 10 5 0 M58 188 q2 8 4 0" stroke="${hex(c.paint)}" stroke-width="4"/>` : '');
    o += `<ellipse cx="140" cy="158" rx="12" ry="20" fill="${fillOf(st.color, st.pattern)}" transform="rotate(-25 140 158)"/>`;
    // head
    o += head(c.sp);
    if (c.smear) o += `<g stroke="${INK}" stroke-width="1.5"><path d="M104 110 q10 -12 24 -4 q12 8 4 20 q-4 6 -2 14 q-3 6 -6 0 q0 -6 -6 -6 q-16 0 -14 -24 Z" fill="${hex(c.smear)}"/><path d="M66 112 q8 -8 16 0 q4 8 -4 12 q-12 4 -12 -12 Z" fill="${hex(c.smear)}"/></g><circle cx="120" cy="112" r="3" fill="#fff" stroke="none"/>`;
    if (c.glasses) {
      const gy = c.sp === 'frog' ? 41 : 85, gx = c.sp === 'frog' ? 28 : 22;
      o += `<circle cx="${100 - gx}" cy="${gy}" r="14" fill="#e8f6ff" fill-opacity=".25" stroke="${hex(c.glasses)}" stroke-width="5"/><circle cx="${100 + gx}" cy="${gy}" r="14" fill="#e8f6ff" fill-opacity=".25" stroke="${hex(c.glasses)}" stroke-width="5"/><path d="M${100 - gx + 14} ${gy} Q100 ${gy - 6} ${100 + gx - 14} ${gy}" fill="none" stroke="${hex(c.glasses)}" stroke-width="4"/>`;
    }
    if (c.hat) {
      const h = c.hat;
      if (h.type === 'cap') o += `<path d="M50 44 Q54 -6 100 -6 Q146 -6 150 44 Z" fill="${hex(h.color)}"/><path d="M130 40 Q178 30 184 48 Q156 54 128 50 Z" fill="${shade(h.color, -0.2)}"/><circle cx="100" cy="-6" r="6" fill="${shade(h.color, -0.2)}"/>`;
      else if (h.type === 'beanie') o += `<path d="M48 50 Q50 -10 100 -10 Q150 -10 152 50 Z" fill="${hex(h.color)}"/><rect x="44" y="38" width="112" height="18" rx="8" fill="${shade(h.color, 0.35)}"/><circle cx="100" cy="-14" r="12" fill="#fff"/>`;
    }
    if (c.bow) o += `<g transform="translate(138 30) rotate(20) scale(.8)">${ITEMS.bow(c.bow)}</g>`;
    if (c.scarf) o += `<rect x="62" y="126" width="76" height="16" rx="8" fill="${hex(c.scarf)}"/><path d="M110 136 L122 136 L126 168 L112 168 Z" fill="${hex(c.scarf)}"/><path d="M76 128 L76 140 M92 128 L92 140 M114 150 L124 150" stroke="#fff" stroke-width="3.5"/>`;
    // right paw + held item
    if (c.held) {
      const h = c.held;
      if (h.type === 'balloon') o += `<path d="M150 172 Q160 120 168 80" fill="none" stroke="${INK}" stroke-width="2"/><g transform="translate(170 46) scale(1.25)">${ITEMS.balloon(h.color).replace(/<path d="M0 26 Q-6 40 4 56"[^>]*\/>/, '')}</g>`;
      else if (h.type === 'flower') o += `<g transform="translate(160 140) rotate(10) scale(1.35)">${ITEMS.flower(h.color)}</g>`;
      else if (h.type === 'lollipop') o += `<g transform="translate(174 128) scale(1.15)">${ITEMS.lollipop(h.color)}</g>`;
      else if (h.type === 'apple') o += `<g transform="translate(166 160) scale(1)">${ITEMS.apple(h.color)}</g>`;
      else if (h.type === 'icecream') o += `<g transform="translate(160 136) scale(1.2)">${ITEMS.icecream(h.color)}</g>`;
    }
    o += `<circle cx="147" cy="177" r="${c.paint ? 13 : 10}" fill="${paw}"/>` + (c.paint ? `<path d="M142 188 q2 10 5 0 M152 188 q2 8 4 0" stroke="${hex(c.paint)}" stroke-width="4"/>` : '');
    o += `</g>`;
    return o;
  }

  function charSVG(c, { silhouette = false, w, h } = {}) {
    const body = silhouette ? `<g filter="url(#sil)">${character(c)}</g>` : character(c);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 -40 260 290"${w ? ` width="${w}" height="${h}"` : ''}>${defs()}${body}</svg>`;
  }

  // ---------- scenes (800 x 450) ----------
  const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff" stroke="none"><circle cx="0" cy="0" r="22"/><circle cx="24" cy="-10" r="26"/><circle cx="50" cy="0" r="20"/><rect x="0" y="0" width="50" height="20"/></g>`;
  const tree = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" stroke="${INK}" stroke-width="2.5"><rect x="-12" y="-10" width="24" height="90" rx="6" fill="#a1764a"/><circle cx="0" cy="-40" r="55" fill="#7cc576"/><circle cx="-40" cy="-10" r="36" fill="#7cc576"/><circle cx="40" cy="-10" r="36" fill="#7cc576"/></g>`;
  const SCENES = {
    classroom: { name: 'lớp học', draw: () =>
      `<rect width="800" height="450" fill="#fdf1d6"/><rect y="300" width="800" height="150" fill="url(#planks)"/><rect y="292" width="800" height="12" fill="#d9a66a"/>` +
      `<g stroke="${INK}" stroke-width="3"><rect x="250" y="60" width="300" height="170" rx="8" fill="#3f7d5e"/><rect x="250" y="60" width="300" height="170" rx="8" fill="none" stroke="#b07a42" stroke-width="10"/>` +
      `<rect x="40" y="50" width="150" height="120" fill="#bfe6ff"/><path d="M115 50 V170 M40 110 H190"/><path d="M30 44 H200" stroke-width="6"/><path d="M40 50 Q60 110 40 170 M190 50 Q170 110 190 170" fill="#c5e86c"/>` +
      `<rect x="620" y="150" width="130" height="150" fill="#d9a66a"/><path d="M620 200 H750 M620 250 H750"/><rect x="632" y="160" width="12" height="38" fill="#ef5350"/><rect x="648" y="164" width="12" height="34" fill="#42a5f5"/><rect x="664" y="158" width="12" height="40" fill="#ffd54f"/><rect x="636" y="210" width="12" height="38" fill="#66bb6a"/><rect x="652" y="214" width="12" height="34" fill="#ab7ae0"/></g>` +
      `<path d="M370 110 l30 -16 l30 16 l0 50 l-30 -16 l-30 16 Z M400 94 V144" fill="none" stroke="#dff2e8" stroke-width="3"/>` },
    park: { name: 'công viên', draw: () =>
      `<rect width="800" height="450" fill="#bfe6ff"/><circle cx="700" cy="70" r="40" fill="#ffe066"/>${cloud(120, 70)}${cloud(420, 50, 0.8)}<rect y="260" width="800" height="190" fill="#a5d88f"/><path d="M0 260 Q200 230 400 260 T800 255 V270 H0 Z" fill="#8fcf78"/>` +
      `${tree(110, 220)}${tree(690, 230, 0.8)}<g stroke="${INK}" stroke-width="3"><rect x="520" y="250" width="140" height="14" rx="4" fill="#c98b55"/><rect x="520" y="226" width="140" height="14" rx="4" fill="#c98b55"/><path d="M535 264 V290 M645 264 V290" stroke-width="6"/></g>` },
    beach: { name: 'bãi biển', draw: () =>
      `<rect width="800" height="450" fill="#bfe6ff"/><circle cx="110" cy="80" r="42" fill="#ffe066"/>${cloud(500, 60)}<rect y="190" width="800" height="90" fill="#4fc3f7"/><path d="M0 200 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" fill="none" stroke="#fff" stroke-width="3"/>` +
      `<path d="M0 270 Q400 240 800 270 V450 H0 Z" fill="#ffe0a3"/><g stroke="${INK}" stroke-width="3"><path d="M690 300 Q680 200 700 140" fill="none" stroke="#a1764a" stroke-width="14"/><path d="M700 140 q-60 -10 -80 20 M700 140 q60 -10 80 20 M700 140 q-30 -40 -70 -40 M700 140 q30 -40 70 -40" fill="none" stroke="#4caf50" stroke-width="12"/></g><path d="M120 360 l10 -8 l10 8 l-4 -12 l10 -8 l-12 0 l-4 -12 l-4 12 l-12 0 l10 8 Z" fill="#ff8a65" stroke="${INK}" stroke-width="2"/>` },
    kitchen: { name: 'nhà bếp', draw: () =>
      `<rect width="800" height="450" fill="url(#tiles)"/><rect y="320" width="800" height="130" fill="#f6d7a7"/><g stroke="${INK}" stroke-width="3"><rect x="20" y="180" width="220" height="140" fill="#fff3e0"/><rect x="20" y="168" width="220" height="16" fill="#d9a66a"/><circle cx="70" cy="250" r="6" fill="${INK}"/><circle cx="190" cy="250" r="6" fill="${INK}"/>` +
      `<rect x="580" y="40" width="160" height="90" rx="6" fill="#fff3e0"/><path d="M660 40 V130"/><rect x="40" y="60" width="90" height="70" rx="4" fill="#bfe6ff"/><path d="M85 60 V130 M40 95 H130"/>` +
      `<path d="M250 260 H600 L600 276 H250 Z" fill="#ffb3b3"/><path d="M250 276 L240 330 M600 276 L610 330" stroke-width="8"/><path d="M270 276 Q300 300 330 276 Q360 300 390 276 Q420 300 450 276 Q480 300 510 276 Q540 300 570 276" fill="#fff"/></g>` },
    bedroom: { name: 'phòng ngủ', draw: () =>
      `<rect width="800" height="450" fill="#f8e1ef"/><rect y="310" width="800" height="140" fill="#e9c48f"/><ellipse cx="400" cy="390" rx="200" ry="40" fill="#b3e5fc" stroke="${INK}" stroke-width="3"/>` +
      `<g stroke="${INK}" stroke-width="3"><rect x="520" y="180" width="250" height="110" rx="12" fill="#90caf9"/><rect x="520" y="140" width="40" height="160" rx="8" fill="#c98b55"/><rect x="540" y="196" width="70" height="40" rx="14" fill="#fff"/><path d="M760 290 V320 M535 300 V320" stroke-width="8"/>` +
      `<rect x="60" y="80" width="110" height="90" fill="#bfe6ff"/><circle cx="115" cy="125" r="22" fill="#ffe066"/><path d="M60 80 H170" stroke-width="5"/><rect x="230" y="210" width="50" height="100" rx="6" fill="#d9a66a"/><path d="M255 210 V170" /><path d="M230 170 L280 170 L265 140 L245 140 Z" fill="#ffe066"/></g>` },
    garden: { name: 'khu vườn', draw: () =>
      `<rect width="800" height="450" fill="#cdeeff"/><circle cx="90" cy="70" r="40" fill="#ffe066"/>${cloud(560, 70)}<rect y="250" width="800" height="200" fill="#9ed67f"/>` +
      `<g stroke="${INK}" stroke-width="3">${Array.from({ length: 17 }, (_, k) => `<path d="M${k * 50 + 5} 260 V196 l12 -14 l12 14 V260 Z" fill="#fff8e7"/>`).join('')}<path d="M0 214 H800 M0 244 H800" stroke-width="6" stroke="#e8d4b0"/></g>` +
      `${[60, 150, 680, 760].map((x, k) => item('flower', COLOR_KEYS[k * 2 % 7], x, 300, 0.8)).join('')}` },
    playground: { name: 'sân chơi', draw: () =>
      `<rect width="800" height="450" fill="#bfe6ff"/>${cloud(80, 60)}${cloud(600, 80, 0.7)}<rect y="270" width="800" height="180" fill="#a5d88f"/>` +
      `<g stroke="${INK}" stroke-width="4"><path d="M60 280 L60 120 M180 280 L180 120 M50 120 H190" stroke="#ef5350" stroke-width="10"/><path d="M90 120 V220 M130 120 V220" stroke-width="2.5"/><rect x="80" y="220" width="60" height="10" rx="3" fill="#ffd54f"/>` +
      `<path d="M600 280 V140 M640 280 V140" stroke="#42a5f5" stroke-width="10"/><rect x="590" y="130" width="60" height="14" fill="#42a5f5"/><path d="M640 140 Q700 160 740 280 L770 280 Q730 160 650 120 Z" fill="#ffa040"/><path d="M600 160 H640 M600 200 H640 M600 240 H640" stroke-width="5"/></g>` },
    livingroom: { name: 'phòng khách', draw: () =>
      `<rect width="800" height="450" fill="#e6f4e4"/><rect y="310" width="800" height="140" fill="url(#planks)"/><g stroke="${INK}" stroke-width="3">` +
      `<rect x="40" y="170" width="300" height="100" rx="20" fill="#ffab91"/><rect x="20" y="200" width="50" height="100" rx="18" fill="#ff8a65"/><rect x="310" y="200" width="50" height="100" rx="18" fill="#ff8a65"/><rect x="60" y="240" width="270" height="60" rx="10" fill="#ff8a65"/>` +
      `<rect x="440" y="60" width="120" height="90" fill="#fff"/><path d="M450 140 l30 -40 l20 25 l15 -15 l35 30 Z" fill="#81c784"/><circle cx="530" cy="85" r="10" fill="#ffd54f"/>` +
      `<rect x="640" y="90" width="110" height="220" rx="6" fill="#c98b55"/><circle cx="728" cy="200" r="6" fill="#ffd54f"/></g>` },
    snow: { name: 'sân tuyết', draw: () =>
      `<rect width="800" height="450" fill="#cfe3f5"/>${Array.from({ length: 40 }, (_, k) => `<circle cx="${(k * 97) % 800}" cy="${(k * 53) % 260}" r="${3 + (k % 3)}" fill="#fff"/>`).join('')}<path d="M0 260 Q400 220 800 260 V450 H0 Z" fill="#fbfdff" stroke="${INK}" stroke-width="2"/>` +
      `<g stroke="${INK}" stroke-width="3"><circle cx="650" cy="250" r="50" fill="#fff"/><circle cx="650" cy="175" r="35" fill="#fff"/><circle cx="640" cy="168" r="4" fill="${INK}"/><circle cx="660" cy="168" r="4" fill="${INK}"/><path d="M650 178 l22 6 l-22 4 Z" fill="#ffa040"/></g>` +
      `<g transform="translate(140 220)"><path d="M0 -90 L-50 0 H50 Z M0 -60 L-60 40 H60 Z" fill="#6fbf73" stroke="${INK}" stroke-width="3"/><rect x="-10" y="40" width="20" height="30" fill="#a1764a" stroke="${INK}" stroke-width="3"/></g>` },
  };

  function sceneSVG(sceneKey, extra, attrs = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"${attrs}>${defs()}${SCENES[sceneKey].draw()}${extra || ''}</svg>`;
  }

  // ---------- clue props ----------
  const PROPS = {
    paintSpill: (c, x, y) =>
      `<g stroke="${INK}" stroke-width="3"><path d="M${x - 70} ${y + 10} q-20 -30 20 -34 q30 -20 70 -6 q50 -4 60 22 q20 30 -30 34 q-40 14 -80 2 q-50 4 -40 -18 Z" fill="${hex(c)}"/>` +
      `<g transform="translate(${x + 60} ${y - 20}) rotate(-70)"><rect x="-26" y="-30" width="52" height="60" rx="6" fill="#cfd8dc"/><ellipse cx="0" cy="-30" rx="26" ry="8" fill="${hex(c)}"/><path d="M-26 -10 H26" /></g></g>` +
      [0, 1, 2].map((k) => paw(c, x - 140 - k * 70, y + 30 - k * 14)).join(''),
    mudTrail: (x, y) =>
      [0, 1, 2, 3, 4].map((k) => `<g transform="translate(${x - k * 80} ${y + (k % 2) * 30}) rotate(-80)"><path d="M-22 -10 Q-24 -22 0 -22 Q24 -22 22 -6 L22 10 Q0 18 -22 10 Z" fill="#7a5230" opacity=".85"/></g>`).join('') +
      `<path d="M${x + 60} ${y - 10} q40 -30 90 -10 q40 20 -10 40 q-60 14 -80 -30 Z" fill="#8d6340" stroke="${INK}" stroke-width="3"/>`,
    table: (x, y) => `<g stroke="${INK}" stroke-width="3"><ellipse cx="${x}" cy="${y}" rx="160" ry="30" fill="#d9a66a"/><path d="M${x - 120} ${y + 20} V${y + 110} M${x + 120} ${y + 20} V${y + 110}" stroke-width="10"/><ellipse cx="${x}" cy="${y - 6}" rx="90" ry="16" fill="#fff"/></g>`,
    cake: (c, x, y) => `<g stroke="${INK}" stroke-width="3"><path d="M${x - 70} ${y - 60} L${x - 70} ${y} Q${x} ${y + 20} ${x + 30} ${y + 6} L${x} ${y - 52} Z" fill="#fff3d6"/><path d="M${x - 70} ${y - 60} Q${x - 35} ${y - 80} ${x} ${y - 52} L${x - 30} ${y - 66} Z" fill="${hex(c)}"/><path d="M${x - 70} ${y - 60} Q${x - 50} ${y - 40} ${x - 40} ${y - 55} Q${x - 25} ${y - 35} ${x} ${y - 52}" fill="${hex(c)}"/><path d="M${x - 70} ${y - 30} Q${x - 20} ${y - 10} ${x + 14} ${y - 22}" fill="none" stroke="${hex(c)}" stroke-width="7"/><path d="M${x} ${y - 52} L${x + 30} ${y + 6}" stroke-dasharray="6 6"/><circle cx="${x - 40}" cy="${y - 70}" r="8" fill="#ef5350"/></g>` +
      [[30, -6], [44, 2], [56, -10], [64, 4]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="4" fill="${hex(c)}" stroke="${INK}" stroke-width="1.5"/>`).join(''),
    bowl: (c, x, y) => `<g stroke="${INK}" stroke-width="3"><circle cx="${x - 30}" cy="${y - 36}" r="22" fill="${hex(c)}"/><circle cx="${x + 2}" cy="${y - 40}" r="22" fill="${hex(c)}"/><path d="M${x - 60} ${y - 24} Q${x - 20} ${y + 30} ${x + 40} ${y - 24} Z" fill="#b3e5fc"/><path d="M${x + 40} ${y - 30} q10 -20 4 -40" fill="none" stroke-width="5"/><path d="M${x - 58} ${y - 22} q-4 18 4 20 q6 -2 2 -16" fill="${hex(c)}"/></g>`,
    jar: (c, x, y) => `<g stroke="${INK}" stroke-width="3"><path d="M${x - 40} ${y - 70} H${x + 40} V${y} Q${x + 40} ${y + 10} ${x + 30} ${y + 10} H${x - 30} Q${x - 40} ${y + 10} ${x - 40} ${y} Z" fill="#fff8e1" fill-opacity=".9"/><rect x="${x - 36}" y="${y - 30}" width="72" height="38" rx="6" fill="${hex(c)}"/><rect x="${x - 46}" y="${y - 82}" width="92" height="16" rx="4" fill="#d9a66a" transform="rotate(-18 ${x} ${y - 74})"/>` +
      `<path d="M${x + 40} ${y - 60} q14 10 6 34 q-4 14 6 30" fill="none" stroke="${hex(c)}" stroke-width="10"/></g>`,
    melon: (x, y) => `<g stroke="${INK}" stroke-width="3"><path d="M${x - 70} ${y - 10} A70 70 0 0 0 ${x + 70} ${y - 10} Z" fill="#66bb6a"/><path d="M${x - 62} ${y - 10} A62 62 0 0 0 ${x + 62} ${y - 10} Z" fill="#ef5350"/><path d="M${x - 10} ${y - 10} L${x + 14} ${y + 50}" stroke-dasharray="6 6"/>${[[-40, 6], [-20, 24], [0, 10], [-30, 30]].map(([dx, dy]) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="3" ry="5" fill="${INK}" stroke="none"/>`).join('')}</g>`,
    photo: (c, x, y) => `<g stroke="${INK}" stroke-width="3"><rect x="${x - 110}" y="${y - 120}" width="220" height="240" rx="10" fill="#d9a66a"/><rect x="${x - 94}" y="${y - 104}" width="188" height="208" rx="4" fill="#fffbe8"/></g><svg x="${x - 94}" y="${y - 104}" width="188" height="208" viewBox="-30 -40 260 290">${character(c)}</svg>`,
    spotlight: (c, x, y) => `<ellipse cx="${x}" cy="${y}" rx="190" ry="180" fill="#fff8c9" opacity=".85"/><svg x="${x - 160}" y="${y - 180}" width="320" height="360" viewBox="-30 -40 260 290"><g filter="url(#sil)">${character(c)}</g></svg>`,
    hanger: (part, c, x, y) => {
      let inner;
      if (part === 'shirt') inner = `<path d="M-50 -40 L-20 -50 Q0 -36 20 -50 L50 -40 L64 -6 L40 2 L40 50 L-40 50 L-40 2 L-64 -6 Z" fill="${hex(c)}"/>`;
      else if (part === 'hat') inner = ITEMS.cap(c);
      else inner = `<g transform="translate(-34 0) scale(.8)">${ITEMS.shoe(c)}</g><g transform="translate(34 6) scale(.8)">${ITEMS.shoe(c)}</g>`;
      return `<g transform="translate(${x} ${y})" stroke="${INK}" stroke-width="3" stroke-linejoin="round"><rect x="-90" y="-90" width="180" height="170" rx="14" fill="#fff" fill-opacity=".85"/>${inner}</g>`;
    },
  };
  function paw(c, x, y) {
    return `<g fill="${hex(c)}" opacity=".85"><ellipse cx="${x}" cy="${y}" rx="12" ry="10"/><circle cx="${x - 12}" cy="${y - 13}" r="5"/><circle cx="${x}" cy="${y - 17}" r="5"/><circle cx="${x + 12}" cy="${y - 13}" r="5"/></g>`;
  }
  // a group of collectibles with one gone
  function takenProp(kind, colors, missingIdx) {
    let s = '';
    if (kind === 'balloon') {
      s += `<g stroke="${INK}" stroke-width="3"><rect x="340" y="250" width="120" height="70" rx="8" fill="#fff3e0"/><path d="M340 250 L460 250" stroke-width="5"/><path d="M350 320 V360 M450 320 V360" stroke-width="6"/></g>`;
      colors.forEach((c, k) => {
        const x = 330 + k * (140 / (colors.length - 1 || 1)), y = 110 + (k % 2) * 24;
        if (k === missingIdx) s += `<path d="M400 250 Q${x - 6} 200 ${x} ${y + 60}" fill="none" stroke="${INK}" stroke-width="2"/><path d="M${x - 4} ${y + 58} l8 4 l-6 2" fill="none" stroke="${INK}" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="22" ry="27" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 6"/><text x="${x}" y="${y + 10}" font-size="30" text-anchor="middle" fill="${INK}" font-family="sans-serif" font-weight="bold">?</text>`;
        else s += `<path d="M400 250 Q${x - 6} 200 ${x} ${y + 30}" fill="none" stroke="${INK}" stroke-width="2"/>` + item('balloon', c, x, y, 1).replace(/<path d="M0 26 Q-6 40 4 56"[^>]*\/>/, '');
      });
    } else if (kind === 'flower') {
      s += `<rect x="220" y="330" width="360" height="40" rx="18" fill="#8d6340" stroke="${INK}" stroke-width="3"/>`;
      colors.forEach((c, k) => {
        const x = 260 + k * (280 / (colors.length - 1 || 1));
        if (k === missingIdx) s += `<path d="M${x} 340 L${x} 300 L${x + 6} 292" stroke="#4caf50" stroke-width="5" fill="none"/><circle cx="${x}" cy="270" r="24" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 6"/><text x="${x}" y="281" font-size="30" text-anchor="middle" fill="${INK}" font-family="sans-serif" font-weight="bold">?</text>`;
        else s += item('flower', c, x, 300, 1.4);
      });
    } else if (kind === 'apple') {
      s += tree(400, 270, 1.6);
      const pos = [[340, 160], [410, 120], [470, 180], [360, 230], [440, 240]];
      colors.forEach((c, k) => {
        const [x, y] = pos[k];
        if (k === missingIdx) s += `<path d="M${x} ${y - 20} l2 -10" stroke="${INK}" stroke-width="3"/><circle cx="${x}" cy="${y}" r="22" fill="#fff" fill-opacity=".4" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 6"/><text x="${x}" y="${y + 10}" font-size="28" text-anchor="middle" fill="${INK}" font-family="sans-serif" font-weight="bold">?</text>`;
        else s += item('apple', c, x, y, 0.9);
      });
    } else if (kind === 'lollipop') {
      s += `<g stroke="${INK}" stroke-width="3"><path d="M300 360 L320 220 H480 L500 360 Z" fill="#fff8e1" fill-opacity=".9"/><rect x="310" y="206" width="180" height="20" rx="6" fill="#ef9a9a"/></g>`;
      colors.forEach((c, k) => {
        const x = 340 + k * (120 / (colors.length - 1 || 1)), y = 170 - (k % 2) * 20;
        if (k === missingIdx) s += `<path d="M${x} 230 L${x} 196" stroke="#fff" stroke-width="5"/><circle cx="${x}" cy="${y}" r="20" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 6"/><text x="${x}" y="${y + 10}" font-size="28" text-anchor="middle" fill="${INK}" font-family="sans-serif" font-weight="bold">?</text>`;
        else s += item('lollipop', c, x, y, 1);
      });
    }
    return s;
  }

  const api = { COLORS, COLOR_KEYS, SPECIES, SPECIES_KEYS, SCENES, hex, defs, character, charSVG, sceneSVG, item, sparkle, PROPS, takenProp, paw };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Art = api;
})(typeof window !== 'undefined' ? window : globalThis);
