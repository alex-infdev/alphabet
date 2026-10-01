import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1760, height: 1200 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4173/dev/symbols.html');
await page.locator('section').last().waitFor();
for (const style of ['soft-pixel', 'botanical']) {
  await page.locator(`section[data-style="${style}"]`).screenshot({ path: `dev/symbols-${style}.png` });
}
await page.screenshot({ path: 'dev/symbols-complete.png', fullPage: true });
await browser.close();
