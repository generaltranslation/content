# Operations

For the humans running or wiring the skill. The protocol itself is
`SKILL.md`; nothing here changes agent behavior.

## Getting the command

There is nothing to install. Open Claude Code anywhere in a checkout of
this repo and `/end-to-end-doctesting` is available — the skill loads
automatically from `.claude/skills/` (a symlink into `.agents/skills/`).
To use it outside this repo, copy the `end-to-end-doctesting/` folder into
another repo's `.claude/skills/`, or into `~/.claude/skills/` for a
personal install that works everywhere.

## Why this exists

The QS-01 quickstart crash (500 on every route of a fresh project) sat live
in the docs until an *agent* following them hit it. Most users now install
these frameworks with agents, so an agent walking the docs from scratch is
the representative first run — and the cheapest possible CI for
documentation. Repeats are tagged `(repeat ×N)` run over run, so doc debt
can't accumulate silently. Maintenance for docs, so the next refactor isn't
a rescue.

## Host requirements

- `git`, `node`/`npm`; `python3` for the python flow.
- GitHub read access to `generaltranslation/gt-cloud` and
  `generaltranslation/content`: `gh auth login`, or `GITHUB_TOKEN`
  (fine-grained PAT, read-only on the two repos — the skill falls back to
  curl).
- Optional but recommended: `DOCTEST_GT_API_KEY` + `DOCTEST_GT_PROJECT_ID`
  from a **dedicated throwaway GT project** — without them, key-gated steps
  (`npx gt translate`, prod builds) are exercised for their failure mode,
  then marked ⚪ skipped. Never point these at a real project.
- Check everything at once: `/end-to-end-doctesting doctor`.

## Headless / CI

The prompt is the command — run from a checkout that has the skill:

    claude -p "/end-to-end-doctesting 3427 next" --model opus --effort xhigh \
      --dangerously-skip-permissions

The final printed message is the summary; its `verdict:` line is
stable-format (`verdict: 🔴|🟠|🟡|✅ …`) so a workflow can parse it — e.g. a
GitHub Action on docs PRs posting the summary as a PR comment, plus a
nightly run against `main`.

Keep the tester model fixed across runs you want to compare: a frontier
model can quietly out-muscle friction a typical setup would die on, so a
stronger or weaker tester probes a different user population. `opus`
mirrors the strongest agent a typical new user actually runs.

Cost/time datum: one narrowed flow ≈ 8 min / ~$4 at xhigh effort. The full
sweep runs for hours — run the first one attended.

## The naive probe

For the truest first-timer signal, skip the skill entirely: run Claude Code
in an empty directory (where no skill is visible) and prompt "You are a
developer trying General Translation for the first time — install gt-next
by following the docs." What it gets stuck on, users get stuck on.

## State

Run-to-run memory lives in `~/.doctest/` (`DOCTEST_HOME` to move it),
deliberately outside any session: `state.json` (last target + last-20-run
history — powers repeat tagging), `reports/`, and `sweeps/<target>/`
ledgers. Bare `/end-to-end-doctesting` re-tests the last target; first run
ever names a branch or PR once.
