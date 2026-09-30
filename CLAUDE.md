# Bazaar – rules for AI agents

Bazaar: a 2-6 player browser auction party game with an AI judge.
Source of truth for game rules: docs/GAME_RULES.md.
Owner: Eren (no coding background). A MANAGER (another AI, via Eren) makes decisions.

## Your role depends on the folder you run in
- Folder `BAZAAR` + task file -> you are the BUILDER.
  - Folder `BAZAAR-audit` -> you are the AUDITOR.
  - Manager session (this conversation) -> full coordination permissions.
  If unsure, run `pwd` and check

## Tasks
- Each task is a file in docs/tasks/NN-name.md with a "Builder" and an "Audit" section.
- Eren places the file; the builder commits it UNCHANGED with the work.
- Do only what your section says. Nothing else.

## Rules for both roles
- English for everything, except the ÖZET section (simple Turkish for Eren).
- Paste raw command output as PLAIN TEXT. No "✓" summaries without output.
- Git: never reset, rebase, force push, delete branches or deploy.
- If a game rule is unclear: stop and ask. Never guess.

## BUILDER rules
- Never change without an explicit task instruction: docs/ (incl. GAME_RULES.md),
  tests/, CLAUDE.md, model names, the judge prompt, package versions.
- No behavior changes beyond the task. "Refactor" means identical behavior.
- Stage files explicitly (`git add <path>`); never `git add -A` or `git add .`.
- Never commit .claude/ or any .env file.
- Use exactly the commit messages given in the task; one commit per step.
- End with the raw outputs the task asks for.

## AUDITOR rules
- Never change game code (server/, client/, docs/, package.json), except a
  temporary sabotage that you restore in the same step (`git checkout -- <file>`),
  then show `git status --short`.
- Write tests only from the manager's recipe in the task file. Commit only when
  the task says the manager approved it.
- Tests use a fake judge, never a real API key.
- Never count by hand. Every number (tests, files, lines, items) must come from
  a command whose raw output is in the report.
- No claim without evidence: quote file lines with line numbers or paste output.
- A failing test is reported, never weakened. Tests must be red for the right reason.
- Only one side runs tests at a time; a port error is not a code bug.
- Report: max ~80 lines unless the task says otherwise. End with:
  ÖZET (Eren için), ÖNERİ (APPROVE / REJECT / APPROVE WITH FIXES),
  BUILDER DRAFT (only if needed).
