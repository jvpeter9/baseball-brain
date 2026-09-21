import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const errors=[];
await mkdir('artifacts',{recursive:true});
try{
 const page=await browser.newPage({viewport:{width:1365,height:1100},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5181');
 await page.locator('#start:not([disabled])').waitFor();
 await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
 await page.locator('#start').click();
 await page.locator('.answer:not([disabled])').first().waitFor();
 assert.equal(await page.locator('.answer').count(),3);
 await page.locator('.answer').first().click();
 await page.locator('#next:visible').waitFor();
 assert.equal(await page.locator('.answer.correct').count(),1);
 assert.match(await page.locator('#feedback').innerText(),/Spiders guide/);
 await page.screenshot({path:'artifacts/desktop-answer.png',fullPage:true});
 await page.locator('#next').click();
 await page.locator('.marker[role=button]').first().waitFor();
 await page.locator('.marker[role=button]').first().click();
 assert.equal(await page.locator('.answer.correct').count(),1);
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.screenshot({path:'artifacts/mobile-answer.png',fullPage:true});
 await page.locator('#practice').click();
 await page.locator('#challenge').click();
 await page.locator('#start').click();
 await page.locator('.answer:not([disabled])').first().waitFor({timeout:20000});
 await page.locator('.answer').first().click();
 await page.locator('#next:visible').waitFor({timeout:20000});
 assert.match(await page.locator('#clock').innerText(),/s$/);
 await page.locator('#boardOpen').click();
 await page.waitForFunction(()=>!document.querySelector('#rankings').textContent.includes('Loading'));
 assert.ok(!(await page.locator('#rankings').innerText()).includes('unavailable'));
 await page.locator('#boardClose').click();
 // Browser clocks are not authoritative; server rejects an early score submission.
 const security=await page.evaluate(async()=>{
  const post=async data=>{const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});return {status:r.status,data:await r.json()};};
  const run=await post({action:'start'});const session=run.data.session;
  const early=await post({action:'finish',session,nickname:'QA-Test'});
  const invalid=await post({action:'answer',session,index:0,choice:'fake'});
  const answer=await post({action:'answer',session,index:0,choice:run.data.question.choices[0]});
  const retry=await post({action:'answer',session,index:0,choice:run.data.question.choices[0]});
  if(retry.status!==200||retry.data.score!==answer.data.score||retry.data.index!==answer.data.index||retry.data.next.play.id!==answer.data.next.play.id)throw new Error('Retry must be idempotent');
  const replay=await post({action:'answer',session,index:0,choice:run.data.question.choices[1]});
  return {early:early.status,invalid:invalid.status,replay:replay.status,answer:answer.status,leaks:JSON.stringify(run.data).includes('explanations')};
 });
 assert.deepEqual(security,{early:409,invalid:400,replay:409,answer:200,leaks:false});
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile practice, field clicks, feedback, challenge scoring, shared board, early-post rejection, invalid-choice rejection, replay rejection; no page errors.');
}finally{await browser.close();}

