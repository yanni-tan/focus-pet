// Screen Wake Lock (§8.5) — keep the pet visible while focusing.
// No-ops gracefully where unsupported.

let sentinel = null;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    sentinel = await navigator.wakeLock.request('screen');
    sentinel.addEventListener('release', () => {
      sentinel = null;
    });
  } catch (e) {
    // Denied (e.g. tab not visible) — non-fatal.
    sentinel = null;
  }
}

export async function releaseWakeLock() {
  try {
    await sentinel?.release();
  } catch {}
  sentinel = null;
}

// Re-acquire after the tab becomes visible again (wake locks drop on hide).
export function reacquireIfNeeded(shouldHold) {
  if (shouldHold && !sentinel && document.visibilityState === 'visible') {
    requestWakeLock();
  }
}
