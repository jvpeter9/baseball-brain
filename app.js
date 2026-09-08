import {buildPlays,makeDeck,roles,roleNames,starts,bases,destinations} from './model.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let plays=[],deck=[],q=null,mode='practice',active=false,answered=false,ready=false,correct=0,total=0,streak=0,frame=0,timer,deadline=0,session=null,remoteNext=null,questionIndex=0,animationVersion=0;
const letters=['A','B','C'];
const line=(a,b,color,dash='')=>`<path d="M${a} L${b}" fill="none" stroke="${color}" stroke-width="2.5" ${dash?`stroke-dasharray="${dash}"`:''} marker-end="url(#arrow)"/>`;
function draw(progress=1,showAnswer=false){
 const field=$('field');
 let html=`<defs><pattern id="stripes" width="700" height="74" patternUnits="userSpaceOnUse"><rect width="700" height="37" fill="#ffffff" opacity=".025"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#b1c9c4" stroke-width="2"/></marker></defs><path d="M350 530 L65 245 A360 360 0 0 1 635 245 Z" fill="#214d42" stroke="#ffffff25" stroke-width="2"/><path d="M350 530 L65 245 A360 360 0 0 1 635 245 Z" fill="url(#stripes)"/><path d="M350 530L193 373 Q350 163 507 373Z" fill="#a0946d" opacity=".42"/><path d="M350 496L247 393L350 290L453 393Z" fill="#214d42"/><path d="M50 230L350 530L650 230" fill="none" stroke="#dfebd5" stroke-width="2" opacity=".7"/><path d="M480 400L350 270L220 400" stroke="#d2d9c1" stroke-dasharray="5 8" fill="none" opacity=".4"/><circle cx="350" cy="392" r="22" fill="#9f9371"/><rect x="343" y="390" width="14" height="4" fill="#e9e9d9"/>`;
 for(const [name,[x,y]]of Object.entries(bases)){html+=name==='home'?`<path d="M343 523H357V531L350 537L343 531Z" fill="#eef1dd"/>`:`<rect x="${x-7}" y="${y-7}" width="14" height="14" transform="rotate(45 ${x} ${y})" fill="#eef1dd"/>`;}
 html+=`<text x="510" y="424" fill="#b1c7bb" font-size="12">1ST</text><text x="342" y="250" fill="#b1c7bb" font-size="12">2ND</text><text x="158" y="424" fill="#b1c7bb" font-size="12">3RD</text>`;
 if(q){
  const p=q.play; const hit=[p.field==='left'?(p.kind==='extra'?115:167):p.field==='right'?(p.kind==='extra'?585:533):350,p.kind==='extra'?(p.field==='center'?80:155):(p.field==='center'?128:206)];
  for(const base of p.runners){const [x,y]=bases[base];html+=`<circle cx="${x+17}" cy="${y+13}" r="9" fill="#ffcf79" stroke="#172a2c" stroke-width="2"/>`;}
  html+=line(bases.home,hit,'#ffcf79','4 6');
  const ball=bases.home.map((v,i)=>v+(hit[i]-v)*progress);html+=`<circle cx="${ball[0]}" cy="${ball[1]}" r="6" fill="#fff5d6" stroke="#ffcf79" stroke-width="2"/>`;
  if(showAnswer){html+=line(starts[q.role],destinations[q.correct].xy,'#61d4bd');html+=line(hit,bases[p.target],'#c5d6d0','7 7');}
 }
 for(const [role,[x,y]]of Object.entries(starts)){
  const selected=q?.role===role;
  if(selected)html+=`<circle class="selectedHalo" cx="${x}" cy="${y}" r="25" fill="none" stroke="#61d4bd" stroke-width="3"/>`;
  html+=`<circle cx="${x}" cy="${y}" r="17" fill="${selected?'#61d4bd':'#142f38'}" stroke="${selected?'#d6fff0':'#53716f'}" stroke-width="1.5"/><text x="${x}" y="${y+5}" text-anchor="middle" fill="${selected?'#0b2425':'#d3e3dc'}" font-size="13" font-weight="700">${role}</text>`;
 }
 if(q&&(ready||showAnswer))q.choices.forEach((id,i)=>{const[x,y]=destinations[id].xy;html+=`<g class="marker" data-choice="${i}" ${active&&!answered?'role="button" tabindex="0"':''} aria-label="${letters[i]}: ${esc(destinations[id].label)}"><circle cx="${x}" cy="${y}" r="23" fill="${showAnswer&&id===q.correct?'#61d4bd':'#f6dfaa'}" stroke="#10282a" stroke-width="3"/><text x="${x}" y="${y+7}" text-anchor="middle" fill="#14282d" font-size="20" font-weight="800">${letters[i]}</text></g>`;});
 field.innerHTML=html;field.setAttribute('role',q&&ready?'group':'img');field.setAttribute('aria-label',q?`${roleNames[q.role]} highlighted. ${q.play.kind==='single'?'Single':'Extra-base hit'} to ${q.play.field}. Throw to ${q.play.target}.`:'Baseball field');
 field.querySelectorAll('[role=button]').forEach(el=>{el.onclick=()=>answer(Number(el.dataset.choice));el.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();answer(Number(el.dataset.choice));}};});
}
async function api(action,data={}){
 const response=await fetch(`/api/game${action==='board'?'?action=board':''}`,action==='board'?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
 let result;try{result=await response.json();}catch{throw new Error('The shared leaderboard is unavailable. Practice still works.');}
 if(!response.ok)throw new Error(result.error||'Connection interrupted. Please try again.');return result;
}
function stats(){ $('score').textContent=mode==='practice'?`${correct} / ${total}`:correct*10;$('clock').textContent=mode==='practice'?streak:Math.max(0,Math.ceil((deadline-Date.now())/1000))+'s'; }
function controls(){document.querySelectorAll('.answer').forEach(b=>b.disabled=!ready||answered||!active);$('next').hidden=!answered||!active;$('replay').hidden=!q||!active||mode==='challenge';}
function renderQuestion(){
 answered=false;ready=false;$('feedback').textContent='';$('choices').innerHTML=q.choices.map((id,i)=>`<button class="answer" data-index="${i}" disabled><b>${letters[i]}</b><span>${esc(destinations[id].label)}</span></button>`).join('');
 document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>answer(Number(b.dataset.index)));
 const p=q.play;const runners=p.runners.length?p.runners.map(r=>({first:'1st',second:'2nd',third:'3rd'}[r])).join(' & '):'Bases empty';
 $('question').innerHTML=`<p class="eyebrow">YOU ARE THE <span class="roleBadge">${q.role}</span></p><h2>${roleNames[q.role]}, <br>where do you go?</h2><div class="chips"><span>${p.kind==='single'?'Single':'Extra bases'} to ${p.field}</span><span>${p.runners.length?'Runner'+(p.runners.length>1?'s':'')+' on ':''}${runners}</span><span>Throw to ${p.target==='home'?'home':p.target+' base'}</span></div><p>${p.kind==='extra'?'The ball gets past the outfielders. Set up the relay.':'The outfielder fields the hit and throws in.'}</p>`;
 $('count').textContent=`REP ${total+1} · ${mode==='practice'?'PRACTICE':'CHALLENGE'}`;
 controls();animateHit();
}
function animateHit(){cancelAnimationFrame(frame);const version=++animationVersion;ready=false;controls();$('phase').textContent='WATCH THE HIT';const start=performance.now();const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=now=>{if(version!==animationVersion||!active)return;const p=reduced?1:Math.min(1,(now-start)/1100);draw(p,answered);if(p<1)frame=requestAnimationFrame(tick);else{ready=true;$('phase').textContent=answered?'LEARN THE ASSIGNMENT':'CHOOSE YOUR SPOT';controls();draw(1,answered);}};frame=requestAnimationFrame(tick);
}
function reveal(id,explanation){
 const isCorrect=id===q.correct;answered=true;total++;if(isCorrect){correct++;streak++;}else streak=0;
 document.querySelectorAll('.answer').forEach((b,i)=>{b.classList.toggle('correct',q.choices[i]===q.correct);b.classList.toggle('incorrect',q.choices[i]===id&&!isCorrect);});
 $('feedback').innerHTML=`<strong>${isCorrect?'Right spot. Nice read!':'Here’s your assignment.'}</strong><br>${esc(explanation)}<small>Spiders guide · page ${q.play.page}${q.play.page>=14?' · Pitcher protects home, even when the relay goes to third.':''}</small>`;
 $('phase').textContent='LEARN THE ASSIGNMENT';stats();controls();draw(1,true);$('next').focus({preventScroll:true});
}
async function answer(index){
 if(!active||!ready||answered||!q.choices[index])return;const id=q.choices[index];
 if(mode==='practice'){reveal(id,q.play.explanations[q.role]);return;}
 const requestedQ=q;ready=false;controls();try{const r=await api('answer',{session,index:questionIndex,choice:id});if(q!==requestedQ||!active)return;if(r.expired){finish();return;}q.correct=r.correct;remoteNext=r.next;questionIndex=r.index;reveal(id,r.explanation);}catch(e){if(q!==requestedQ||!active)return;$('feedback').textContent=e.message;ready=true;controls();}
}
async function start(){
 if(!plays.length)return;$('start').disabled=true;clearInterval(timer);cancelAnimationFrame(frame);active=false;session=null;correct=total=streak=questionIndex=0;$('saveStatus').textContent='';$('saveScore').hidden=false;
 try{if(mode==='challenge'){const r=await api('start');session=r.session;deadline=Date.now()+r.remainingMs;q=r.question;timer=setInterval(()=>{stats();if(Date.now()>=deadline)finish();},200);}else{deck=makeDeck(plays);q=deck.shift();}active=true;stats();renderQuestion();$('start').textContent='Restart '+mode;document.querySelector('.game').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){$('feedback').textContent=e.message;}finally{$('start').disabled=false;}
}
function finish(){if(!active)return;active=false;ready=false;clearInterval(timer);cancelAnimationFrame(frame);animationVersion++;controls();stats();$('phase').textContent='CHALLENGE COMPLETE';$('resultText').textContent=`${correct*10} points · ${correct} correct out of ${total} answers.`;$('results').showModal();}
function setMode(value){mode=value;active=false;ready=false;q=null;clearInterval(timer);cancelAnimationFrame(frame);animationVersion++;$('practice').setAttribute('aria-pressed',value==='practice');$('challenge').setAttribute('aria-pressed',value==='challenge');$('modeNote').textContent=value==='practice'?'Take your time. Learn the why behind every move.':'90 seconds. 10 points per correct answer. Climb the shared board.';$('start').textContent='Start '+value;$('scoreLabel').textContent=value==='practice'?'CORRECT':'POINTS';$('clockLabel').textContent=value==='practice'?'STREAK':'TIME LEFT';correct=total=streak=0;deadline=Date.now()+90000;stats();$('choices').innerHTML='';$('feedback').textContent='';$('question').innerHTML='<p class="eyebrow">READY FOR YOUR NEXT REP</p><h2>Let’s make the play.</h2><p>Press Start '+value+' to take the field.</p>';$('phase').textContent='READY WHEN YOU ARE';controls();draw();}
$('practice').onclick=()=>setMode('practice');$('challenge').onclick=()=>setMode('challenge');$('start').onclick=start;
$('next').onclick=()=>{if(!active||!answered)return;if(mode==='challenge'){if(!remoteNext){finish();return;}q=remoteNext;}else{if(!deck.length)deck=makeDeck(plays);q=deck.shift();}renderQuestion();};
$('replay').onclick=()=>{if(active)animateHit();};
$('boardOpen').onclick=async()=>{$('board').showModal();$('rankings').textContent='Loading scores…';try{const r=await api('board');$('rankings').innerHTML=r.scores.length?`<table><thead><tr><th>Rank</th><th>Player</th><th>Points</th></tr></thead><tbody>${r.scores.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.nickname)}</td><td>${s.score}</td></tr>`).join('')}</tbody></table>`:'The board is open. Play a challenge and set the first score!';}catch(e){$('rankings').textContent=e.message;}};
$('boardClose').onclick=()=>$('board').close();$('resultsClose').onclick=()=>$('results').close();
$('saveScore').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const r=await api('finish',{session,nickname:$('nickname').value.trim()});$('saveStatus').textContent=`Posted! ${r.score} points are on the shared board.`;$('saveScore').hidden=true;}catch(error){$('saveStatus').textContent=error.message;}finally{button.disabled=false;}};
document.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||['INPUT','BUTTON'].includes(e.target.tagName))return;const i='abc'.indexOf(e.key.toLowerCase());if(i>=0)answer(i);});
draw();$('start').disabled=true;
try{const r=await fetch('./scenarios.json');if(!r.ok)throw new Error('Could not load the playbook. Reload to try again.');plays=buildPlays(await r.json());$('start').disabled=false;}catch(e){$('feedback').textContent=e.message;}
