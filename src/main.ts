import './style.css';
import './layout.css';
import { styles } from './styles';
import { LETTERS, pixelIds } from './styles/glyphs';
import { initialState, sanitizeParams, STORAGE_KEY } from './state';
import { newSeed, seededRandom } from './utils/random';
import { createControls } from './ui/controls';
import { renderAlphabet } from './ui/renderer';
import { renderWord } from './ui/word-renderer';
import { enablePixelDragging } from './ui/pixel-drag';
import { cleanWord, instanceOf, letterOf, pixelPosition, pixelScale, wordInstances } from './utils/composition';
import { exportSvg, downloadSvg } from './utils/export-svg';
import type { Scope } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const THEME_KEY = 'alphabet-lab-theme';
type Theme = 'light' | 'dark';
let theme: Theme = 'light';
try {
  const storedTheme = localStorage.getItem(THEME_KEY);
  theme = storedTheme === 'light' || storedTheme === 'dark'
    ? storedTheme
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
} catch {
  theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
document.documentElement.dataset.theme = theme;
let stored: string | null = null;
try { stored = localStorage.getItem(STORAGE_KEY); } catch { /* The playground also works with storage disabled. */ }
const saved = initialState(styles, stored);
let active = styles.findIndex(style => style.id === saved.activeStyle);
let focused: string | null = null;
let currentLetter = 'A';
let scope: Scope = 'selection';
const selections = new Map(styles.map(style => [style.id, new Set<string>()]));
let panelHidden = false;
let layoutOpen = false;
let windOpen = true;
let frame = 0;
let saveTimer = 0;
let toastTimer = 0;
const style = () => styles[active];
const state = () => saved.styles[style().id];
const selection = () => selections.get(style().id)!;

app.innerHTML = `
  <header class="site-header">
    <a class="wordmark" href="./" aria-label="Alphabet Lab home"><span class="brand-mark" aria-hidden="true">a<span>✳</span></span><span>ALPHABET<br>LAB</span></a>
    <p class="header-note">An ongoing exploration<br>of letters & their possibilities.</p>
    <div class="header-actions"><button class="theme-toggle icon-button" data-action="theme" aria-label="Switch to dark mode" aria-pressed="false"><span class="theme-icon" aria-hidden="true"></span></button><button class="text-button about-button" data-action="about">About the project <span aria-hidden="true">↗</span></button></div>
  </header>
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow">EXPERIMENTAL TYPE PLAYGROUND <span class="tiny-cross">+</span> VOL. 001</p><h1 id="page-title">A study in form<span class="title-period">.</span></h1></div>
      <p class="intro-copy">An alphabet is only the beginning.<br>Play with the rules. Find your own language.</p>
    </section>
    <nav class="style-nav" aria-label="Alphabet styles">
      <div class="style-tabs">${styles.map((entry, index) => `<button class="style-tab" data-style="${index}" aria-pressed="false"><span class="tab-number">${String(index + 1).padStart(2, '0')}</span>${entry.name}<span class="active-dot" aria-hidden="true"></span></button>`).join('')}</div>
      <div class="nav-tools"><span class="style-counter"></span><button class="icon-button" data-action="previous" aria-label="Previous alphabet style">←</button><button class="icon-button" data-action="next" aria-label="Next alphabet style">→</button><span class="nav-divider"></span><button class="text-button controls-toggle" data-action="panel" aria-expanded="true" aria-controls="control-panel"><span aria-hidden="true">☷</span> <span class="toggle-label">Hide controls</span></button></div>
    </nav>
    <div class="workspace">
      <section class="specimen" aria-label="Alphabet specimen">
        <div class="specimen-heading"><div><span class="status-dot"></span><span class="specimen-name"></span><span class="specimen-divider">/</span><span class="specimen-subtitle"></span></div><button class="text-button back-button" data-action="back" hidden>← All letters</button><span class="specimen-count">A–Z / 26 GLYPHS</span></div>
        <div class="word-toolbar"><button class="text-button" data-action="word">Make a word ↗</button><label class="word-input-label" hidden>Word<input id="word-input" type="text" maxlength="16" autocomplete="off" spellcheck="false" aria-describedby="word-help"></label><span id="word-help" hidden>Letters A–Z only · up to 16</span></div>
        <div id="alphabet" class="alphabet"></div>
        <div class="specimen-bottom"><span class="specimen-instruction"></span><span class="seed-stamp"></span></div>
      </section>
      <aside id="control-panel" class="control-panel" aria-label="Style controls">
        <div class="panel-heading"><h2>Make it your own</h2><span aria-hidden="true">↙</span></div>
        <p class="panel-description"></p>
        <section class="pixel-editor" hidden aria-label="Pixel editing"><div class="section-label">EDITING SCOPE <span class="selected-count"></span></div><label class="scope-label">Apply scale to<select id="scope"><option value="selection">Selected pixels</option><option value="letter">Current letter</option><option value="alphabet">Entire alphabet</option></select></label><label class="scope-label letter-picker">Current letter<select id="current-letter">${LETTERS.map(letter => `<option>${letter}</option>`).join('')}</select></label><div id="selection-scale"></div><p class="selection-help"></p><button class="text-button clear-selection" data-action="deselect">Clear selection</button></section>
        <div class="section-label parameters-heading">FORM & CHARACTER <span>↕</span></div>
        <button class="text-button reset-positions" data-action="reset-positions" hidden>Restore pixel positions</button>
        <div id="parameters"></div>
        <div class="secondary-actions"><button class="text-button" data-action="randomize">↝ Randomize</button><button class="text-button" data-action="reset">↺ Reset</button></div>
        <button class="copy-button" data-action="copy"><span>Copy configuration</span><span aria-hidden="true">↗</span></button>
        <button class="copy-button" data-action="export"><span>Export SVG</span><span aria-hidden="true">↓</span></button>
        <p class="panel-footnote">A small change. A different alphabet.</p>
      </aside>
    </div>
  </main>
  <footer class="site-footer"><span>BUILT FROM RULES. MADE FOR PLAY.</span><div class="shortcuts"><span><kbd>←</kbd><kbd>→</kbd> Switch style</span><span><kbd>R</kbd> Randomize</span><span><kbd>space</kbd> Regenerate</span><span><kbd>H</kbd> Hide controls</span></div><span class="footer-edition">ALPHABET LAB © ${new Date().getFullYear()}</span></footer>
  <div class="toast" role="status" aria-live="polite"></div>
  <dialog class="about-dialog"><button class="dialog-close icon-button" data-action="close-dialog" aria-label="Close dialog">×</button><div class="dialog-content"></div></dialog>
`;

function el<T extends HTMLElement = HTMLElement>(selector: string): T { return app.querySelector<T>(selector)!; }
function applyTheme(): void {
  document.documentElement.dataset.theme = theme;
  const button = el<HTMLButtonElement>('.theme-toggle');
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
  button.setAttribute('aria-pressed', String(theme === 'dark'));
  el('.theme-icon').textContent = theme === 'light' ? '◐' : '☼';
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f3f3f0' : '#171814');
}
function notify(message: string): void {
  el('.toast').textContent = message; el('.toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = window.setTimeout(() => el('.toast').classList.remove('visible'), 2400);
}
function persist(): void {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Persistence is optional. */ } }, 200);
}
function draw(): void {
  if (saved.wordMode) renderWord(el('#alphabet'), style(), state(), selection(), saved.word);
  else renderAlphabet(el('#alphabet'), style(), state(), selection(), focused);
  el('.seed-stamp').textContent = `SEED ${String(state().params.seed).padStart(6, '0')}`;
}
function requestDraw(): void {
  if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
  persist();
}
function targets(): string[] {
  const ids = (instance: string) => pixelIds(letterOf(instance)).map(id => `${instance}:${id.split(':').slice(-2).join(':')}`);
  if (scope === 'alphabet') return (saved.wordMode ? wordInstances(saved.word) : LETTERS).flatMap(ids);
  if (scope === 'letter') return ids(currentLetter);
  return [...selection()];
}
function updateSelectionUI(): void {
  el('.pixel-editor').hidden = !style().editablePixels;
  if (!style().editablePixels) return;
  el<HTMLSelectElement>('#scope').value = scope;
  el<HTMLSelectElement>('#scope').options[2].textContent = saved.wordMode ? 'Entire word' : 'Entire alphabet';
  const picker = el<HTMLSelectElement>('#current-letter');
  picker.replaceChildren(...(saved.wordMode ? wordInstances(saved.word) : LETTERS).map((instance, index) => new Option(saved.wordMode ? `${letterOf(instance)} · position ${index + 1}` : instance, instance)));
  el<HTMLSelectElement>('#current-letter').value = currentLetter;
  el('.letter-picker').hidden = scope !== 'letter';
  const ids = targets();
  el('.selected-count').textContent = `${selection().size} SELECTED`;
  el('.selection-help').textContent = scope === 'selection' ? (ids.length ? `${ids.length} module${ids.length === 1 ? '' : 's'} selected. Drag to move; Shift + click to add or remove.` : 'Click a pixel to select it. Shift + click to select more.') : scope === 'letter' ? `Editing all ${ids.length} modules in ${letterOf(currentLetter)}.` : `Editing all ${ids.length} modules across ${saved.wordMode ? saved.word : 'A–Z'}.`;
  const values = ids.map(id => pixelScale(state(), id));
  const value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
  el('#selection-scale').replaceChildren(createControls([{ type: 'range', key: 'selectedScale', label: 'Module scale', min: 0.4, max: 1.8, step: 0.01, unit: '×' }], { selectedScale: value }, (_, next) => {
    for (const id of targets()) state().edits[id] = Number(next);
    requestDraw();
  }, () => {}));
  el<HTMLInputElement>('#selection-scale input').disabled = !ids.length;
  el<HTMLButtonElement>('.clear-selection').disabled = !selection().size;
  el<HTMLButtonElement>('.reset-positions').disabled = !ids.length;
}
function updateView(): void {
  const item = style();
  document.title = `${item.name} / Alphabet Lab`;
  app.querySelectorAll<HTMLButtonElement>('[data-style]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.style) === active)));
  el('.style-counter').textContent = `${String(active + 1).padStart(2, '0')} / ${String(styles.length).padStart(2, '0')}`;
  el('.specimen-name').textContent = item.name;
  el('.specimen-subtitle').textContent = saved.wordMode ? `Word / ${saved.word}` : focused ? `Letter ${focused}` : item.material.toLowerCase();
  el('.panel-description').textContent = item.description;
  el('.back-button').hidden = !focused && !saved.wordMode;
  el('.specimen-count').hidden = Boolean(focused) || saved.wordMode;
  el('.word-input-label').hidden = !saved.wordMode;
  el('#word-help').hidden = !saved.wordMode;
  el<HTMLInputElement>('#word-input').value = saved.word;
  el<HTMLButtonElement>('[data-action="word"]').textContent = saved.wordMode ? 'Word canvas' : 'Make a word ↗';
  el('.reset-positions').hidden = !item.editablePixels;
  el('.specimen-instruction').textContent = item.editablePixels ? 'Drag pixels to arrange · Shift + click to group · Arrow keys to nudge' : saved.wordMode ? 'Your letters, growing together. Scroll sideways for longer words.' : focused ? 'Your own little ecosystem. Adjust the rules and watch it grow.' : 'Click any letter to look a little closer';
  const onChange = (key: string, value: number | string | boolean) => { state().params[key] = value; requestDraw(); };
  el('#parameters').replaceChildren(createControls(item.controls.filter(control => !control.group && control.type !== 'action'), state().params, onChange, action));
  const windControls = item.controls.filter(control => control.group === 'wind');
  if (windControls.length) {
    const details = document.createElement('details');
    details.className = 'layout-details wind-details'; details.open = windOpen;
    const summary = document.createElement('summary'); summary.textContent = 'Wind & motion';
    const content = document.createElement('div'); content.className = 'layout-controls';
    content.append(createControls(windControls, state().params, onChange, action));
    details.append(summary, content);
    details.addEventListener('toggle', () => { windOpen = details.open; });
    el('#parameters').append(details);
  }
  const layoutControls = item.controls.filter(control => control.group === 'layout');
  if (layoutControls.length) {
    const details = document.createElement('details');
    details.className = 'layout-details'; details.open = layoutOpen;
    const summary = document.createElement('summary'); summary.textContent = 'Spacing & layout';
    const content = document.createElement('div'); content.className = 'layout-controls';
    content.append(createControls(layoutControls, state().params, onChange, action));
    details.append(summary, content);
    details.addEventListener('toggle', () => { layoutOpen = details.open; });
    el('#parameters').append(details);
  }
  el('#parameters').append(createControls(item.controls.filter(control => control.type === 'action'), state().params, onChange, action));
  updateSelectionUI(); draw(); persist();
}
function switchStyle(index: number): void {
  active = (index + styles.length) % styles.length; saved.activeStyle = style().id;
  selection().clear();
  currentLetter = saved.wordMode ? wordInstances(saved.word)[0] : focused ?? 'A';
  updateView();
  el('#control-panel').scrollTop = 0;
}
function focusLetter(letter: string): void {
  if (focused === letter) return;
  focused = letter; currentLetter = letter; updateView();
  el('#control-panel').scrollTop = 0;
  el<HTMLButtonElement>('.back-button').focus({ preventScroll: true });
  if (matchMedia('(max-width: 600px)').matches) el('.specimen').scrollIntoView({ block: 'start' });
}
function syncSelectedPixels(): void {
  app.querySelectorAll<SVGGElement>('[data-pixel]').forEach(pixel => {
    const isSelected = selection().has(pixel.dataset.pixel!);
    pixel.classList.toggle('is-selected', isSelected);
    if (isSelected) pixel.parentNode?.appendChild(pixel);
    if (pixel.hasAttribute('aria-pressed')) pixel.setAttribute('aria-pressed', String(isSelected));
  });
  updateSelectionUI();
}
function selectPixel(id: string, additive: boolean): void {
  currentLetter = instanceOf(id);
  if (additive) { if (selection().has(id)) selection().delete(id); else selection().add(id); }
  else { selection().clear(); selection().add(id); }
  scope = 'selection'; syncSelectedPixels();
}
function clearSelection(): void { selection().clear(); syncSelectedPixels(); }
function openDialog(content: string): void { el('.dialog-content').innerHTML = content; el<HTMLDialogElement>('dialog').showModal(); }
function openExport(): void {
  openDialog(`<p class="eyebrow">TAKE THE LETTERS WITH YOU</p><h2>Export a specimen.</h2>
    <p>Editable SVG, ready for your vector editor. Wind exports as a still letterform.</p>
    <label class="scope-label">Letters to export<select id="export-scope">
      ${saved.wordMode ? '<option value="word">Current word canvas</option>' : ''}
      ${focused ? `<option value="focused">Focused letter: ${focused}</option>` : ''}
      <option value="alphabet">Entire alphabet A–Z</option><option value="custom">Choose letters</option>
    </select></label>
    <label class="scope-label export-custom" hidden>Choose letters<input id="export-letters" type="text" placeholder="e.g. ABCXYZ" maxlength="100" autocomplete="off" spellcheck="false" aria-describedby="export-letters-help"><span id="export-letters-help">A–Z only. Each letter is exported once.</span></label>
    <label class="scope-label">Ink<select id="export-ink" aria-label="Ink"><option value="#292b26">Dark ink</option><option value="#f3f3f0">Light ink</option></select></label>
    <label class="control control-toggle"><span>Transparent background</span><input id="export-transparent" type="checkbox" checked></label>
    <p id="export-error" role="alert" hidden></p>
    <button class="regenerate-button" data-action="download-svg">Download SVG ↓</button>
    <p class="panel-footnote">One group per letter. Pixel modules stay editable shapes; Botanical ASCII stays editable text.</p>`);
  el<HTMLSelectElement>('#export-ink').value = theme === 'dark' ? '#f3f3f0' : '#292b26';
  el('#export-scope').addEventListener('change', () => {
    const custom = el<HTMLSelectElement>('#export-scope').value === 'custom';
    el('.export-custom').hidden = !custom;
    el('#export-error').hidden = true;
    if (custom) el<HTMLInputElement>('#export-letters').focus();
  });
}
function saveSvg(): void {
  const exportScope = el<HTMLSelectElement>('#export-scope').value;
  const letters = exportScope === 'word' ? [...saved.word] : exportScope === 'focused' && focused ? [focused]
    : exportScope === 'custom' ? [...new Set(el<HTMLInputElement>('#export-letters').value.toUpperCase().match(/[A-Z]/g) ?? [])] : LETTERS;
  if (!letters.length) {
    el('#export-error').textContent = 'Enter at least one letter from A to Z.';
    el('#export-error').hidden = false;
    el<HTMLInputElement>('#export-letters').focus();
    return;
  }
  const ink = el<HTMLSelectElement>('#export-ink').value;
  const background = el<HTMLInputElement>('#export-transparent').checked ? undefined : ink === '#292b26' ? '#f3f3f0' : '#171814';
  const source = exportSvg(style(), state(), { letters, ink, background, word: exportScope === 'word' ? saved.word : undefined });
  downloadSvg(source, `alphabet-lab-${style().id}-${letters.length === 26 ? 'A-Z' : letters.join('')}-seed-${state().params.seed}.svg`);
  el<HTMLDialogElement>('dialog').close();
  notify(`SVG exported: ${letters.length === 1 ? letters[0] : `${letters.length} letters`}`);
}
async function copyConfig(): Promise<void> {
  const json = JSON.stringify({ version: 1, style: style().id, parameters: state().params, pixelEdits: state().edits, pixelPositions: state().positions, word: saved.wordMode ? saved.word : undefined }, null, 2);
  try { await navigator.clipboard.writeText(json); notify('Configuration copied'); }
  catch {
    openDialog('<p class="eyebrow">YOUR SPECIMEN</p><h2>Take the rules with you.</h2><p>Clipboard access is unavailable. Select and copy this configuration.</p><textarea class="config-fallback" aria-label="Configuration JSON" readonly></textarea>');
    el<HTMLTextAreaElement>('.config-fallback').value = json; el<HTMLTextAreaElement>('.config-fallback').select();
  }
}
function action(name: string): void {
  switch (name) {
    case 'previous': switchStyle(active - 1); break;
    case 'next': switchStyle(active + 1); break;
    case 'regenerate': state().params.seed = newSeed(); updateView(); notify('A new variation, from the same rules'); break;
    case 'randomize': { const seed = newSeed(); state().params = sanitizeParams(style(), { ...state().params, ...style().randomize?.(seededRandom(seed)), seed }); updateView(); notify('A fresh set of possibilities'); break; }
    case 'reset': saved.styles[style().id] = { params: { ...style().defaults }, edits: {} }; selection().clear(); updateView(); notify('This alphabet has been reset'); break;
    case 'copy': void copyConfig(); break;
    case 'export': openExport(); break;
    case 'download-svg': saveSvg(); break;
    case 'word': saved.wordMode = true; focused = null; currentLetter = wordInstances(saved.word)[0]; selection().clear(); updateView(); el<HTMLInputElement>('#word-input').focus(); break;
    case 'reset-positions': state().positions ??= {}; for (const id of targets()) state().positions![id] = { x: 0, y: 0 }; requestDraw(); notify('Pixel positions restored for the active scope'); break;
    case 'back': { const letter = focused; focused = null; saved.wordMode = false; currentLetter = 'A'; selection().clear(); updateView(); if (letter) el<HTMLButtonElement>(`.glyph-open[data-focus="${letter}"]`).focus({ preventScroll: true }); break; }
    case 'deselect': clearSelection(); break;
    case 'panel': panelHidden = !panelHidden; el('.workspace').classList.toggle('panel-hidden', panelHidden); el('#control-panel').hidden = panelHidden; el('.controls-toggle').setAttribute('aria-expanded', String(!panelHidden)); el('.toggle-label').textContent = panelHidden ? 'Show controls' : 'Hide controls'; break;
    case 'theme': theme = theme === 'light' ? 'dark' : 'light'; applyTheme(); try { localStorage.setItem(THEME_KEY, theme); } catch { /* Theme persistence is optional. */ } break;
    case 'about': openDialog('<p class="eyebrow">AN ONGOING EXPLORATION / VOL. 001</p><h2>Letters with<br>a life of their own.</h2><p>Alphabet Lab is a small playground for generative typography. Twenty-six familiar forms, reimagined through two very different sets of rules.</p><p>Botanical ASCII grows letters from stems, leaves, and flowers made entirely of text characters. Soft Pixel builds them from individual modules you can select and reshape.</p><p>There is no finished version. Change a rule. Follow a happy accident. Make something that feels like yours.</p><div class="about-shortcuts"><kbd>← →</kbd> Switch alphabets<br><kbd>R</kbd> Randomize parameters<br><kbd>Space</kbd> Regenerate with a new seed<br><kbd>H</kbd> Show or hide controls<br><kbd>Esc</kbd> Leave focus or clear selection</div><p class="panel-footnote">Your settings are saved in this browser. Copy a configuration to keep a reproducible record.</p>'); break;
    case 'close-dialog': el<HTMLDialogElement>('dialog').close(); break;
  }
}
app.addEventListener('click', event => {
  const target = event.target as Element;
  const button = target.closest<HTMLElement>('[data-action]');
  if (button) { action(button.dataset.action!); return; }
  const tab = target.closest<HTMLElement>('[data-style]');
  if (tab) { switchStyle(Number(tab.dataset.style)); return; }
  const pixel = target.closest<SVGElement>('[data-pixel]');
  if (pixel) { selectPixel(pixel.dataset.pixel!, event.shiftKey); return; }
  const focus = target.closest<HTMLElement>('[data-focus]');
  if (focus) { focusLetter(focus.dataset.focus!); return; }
  if (target.closest('#alphabet')) clearSelection();
});
el('#scope').addEventListener('change', event => { scope = (event.target as HTMLSelectElement).value as Scope; updateSelectionUI(); });
el('#current-letter').addEventListener('change', event => { currentLetter = (event.target as HTMLSelectElement).value; if (focused) { focused = currentLetter; updateView(); } else updateSelectionUI(); });
el('#word-input').addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  const word = cleanWord(input.value);
  input.value = word;
  if (!word) { input.setCustomValidity('Enter at least one letter.'); return; }
  input.setCustomValidity(''); saved.word = word; currentLetter = wordInstances(word)[0]; selection().clear();
  el('.specimen-subtitle').textContent = `Word / ${word}`;
  updateSelectionUI(); requestDraw();
});
el('#word-input').addEventListener('blur', event => {
  const input = event.target as HTMLInputElement;
  if (!input.value) input.value = saved.word;
  input.setCustomValidity('');
});
enablePixelDragging(el('#alphabet'), { state, selected: selection, select: selectPixel, changed: persist });
document.addEventListener('keydown', event => {
  const target = event.target as HTMLElement;
  if (target.closest('input, textarea, select, [contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey || el<HTMLDialogElement>('dialog').open) return;
  const pixel = target.closest<SVGElement>('[data-pixel]');
  if (pixel && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const id = pixel.dataset.pixel!;
    if (!selection().has(id)) selectPixel(id, false);
    state().positions ??= {};
    const step = event.shiftKey ? 5 : 1;
    for (const selected of selection()) {
      const position = pixelPosition(state(), selected);
      state().positions![selected] = {
        x: Math.max(-40, Math.min(40, position.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0))),
        y: Math.max(-40, Math.min(40, position.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0))),
      };
    }
    draw(); persist();
    [...app.querySelectorAll<SVGElement>('[data-pixel]')].find(element => element.dataset.pixel === id)?.focus();
    return;
  }
  if (pixel && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); selectPixel(pixel.dataset.pixel!, event.shiftKey); return; }
  if (event.key === ' ' && target.closest('button, a, summary')) return;
  if (event.repeat) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); action('previous'); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); action('next'); }
  else if (event.key.toLowerCase() === 'r') action('randomize');
  else if (event.key.toLowerCase() === 'h') action('panel');
  else if (event.key === ' ') { event.preventDefault(); action('regenerate'); }
  else if (event.key === 'Escape') { if (focused || saved.wordMode) action('back'); else clearSelection(); }
});
el<HTMLDialogElement>('dialog').addEventListener('click', event => { if (event.target === event.currentTarget) el<HTMLDialogElement>('dialog').close(); });
window.addEventListener('pagehide', () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* Optional storage. */ } });
applyTheme();
if (saved.wordMode) currentLetter = wordInstances(saved.word)[0];
updateView();
