import { configurationJSON, parseConfiguration, shareURL } from '../configuration';
import { styles } from '../styles';
import { LETTERS } from '../styles/glyphs';
import { exportSvg, downloadSvg } from '../utils/export-svg';
import type { SavedState } from '../state';
import type { AlphabetStyle, StyleState } from '../types';
export function createDialogs(options: {
  app: HTMLElement; saved: () => SavedState; style: () => AlphabetStyle; state: () => StyleState;
  focused: () => string | null; theme: () => string; notify: (message: string) => void;
  importState: (next: SavedState) => void;
}) {
  const { app, style, state, notify } = options;
  function el<T extends HTMLElement = HTMLElement>(selector: string): T { return app.querySelector<T>(selector)!; }
  let dialogTrigger: HTMLElement | null = null;
  function openDialog(content: string): void {
    dialogTrigger = document.activeElement as HTMLElement;
    el('.dialog-content').innerHTML = content;
    el('.dialog-content h2').id = 'dialog-title';
    el('dialog').setAttribute('aria-labelledby', 'dialog-title');
    el<HTMLDialogElement>('dialog').showModal();
  }
  el('dialog').addEventListener('close', () => { if (dialogTrigger?.isConnected) dialogTrigger.focus(); });
  // Keep Tab in the modal even when the browser would otherwise move focus to its chrome.
  el('dialog').addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const items = [...el('dialog').querySelectorAll<HTMLElement>('button, input, textarea, select, a[href], [tabindex="0"]')].filter(item => !item.matches(':disabled') && item.getClientRects().length > 0);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  function openConfiguration(): void {
    openDialog(`<h2>Configuration</h2><p>Paste JSON or upload a file. Import replaces the saved setup and can be undone.</p>
      <textarea class="config-fallback" aria-label="Configuration JSON"></textarea>
      <label class="scope-label">Upload configuration<input id="config-file" type="file" accept=".json,application/json"></label>
      <p id="config-error" role="alert"></p><div class="secondary-actions"><button id="config-import" class="text-button">Import JSON</button><button id="config-download" class="text-button">Download JSON</button><button id="config-share" class="text-button">Create share link</button></div>`);
    const input = el<HTMLTextAreaElement>('.config-fallback'); input.value = configurationJSON(options.saved());
    const error = (message: string) => { el('#config-error').textContent = message; };
    el('#config-file').addEventListener('change', async event => {
      const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
      if (file.size > 2_000_000) { error('File is too large (maximum 2 MB).'); return; }
      try { input.value = await file.text(); error('File loaded. Choose Import JSON to apply it.'); } catch { error('Could not read the file.'); }
    });
    el('#config-import').addEventListener('click', () => {
      try {
        const next = parseConfiguration(input.value, styles);
        options.importState(next); el<HTMLDialogElement>('dialog').close(); notify('Configuration imported');
      } catch (cause) { error((cause as Error).message); }
    });
    el('#config-download').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([configurationJSON(options.saved())], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = 'alphabet-lab.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    });
    el('#config-share').addEventListener('click', () => {
      try { input.value = shareURL(options.saved(), location.href); input.select(); error('Share link ready to copy.'); }
      catch (cause) { error((cause as Error).message); }
    });
  }
  function openExport(): void {
    openDialog(`<p class="eyebrow">TAKE THE LETTERS WITH YOU</p><h2>Export a specimen.</h2>
      <p>Editable SVG, ready for your vector editor. Wind exports as a still letterform.</p>
      <label class="scope-label">Letters to export<select id="export-scope">
        ${options.saved().wordMode ? '<option value="word">Current word canvas</option>' : ''}
        ${options.focused() ? `<option value="focused">Focused letter: ${options.focused()}</option>` : ''}
        <option value="alphabet">Entire alphabet A–Z</option><option value="custom">Choose letters</option>
      </select></label>
      <label class="scope-label export-custom" hidden>Choose letters<input id="export-letters" type="text" placeholder="e.g. ABCXYZ" maxlength="100" autocomplete="off" spellcheck="false" aria-describedby="export-letters-help"><span id="export-letters-help">A–Z only. Each letter is exported once.</span></label>
      <label class="scope-label">Ink<select id="export-ink" aria-label="Ink"><option value="#292b26">Dark ink</option><option value="#f3f3f0">Light ink</option></select></label>
      <label class="control control-toggle"><span>Transparent background</span><input id="export-transparent" type="checkbox" checked></label>
      <p id="export-error" role="alert" hidden></p>
      <button class="regenerate-button" data-action="download-svg">Download SVG ↓</button>
      <p class="panel-footnote">One group per letter. Pixel modules stay editable shapes; Botanical ASCII stays editable text.</p>`);
    el<HTMLSelectElement>('#export-ink').value = options.theme() === 'dark' ? '#f3f3f0' : '#292b26';
    el('#export-scope').addEventListener('change', () => {
      const custom = el<HTMLSelectElement>('#export-scope').value === 'custom';
      el('.export-custom').hidden = !custom;
      el('#export-error').hidden = true;
      if (custom) el<HTMLInputElement>('#export-letters').focus();
    });
  }
  function saveSvg(): void {
    const exportScope = el<HTMLSelectElement>('#export-scope').value;
    const letters = exportScope === 'word' ? [...options.saved().word] : exportScope === 'focused' && options.focused() ? [options.focused()!]
      : exportScope === 'custom' ? [...new Set(el<HTMLInputElement>('#export-letters').value.toUpperCase().match(/[A-Z]/g) ?? [])] : LETTERS;
    if (!letters.length) {
      el('#export-error').textContent = 'Enter at least one letter from A to Z.';
      el('#export-error').hidden = false;
      el<HTMLInputElement>('#export-letters').focus();
      return;
    }
    const ink = el<HTMLSelectElement>('#export-ink').value;
    const background = el<HTMLInputElement>('#export-transparent').checked ? undefined : ink === '#292b26' ? '#f3f3f0' : '#171814';
    const source = exportSvg(style(), state(), { letters, ink, background, word: exportScope === 'word' ? options.saved().word : undefined });
    downloadSvg(source, `alphabet-lab-${style().id}-${letters.length === 26 ? 'A-Z' : letters.join('')}-seed-${state().params.seed}.svg`);
    el<HTMLDialogElement>('dialog').close();
    notify(`SVG exported: ${letters.length === 1 ? letters[0] : `${letters.length} letters`}`);
  }
  async function copyConfig(): Promise<void> {
    const json = configurationJSON(options.saved());
    try { await navigator.clipboard.writeText(json); notify('Configuration copied'); }
    catch {
      openDialog('<p class="eyebrow">YOUR SPECIMEN</p><h2>Take the rules with you.</h2><p>Clipboard access is unavailable. Select and copy this configuration.</p><textarea class="config-fallback" aria-label="Configuration JSON" readonly></textarea>');
      el<HTMLTextAreaElement>('.config-fallback').value = json; el<HTMLTextAreaElement>('.config-fallback').select();
    }
  }

  return { openDialog, openConfiguration, openExport, saveSvg, copyConfig };
}
