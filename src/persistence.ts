import { STORAGE_KEY, type SavedState } from './state';
/** Debounced writes always serialize the latest state, including history restoration. */
export function persistence(current: () => SavedState) {
  let timer = 0;
  function flush() {
    clearTimeout(timer);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current())); } catch { /* Storage is optional. */ }
  }
  window.addEventListener('pagehide', flush);
  return () => { clearTimeout(timer); timer = window.setTimeout(flush, 200); };
}
