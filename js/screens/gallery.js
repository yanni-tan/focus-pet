// Collection / Gallery (§7.7): grid of past artifacts.

import { state } from '../store.js';
import { renderArtifactThumb } from '../companion.js';
import { el, formatDuration } from '../lib/util.js';

export function GalleryScreen() {
  let rootEl;
  return {
    mount(root) {
      rootEl = el('div', { class: 'screen gallery' });
      root.append(rootEl);
    },
    update(s) {
      const arts = s.artifacts;
      if (!arts.length) {
        rootEl.innerHTML = `
          <header class="page-head"><h1>Gallery</h1></header>
          <div class="empty card">
            <div class="empty-emoji">🖼️</div>
            <p>No finished pieces yet.</p>
            <p class="muted">Complete a focus session and ${s.pet.name}'s work shows up here.</p>
          </div>`;
        return;
      }
      const cells = arts.map((a) => {
        const date = new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        return `<figure class="thumb-card card">
          <div class="thumb">${renderArtifactThumb(a.type, a.seed)}</div>
          <figcaption><span>${date}</span><small class="muted">${formatDuration(a.durationMs || 0)}</small></figcaption>
        </figure>`;
      }).join('');
      rootEl.innerHTML = `
        <header class="page-head"><h1>Gallery</h1><span class="muted">${arts.length} piece${arts.length === 1 ? '' : 's'}</span></header>
        <div class="thumb-grid">${cells}</div>`;
    },
    unmount() {},
  };
}
