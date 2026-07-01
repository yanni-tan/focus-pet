// <Companion> — the ONLY place that knows what the pet looks like (§11.2).
//
// The rest of the app talks to it through exactly two inputs:
//   companion.setState(stateEnum)   // §6.1 emotional state
//   companion.setProgress(0..1)     // drives the project artifact
//
// v1 is layered SVG + CSS (programmer-art, fully functional). To ship real
// illustrations later you replace this file's rendering only — swap in Rive/
// Lottie and keep setState/setProgress — with zero changes elsewhere.

import { SPECIES } from './config.js';

// Mouth path per emotional state (local coords, mouth group is translated).
const MOUTHS = {
  idle: 'M-10,0 Q0,11 10,0',
  focusing: 'M-8,1 Q0,8 8,1',
  waiting: 'M-8,1 Q0,8 8,1',
  curious: 'M-6,3 Q0,6 6,3',
  concerned: 'M-9,5 Q0,1 9,5',
  impatient: 'M-9,6 Q0,0 9,6',
  upset: 'M-10,7 Q0,-2 10,7',
  sulking: 'M-8,5 Q0,1 8,5',
  celebrating: 'M-11,0 Q0,4 11,0 Q0,15 -11,0 Z',
  farewell: 'M-9,4 Q0,1 9,4',
};

export class Companion {
  constructor({ species, variant, activity, state = 'idle', progress = 0 }) {
    this.species = species;
    this.activity = activity;
    this.variantDef =
      SPECIES[species]?.variants.find((v) => v.id === variant) || SPECIES[species]?.variants[0];

    this.el = document.createElement('div');
    this.el.className = 'companion';
    this.el.dataset.species = species;
    this.el.dataset.activity = activity;
    this.el.dataset.state = state;
    this.el.style.setProperty('--coat', this.variantDef.coat);
    this.el.style.setProperty('--belly', this.variantDef.belly);
    this.el.style.setProperty('--accent', this.variantDef.accent);
    this.el.style.setProperty('--progress', progress);

    this.el.innerHTML = this._svg();
    this._mouth = this.el.querySelector('.mouth');
    this.setState(state);
  }

  setState(s) {
    this.el.dataset.state = s;
    if (this._mouth) this._mouth.setAttribute('d', MOUTHS[s] || MOUTHS.idle);
  }

  setProgress(p) {
    this.el.style.setProperty('--progress', Math.max(0, Math.min(1, p)));
  }

  _svg() {
    const ears =
      this.species === 'cat'
        ? `<path class="ear" d="M52,52 L46,14 L82,44 Z"/>
           <path class="ear" d="M168,52 L174,14 L138,44 Z"/>
           <path class="ear-inner" d="M56,48 L53,26 L74,44 Z"/>
           <path class="ear-inner" d="M164,48 L167,26 L146,44 Z"/>`
        : `<ellipse class="ear" cx="46" cy="72" rx="17" ry="30"/>
           <ellipse class="ear" cx="174" cy="72" rx="17" ry="30"/>`;

    const snout =
      this.species === 'dog'
        ? `<ellipse class="snout" cx="110" cy="112" rx="30" ry="22"/>`
        : '';

    // The activity artifact renders behind/beside the pet, growing with --progress.
    const artifact = this.activity === 'gardening' ? this._garden() : this._easel();

    return `
    <svg viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <ellipse class="shadow" cx="120" cy="212" rx="86" ry="14"/>
      ${artifact}
      <g class="pet">
        <g class="ears">${ears}</g>
        <ellipse class="body" cx="110" cy="150" rx="62" ry="58"/>
        <ellipse class="belly" cx="110" cy="162" rx="40" ry="42"/>
        <circle class="head" cx="110" cy="92" r="58"/>
        ${snout}
        <g class="tail"><path d="M168,168 q46,-6 40,-52 q-2,26 -30,34 q14,-2 18,-20 q-4,30 -28,38 Z"/></g>
        <g class="face">
          <g class="eye eye-l"><ellipse class="eyeball" cx="88" cy="90" rx="9" ry="11"/><circle class="pupil" cx="90" cy="92" r="4.5"/></g>
          <g class="eye eye-r"><ellipse class="eyeball" cx="132" cy="90" rx="9" ry="11"/><circle class="pupil" cx="134" cy="92" r="4.5"/></g>
          <path class="brow brow-l" d="M78,74 L98,80"/>
          <path class="brow brow-r" d="M142,74 L122,80"/>
          <path class="nose" d="M104,104 h12 l-6,7 Z"/>
          <g class="mouth-wrap" transform="translate(110,116)"><path class="mouth" d="${MOUTHS.idle}"/></g>
          <ellipse class="blush blush-l" cx="74" cy="108" rx="9" ry="5"/>
          <ellipse class="blush blush-r" cx="146" cy="108" rx="9" ry="5"/>
        </g>
        <g class="arm arm-r"><ellipse cx="150" cy="176" rx="16" ry="12"/></g>
        <g class="arm arm-l"><ellipse cx="70" cy="176" rx="16" ry="12"/></g>
      </g>
      <text class="marker" x="150" y="46" text-anchor="middle">?</text>
    </svg>`;
  }

