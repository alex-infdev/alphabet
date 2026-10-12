import { test, expect, type Page } from '@playwright/test';

const action = (page: Page, name: string) => page.locator(`[data-action="${name}"]`);
async function word(page: Page, text: string) {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  await action(page, 'word').click(); await page.locator('#word-input').fill(text);
  await expect(page.locator('.word-svg > svg')).toHaveCount(text.length);
}
async function seed(page: Page, overrides: object) {
  await page.addInitScript(overrides => { if (!localStorage.getItem('alphabet-lab:v1')) localStorage.setItem('alphabet-lab:v1', JSON.stringify({
    version: 2, activeStyle: 'soft-pixel', word: 'AA', wordMode: true,
    styles: { 'soft-pixel': { params: {}, edits: {}, positions: {}, ...overrides } },
  })); }, overrides);
}

test('deleting one word occurrence preserves other copies, base edits, undo, reload, import and SVG', async ({ page }) => {
  await seed(page, { edits: { 'A:6:10': 1.2, 'w@1:A:6:10': 1.4 }, positions: { 'A:6:10': { x: 1, y: 2 }, 'w@1:A:6:10': { x: 8, y: 3 } } });
  await page.goto('/');
  const first = page.locator('[data-pixel="w@0:A:6:10"]');
  const second = page.locator('[data-pixel="w@1:A:6:10"]');
  await first.click(); await action(page, 'delete-pixels').click();
  await expect(first).toHaveCount(0); await expect(second).toHaveAttribute('transform', 'translate(8 3)');
  await action(page, 'undo').click(); await expect(first).toHaveAttribute('transform', 'translate(1 2)');
  await action(page, 'redo').click(); await expect(first).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('alphabet-lab:v1')!).styles['soft-pixel'].removedPixels)).toEqual({ 'w@0:A:6:10': true });
  await page.reload();
  await expect(first).toHaveCount(0); await expect(second).toHaveAttribute('transform', 'translate(8 3)');
  await action(page, 'configuration').click(); await page.locator('#config-import').click();
  await expect(page.locator('[data-pixel="w@0:A:6:10"]')).toHaveCount(0);
  await action(page, 'export').click();
  const downloading = page.waitForEvent('download'); await action(page, 'download-svg').click();
  const stream = await (await downloading).createReadStream(); const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString();
  const pixels = await page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    return { first: doc.querySelectorAll('[data-pixel="w@0:A:6:10"]').length, second: doc.querySelector('[data-pixel="w@1:A:6:10"]')?.getAttribute('transform') };
  }, source);
  expect(pixels).toEqual({ first: 0, second: 'translate(8 3)' });
  await action(page, 'back').click();
  await expect(page.locator('[data-pixel="A:6:10"]')).toHaveAttribute('transform', 'translate(1 2)');
});

test('word reset restores only the current copy of a manually added module', async ({ page }) => {
  await seed(page, { addedPixels: { 'A:0:m0': { row: 3, column: 3 } }, edits: { 'A:0:m0': 1.2, 'w@1:A:0:m0': 1.4 }, positions: { 'w@1:A:0:m0': { x: 4.16, y: 0 } } });
  await page.goto('/');
  const first = page.locator('[data-pixel="w@0:A:0:m0"]');
  const second = page.locator('[data-pixel="w@1:A:0:m0"]');
  await first.click(); await action(page, 'delete-pixels').click();
  await expect(first).toHaveCount(0); await expect(second).toHaveAttribute('transform', 'translate(4.16 0)');
  await action(page, 'reset-glyph').click();
  await expect(first).toHaveCount(1); await expect(second).toHaveAttribute('transform', 'translate(4.16 0)');
  await action(page, 'undo').click(); await expect(first).toHaveCount(0);
  await action(page, 'redo').click(); await expect(first).toHaveCount(1);
});

