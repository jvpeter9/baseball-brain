# Refresh verification · 2026-09-08

Learning-flow update: five model tests and a dedicated browser test now verify the 3/2/1 countdown, absence of pre-hit clues, actual intermediate player motion, all five final assignments, stationary outfielders, rotation replay, missed-play summaries, review reset and mobile layout. The pitcher/first-base-open/runner-on-second case explicitly explains backing up third. The existing desktop/mobile and isolated-database leaderboard regressions also pass with the new review flow.

Passed four model/API-payload tests, including 5,400 randomized questions (16,200 answer choices), complete 15-page assignment coverage, 27 play variations and balanced 135-question decks.

Passed Chromium browser checks at desktop and 390px phone width: practice, three answer buttons, field-marker input, correct/incorrect feedback, next question, challenge scoring, shared board reads, invalid choices, early posting, duplicate answers and idempotent retries. No page errors or horizontal overflow. Inspected desktop and phone screenshots.

Passed a complete challenge finish/post/read flow on the isolated Neon `leaderboard-verification` branch (`br-still-dawn-ae368kuf`): the test expires only its own QA session, advances the browser clock, posts through the visible nickname form and verifies the saved score in a second browser. Repeated submission returns the original score and does not create or rename an entry. No fake scores were placed on the main leaderboard.

Local preview: http://127.0.0.1:5181. Public Vercel deployment is pending explicit approval to store the Neon credential as a server-side environment variable; automatic approval review rejected that transfer without confirmation.

Limitations: browser checks emulate phone dimensions; no physical phone was used. Player names are nicknames with no account identity verification. Scores are server checked, but the public practice playbook means this is not designed as a cheat-proof tournament platform. The field is schematic and the source booklet remains authoritative for exact positioning.
