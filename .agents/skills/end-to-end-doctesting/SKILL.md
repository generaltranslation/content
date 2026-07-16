---
name: end-to-end-doctesting
description: Blank-slate end-to-end smoketest of General Translation's setup docs. Use when asked to test, QA, or smoketest a docs branch or docs PR, or on any message starting with /end-to-end-doctesting (e.g. "/end-to-end-doctesting", "/end-to-end-doctesting 3427", "/end-to-end-doctesting content#354 all", "doctest the refactor branch"). Resolves the docs branch, follows the chosen quickstart verbatim in a throwaway project like a first-time user, logs every deviation needed to succeed, and replies with a glanceable verdict plus a full .md report when there are findings.
---

# End to End Doctesting

You QA documentation by **being the user**: set up General Translation from a
blank slate, following the docs on a given branch to the letter, and report
where they break. Most GT users now point an agent at the docs and say
"install this" — an agent following the docs verbatim IS the representative
first-run experience. Where you get stuck, users get stuck.

Prime directive: **the docs are the system under test, not you.** The job is
never "get GT working by any means" — it is "discover whether the docs alone
get a newcomer to a working result." Every time you need knowledge that is
not on the page, that is a finding, even if you already know the answer.

Run fully non-interactively. Never ask the user questions mid-run. The only
acceptable pre-run reply is a one-line refusal when a hard precondition fails
(no target on a first-ever run, `gh` unauthenticated, no network, no node).

## Command grammar

    /end-to-end-doctesting [target] [scope] [keep]

- `target` — which docs to test:
  - omitted → `last_target` from state (see § State). No state either → reply
    with one line asking for a branch or PR; stop.
  - gt-cloud PR: `3427`, `gt-cloud#3427`, or a full PR URL
  - content PR: `content#354`, or a full PR URL
  - a branch name: tried on `generaltranslation/content` first, then on
    `generaltranslation/gt-cloud`
  - `main` → content repo `main` (the live docs)
- `scope` — how much of the tree to test. **Default: everything — the full
  sweep (§3)**: every actionable instruction on every page under
  `docs/en-US/**` at the resolved SHA. Narrowing values: a flow (`next` |
  `react` | `node` | `python` | `cli` | `rn` | `tanstack`) walks just that
  quickstart; `<flow>+<ext>` adds a follow-on guide; a value containing `/`
  or ending in `.mdx` targets that page or directory; `all` = every
  quickstart but nothing else (the old mode). Expect: one flow 10–30 min;
  the full sweep runs for hours — it's built to run unattended, resumes
  from its ledger if interrupted, and always reports its own coverage.
- `keep` — keep the sandboxes after the run and include their paths in the
  reply.

Utility subcommands (no sandbox, answer inline, ≤15 lines):

- `/end-to-end-doctesting help` — the grammar above, current defaults, and a one-line
  summary of the last run from state.
- `/end-to-end-doctesting ls [target] [path]` — resolve the target and show what's there:
  by default the top-level dirs under `docs/en-US/` plus the spine pages the
  flow globs matched on that branch; with a `path`, list that subtree. This
  is how you see what's available to point at, per branch, without cloning
  anything.
- `/end-to-end-doctesting doctor` — host preflight: git/node/npm versions, `gh` or
  `GITHUB_TOKEN` present and both repos reachable, `python3` (python flow),
  `DOCTEST_GT_*` credentials present (report yes/no, never values),
  `$DOCTEST_HOME` writable, free disk (warn under ~10 GB — sandboxes hold
  node_modules), and the state summary. Run this first on a fresh host.

## Plain-English steering

The grammar is shorthand, not a parser — the agent reading this is a full
agent. Anything else in the message is an instruction: "use pnpm", "keep the
sandbox", "only steps 1–3", "walk the react flow on yesterday's target",
"skip the dev-server check". Apply it, and record every deviation from the
default protocol in the report header as `Run variant:` so repeat-tracking
across runs stays honest. Questions about a past run ("why did step 6
fail?", "show finding 2") are answered from the saved report and state —
don't re-run for a question. Anything that posts externally (`file it` → PR
review comments) still happens only on that explicit ask.

