# Refresh verification · 2026-09-08

Touch update: `tests/touch-flow.mjs` passes with emulated touch at 390×844, 820×1180 and 1180×820. Checks first/second runner coordinates on their forward basepaths, start/next field taps, selection outside the small visible marker but inside its expanded touch target, inert empty-grass taps during questions, animation tap guards, completed-deck review, 48px controls and no horizontal overflow. Learning-flow regression also passes. Tablet rendering inspected visually.

Learning-flow update: five model tests and a dedicated browser test now verify the 3/2/1 countdown, absence of pre-hit clues, actual intermediate player motion, all five final assignments, stationary outfielders, rotation replay, missed-play summaries, review reset and mobile layout. The pitcher/first-base-open/runner-on-second case explicitly explains backing up third. The existing desktop/mobile and isolated-database leaderboard regressions also pass with the new review flow.

Passed four model/API-payload tests, including 5,400 randomized questions (16,200 answer choices), complete 15-page assignment coverage, 27 play variations and balanced 135-question decks.

Passed Chromium browser checks at desktop and 390px phone width: practice, three answer buttons, field-marker input, correct/incorrect feedback, next question, challenge scoring, shared board reads, invalid choices, early posting, duplicate answers and idempotent retries. No page errors or horizontal overflow. Inspected desktop and phone screenshots.

Passed a complete challenge finish/post/read flow on the isolated Neon `leaderboard-verification` branch (`br-still-dawn-ae368kuf`): the test expires only its own QA session, advances the browser clock, posts through the visible nickname form and verifies the saved score in a second browser. Repeated submission returns the original score and does not create or rename an entry. No fake scores were placed on the main leaderboard.

Public production: https://baseball-brain-rose.vercel.app. User explicitly approved the private Neon-to-Vercel connection. Production deployment dpl_6zAfGQVzpD9woCdWYxW36Sk7DnZU is Ready. Unauthenticated checks passed: page 200, leaderboard 200 with an empty score list, challenge creation 200, answer scoring 200 with a next question. Browser confirmed the live empty-board message. No test scores were posted.

Limitations: browser checks emulate phone dimensions; no physical phone was used. Player names are nicknames with no account identity verification. Scores are server checked, but the public practice playbook means this is not designed as a cheat-proof tournament platform. The field is schematic and the source booklet remains authoritative for exact positioning.

Help/timing/scoring update: seven model/rules tests pass. The 390x844 touch browser regression verifies the illustrated dialog, frozen setup/hit clock, resumed decision clock, -5 wrong answer, repeated next-play pause, expiry review and posting a negative score on the isolated test branch. Live public checks pass for help HTML, version 2 session creation, pause/resume idempotency, -5 scoring and leaderboard reads. Live browser confirms all three instruction illustrations and tap-circle guidance. No production test scores were posted. Production deployment: dpl_E48uN3GDYGiMAandHKstcXGz75z5.

Plausible-choice update: all nine model/rules tests pass. Randomized coverage verifies one correct answer, real guide destinations, non-overlapping markers, hit-side alternatives, first-base coverage as a distractor when 1B covers second, competing pitcher backups and retained variation. Build passes.
