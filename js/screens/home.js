// Home / Setup (§7.2): idle pet, duration picker, Start, small stats peek.

import { DURATION_PRESETS_MIN, CUSTOM_DURATION_RANGE_MIN } from '../config.js';
import { actions, state } from '../store.js';
import { Companion } from '../companion.js';
import { el, formatDuration } from '../lib/util.js';

export function HomeScreen() {
  let companion;
  let chosenMin = state.lastDurationMin || state.settings.defaultDurationMin || 25;
  let usingCustom = !DURATION_PRESETS_MIN.includes(chosenMin);
  let rootEl;

  function renderPresets() {
    const wrap = rootEl.querySelector('.duration-presets');
    wrap.innerHTML = '';
    for (const m of DURATION_PRESETS_MIN) {
      wrap.append(el('button', {
        class: 'chip dur-chip' + (!usingCustom && m === chosenMin ? ' active' : ''),
        onclick: () => { chosenMin = m; usingCustom = false; renderPresets(); syncCustom(); },
      }, `${m}m`));
    }
    wrap.append(el('button', {
      class: 'chip dur-chip' + (usingCustom ? ' active' : ''),
      onclick: () => { usingCustom = true; renderPresets(); syncCustom(); },
    }, 'Custom'));
  }

  function syncCustom() {
    const box = rootEl.querySelector('.custom-box');
    box.hidden = !usingCustom;
    const slider = rootEl.querySelector('.custom-slider');
    const out = rootEl.querySelector('.custom-val');
    if (usingCustom) {
      slider.value = chosenMin;
      out.textContent = `${chosenMin} min`;
    }
  }

  return {
    mount(root) {
      const [lo, hi] = CUSTOM_DURATION_RANGE_MIN;
      rootEl = el('div', { class: 'screen home' });
      rootEl.innerHTML = `
        <div class="home-top">
          <div class="stats-peek"></div>
        </div>
        <div class="home-stage"></div>
        <div class="home-panel card">
          <div class="greet"></div>
          <div class="field">
            <label>Focus for</label>
            <div class="chip-row duration-presets"></div>
            <div class="custom-box" hidden>
              <input type="range" class="custom-slider" min="${lo}" max="${hi}" step="5"/>
              <div class="custom-val"></div>
            </div>
          </div>
          <button class="btn btn-primary btn-lg start-btn">Start focusing</button>
        </div>`;
      root.append(rootEl);

      companion = new Companion({
        species: state.pet.species, variant: state.pet.variant, activity: state.pet.activity,
        state: 'idle', progress: 0,
      });
      rootEl.querySelector('.home-stage').append(companion.el);

      const slider = rootEl.querySelector('.custom-slider');
      slider.addEventListener('input', () => {
        chosenMin = Number(slider.value);
        rootEl.querySelector('.custom-val').textContent = `${chosenMin} min`;
      });

      rootEl.querySelector('.start-btn').addEventListener('click', () => {
        actions.setLastDuration(chosenMin);
        actions.startSession(chosenMin);
      });

      renderPresets();
      syncCustom();
    },

    update(s) {
      companion.setState('idle');
      const name = s.pet.name;
      rootEl.querySelector('.greet').textContent = `${name} is ready when you are.`;

      const st = s.stats;
      rootEl.querySelector('.stats-peek').innerHTML = `
        <div class="peek"><span class="peek-num">🔥 ${st.currentStreakDays}</span><span class="peek-lbl">day streak</span></div>
        <div class="peek"><span class="peek-num">${formatDuration(st.totalFocusMs)}</span><span class="peek-lbl">focused</span></div>
        <div class="peek"><span class="peek-num">${st.totalSessions}</span><span class="peek-lbl">sessions</span></div>`;
    },

    unmount() {},
  };
}
