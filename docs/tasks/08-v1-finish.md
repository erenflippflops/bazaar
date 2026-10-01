# Task 08 – Finish V1 (manager: do this without asking Eren)

Run independent items in parallel as CLAUDE.md says (up to 3 builders + the auditor, disjoint
files). Merge one by one. Push after every merge. Never ask Eren; follow "Otonom çalışma
kuralları" in docs/STATUS.md. There are no PDFs to read.

1. Bug check (auditor): a 2-player e2e screenshot run reached the results screen after
   auction 4 of 6. Rule 7: a 2-player game has exactly 6 auctions (each player fills 3 slots).
   Print every player's slots and the auction count at the end. Decide with evidence:
   test bug or game bug. Game bug: a builder fixes it and the auditor adds an integration
   test that fails without the fix.
2. Builder A: .gitignore gets test-results/ and playwright-report/;
   `git rm -r --cached test-results`; `git rm server-index-cors.patch test-output.txt`
   (and render.yaml unless the README deploy steps use it).
3. Builder A: README deploy steps: server on Render (Socket.IO cannot run on Vercel),
   client on Vercel with the server URL as an env var. Exact steps Eren can follow.
4. Builder B: screenshots of every screen (home, lobby, wheel/opening, bidding, sale banner,
   judge waiting, judge failed, results), phone 390x844 and desktop 1440x900, results with
   the FAKE judge. Commit them to docs/screenshots/. Compare with docs/design/ and list
   differences; fix the clear ones.
5. Real judge: check only whether ANTHROPIC_API_KEY exists in .env (never print the key).
   If yes: one real-judge game, paste the judge JSON into docs/STATUS.md. If no: write
   "Eren: put ANTHROPIC_API_KEY in .env" in STATUS.md and continue.
6. When 1-5 are merged: all tests (npx vitest run + npx playwright test, no filter) green in
   3 consecutive runs; then the auditor's final audit of the whole repo with VERDICT.
7. Update docs/STATUS.md with evidence for each V1 item, push, and give Eren:
   git log --oneline -15 and a short Turkish summary.
