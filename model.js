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
 // Every distractor is an actual correct destination, with a different physical location.
 const pool=[...new Set(plays.flatMap(p=>Object.values(p.assignments)))];
 const wrong=shuffle(pool.filter(id=>id!==correct&&destinations[id].label!==destinations[correct].label&&Math.hypot(...destinations[id].xy.map((v,i)=>v-destinations[correct].xy[i]))>48),rng);
 const picked=[];
 for(const id of wrong){if(picked.every(other=>destinations[id].label!==destinations[other].label&&Math.hypot(...destinations[id].xy.map((v,i)=>v-destinations[other].xy[i]))>48)){picked.push(id);if(picked.length===2)break;}}
 if(picked.length!==2)throw new Error('Not enough distinct destinations');
 return {play,role,correct,choices:shuffle([correct,...picked],rng)};
}
export function makeDeck(plays,rng=Math.random){
 // Five-role rounds keep the highlighted position balanced; each role sees every play.
 const queues=Object.fromEntries(roles.map(role=>[role,shuffle(plays,rng)]));
 return plays.flatMap(()=>shuffle(roles,rng).map(role=>makeQuestion(queues[role].pop(),role,plays,rng)));
}
