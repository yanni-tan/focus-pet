// Onboarding (§7.1): species → variant → name → activity. One-time; editable
// later from Profile. Builds a live preview with the Companion component.

import { SPECIES, ACTIVITIES } from '../config.js';
import { actions } from '../store.js';
import { Companion } from '../companion.js';
import { el } from '../lib/util.js';

export function OnboardingScreen() {
  let sel = { species: 'cat', variant: SPECIES.cat.variants[0].id, name: '', activity: 'painting' };
  let preview;
  let rootEl;

  function refreshPreview() {
    const holder = rootEl.querySelector('.ob-preview');
    holder.innerHTML = '';
    preview = new Companion({ species: sel.species, variant: sel.variant, activity: sel.activity, state: 'idle', progress: 0.55 });
    holder.append(preview.el);
  }

  function variantChips() {
    const wrap = rootEl.querySelector('.ob-variants');
    wrap.innerHTML = '';
    for (const v of SPECIES[sel.species].variants) {
      const chip = el('button', {
        class: 'chip swatch' + (v.id === sel.variant ? ' active' : ''),
        title: v.label,
        onclick: () => { sel.variant = v.id; variantChips(); refreshPreview(); },
      }, [el('span', { class: 'swatch-dot', style: `background:${v.coat};border-color:${v.accent}` }), v.label]);
      wrap.append(chip);
    }
  }

  return {
    mount(root) {
      rootEl = el('div', { class: 'screen onboarding' });
      rootEl.innerHTML = `
        <div class="ob-card card">
          <h1 class="ob-title">Meet your focus buddy</h1>
          <p class="muted">They'll work on their own little project while you work on yours.</p>
          <div class="ob-preview"></div>

          <div class="field">
            <label>Who's joining you?</label>
            <div class="segmented ob-species"></div>
          </div>

          <div class="field">
            <label>Pick a look</label>
            <div class="chip-row ob-variants"></div>
          </div>

          <div class="field">
            <label for="ob-name">Give them a name</label>
            <input id="ob-name" class="text-input" maxlength="20" placeholder="e.g. Whiskers" autocomplete="off"/>
          </div>

          <div class="field">
            <label>What will they do while you focus?</label>
            <div class="chip-row ob-activities"></div>
          </div>

          <button class="btn btn-primary btn-lg ob-start" disabled>Start together</button>
        </div>`;
      root.append(rootEl);

      // Species segmented control
      const speciesWrap = rootEl.querySelector('.ob-species');
      for (const key of Object.keys(SPECIES)) {
        const b = el('button', {
          class: 'seg' + (key === sel.species ? ' active' : ''),
          onclick: () => {
            sel.species = key;
            sel.variant = SPECIES[key].variants[0].id;
            speciesWrap.querySelectorAll('.seg').forEach((n) => n.classList.toggle('active', n.dataset.k === key));
            variantChips();
            refreshPreview();
          },
          dataset: { k: key },
        }, `${key === 'cat' ? '🐱' : '🐶'} ${SPECIES[key].label}`);
        speciesWrap.append(b);
      }

      // Activities
      const actWrap = rootEl.querySelector('.ob-activities');
      for (const [key, a] of Object.entries(ACTIVITIES)) {
        const b = el('button', {
          class: 'chip activity-chip' + (key === sel.activity ? ' active' : ''),
          onclick: () => {
            sel.activity = key;
            actWrap.querySelectorAll('.chip').forEach((n) => n.classList.toggle('active', n.dataset.k === key));
            refreshPreview();
          },
          dataset: { k: key },
        }, [el('span', { class: 'activity-emoji' }, a.emoji), el('span', {}, a.label), el('small', { class: 'muted' }, a.blurb)]);
        actWrap.append(b);
      }

      const nameInput = rootEl.querySelector('#ob-name');
      const startBtn = rootEl.querySelector('.ob-start');
      nameInput.addEventListener('input', () => {
        sel.name = nameInput.value.trim();
        startBtn.disabled = sel.name.length === 0;
      });
      startBtn.addEventListener('click', () => {
        if (!sel.name) return;
        actions.savePet({ species: sel.species, variant: sel.variant, name: sel.name, activity: sel.activity });
      });

      variantChips();
      refreshPreview();
    },
    update() {},
    unmount() {},
  };
}
