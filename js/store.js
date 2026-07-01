// The single source of truth. Combines the PRD's timerStore + petStore roles
// into one lightweight reactive store (subscribe / setState / emit).
//
// Timing is timestamp-based (§8.1): we never count ticks to measure truth.
// elapsed = effectiveNow - startedAt - totalPausedMs, where effectiveNow is
// `pausedAt` while paused (so elapsed freezes) or `Date.now()` while running.

import { DEFAULTS, PAUSE_STATE_THRESHOLDS_MS, PAUSE_STATE_ORDER, TICK_MS } from './config.js';
import { loadState, saveState, clearAll } from './lib/persistence.js';
import { clamp, uid, isoDate, daysBetween } from './lib/util.js';
import { fireNudge } from './lib/notifications.js';
import * as wakeLock from './lib/wakeLock.js';

const listeners = new Set();
let tickHandle = null;

// Persisted slice loads from disk; ephemeral slice (session, route, live derived
// values) starts fresh each launch — a session doesn't survive a full reload.
const persisted = loadState();
if (!persisted.settings) persisted.settings = { ...DEFAULTS };
else persisted.settings = { ...DEFAULTS, ...persisted.settings };

export const state = {
  ...persisted,
  route: persisted.pet ? 'home' : 'onboarding',
  session: null,
  // Live derived values, refreshed every tick / on demand.
  now: Date.now(),
  elapsed: 0,
  progress: 0,
  remaining: 0,
  pauseElapsed: 0,
  companionState: 'idle',
  toast: null,
};

// ── pub/sub ────────────────────────────────────────────────────────────────
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit() {
  for (const fn of listeners) fn(state);
}
function commit({ persist = false } = {}) {
  if (persist) saveState(state);
  emit();
}

// ── derived computation ──────────────────────────────────────────────────────
function computeDerived() {
  const now = Date.now();
  state.now = now;
  const s = state.session;

  if (!s) {
    state.elapsed = state.progress = state.remaining = state.pauseElapsed = 0;
    state.companionState = state.pet ? 'idle' : 'idle';
    return;
  }

  const effectiveNow = s.pausedAt ?? now;
  state.elapsed = Math.max(0, effectiveNow - s.startedAt - s.totalPausedMs);
  state.progress = clamp(state.elapsed / s.plannedDurationMs, 0, 1);
  state.remaining = Math.max(0, s.plannedDurationMs - state.elapsed);
  state.pauseElapsed = s.pausedAt ? Math.max(0, now - s.pausedAt) : 0;

  if (s.status === 'completed') state.companionState = 'celebrating';
  else if (s.status === 'abandoned') state.companionState = 'farewell';
  else if (s.status === 'running') state.companionState = 'focusing';
  else if (s.status === 'paused') state.companionState = pauseStateFor(state.pauseElapsed);
}

// Pure function of elapsed-while-paused → emotional state (§8.3). No hysteresis
// needed because it's derived, not event-driven, so it can't flicker.
export function pauseStateFor(pauseElapsed) {
  for (const name of PAUSE_STATE_ORDER) {
    if (pauseElapsed >= PAUSE_STATE_THRESHOLDS_MS[name]) return name;
  }
  return 'waiting';
}

// ── the tick loop ─────────────────────────────────────────────────────────────
function startTicking() {
  stopTicking();
  tickHandle = setInterval(tick, TICK_MS);
}
function stopTicking() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
}

export function tick() {
  const s = state.session;
  computeDerived();

  if (s && s.status === 'running' && state.elapsed >= s.plannedDurationMs) {
    completeSession();
    return;
  }

  // Fire the "come back" nudge once, when upset while the tab is hidden (§8.4).
  if (s && s.status === 'paused' && !s.notifiedUpset && state.pauseElapsed >= PAUSE_STATE_THRESHOLDS_MS.upset) {
    if (document.hidden && state.settings.notificationsEnabled) {
      const name = state.pet?.name || 'Your pet';
      fireNudge({ title: `${name} misses you`, body: 'Come back and focus together 🐾' });
    }
    s.notifiedUpset = true; // avoid re-firing every tick even if it couldn't fire
  }

  emit();
}

