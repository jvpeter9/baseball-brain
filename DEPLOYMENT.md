# Baseball Brain production

Public URL: https://baseball-brain-rose.vercel.app

Vercel project: baseball-brain, scope jon-2e6e.
Deployment: dpl_7UonF3ufk8ittuPosfLFo62cv1xv (Ready, production).
Inspector: https://vercel.com/jon-2e6e/baseball-brain/7UonF3ufk8ittuPosfLFo62cv1xv

DATABASE_URL is saved in Vercel as a Secret scoped to Production, with explicit user approval. It is excluded from source control and public assets. The deployment connector did not apply its env argument; the setting was saved through Vercel's environment-variable UI and the deployment rebuilt.

Verified public HTML, shared leaderboard read, challenge creation and server answer scoring without authentication. No fake leaderboard scores were posted. Public browser showed the working empty board. Local touch, countdown, rotation and review tests passed before publishing.

Published source is recorded on refresh/aviators-cutoff-lab with the plausible-answer-selection update. GitHub PR #1 remains the review record. Deployment is a source upload, not automatic Git integration.

Migration 0002 adds nullable timing state and has been applied to test and production. Updated client sessions use paused setup/hit timing and +10/-5 scoring. Legacy open clients retain prior rules; their scores are excluded from version 2 rankings.
