/* little steps — squishy creature renderer (pure SVG, no images) */
(function () {
  const INK = '#2f2626';

  /* ---------- color + math helpers ---------- */
  function rgb(h) { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hex(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); }
  const shade = (c, amt) => amt < 0 ? mix(c, '#000000', -amt) : mix(c, '#ffffff', amt);
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const f = n => (+n).toFixed(1);
  const MIRROR = s => `<g transform="matrix(-1 0 0 1 240 0)">${s}</g>`;
  let UID = 0;

  const star4 = (x, y, r, fill, op = 1) => `<path d="M${f(x)} ${f(y - r)} Q${f(x + r * .18)} ${f(y - r * .18)} ${f(x + r)} ${f(y)} Q${f(x + r * .18)} ${f(y + r * .18)} ${f(x)} ${f(y + r)} Q${f(x - r * .18)} ${f(y + r * .18)} ${f(x - r)} ${f(y)} Q${f(x - r * .18)} ${f(y - r * .18)} ${f(x)} ${f(y - r)}Z" fill="${fill}" opacity="${op}"/>`;
  const star5 = (x, y, r, fill, extra = '') => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; p += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr); } return `<path d="${p}Z" fill="${fill}" stroke-linejoin="round" ${extra}/>`; };
  const heart = (x, y, s, fill, extra = '') => `<path d="M${f(x)} ${f(y + s * .95)} C${f(x - s * 1.5)} ${f(y)} ${f(x - s * 1.05)} ${f(y - s * 1.1)} ${f(x)} ${f(y - s * .35)} C${f(x + s * 1.05)} ${f(y - s * 1.1)} ${f(x + s * 1.5)} ${f(y)} ${f(x)} ${f(y + s * .95)}Z" fill="${fill}" ${extra}/>`;

  /* ---------- body shapes ---------- */
  // T = top of head, F = eye line, hw = half width near the bottom, ew = eye spacing, ex/ey = ear base
  const SHAPES = {
    dome: { d: 'M120 70 C178 70 206 122 208 168 C210 204 172 214 120 214 C68 214 30 204 32 168 C34 122 62 70 120 70Z', T: 70, F: 150, hw: 88, ew: 25, ex: 42, ey: 90 },
    round: { d: 'M120 76 C162 76 192 106 192 146 C192 190 160 214 120 214 C80 214 48 190 48 146 C48 106 78 76 120 76Z', T: 76, F: 144, hw: 72, ew: 24, ex: 38, ey: 96 },
    bean: { d: 'M120 50 C166 50 184 98 186 148 C188 200 160 214 120 214 C80 214 52 200 54 148 C56 98 74 50 120 50Z', T: 50, F: 128, hw: 66, ew: 22, ex: 32, ey: 68 },
    mochi: { d: 'M120 100 C186 100 222 140 222 180 C222 208 184 214 120 214 C56 214 18 208 18 180 C18 140 54 100 120 100Z', T: 100, F: 166, hw: 100, ew: 28, ex: 54, ey: 116 },
    drop: { d: 'M120 46 C130 80 198 110 198 164 C198 202 166 214 120 214 C74 214 42 202 42 164 C42 110 110 80 120 46Z', T: 54, F: 152, hw: 78, ew: 24, ex: 26, ey: 92 },
    blob: { d: 'M120 66 C152 60 170 84 188 104 C208 126 216 162 206 188 C198 210 166 214 120 214 C74 214 40 212 32 188 C22 160 34 124 56 102 C74 84 90 70 120 66Z', T: 68, F: 148, hw: 88, ew: 25, ex: 40, ey: 88 }
  };

  const OPT = {
    shape: { dome: 'Dome', round: 'Ball', bean: 'Bean', mochi: 'Mochi', drop: 'Drop', blob: 'Wobbly' },
    material: { classic: 'Soft', jelly: 'Jelly', goo: 'Gooey', cheesy: 'Cheesy', metal: 'Metallic', glitter: 'Glitter', fluffy: 'Fuzzy', cloud: 'Cloud', crystal: 'Crystal', rocky: 'Rocky', lava: 'Lava', galaxy: 'Galaxy', bubble: 'Bubble', mossy: 'Mossy' },
    eyes: { dot: 'Dot', anime: 'Sparkly', round: 'Shiny', beady: 'Beady', cat: 'Cat', star: 'Stars', heart: 'Hearts', swirl: 'Dizzy', lashes: 'Lashes', wink: 'Wink', squint: '> <', chill: 'Chill', cyclops: 'One eye' },
    mouth: { smile: 'Smile', cat: ':3', fang: 'Fang', tongue: 'Blep', o: 'Ooh', teeth: 'Grin', smug: 'Smug', pig: 'Piggy', bunny: 'Bunny nose', dog: 'Puppy', beak: 'Beak', none: 'None' },
    ears: { none: 'None', cat: 'Cat', bunny: 'Bunny', lop: 'Floppy', bear: 'Bear', fox: 'Fox', mouse: 'Mouse', horns: 'Horns', unicorn: 'Unicorn', antlers: 'Antlers', antenna: 'Antenna', sprout: 'Sprout', flame: 'Flame', gills: 'Axolotl', fin: 'Shark fin' },
    hat: { none: 'None', bow: 'Bow', crown: 'Crown', flowers: 'Flower crown', witch: 'Witch hat', party: 'Party hat', beanie: 'Beanie', tophat: 'Top hat', halo: 'Halo', mushroom: 'Mushroom', headphones: 'Headphones', cherries: 'Cherries' },
    face: { none: 'None', glasses: 'Glasses', shades: 'Shades', freckles: 'Freckles', bandaid: 'Band-aid', sticker: 'Star sticker', monocle: 'Monocle' },
    tail: { none: 'None', cat: 'Cat', fox: 'Fox', bunny: 'Puff', devil: 'Devil', dragon: 'Dragon', fish: 'Fish', pig: 'Curly' },
    wings: { none: 'None', angel: 'Angel', bat: 'Bat', fairy: 'Fairy', bee: 'Bee' },
    pattern: { none: 'Plain', belly: 'Belly', spots: 'Spots', stripes: 'Tabby', hearts: 'Hearts', calico: 'Patches', twotone: 'Two-tone', stars: 'Stars' },
    eyeSize: { s: 'Small', m: 'Medium', l: 'Big' }
  };
  const COLORS = ['#8fd3a6', '#7cc7ef', '#f5a3b7', '#f6d27a', '#f6a96b', '#c4a8e8', '#f3eee8', '#8f8b99', '#ef6f6a', '#8fdcd2', '#3d3a4a', '#b98a64', '#ffd23f', '#6f7cf2'];
  const ACCENTS = ['#f7b8c4', '#ffffff', '#f6d27a', '#7cc7ef', '#8fd3a6', '#c4a8e8', '#ef6f6a', '#3d3a4a', '#f6a96b', '#6b4f3f'];
  const EYECOLORS = ['#2f2626', '#3a6fd8', '#2f9e6a', '#8a4fd8', '#e0567a', '#d99a1e', '#c0392b', '#38b6c9'];
  const DEFAULT = { shape: 'dome', material: 'jelly', color: '#8fd3a6', accent: '#f7b8c4', eyeColor: '#2f2626', eyes: 'anime', eyeSize: 'm', mouth: 'smile', ears: 'sprout', hat: 'none', face: 'none', tail: 'none', wings: 'none', pattern: 'none', cheeks: true, feet: true };

  const PRESETS = [
    { label: 'Sprout', shape: 'dome', material: 'jelly', color: '#8fd3a6', accent: '#f7b8c4', eyes: 'anime', mouth: 'smile', ears: 'sprout', hat: 'none', tail: 'none', wings: 'none', pattern: 'none' },
    { label: 'Bun', shape: 'round', material: 'classic', color: '#f5a3b7', accent: '#ffffff', eyes: 'dot', mouth: 'bunny', ears: 'bunny', hat: 'bow', tail: 'bunny', wings: 'none', pattern: 'belly' },
    { label: 'Brie', shape: 'mochi', material: 'cheesy', color: '#ffd23f', accent: '#f6a96b', eyes: 'cat', mouth: 'cat', ears: 'cat', hat: 'none', tail: 'cat', wings: 'none', pattern: 'none' },
    { label: 'Chrome', shape: 'round', material: 'metal', color: '#9fb4c8', accent: '#7cc7ef', eyes: 'round', eyeColor: '#38b6c9', mouth: 'o', ears: 'antenna', hat: 'headphones', tail: 'none', wings: 'none', pattern: 'none' },
    { label: 'Ember', shape: 'drop', material: 'lava', color: '#ff8a3d', accent: '#3d3a4a', eyes: 'squint', mouth: 'fang', ears: 'horns', hat: 'none', tail: 'devil', wings: 'bat', pattern: 'none' },
    { label: 'Nova', shape: 'bean', material: 'galaxy', color: '#8a6cf0', accent: '#f7b8c4', eyes: 'star', eyeColor: '#d99a1e', mouth: 'smile', ears: 'unicorn', hat: 'none', tail: 'none', wings: 'fairy', pattern: 'none' },
    { label: 'Puff', shape: 'blob', material: 'cloud', color: '#cfe6ff', accent: '#f7b8c4', eyes: 'chill', mouth: 'smile', ears: 'none', hat: 'halo', tail: 'none', wings: 'angel', pattern: 'none' },
    { label: 'Axie', shape: 'mochi', material: 'goo', color: '#f7b8d6', accent: '#ef6f9a', eyes: 'beady', mouth: 'smile', ears: 'gills', hat: 'none', tail: 'fish', wings: 'none', pattern: 'spots' },
    { label: 'Pebble', shape: 'blob', material: 'mossy', color: '#a7a29a', accent: '#f7b8c4', eyes: 'dot', mouth: 'smug', ears: 'none', hat: 'mushroom', tail: 'none', wings: 'none', pattern: 'none' },
    { label: 'Fizz', shape: 'round', material: 'bubble', color: '#8fdcd2', accent: '#c4a8e8', eyes: 'heart', eyeColor: '#e0567a', mouth: 'tongue', ears: 'none', hat: 'party', tail: 'none', wings: 'bee', pattern: 'none' },
    { label: 'Gem', shape: 'drop', material: 'crystal', color: '#7cc7ef', accent: '#c4a8e8', eyes: 'lashes', mouth: 'smile', ears: 'none', hat: 'crown', tail: 'none', wings: 'none', pattern: 'none' },
    { label: 'Mocha', shape: 'dome', material: 'fluffy', color: '#b98a64', accent: '#f3eee8', eyes: 'dot', mouth: 'dog', ears: 'lop', hat: 'beanie', tail: 'fox', wings: 'none', pattern: 'belly' }
  ];

  /* ---------- the renderer ---------- */
  function render(pIn, mood = 'joy', opts = {}) {
    const p = Object.assign({}, DEFAULT, pIn);
    const S = SHAPES[p.shape] || SHAPES.dome;
    const id = 'sq' + (UID++), c = p.color, ac = p.accent;
    const l = shade(c, .5), d = shade(c, -.28), dd = shade(c, -.5);
    const { T, F, hw } = S, H = 214 - T;
    const R = rng(11 + p.shape.length * 7 + p.material.length);
    const cyc = p.eyes === 'cyclops';
    const es = { s: .8, m: 1, l: 1.28 }[p.eyeSize] || 1;
    const ew = S.ew + (es > 1 ? 3 : 0);
    const inBody = (n, top = 0, bottom = 1) => Array.from({ length: n }, () => [120 + (R() * 2 - 1) * hw * .85, T + H * (top + R() * (bottom - top))]);

    let defs = `<clipPath id="${id}c"><path d="${S.d}"/></clipPath>
      <radialGradient id="${id}g" cx=".36" cy=".28" r=".9"><stop offset="0" stop-color="${l}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></radialGradient>`;
    let fill = `url(#${id}g)`, battr = '', under = '', inner = '', rim = '', gloss = .55, glossy = false;

    const glaze = (y0, col, op) => {
      let s = `M-10 -40 H250 V${f(y0)}`, x = 250;
      while (x > -10) { const w = 16 + R() * 14, nx = x - w, len = R() < .45 ? 4 + R() * 6 : 14 + R() * 24; s += ` C${f(x - 2)} ${f(y0 + len * 1.3)} ${f(nx + 2)} ${f(y0 + len * 1.3)} ${f(nx)} ${f(y0)}`; x = nx; }
      return `<path d="${s} V-40Z" fill="${col}" opacity="${op}"/>`;
    };

    switch (p.material) {
      case 'jelly':
        battr = 'fill-opacity=".8"'; glossy = true; gloss = .8;
        under = `<ellipse cx="120" cy="214" rx="${hw + 8}" ry="8" fill="${c}" opacity=".35"/>`;
        inner = `<ellipse cx="120" cy="${f(F + 26)}" rx="${f(hw * .55)}" ry="${f((214 - F) * .5)}" fill="${d}" opacity=".18"/>` +
          [[-.4, .62, 6], [.42, .5, 4], [.22, .78, 8], [-.6, .4, 3], [.6, .72, 3]].map(([x, y, r]) => `<circle cx="${f(120 + hw * x)}" cy="${f(T + H * y)}" r="${r}" fill="#fff" opacity=".3" stroke="#fff" stroke-opacity=".6"/>`).join('');
        rim = `<path d="${S.d}" fill="none" stroke="${l}" stroke-width="4" opacity=".6"/>`;
        break;
      case 'goo':
        glossy = true; gloss = .75;
        under = `<ellipse cx="120" cy="213" rx="${hw + 18}" ry="10" fill="${c}" opacity=".55"/><circle cx="${120 + hw + 22}" cy="210" r="5" fill="${c}" opacity=".55"/><circle cx="${120 - hw - 18}" cy="212" r="3.5" fill="${c}" opacity=".55"/>`;
        inner = glaze(T + H * .38, shade(c, .3), .75);
        break;
      case 'cheesy':
        gloss = .3; fill = `url(#${id}g)`;
        inner = glaze(T + H * .3, shade(c, .35), .55) +
          inBody(7, .18, .95).map(([x, y], i) => { const r = 5 + (i % 3) * 3.5; return `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${shade(c, -.32)}" opacity=".6"/><path d="M${f(x - r * .7)} ${f(y + r * .5)} Q${f(x)} ${f(y + r * 1.05)} ${f(x + r * .7)} ${f(y + r * .5)}" stroke="${shade(c, .45)}" stroke-width="2" fill="none" opacity=".7"/>`; }).join('');
        under = `<ellipse cx="120" cy="213" rx="${hw + 6}" ry="7" fill="${shade(c, .2)}" opacity=".5"/>`;
        break;
      case 'metal':
        glossy = true; gloss = .9;
        defs += `<linearGradient id="${id}m" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="${shade(c, .7)}"/><stop offset=".28" stop-color="${c}"/><stop offset=".46" stop-color="${shade(c, -.45)}"/><stop offset=".52" stop-color="${shade(c, .75)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.4)}"/></linearGradient>`;
        fill = `url(#${id}m)`;
        inner = `<path d="M${f(120 - hw * .72)} ${f(F + 20)} Q${f(120 - hw * .66)} ${f(T + 26)} ${f(120 - hw * .05)} ${f(T + 10)}" stroke="#fff" stroke-width="8" opacity=".75" fill="none" stroke-linecap="round"/>` +
          `<rect x="0" y="${f(F + 34)}" width="240" height="5" fill="#fff" opacity=".35"/>` + star4(120 + hw * .5, T + H * .28, 9, '#fff', .9);
        rim = `<path d="${S.d}" fill="none" stroke="${shade(c, -.5)}" stroke-width="2.5" opacity=".7"/>`;
        break;
      case 'glitter':
        glossy = true; gloss = .7;
        inner = inBody(26).map(([x, y], i) => i % 3 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.8 + R() * 1.4)}" fill="#fff" opacity=".85"/>` : star4(x, y, 3 + R() * 4, i % 2 ? '#fff6c2' : '#fff', .95)).join('');
        break;
      case 'fluffy':
        gloss = .25;
        defs += `<filter id="${id}fz" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="10" xChannelSelector="R" yChannelSelector="G"/></filter>`;
        battr = `filter="url(#${id}fz)"`;
        inner = inBody(40).map(([x, y]) => `<path d="M${f(x)} ${f(y)} l${f(R() * 4 - 2)} 5" stroke="${R() < .5 ? l : d}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`).join('');
        break;
      case 'cloud':
        gloss = .35;
        defs += `<filter id="${id}cl" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9"/><feDisplacementMap in="SourceGraphic" scale="16" xChannelSelector="R" yChannelSelector="G"/></filter>
          <radialGradient id="${id}w" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="${mix(c, '#fff', .45)}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
        fill = `url(#${id}w)`; battr = `filter="url(#${id}cl)"`;
        under = `<ellipse cx="${120 - hw * .6}" cy="208" rx="22" ry="9" fill="#fff" opacity=".7"/><ellipse cx="${120 + hw * .7}" cy="206" rx="18" ry="8" fill="#fff" opacity=".6"/>`;
        break;
      case 'crystal': {
        glossy = true; gloss = .85; battr = 'fill-opacity=".92"';
        const cx = 120 - hw * .15, cy = T + H * .42; let pts = [];
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pts.push([cx + Math.cos(a) * 160, cy + Math.sin(a) * 160]); }
        inner = pts.map((q, i) => { const n = pts[(i + 1) % pts.length]; const op = [.32, .08, .18, .04, .26, .12][i % 6]; return `<path d="M${f(cx)} ${f(cy)} L${f(q[0])} ${f(q[1])} L${f(n[0])} ${f(n[1])}Z" fill="${i % 4 === 3 ? dd : '#fff'}" opacity="${op}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>`; }).join('') +
          star4(120 + hw * .45, T + H * .3, 8, '#fff') + star4(120 - hw * .5, T + H * .75, 5, '#fff', .8);
        rim = `<path d="${S.d}" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>`;
        break;
      }
      case 'rocky':
        gloss = .15;
        defs += `<radialGradient id="${id}r" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="${shade(c, .18)}"/><stop offset=".7" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -.2)}"/></radialGradient>`;
        fill = `url(#${id}r)`;
        inner = inBody(36).map(([x, y], i) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.8 + R() * 2)}" fill="${i % 2 ? dd : l}" opacity=".45"/>`).join('') +
          `<path d="M${f(120 + hw * .3)} ${T} l-6 18 l10 10 l-8 16" stroke="${dd}" stroke-width="2.4" fill="none" opacity=".5" stroke-linejoin="round"/><path d="M${f(120 - hw)} ${f(F + 30)} l22 4 l8 12 l16 -2" stroke="${dd}" stroke-width="2.2" fill="none" opacity=".45" stroke-linejoin="round"/>`;
        break;
      case 'lava': {
        gloss = .3; const rock = mix(c, '#1b1416', .78), hot = shade(c, .25);
        defs += `<radialGradient id="${id}lv" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="${shade(rock, .25)}"/><stop offset=".7" stop-color="${rock}"/><stop offset="1" stop-color="${shade(rock, -.4)}"/></radialGradient>
          <filter id="${id}gl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
        fill = `url(#${id}lv)`;
        under = `<ellipse cx="120" cy="214" rx="${hw + 16}" ry="12" fill="${c}" opacity=".35"/>`;
        const cr = `M${f(120 - hw * .9)} ${f(F + 10)} l22 6 l14 -12 l20 8 M${f(120 + hw * .15)} ${T} l-4 20 l12 14 l-6 18 l18 10 l22 -4 M${f(120 - hw * .4)} ${f(T + H * .25)} l10 14 l-8 12 M${f(120 + hw * .2)} 214 l-8 -18 l14 -14 l24 -2 l14 -16 M${f(120 - hw * .35)} 214 l6 -22 l-14 -12`;
        inner = `<g filter="url(#${id}gl)" fill="none" stroke-linejoin="round" stroke-linecap="round"><path d="${cr}" stroke="${hot}" stroke-width="5"/><path d="${cr}" stroke="#fff3b0" stroke-width="1.6"/></g>`;
        break;
      }
      case 'galaxy':
        glossy = true; gloss = .6;
        defs += `<radialGradient id="${id}gx" cx=".4" cy=".35" r=".95"><stop offset="0" stop-color="${shade(c, .1)}"/><stop offset=".55" stop-color="${mix(c, '#1a1238', .62)}"/><stop offset="1" stop-color="#110b26"/></radialGradient>
          <filter id="${id}bl"><feGaussianBlur stdDeviation="7"/></filter>`;
        fill = `url(#${id}gx)`;
        inner = `<g filter="url(#${id}bl)"><ellipse cx="${f(120 + hw * .3)}" cy="${f(F + 20)}" rx="${f(hw * .5)}" ry="16" fill="${ac}" opacity=".45" transform="rotate(-20 ${f(120 + hw * .3)} ${f(F + 20)})"/><ellipse cx="${f(120 - hw * .35)}" cy="${f(T + H * .3)}" rx="26" ry="12" fill="#7cc7ef" opacity=".35"/></g>` +
          inBody(30).map(([x, y], i) => i % 7 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(.6 + R() * 1.3)}" fill="#fff" opacity="${f(.5 + R() * .5)}"/>` : star4(x, y, 3 + R() * 4, '#fff')).join('');
        break;
      case 'bubble':
        glossy = true; gloss = .9; battr = 'fill-opacity=".72"';
        defs += `<linearGradient id="${id}ir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset=".3" stop-color="#ffd6f2"/><stop offset=".55" stop-color="#cdf3ff"/><stop offset=".78" stop-color="#fff3c4"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
        fill = `url(#${id}ir)`;
        inner = `<ellipse cx="${f(120 + hw * .38)}" cy="${f(T + H * .72)}" rx="14" ry="6" fill="#fff" opacity=".5" transform="rotate(-30 ${f(120 + hw * .38)} ${f(T + H * .72)})"/>`;
        rim = `<path d="${S.d}" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>`;
        break;
      case 'mossy': {
        gloss = .3; let m = '';
        for (let i = 0; i < 26; i++) { const x = 120 + (i / 25 * 2 - 1) * hw * 1.05, y = T + 4 + R() * 22 + Math.abs(i / 25 * 2 - 1) * 40; m += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(10 + R() * 9)}" fill="${i % 2 ? '#7fb35f' : '#94c672'}"/>`; }
        m += `<rect x="0" y="${T - 30}" width="240" height="${T > 60 ? 50 : 40}" fill="#86bb66"/>`;
        for (let i = 0; i < 7; i++) { const x = 120 + (R() * 2 - 1) * hw * .7, y = T + 8 + R() * 22; m += `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${i % 2 ? '#fff' : '#f7b8c4'}"/><circle cx="${f(x)}" cy="${f(y)}" r="1" fill="#f6d27a"/>`; }
        inner = m;
        break;
      }
    }

    /* ---------- pattern (inside body) ---------- */
    let pat = '';
    switch (p.pattern) {
      case 'belly': pat = `<ellipse cx="120" cy="${f(214 - (214 - F) * .3)}" rx="${f(hw * .62)}" ry="${f((214 - F) * .5)}" fill="${mix(c, '#fff', .62)}" opacity=".9"/>`; break;
      case 'spots': pat = inBody(7, .05, .95).map(([x, y], i) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${7 + (i % 3) * 4}" ry="${6 + (i % 2) * 4}" fill="${ac}" opacity=".85"/>`).join(''); break;
      case 'stripes': pat = `<g stroke="${ac}" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"><path d="M104 ${T - 4} Q106 ${T + 14} 100 ${T + 30}"/><path d="M120 ${T - 4} L120 ${T + 32}"/><path d="M136 ${T - 4} Q134 ${T + 14} 140 ${T + 30}"/><path d="M${f(120 - hw - 4)} ${f(F + 8)} Q${f(120 - hw * .8)} ${f(F + 4)} ${f(120 - hw * .62)} ${f(F + 14)}"/><path d="M${f(120 - hw - 4)} ${f(F + 30)} Q${f(120 - hw * .8)} ${f(F + 26)} ${f(120 - hw * .6)} ${f(F + 36)}"/><path d="M${f(120 + hw + 4)} ${f(F + 8)} Q${f(120 + hw * .8)} ${f(F + 4)} ${f(120 + hw * .62)} ${f(F + 14)}"/><path d="M${f(120 + hw + 4)} ${f(F + 30)} Q${f(120 + hw * .8)} ${f(F + 26)} ${f(120 + hw * .6)} ${f(F + 36)}"/></g>`; break;
      case 'hearts': pat = inBody(6, .1, .95).map(([x, y], i) => heart(x, y, 5 + (i % 3) * 2, ac, 'opacity=".85"')).join(''); break;
      case 'calico': pat = `<ellipse cx="${f(120 - hw * .5)}" cy="${f(T + H * .2)}" rx="${f(hw * .5)}" ry="34" fill="${ac}" opacity=".9" transform="rotate(-20 ${f(120 - hw * .5)} ${f(T + H * .2)})"/><ellipse cx="${f(120 + hw * .7)}" cy="${f(T + H * .75)}" rx="${f(hw * .4)}" ry="28" fill="${shade(ac, -.25)}" opacity=".85"/>`; break;
      case 'twotone': pat = `<path d="M-10 ${f(F + 34)} Q60 ${f(F + 22)} 120 ${f(F + 34)} T250 ${f(F + 30)} V240 H-10Z" fill="${ac}" opacity=".95"/>`; break;
      case 'stars': pat = inBody(6, .08, .95).map(([x, y], i) => star5(x, y, 5 + (i % 3) * 2, ac, 'opacity=".9"')).join(''); break;
    }

    /* ---------- gloss ---------- */
    const gx = 120 - hw * .45, gy = T + (F - T) * .5;
    let gl = `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f(hw * .2)}" ry="${f(hw * .1)}" fill="#fff" opacity="${gloss}" transform="rotate(-35 ${f(gx)} ${f(gy)})"/><circle cx="${f(gx + hw * .2)}" cy="${f(gy - 10)}" r="3.5" fill="#fff" opacity="${gloss}"/>`;
    if (glossy) gl += `<path d="M${f(120 + hw * .62)} ${f(F + 8)} Q${f(120 + hw * .7)} ${f(F + 34)} ${f(120 + hw * .5)} ${f(F + 50)}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity="${gloss * .6}"/>`;

    /* ---------- ears / head-top ---------- */
    const ci = ac;
    const earL = (inner) => `<g transform="translate(${120 - S.ex} ${S.ey}) rotate(-14)">${inner}</g>`;
    const pair = s => s + MIRROR(s);
    let earsBack = '', earsFront = '';
    switch (p.ears) {
      case 'cat': earsBack = pair(earL(`<path d="M-20 8 L-7 -42 L22 0Z" fill="${c}" stroke="${c}" stroke-width="8" stroke-linejoin="round"/><path d="M-11 0 L-5 -28 L11 -2Z" fill="${ci}"/>`)); break;
      case 'bunny': earsBack = pair(earL(`<ellipse cx="0" cy="-36" rx="14" ry="38" fill="${c}"/><ellipse cx="0" cy="-34" rx="7" ry="27" fill="${ci}"/>`)); break;
      case 'lop': earsFront = pair(`<g transform="translate(${120 - S.ex - 6} ${S.ey + 4})"><path d="M8 -4 C-26 -10 -40 30 -34 66 C-30 86 -12 84 -8 64 C-4 40 12 14 8 -4Z" fill="${shade(c, -.12)}"/><path d="M0 6 C-18 6 -26 34 -24 58 C-22 68 -16 66 -14 56 C-12 40 -4 20 0 6Z" fill="${ci}" opacity=".6"/></g>`); break;
      case 'bear': earsBack = pair(earL(`<circle cx="0" cy="-10" r="19" fill="${c}"/><circle cx="0" cy="-10" r="10" fill="${ci}"/>`)); break;
      case 'fox': earsBack = pair(earL(`<path d="M-24 10 L-6 -56 L26 4Z" fill="${c}" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M-13 2 L-6 -38 L12 0Z" fill="${ci}"/><path d="M-11 -36 L-6 -56 L2 -38Z" fill="${dd}"/>`)); break;
      case 'mouse': earsBack = pair(earL(`<circle cx="-8" cy="-16" r="27" fill="${c}"/><circle cx="-8" cy="-16" r="17" fill="${ci}"/>`)); break;
      case 'horns': earsBack = pair(earL(`<path d="M-9 6 C-16 -16 -12 -36 6 -48 C-1 -30 5 -12 11 4Z" fill="#f3ead8" stroke="#cbb894" stroke-width="2.5" stroke-linejoin="round"/><path d="M-8 -14 Q0 -16 6 -12 M-6 -28 Q0 -30 4 -26" stroke="#cbb894" stroke-width="2" fill="none"/>`)); break;
      case 'antlers': earsBack = pair(earL(`<g stroke="#a47b55" stroke-width="6" stroke-linecap="round" fill="none"><path d="M0 4 L-2 -40"/><path d="M-1 -18 L-16 -30"/><path d="M-2 -34 L-14 -50"/><path d="M-2 -30 L10 -46"/></g>`)); break;
      case 'gills': {
        const g = `<g transform="translate(${f(120 - hw * .8)} ${f(F - 30)})">${[-38, -6, 24].map(a => `<g transform="rotate(${a})"><path d="M0 0 Q-18 -4 -34 0" stroke="${ci}" stroke-width="8" stroke-linecap="round" fill="none"/>${[-12, -20, -28].map(x => `<circle cx="${x}" cy="-5" r="3.2" fill="${shade(ci, .25)}"/>`).join('')}</g>`).join('')}</g>`;
        earsBack = pair(g); break;
      }
      case 'unicorn': earsFront = `<g transform="translate(120 ${T + 8})"><path d="M-10 4 L0 -44 L10 4Z" fill="#fff4c9" stroke="#e7c86a" stroke-width="2.5" stroke-linejoin="round"/><path d="M-7 -8 L7 -14 M-5 -22 L5 -26" stroke="#e7c86a" stroke-width="2"/></g>`; break;
      case 'antenna': earsFront = `<g transform="translate(120 ${T + 6})"><path d="M0 0 Q-6 -20 4 -34" stroke="${d}" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="4" cy="-38" r="8" fill="${ci}"/><circle cx="1" cy="-41" r="2.5" fill="#fff" opacity=".8"/></g>`; break;
      case 'sprout': earsFront = `<g transform="translate(120 ${T + 4})"><path d="M0 2 Q-2 -12 2 -24" stroke="#5f9e58" stroke-width="4.5" fill="none" stroke-linecap="round"/><ellipse cx="-11" cy="-24" rx="12" ry="6.5" fill="#86c477" transform="rotate(-25 -11 -24)"/><ellipse cx="14" cy="-28" rx="13" ry="7" fill="#9bd38a" transform="rotate(20 14 -28)"/></g>`; break;
      case 'flame': earsFront = `<g transform="translate(120 ${T + 6})"><path d="M0 2 C-18 -8 -10 -26 -2 -42 C0 -28 18 -24 12 -4Z" fill="#f6a35b"/><path d="M1 0 C-7 -6 -5 -16 0 -26 C2 -16 9 -14 6 -2Z" fill="#fbd36b"/></g>`; break;
      case 'fin': earsBack = `<g transform="translate(120 ${T + 10})"><path d="M-16 4 C-8 -14 2 -34 14 -44 C10 -24 14 -8 20 6Z" fill="${d}"/></g>`; break;
    }

    /* ---------- hats ---------- */
    let hat = '';
    const hx = hw * .55;
    switch (p.hat) {
      case 'bow': hat = `<g transform="translate(${f(120 + hw * .38)} ${T + 16}) rotate(15)"><path d="M0 0 L-21 -14 Q-26 0 -21 14Z" fill="${ac}"/><path d="M0 0 L21 -14 Q26 0 21 14Z" fill="${ac}"/><path d="M-4 2 L-12 18 L-6 18Z M4 2 L12 18 L6 18Z" fill="${shade(ac, -.15)}"/><circle r="6.5" fill="${shade(ac, -.18)}"/></g>`; break;
      case 'crown': hat = `<g transform="translate(120 ${T + 4})"><path d="M-24 6 L-27 -22 L-12 -9 L0 -28 L12 -9 L27 -22 L24 6Z" fill="#f6d27a" stroke="#d9a93f" stroke-width="2.5" stroke-linejoin="round"/><circle cx="0" cy="-2" r="4" fill="${ac}"/><circle cx="-14" cy="0" r="2.6" fill="#7cc7ef"/><circle cx="14" cy="0" r="2.6" fill="#ef6f6a"/></g>`; break;
      case 'flowers': {
        const cols = ['#ffffff', '#ffd1dc', '#fff2b3', '#e5d4ff', '#ffd1dc'];
        hat = [-1, -.5, 0, .5, 1].map((k, i) => { const x = 120 + k * hw * .55, y = T + 6 + k * k * (F - T) * .45; return `<g transform="translate(${f(x)} ${f(y)})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-6.5" rx="5" ry="7" fill="${cols[i]}" transform="rotate(${a})"/>`).join('')}<circle r="4.2" fill="#f6c24a"/></g>`; }).join('');
        hat = `<path d="M${f(120 - hw * .62)} ${f(T + 6 + (F - T) * .45)} Q120 ${T - 8} ${f(120 + hw * .62)} ${f(T + 6 + (F - T) * .45)}" stroke="#7fb35f" stroke-width="4" fill="none"/>` + hat; break;
      }
      case 'witch': hat = `<g transform="translate(120 ${T + 8}) rotate(-8)"><ellipse cx="0" cy="2" rx="${f(hx + 12)}" ry="9" fill="#5b4a7a"/><path d="M-28 0 L4 -62 Q12 -68 18 -60 L28 0Z" fill="#6b5890"/><rect x="-27" y="-10" width="55" height="8" fill="${ac}"/><path d="M14 -60 Q24 -58 22 -48" stroke="#6b5890" stroke-width="6" fill="none" stroke-linecap="round"/></g>`; break;
      case 'party': hat = `<g transform="translate(${f(120 + 6)} ${T + 6}) rotate(-12)"><path d="M-19 4 L0 -46 L19 4Z" fill="${ac}"/><path d="M-12 -14 L8 -6 M-6 -30 L6 -24 M-17 0 L12 4" stroke="#fff" stroke-width="3.5" opacity=".8"/><circle cx="0" cy="-48" r="7" fill="#fff"/><circle cx="-8" cy="2" r="3" fill="#f6d27a"/><circle cx="8" cy="2" r="3" fill="#7cc7ef"/></g>`; break;
      case 'beanie': hat = `<g transform="translate(120 ${T + 12})"><path d="M${f(-hx)} 4 C${f(-hx)} -42 ${f(hx)} -42 ${f(hx)} 4Z" fill="${ac}"/><rect x="${f(-hx - 4)}" y="-4" width="${f(hx * 2 + 8)}" height="14" rx="7" fill="${shade(ac, -.15)}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${f(-hx + (i + .5) * hx * 2 / 9)} -2 v10" stroke="${shade(ac, -.3)}" stroke-width="2" opacity=".5"/>`).join('')}<circle cx="0" cy="-36" r="10" fill="#fff8ef"/></g>`; break;
      case 'tophat': hat = `<g transform="translate(${f(120 + 8)} ${T + 6}) rotate(-8)"><ellipse cx="0" cy="2" rx="31" ry="7" fill="#3a3036"/><rect x="-19" y="-42" width="38" height="44" rx="4" fill="#3a3036"/><rect x="-19" y="-10" width="38" height="8" fill="${ac}"/><rect x="-14" y="-38" width="5" height="22" rx="2.5" fill="#fff" opacity=".18"/></g>`; break;
      case 'halo': hat = `<g transform="translate(120 ${T - 18})"><ellipse rx="30" ry="8" fill="none" stroke="#f6d27a" stroke-width="11" opacity=".3"/><ellipse rx="30" ry="8" fill="none" stroke="#f6d27a" stroke-width="5"/></g>`; break;
      case 'mushroom': hat = `<g transform="translate(120 ${T + 10})"><path d="M${f(-hx - 6)} 6 C${f(-hx - 6)} -44 ${f(hx + 6)} -44 ${f(hx + 6)} 6 Q0 16 ${f(-hx - 6)} 6Z" fill="#e8645a"/><ellipse cx="-16" cy="-18" rx="8" ry="6" fill="#fff"/><ellipse cx="14" cy="-24" rx="6" ry="5" fill="#fff"/><ellipse cx="${f(hx - 6)}" cy="-4" rx="5" ry="4" fill="#fff"/><ellipse cx="${f(-hx + 4)}" cy="-2" rx="4" ry="3.5" fill="#fff"/></g>`; break;
      case 'headphones': { const y = F - T - 6, w = hw * .95; hat = `<g transform="translate(120 ${T})"><path d="M${f(-w)} ${f(y)} C${f(-w)} -36 ${f(w)} -36 ${f(w)} ${f(y)}" stroke="#5a4e5e" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="${f(-w - 10)}" y="${f(y - 14)}" width="20" height="30" rx="9" fill="${ac}" stroke="${shade(ac, -.3)}" stroke-width="2.5"/><rect x="${f(w - 10)}" y="${f(y - 14)}" width="20" height="30" rx="9" fill="${ac}" stroke="${shade(ac, -.3)}" stroke-width="2.5"/></g>`; break; }
      case 'cherries': hat = `<g transform="translate(${f(120 + hw * .42)} ${T + 18})"><path d="M-6 0 Q-2 -18 8 -22 Q6 -10 10 0" stroke="#5f9e58" stroke-width="2.5" fill="none"/><ellipse cx="10" cy="-24" rx="7" ry="4" fill="#86c477"/><circle cx="-7" cy="4" r="8" fill="#e5484d"/><circle cx="10" cy="4" r="8" fill="#d63a40"/><circle cx="-9" cy="1" r="2.4" fill="#fff" opacity=".7"/><circle cx="8" cy="1" r="2.4" fill="#fff" opacity=".7"/></g>`; break;
    }

    /* ---------- tail & wings ---------- */
    let tail = '';
    const tx = 120 + hw - 16, ty = 198;
    const tg = s => `<g transform="translate(${f(tx)} ${ty})"><g class="wag">${s}</g></g>`;
    switch (p.tail) {
      case 'cat': tail = tg(`<path d="M0 0 C28 0 40 -14 36 -40 C34 -52 42 -58 48 -52" stroke="${c}" stroke-width="12" stroke-linecap="round" fill="none"/>`); break;
      case 'fox': tail = tg(`<path d="M0 4 C24 -6 46 -30 42 -64 C64 -40 66 -6 42 10 C28 18 10 16 0 12Z" fill="${c}"/><path d="M42 -64 C52 -54 56 -44 54 -34 C48 -40 44 -50 42 -64Z" fill="#fff8ef"/>`); break;
      case 'bunny': tail = `<circle cx="${f(tx + 6)}" cy="${ty - 8}" r="15" fill="${mix(c, '#fff', .65)}"/>`; break;
      case 'devil': tail = tg(`<path d="M0 0 C30 4 42 -20 30 -38" stroke="${dd}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M30 -38 L18 -44 L34 -58 L42 -40Z" fill="${dd}" stroke="${dd}" stroke-width="3" stroke-linejoin="round"/>`); break;
      case 'dragon': tail = tg(`<path d="M0 -8 C30 -10 50 -22 64 -46 C60 -16 38 8 0 10Z" fill="${c}"/><path d="M14 -10 l6 -10 l4 9 M30 -16 l7 -10 l3 10 M46 -26 l8 -9 l1 10" fill="${ac}" stroke="${ac}" stroke-width="3" stroke-linejoin="round"/>`); break;
      case 'fish': tail = tg(`<path d="M0 0 L36 -26 Q28 0 36 26Z" fill="${ac}" opacity=".92"/><path d="M8 0 L30 -14 M8 0 L32 0 M8 0 L30 14" stroke="${shade(ac, -.25)}" stroke-width="2" opacity=".6"/>`); break;
      case 'pig': tail = tg(`<path d="M0 0 C12 -2 18 -12 12 -18 C6 -22 0 -14 6 -10 C10 -7 16 -10 20 -14" stroke="${mix(c, '#f5a3b7', .5)}" stroke-width="5" fill="none" stroke-linecap="round"/>`); break;
    }
    let wings = '';
    const wx = 120 - hw + 14, wy = F - 18;
    const wg = s => pair(`<g transform="translate(${f(wx)} ${f(wy)})"><g class="flap">${s}</g></g>`);
    if (p.wings !== 'none') defs += `<linearGradient id="${id}fw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd6f2"/><stop offset=".5" stop-color="#cdf3ff"/><stop offset="1" stop-color="#fff3c4"/></linearGradient>`;
    switch (p.wings) {
      case 'angel': wings = wg(`<path d="M0 0 C-20 -32 -62 -42 -74 -20 C-60 -18 -54 -12 -52 -6 C-64 -2 -66 8 -58 14 C-46 12 -38 14 -34 18 C-26 18 -10 12 0 6Z" fill="#fff" stroke="#e8dccb" stroke-width="2.5" stroke-linejoin="round"/>`); break;
      case 'bat': wings = wg(`<path d="M0 0 L-30 -42 L-44 -22 L-62 -38 L-68 -6 L-52 -2 L-42 14 L-24 4Z" fill="${mix(ac, '#3a2a3a', .6)}" stroke="${mix(ac, '#3a2a3a', .6)}" stroke-width="3" stroke-linejoin="round"/>`); break;
      case 'fairy': wings = wg(`<ellipse cx="-30" cy="-24" rx="32" ry="18" transform="rotate(-30 -30 -24)" fill="url(#${id}fw)" opacity=".75" stroke="#fff" stroke-width="2"/><ellipse cx="-24" cy="8" rx="20" ry="12" transform="rotate(20 -24 8)" fill="url(#${id}fw)" opacity=".75" stroke="#fff" stroke-width="2"/>`); break;
      case 'bee': wings = wg(`<ellipse cx="-18" cy="-26" rx="19" ry="11" transform="rotate(-40 -18 -26)" fill="#eaf6ff" opacity=".85" stroke="#9fbfd6" stroke-width="2"/><ellipse cx="-14" cy="-6" rx="13" ry="8" transform="rotate(-10 -14 -6)" fill="#eaf6ff" opacity=".85" stroke="#9fbfd6" stroke-width="2"/>`); break;
    }

    /* ---------- face ---------- */
    const ec = p.eyeColor, ink = INK;
    const eyePos = cyc ? [[120, F - 4]] : [[120 - ew, F], [120 + ew, F]];
    const sc = cyc ? es * 1.55 : es;
    const arc = (x, y, s, up) => `<path d="M${f(x - 10 * s)} ${f(y + (up ? 5 : 0))} Q${f(x)} ${f(y + (up ? -12 : 8) * s)} ${f(x + 10 * s)} ${f(y + (up ? 5 : 0))}" stroke="${ink}" stroke-width="${f(4.5 * Math.min(s, 1.3))}" fill="none" stroke-linecap="round"/>`;
    function eye(kind, x, y, s, side) {
      switch (kind) {
        case 'anime': return `<ellipse cx="${x}" cy="${y}" rx="${f(10 * s)}" ry="${f(13 * s)}" fill="${ink}"/><ellipse cx="${x}" cy="${f(y + 3 * s)}" rx="${f(8 * s)}" ry="${f(9 * s)}" fill="${ec === INK ? '#6b4a3a' : ec}"/><ellipse cx="${x}" cy="${f(y + 4 * s)}" rx="${f(4.5 * s)}" ry="${f(5.5 * s)}" fill="${ink}"/><circle cx="${f(x + 3.5 * s)}" cy="${f(y - 5 * s)}" r="${f(4 * s)}" fill="#fff"/><circle cx="${f(x - 3.5 * s)}" cy="${f(y + 6 * s)}" r="${f(1.8 * s)}" fill="#fff"/>`;
        case 'round': return `<circle cx="${x}" cy="${y}" r="${f(10.5 * s)}" fill="${ec === INK ? '#4a3a36' : ec}"/><circle cx="${x}" cy="${f(y + 1)}" r="${f(6.5 * s)}" fill="${ink}"/><circle cx="${f(x + 3.5 * s)}" cy="${f(y - 4 * s)}" r="${f(4.2 * s)}" fill="#fff"/><circle cx="${f(x - 4 * s)}" cy="${f(y + 4.5 * s)}" r="${f(1.6 * s)}" fill="#fff"/>`;
        case 'beady': return `<circle cx="${x}" cy="${y}" r="${f(4.5 * s)}" fill="${ec}"/><circle cx="${f(x + 1.4 * s)}" cy="${f(y - 1.6 * s)}" r="${f(1.5 * s)}" fill="#fff"/>`;
        case 'cat': return `<path d="M${f(x - 11 * s)} ${y} Q${x} ${f(y - 13 * s)} ${f(x + 11 * s)} ${y} Q${x} ${f(y + 13 * s)} ${f(x - 11 * s)} ${y}Z" fill="${ec === INK ? '#e9c34a' : ec}" stroke="${ink}" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="${f(2.4 * s)}" ry="${f(8 * s)}" fill="${ink}"/><circle cx="${f(x + 4 * s)}" cy="${f(y - 3 * s)}" r="${f(1.8 * s)}" fill="#fff"/>`;
        case 'star': return star5(x, y, 11 * s, ec === INK ? '#f6c24a' : ec, `stroke="${ink}" stroke-width="2"`) + `<circle cx="${f(x + 2.5 * s)}" cy="${f(y - 3 * s)}" r="${f(1.8 * s)}" fill="#fff"/>`;
        case 'heart': return heart(x, y, 9 * s, ec === INK ? '#e0567a' : ec, `stroke="${ink}" stroke-width="1.6"`) + `<circle cx="${f(x - 3.5 * s)}" cy="${f(y - 3 * s)}" r="${f(2 * s)}" fill="#fff" opacity=".9"/>`;
        case 'swirl': return `<path d="M${x} ${y} m-1 0 a1.5 1.5 0 1 1 3 0 a3.5 3.5 0 1 1 -7 0 a6 6 0 1 1 12 0 a8.5 8.5 0 1 1 -17 0" transform="translate(${f(x)} ${f(y)}) scale(${s}) translate(${f(-x)} ${f(-y)})" stroke="${ec}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
        case 'lashes': return `<ellipse cx="${x}" cy="${y}" rx="${f(7.5 * s)}" ry="${f(9.5 * s)}" fill="${ec}"/><circle cx="${f(x + 2.5 * s)}" cy="${f(y - 4 * s)}" r="${f(2.8 * s)}" fill="#fff"/><path d="M${f(x + side * 6 * s)} ${f(y - 7 * s)} l${f(side * 6 * s)} ${f(-5 * s)} M${f(x + side * 7.5 * s)} ${f(y - 3 * s)} l${f(side * 7 * s)} ${f(-2 * s)}" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>`;
        case 'squint': return `<path d="M${f(x - side * 8 * s)} ${f(y - 8 * s)} L${f(x + side * 6 * s)} ${y} L${f(x - side * 8 * s)} ${f(y + 8 * s)}" stroke="${ink}" stroke-width="${f(4.5 * s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
        case 'chill': return arc(x, y, s, false);
        default: return `<ellipse cx="${x}" cy="${y}" rx="${f(7.5 * s)}" ry="${f(9.5 * s)}" fill="${ec}"/><circle cx="${f(x + 2.5 * s)}" cy="${f(y - 4 * s)}" r="${f(2.8 * s)}" fill="#fff"/>`;
      }
    }
    let eyes;
    if (mood === 'yay') eyes = eyePos.map(([x, y]) => arc(x, y, sc, true)).join('');
    else if (mood === 'sleepy') eyes = eyePos.map(([x, y]) => arc(x, y, sc, false)).join('');
    else if (p.eyes === 'wink') eyes = eye('dot', eyePos[0][0], F, sc, -1) + arc(eyePos[1][0], F, sc, true);
    else if (cyc) eyes = `<ellipse cx="120" cy="${F - 4}" rx="${f(17 * es)}" ry="${f(17 * es)}" fill="#fff" stroke="${ink}" stroke-width="2"/>` + eye('anime', 120, F - 4, es * 1.15, 1);
    else eyes = eyePos.map(([x, y], i) => eye(p.eyes, x, y, sc, i ? 1 : -1)).join('');
    const blinkable = !['chill', 'squint', 'swirl', 'wink'].includes(p.eyes) && (mood === 'joy' || mood === 'ok' || mood === 'sad');

    const brows = mood === 'sad' ? eyePos.map(([x], i) => { const s = i || cyc ? 1 : -1; return `<path d="M${f(x - s * 12)} ${f(F - 20 * sc + 4)} L${f(x + s * 6)} ${f(F - 20 * sc - 3)}" stroke="${dd}" stroke-width="3.5" stroke-linecap="round"/>`; }).join('') +
      `<path d="M${f(120 + hw * .58)} ${f(F - 34)} q7 11 0 15 q-7 -4 0 -15Z" fill="#9fd4f5"/>` : '';

    const m = F + (cyc ? 32 : 24);
    const sadM = mood === 'sad', yay = mood === 'yay' || mood === 'joy';
    const line = (w = 8) => sadM ? `<path d="M${120 - w} ${m + 6} Q120 ${m - 3} ${120 + w} ${m + 6}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
      : mood === 'sleepy' ? `<ellipse cx="120" cy="${m + 2}" rx="4" ry="5" fill="#7a3d3d"/>`
        : yay ? `<path d="M${120 - w - 3} ${m} Q120 ${m + 16} ${120 + w + 3} ${m} Q120 ${m + 5} ${120 - w - 3} ${m}Z" fill="#7a3d3d"/>${mood === 'yay' ? `<path d="M${114} ${m + 7} Q120 ${m + 13} ${126} ${m + 7} Q120 ${m + 9} 114 ${m + 7}Z" fill="#f08b97"/>` : ''}`
          : `<path d="M${120 - w} ${m} Q120 ${m + 8} ${120 + w} ${m}" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
    const wMouth = `<path d="M110 ${m} Q115 ${m + 7} 120 ${m + 1} Q125 ${m + 7} 130 ${m}" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    let mouth = '';
    switch (p.mouth) {
      case 'cat': mouth = sadM ? line() : wMouth; break;
      case 'fang': mouth = line(9) + (sadM ? '' : `<path d="M${124} ${m + 2} l3 7 l3 -6Z" fill="#fff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`); break;
      case 'tongue': mouth = sadM ? line() : `<path d="M110 ${m} Q120 ${m + 6} 130 ${m}" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M116 ${m + 3} Q116 ${m + 14} 121 ${m + 14} Q126 ${m + 14} 126 ${m + 3}Z" fill="#f08b97" stroke="${ink}" stroke-width="1.6"/>`; break;
      case 'o': mouth = `<ellipse cx="120" cy="${m + 3}" rx="5" ry="${sadM ? 4 : 6.5}" fill="#7a3d3d"/>`; break;
      case 'teeth': mouth = sadM ? line() : `<path d="M106 ${m - 1} Q120 ${m + 18} 134 ${m - 1}Z" fill="#7a3d3d"/><path d="M107 ${m} H133 L131 ${m + 5} H109Z" fill="#fff"/>`; break;
      case 'smug': mouth = sadM ? line() : `<path d="M110 ${m + 3} Q122 ${m + 7} 130 ${m - 3}" stroke="${ink}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`; break;
      case 'pig': mouth = `<ellipse cx="120" cy="${m}" rx="15" ry="10.5" fill="${mix(c, '#f5a3b7', .55)}" stroke="${shade(mix(c, '#f5a3b7', .55), -.2)}" stroke-width="2"/><ellipse cx="115" cy="${m}" rx="2.6" ry="4" fill="${dd}"/><ellipse cx="125" cy="${m}" rx="2.6" ry="4" fill="${dd}"/>` + `<g transform="translate(0 14)">${sadM ? line(6) : `<path d="M114 ${m} Q120 ${m + 5} 126 ${m}" stroke="${ink}" stroke-width="2.8" fill="none" stroke-linecap="round"/>`}</g>`; break;
      case 'bunny': mouth = `<path d="M115 ${m - 5} L125 ${m - 5} L120 ${m + 1}Z" fill="#f08b97" stroke-linejoin="round" stroke="#f08b97" stroke-width="2"/>` + `<g transform="translate(0 4)">${sadM ? line(6) : wMouth}</g>`; break;
      case 'dog': mouth = `<ellipse cx="120" cy="${m + 3}" rx="20" ry="14" fill="${mix(c, '#fff', .55)}"/><ellipse cx="120" cy="${m - 3}" rx="7" ry="5" fill="${ink}"/><circle cx="118" cy="${m - 5}" r="1.6" fill="#fff"/>` + `<path d="M120 ${m + 2} V${m + 6}" stroke="${ink}" stroke-width="2.6"/><g transform="translate(0 6)">${sadM ? line(7) : wMouth}</g>`; break;
      case 'beak': mouth = `<path d="M110 ${m - 2} L120 ${m - 7} L130 ${m - 2} L120 ${m + 8}Z" fill="#f6a35b" stroke="#d98336" stroke-width="2" stroke-linejoin="round"/><path d="M110 ${m - 2} L130 ${m - 2}" stroke="#d98336" stroke-width="1.6"/>`; break;
      case 'none': mouth = ''; break;
      default: mouth = line();
    }
    const cheekX = cyc ? 30 : ew + 18;
    const cheeks = p.cheeks ? `<ellipse cx="${f(120 - cheekX)}" cy="${f(F + 17)}" rx="12" ry="6.5" fill="#f48f9f" opacity=".5"/><ellipse cx="${f(120 + cheekX)}" cy="${f(F + 17)}" rx="12" ry="6.5" fill="#f48f9f" opacity=".5"/>` : '';

    let face = '';
    const er = 16 * sc;
    switch (p.face) {
      case 'glasses': face = `<g fill="#fff" fill-opacity=".15" stroke="#4b4038" stroke-width="3.2">${eyePos.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${f(er)}"/>`).join('')}${cyc ? '' : `<path d="M${f(120 - ew + er)} ${F - 2} Q120 ${F - 7} ${f(120 + ew - er)} ${F - 2}" fill="none"/>`}</g>`; break;
      case 'shades': face = eyePos.map(([x, y]) => `<rect x="${f(x - er)}" y="${f(y - er * .7)}" width="${f(er * 2)}" height="${f(er * 1.4)}" rx="${f(er * .55)}" fill="#2b2433" opacity=".92"/><path d="M${f(x - er * .55)} ${f(y - er * .2)} l${f(er * .5)} ${f(-er * .3)}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>`).join('') + (cyc ? '' : `<path d="M${f(120 - ew + er)} ${F - 3} H${f(120 + ew - er)}" stroke="#2b2433" stroke-width="3.5"/>`); break;
      case 'freckles': face = [-1, 1].map(s => [[0, 0], [7, -3], [5, 5]].map(([dx, dy]) => `<circle cx="${f(120 + s * (cheekX - 2) + dx * s)}" cy="${f(F + 12 + dy)}" r="1.7" fill="${shade(c, -.45)}" opacity=".7"/>`).join('')).join(''); break;
      case 'bandaid': face = `<g transform="translate(${f(120 + cheekX)} ${f(F + 16)}) rotate(-25)"><rect x="-13" y="-5.5" width="26" height="11" rx="5.5" fill="#f4cf9c" stroke="#ddb07a" stroke-width="1.4"/><rect x="-4.5" y="-5.5" width="9" height="11" fill="#ead0a8"/><circle cx="-1.6" cy="-1.6" r=".9" fill="#c99a62"/><circle cx="1.6" cy="1.6" r=".9" fill="#c99a62"/></g>`; break;
      case 'sticker': face = star5(120 - cheekX, F + 16, 8, '#f6d27a', 'stroke="#fff" stroke-width="2.4"'); break;
      case 'monocle': { const [x, y] = eyePos[eyePos.length - 1]; face = `<circle cx="${x}" cy="${y}" r="${f(er)}" fill="#fff" fill-opacity=".18" stroke="#d9a93f" stroke-width="3"/><path d="M${f(x + er * .7)} ${f(y + er * .7)} Q${f(x + er + 6)} ${f(y + er + 20)} ${f(x + er - 2)} ${f(y + er + 38)}" stroke="#d9a93f" stroke-width="1.6" fill="none"/>`; break; }
    }

    const feet = p.feet ? [-1, 1].map(s => `<ellipse cx="${f(120 + s * hw * .42)}" cy="212" rx="14" ry="7" fill="${p.material === 'lava' ? mix(c, '#1b1416', .7) : shade(c, -.15)}"/>`).join('') : '';
    const shadow = `<ellipse cx="120" cy="219" rx="${f(hw * .8)}" ry="8" fill="#5a4030" opacity=".14"/>`;

    return `<svg viewBox="0 -24 240 262" xmlns="http://www.w3.org/2000/svg" class="squishy" role="img" aria-label="${(p.name || 'buddy').replace(/[<>&"]/g, '')}">
<defs>${defs}</defs>${shadow}${under}
<g class="body">${wings}${tail}${earsBack}
<path d="${S.d}" fill="${fill}" ${battr}/>
<g clip-path="url(#${id}c)">${pat}${inner}</g>${rim}${gl}${feet}${earsFront}
${cheeks}<g class="${blinkable ? 'eyes blink' : 'eyes'}">${eyes}</g>${brows}${mouth}${face}${hat}
</g></svg>`;
  }

  function randomize(base = {}) {
    const pk = o => { const k = Object.keys(o); return k[Math.floor(Math.random() * k.length)]; };
    const pc = a => a[Math.floor(Math.random() * a.length)];
    const sometimes = (o, pr) => Math.random() < pr ? pk(o) : 'none';
    return Object.assign({}, base, {
      shape: pk(OPT.shape), material: pk(OPT.material), color: pc(COLORS), accent: pc(ACCENTS), eyeColor: Math.random() < .6 ? '#2f2626' : pc(EYECOLORS),
      eyes: pk(OPT.eyes), eyeSize: pk(OPT.eyeSize), mouth: pk(OPT.mouth), ears: sometimes(OPT.ears, .8), hat: sometimes(OPT.hat, .45), face: sometimes(OPT.face, .3),
      tail: sometimes(OPT.tail, .5), wings: sometimes(OPT.wings, .3), pattern: sometimes(OPT.pattern, .5), cheeks: Math.random() < .8, feet: Math.random() < .6
    });
  }

  window.SQ = { render, randomize, OPT, COLORS, ACCENTS, EYECOLORS, DEFAULT, PRESETS, shade, mix };
})();
