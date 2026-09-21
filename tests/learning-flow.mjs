import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import source from '../scenarios.json' with {type:'json'};
import {buildPlays,roles,starts,destinations,roleNames} from '../model.js';
const plays=buildPlays(source),browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:5181');
 await page.locator('#start:not([disabled])').waitFor();await page.clock.install();
 await page.locator('#start').click();await page.locator('#prePitch:not([hidden])').waitFor();
 assert.equal(await page.locator('#prepCount').textContent(),'3');
 assert.equal(await page.locator('.answer').count(),0);
 assert.ok(!/Single|Extra bases|Throw to/i.test(await page.locator('main').textContent()));
 assert.ok(!/Throw to|hit to/i.test(await page.locator('#field').getAttribute('aria-label')));
 await page.screenshot({path:'artifacts/countdown-mobile.png'});
 await page.clock.runFor(1050);assert.equal(await page.locator('#prepCount').textContent(),'2');
 await page.clock.runFor(1000);assert.equal(await page.locator('#prepCount').textContent(),'1');
 await page.clock.runFor(1100);assert.equal(await page.locator('#prePitch').isVisible(),false);
 await page.clock.runFor(1150);await page.locator('.answer:not([disabled])').first().waitFor();
 // Resolve the displayed scenario without exposing a test-only hook in the app.
 const role=(await page.locator('.roleBadge').textContent()).trim();
 const chips=await page.locator('.chips span').allTextContents();
 const play=plays.find(p=>chips[0]===`${p.kind==='single'?'Single':'Extra bases'} to ${p.field}`&&chips[2]===`Throw to ${p.target==='home'?'home':p.target+' base'}`&&chips[1]===(p.runners.length?`${p.runners.length===1?'Runner':'Runners'} on ${p.runners.join(' and ')}`:'Bases empty'));
 assert.ok(play);const correctLabel=destinations[play.assignments[role]].label;
 const labels=await page.locator('.answer span').allTextContents();const wrong=labels.findIndex(l=>l!==correctLabel);
 await page.locator('.answer').nth(wrong).click();
 await page.clock.runFor(600);
 const halfway=await page.locator(`[data-fielder="${role}"]`).evaluate(el=>[Number(el.dataset.x),Number(el.dataset.y)]);
 assert.notDeepEqual(halfway,starts[role]);assert.notDeepEqual(halfway,destinations[play.assignments[role]].xy);
 assert.equal(await page.locator('#next').isDisabled(),true);
 await page.clock.runFor(1200);
 for(const r of roles){const xy=await page.locator(`[data-fielder="${r}"]`).evaluate(el=>[+el.dataset.x,+el.dataset.y]);const expected=destinations[play.assignments[r]].xy;xy.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<.001));}
 for(const r of ['LF','CF','RF'])assert.deepEqual(await page.locator(`[data-fielder="${r}"]`).evaluate(el=>[+el.dataset.x,+el.dataset.y]),starts[r]);
 assert.equal(await page.locator('.marker').count(),0);
 await page.locator('#field').screenshot({path:'artifacts/team-rotation.png'});
 await page.locator('#replay').click();await page.clock.runFor(1800);
 await page.locator('#endPractice').click();
 assert.equal(await page.locator('.missedPlay').count(),1);
 const review=await page.locator('.missedPlay').innerText();assert.ok(review.includes(labels[wrong]));assert.ok(review.includes(correctLabel));assert.match(review,/Why:/);
 assert.equal(await page.locator('#saveScore').isVisible(),false);
 await page.screenshot({path:'artifacts/missed-review-mobile.png'});
 await page.locator('#resultsClose').click();await page.locator('#start').click();await page.clock.runFor(4300);
 await page.locator('#endPractice').click();assert.equal(await page.locator('.missedPlay').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);console.log('PASS: 3/2/1 with no hit clues, animated midpoint and all five final positions, stationary outfielders, replay, missed review, reset, mobile layout.');
}finally{await browser.close();}
