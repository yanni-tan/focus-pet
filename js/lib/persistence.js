// Local-only persistence (§10). Small mutable state in localStorage.
// Artifacts store only a seed + type, so they render deterministically and
// need no image blobs — keeps us out of IndexedDB for v1.

const KEY = 'focuspet.v1';

const EMPTY = {
  pet: null,
  settings: null, // filled from DEFAULTS on first load
  stats: {
    totalSessions: 0,
    totalFocusMs: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lastSessionDate: null,
  },
  artifacts: [],
  lastDurationMin: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(EMPTY), ...parsed };
  } catch (e) {
    console.warn('Focus Pet: could not load saved state, starting fresh.', e);
    return structuredClone(EMPTY);
  }
}

export function saveState(state) {
  const persisted = {
    pet: state.pet,
    settings: state.settings,
    stats: state.stats,
    artifacts: state.artifacts,
    lastDurationMin: state.lastDurationMin,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(persisted));
  } catch (e) {
    console.warn('Focus Pet: could not save state.', e);
  }
}

export function clearAll() {
  localStorage.removeItem(KEY);
}
