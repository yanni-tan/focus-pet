// Completion (§7.6): celebrating pet, finished artifact revealed, stats/streak
// update (done in the store), then Focus again / Done.

import { actions, state } from '../store.js';
import { ACTIVITIES } from '../config.js';
import { Companion } from '../companion.js';
import { renderArtifactThumb } from '../companion.js';
import { el, formatDuration } from '../lib/util.js';

export function CompletionScreen() {
  let companion;
  let rootEl;

  return {
    mount(root) {
      rootEl = el('div', { class: 'screen completion' });
      rootEl.innerHTML = `
        <div class="confetti" aria-hidden="true"></div>
        <div class="completion-stage"></div>
        <h1 class="completion-title">We did it! 🎉</h1>
        <p class="completion-sub muted"></p>
        <div class="artifact-reveal card"></div>
        <div class="completion-actions">
          <button class="btn btn-primary btn-lg again-btn">Focus again</button>
          <button class="btn btn-ghost done-btn">Done</button>
        </div>`;
      root.append(rootEl);

      companion = new Companion({
        species: state.pet.species, variant: state.pet.variant, activity: state.pet.activity,
        state: 'celebrating', progress: 1,
      });
      rootEl.querySelector('.completion-stage').append(companion.el);

      // Simple confetti bits (respect reduced motion via CSS).
      const conf = rootEl.querySelector('.confetti');
      const colors = ['#e8955b', '#7fae7f', '#f0c05a', '#d98cae', '#7fa9d9'];
      for (let i = 0; i < 28; i++) {
        const p = document.createElement('span');
        p.className = 'confetti-bit';
        p.style.left = Math.random() * 100 + '%';
        p.style.background = colors[i % colors.length];
        p.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
        p.style.animationDuration = (1.6 + Math.random() * 1.4).toFixed(2) + 's';
        conf.append(p);
      }

      rootEl.querySelector('.again-btn').addEventListener('click', () => {
        const last = state.lastDurationMin || 25;
        actions.dismissSession();
        actions.startSession(last);
      });
      rootEl.querySelector('.done-btn').addEventListener('click', () => actions.dismissSession());
    },

    update(s) {
      companion.setState('celebrating');
      const a = ACTIVITIES[s.pet.activity];
      const artifact = s.artifacts.find((x) => x.id === s.session.artifactId);
      rootEl.querySelector('.completion-sub').textContent =
        `${s.pet.name} finished a ${a.artifactNoun} while you focused for ${formatDuration(s.session.plannedDurationMs)}.`;

      const reveal = rootEl.querySelector('.artifact-reveal');
      if (artifact && !reveal.dataset.filled) {
        reveal.dataset.filled = '1';
        reveal.innerHTML = `<div class="thumb big">${renderArtifactThumb(artifact.type, artifact.seed)}</div>
          <div class="reveal-cap">${a.emoji} A new ${a.artifactNoun} for your ${s.pet.activity === 'gardening' ? 'garden' : 'gallery'}!</div>`;
      }
    },

    unmount() {},
  };
}