  // Painting: canvas fills from the bottom as progress climbs; strokes appear.
  _easel() {
    return `
    <g class="artifact easel">
      <line class="leg" x1="204" y1="70" x2="188" y2="208"/>
      <line class="leg" x1="236" y1="70" x2="252" y2="208"/>
      <line class="leg" x1="220" y1="150" x2="220" y2="216"/>
      <rect class="canvas" x="182" y="56" width="76" height="86" rx="4"/>
      <clipPath id="canvasClip-${this._cid()}"><rect x="185" y="59" width="70" height="80" rx="3"/></clipPath>
      <g clip-path="url(#canvasClip-${this._cidRef})">
        <rect class="paint-fill" x="185" y="59" width="70" height="80"/>
        <circle class="stroke s1" cx="205" cy="120" r="10"/>
        <rect class="stroke s2" x="222" y="92" width="26" height="10" rx="5"/>
        <circle class="stroke s3" cx="235" cy="118" r="7"/>
        <path class="drip" d="M210,80 q4,20 0,40"/>
      </g>
      <rect class="frame" x="182" y="56" width="76" height="86" rx="4"/>
    </g>`;
  }

  _garden() {
    return `
    <g class="artifact garden">
      <path class="pot" d="M182,168 h64 l-8,44 h-48 Z"/>
      <rect class="pot-rim" x="178" y="160" width="72" height="14" rx="6"/>
      <g class="plant">
        <path class="stem" d="M214,168 C214,140 214,110 214,86"/>
        <path class="leaf leaf-l" d="M214,132 C196,128 188,140 190,150 C204,150 214,144 214,132 Z"/>
        <path class="leaf leaf-r" d="M214,116 C232,112 240,124 238,134 C224,134 214,128 214,116 Z"/>
        <g class="bloom">
          <circle class="petal" cx="214" cy="78" r="9"/>
          <circle class="petal" cx="200" cy="88" r="9"/>
          <circle class="petal" cx="228" cy="88" r="9"/>
          <circle class="petal" cx="205" cy="100" r="9"/>
          <circle class="petal" cx="223" cy="100" r="9"/>
          <circle class="bloom-center" cx="214" cy="90" r="8"/>
        </g>
      </g>
    </g>`;
  }

  // Unique-ish clip id so multiple companions on a page don't collide.
  _cid() {
    if (!this._cidRef) this._cidRef = 'c' + Math.random().toString(36).slice(2, 8);
    return this._cidRef;
  }
}

// Standalone renderer for gallery thumbnails: a finished artifact from a seed.
export function renderArtifactThumb(type, seed) {
  const rnd = seededPalette(seed);
  if (type === 'gardening') {
    return `<svg viewBox="0 0 100 100" class="thumb-svg">
      <path d="M34,72 h32 l-5,20 h-22 Z" fill="#b5744b"/>
      <rect x="31" y="66" width="38" height="9" rx="4" fill="#c98a5f"/>
      <path d="M50,72 C50,54 50,40 50,30" stroke="#5f9e5f" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M50,52 C36,48 30,58 32,66 C44,66 50,60 50,52 Z" fill="#6fae6f"/>
      <path d="M50,42 C64,38 70,48 68,56 C56,56 50,50 50,42 Z" fill="#7cbb7c"/>
      <circle cx="50" cy="26" r="10" fill="${rnd[0]}"/>
      <circle cx="38" cy="34" r="9" fill="${rnd[0]}"/>
      <circle cx="62" cy="34" r="9" fill="${rnd[0]}"/>
      <circle cx="50" cy="30" r="6" fill="${rnd[1]}"/>
    </svg>`;
  }
  // Painting: an abstract composition seeded deterministically.
  return `<svg viewBox="0 0 100 100" class="thumb-svg">
    <rect x="8" y="8" width="84" height="84" rx="3" fill="${rnd[2]}"/>
    <circle cx="${rnd[4]}" cy="${rnd[5]}" r="20" fill="${rnd[0]}"/>
    <rect x="${rnd[6]}" y="${rnd[7]}" width="30" height="14" rx="7" fill="${rnd[1]}"/>
    <circle cx="${rnd[8]}" cy="${rnd[9]}" r="12" fill="${rnd[3]}"/>
    <rect x="4" y="4" width="92" height="92" rx="4" fill="none" stroke="#00000022" stroke-width="6"/>
  </svg>`;
}

function seededPalette(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const hues = [next() * 360, next() * 360, next() * 360, next() * 360];
  return [
    `hsl(${hues[0]},70%,62%)`,
    `hsl(${hues[1]},72%,55%)`,
    `hsl(${hues[2]},55%,88%)`,
    `hsl(${hues[3]},68%,60%)`,
    20 + next() * 60, // cx
    20 + next() * 60, // cy
    15 + next() * 45, // rx x
    20 + next() * 55, // rx y
    20 + next() * 60, // cx2
    20 + next() * 60, // cy2
  ];
}
