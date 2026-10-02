import { test, expect } from '@playwright/test';
import { SYMBOLS, DIGITS, VISIBLE_CHARACTERS } from '../../src/styles/characters';
test.setTimeout(90_000);

test('all styles render every symbol as native artwork with deterministic botanical growth and export parity', async ({ page }) => {
  await page.goto('/');
  const results = await page.evaluate(async () => {
    // @ts-expect-error Vite development module.
    const { styles } = await import('/src/styles/index.ts');
    // @ts-expect-error Vite development module.
    const { SYMBOLS, DIGITS } = await import('/src/styles/characters.ts');
    // @ts-expect-error Vite development module.
    const { exportSvg } = await import('/src/utils/export-svg.ts');
    return styles.map((style: any) => {
      const state = { params: style.defaults, edits: {} };
      const render = (letter: string, seed = state.params.seed) => style.renderGlyph({ letter, state: { ...state, params: { ...state.params, seed } }, selected: new Set(), interactive: false });
      const chars = [...SYMBOLS, ...DIGITS];
      const glyphs = chars.map((char: string) => {
        const svg = render(char);
        const exported = new DOMParser().parseFromString(exportSvg(style, state, { letters: [char], ink: '#135724' }), 'image/svg+xml');
        return { char, shapes: svg.querySelectorAll('path,rect,circle,ellipse').length,
          forbidden: svg.querySelectorAll('text,image,use,foreignObject').length,
          deterministic: svg.outerHTML === render(char).outerHTML,
          exported: exported.querySelectorAll('path,rect,circle,ellipse').length,
          error: exported.querySelectorAll('parsererror').length };
      });
      const space = render(' ');
      return { id: style.id, glyphs, spaceShapes: space.querySelectorAll('path,rect,text,circle,ellipse').length,
        spaceWidth: style.glyphWidth(' ', state), narrow: style.glyphWidth('.', state), wide: style.glyphWidth('@', state),
        seedChanges: render('@', 7).outerHTML !== render('@', 8).outerHTML,
        alphabetCount: [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].filter(char => render(char).querySelector('text,rect,path')).length };
    });
  });
  expect(results).toHaveLength(3);
  for (const result of results) {
    expect(result.glyphs.map((glyph: any) => glyph.char)).toEqual([...SYMBOLS, ...DIGITS]);
    expect(result.spaceShapes).toBe(0); expect(result.spaceWidth).toBeGreaterThan(0);
    expect(result.wide).toBeGreaterThan(result.narrow); expect(result.alphabetCount).toBe(26);
    for (const glyph of result.glyphs) {
      expect(glyph.shapes, glyph.char).toBeGreaterThan(0); expect(glyph.exported, glyph.char).toBeGreaterThan(0);
      expect(glyph.forbidden).toBe(0); expect(glyph.error).toBe(0); expect(glyph.deterministic).toBe(true);
    }
    if (result.id === 'botanical') expect(result.seedChanges).toBe(true);
  }
});

test('gallery sections, mixed text, spaces, and lowercase normalization work in all styles', async ({ page }) => {
  await page.goto('/');
  for (const index of [0, 1, 2]) {
    await page.locator(`[data-style="${index}"]`).click();
    await expect(page.locator('.glyph-cell')).toHaveCount(VISIBLE_CHARACTERS.length);
    await expect(page.locator('.glyph-cell[data-section="symbols"]')).toHaveCount(SYMBOLS.length);
    await expect(page.locator('.glyph-cell[data-section="numbers"]')).toHaveCount(10);
    await expect(page.locator('.glyph-section-title')).toHaveText(['A–Z', 'Symbols', 'Numbers']);
    await page.locator('[data-action="word"]').click();
    for (const text of ['Hello, world!', '"Plants & Pixels"', '(A+B) = C', 'hello@world', '50%', '€5 + £10', 'WHY?', '[A] {B} <C>', '  A  B  ', "' \" \\ / (A) [B] {C} <D>"]) {
      await page.locator('#word-input').fill(text);
      await expect(page.locator('#word-input')).toHaveValue(text.toUpperCase());
      await expect(page.locator('.word-svg > svg')).toHaveCount(text.length);
    }
    await page.reload();
    await expect(page.locator('#word-input')).toHaveValue("' \" \\ / (A) [B] {C} <D>");
    await page.locator('[data-action="back"]').click();
  }
});