test('word normalization preserves mid-word typing, range selection, paste and composition', async ({ page }) => {
  await word(page, 'GROW'); const input = page.locator('#word-input');
  await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(1, 1));
  await input.pressSequentially('ab'); await expect(input).toHaveValue('GABROW');
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);
  await input.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 4));
  await input.pressSequentially('c'); await expect(input).toHaveValue('GACOW');
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(3);
  const pasted = await input.evaluate((node: HTMLInputElement) => {
    node.value = 'a🌿:b'; node.setSelectionRange(1, 4, 'backward');
    node.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertFromPaste' }));
    return { value: node.value, start: node.selectionStart, end: node.selectionEnd, direction: node.selectionDirection };
  });
  expect(pasted).toEqual({ value: 'A:B', start: 1, end: 2, direction: 'backward' });
  await input.fill('GROW');
  await input.evaluate((node: HTMLInputElement) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    node.value = 'Ga🌿ROW'; node.setSelectionRange(4, 4);
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, inputType: 'insertCompositionText' }));
  });
  await expect(input).toHaveValue('Ga🌿ROW');
  await expect(page.locator('.word-svg')).toHaveAttribute('aria-label', 'Word GROW, Soft Pixel');
  await input.dispatchEvent('compositionend'); await expect(input).toHaveValue('GAROW');
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(2);
  await expect(page.locator('.word-svg')).toHaveAttribute('aria-label', 'Word GAROW, Soft Pixel');
  await input.evaluate((node: HTMLInputElement) => {
    node.value = 'a'.repeat(70); node.setSelectionRange(70, 70);
    node.dispatchEvent(new InputEvent('input', { bubbles: true }));
  });
  await expect(input).toHaveValue('A'.repeat(64));
  expect(await input.evaluate((node: HTMLInputElement) => node.selectionStart)).toBe(64);
  await input.fill(''); await input.blur(); await expect(input).toHaveValue('A'.repeat(64));
});

test('scaling and nudging render one affected glyph while retaining unrelated gallery and word nodes', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  await page.locator('.glyph-cell[data-letter="B"] svg').evaluate(node => node.setAttribute('data-retained', 'yes'));
  await page.evaluate(async () => {
    // @ts-expect-error Vite development module.
    const { softPixel } = await import('/src/styles/soft-pixel.ts');
    const original = softPixel.renderGlyph;
    (window as any).rendered = [];
    softPixel.renderGlyph = (context: any) => { (window as any).rendered.push(context.instance ?? context.letter); return original(context); };
  });
  const alphabetPixel = page.locator('[data-pixel="A:6:10"]');
  const shape = alphabetPixel.locator('.pixel-shape'); const originalWidth = await shape.getAttribute('width');
  await alphabetPixel.click(); await page.locator('input[name="selectedScale"]').fill('1.4');
  await expect.poll(() => page.evaluate(() => (window as any).rendered)).toEqual(['A']);
  expect(Number(await shape.getAttribute('width'))).toBeGreaterThan(Number(originalWidth));
  await expect(page.locator('.glyph-cell[data-letter="B"] svg')).toHaveAttribute('data-retained', 'yes');
  await action(page, 'undo').click();
  await expect(shape).toHaveAttribute('width', originalWidth!);
  await expect(page.locator('.glyph-cell[data-letter="B"] svg')).toHaveAttribute('data-retained', 'yes');
  await action(page, 'word').click(); await page.locator('#word-input').fill('AABA');
  await expect(page.locator('.word-svg > svg')).toHaveCount(4);
  await page.locator('.word-svg > svg').nth(1).evaluate(node => node.setAttribute('data-retained', 'yes'));
  await page.evaluate(() => { (window as any).rendered = []; });
  const pixel = page.locator('[data-pixel="w@0:A:6:10"]');
  await pixel.click(); await pixel.focus(); await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (window as any).rendered)).toEqual(['w@0:A']);
  await expect(page.locator('.word-svg > svg').nth(1)).toHaveAttribute('data-retained', 'yes');
  await expect(pixel).toBeFocused();
  await action(page, 'undo').click(); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await expect(page.locator('.word-svg > svg').nth(1)).toHaveAttribute('data-retained', 'yes');
});

