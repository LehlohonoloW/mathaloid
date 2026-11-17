import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { createAtlasServer } from './serve.mjs';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.ATLAS_PLAYWRIGHT_MODULE || 'playwright');
const server=createAtlasServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true});const errors=[];
try {
const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
const origin=`http://127.0.0.1:${server.address().port}`;
await page.goto(origin);await page.locator('body.home-active').waitFor();
async function ask(text){await page.locator('#chatInput').fill(text);await page.locator('.chat-send').click();return page.locator('#chatLog .bot').last().innerText();}
assert.match(await ask('2(x+3)=18'),/x = 6/);assert.match(await ask('why'),/left side 18, right side 18/);
assert.match(await ask('1/2+1/3'),/5\/6/);assert.match(await ask('1/0'),/zero is undefined/);
assert.match(await ask('x=x'),/Every real/);assert.match(await ask('mean of 4, 8, 12'),/8/);
await ask('quiz me for grade 4');const before=await page.evaluate(()=>Engine.exportJSON());
assert.match(await ask('hint'),/Hint/);assert.equal(await page.evaluate(()=>Engine.exportJSON()),before);
assert.match(await ask('skip'),/paused/);await ask('2+2');assert.match(await page.locator('#chatLog .bot').last().innerText(),/4/);
await page.locator('.pin-observatory').click();await page.locator('#view-learn.is-active').waitFor();
await page.goto(origin+'/#home');
await ask('2(x+3)=18');
await mkdir('docs/.docs/evidence',{recursive:true});
for(const width of [1440,390]){
await page.setViewportSize({width,height:1000});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.waitForTimeout(400);
await page.screenshot({path:`docs/.docs/evidence/immersive-${width}.png`,fullPage:true});
console.log('PASS immersive layout and tutor at',width);
}
await page.locator('.pin-bridge').click();await page.locator('#worldStart').click();assert.equal(await page.locator('.world-canvas').count(),1);
assert.deepEqual(errors,[]);console.log('PASS quiz hints preserve progress, worked follow-ups, landscape destinations and world entry');
}finally{await browser.close();await new Promise(r=>server.close(r));}