test('quote, colon, at and backslash modules support focus, scoped editing, persistence and JSON', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  for (const char of ['"', '\\', ':', '@', '<']) {
    await page.getByRole('button', { name: `Focus letter ${char}`, exact: true }).click();
    const id = await page.locator('[data-pixel]').first().getAttribute('data-pixel');
    const pixel = page.locator(`[data-pixel="${id}"]`);
    await pixel.click(); await pixel.focus(); await page.keyboard.press('ArrowRight');
    await expect(pixel).toHaveAttribute('transform', 'translate(1 0)');
    await page.locator('#scope').selectOption('letter');
    await page.locator('input[name="selectedScale"]').fill('1.2');
    await page.locator('[data-action="back"]').click();
    await expect(page.getByRole('button', { name: `Focus letter ${char}`, exact: true })).toBeFocused();
  }
  await page.locator('[data-action="word"]').click();
  await page.locator('#word-input').fill(':@"\\€');
  const repeatedId = await page.locator('[data-pixel^="w@0:u003a:"]').first().getAttribute('data-pixel');
  const repeated = page.locator(`[data-pixel="${repeatedId}"]`);
  await expect(repeated).toHaveAttribute('transform', 'translate(1 0)'); // Inherit the base colon edit.
  await repeated.click(); await repeated.focus(); await page.keyboard.press('ArrowRight');
  await expect(repeated).toHaveAttribute('transform', 'translate(2 0)');
  await page.reload(); await expect(repeated).toHaveAttribute('transform', 'translate(2 0)');
  await page.locator('[data-action="configuration"]').click();
  const input = page.getByRole('textbox', { name: 'Configuration JSON' });
  const saved = JSON.parse(await input.inputValue());
  expect(saved.word).toBe(':@"\\€');
  expect(Object.keys(saved.styles['soft-pixel'].edits).some(id => id.startsWith('u0022:'))).toBe(true);
  await page.locator('#config-import').click();
  await expect(page.locator('#word-input')).toHaveValue(':@"\\€');
});

test('mixed word exports in all styles contain native geometry and invisible spaces', async ({ page }) => {
  await page.goto('/');
  for (const index of [0, 1, 2]) {
    await page.locator(`[data-style="${index}"]`).click();
    await page.locator('[data-action="word"]').click();
    const text = 'A+B $€£ @&% ? {} * " \\ 50';
    await page.locator('#word-input').fill(text);
    await page.locator('[data-action="export"]').click();
    await page.locator('#export-scope').selectOption('word');
    const downloading = page.waitForEvent('download');
    await page.locator('[data-action="download-svg"]').click();
    const stream = await (await downloading).createReadStream();
    const chunks = []; for await (const chunk of stream!) chunks.push(chunk);
    const source = Buffer.concat(chunks).toString();
    const parsed = await page.evaluate(source => {
      const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
      return { errors: doc.querySelectorAll('parsererror').length, forbidden: doc.querySelectorAll('text,image,use,foreignObject').length,
        groups: doc.querySelectorAll('[id^="letter-"]').length,
        spaceShapes: [...doc.querySelectorAll('[id$="-u0020"]')].reduce((sum, g) => sum + g.querySelectorAll('rect,path,circle').length, 0),
        shapes: doc.querySelectorAll('rect,path,circle').length };
    }, source);
    expect(parsed.errors).toBe(0); expect(parsed.forbidden).toBe(0); expect(parsed.groups).toBe(text.length);
    expect(parsed.spaceShapes).toBe(0); expect(parsed.shapes).toBeGreaterThan(20);
  }
});