test('word cache refreshes inherited base edits and mode changes without rebuilding layout-only changes', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite development modules.
    const { softPixel } = await import('/src/styles/soft-pixel.ts');
    // @ts-expect-error Vite development modules.
    const { folkOrnamental } = await import('/src/styles/folk-ornamental.ts');
    // @ts-expect-error Vite development modules.
    const { renderWord } = await import('/src/ui/word-renderer.ts');
    // @ts-expect-error Vite development modules.
    const { renderAlphabet } = await import('/src/ui/renderer.ts');
    // @ts-expect-error Vite development modules.
    const { invalidateGlyphs, cachedGlyphs } = await import('/src/ui/glyph-cache.ts');
    // @ts-expect-error Vite development modules.
    const { VISIBLE_CHARACTERS } = await import('/src/styles/characters.ts');
    const container = document.createElement('div');
    let calls: string[] = [];
    const style = { ...softPixel, renderGlyph(context: any) { calls.push(context.instance ?? context.letter); return softPixel.renderGlyph(context); } };
    const state: any = { params: { ...style.defaults }, edits: {}, positions: {} };
    const selected = new Set<string>();
    const draw = () => { calls = []; renderWord(container, style, state, selected, 'AA:B'); return [...calls]; };
    const rows = [draw()];
    const outer = container.firstElementChild;
    state.positions['w@0:A:6:10'] = { x: 4, y: 0 }; rows.push(draw());
    const untouched = container.querySelector('[data-pixel="w@1:A:6:10"]');
    state.params.spacing = 30; rows.push(draw());
    const layoutRetained = untouched === container.querySelector('[data-pixel="w@1:A:6:10"]') && outer === container.firstElementChild;
    state.addedPixels = { 'A:0:m0': { row: 3, column: 3 } }; rows.push(draw());
    state.removedPixels = { 'w@1:A:0:m0': true }; rows.push(draw());
    const scopedRemoval = !!container.querySelector('[data-pixel="w@0:A:0:m0"]') && !container.querySelector('[data-pixel="w@1:A:0:m0"]');
    state.edits['A:6:10'] = 1.4; rows.push(draw());
    delete state.positions['w@0:A:6:10']; rows.push(draw());
    selected.add('w@0:A:6:10'); rows.push(draw());
    selected.clear(); rows.push(draw());
    container.querySelector('[data-pixel="w@0:A:6:10"]')!.setAttribute('transform', 'translate(99 99)');
    invalidateGlyphs(container, ['w@0:A:6:10']); rows.push(draw());
    const restored = container.querySelector('[data-pixel="w@0:A:6:10"]')!.getAttribute('transform');
    calls = []; renderAlphabet(container, style, state, selected, null);
    const alphabet = { calls: calls.length, entries: cachedGlyphs(container).size, count: VISIBLE_CHARACTERS.length };
    rows.push(draw());
    const wordEntries = cachedGlyphs(container).size;
    renderWord(container, folkOrnamental, { params: folkOrnamental.defaults, edits: {} }, selected, 'AA:B');
    return { rows, layoutRetained, scopedRemoval, restored, alphabet, wordEntries, switched: container.querySelector('[data-folk-base]') !== null };
  });
  const all = ['w@0:A', 'w@1:A', 'w@2:u003a', 'w@3:B'];
  expect(result.rows).toEqual([all, ['w@0:A'], [], ['w@0:A', 'w@1:A'], ['w@1:A'], ['w@0:A', 'w@1:A'], ['w@0:A'], ['w@0:A'], ['w@0:A'], ['w@0:A'], all]);
  expect(result.layoutRetained).toBe(true); expect(result.scopedRemoval).toBe(true);
  expect(result.restored).toBe('translate(0 0)');
  expect(result.alphabet.calls).toBe(result.alphabet.count); expect(result.alphabet.entries).toBe(result.alphabet.count);
  expect(result.wordEntries).toBe(4); expect(result.switched).toBe(true);
});
