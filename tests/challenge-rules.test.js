import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreAnswer,remainingTime,beginSetup,resumeClock} from '../challenge-rules.js';
test('incorrect answers subtract five, including below zero',()=>{assert.equal(scoreAnswer(false),-5);assert.equal(scoreAnswer(true),10);assert.equal(scoreAnswer(false)*3,-15);});
test('setup time is excluded and resume retries never extend the clock',()=>{
 let run={current:0,expiresAt:new Date(90000),timing:{version:2,phase:'setup',remainingMs:90000}};
 assert.equal(remainingTime(run,120000),90000);
 run={...run,...resumeClock(run,0,120000)};assert.equal(+run.expiresAt,210000);
 assert.deepEqual(resumeClock(run,0,125000),{});assert.equal(remainingTime(run,125000),85000);
 assert.throws(()=>beginSetup(run,0,125000),/Answer/);
 run.current=1;run.timing.phase='review';run={...run,...beginSetup(run,1,130000)};
 assert.equal(remainingTime(run,160000),80000);assert.deepEqual(beginSetup(run,1,160000),{timing:run.timing});
 run={...run,...resumeClock(run,1,160000)};assert.equal(+run.expiresAt,240000);assert.equal(remainingTime(run,245000),0);
 assert.throws(()=>resumeClock(run,0),/Wrong/);
});
