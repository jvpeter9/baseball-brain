import {chromium} from 'file:///C:/Users/jvpet/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {getDb} from '../db/client.js';
import {runs} from '../db/schema.js';
import {eq} from 'drizzle-orm';
if(!process.env.DATABASE_URL||process.env.PORT!=='5182')throw Error('Run only against .env.test');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:5182');
 await page.locator('#challenge').click();
 const response=page.waitForResponse(r=>r.url().endsWith('/api/game')&&r.request().postDataJSON()?.action==='start');
 await page.locator('#start').click();
 const {session}=await (await response).json();
 await page.locator('.answer:not([disabled])').first().waitFor();
 await page.locator('.answer').first().click();
 await page.locator('#next:visible').waitFor();
 // Expire only this generated QA session on the isolated branch, then advance browser time.
 await getDb().update(runs).set({expiresAt:new Date(Date.now()-1000)}).where(eq(runs.id,session));
 await page.clock.install();await page.clock.fastForward(95000);
 await page.locator('#results[open]').waitFor();
 const nickname='QA'+Date.now().toString().slice(-8);
 await page.locator('#nickname').fill(nickname);await page.locator('#saveScore button').click();
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent.startsWith('Posted!'));
 const second=await browser.newPage();await second.goto('http://127.0.0.1:5182');await second.locator('#boardOpen').click();
 await second.getByRole('cell',{name:nickname,exact:true}).waitFor();
 const duplicate=await page.evaluate(async session=>{const r=await fetch('/api/game',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finish',session,nickname:'DifferentName'})});return r.status;},session);
 assert.equal(duplicate,200);
 await second.locator('#boardClose').click();await second.locator('#boardOpen').click();
 await second.getByRole('cell',{name:nickname,exact:true}).waitFor();
 assert.equal(await second.getByRole('cell',{name:'DifferentName',exact:true}).count(),0);
 await page.screenshot({path:'artifacts/challenge-posted.png',fullPage:true});
 console.log('PASS: challenge expiry, nickname form, persistent score submission, separate-browser visibility and idempotent posting on isolated test branch.');
}finally{await browser.close();}
