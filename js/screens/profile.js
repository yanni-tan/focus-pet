// Profile & stats (§7.8): the pet, name, totals, streaks. Pet is re-editable.

import { SPECIES, ACTIVITIES } from '../config.js';
import { actions, state } from '../store.js';
import { Companion } from '../companion.js';
import { el, formatDuration } from '../lib/util.js';

export function ProfileScreen() {
  let companion;
  let rootEl;

  function rebuildPreview() {
    const holder = rootEl.querySelector('.profile-stage');
    holder.innerHTML = '';
    companion = new Companion({
      species: state.pet.species, variant: state.pet.variant, activity: state.pet.activity,
      state: 'idle', progress: 0.5,
    });
    holder.append(companion.el);
  }

  function renderVariants() {
    const wrap = rootEl.querySelector('.pf-variants');
    wrap.innerHTML = '';
    for (const v of SPECIES[state.pet.species].variants) {
      wrap.append(el('button', {
        class: 'chip swatch' + (v.id === state.pet.variant ? ' active' : ''),
        onclick: () => { actions.savePet({ variant: v.id }); },
      }, [el('span', { class: 'swatch-dot', style: `background:${v.coat};border-color:${v.accent}` }), v.label]));
    }
  }

  return {
    mount(root) {
      rootEl = el('div', { class: 'screen profile' });
      rootEl.innerHTML = `
        <header class="page-head"><h1>Profile</h1></header>
        <div class="profile-stage"></div>
        <div class="card">
          <div class="field">
            <label for="pf-name">Name</label>
            <input id="pf-name" class="text-input" maxlength="20"/>
          </div>
          <div class="field"><label>Species</label><div class="segmented pf-species"></div></div>
          <div class="field"><label>Look</label><div class="chip-row pf-variants"></div></div>
          <div class="field"><label>Activity</label><div class="chip-row pf-activities"></div></div>
        </div>
        <div class="stats-grid card"></div>`;
      root.append(rootEl);

      const nameInput = rootEl.querySelector('#pf-name');
      nameInput.addEventListener('change', () => {
        const v = nameInput.value.trim();
        if (v) actions.savePet({ name: v });
      });

      const sp = rootEl.querySelector('.pf-species');
      for (const key of Object.keys(SPECIES)) {
        sp.append(el('button', {
          class: 'seg', dataset: { k: key },
          onclick: () => actions.savePet({ species: key, variant: SPECIES[key].variants[0].id }),
        }, `${key === 'cat' ? '🐱' : '🐶'} ${SPECIES[key].label}`));
      }

      const act = rootEl.querySelector('.pf-activities');
      for (const [key, a] of Object.entries(ACTIVITIES)) {
        act.append(el('button', {
          class: 'chip', dataset: { k: key },
          onclick: () => actions.savePet({ activity: key }),
        }, `${a.emoji} ${a.label}`));
      }
    },

    update(s) {
      rebuildPreview();
      rootEl.querySelector('#pf-name').value = s.pet.name;
      rootEl.querySelectorAll('.pf-species .seg').forEach((n) => n.classList.toggle('active', n.dataset.k === s.pet.species));
      rootEl.querySelectorAll('.pf-activities .chip').forEach((n) => n.classList.toggle('active', n.dataset.k === s.pet.activity));
      renderVariants();

      const st = s.stats;
      rootEl.querySelector('.stats-grid').innerHTML = `
        <div class="stat"><span class="stat-num">${st.totalSessions}</span><span class="stat-lbl">sessions</span></div>
        <div class="stat"><span class="stat-num">${formatDuration(st.totalFocusMs)}</span><span class="stat-lbl">total focus</span></div>
        <div class="stat"><span class="stat-num">🔥 ${st.currentStreakDays}</span><span class="stat-lbl">current streak</span></div>
        <div class="stat"><span class="stat-num">${st.longestStreakDays}</span><span class="stat-lbl">longest streak</span></div>`;
    },

    unmount() {},
  };
}
