# Baseball Brain · Aviators

Cutoff and relay training, refreshed from the Spiders Cutoff & Backup Guide.

- Practice is untimed and explains every assignment, with the source page.
- Challenge runs for 90 seconds, with +10 points per correct answer, -5 per incorrect answer and a shared Neon leaderboard.
- Only 1B, 2B, SS, 3B and P are selected. Five-role shuffled rounds balance position practice.
- The 15 booklet diagrams expand into 27 situations / 135 position questions. First-base-open extra-base hits use empty bases, 2B, 3B, or 2B+3B. Runner-on-first extra-base plays explicitly choose a throw home or to third. No infield-hit scenarios are included.
- Each question has exactly three choices: the correct assignment and two plausible destinations that are correct elsewhere in the booklet. Choices favor the usual base, a cutoff/relay on the hit side, and nearby role-relevant alternatives. Pitchers compare backup targets. Choices cannot overlap or use identical labels.
- Hit animation, clickable field markers, keyboard A/B/C shortcuts and large answer buttons. Reduced-motion support and responsive phone layout.
- Every rep begins with a three-second overlay showing only runners and the selected position. The hit and throw are revealed after the countdown.
- Runners lead along the next basepath (first toward second, second toward third). Tap the field to start a round or advance after a completed rotation. During a question, field taps select only the nearest answer marker within its touch target; empty-field taps and taps during animations do not advance. Controls are at least 48px tall, with larger answer buttons on touch devices and normal scrolling/pinch zoom preserved.
- After either answer, all five infielders animate into the guide's assignments. Replay rotation repeats the visual without changing the score. Reduced-motion users see the final positions immediately.
- Finish & review ends a practice round; challenge reviews appear when time expires. Each missed play lists the situation, chosen destination, correct assignment, coaching reason and source page. Practice also ends after its complete 135-question deck. Challenge pauses from the next-play tap through setup and the hit animation. Decision time, defensive rotations and reading time count toward its 90 seconds.

- The top How to play button opens three illustrated examples, including tapping destination circles directly.
- Version 2 leaderboard rankings use the new timing and scoring rules; older scores remain stored but are not ranked alongside them.

## Run

Requires Node 22 or newer. Install with `pnpm install --ignore-workspace` (or npm). Set `DATABASE_URL` in the ignored `.env.local`, then run `npm run db:migrate` and `npm run dev`. Open http://127.0.0.1:5180. Practice also runs on a static web server; challenge and leaderboard require the API.

`npm test` checks the play model and public payload. `npm run build` copies only public assets into `dist`. Deploy with the provided Vercel configuration and private server-side `DATABASE_URL`.

## Playbook maintenance

`scenarios.json` contains the 15 source diagrams' assignments and page references; `model.js` defines the rotations, destinations and deck generation. The source PDF remains with the coach; it is not redistributed here. Preserve the guide's pitcher responsibility to protect home on pages 14–16, even when the current relay target is third.

Field positions are schematic. A label such as “cover first / ready for a throw back” includes the guide's nearby readiness responsibility; it does not mean a player must stand directly on the bag throughout the play.

## Leaderboard

Neon project: `bitter-frost-37537876` (Baseball Brain), production branch `br-lucky-boat-ael83i9o`. Drizzle schema and versioned migrations live under `db/`. The browser receives a random challenge ID and choices; the server owns the question order, score, deadline and submission status. Retry requests are idempotent. Only completed challenges can post, once per challenge. Nicknames are public and do not require accounts. Scores are individual runs, not verified player identities; this is a friendly team leaderboard, not a cheat-proof competition.

Production keeps no seeded leaderboard entries. `leaderboard-verification` is a separate Neon branch for end-to-end score tests. The original extensionless `index` is a historical file and is excluded from deployment; the active app is `index.html`.
