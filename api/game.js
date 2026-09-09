import {randomUUID} from 'node:crypto';
import source from '../scenarios.json' with {type:'json'};
import {buildPlays,makeDeck} from '../model.js';
import {getDb} from '../db/client.js';
import {runs,scores} from '../db/schema.js';
import {eq,sql,desc} from 'drizzle-orm';
import {scoreAnswer,remainingTime,beginSetup,resumeClock} from '../challenge-rules.js';
const plays=buildPlays(source);
const playById=new Map(plays.map(play=>[play.id,play]));
// Keep the answer and explanation fixed for the lifetime of each game.
export const compactQuestion=q=>({playId:q.play.id,role:q.role,choices:q.choices,correct:q.correct,explanation:q.play.explanations[q.role]});
export function expandQuestion(q){
 if(!q||q.play)return q; // Existing full-deck sessions remain playable.
 const play=playById.get(q.playId);
 if(!play)throw new Error('Unknown stored play');
 return {...q,play:{...play,explanations:{[q.role]:q.explanation}}};
}
// PostgreSQL extracts at most two questions; the full deck never crosses
// the database connection during gameplay, including for legacy sessions.
export const runProjection={id:runs.id,expiresAt:runs.expiresAt,current:runs.current,score:runs.score,submitted:runs.submitted,lastAnswer:runs.lastAnswer,timing:runs.timing,
 deckLength:sql`jsonb_array_length(${runs.deck})`,
 question:sql`${runs.deck} -> ${runs.current}`,
 nextQuestion:sql`${runs.deck} -> (${runs.current} + 1)`};
export const publicQuestion=q=>q?{role:q.role,choices:q.choices,play:{id:q.play.id,page:q.play.page,kind:q.play.kind,field:q.play.field,runners:q.play.runners,target:q.play.target}}:null;
export function nicknameValid(value){return typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9 _-]{1,17}$/.test(value);}
const fail=(status,message)=>Object.assign(new Error(message),{status});
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const db=getDb();
  if(req.method==='GET'){
   const result=await db.select({nickname:scores.nickname,score:scores.score}).from(scores).innerJoin(runs,eq(scores.runId,runs.id)).where(sql`${runs.timing}->>'version' = '2'`).orderBy(desc(scores.score),scores.createdAt).limit(25);
   return res.status(200).json({scores:result});
  }
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||typeof body!=='object')throw fail(400,'Invalid request');
  if(body.action==='start'){
   const id=randomUUID(),deck=makeDeck(plays),now=new Date();
   const timing=body.rulesVersion===2?{version:2,phase:'setup',remainingMs:90000}:null;
   await db.insert(runs).values({id,deck:deck.map(compactQuestion),startedAt:now,expiresAt:new Date(+now+90000),timing});
   return res.status(200).json({session:id,remainingMs:timing?90000:Math.max(0,+now+90000-Date.now()),question:publicQuestion(deck[0])});
  }
  if(!['answer','finish','begin','resume'].includes(body.action))throw fail(400,'Unknown action');
  if(typeof body.session!=='string'||!/^[a-f0-9-]{36}$/.test(body.session))throw fail(400,'Invalid challenge');
  const result=await db.transaction(async tx=>{
   const [run]=await tx.select(runProjection).from(runs).where(eq(runs.id,body.session)).for('update');
   if(!run)throw fail(404,'Challenge not found. Start a new round.');
   if(['begin','resume'].includes(body.action)){
    if(!run.timing||run.submitted)throw fail(409,'Start a new challenge.');
    if(remainingTime(run)<=0)return {expired:true};
    let update;try{update=body.action==='begin'?beginSetup(run,body.index):resumeClock(run,body.index);}catch(e){throw fail(409,e.message);}
    if(Object.keys(update).length)await tx.update(runs).set(update).where(eq(runs.id,run.id));
    return {remainingMs:remainingTime({...run,...update}),question:publicQuestion(expandQuestion(run.question))};
   }
   if(body.action==='finish'){
    if(!nicknameValid(body.nickname))throw fail(400,'Use 2â€“18 letters, numbers, spaces, underscores or hyphens.');
    if(remainingTime(run)>0&&run.current<run.deckLength)throw fail(409,'The challenge is still running.');
    if(!run.submitted){
     await tx.insert(scores).values({runId:run.id,nickname:body.nickname,score:run.score,answered:run.current});
     await tx.update(runs).set({submitted:true}).where(eq(runs.id,run.id));
    }
    return {score:run.score};
   }
   if(remainingTime(run)<=0||run.submitted)return {expired:true};
   if(body.index===run.current-1&&run.lastAnswer?.choice===body.choice)return run.lastAnswer.response;
   if(body.index!==run.current)throw fail(409,'This question was already answered. Restart to begin a new challenge.');
   if(run.timing&&run.timing.phase!=='running')throw fail(409,'Wait for the hit to finish.');
   const q=expandQuestion(run.question);
   if(!q||!q.choices.includes(body.choice))throw fail(400,'Choose one of the three shown positions.');
   const current=run.current+1,score=run.score+(run.timing?scoreAnswer(q.correct===body.choice):(q.correct===body.choice?10:0));
   const response={correct:q.correct,explanation:q.play.explanations[q.role],score,index:current,next:publicQuestion(expandQuestion(run.nextQuestion))};
   await tx.update(runs).set({current,score,lastAnswer:{choice:body.choice,response},...(run.timing?{timing:{...run.timing,phase:'review'}}:{})}).where(eq(runs.id,run.id));
   return response;
  });
  return res.status(200).json(result);
 }catch(error){if(!error.status)console.error('Game API error:',error.code||error.name);return res.status(error.status||503).json({error:error.status?error.message:'The shared leaderboard is temporarily unavailable. Practice still works.'});}
}
