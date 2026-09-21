import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';import assert from 'node:assert/strict';import {makeDeck,buildPlays} from '../model.js';import source from '../scenarios.json' with {type:'json'};
const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true}),posts=[],errors=[];page.on('pageerror',e=>errors.push(e.message));let n=0;
 const q=makeDeck(buildPlays(source))[0];
 await page.route('https://baseball-brain-rose.vercel.app/**',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/api/game'){const body=route.request().postDataJSON();let data={};if(body.action==='start')data={session:'test-'+(++n),remainingMs:60000,question:q};if(body.action==='finish'){posts.push(body);data={nickname:body.nickname,score:10};}return route.fulfill({contentType:'application/json',body:JSON.stringify(data)});}
  let file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(['app.js','index.html','model.js','play-animation.js','scenarios.json','style.css'].includes(file)){let body=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');if(file==='app.js')body+='\nglobalThis.endTestRound=()=>{correct=1;total=1;finish();};';return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html',body});}return route.continue();
 });
 await page.goto('https://baseball-brain-rose.vercel.app/');await page.locator('#start:not([disabled])').waitFor();await page.locator('#challenge').click();
 for(const [name,method] of [['Dad','tap'],['Son','tap'],['NewKid','enter']]){
  await page.locator('#start').click();await page.waitForFunction(()=>document.querySelector('#prePitch').hidden===false);await page.evaluate(()=>endTestRound());assert.equal(await page.locator('#nickname').inputValue(),'');
  await page.locator('#nickname').fill(name);if(method==='tap')await page.locator('#saveScore button').tap();else await page.locator('#nickname').press('Enter');
  await page.waitForFunction(name=>document.querySelector('#saveStatus').textContent.includes('Posted as '+name+'!'),name);
  assert.equal(posts.at(-1).nickname,name);assert.equal(posts.at(-1).session,'test-'+n);await page.locator('#resultsClose').click();
 }
 assert.equal(posts.length,3);assert.deepEqual(errors,[]);console.log('PASS: shared-phone names clear each round; tap and Enter submit current name once with correct session and confirmation.');
}finally{await browser.close();}

