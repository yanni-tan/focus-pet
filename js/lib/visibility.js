// App-exit detection (§8.4). On the web this means the tab going hidden /
// losing focus. When focusing, that auto-pauses with reason `appHidden`; on
// return we recompute so the emotional state is correct even after the browser
// throttled our timers in the background.

import { state, actions, refresh } from '../store.js';
import { reacquireIfNeeded } from './wakeLock.js';

export function installVisibilityHandlers() {
  const onHidden = () => {
    const s = state.session;
    if (s && s.status === 'running') actions.pause('appHidden');
  };

  const onVisible = () => {
    // Recompute pause elapsed / emotional state after returning (§8.3, §13).
    refresh();
    reacquireIfNeeded(state.session?.status === 'running');
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onHidden();
    else onVisible();
  });

  // Belt-and-braces for browsers/OSes where visibilitychange is unreliable.
  window.addEventListener('blur', () => {
    if (document.hidden) onHidden();
  });
  window.addEventListener('focus', onVisible);
  window.addEventListener('pageshow', onVisible);
  window.addEventListener('pagehide', onHidden);
}
