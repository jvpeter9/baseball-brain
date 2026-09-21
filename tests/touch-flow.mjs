import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import source from '../scenarios.json' with {type:'json'};
const browser=await chromium.launch({headless:true});
try{
 for(const [width,height]of [[390,844],[820,1180],[1180,820]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/scenarios.json',route=>route.fulfill({json:source.filter(p=>[5,8].includes(p.page))}));
  await page.goto('http://127.0.0.1:5181');await page.locator('#fieldHint:not([disabled])').waitFor();await page.clock.install();
  await page.locator('#field').tap({position:{x:30,y:30}});assert.equal(await page.locator('#prePitch').isVisible(),true);
  const seen=new Set();
  for(let rep=0;rep<10;rep++){
   await page.clock.runFor(4300);
   const runner=await page.locator('[data-runner]').evaluate(el=>({base:el.dataset.runner,x:+el.getAttribute('cx'),y:+el.getAttribute('cy')}));seen.add(runner.base);
   assert.deepEqual([runner.x,runner.y],runner.base==='first'?[463,383]:[333,287]);
   await page.locator('#field').tap({position:{x:20,y:20}});assert.equal(await page.locator('#prePitch').isVisible(),false);assert.equal(await page.locator('.answer.correct').count(),0);
   const point=await page.locator('.marker').first().evaluate(el=>{const c=el.querySelector('circle'),p=new DOMPoint(+c.getAttribute('cx'),+c.getAttribute('cy')).matrixTransform(el.ownerSVGElement.getScreenCTM());return{x:p.x,y:p.y};});
   // Tap just outside the drawn marker but inside the forgiving touch target on phones.
   await page.touchscreen.tap(point.x,point.y+(width===390?18:0));
   await page.clock.runFor(500);assert.equal(await page.locator('.answer.correct').count(),1);
   await page.locator('#field').tap({position:{x:20,y:20}});assert.equal(await page.locator('#prePitch').isVisible(),false);
   await page.clock.runFor(1300);assert.equal(await page.locator('#fieldHint').isDisabled(),false);
   if(rep===0)await page.screenshot({path:`artifacts/touch-${width}.png`,fullPage:true});
   await page.locator('#field').tap({position:{x:20,y:20}});
   if(rep<9)assert.equal(await page.locator('#prePitch').isVisible(),true);
  }
  assert.deepEqual([...seen].sort(),['first','second']);assert.equal(await page.locator('#results[open]').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const undersized=await page.locator('button:visible').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<47).map(el=>el.id));assert.deepEqual(undersized,[]);
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('PASS: phone + portrait/landscape tablet taps, correct first/second runner leads, expanded hit targets, animation tap guards, next-play taps, no overflow, 48px controls.');
}finally{await browser.close();}
