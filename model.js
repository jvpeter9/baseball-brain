export const roles = ['1B', '2B', 'SS', '3B', 'P'];
export const roleNames = {'1B':'First baseman','2B':'Second baseman',SS:'Shortstop','3B':'Third baseman',P:'Pitcher'};
export const starts = {'1B':[484,354],'2B':[418,270],SS:[282,270],'3B':[216,354],P:[350,392],LF:[167,206],CF:[350,128],RF:[533,206]};
export const bases = {first:[480,400],second:[350,270],third:[220,400],home:[350,530]};
export const destinations = {
 first:{label:'Cover first / be ready for a throw back',xy:bases.first},
 second:{label:'Cover second base',xy:bases.second},
 third:{label:'Cover third / stay close and ready',xy:bases.third},
};
const add=(id,label,xy)=>destinations[id]={label,xy};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
for(const [field,outfielder] of [['left','LF'],['center','CF'],['right','RF']]){
 const origin=starts[outfielder];
 for(const target of ['second','third','home']){
  // Single cutoffs are nearer the infield; CF-to-home sits behind the mound.
  const t=target==='home'?.62:.55;
  add(`cut-${field}-${target}`,`Cut off ${field} field's throw to ${target==='home'?'home':target+' base'}`,mix(origin,bases[target],t));
 }
 for(const target of ['third','home']){
  const deep=[field==='left'?115:field==='right'?585:350,field==='center'?80:155];
  add(`relay-${field}-${target}`,`First relay: go out toward ${field} field, lined up to ${target}`,mix(deep,bases[target],.30));
  add(`trail-${field}-${target}`,`Second relay: trail the first cutoff from ${field} toward ${target}`,mix(deep,bases[target],.45));
 }
 // Continue the actual throw line beyond the base to back it up.
 add(`backup-second-${field}`,'Back up the throw to second base',mix(origin,bases.second,1.28));
 add(`backup-third-${field}`,'Back up third base in foul territory',mix(origin,bases.third,1.30));
 add(`backup-home-${field}`,'Back up home in foul territory',mix(origin,bases.home,1.17));
}
add('backup-home-first','Back up home, shaded to the first-base side',[397,590]);
add('backup-home-third','Back up home, shaded to the third-base side',[303,590]);

export function assignments(page,field,target){
 if(page<=4)return {'1B':'first','2B':field==='right'?`cut-right-second`:'second',SS:field==='right'?'second':`cut-${field}-second`,'3B':'third',P:`backup-second-${field}`};
 if(page<=7)return {'1B':'first','2B':'second',SS:`cut-${field}-third`,'3B':'third',P:`backup-third-${field}`};
 if(page<=10)return {'1B':field==='left'?'first':`cut-${field}-home`,'2B':field==='left'?'second':'first',SS:field==='left'?'third':'second','3B':field==='left'?'cut-left-home':'third',P:`backup-home-${field}`};
 return {'1B':'second','2B':`${field==='right'?'relay':'trail'}-${field}-${target}`,SS:`${field==='right'?'trail':'relay'}-${field}-${target}`,'3B':'third',P:page<=13?`backup-third-${field}`:field==='left'?'backup-home-first':'backup-home-third'};
}
export function buildPlays(source){
 return source.flatMap(s=>{
  const configurations=s.page<=4?[[]]:s.page<=7?[['first']]:s.page<=10?[['second']]:s.page<=13?[[],['second'],['third'],['second','third']]:[['first']];
  const targets=s.page<=4?['second']:s.page<=7?['third']:s.page<=10?['home']:s.page<=13?['third']:['home','third'];
  return configurations.flatMap(runners=>targets.map(target=>({...s,runners,target,assignments:assignments(s.page,s.field,target),id:`p${s.page}-${runners.join('-')||'empty'}-${target}`})));
 });
}
export function shuffle(items,rng=Math.random){
 const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;
}
export function makeQuestion(play,role,plays,rng=Math.random){
 const correct=play.assignments[role];
 // Favor plausible responsibilities on this hit's side of the field. Every
 // option still appears as a correct destination somewhere in the guide.
 const pool=[...new Set(plays.flatMap(p=>Object.values(p.assignments)))];
 const distance=(a,b)=>Math.hypot(...destinations[a].xy.map((v,i)=>v-destinations[b].xy[i]));
 const compatible=(a,b)=>a!==b&&destinations[a].label!==destinations[b].label&&distance(a,b)>48;
 const fieldOf=id=>id.match(/(?:cut|relay|trail)-(left|center|right)-/)?.[1]||id.match(/backup-(?:second|third|home)-(left|center|right)$/)?.[1];
 const relevant=pool.filter(id=>!fieldOf(id)||fieldOf(id)===play.field);
 const historical=new Set(plays.map(p=>p.assignments[role]));
 const picked=[];
 const available=id=>compatible(id,correct)&&picked.every(other=>compatible(id,other));
 const take=list=>{const id=list.find(available);if(id)picked.push(id);};
 const nearest=list=>list.map(id=>({id,rank:distance(id,correct)+(historical.has(id)?0:70)+rng()*90})).sort((a,b)=>a.rank-b.rank).map(x=>x.id);
 const usualBase={'1B':'first','2B':'second',SS:'second','3B':'third'}[role];
 if(usualBase)take([usualBase]);
 // Pitchers compare backup targets; other infielders compare base coverage
 // with a cutoff/relay from the actual direction of the hit.
 const responsibility=relevant.filter(id=>role==='P'?id.startsWith('backup-'):/^(cut|relay|trail)-/.test(id));
 const ordered=responsibility.map(id=>({id,rank:
  (id.endsWith('-'+play.target)?0:160)+
  (play.kind==='extra'?(/^cut-/.test(id)?120:0):(/^(relay|trail)-/.test(id)?120:0))+
  (historical.has(id)?0:40)+distance(id,correct)*.15+rng()*35
 })).sort((a,b)=>a.rank-b.rank).map(x=>x.id);
 if(picked.length<2)take(ordered);
 while(picked.length<2){
  const before=picked.length;
  take(nearest(relevant));
  // Safety fallback for unusual/custom play collections with sparse options.
  if(picked.length===before)take(nearest(pool));
  if(picked.length===before)break;
 }
 if(picked.length!==2)throw new Error('Not enough distinct destinations');
 return {play,role,correct,choices:shuffle([correct,...picked],rng)};
}
export function makeDeck(plays,rng=Math.random){
 // Five-role rounds keep the highlighted position balanced; each role sees every play.
 const queues=Object.fromEntries(roles.map(role=>[role,shuffle(plays,rng)]));
 return plays.flatMap(()=>shuffle(roles,rng).map(role=>makeQuestion(queues[role].pop(),role,plays,rng)));
}

