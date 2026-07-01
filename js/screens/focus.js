// Focus session (§7.3–7.5). The pet is the UI: Companion + a subtle timer +
// one primary button. Paused → an overlay that reacts to the escalating
// emotional state. Zen mode hides the numeric timer entirely.

import { actions, state } from '../store.js';
import { STATE_COPY } from '../config.js';
import { Companion } from '../companion.js';
import { el, formatClock } from '../lib/util.js';

export function FocusScreen() {
  let companion;
  let rootEl;
  let zen = false;

  function copyFor(cState) {
    return (STATE_COPY[cState] || '').replace('{name}', state.pet.name);
  }

  return {
    mount(root) {
      rootEl = el('div', { class: 'screen focus' });
      rootEl.innerHTML = `
        <button class="icon-btn zen-toggle" title="Toggle zen mode" aria-label="Toggle zen mode">👁️</button>
        <div class="focus-stage"></div>
        <div class="progress-track" role="progressbar" aria-label="Session progress"><div class="progress-fill"></div></div>
        <div class="timer-display"></div>
        <div class="speech" hidden></div>
        <div class="focus-controls">
          <button class="btn btn-primary btn-lg pause-btn">Pause</button>
        </div>

        <div class="pause-overlay" hidden>
          <div class="pause-card card">
            <div class="pause-stage"></div>
            <div class="pause-speech"></div>
            <div class="pause-meta muted"></div>
            <div class="pause-actions">
              <button class="btn btn-primary btn-lg resume-btn">Resume focusing</button>
              <button class="btn btn-ghost stop-btn">Stop session</button>
            </div>
          </div>
        </div>`;
      root.append(rootEl);

      companion = new Companion({
        species: state.pet.species, variant: state.pet.variant, activity: state.pet.activity,
        state: 'focusing', progress: 0,
      });
      rootEl.querySelector('.focus-stage').append(companion.el);

      rootEl.querySelector('.pause-btn').addEventListener('click', () => actions.pause('manual'));
      rootEl.querySelector('.resume-btn').addEventListener('click', () => actions.resume());
      rootEl.querySelector('.stop-btn').addEventListener('click', () => {
        actions.stopSession();
        actions.toast(`Break time — see you soon! 🐾`);
        // Give the farewell a beat, then return home.
        setTimeout(() => actions.dismissSession(), 1400);
      });
      rootEl.querySelector('.zen-toggle').addEventListener('click', () => {
        zen = !zen;
        rootEl.classList.toggle('zen', zen);
      });
    },

    update(s) {
      const paused = s.session.status === 'paused';
      const ending = s.session.status === 'abandoned';
      companion.setProgress(s.progress);
      companion.setState(s.companionState);

      // Farewell beat after Stop: quiet screen, no controls.
      rootEl.querySelector('.focus-controls').style.visibility = ending ? 'hidden' : 'visible';
      if (ending) {
        rootEl.querySelector('.pause-overlay').hidden = true;
        const speech = rootEl.querySelector('.speech');
        speech.hidden = false;
        speech.textContent = copyFor('farewell');
        return;
      }

      // Progress + timer (shared by focusing view).
      rootEl.querySelector('.progress-fill').style.width = `${Math.round(s.progress * 100)}%`;
      const timer = rootEl.querySelector('.timer-display');
      timer.textContent = formatClock(s.remaining);

      // Focusing view speech (usually quiet).
      const speech = rootEl.querySelector('.speech');
      const txt = copyFor(s.companionState);
      if (!paused && txt) { speech.hidden = false; speech.textContent = txt; }
      else speech.hidden = true;

      // Pause overlay
      const overlay = rootEl.querySelector('.pause-overlay');
      overlay.hidden = !paused;
      rootEl.querySelector('.pause-btn').style.visibility = paused ? 'hidden' : 'visible';

      if (paused) {
        // Mirror the pet into the overlay so escalation is front-and-centre.
        const stage = rootEl.querySelector('.pause-stage');
        if (!stage.firstChild) {
          this._pauseComp = new Companion({
            species: state.pet.species, variant: state.pet.variant, activity: state.pet.activity,
            state: s.companionState, progress: s.progress,
          });
          stage.append(this._pauseComp.el);
        }
        this._pauseComp.setState(s.companionState);
        this._pauseComp.setProgress(s.progress);

        rootEl.querySelector('.pause-speech').textContent = copyFor(s.companionState);
        const secs = Math.round(s.pauseElapsed / 1000);
        const away = secs < 60 ? `${secs}s` : formatClock(s.pauseElapsed);
        const reason = s.session.pauseReason === 'appHidden' ? ' (you switched away)' : '';
        rootEl.querySelector('.pause-meta').textContent =
          `${state.pet.name} has been waiting ${away}${reason}.`;
        overlay.dataset.state = s.companionState;
      } else {
        // Drop the paused companion so it rebuilds fresh next pause.
        const stage = rootEl.querySelector('.pause-stage');
        stage.innerHTML = '';
        this._pauseComp = null;
      }
    },

    unmount() {},
  };
}
