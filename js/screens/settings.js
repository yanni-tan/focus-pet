// Settings (§7.9): sound, haptics, notifications, reduced-motion/gentle mode,
// default duration, theme. Plus a destructive reset.

import { actions, state, resetEverything } from '../store.js';
import { DURATION_PRESETS_MIN } from '../config.js';
import { requestPermission, permission, notificationsSupported } from '../lib/notifications.js';
import { el } from '../lib/util.js';

export function SettingsScreen() {
  let rootEl;

  function toggleRow(key, label, hint) {
    const on = !!state.settings[key];
    const row = el('label', { class: 'row toggle-row' }, [
      el('div', {}, [el('div', { class: 'row-label' }, label), hint && el('div', { class: 'muted small' }, hint)]),
      el('button', {
        class: 'switch' + (on ? ' on' : ''), role: 'switch', 'aria-checked': on ? 'true' : 'false',
        onclick: (e) => {
          const next = !state.settings[key];
          actions.updateSettings({ [key]: next });
          e.currentTarget.classList.toggle('on', next);
          e.currentTarget.setAttribute('aria-checked', String(next));
        },
      }, el('span', { class: 'knob' })),
    ]);
    return row;
  }

  function segRow(key, label, options) {
    const wrap = el('div', { class: 'segmented small-seg' });
    for (const [val, txt] of options) {
      wrap.append(el('button', {
        class: 'seg' + (state.settings[key] === val ? ' active' : ''),
        onclick: () => { actions.updateSettings({ [key]: val }); wrap.querySelectorAll('.seg').forEach((n) => n.classList.toggle('active', n.dataset.v === val)); },
        dataset: { v: val },
      }, txt));
    }
    return el('div', { class: 'row' }, [el('div', { class: 'row-label' }, label), wrap]);
  }

  return {
    mount(root) {
      rootEl = el('div', { class: 'screen settings' });
      rootEl.innerHTML = `<header class="page-head"><h1>Settings</h1></header>`;
      const card = el('div', { class: 'card' });

      card.append(segRow('theme', 'Theme', [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]));
      card.append(segRow('reducedMotion', 'Motion', [['system', 'Auto'], ['off', 'Full'], ['on', 'Gentle']]));

      // Default duration
      const durWrap = el('div', { class: 'chip-row' });
      for (const m of DURATION_PRESETS_MIN) {
        durWrap.append(el('button', {
          class: 'chip' + (state.settings.defaultDurationMin === m ? ' active' : ''),
          onclick: () => { actions.updateSettings({ defaultDurationMin: m }); durWrap.querySelectorAll('.chip').forEach((n) => n.classList.toggle('active', Number(n.dataset.m) === m)); },
          dataset: { m },
        }, `${m}m`));
      }
      card.append(el('div', { class: 'row column' }, [el('div', { class: 'row-label' }, 'Default duration'), durWrap]));

      card.append(toggleRow('soundEnabled', 'Sound', 'Gentle chimes on complete. Off by default.'));
      card.append(toggleRow('hapticsEnabled', 'Haptics', 'Buzz on completion (supported devices).'));

      // Notifications: toggling on also asks the browser for permission.
      const notifHint = notificationsSupported()
        ? 'Nudge you to come back if you wander off for 5 min.'
        : 'Not supported in this browser — in-app nudge still works.';
      const notifRow = el('label', { class: 'row toggle-row' }, [
        el('div', {}, [el('div', { class: 'row-label' }, 'Come-back notifications'), el('div', { class: 'muted small notif-hint' }, notifHint)]),
        el('button', {
          class: 'switch' + (state.settings.notificationsEnabled ? ' on' : ''), role: 'switch',
          onclick: async (e) => {
            const next = !state.settings.notificationsEnabled;
            if (next && notificationsSupported()) {
              const res = await requestPermission();
              if (res !== 'granted') {
                actions.toast('Notification permission was not granted.');
                actions.updateSettings({ notificationsEnabled: false });
                e.currentTarget.classList.remove('on');
                rootEl.querySelector('.notif-hint').textContent = 'Blocked in browser settings — in-app nudge still works.';
                return;
              }
            }
            actions.updateSettings({ notificationsEnabled: next });
            e.currentTarget.classList.toggle('on', next);
          },
        }, el('span', { class: 'knob' })),
      ]);
      card.append(notifRow);

      rootEl.append(card);

      const danger = el('div', { class: 'card danger' });
      danger.append(el('button', {
        class: 'btn btn-ghost danger-btn',
        onclick: () => { if (confirm('Reset everything? This deletes your pet, gallery and stats.')) resetEverything(); },
      }, 'Reset all data'));
      rootEl.append(danger);

      root.append(rootEl);
      if (permission() === 'denied') {
        const h = rootEl.querySelector('.notif-hint');
        if (h) h.textContent = 'Blocked in browser settings — in-app nudge still works.';
      }
    },
    update() {},
    unmount() {},
  };
}