## 1 · Resolve the target to a content SHA

Docs text lives in `generaltranslation/content` under `docs/en-US/**`. That
repo is a git submodule of `generaltranslation/gt-cloud` at
`apps/landing/content`, so docs PRs come in pairs (e.g. gt-cloud#3427 ⇄
content#354). **The content SHA is the thing you test.** Resolve:

- **gt-cloud PR or branch** → head branch, then read the submodule gitlink:

      gh pr view <N> --repo generaltranslation/gt-cloud --json headRefName
      gh api "repos/generaltranslation/gt-cloud/contents/apps/landing/content?ref=<branch>" --jq .sha

  (Fallback if that returns nothing: recursive tree, take the
  `apps/landing/content` entry with `"type":"commit"`.)
- **content PR** → `gh pr view <N> --repo generaltranslation/content --json
  headRefName` → CONTENT_SHA = head of that branch.
- **Bare number** → try as gt-cloud PR first, then content PR. If both exist,
  prefer gt-cloud and say which you picked in the report header.
- Record CONTENT_SHA (short), its branch/PR provenance, and the paired PR if
  one is linked. Always re-resolve — never reuse a SHA from a previous run.

Fetch the docs tree once and cache it for the run:

    gh api "repos/generaltranslation/content/git/trees/<CONTENT_SHA>?recursive=1" \
      --jq '.tree[] | select(.type=="blob") | .path'

Fetch each page you follow with:

    gh api "repos/generaltranslation/content/contents/<path>?ref=<CONTENT_SHA>" --jq .content | base64 -d

URL ↔ file mapping (fumadocs): `/docs/react/nextjs/config` →
`docs/en-US/react/nextjs/config.mdx`; parenthesized route groups like
`(additional-frameworks)` appear in file paths but are elided from URLs.

**No `gh` on the host?** Every `gh api <path>` here is equivalently
`curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/<path>`
(fine-grained PAT, read-only on the two repos), and
`gh pr view <N> --repo <owner/repo> --json headRefName` is
`curl … https://api.github.com/repos/<owner/repo>/pulls/<N>` → `.head.ref`.
curl ships with macOS; parse JSON with `node -e` or by reading it — don't
assume `jq`. If neither `gh` nor `GITHUB_TOKEN` is available, stop with a
one-line reply saying which to provide.

## 2 · Pick the docs to walk

Find the flow's **spine page** by globbing the fetched tree — paths move
between branches, so never hardcode them. Current refactor-era globs, under
`docs/en-US/`:

| flow     | spine glob                              | blank-slate substrate                          |
|----------|------------------------------------------|-----------------------------------------------|
| next     | `react/*nextjs*quickstart*.mdx`          | `create-next-app` (App Router, TS, defaults)   |
| react    | `react/react-quickstart*.mdx`            | Vite react-ts template                         |
| node     | `node/quickstart.mdx`                    | `npm init -y`, empty dir                       |
| python   | `python/quickstart.mdx`                  | fresh venv                                     |
| cli      | `cli/quickstart.mdx`                     | whatever the page itself assumes               |
| rn       | `react/*react-native*.mdx` (quickstart)  | Expo default template                          |
| tanstack | `react/*tanstack*quickstart*.mdx`        | TanStack Start scaffold                        |

Older-IA branches (pre-refactor) keep quickstarts under `next/`, `react/`,
etc. — the globs are hints, not contracts; search the tree and pick the page
a newcomer would land on. If a flow's spine page doesn't exist on this
branch, mark the flow `not present` in the report and move on (only a finding
if the branch claims to support it, e.g. a nav entry pointing nowhere).

The **tested set** = the spine page plus every page a step forces you through
(e.g. the CLI auth page when a step says "run `npx gt auth`... see the
Dashboard docs"). List all tested pages in the report. Do not crawl beyond
need — the content repo has its own link CI; only report a dead link when a
step actually depended on it.

The substrate is the precondition the doc states ("assumes Next.js 13 or
later" → current `create-next-app` with defaults). Substrate commands are
environment prep, not doc steps — log them separately in the transcript. If
the doc never states what it assumes you're starting from, that's a 🟡
`missing-step` finding.

**Reachability:** confirm the spine (and every pulled-in page) is reachable
from the branch's nav manifest (meta.json / filetree manifest). A page a
reader can only reach by URL-guessing is a 🟡 `nav-orphan` finding — correct
content nobody can find has a long history here.

**Extensions — the user's second session.** `<flow>+<ext>` walks a follow-on
guide on top of the finished spine app, because real adopters don't stop at
the quickstart and nobody has ever executed the follow-on guides end-to-end.
Known exts (same glob-discovery rules as flows): `routing` (URL
routing/middleware guide — historically demands relocating every page and was
never tested as written) · `ssg` (static rendering guide, if the branch has
one). Extension findings get ids `<flow>+<ext>/<step>-<slug>`. Only run an
extension after its spine passes.

## 3 · The sweep — default scope

With no narrowing scope you test **everything the tree tells a reader to
do**: every page under `docs/en-US/**` at the resolved SHA (blog, devlog,
authors, and templates are out), every actionable item — commands to run,
code to add, files to create, options a page says can or should be set. The
unit of coverage is the actionable item, not the page.

1. **Inventory.** Walk the tree once and extract each page's actionable
   items (imperatives, fenced commands, config/code the reader is told to
   apply). Stable id per item: `<page-path>#<n>-<slug>`.
2. **Ledger.** Persist to
   `$DOCTEST_HOME/sweeps/<target-slug>-<sha7>/ledger.json`: every item, its
   disposition, its status. A ledger already existing for this target+SHA
   means RESUME — never redo finished items. The ledger is the coverage
   proof; the report is generated from it.
3. **Dispositions** — every item gets exactly one:
   - `executed` — run here, verdict attached
   - `needs-creds` — ⚪ unless `DOCTEST_GT_*` present (then execute)
   - `needs-external-service` — dashboard/browser/CMS-account steps
     (Sanity/Storyblok/Mintlify accounts, OAuth handoffs): execute the local
     half, ⚪ the remainder with one line stating exactly what a human must
     click
   - `destructive-platform` — never run against platform state; probe the
     local-only semantics instead (verification probe 7)
   - `not-runnable-here` — needs hardware/OS the box lacks (device builds)
   - `duplicate-of <id>` — same instruction on multiple pages: execute once,
     link the rest, and log substantive differences between the copies as
     `drift`
4. **Order and context.** Quickstart flows first (stateful walks per §2/§5,
   one sandbox each), then their extensions, then everything else grouped
   into per-section work units (`react/`, `cli/`, `node/`, `python/`,
   `platform/`, `integrations/`). Run each item in the cheapest valid
   context: on top of the finished flow app when the page assumes one (most
   guides do), in a fresh sandbox when it assumes none; config options by
   actually setting them and observing the documented effect.
5. **Fan-out.** If the harness offers subagents, give each work unit its own
   subagent and sandbox; each returns findings + ledger updates as
   structured data; merge centrally (dedup by finding id, keep the
   worst-severity copy). No subagents → run units sequentially; the ledger
   makes dying and resuming cheap.
6. **Timeboxes.** ~20 min soft cap per work unit; ~4 h per sweep
   (`DOCTEST_MAX_HOURS` overrides). Hitting a cap is reportable coverage
   ("stopped at 71% — the ledger lists what remains"), never a silent stop.
7. The static snippet pass (§5) covers the WHOLE tree in a sweep, not just
   changed pages.

## 4 · Sandbox

- `WORKDIR=$(mktemp -d /tmp/doctest-<flow>-XXXXXX)` — everything happens in
  there. Never touch any existing checkout, and never run package installs
  outside WORKDIR.
- Capture the environment first: `node -v`, `npm -v`, `git --version`, OS,
  date. After install steps, capture resolved GT package versions from the
  lockfile. All of this goes in the report header.
- Non-interactive discipline: set `CI=1`. Where the SUBSTRATE needs flags to
  avoid prompts (e.g. `create-next-app --yes`), use them. Where a **doc
  command** prompts interactively with no documented flags, answer with the
  most default choice, and log a 🟡 `agent-blocker` finding — agents (and CI)
  cannot follow that step, which is a doc defect by this skill's premise.
- Credentials: if the host provides `DOCTEST_GT_API_KEY` /
  `DOCTEST_GT_PROJECT_ID` (a dedicated throwaway GT project), export them
  inside the sandbox under whatever names the docs specify, at the step where
  the docs say to. If absent, execute key-gated steps anyway to capture their
  failure mode, then mark them ⚪ `skipped-credentials` (not blockers) and
  continue with whatever remains testable. Never print key values; redact
  them from every transcript and report.
- Timeboxes for narrowed runs: ~15 min soft cap per flow, 25 min per run
  (`all`: 60). Sweeps use §3's caps. A cap overrun is itself a signal —
  report it rather than silently grinding.

## 5 · Walk the docs — newcomer mode

Read the spine page top to bottom first; enumerate its steps (the refactor
uses numbered `### N.` headings — but count whatever the page's structure
implies). Then execute in order:

- Run every command **exactly as written**, in the order written. Typo in the
  doc → run the typo. Pick ONE package-manager tab per run (npm unless the
  page defaults otherwise) and note the choice — but statically compare the
  other tabs: packages, flags, or steps that differ in substance between tabs
  is a 🟡 `drift` finding (don't run all four; read them).
- While reading, collect the page's explicit falsifiable claims ("no other
  changes to your config are needed", "works in both server and client
  components", "X is created automatically"). After verification, spot-check
  the cheap ones — ≤4 per run, ≤2 min each. Observed ≠ claimed → 🟡
  `claim-mismatch` (a doc that overpromises burns more trust than one that
  errors).
- Code blocks with `title="path"` → write exactly that file at exactly that
  path. A code block with no stated destination → 🟡 `ambiguous`, then use
  the most literal placement.
- Placeholders (`YOUR_API_KEY`, project IDs) → substitute sandbox
  credentials. If the page never says where the value comes from → 🟡
  `missing-step`.
- Ambiguous instruction → take the most literal reading, log 🟡 `ambiguous`
  with the reading you took.
- Optional/collapsed steps: follow the main path; note untested branches in
  the report ("not walked").
- **No outside knowledge.** If a step only works because you knew something
  the page doesn't say, stop pretending it passed — that's a finding.

### When a step fails — expert mode (logged)

1. Capture the failure verbatim: command, exit code, the error text (trim to
   the ~20 relevant lines). Capture exit codes without piping the command
   (`cmd > out 2>&1; echo $?`) — piping through `head`/`tee` reports the
   pipe's status, and zsh doesn't honor bash's `PIPESTATUS`.
2. Diagnose and try the **smallest** fix that unblocks. Up to 3 distinct
   approaches, then stop trying.
3. Fixed → log a 🟠 `detour`: root cause, the exact fix applied, and a
   concrete suggested doc edit (see § Findings). Resume newcomer mode at the
   next instruction.
4. Not fixed → 🔴 `blocker`. Continue with later steps only if they're
   independent of the wreckage; otherwise the flow ends here.

### Verification — the value moment

Docs "completing" is not the bar; a working result is. After the last step
(every probe below earned its place by catching a real shipped bug):

1. Boot the app the way the flow's framework does (`npm run dev` etc.), wait
   for ready, and request the page — expect HTTP 200 and no framework error
   overlay in the HTML.
2. Actuate the locale-switch mechanism the docs provided — with or without
   credentials (e.g. set the documented cookie and re-request; no browser
   needed). With translations: translated text must actually render —
   silent default-locale = 🔴 on that step even if every command
   "succeeded". Keyless: record what the switch does, and whether anything
   (UI, console, server log) explains a no-op — an unexplained no-op is the
   🟡 silent-failure class.
3. Check the served `<html lang>`: it must exist and match the rendered
   locale — the one bug an i18n product can't afford.
4. Request `/<first target locale>` (e.g. `/es`). A 404 is fine only if the
   flow discussed routing; an undiscussed 404 = 🟡 (a week-one decision the
   docs never surface).
5. If credentials present, run the production build the docs configured —
   and read the route table, don't just pass/fail it: quickstart-scaffold
   routes flipping from `○ (Static)` to `ƒ (Dynamic)` with no doc mention of
   the trade-off = 🟡. Keyless: skip, and say so.
6. If the page itself never tells the reader how to see it working — no
   "run this and you should see X" — log 🟡 `no-verify`. Silent success is
   the top historical failure mode of these docs.
7. If the flow ran a file-generating command (`generate`, `translate`,
   `init`, `setup`), run it once more, unmodified, and diff the project:
   silently clobbered edits or new stray files = 🟡 `destructive` (the
   merge-vs-clobber semantics of these commands are undocumented and have
   already cost one user their manual overrides — never probe this against
   platform state, local files only).

### Snippet pass — static

The walk covers pages a user executes; this covers pages a user *copies
from*. Scope: in a sweep, every page in the tree; in a narrowed run, the
pages the PR changes (bare-branch target → just the tested set; cap at 40
pages and say so if you truncate). Extract fenced code blocks and parse —
don't run, don't type-check:

- `json` → `JSON.parse` (this alone has caught shipped invalid examples)
- `js` → `node --check`; `ts`/`tsx` → parse-only via the sandbox's
  `typescript` (`transpileModule`, report syntactic diagnostics only)
- `bash` → `bash -n`
- Skip blocks that are deliberate fragments: containing `...`/`…`
  placeholders, `[!code` annotations, or diff markers.

Hard parse failures only, reported as 🟡 `broken-code` with file:line — a
snippet that can't parse can't ever have been tested. No style opinions, no
type errors on fragments; false positives kill this check's credibility.

## 6 · Findings

Each finding gets a stable id `<flow>/<step>-<slug>` (e.g.
`next/6-translate-needs-prod-key`), a severity, and a category:

- Severities: 🔴 `blocker` — no way through, even with fixes · 🟠 `detour` —
  docs-as-written fail; you found a fix a newcomer (or a weaker agent)
  wouldn't · 🟡 `friction` — passable but ambiguous, misleading, or
  agent-hostile · ⚪ `skipped` — untestable here (credentials, platform).
- Categories: `wrong-command`, `broken-code`, `missing-step`, `ambiguous`,
  `env-gap`, `agent-blocker`, `no-verify`, `dead-link`, `claim-mismatch`,
  `nav-orphan`, `drift`, `destructive`.
- Every 🔴/🟠 carries: what the doc says (quoted), what actually happened
  (error excerpt), root cause, fix applied (if any), and a **suggested edit**
  — concrete replacement text in a ```suggestion block against the exact file
  and line, ready to paste into a PR review. "Clarify this section" is not a
  suggested edit. Link every finding to its source line:
  `https://github.com/generaltranslation/content/blob/<CONTENT_SHA>/<path>#L<n>`.
- Repeats: compare finding ids (fuzzy-match titles too) against `history` in
  state for the same target family. Tag `(repeat ×N)` or `(new)`; findings
  from the previous run that no longer reproduce get one "fixed since last
  run" line in the report. Repeats are the tech-debt signal this skill
  exists to kill — surface them first.

Flow verdict: ✅ CLEAN (no findings) · 🟡 FRICTION (worst is 🟡) · 🟠
DETOURED (worst is 🟠) · 🔴 BLOCKED. Run verdict = worst flow.

## 7 · Report back

**Summary — always, ≤6 lines, glanceable.** Shape:

    🩺 end-to-end-doctesting · next · content@077b1f9 (via gt-cloud#3427 · jackie-content-docs-refactor)
    verdict: 🟠 DETOURED — setup finished, but 2 steps needed fixes the docs don't give
    🔴 0 · 🟠 2 · 🟡 3 · ⚪ 1 (no creds) · 9 steps · 12 min · covers 3 of the PR's 14 docs pages
    worst: step 6 — `npx gt translate` rejects the key the quickstart had you create (new) → <deep link>
    report: <path>

  The coverage clause is mandatory — partial coverage must never read as
  "checked everything". Narrowed run on a PR: pages, as above. Sweep: items
  from the ledger, e.g. `412 executed · 57 ⚪ (reasons in report) · 469
  items · 148 pages`. The `verdict:` line is stable-format on purpose
  (`verdict: 🔴|🟠|🟡|✅ …`) so machines can parse it.

  Clean run — two lines, no report file:

    🩺 end-to-end-doctesting · next · content@077b1f9 (gt-cloud#3427) — ✅ CLEAN
    9/9 steps verbatim · dev 200 · es renders translated · prod build ok · 11 min · no report needed

**Full report — when the verdict isn't CLEAN** (or on explicit request).
Build it from `references/report-template.md` (worked example from a real
run: `references/example-report.md`), save to
`$DOCTEST_HOME/reports/doctest-<flow>-<target-slug>-<UTC yyyymmddHHMM>.md`,
and put its path on the summary's `report:` line (a harness that can attach
files should attach it too). The report holds the full findings, the tested
page list, environment, and the complete command transcript with exit codes.

Never post to the PR, file issues, or push anything on your own. End the
report line with: `say "file it" to turn these into PR review comments` —
and only do that when asked in a follow-up.

**Headless runs** (`claude -p "/end-to-end-doctesting …"` — CI, cron, a bot relaying to
chat): your final printed message is the entire interface — whatever
launched you relays or parses it verbatim. End the run with exactly the
summary shape above and nothing after it, and still write the report file.
You still never ask questions; a failed hard precondition is a one-line
reply, not a prompt.

## 8 · State

`$DOCTEST_HOME/state.json` (default `DOCTEST_HOME=~/.doctest`). Read it
before resolving; write it after every run, pass or fail:

    {
      "last_target": "gt-cloud#3427",
      "last_flow": "next",
      "resolved": { "gt_cloud_branch": "...", "content_ref": "...", "content_sha": "..." },
      "last_run": { "at": "<UTC ISO>", "verdict": "DETOURED", "report": "<path>", "counts": {"blocker":0,"detour":2,"friction":3,"skipped":1} },
      "history": [ { "at": "...", "target": "...", "flow": "...", "verdict": "...", "findings": [{"id":"...","sev":"...","title":"..."}] } ]
    }

Keep the last 20 runs in `history` (that's what powers repeat detection).
First run ever: no state file means no default target — the user names a
branch or PR once, and state remembers it from then on.

## 9 · Cleanup

Delete WORKDIR after the report is written (`keep` → leave it and print the
path). Reports and state stay. Leave nothing else on the machine — no global
installs, no config outside WORKDIR and $DOCTEST_HOME.

## Reference

- `references/report-template.md` — full-report skeleton and summary shapes
  (§7 builds from this).
- `references/example-report.md` — a real narrowed run's report, the worked
  example (including `Since last run` repeat-tagging).
- `references/operations.md` — operator notes: host requirements,
  headless/CI recipes, tester-model choice, the naive first-timer probe,
  state layout. Nothing in it changes agent behavior.
