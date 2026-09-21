import assert from 'node:assert/strict';
import handler,{compactQuestion,expandQuestion,publicQuestion,runProjection} from '../api/game.js';
import {buildPlays,makeDeck} from '../model.js';import source from '../scenarios.json' with {type:'json'};
import {getDb} from '../db/client.js';import {runs,scores} from '../db/schema.js';import {eq} from 'drizzle-orm';
if(process.env.PORT!=='5182')throw Error('Use isolated .env.test');
const db=getDb();
async function api(action,data={}){let status=200,body;await handler({method:'POST',body:{action,...data}},{setHeader(){},status(s){status=s;return this;},json(b){body=b;}});return {status,body};}
const deck=makeDeck(buildPlays(source));for(const q of deck){const expanded=expandQuestion(compactQuestion(q));assert.deepEqual(publicQuestion(expanded),publicQuestion(q));assert.equal(expanded.correct,q.correct);assert.equal(expanded.play.explanations[q.role],q.play.explanations[q.role]);}
let measurements=[];
for(const legacy of [false,true]){
 const start=await api('start',{rulesVersion:2});assert.equal(start.status,200);const session=start.body.session;
 if(legacy)await db.update(runs).set({deck}).where(eq(runs.id,session));
 const [full]=await db.select().from(runs).where(eq(runs.id,session));
 const [small]=await db.select(runProjection).from(runs).where(eq(runs.id,session));
 assert.ok(Buffer.byteLength(JSON.stringify(small))<4000);assert.equal(small.deck,undefined);assert.equal(small.deckLength,135);
 measurements.push({legacy,fullBytes:Buffer.byteLength(JSON.stringify(full)),readBytes:Buffer.byteLength(JSON.stringify(small))});
 const q=expandQuestion(full.deck[0]);
 assert.equal((await api('answer',{session,index:0,choice:q.correct})).status,409);
 assert.equal((await api('resume',{session,index:0})).status,200);
 const a=await api('answer',{session,index:0,choice:q.correct});assert.equal(a.body.score,10);assert.deepEqual(a.body.next,publicQuestion(expandQuestion(full.deck[1])));
 assert.deepEqual(await api('answer',{session,index:0,choice:q.correct}),a);
 const pause=await api('begin',{session,index:1});assert.deepEqual(await api('begin',{session,index:1}),pause);
 assert.equal((await api('resume',{session,index:1})).status,200);
 const next=expandQuestion(full.deck[1]);assert.equal((await api('answer',{session,index:1,choice:next.choices.find(c=>c!==next.correct)})).body.score,5);
 assert.equal((await api('finish',{session,nickname:'QA-Traffic'})).status,409);
 await db.update(runs).set({expiresAt:new Date(Date.now()-1000)}).where(eq(runs.id,session));
 assert.equal((await api('finish',{session,nickname:'QA-Traffic'})).body.score,5);
 assert.equal((await api('finish',{session,nickname:'QA-Repeat'})).body.score,5);
 const entries=await db.select().from(scores).where(eq(scores.runId,session));assert.equal(entries.length,1);assert.equal(entries[0].nickname,'QA-Traffic');
}
console.log(JSON.stringify({passed:'compact and legacy gameplay, timing, retries, scoring and leaderboard submission',measurements,oldDeckBytes:Buffer.byteLength(JSON.stringify(deck)),newDeckBytes:Buffer.byteLength(JSON.stringify(deck.map(compactQuestion)))}));
process.exit(0);
