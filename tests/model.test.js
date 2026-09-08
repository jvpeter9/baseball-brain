import {test} from 'node:test';
import assert from 'node:assert/strict';
import source from '../scenarios.json' with {type:'json'};
import {buildPlays,makeDeck,makeQuestion,roles,destinations,assignments} from '../model.js';
import {publicQuestion,nicknameValid} from '../api/game.js';
const plays=buildPlays(source);
test('all 15 source diagrams expand to 27 situations and 135 balanced questions',()=>{
 assert.equal(source.length,15);assert.equal(plays.length,27);const deck=makeDeck(plays);assert.equal(deck.length,135);
 assert.equal(new Set(deck.map(q=>q.play.id+q.role)).size,135);
 for(let i=0;i<135;i+=5)assert.deepEqual([...new Set(deck.slice(i,i+5).map(q=>q.role))].sort(),[...roles].sort());
});
test('thousands of generated choices have one correct answer, distinct locations, and real guide destinations',()=>{
 const valid=new Set(plays.flatMap(p=>Object.values(p.assignments)));
 for(let i=0;i<40;i++)for(const p of plays)for(const role of roles){
  const q=makeQuestion(p,role,plays);assert.equal(q.choices.length,3);assert.equal(new Set(q.choices).size,3);assert.equal(q.choices.filter(x=>x===q.correct).length,1);
  q.choices.forEach(id=>assert.ok(valid.has(id)));
  for(let a=0;a<3;a++)for(let b=a+1;b<3;b++)assert.ok(Math.hypot(...destinations[q.choices[a]].xy.map((v,j)=>v-destinations[q.choices[b]].xy[j]))>48);
 }
});
test('booklet rotation exceptions are preserved',()=>{
 assert.deepEqual(assignments(10,'right','home'),{'1B':'cut-right-home','2B':'first',SS:'second','3B':'third',P:'backup-home-right'});
 assert.equal(assignments(7,'right','third').SS,'cut-right-third');
 assert.equal(assignments(8,'left','home')['3B'],'cut-left-home');
 assert.equal(assignments(13,'right','third')['2B'],'relay-right-third');
 assert.equal(assignments(13,'right','third').SS,'trail-right-third');
 assert.equal(assignments(14,'left','third').P,'backup-home-first');
 assert.equal(assignments(16,'right','third').P,'backup-home-third');
 for(const p of plays)for(const r of roles)assert.ok(p.explanations[r].length>15);
});
test('challenge payload never gives away correct answer or role assignments',()=>{
 const q=publicQuestion(makeDeck(plays)[0]);assert.equal(q.correct,undefined);assert.equal(q.play.assignments,undefined);assert.equal(q.play.explanations,undefined);
 assert.ok(nicknameValid('Ace18'));assert.ok(!nicknameValid('<script>'));assert.ok(!nicknameValid('A'.repeat(19)));
});
