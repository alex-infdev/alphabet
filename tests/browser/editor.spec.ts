import { test, expect, type Page } from '@playwright/test';
const action = (page: Page, name: string) => page.locator(`[data-action="${name}"]`);
const saved = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('alphabet-lab:v1')!));
async function word(page: Page, text = 'LETTER') {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  await action(page, 'word').click(); await page.locator('#word-input').fill(text);
}
async function config(page: Page) { await action(page, 'configuration').click(); return page.getByRole('textbox', { name: 'Configuration JSON' }); }

test('legacy migration, stable repeated-letter identity, persistence and cleanup', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('alphabet-lab:v1')) localStorage.setItem('alphabet-lab:v1', JSON.stringify({ version: 1, activeStyle: 'soft-pixel', word: 'LETTER', wordMode: true, styles: { 'soft-pixel': { params: {}, edits: { 'LETTER@2:T:0:0': 1.5, 'OTHER@0:O:0:0': 1.7 }, positions: { 'LETTER@2:T:0:0': { x: 4, y: 3 } } } } }));
  });
  await page.goto('/'); await expect.poll(async () => (await saved(page)).version).toBe(2);
  await page.locator('#word-input').fill('LETTERS');
  await expect.poll(async () => (await saved(page)).word).toBe('LETTERS');
  expect((await saved(page)).styles['soft-pixel'].edits).toEqual({ 'w@2:T:0:0': 1.5 });
  await page.reload(); await expect(page.locator('#word-input')).toHaveValue('LETTERS');
  await page.locator('#word-input').fill('LE');
  await expect.poll(async () => Object.keys((await saved(page)).styles['soft-pixel'].edits).length).toBe(0);
});

test('selection, scaling, keyboard nudge, roving focus, undo and redo', async ({ page }) => {
  await word(page, 'TT');
  const pixel = page.locator('[data-pixel="w@0:T:0:0"]');
  await pixel.click(); await pixel.focus(); await page.keyboard.press('ArrowRight');
  await expect(pixel).toHaveAttribute('transform', 'translate(1 0)'); await expect(pixel).toBeFocused();
  await expect(page.locator('[data-pixel][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('Control+z'); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await page.keyboard.press('Control+Shift+z'); await expect(pixel).toHaveAttribute('transform', 'translate(1 0)');
  await pixel.click();
  await page.locator('input[name="selectedScale"]').fill('1.5');
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].edits['w@0:T:0:0']).toBe(1.5);
  expect((await saved(page)).styles['soft-pixel'].edits['w@1:T:0:0']).toBeUndefined();
  await pixel.focus(); await page.keyboard.press('Alt+ArrowRight'); await expect(pixel).not.toBeFocused();
  await page.keyboard.press('Space'); await expect(page.locator('[data-pixel][aria-pressed="true"]')).toHaveCount(1);
});

test('drag commits one undo step and cancel restores positions', async ({ page }) => {
  await word(page, 'A'); const pixel = page.locator('[data-pixel="w@0:A:0:1"]'); const id = await pixel.getAttribute('data-pixel');
  const box = (await pixel.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 22, box.y + box.height / 2 + 8, { steps: 6 }); await page.mouse.up();
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].positions[id!]?.x ?? 0).not.toBe(0);
  await action(page, 'undo').click(); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await action(page, 'redo').click(); await expect(pixel).not.toHaveAttribute('transform', 'translate(0 0)');
  const previous = await pixel.getAttribute('transform');
  await pixel.scrollIntoViewIfNeeded(); const cancelBox = (await pixel.boundingBox())!;
  await page.mouse.move(cancelBox.x + cancelBox.width / 2, cancelBox.y + cancelBox.height / 2); await page.mouse.down();
  await page.mouse.move(cancelBox.x + cancelBox.width / 2 + 30, cancelBox.y + cancelBox.height / 2 + 10);
  await page.locator('#alphabet').dispatchEvent('pointercancel', { pointerId: 1 }); await page.mouse.up();
  await expect(pixel).toHaveAttribute('transform', previous!);

});

