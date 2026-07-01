// Web Notifications (§8.4) — the "come back" nudge at the upset threshold.
// Best-effort: if permission is denied or the tab is fully closed we simply
// fall back to the in-app upset state. No hard dependency.

export function notificationsSupported() {
  return 'Notification' in window;
}

export function permission() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function fireNudge({ title, body }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    const n = new Notification(title, { body, tag: 'focuspet-nudge', renotify: false });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
