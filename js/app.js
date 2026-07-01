// App shell + router. Maps store state → the right screen, mounting a screen
// once and then feeding it live updates (so the Companion isn't rebuilt every
// tick, which would kill its animations).

import { state, subscribe, actions, applyTheme, refresh } from './store.js';
import { installVisibilityHandlers } from './lib/visibility.js';

import { OnboardingScreen } from './screens/onboarding.js';
import { HomeScreen } from './screens/home.js';
import { FocusScreen } from './screens/focus.js';
import { CompletionScreen } from './screens/completion.js';
import { GalleryScreen } from './screens/gallery.js';
import { ProfileScreen } from './screens/profile.js';
import { SettingsScreen } from './screens/settings.js';

const SCREENS = {
  onboarding: OnboardingScreen,
  home: HomeScreen,
  focus: FocusScreen,
  completion: CompletionScreen,
  gallery: GalleryScreen,
  profile: ProfileScreen,
  settings: SettingsScreen,
};

const NAV_ROUTES = ['home', 'gallery', 'profile', 'settings'];

function determineScreen(s) {
  if (!s.pet) return 'onboarding';
  if (s.session) {
    if (s.session.status === 'completed') return 'completion';
    // running / paused / (briefly) abandoned all live on the focus screen —
    // abandoned stays a beat so the farewell shows before we return home.
    if (['running', 'paused', 'abandoned'].includes(s.session.status)) return 'focus';
  }
  return s.route;
}

const root = document.getElementById('screen');
const nav = document.getElementById('nav');
const toastEl = document.getElementById('toast');

let current = { name: null, instance: null };

function renderNav(activeName) {
  const showNav = NAV_ROUTES.includes(activeName);
  nav.hidden = !showNav;
  if (!showNav) return;
  const items = [
    ['home', 'Home', '🏠'],
    ['gallery', 'Gallery', '🖼️'],
    ['profile', 'Profile', '🐾'],
    ['settings', 'Settings', '⚙️'],
  ];
  nav.innerHTML = '';
  for (const [route, label, icon] of items) {
    const b = document.createElement('button');
    b.className = 'nav-btn' + (route === activeName ? ' active' : '');
    b.innerHTML = `<span class="nav-ico">${icon}</span><span>${label}</span>`;
    b.addEventListener('click', () => actions.setRoute(route));
    nav.append(b);
  }
}

function render(s) {
  const name = determineScreen(s);

  if (name !== current.name) {
    current.instance?.unmount?.();
    root.innerHTML = '';
    current.name = name;
    current.instance = SCREENS[name]();
    current.instance.mount(root);
    renderNav(name);
  }
  current.instance.update(s);
  renderToast(s);
}

let lastToast = null;
function renderToast(s) {
  if (s.toast === lastToast) return;
  lastToast = s.toast;
  toastEl.textContent = s.toast || '';
  toastEl.classList.toggle('show', !!s.toast);
}

// ── boot ──────────────────────────────────────────────────────────────────────
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applyTheme);
installVisibilityHandlers();
subscribe(render);
render(state);

// Recompute on regained focus even if visibility didn't fire.
window.addEventListener('focus', refresh);