export function runnerDescription(play){
 if(!play.runners.length)return 'Bases empty';
 const names={first:'first',second:'second',third:'third'};
 return `${play.runners.length===1?'Runner':'Runners'} on ${play.runners.map(r=>names[r]).join(' and ')}`;
}

export function assignmentReason(play,role){
 const id=play.assignments[role];
 if(role==='P'&&play.page>=11&&play.page<=13)return 'First base is open, so the guide sets the extra-base relay to third to stop the batter from taking another base. The pitcher backs up that throw in foul territoryâ€”even with a runner already on second.';
 if(role==='P'&&play.page>=14)return 'With a runner starting on first on an extra-base hit, there can be a play at home. The guide keeps the pitcher protecting home, even when this relay goes to third.';
 if(id.startsWith('backup-'))return `The pitcher is the safety behind the throw to ${play.target==='home'?'home plate':play.target+' base'}, ready to stop an overthrow from letting runners advance.`;
 if(id.startsWith('trail-'))return 'Both middle infielders go out on an extra-base hit. The second relay trails the first cutoff to stop a throw that gets through and help communicate the target.';
 if(id.startsWith('relay-'))return `The ball is past the outfielders, so the first relay goes out to shorten the throw and line it up toward ${play.target==='home'?'home plate':'third base'}.`;
 if(id.startsWith('cut-'))return `This position lines up between ${play.field} field and ${play.target==='home'?'home plate':play.target+' base'} so the defense can relay or redirect the throw.`;
 if(id==='second'&&role==='1B')return 'Both middle infielders leave for the outfield relay, so the first baseman takes over second base to keep it covered.';
 if(id==='first'&&role==='2B')return 'The first baseman is the cutoff to home, so the second baseman covers first for a possible throw back from the cutoff or catcher.';
 if(id==='third'&&role==='SS')return 'The third baseman is the cutoff to home on a single to left, so the shortstop covers the vacated third-base bag.';
 if(id==='second')return play.target==='home'?'Cover second in case the batter tries to advance on the throw home.':play.page>=5?'Keep second covered in case the runner retreats or the defense redirects the throw.':'Receive the throw to second while the other middle infielder handles the cutoff.';
 if(id==='third')return play.target==='third'?'Third is the relay target. Stay ready there to receive the throw and make the play.':'Keep third covered and stay ready for a retreating runner or a redirected throw.';
 return 'Stay ready at first for a throw back, so the defense can keep the batter close to the bag.';
}

export function missedPlay(question,selected,rep){
 return {rep,role:question.role,scenario:`${question.play.kind==='extra'?'Extra-base hit':'Single'} to ${question.play.field}`,runners:runnerDescription(question.play),target:question.play.target,selected:destinations[selected].label,correct:destinations[question.correct].label,explanation:question.play.explanations[question.role],why:assignmentReason(question.play,question.role),page:question.play.page};
}
