import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { PANELS, highlightGeometry, SHEET } from './src/panels.js';
for(const panel of PANELS){
 const g=highlightGeometry(panel);assert.ok(g.attributes.position.count>0,panel.id+' has geometry');assert.ok([...g.attributes.position.array].every(Number.isFinite),panel.id+' has finite coordinates');g.dispose();
 assert.ok(panel.at[0]>=0&&panel.at[1]>=0&&panel.at[0]+panel.w<=SHEET.width&&panel.at[1]+panel.h<=SHEET.height,panel.id+' fits sheet');
}
const browser=await chromium.launch({executablePath:'/home/mehek/.cache/ms-playwright/chromium-1134/chrome-linux/chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader'],env:{...process.env,LD_LIBRARY_PATH:'/tmp/chrome-deps/root/usr/lib/x86_64-linux-gnu'}});
const page=await browser.newPage({viewport:{width:1360,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BUS_URL||'http://hmsharbor:5009');await page.waitForFunction(()=>window.__busStudio?.panelViewer);
const original=await page.evaluate(()=>window.__busStudio.camera.position.toArray());
await page.locator('#panel-toggle').click();assert.equal(await page.locator('#panel-drawing g[data-panel]').count(),PANELS.length);
await page.locator('[data-panel="driver-coach"]').focus();assert.ok((await page.locator('.panel-status').innerText()).includes('Driver side'));
await page.screenshot({path:'/tmp/panels-sheet.png'});
await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__busStudio.panelViewer.selected?.id==='driver-coach');
assert.equal(await page.locator('#panel-drawing g[data-panel]').count(),1);
assert.ok(await page.locator('#scene').isVisible());
await page.screenshot({path:'/tmp/panels-driver.png'});
await page.locator('#panel-back').click();
for(const id of ['roof','passenger-coach','hood','rear-door','lift-1','driver-fender']){
 await page.locator(`[data-panel="${id}"]`).focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>window.__busStudio.panelViewer.selected.id),id);
 assert.equal(await page.evaluate(()=>window.__busStudio.scene.children.filter(o=>o.name.startsWith('Selected panel:')).length),1);
 await page.screenshot({path:`/tmp/panels-${id}.png`});await page.locator('#panel-back').click();
}
const download=page.waitForEvent('download');await page.locator('#panel-export').click();assert.equal((await download).suggestedFilename(),'bus-panel-sheet.svg');
await page.locator('#panel-close').click();assert.equal(await page.evaluate(()=>window.__busStudio.panelViewer.active),false);
assert.ok(await page.locator('.toolbar').isVisible());assert.ok(await page.evaluate(()=>window.__busStudio.floorGrid.mesh.visible));
await page.setViewportSize({width:390,height:844});await page.locator('#panel-toggle').click();await page.screenshot({path:'/tmp/panels-mobile-sheet.png'});
await page.locator('[data-panel="entry-1"]').focus();await page.keyboard.press('Enter');await page.screenshot({path:'/tmp/panels-mobile-detail.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.keyboard.press('Escape');assert.equal(await page.locator('#panel-drawing g[data-panel]').count(),PANELS.length);await page.keyboard.press('Escape');
assert.deepEqual(errors,[]);console.log(JSON.stringify({panels:PANELS.length,geometry:'valid',selection:'passed',miniView:'passed',export:'passed',mobile:'passed',errors}));await browser.close();