// ── actions ───────────────────────────────────────────────────────────────────
export const actions = {
  // Onboarding / profile
  savePet(pet) {
    const isFirst = !state.pet;
    state.pet = {
      id: state.pet?.id || uid(),
      createdAt: state.pet?.createdAt || Date.now(),
      ...state.pet,
      ...pet,
    };
    if (isFirst) state.route = 'home'; // leave onboarding; edits keep the current route
    computeDerived();
    commit({ persist: true });
  },

  setRoute(route) {
    state.route = route;
    commit();
  },

  toast(msg) {
    state.toast = msg;
    emit();
    if (msg) setTimeout(() => { if (state.toast === msg) { state.toast = null; emit(); } }, 2600);
  },

  // Settings
  updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    applyTheme();
    commit({ persist: true });
  },

  setLastDuration(min) {
    state.lastDurationMin = min;
    commit({ persist: true });
  },

  // Timer lifecycle (§8.2)
  startSession(durationMin) {
    const plannedDurationMs = Math.round(durationMin * 60_000);
    state.session = {
      id: uid(),
      plannedDurationMs,
      startedAt: Date.now(),
      totalPausedMs: 0,
      longestPauseMs: 0,
      pausedAt: null,
      pauseReason: null,
      notifiedUpset: false,
      status: 'running',
    };
    state.lastDurationMin = durationMin;
    computeDerived();
    startTicking();
    wakeLock.requestWakeLock();
    commit({ persist: true });
  },

  pause(reason = 'manual') {
    const s = state.session;
    if (!s || s.status !== 'running') return;
    s.status = 'paused';
    s.pausedAt = Date.now();
    s.pauseReason = reason;
    s.notifiedUpset = false;
    wakeLock.releaseWakeLock();
    computeDerived();
    emit();
  },

  resume() {
    const s = state.session;
    if (!s || s.status !== 'paused') return;
    const pausedFor = Date.now() - s.pausedAt;
    s.totalPausedMs += pausedFor;
    s.longestPauseMs = Math.max(s.longestPauseMs, pausedFor);
    s.pausedAt = null;
    s.pauseReason = null;
    s.notifiedUpset = false;
    s.status = 'running';
    computeDerived();
    startTicking();
    wakeLock.requestWakeLock();
    emit();
  },

  // Manual stop — neutral, no penalty (§4). Nothing saved to the gallery.
  stopSession() {
    const s = state.session;
    if (!s) return;
    if (s.pausedAt) {
      const pausedFor = Date.now() - s.pausedAt;
      s.totalPausedMs += pausedFor;
      s.longestPauseMs = Math.max(s.longestPauseMs, pausedFor);
      s.pausedAt = null;
    }
    s.status = 'abandoned';
    s.endedAt = Date.now();
    stopTicking();
    wakeLock.releaseWakeLock();
    computeDerived();
    emit();
  },

  // Leave the farewell/celebration screen back to home, clearing the session.
  dismissSession() {
    state.session = null;
    state.route = 'home';
    computeDerived();
    commit();
  },
};

function completeSession() {
  const s = state.session;
  s.status = 'completed';
  s.endedAt = Date.now();
  s.focusedMs = s.plannedDurationMs;
  stopTicking();
  wakeLock.releaseWakeLock();

  // Reward: save the artifact deterministically (§5.3, §10).
  const artifact = {
    id: uid(),
    sessionId: s.id,
    type: state.pet.activity,
    createdAt: Date.now(),
    seed: Math.floor(Math.random() * 2 ** 31),
    durationMs: s.plannedDurationMs,
  };
  s.artifactId = artifact.id;
  state.artifacts = [artifact, ...state.artifacts];

  updateStatsOnComplete(s);
  computeDerived();
  commit({ persist: true });
  if (state.settings.hapticsEnabled && navigator.vibrate) navigator.vibrate([40, 60, 40]);
}

function updateStatsOnComplete(s) {
  const st = state.stats;
  st.totalSessions += 1;
  st.totalFocusMs += s.plannedDurationMs;

  const today = isoDate();
  if (st.lastSessionDate === today) {
    // already counted today; streak unchanged
  } else if (st.lastSessionDate && daysBetween(st.lastSessionDate, today) === 1) {
    st.currentStreakDays += 1;
  } else {
    st.currentStreakDays = 1; // first ever, or a gap ≥ 2 days → gentle reset
  }
  st.longestStreakDays = Math.max(st.longestStreakDays, st.currentStreakDays);
  st.lastSessionDate = today;
}

// ── theme ────────────────────────────────────────────────────────────────────
export function applyTheme() {
  const pref = state.settings.theme;
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';

  const rm = state.settings.reducedMotion;
  const reduce = rm === 'on' || (rm === 'system' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  document.documentElement.dataset.motion = reduce ? 'reduced' : 'full';
}

export function resetEverything() {
  clearAll();
  location.reload();
}

// Re-derive on any external wake-up (visibility, focus) so escalation is
// correct even after background throttling (§8.3, §13).
export function refresh() {
  computeDerived();
  emit();
}

computeDerived();
