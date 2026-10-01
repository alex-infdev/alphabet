import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 1200 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/dev/ambicase.html');
await page.locator('article').last().waitFor();
await page.screenshot({ path: 'dev/comparison.png', fullPage: true });
await page.selectOption('#mode', 'overlay');
await page.screenshot({ path: 'dev/overlay.png', fullPage: true });
for (const letter of ['A', 'F', 'I', 'K', 'M', 'Q', 'R', 'S', 'Y']) {
  await page.locator('article').filter({ hasText: new RegExp(`^${letter} /`) }).screenshot({ path: `dev/detail-${letter}.png` });
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto('http://127.0.0.1:4173/');
await page.locator('[data-style="1"]').click();
const color = () => page.locator('.pixel-shape').first().evaluate(node => getComputedStyle(node).fill);
const before = await color();
await page.locator('[data-action="theme"]').click();
const after = await color();
if (before === after) throw new Error('Theme failed to recolor Soft Pixel');
console.log({ before, after });
await page.screenshot({ path: 'dev/gallery.png', fullPage: true });
await page.getByRole('button', { name: 'Focus letter M', exact: true }).click();
await page.screenshot({ path: 'dev/focused-M.png', fullPage: true });
await browser.close();
