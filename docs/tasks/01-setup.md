# Task 01 – Judge restore, CLAUDE.md setup, verify the testable server

## Builder
A. Run `git log --oneline -5`. If there is NO commit "Restore judge model and prompt":
   restore the model string and the prompt text in server/judge.ts EXACTLY as in
   commit a486670 (`git show a486670:server/judge.ts`). Keep the new shape:
   callAnthropicJudge returns the raw text; no parsing in judge.ts. Change nothing else.
   Commit only server/judge.ts: "Restore judge model and prompt".
   If that commit already exists, skip A.
B. Add the line `.claude/settings.local.json` to .gitignore (create the file if missing).
   Commit these files as they are, without editing CLAUDE.md or this task file:
   CLAUDE.md, .gitignore, docs/tasks/01-setup.md
   Message: "Add CLAUDE.md, task files, ignore local Claude settings"
   Do NOT commit anything under .claude/.
C. Push to main. Paste RAW output of:
   git log --oneline -5
   git show --stat HEAD
   git status --short
   npx vitest run

## Audit
Pull main. Commit a486670 is already approved; verify everything after it.
1. `git log --oneline a486670..HEAD` and `git show --stat <sha>` for each commit.
   Flag any unexpected file. Confirm nothing under .claude/ or tests/ is committed.
2. `git diff a486670 HEAD -- server/judge.ts`: model must be claude-haiku-4-5-20251001,
   prompt text identical to a486670; only the return shape may differ.
3. Full content of server/judgeResult.ts and server/main.ts. Say whether the
   validation checks: every player appears exactly once, ranks are 1..n,
   reasons and commentary are non-empty strings. Just report.
4. `npx vitest run --reporter=verbose` (paste the summary lines and any failure).
5. Quote the lines in startJudging: when the judge times out, does the phase
   become judge_failed or stay judging? Just report.
6. Smoke check (throwaway script, delete it afterwards): createServer with port 0
   and a fake judge; connect one socket.io-client; GET /health; close().
   The script must exit on its own within 5 s. Paste output. Then `git status --short`.
Do not change game code. Max ~100 lines.
