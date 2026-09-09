import {buildPlays,makeDeck,roles,roleNames,starts,bases,destinations,runnerDescription,assignmentReason,missedPlay} from './model.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plays=[],deck=[],q=null,mode='practice',active=false,answered=false,ready=false,correct=0,total=0,streak=0,frame=0,timer,deadline=0,session=null,remoteNext=null,questionIndex=0,animationVersion=0;
let prePitch=false,moving=false,misses=[],answerPending=false,finishRequested=false;
const letters=['A','B','C'];
const runnerOffsets={first:[-17,-17],second:[-17,17],third:[17,17]};
let starting=false,clockPaused=true,pausedMs=90000,transitioning=false;
const line=(a,b,color,dash='')=>`<path d="M${a} L${b}" fill="none" stroke="${color}" stroke-width="2.5" ${dash?`stroke-dasharray="${dash}"`:''} marker-end="url(#arrow)"/>`;
function draw(progress=1,showAnswer=false,movement=1){
 const field=$('field');
 let html=`<defs><pattern id="stripes" width="700" height="74" patternUnits="userSpaceOnUse"><rect width="700" height="37" fill="#ffffff" opacity=".025"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#b1c9c4" stroke-width="2"/></marker></defs><path d="M350 530 L30 210 A390 390 0 0 1 670 210 Z" fill="#214d42" stroke="#ffffff25" stroke-width="2"/><path d="M350 530 L30 210 A390 390 0 0 1 670 210 Z" fill="url(#stripes)"/><path d="M350 530L193 373 Q350 163 507 373Z" fill="#a0946d" opacity=".42"/><path d="M350 496L247 393L350 290L453 393Z" fill="#214d42"/><path d="M20 200L350 530L680 200" fill="none" stroke="#dfebd5" stroke-width="2" opacity=".7"/><path d="M480 400L350 270L220 400" stroke="#d2d9c1" stroke-dasharray="5 8" fill="none" opacity=".4"/><circle cx="350" cy="392" r="22" fill="#9f9371"/><rect x="343" y="390" width="14" height="4" fill="#e9e9d9"/>`;
 for(const [name,[x,y]]of Object.entries(bases)){html+=name==='home'?`<path d="M343 523H357V531L350 537L343 531Z" fill="#eef1dd"/>`:`<rect x="${x-7}" y="${y-7}" width="14" height="14" transform="rotate(45 ${x} ${y})" fill="#eef1dd"/>`;}
 html+=`<text x="510" y="424" fill="#b1c7bb" font-size="12">1ST</text><text x="342" y="250" fill="#b1c7bb" font-size="12">2ND</text><text x="158" y="424" fill="#b1c7bb" font-size="12">3RD</text>`;
 if(q){
  const p=q.play; const hit=[p.field==='left'?(p.kind==='extra'?115:167):p.field==='right'?(p.kind==='extra'?585:533):350,p.kind==='extra'?(p.field==='center'?80:155):(p.field==='center'?128:206)];
  for(const base of p.runners){const [x,y]=bases[base], [dx,dy]=runnerOffsets[base];html+=`<circle data-runner="${base}" cx="${x+dx}" cy="${y+dy}" r="9" fill="#ffcf79" stroke="#172a2c" stroke-width="2"/>`;}
  if(!prePitch){
  html+=line(bases.home,hit,'#ffcf79','4 6');
  const ball=bases.home.map((v,i)=>v+(hit[i]-v)*progress);html+=`<circle cx="${ball[0]}" cy="${ball[1]}" r="6" fill="#fff5d6" stroke="#ffcf79" stroke-width="2"/>`;
  if(showAnswer){for(const role of roles)html+=line(starts[role],destinations[p.assignments[role]].xy,role===q.role?'#61d4bd':'#8eaaa4','3 5');html+=line(hit,bases[p.target],'#c5d6d0','7 7');}
  }
 }
 for(const [role,origin]of Object.entries(starts)){
  const destination=showAnswer&&roles.includes(role)?destinations[q.play.assignments[role]].xy:origin;
  const [x,y]=origin.map((v,i)=>v+(destination[i]-v)*movement);
  const selected=q?.role===role;
  if(selected)html+=`<circle class="selectedHalo" cx="${x}" cy="${y}" r="25" fill="none" stroke="#61d4bd" stroke-width="3"/>`;
  html+=`<g data-fielder="${role}" data-x="${x}" data-y="${y}"><title>${role}${showAnswer&&roles.includes(role)?": "+esc(destinations[q.play.assignments[role]].label):""}</title><circle cx="${x}" cy="${y}" r="17" fill="${selected?'#61d4bd':'#142f38'}" stroke="${selected?'#d6fff0':'#53716f'}" stroke-width="1.5"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${selected?'#0b2425':'#d3e3dc'}" font-size="13" font-weight="700">${role}</text></g>`;
 }
 if(q&&ready&&!showAnswer&&!prePitch)q.choices.forEach((id,i)=>{const[x,y]=destinations[id].xy;html+=`<g class="marker" data-choice="${i}" ${active&&!answered?'role="button" tabindex="0"':''} aria-label="${letters[i]}: ${esc(destinations[id].label)}"><circle cx="${x}" cy="${y}" r="23" fill="${showAnswer&&id===q.correct?'#61d4bd':'#f6dfaa'}" stroke="#10282a" stroke-width="3"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#14282d" font-size="20" font-weight="800">${letters[i]}</text></g>`;});
 field.innerHTML=html;field.setAttribute('role',q&&ready?'group':'img');field.setAttribute('aria-label',q?(prePitch?`${roleNames[q.role]} highlighted. ${runnerDescription(q.play)}.`:`${roleNames[q.role]} highlighted. ${q.play.kind==='single'?'Single':'Extra-base hit'} to ${q.play.field}. Throw to ${q.play.target}.`):'Baseball field');
 field.querySelectorAll('[role=button]').forEach(el=>{el.onclick=e=>{if(e.detail===0){e.stopPropagation();answer(Number(el.dataset.choice));}};el.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();answer(Number(el.dataset.choice));}};});
}
async function api(action,data={}){
 const response=await fetch(`/api/game${action==='board'?'?action=board':''}`,action==='board'?{}:{method:'POST',signal:AbortSignal.timeout(15000),headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
 let result;try{result=await response.json();}catch{throw new Error('The shared leaderboard is unavailable. Practice still works.');}
 if(!response.ok)throw new Error(result.error||'Connection interrupted. Please try again.');return result;
}
const points=()=>correct*10-(total-correct)*5;
function stats(){ $('score').textContent=mode==='practice'?`${correct} / ${total}`:points();$('clock').textContent=mode==='practice'?streak:Math.max(0,Math.ceil((clockPaused?pausedMs:deadline-Date.now())/1000))+'s';if(mode==='challenge')$('clockLabel').textContent=clockPaused?'TIME · PAUSED':'TIME LEFT'; }
function controls(){
 const canAdvance=!answerPending&&!transitioning&&!starting&&!prePitch&&!moving&&(!active||answered);
 $('fieldHint').disabled=!canAdvance;
 $('fieldHint').textContent=!active?'Tap the field to start':prePitch?'Get set…':moving?'Watch everyone move into position':answered?'Tap anywhere on the field for the next play':ready?'Tap A, B or C · or use the answer buttons':'Watch the hit…';
 $('field').classList.toggle('tapReady',canAdvance);
 $('field').setAttribute('tabindex',canAdvance?'0':'-1');
 for(const id of ['start','practice','challenge'])$(id).disabled=answerPending||transitioning;
 document.querySelectorAll('.answer').forEach(b=>b.disabled=!ready||answered||!active);
 $('next').hidden=!answered||!active;$('next').disabled=moving||transitioning;
 $('replay').hidden=!q||!active||prePitch||moving||(!answered&&mode==='challenge');
 $('replay').textContent=answered?'Replay rotation':'Replay hit';
 $('endPractice').hidden=!active||mode!=='practice';
}
function hidePrep(){prePitch=false;$('prePitch').hidden=true;document.querySelector('main').inert=false;document.querySelector('header').inert=false;}
function showPlay(){
 const p=q.play;
 $('question').innerHTML=`<p class="eyebrow">YOU ARE THE <span class="roleBadge">${q.role}</span></p><h2>${roleNames[q.role]}, <br>where do you go?</h2><div class="chips"><span>${p.kind==='single'?'Single':'Extra bases'} to ${p.field}</span><span>${runnerDescription(p)}</span><span>Throw to ${p.target==='home'?'home':p.target+' base'}</span></div><p>${p.kind==='extra'?'The ball gets past the outfielders. Set up the relay.':'The outfielder fields the hit and throws in.'}</p>`;
 $('choices').innerHTML=q.choices.map((id,i)=>`<button class="answer" data-index="${i}" disabled><b>${letters[i]}</b><span>${esc(destinations[id].label)}</span></button>`).join('');
 document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answer(Number(b.dataset.index)));
}
function renderQuestion(){
 answered=false;ready=false;moving=false;prePitch=true;cancelAnimationFrame(frame);
 $('feedback').textContent='';$('clockRetry').hidden=true;$('choices').innerHTML='';
 $('question').innerHTML=`<p class="eyebrow">GET SET</p><h2>${roleNames[q.role]}</h2><p>${runnerDescription(q.play)}</p>`;
 $('count').textContent=`REP ${total+1} · ${mode==='practice'?'PRACTICE':'CHALLENGE'}`;
 $('phase').textContent='GET SET';$('prepRunners').textContent=runnerDescription(q.play);$('prepRole').textContent=`You are playing ${roleNames[q.role].toLowerCase()}.`;
 $('prepCount').textContent='3';$('prePitch').hidden=false;document.querySelector('main').inert=true;document.querySelector('header').inert=true;
 controls();draw(0);document.querySelector('.game').scrollIntoView({behavior:'instant',block:'start'});const version=++animationVersion,start=performance.now();
 const tick=now=>{if(version!==animationVersion||!active)return;const remaining=3000-(now-start);
  if(remaining>0){const count=String(Math.ceil(remaining/1000));if($('prepCount').textContent!==count)$('prepCount').textContent=count;frame=requestAnimationFrame(tick);}
  else{hidePrep();showPlay();animateHit();}
 };frame=requestAnimationFrame(tick);
}
function animateRotation(){
 cancelAnimationFrame(frame);const version=++animationVersion;moving=true;ready=false;controls();$('phase').textContent='WATCH THE INFIELD ROTATE';
 if(matchMedia('(max-width:760px)').matches)document.querySelector('.fieldPanel').scrollIntoView({behavior:'instant',block:'start'});
 const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=now=>{if(version!==animationVersion||!active)return;const progress=reduced?1:Math.min(1,(now-start)/1700),ease=progress*progress*(3-2*progress);draw(1,true,ease);
  if(progress<1)frame=requestAnimationFrame(tick);else{moving=false;$('phase').textContent='EVERYONE IN POSITION';controls();$('next').focus({preventScroll:true});}
 };frame=requestAnimationFrame(tick);
}
function animateHit(){cancelAnimationFrame(frame);const version=++animationVersion;ready=false;controls();$('phase').textContent='WATCH THE HIT';const start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=now=>{if(version!==animationVersion||!active)return;const p=reduced?1:Math.min(1,(now-start)/1100);draw(p,answered);if(p<1)frame=requestAnimationFrame(tick);else{if(mode==='challenge')resumeAfterHit();else{ready=true;$('phase').textContent='CHOOSE YOUR SPOT';controls();draw(1,answered);}}};frame=requestAnimationFrame(tick);
}
function pauseDisplay(){pausedMs=Math.max(0,deadline-Date.now());clockPaused=true;stats();}
async function resumeAfterHit(){
 transitioning=true;controls();$('phase').textContent='GETTING READY';
 try{const r=await api('resume',{session,index:questionIndex});if(!active)return;if(r.expired){finish();return;}deadline=Date.now()+r.remainingMs;clockPaused=false;ready=true;$('clockRetry').hidden=true;$('phase').textContent='CHOOSE YOUR SPOT';draw(1);stats();}
 catch(e){$('feedback').textContent='Could not sync the clock. Tap Retry to continue.';$('clockRetry').hidden=false;$('clockRetry').onclick=resumeAfterHit;}
 finally{transitioning=false;controls();}
}
function reveal(id,explanation){
 const isCorrect=id===q.correct;answered=true;total++;if(!isCorrect)misses.push(missedPlay(q,id,total));if(isCorrect){correct++;streak++;}else streak=0;
 document.querySelectorAll('.answer').forEach((b,i)=>{b.classList.toggle('correct',q.choices[i]===q.correct);b.classList.toggle('incorrect',q.choices[i]===id&&!isCorrect);});
 $('feedback').innerHTML=`<strong>${isCorrect?(mode==='challenge'?'+10 points. Nice read!':'Right spot. Nice read!'):(mode==='challenge'?'−5 points. Here’s your assignment.':'Here’s your assignment.')}</strong><br>${esc(explanation)}<br><strong>Why:</strong> ${esc(assignmentReason(q.play,q.role))}<small>Spiders guide · page ${q.play.page}${q.play.page>=14?' · Pitcher protects home, even when the relay goes to third.':''}</small>`;
 stats();animateRotation();
}
async function answer(index){
 if(!active||!ready||answered||prePitch||moving||!q.choices[index])return;const id=q.choices[index];
 if(mode==='practice'){reveal(id,q.play.explanations[q.role]);return;}
 const requestedQ=q;answerPending=true;ready=false;controls();try{const r=await api('answer',{session,index:questionIndex,choice:id});if(q!==requestedQ||!active)return;if(r.expired){finish();return;}q.correct=r.correct;q.play=plays.find(p=>p.id===q.play.id);remoteNext=r.next;questionIndex=r.index;reveal(id,r.explanation);}catch(e){if(q!==requestedQ||!active)return;$('feedback').textContent=e.message;ready=true;controls();}finally{answerPending=false;controls();if(finishRequested&&active){finishRequested=false;finish();}}
}
async function start(){
 if(!plays.length||starting||answerPending||transitioning)return;starting=true;$('start').disabled=true;clearInterval(timer);cancelAnimationFrame(frame);active=false;hidePrep();moving=false;misses=[];finishRequested=false;session=null;clockPaused=true;pausedMs=90000;correct=total=streak=questionIndex=0;$('saveStatus').textContent='';$('saveScore').hidden=false;
 try{if(mode==='challenge'){const r=await api('start',{rulesVersion:2});session=r.session;pausedMs=r.remainingMs;clockPaused=true;deadline=Date.now()+r.remainingMs;q=r.question;timer=setInterval(()=>{stats();if(!clockPaused&&Date.now()>=deadline)finish();},200);}else{deck=makeDeck(plays);q=deck.shift();}active=true;stats();renderQuestion();$('start').textContent='Restart '+mode;}catch(e){$('feedback').textContent=e.message;}finally{starting=false;$('start').disabled=false;controls();}
}
function finish(){
 if(!active)return;if(answerPending){finishRequested=true;ready=false;controls();return;}
 active=false;ready=false;moving=false;hidePrep();clearInterval(timer);cancelAnimationFrame(frame);animationVersion++;controls();stats();
 if(answered)draw(1,true);
 $('phase').textContent=mode==='practice'?'PRACTICE COMPLETE':'CHALLENGE COMPLETE';$('resultHeading').textContent=$('phase').textContent;
 $('resultText').textContent=mode==='practice'?`${correct} correct out of ${total} answers.`:`${points()} points · ${correct} correct out of ${total} answers.`;
 $('saveScore').hidden=mode!=='challenge';$('saveStatus').textContent='';
 $('missedReview').innerHTML=misses.length?`<h3>${misses.length} ${misses.length===1?'play':'plays'} to work on</h3>`+misses.map(m=>`<article class="missedPlay"><p class="eyebrow">REP ${m.rep} · ${m.role}</p><h3>${esc(m.scenario)}</h3><p>${esc(m.runners)} · Throw to ${esc(m.target)}</p><p class="yourChoice"><strong>You chose:</strong> ${esc(m.selected)}</p><p class="rightChoice"><strong>Correct spot:</strong> ${esc(m.correct)}</p><p>${esc(m.explanation)}</p><p><strong>Why:</strong> ${esc(m.why)}</p><small>Spiders guide · page ${m.page}</small></article>`).join(''):`<p>${total?'No missed plays. Nice reads!':'No answers yet. Take a few reps to build your review.'}</p>`;
 $('results').showModal();
}
function setMode(value){hidePrep();moving=false;misses=[];finishRequested=false;mode=value;active=false;ready=false;q=null;clearInterval(timer);cancelAnimationFrame(frame);animationVersion++;$('practice').setAttribute('aria-pressed',value==='practice');$('challenge').setAttribute('aria-pressed',value==='challenge');$('modeNote').textContent=value==='practice'?'Take your time. Learn the why behind every move.':'90 seconds. +10 correct / −5 incorrect. Clock pauses for setup and the hit.';$('start').textContent='Start '+value;$('scoreLabel').textContent=value==='practice'?'CORRECT':'POINTS';$('clockLabel').textContent=value==='practice'?'STREAK':'TIME LEFT';correct=total=streak=0;deadline=Date.now()+90000;stats();$('choices').innerHTML='';$('feedback').textContent='';$('question').innerHTML='<p class="eyebrow">READY FOR YOUR NEXT REP</p><h2>Let’s make the play.</h2><p>Press Start '+value+' to take the field.</p>';$('phase').textContent='READY WHEN YOU ARE';controls();draw();}
$('helpOpen').onclick=()=>$('help').showModal();$('helpClose').onclick=()=>$('help').close();
$('practice').onclick=()=>setMode('practice');$('challenge').onclick=()=>setMode('challenge');$('start').onclick=start;
$('endPractice').onclick=finish;
async function nextPlay(){
 if(!active||!answered||moving||transitioning)return;
 if(mode==='challenge'){
  if(!remoteNext){finish();return;}if(!clockPaused)pauseDisplay();transitioning=true;controls();
  try{const r=await api('begin',{session,index:questionIndex});if(!active)return;if(r.expired){finish();return;}pausedMs=r.remainingMs;q=r.question;$('clockRetry').hidden=true;renderQuestion();stats();}
  catch(e){$('feedback').textContent='Could not start the next play. Tap Retry to continue.';$('clockRetry').hidden=false;$('clockRetry').onclick=nextPlay;}
  finally{transitioning=false;controls();}
 }else{if(!deck.length){finish();return;}q=deck.shift();renderQuestion();}
}
$('next').onclick=nextPlay;
function advanceFromField(){if(prePitch||moving||answerPending||transitioning||starting||document.querySelector('dialog[open]'))return;if(!active)start();else if(answered)nextPlay();}
$('fieldHint').onclick=advanceFromField;
$('field').onclick=e=>{
 if(active&&ready&&!answered&&!prePitch&&!moving){
  const matrix=$('field').getScreenCTM();if(!matrix)return;
  const nearest=q.choices.map((id,i)=>{const [x,y]=destinations[id].xy;const point=new DOMPoint(x,y).matrixTransform(matrix);return {i,distance:Math.hypot(e.clientX-point.x,e.clientY-point.y)};}).sort((a,b)=>a.distance-b.distance)[0];
  if(nearest.distance<=Math.max(24,23*matrix.a))answer(nearest.i);
 }else advanceFromField();
};
$('field').onkeydown=e=>{if(e.target===$('field')&&['Enter',' '].includes(e.key)){e.preventDefault();advanceFromField();}};
$('replay').onclick=()=>{if(active&&!moving&&!prePitch){if(answered)animateRotation();else animateHit();}};
$('boardOpen').onclick=async()=>{$('board').showModal();$('rankings').textContent='Loading scores…';try{const r=await api('board');$('rankings').innerHTML=r.scores.length?`<table><thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead><tbody>${r.scores.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.nickname)}</td><td>${s.score}</td></tr>`).join('')}</tbody></table>`:'The board is open. Play a challenge and set the first score!';}catch(e){$('rankings').textContent=e.message;}};
$('boardClose').onclick=()=>$('board').close();$('resultsClose').onclick=()=>$('results').close();
$('saveScore').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const r=await api('finish',{session,nickname:$('nickname').value.trim()});$('saveStatus').textContent=`Posted! ${r.score} points are on the shared board.`;$('saveScore').hidden=true;}catch(error){$('saveStatus').textContent=error.message;}finally{button.disabled=false;}};
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','BUTTON'].includes(e.target.tagName))return;const i='abc'.indexOf(e.key.toLowerCase());if(i>=0)answer(i);});
draw();$('start').disabled=true;$('fieldHint').disabled=true;
try{const r=await fetch('./scenarios.json');if(!r.ok)throw new Error('Could not load the playbook. Reload to try again.');plays=buildPlays(await r.json());$('start').disabled=false;controls();}catch(e){$('feedback').textContent=e.message;}
