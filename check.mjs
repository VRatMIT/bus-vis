import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:'/home/mehek/.cache/ms-playwright/chromium-1134/chrome-linux/chrome',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl'],env:{...process.env,LD_LIBRARY_PATH:'/tmp/chrome-deps/root/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BUS_URL||'http://hmsharbor:5009');await page.waitForFunction(()=>window.__busStudio);await page.waitForTimeout(1500);
await page.screenshot({path:'/tmp/bus-desktop.png'});
for(const view of ['side','passenger','rear','top']){await page.locator(`[data-view=${view}]`).click();await page.waitForTimeout(1200);await page.screenshot({path:`/tmp/bus-${view}.png`});}
await page.locator('#reset').click();await page.waitForTimeout(1100);
const before=await page.evaluate(()=>window.__busStudio.camera.position.toArray());await page.mouse.move(800,500);await page.mouse.down();await page.mouse.move(1050,530,{steps:12});await page.mouse.up();await page.waitForTimeout(300);const orbit=await page.evaluate(()=>window.__busStudio.camera.position.toArray());
await page.mouse.wheel(0,-400);await page.waitForTimeout(500);const zoom=await page.evaluate(()=>window.__busStudio.camera.position.distanceTo(window.__busStudio.controls.target));
await page.locator('#rotate').click();const autoStart=await page.evaluate(()=>window.__busStudio.camera.position.toArray());await page.waitForFunction(start=>JSON.stringify(window.__busStudio.camera.position.toArray())!==JSON.stringify(start),autoStart);const autoEnd=await page.evaluate(()=>window.__busStudio.camera.position.toArray());await page.locator('#lighting').click();await page.screenshot({path:'/tmp/bus-dusk.png'});
await page.setViewportSize({width:390,height:844});await page.locator('#reset').click();await page.locator('#lighting').click();await page.waitForTimeout(1200);await page.screenshot({path:'/tmp/bus-mobile.png'});
console.log(JSON.stringify({errors,orbitChanged:JSON.stringify(before)!==JSON.stringify(orbit),zoomDistance:zoom,autoRotates:JSON.stringify(autoStart)!==JSON.stringify(autoEnd),canvas:await page.locator('canvas').count(),mobileOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)},null,2));await browser.close();
