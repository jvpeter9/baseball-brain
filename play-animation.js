import {bases,destinations} from './model.js';
export const PLAY_DURATION=4000;
export const hitPoint=p=>[p.field==='left'?(p.kind==='extra'?115:167):p.field==='right'?(p.kind==='extra'?585:533):350,p.kind==='extra'?(p.field==='center'?80:155):(p.field==='center'?128:206)];
export const retrievingRole=p=>({left:'LF',center:'CF',right:'RF'})[p.field];
const clamp=x=>Math.max(0,Math.min(1,x));
export function along(points,t){
 const lengths=points.slice(1).map((b,i)=>Math.hypot(b[0]-points[i][0],b[1]-points[i][1]));let remaining=clamp(t)*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(remaining<=lengths[i]){const f=lengths[i]?remaining/lengths[i]:0;return points[i].map((v,j)=>v+(points[i+1][j]-v)*f);}remaining-=lengths[i];}return points.at(-1);
}
export function throwRoute(p){
 const ids=Object.values(p.assignments),relay=ids.find(id=>id.startsWith('relay-')),trail=ids.find(id=>id.startsWith('trail-')),cut=ids.find(id=>id.startsWith('cut-'));
 return [hitPoint(p),...(relay?[destinations[relay].xy,destinations[trail].xy]:cut?[destinations[cut].xy]:[]),bases[p.target]];
}
export function playFrame(p,elapsed){
 const time=Math.min(PLAY_DURATION,Math.max(0,elapsed)),rotation=clamp(time/1700),movement=rotation*rotation*(3-2*rotation),route=throwRoute(p),ball=along(route,(time-1700)/1800);
 const order=['home','first','second','third','home'];
 const targetRunner=p.target==='second'?'batter':p.target==='home'?(p.runners.includes('second')?'second':'first'):p.runners.includes('first')?'first':'batter';
 const runners=['batter',...p.runners].map(id=>{const start=id==='batter'?0:order.indexOf(id);let end=id===targetRunner?(p.target==='home'?4:order.indexOf(p.target)):id==='batter'?(p.kind==='extra'?2:1):4;end=Math.max(start+1,end);
 const path=order.slice(start,end+1).map(base=>bases[base]);
 // The ball arrives at 3500 ms; the targeted runner reaches the bag at 3900 ms.
 return {id,xy:along(path,clamp(time/3900)),target:id===targetRunner};});
 return {movement,ball,route,runners,phase:time<1700?'FIELD THE BALL · GET IN POSITION':time<3500?'FOLLOW THE THROW':'THROW BEATS THE RUNNER'};
}
