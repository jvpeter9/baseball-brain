export const RULES_VERSION=2;
export const scoreAnswer=correct=>correct?10:-5;
export function remainingTime(run,now=Date.now()){
 return Math.max(0,run.timing?.phase==='setup'?run.timing.remainingMs:+run.expiresAt-now);
}
export function beginSetup(run,index,now=Date.now()){
 if(index!==run.current)throw new Error('Wrong question');
 if(run.timing.phase==='setup')return {timing:run.timing};
 if(run.timing.phase!=='review')throw new Error('Answer this play first');
 return {timing:{version:2,phase:'setup',remainingMs:remainingTime(run,now)}};
}
export function resumeClock(run,index,now=Date.now()){
 if(index!==run.current)throw new Error('Wrong question');
 if(run.timing.phase!=='setup')return {};
 return {timing:{...run.timing,phase:'running'},expiresAt:new Date(now+run.timing.remainingMs)};
}
