# end-to-end-doctesting report template

Copy this shape. Drop sections that are empty rather than leaving "none"
stubs — the report should read like a QA engineer's writeup, not a form.
Everything in `<angle brackets>` is a placeholder. Redact credentials
everywhere, including inside quoted error output.

```markdown
# end-to-end-doctesting · <flow> · <target>

**Verdict: <emoji> <VERDICT>** — <one-sentence plain-language summary of the run>

| | |
|---|---|
| Docs under test | `generaltranslation/content@<CONTENT_SHA7>` (branch `<content branch>`, PR <content#N>) |
| Via | gt-cloud#<N> `<gt-cloud branch>` (submodule `apps/landing/content`) |
| Flow / substrate | <flow> · <substrate, e.g. create-next-app 16.2.10 --yes, npm tab> |
| Environment | <OS> · node <v> · npm <v> · gt-next <resolved v> · gt <resolved v> |
| Run | <UTC ISO datetime> · <duration> · <n> steps · <n> commands · slowest step <n> (<time>) |
| Run variant | <only when steered off-default: "pnpm tab", "steps 1–3 only", …; omit row otherwise> |
| Coverage | <narrowed: "spine + 2 pulled pages · PR touches 14 docs pages (11 unexercised)"> <sweep: "412 executed · 57 ⚪ · 469 items · 148 pages · ledger: sweeps/<slug>/ledger.json"> |
| Findings | 🔴 <n> · 🟠 <n> · 🟡 <n> · ⚪ <n> |

## Since last run (<date>, <target>)

- Fixed: <finding id — one line>            ← findings that no longer reproduce
- Still present: <finding id> (repeat ×<N>) ← lead with these; they are the debt

## Findings

### 🔴 <id> · <title> (new | repeat ×N)

- **Where:** step <n> "<step heading>" — [<file>:<line>](https://github.com/generaltranslation/content/blob/<CONTENT_SHA>/<path>#L<n>)
- **Category:** <wrong-command | broken-code | missing-step | ambiguous | env-gap | agent-blocker | no-verify | dead-link>
- **Doc says:**
  > <exact quote from the page>
- **What happened:**
  ```text
  $ <command as run>
  <trimmed error output, ≤20 lines>
  ```
- **Root cause:** <one or two sentences>
- **Fix applied:** <exact deviation taken, or "none found — 3 approaches exhausted: <a>, <b>, <c>">
- **Suggested edit:** <file>:<line>
  ```suggestion
  <exact replacement text for that line/block>
  ```

<!-- repeat per finding, 🔴 first, then 🟠, 🟡, ⚪ -->

## Verification

- Dev server: <200 / error — detail>
- Locale switch (<mechanism the docs gave>): <translated text rendered? quote a translated string>
- Production build: <ok / failed — detail / skipped (no credentials)>

## Coverage (sweep runs)

- Executed: <n> items · ⚪ by disposition: needs-creds <n> · needs-external-service <n> · destructive-platform <n> · not-runnable-here <n> · duplicates <n>
- <one line per ⚪ disposition group worth a human's attention — e.g. "9 dashboard items: local halves executed; the click-path from 'Create project' onward needs a human once">

## Pages tested

- <docs/en-US/...> (spine)
- <docs/en-US/...> (pulled in by step <n>)

## Not walked

- <optional/collapsed branches, other package-manager tabs, flows not present on this branch>

## Transcript

<details><summary>Substrate (environment prep — not doc steps)</summary>

  ```text
  $ <command> → exit <code>
  ```
</details>

<details><summary>Doc steps as executed</summary>

  ```text
  [step 1] $ <command> → exit <code>
  [step 2] wrote next.config.ts (verbatim from doc)
  ...
  ```
</details>
```

## Summary shapes (for reference)

Findings run — ≤6 lines, worst thing named in plain words, deep link, report path:

```text
🩺 end-to-end-doctesting · next · content@077b1f9 (via gt-cloud#3427 · jackie-content-docs-refactor)
verdict: 🟠 DETOURED — setup finished, but 2 steps needed fixes the docs don't give
🔴 0 · 🟠 2 · 🟡 3 · ⚪ 1 (no creds) · 9 steps · 12 min · node 24.13.0
worst: step 6 — `npx gt translate` rejects the key the quickstart had you create (repeat ×2) → <link>
report: <path> · say "file it" to turn these into PR review comments
```

Blocked run — say where it died and what a user would see:

```text
🩺 end-to-end-doctesting · next · content@077b1f9 (gt-cloud#3427)
verdict: 🔴 BLOCKED at step 4/9 — fresh app 500s on first `npm run dev`, no fix found in 3 attempts
🔴 1 · 🟠 1 · 🟡 2 · 8 min · node 24.13.0
a newcomer following this page verbatim cannot reach a running app → <link>
report: <path> · say "file it" to turn these into PR review comments
```

Clean run — two lines, no report file:

```text
🩺 end-to-end-doctesting · next · content@077b1f9 (gt-cloud#3427) — ✅ CLEAN
9/9 steps verbatim · dev 200 · es renders translated · prod build ok · 11 min · no report needed
```
