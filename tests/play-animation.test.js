import {test} from 'node:test';
import assert from 'node:assert/strict';
import source from '../scenarios.json' with {type:'json'};
import {buildPlays,bases} from '../model.js';
import {playFrame,throwRoute} from '../play-animation.js';
test('all plays relay to the target before the runner arrives',()=>{
 for(const p of buildPlays(source)){
  const route=throwRoute(p);assert.equal(route.length,p.kind==='extra'?4:3);
  assert.deepEqual(route.at(-1),bases[p.target]);
  const frame=playFrame(p,3500),runner=frame.runners.find(r=>r.target);
  assert.deepEqual(frame.ball,bases[p.target]);
  assert.ok(Math.hypot(runner.xy[0]-frame.ball[0],runner.xy[1]-frame.ball[1])>10);
  assert.deepEqual(playFrame(p,4000).runners.find(r=>r.target).xy,bases[p.target]);
  if(p.kind==='extra'){const [a,m,b]=route.slice(1);assert.ok(Math.abs(Math.hypot(m[0]-a[0],m[1]-a[1])-Math.hypot(m[0]-b[0],m[1]-b[1]))<.001);}
 }
});