test('JSON validation, file roundtrip, import undo, share URL and focus restoration', async ({ page }) => {
  await word(page, 'MOON'); const input = await config(page); const original = await input.inputValue();
  await input.fill('{bad'); await page.locator('#config-import').click(); await expect(page.locator('#config-error')).toContainText('Invalid JSON');
  await page.locator('#config-file').setInputFiles({ name: 'preset.json', mimeType: 'application/json', buffer: Buffer.from(original.replace('MOON', 'NOON')) });
  await expect(input).toHaveValue(/NOON/);
  await page.locator('#config-import').click(); await expect(page.locator('#word-input')).toHaveValue('NOON');
  await expect(action(page, 'configuration')).toBeFocused();
  await action(page, 'undo').click(); await expect(page.locator('#word-input')).toHaveValue('MOON');
  await config(page); const download = page.waitForEvent('download'); await page.locator('#config-download').click(); expect((await download).suggestedFilename()).toBe('alphabet-lab.json');
  await page.locator('#config-share').click(); const url = await input.inputValue(); expect(url).toContain('#config=');
  await page.keyboard.press('Escape'); await expect(page.locator('dialog')).not.toBeVisible();
  await expect(action(page, 'configuration')).toBeFocused();
  await page.goto(url); await expect(page.locator('#word-input')).toHaveValue('MOON');
});

