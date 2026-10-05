import { test, expect, type Page } from '@playwright/test';
const action = (page: Page, name: string) => page.locator(`[data-action="${name}"]`);
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('alphabet-lab:v1')!));
async function focus(page: Page, letter = 'A') {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  await page.getByRole('button', { name: `Focus letter ${letter}`, exact: true }).click();
}
async function cellPoint(page: Page, row: number, column: number) {
  await expect(page.locator('[data-pixel-grid]')).toHaveCount(1);
  await page.locator('.is-focused .glyph-svg').scrollIntoViewIfNeeded();
  return page.locator('[data-pixel-grid]').evaluate((group: SVGGraphicsElement, { row, column }) => {
    const point = new DOMPoint((column * 32 - 64 + 16) * .13, (row * 32 - 832 + 16) * .13).matrixTransform(group.getScreenCTM()!);
    return { x: point.x, y: point.y };
  }, { row, column });
}
async function add(page: Page, row: number, column: number) {
  const point = await cellPoint(page, row, column);
  await page.mouse.click(point.x, point.y);
}
test('visible construction grid, empty-cell preview, add/select/scale/delete, undo and reset', async ({ page }, info) => {
  await focus(page);
  const count = await page.locator('[data-pixel]').count();
  const toggle = page.getByRole('checkbox', { name: 'Grid', exact: true });
  await expect(toggle).not.toBeChecked(); await expect(page.locator('.pixel-grid')).toHaveCount(0);
  await toggle.check(); await expect(page.locator('.pixel-grid')).toHaveCount(1);
  const point = await cellPoint(page, 3, 3);
  await page.mouse.move(point.x, point.y);
  await expect(page.locator('.pixel-grid-preview')).toHaveAttribute('visibility', 'visible');
  expect(await page.locator('.pixel-grid').evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none');
  await page.screenshot({ path: `.qa/pixel-grid-${info.project.name}.png`, fullPage: true });
  await page.mouse.click(point.x, point.y);
  const manual = page.locator('[data-pixel="A:0:m0"]');
  await expect(manual).toBeVisible(); await expect(manual).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-pixel]')).toHaveCount(count + 1);
  await add(page, 3, 3); await expect(page.locator('[data-pixel]')).toHaveCount(count + 1);
  await add(page, 3, 5);
  await expect.poll(async () => Object.keys((await saved(page)).styles['soft-pixel'].addedPixels ?? {}).length).toBe(2);
  const singleExport = await page.evaluate(async () => {
    // @ts-expect-error Vite source module.
    const { softPixel } = await import('/src/styles/soft-pixel.ts');
    // @ts-expect-error Vite source module.
    const { exportSvg } = await import('/src/utils/export-svg.ts');
    const state = JSON.parse(localStorage.getItem('alphabet-lab:v1')!).styles['soft-pixel'];
    return exportSvg(softPixel, state, { letters: ['A'], ink: '#292b26' });
  });
  expect(singleExport).toContain('A:0:m0');
  expect(singleExport).not.toContain('pixel-grid');
  await manual.click({ modifiers: ['Shift'] }); await expect(page.locator('.pixel.is-selected')).toHaveCount(2);
  await page.locator('input[name="selectedScale"]').fill('1.3');
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].edits['A:0:m0']).toBe(1.3);
  await manual.click(); await manual.focus(); await page.keyboard.press('ArrowRight');
  await expect(manual).toHaveAttribute('transform', 'translate(4.16 0)');
  await page.keyboard.press('Delete'); await expect(manual).toHaveCount(0);
  await action(page, 'undo').click(); await expect(manual).toHaveCount(1);
  await expect(manual).toHaveAttribute('transform', 'translate(4.16 0)');
  await action(page, 'redo').click(); await expect(manual).toHaveCount(0);
  const authored = page.locator('[data-pixel="A:6:10"]');
  await authored.click(); await authored.focus(); await page.keyboard.press('Backspace'); await expect(authored).toHaveCount(0);
  await action(page, 'reset-glyph').click();
  await expect(authored).toHaveCount(1); await expect(page.locator('[data-pixel]')).toHaveCount(count);
  await expect(toggle).toBeChecked();
  await toggle.uncheck(); await expect(page.locator('.pixel-grid')).toHaveCount(0);
});
test('manual edits survive glyph changes, lowercase, word occurrences, JSON load and grid-free SVG export', async ({ page }) => {
  await focus(page); await page.getByRole('checkbox', { name: 'Grid', exact: true }).check();
  await add(page, 3, 3); await add(page, 3, 5); await add(page, 3, 7);
  await action(page, 'back').click();
  await page.getByRole('button', { name: 'Focus letter B', exact: true }).click();
  await action(page, 'back').click();
  await page.getByRole('button', { name: 'Focus letter A', exact: true }).click();
  await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(3);
  await expect.poll(async () => Object.keys((await saved(page)).styles['soft-pixel'].addedPixels).length).toBe(3);
  await page.reload(); await page.getByRole('button', { name: 'Focus letter A', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Grid', exact: true })).toBeChecked();
  await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(3);
  const aliases = await page.evaluate(async () => {
    // @ts-expect-error Vite source module.
    const { softPixel } = await import('/src/styles/soft-pixel.ts');
    const state = JSON.parse(localStorage.getItem('alphabet-lab:v1')!).styles['soft-pixel'];
    const context = { state, selected: new Set(), interactive: true };
    return softPixel.renderGlyph({ ...context, letter: 'A' }).outerHTML === softPixel.renderGlyph({ ...context, letter: 'a' }).outerHTML;
  });
  expect(aliases).toBe(true);
  await action(page, 'word').click(); await page.locator('#word-input').fill('alabama');
  await expect(page.locator('#word-input')).toHaveValue('ALABAMA');
  await expect(page.locator('[data-pixel$=":0:m0"]')).toHaveCount(4);
  await expect(page.locator('.pixel-grid')).toHaveCount(0);
  await action(page, 'configuration').click();
  const json = await page.getByRole('textbox', { name: 'Configuration JSON' }).inputValue();
  await page.locator('#config-import').click();
  await expect(page.locator('[data-pixel$=":0:m0"]')).toHaveCount(4);
  await action(page, 'export').click(); await page.locator('#export-scope').selectOption('word');
  const downloading = page.waitForEvent('download'); await action(page, 'download-svg').click();
  const stream = await (await downloading).createReadStream(); const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString();
  expect(source).toContain('w@0:A:0:m0'); expect(source).toContain('w@6:A:0:m2');
  expect(source).not.toContain('pixel-grid'); expect(source).not.toContain('is-selected');
  const data = JSON.parse(json).styles['soft-pixel'];
  expect(Object.keys(data.addedPixels)).toHaveLength(3);
  await action(page, 'back').click(); await page.getByRole('button', { name: 'Focus letter A', exact: true }).click();
  await action(page, 'reset-glyph').click(); await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(0);
});
test('grid uses glyph CTM through scale and resizing and never adds after a moved/cancelled gesture', async ({ page }) => {
  await focus(page); await page.getByRole('checkbox', { name: 'Grid', exact: true }).check();
  await page.getByText('Spacing & layout', { exact: true }).click();
  await page.locator('input[name="scale"]').fill('1.1');
  await page.setViewportSize({ width: 920, height: 1000 });
  let point = await cellPoint(page, 3, 3);
  await page.mouse.move(point.x, point.y); await page.mouse.down();
  await page.mouse.move(point.x + 15, point.y); await page.mouse.move(point.x, point.y); await page.mouse.up();
  await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(0);
  await page.mouse.down(); await page.locator('#alphabet').dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up();
  await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(0);
  await add(page, 3, 3); const manual = page.locator('[data-pixel="A:0:m0"]');
  const box = (await manual.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 20, box.y + box.height / 2 + 12); await page.mouse.up();
  await expect(page.locator('[data-pixel^="A:0:m"]')).toHaveCount(1);
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].positions['A:0:m0']?.x ?? 0).not.toBe(0);
  const offset = (await saved(page)).styles['soft-pixel'].positions['A:0:m0'];
  expect(offset.x / 4.16).toBeCloseTo(Math.round(offset.x / 4.16), 8);
  await action(page, 'undo').click(); await expect(manual).toHaveAttribute('transform', 'translate(0 0)');
  await page.setViewportSize({ width: 700, height: 850 });
  await add(page, 3, 5); await expect(page.locator('[data-pixel="A:0:m1"]')).toHaveCount(1);
});
test('touch tap adds a chart cell and text-input Backspace keeps selected modules', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch input coverage.');
  await focus(page); await page.getByRole('checkbox', { name: 'Grid', exact: true }).check();
  const point = await cellPoint(page, 3, 3); await page.touchscreen.tap(point.x, point.y);
  await expect(page.locator('[data-pixel="A:0:m0"]')).toHaveCount(1);
  await page.locator('input[name="seed"]').focus(); await page.keyboard.press('Backspace');
  await expect(page.locator('[data-pixel="A:0:m0"]')).toHaveCount(1);
});
