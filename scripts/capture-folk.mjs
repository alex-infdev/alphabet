import { chromium } from '@playwright/test';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1800,height:1200},deviceScaleFactor:1});
page.on('pageerror',error=>{throw error;});
await page.goto('http://127.0.0.1:4173/dev/folk.html');
await page.locator('#alphabet article').last().waitFor();
await page.addStyleTag({content:'header { position: static !important; }'});
await page.locator('#matrix').screenshot({path:'dev/folk-culture.png'});
for(const [ornament,pixelation] of [[0,0],[40,0],[70,0],[40,60],[80,80],[100,100]]) {
 await page.locator('#ornament').fill(String(ornament));await page.locator('#pixelation').fill(String(pixelation));
 await page.locator('#alphabet').screenshot({path:`dev/folk-alphabet-${ornament}-${pixelation}.png`});
 if(ornament===40)await page.locator('#symbols').screenshot({path:`dev/folk-symbols-${pixelation}.png`});
}
await page.goto('http://127.0.0.1:4173/');
await page.locator('[data-style="2"]').click();
await page.screenshot({path:'dev/folk-app-desktop.png'});
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'dev/folk-app-mobile.png',fullPage:true});
await browser.close();