test('parameter gestures, regenerate, randomize and reset undo', async ({ page }) => {
  await word(page, 'A'); const before = await config(page); const initial = JSON.parse(await before.inputValue()); await page.keyboard.press('Escape');
  const input = page.locator('input[name="pixelSize"]');
  await input.evaluate((node: HTMLInputElement) => { for (const value of ['10', '11', '12']) { node.value = value; node.dispatchEvent(new Event('input', { bubbles: true })); } node.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.keyboard.press('Control+z'); await expect(input).toHaveValue(String(initial.styles['soft-pixel'].params.pixelSize));
  for (const name of ['regenerate', 'randomize']) {
    await (name === 'regenerate' ? page.getByRole('button', { name: 'Regenerate' }) : action(page, name)).click(); await action(page, 'undo').click();
    const json = await config(page); expect(JSON.parse(await json.inputValue()).styles['soft-pixel']).toEqual(initial.styles['soft-pixel']); await page.keyboard.press('Escape');
  }
  await input.fill('10'); await input.dispatchEvent('change');
  await action(page, 'reset').click(); await expect(input).toHaveValue('13');
  await action(page, 'undo').click(); await expect(input).toHaveValue('10');

});

test('SVG export and dialog keyboard behavior', async ({ page }) => {
  await word(page, 'TT'); await action(page, 'export').click();
  await page.locator('#export-scope').selectOption('custom'); await action(page, 'download-svg').click();
  await expect(page.locator('#export-error')).toBeVisible(); await expect(page.locator('#export-letters')).toBeFocused();
  await page.locator('#export-scope').selectOption('word');
  const downloading = page.waitForEvent('download'); await action(page, 'download-svg').click();
  const download = await downloading; const stream = await download.createReadStream(); const chunks = []; for await (const chunk of stream!) chunks.push(chunk);
  const source = Buffer.concat(chunks).toString(); expect(source).toContain('<metadata>'); expect(source).toContain('letter-0-T'); expect(source).toContain('letter-1-T'); expect(source).not.toContain('tabindex');
  await expect(action(page, 'export')).toBeFocused();
  await action(page, 'about').click(); await page.keyboard.press('r'); await expect(page.locator('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(action(page, 'about')).toBeFocused();
});

test('responsive layout, focused-letter return and screenshots', async ({ page }, info) => {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  await page.getByRole('button', { name: 'Focus letter A', exact: true }).click();
  await expect(page.locator('[data-pixel][tabindex="0"]')).toHaveCount(1);
  await action(page, 'back').click(); await expect(page.getByRole('button', { name: 'Focus letter A', exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `.qa/${info.project.name}.png`, fullPage: true });
});


test('multi-selection movement and scoped position reset are reversible', async ({ page }) => {
  await word(page, 'TT');
  const first = page.locator('[data-pixel="w@0:T:0:0"]'); const second = page.locator('[data-pixel="w@0:T:0:1"]');
  await first.click(); await second.click({ modifiers: ['Shift'] });
  await expect(page.locator('[data-pixel][aria-pressed="true"]')).toHaveCount(2);
  await second.focus(); await page.keyboard.press('Shift+ArrowDown');
  await expect(first).toHaveAttribute('transform', 'translate(0 5)'); await expect(second).toHaveAttribute('transform', 'translate(0 5)');
  await action(page, 'reset-positions').click(); await expect(first).toHaveAttribute('transform', 'translate(0 0)');
  await action(page, 'undo').click(); await expect(first).toHaveAttribute('transform', 'translate(0 5)');
  await action(page, 'back').click(); await expect(action(page, 'word')).toBeFocused();
});

test('touch dragging and cancellation', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'mobile', 'Touch-only mobile input coverage.');
  await word(page, 'A'); const pixel = page.locator('[data-pixel="w@0:A:0:1"]');
  await pixel.scrollIntoViewIfNeeded(); const box = (await pixel.boundingBox())!;
  const session = await context.newCDPSession(page);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 18, y: point.y + 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x + 18, y: point.y + 12 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(pixel).not.toHaveAttribute('transform', 'translate(0 0)');
  await action(page, 'undo').click(); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
});

test('layout-only controls reuse glyphs and dialogs contain keyboard focus', async ({ page }) => {
  await page.goto('/');
  const initial = await page.locator('.glyph-svg').first().evaluate(node => { node.setAttribute('data-reuse-check', 'yes'); return node.outerHTML; });
  await page.getByText('Spacing & layout', { exact: true }).click(); await page.locator('input[name="spacing"]').fill('25');
  await expect(page.locator('.glyph-svg').first()).toHaveAttribute('data-reuse-check', 'yes');
  expect(await page.locator('.glyph-svg').first().evaluate(node => node.outerHTML)).toBe(initial);
  await action(page, 'about').click();
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
  await page.keyboard.press('Escape'); await expect(action(page, 'about')).toBeFocused();
});


test('alphabet cache does not retain direct drag transforms or selection after undo', async ({ page }) => {
  await page.goto('/'); await page.locator('[data-style="1"]').click();
  const pixel = page.locator('[data-pixel="A:0:1"]'); await pixel.scrollIntoViewIfNeeded();
  const box = (await pixel.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 10); await page.mouse.up();
  await expect(pixel).not.toHaveAttribute('transform', 'translate(0 0)');
  await action(page, 'undo').click(); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await expect(page.locator('.pixel.is-selected')).toHaveCount(0);
});


test('optional pixel grid snaps dragging and nudging, persists and supports undo', async ({ page }) => {
  await word(page, 'A');
  const toggle = page.getByRole('checkbox', { name: 'Snap to grid (5 units)' });
  await expect(toggle).not.toBeChecked(); await toggle.check();
  await action(page, 'undo').click(); await expect(toggle).not.toBeChecked();
  await action(page, 'redo').click(); await expect(toggle).toBeChecked();
  const pixel = page.locator('[data-pixel="w@0:A:0:1"]');
  await pixel.scrollIntoViewIfNeeded(); const box = (await pixel.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 17, box.y + box.height / 2 + 11); await page.mouse.up();
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].positions['w@0:A:0:1']?.x ?? 0).not.toBe(0);
  const position = (await saved(page)).styles['soft-pixel'].positions['w@0:A:0:1'];
  expect(position.x % 5).toBe(0); expect(position.y % 5).toBe(0);
  await action(page, 'undo').click(); await expect(pixel).toHaveAttribute('transform', 'translate(0 0)');
  await pixel.focus(); await page.keyboard.press('ArrowRight'); await expect(pixel).toHaveAttribute('transform', 'translate(5 0)');
  await expect.poll(async () => (await saved(page)).styles['soft-pixel'].params.snapToGrid).toBe(true);
  await page.reload(); await expect(toggle).toBeChecked();
  const json = await config(page); expect(JSON.parse(await json.inputValue()).styles['soft-pixel'].params.snapToGrid).toBe(true);
  await page.keyboard.press('Escape'); await toggle.uncheck();
  await pixel.focus(); await page.keyboard.press('ArrowRight'); await expect(pixel).toHaveAttribute('transform', 'translate(6 0)');
});
