import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {getDb} from '../db/client.js';import {runs} from '../db/schema.js';import {eq} from 'drizzle-orm';
if(process.env.PORT!=='5182')throw Error('Use .env.test');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5183');
 await page.locator('#helpOpen').click();assert.equal(await page.locator('#help .helpArt').count(),3);
 assert.match(await page.locator('#help').innerText(),/Touch or click the actual A, B, or C circle/);
 await page.screenshot({path:'artifacts/help-mobile.png'});await page.locator('#helpClose').click();
 await page.clock.install();await page.locator('#challenge').click();
 const startResponse=page.waitForResponse(r=>r.url().endsWith('/api/game')&&r.request().postDataJSON()?.action==='start');await page.locator('#start').click();const {session}=await (await startResponse).json();
 assert.equal(await page.locator('#clock').innerText(),'90s');assert.match(await page.locator('#clockLabel').innerText(),/PAUSED/);
 await page.clock.runFor(3050);assert.equal(await page.locator('#clock').innerText(),'90s');assert.match(await page.locator('#clockLabel').innerText(),/PAUSED/);
 await page.clock.runFor(1150);await page.locator('.answer:not([disabled])').first().waitFor();assert.equal(await page.locator('#clockLabel').innerText(),'TIME LEFT');
 const [run]=await getDb().select().from(runs).where(eq(runs.id,session));assert.equal(run.timing.phase,'running');
 const question=run.deck[0],wrongIndex=question.choices.findIndex(x=>x!==question.correct);
 await page.locator('.answer').nth(wrongIndex).click();await page.waitForFunction(()=>document.querySelector('#score').textContent==='-5');
 await page.clock.runFor(1900);await page.locator('#next').click();await page.locator('#prePitch:not([hidden])').waitFor();
 const paused=await page.locator('#clock').innerText();await page.clock.runFor(3050);assert.equal(await page.locator('#clock').innerText(),paused);assert.match(await page.locator('#clockLabel').innerText(),/PAUSED/);
 await page.clock.runFor(1150);await page.locator('.answer:not([disabled])').first().waitFor();
 await getDb().update(runs).set({expiresAt:new Date(Date.now()-1000)}).where(eq(runs.id,session));
 await page.clock.fastForward(91000);await page.locator('#results[open]').waitFor();assert.match(await page.locator('#resultText').innerText(),/-5 points/);
 assert.equal(await page.locator('.missedPlay').count(),1);await page.locator('#nickname').fill('QA-NewRules');await page.locator('#saveScore button').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent.includes('Posted! -5'));
 const board=await (await fetch('http://127.0.0.1:5183/api/game?action=board')).json();assert.ok(board.scores.some(s=>s.nickname==='QA-NewRules'&&s.score===-5));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS: illustrated help, paused setup and hit, resumed decision clock, -5 wrong answer, second-play pause, expiry review, negative-score leaderboard posting.');
}finally{await browser.close();}
