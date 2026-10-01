import { test, expect } from '@playwright/test';

test('all source-derived glyphs render without errors, lowercase aliases and width-aware exports agree', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await page.locator('[data-style="1"]').click();
  await expect(page.locator('.glyph-cell')).toHaveCount(26);
  for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    expect(await page.locator(`[data-letter="${letter}"] [data-pixel]`).count()).toBeGreaterThan(100);
  }
  // Exercise the actual renderer, not just the case-folding text input.
  const aliases = await page.evaluate(async () => {
    // @ts-expect-error Vite serves source modules for development verification.
    const { softPixel } = await import('/src/styles/soft-pixel.ts');
    return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].every(letter => {
      const context = { state: { params: softPixel.defaults, edits: {} }, selected: new Set(), interactive: true };
      return softPixel.renderGlyph({ ...context, letter }).outerHTML === softPixel.renderGlyph({ ...context, letter: letter.toLowerCase() }).outerHTML;
    });
  });
  expect(aliases).toBe(true);
  await page.locator('[data-action="word"]').click();
  await page.locator('#word-input').fill('imwi');
  await expect(page.locator('#word-input')).toHaveValue('IMWI');
  const glyphs = page.locator('.word-svg > svg');
  const widths = await glyphs.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('width'))));
  const xs = await glyphs.evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('x'))));
  expect(widths[1]).toBeGreaterThan(widths[0] * 2);
  xs.slice(1).forEach((x, index) => expect(x).toBeCloseTo(xs[index] + widths[index] + 14, 8));
  const pixel = page.locator('[data-pixel="w@1:M:16:25"]');
  await pixel.click(); await pixel.focus(); await page.keyboard.press('ArrowRight');
  await expect(pixel).toHaveAttribute('transform', 'translate(1 0)');
  await page.reload(); await expect(pixel).toHaveAttribute('transform', 'translate(1 0)');
  await page.locator('[data-action="export"]').click();
  await page.locator('#export-scope').selectOption('word');
  const downloading = page.waitForEvent('download'); await page.locator('[data-action="download-svg"]').click();
  const download = await downloading, stream = await download.createReadStream();
  const chunks = []; for await (const chunk of stream!) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString();
  const exported = await page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
    return { width: Number(doc.documentElement.getAttribute('width')), transforms: [...doc.querySelectorAll('[id^="letter-"]')].map(node => node.getAttribute('transform')), text: doc.querySelectorAll('text').length };
  }, source);
  exported.transforms.forEach((transform, index) => expect(transform).toBe(`translate(${xs[index]} 56)`));
  expect(exported.width).toBeCloseTo(xs[3] + widths[3] + 56, 8);
  expect(exported.text).toBe(0);
  expect(errors).toEqual([]);
});

test('Botanical keeps its ASCII geometry and fixed-width word layout', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-style="0"]').click();
  await expect(page.locator('.glyph-cell')).toHaveCount(26);
  expect(await page.locator('.glyph-cell svg text').count()).toBeGreaterThan(26);
  await expect(page.locator('[data-pixel]')).toHaveCount(0);
  await page.locator('[data-action="word"]').click();
  await page.locator('#word-input').fill('IM');
  const widths = await page.locator('.word-svg > svg').evaluateAll(nodes => nodes.map(node => node.getAttribute('width')));
  expect(widths).toEqual(['120', '120']);
});
