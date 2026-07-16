# end-to-end-doctesting · next · gt-cloud#3427

> Real output of a narrowed run (2026-07-16, spawned headless instance, keyless
> host), kept as the worked example of the report format — including the
> `Since last run` repeat-tagging that a second run over the same SHA produces.

**Verdict: 🟡 FRICTION** — all 6 quickstart steps run verbatim and the app boots clean, but the reader is never told how to see it working, the page ships unstyled with no `<html lang>` and no `<title>`, and nothing visibly translates or explains why.

| | |
|---|---|
| Docs under test | `generaltranslation/content@077b1f9` (branch `docs-refactor`) |
| Via | gt-cloud#3427 `jackie-content-docs-refactor` (submodule `apps/landing/content`) |
| Flow / substrate | next · create-next-app --yes (Next 16.2.10, App Router, TS, Tailwind), npm tab |
| Environment | macOS 26.4 · node 24.18.0 · npm 11.16.0 · gt-next 11.0.8 · gt 2.14.62 |
| Run | 2026-07-16T00:18Z · ~7 min · 6 steps · 9 commands |
| Findings | 🔴 0 · 🟠 0 · 🟡 7 · ⚪ 1 |

## Since last run (2026-07-15, gt-cloud#3427)

Content SHA is unchanged (`077b1f9`) — nothing could have been fixed, and nothing was.

- Still present: `next/6-ssg-warning-dead-link` (repeat ×2)
- Still present: `next/4-layout-snippet-clobbers-scaffold` (repeat ×2)
- Still present: `next/4-html-lang-never-set` (repeat ×2)
- Still present: `next/6-build-wired-before-keys` (repeat ×2)
- New this run (page unchanged — surfaced by fuller probe coverage, not doc regressions): `next/7-no-verify`, `next/7-es-404-undiscussed`, `next/5-duplicate-page-snippet`

## Findings

### 🟡 next/4-layout-snippet-clobbers-scaffold · Full-file layout snippet silently drops globals.css, fonts, and metadata (repeat ×2)

- **Where:** step 4 "Add the provider to your root layout" — [nextjs-quickstart.mdx:91](https://github.com/generaltranslation/content/blob/077b1f99ce278a8909b782bf4f2d49db5b716bd9/docs/en-US/react/nextjs-quickstart.mdx#L91)
- **Category:** broken-code
- **Doc says:**
  > Wrap your app in `GTProvider` at the root layout. — followed by a complete `app/layout.tsx` file with bare `<html>`/`<body>` and no other imports.
- **What happened:** written verbatim over the scaffold's layout, the served page has no stylesheet link, no font variables, no `<title>`, and no meta description (`grep '<title>' → nothing`). Every create-next-app user "wraps their root layout" by destroying it.
- **Root cause:** the snippet is a replacement file styled as an addition. The scaffold layout imports `./globals.css`, two Geist fonts, and exports `metadata` — all silently discarded.
- **Fix applied:** none — kept the doc's file verbatim per protocol; app still boots, just unstyled and untitled.
- **Suggested edit:** nextjs-quickstart.mdx:91–107
  ```suggestion
  ```tsx title="app/layout.tsx"
  import { GTProvider } from 'gt-next';
  // ...keep your existing imports (globals.css, fonts, metadata)...

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <html lang="en">
        <body>
          <GTProvider>{children}</GTProvider>
        </body>
      </html>
    );
  }
  ```
  Only the `GTProvider` import and wrapper are new — keep everything else your layout already has.
  ```

### 🟡 next/4-html-lang-never-set · Rendered page ships no `<html lang>` at all (repeat ×2)

- **Where:** step 4 — [nextjs-quickstart.mdx:100](https://github.com/generaltranslation/content/blob/077b1f99ce278a8909b782bf4f2d49db5b716bd9/docs/en-US/react/nextjs-quickstart.mdx#L100)
- **Category:** broken-code
- **Doc says:** the layout snippet renders `<html>` with no `lang` attribute.
- **What happened:** served HTML is literally `<html>` — the snippet *removed* the scaffold's `lang="en"`, and neither `GTProvider` nor the plugin injects one. An i18n quickstart ends with a page less locale-correct than the blank scaffold it started from.
- **Root cause:** snippet omits `lang`; gt-next 11.0.8 does not set it automatically in this configuration.
- **Fix applied:** none (verbatim run).
- **Suggested edit:** covered by the step-4 suggestion above (`<html lang="en">`), ideally with a sentence pointing at the dynamic-locale approach (`getLocale()`) for when routing/middleware is added.

### 🟡 next/6-build-wired-before-keys · Quickstart wires a key-requiring command into `build` before keys exist (repeat ×2)

- **Where:** step 6 "Generate translations" — [nextjs-quickstart.mdx:150–164](https://github.com/generaltranslation/content/blob/077b1f99ce278a8909b782bf4f2d49db5b716bd9/docs/en-US/react/nextjs-quickstart.mdx#L150)
- **Category:** missing-step
- **Doc says:**
  > Run the CLI to translate your project… `npx gt translate` … Add the command to your build script… — with the credentials note only *after* both instructions.
- **What happened:**
  ```text
  $ npx gt translate
  ■  No API key was found. Pass --api-key or set the GT_API_KEY environment variable.
  → exit 1
  ```
  A verbatim reader runs a failing command, then wires that same failing command into `npm run build`, and only afterwards reads the footnote about `GT_PROJECT_ID`/`GT_API_KEY`.
- **Root cause:** ordering — credentials setup is a trailing italic note instead of a prerequisite sub-step.
- **Fix applied:** none needed to proceed (later steps independent); build left failing by construction on a keyless machine.
- **Suggested edit:** nextjs-quickstart.mdx:148 — move the note up as the step's first paragraph:
  ```suggestion
  `npx gt translate` needs a Project ID and a production API key. Run `npx gt auth` or visit the [Dashboard](/docs/platform/dashboard/get-started) to get them, and set them as `GT_PROJECT_ID` and `GT_API_KEY` in your environment (never prefixed with `NEXT_PUBLIC_`). Then run the CLI to translate your project:
  ```

### 🟡 next/6-ssg-warning-dead-link · SDK per-request warning deep-links a page this branch deletes (repeat ×2)

- **Where:** runtime, during verification — every uncached request logs:
  ```text
  gt-next: No locale could be determined for this request. If you use SSG, configure locale
  resolution, or gt-next will fall back to the default locale.
  Learn more: https://generaltranslation.com/en/docs/next/guides/ssg#ssg-custom-get-locale
  ```
- **Category:** dead-link
- **What happened:** `docs/en-US/next/guides/ssg.mdx` does not exist in this branch's tree (the entire `docs/en-US/next/` directory is removed by the refactor), and a gt-cloud code search finds no redirect for `guides/ssg`. The link works on prod today only because the old IA is still live; the moment this PR ships, the SDK's most-printed remedy link 404s.
- **Root cause:** IA refactor moved/removed the SSG guide without a redirect; SDK pins the old URL.
- **Fix applied:** n/a.
- **Suggested edit:** add a redirect from `/docs/next/guides/ssg` → its new-IA equivalent (or restore a stub page) in the gt-cloud landing app before merge; longer-term, the SDK should link a stable shortlink.

### 🟡 next/5-duplicate-page-snippet · Two conflicting code blocks both titled `app/page.tsx` (new)

- **Where:** step 5 "Mark content for translation" — [nextjs-quickstart.mdx:137](https://github.com/generaltranslation/content/blob/077b1f99ce278a8909b782bf4f2d49db5b716bd9/docs/en-US/react/nextjs-quickstart.mdx#L137)
- **Category:** ambiguous
- **Doc says:**
  > To translate strings in an async server component, use `getGT` instead: — followed by a second block titled `app/page.tsx` containing a different default export.
- **What happened:** nothing broke here because I read "instead" as an illustrative alternative and kept the first block. But `title="app/page.tsx"` is a write-this-file instruction; an agent applying every titled block verbatim overwrites the step-5 demo (LocaleSelector, `<T>`, `useGT`) with a bare `getGT` page and the quickstart's visible result vanishes.
- **Fix applied:** took the most literal main-path reading (first block kept); second block not walked.
- **Suggested edit:** nextjs-quickstart.mdx:137
  ```suggestion
  ```tsx title="app/about/page.tsx"
  ```
  (or drop the `title=` entirely so the block reads as an example, not a file to write)

### 🟡 next/7-no-verify · The quickstart never tells the reader how to see it working (new)

- **Where:** whole page — no step boots the app; `npm run dev`, `localhost`, and "you should see…" appear nowhere on the page.
- **Category:** no-verify
- **What happened:** the flow "completes" at step 6 with a failing CLI command and no moment where the reader confirms anything renders, switches locale, or translates. Everything the verification section below found (no styles, no lang, silent no-op switch) is invisible to a reader who follows the page and stops.
- **Suggested edit:** add a closing "### 7. See it work" step: `npm run dev`, open `http://localhost:3000`, "you should see the locale selector; pick Español and the heading becomes *Bienvenido a mi aplicación*" — plus one sentence on what keyless dev mode shows instead.

### 🟡 next/7-es-404-undiscussed · `/es` 404s and routing is never surfaced (new)

- **Where:** verification probe — `GET /es → 404`; the spine never mentions locale paths, middleware, or routing (middleware exists only as a sidebar "related" link).
- **Category:** missing-step
- **What happened:** target locales are declared in step 3 (`es`, `fr`, `ja`) but no locale is reachable at a URL, and the LocaleSelector doesn't produce one. The reader ends the quickstart never knowing locale-path routing is a decision they must make.
- **Suggested edit:** one sentence in step 3 or a closing step: "Locales are served on the same URL by default; to give each locale its own path (`/es`, `/fr`), add the [middleware](/docs/react/nextjs/middleware)."

### ⚪ next/6-translate-skipped-credentials · `gt translate` untested end-to-end (repeat ×2)

- **Category:** env-gap — no `DOCTEST_GT_*` credentials on this host. Failure mode captured above (clean exit-1 with a clear message, no stack trace). Translated rendering, CDN loading, and the production build (which now begins with `npx gt translate`) are all untested this run.

## Verification

- Dev server: ✅ 200 on `/`, ready in <1 s, no error overlay. (Bound to port 3002 — 3000 busy on this host; not a doc issue.)
- Rendered page: `<T>` content and both `gt()` strings render in English; **no `<html lang>`, no `<title>`, no stylesheet** (see findings).
- Locale switch (LocaleSelector, the mechanism the docs provide): selecting Español triggers a reload, then the selector snaps back to English and content is unchanged — a keyless no-op. It **is** explained, but only in the terminal: `I18nCache: Loading translations from a remote store needs a projectId. No translations will be loaded.` plus the per-request SSG warning whose "learn more" link is the dead page from the ssg-warning finding above. Nothing on the page itself explains it. (Expert-mode extra, not a doc step: forcing `Cookie: generaltranslation.locale=es` also still renders English.)
- `/es`: 404 (finding above).
- Production build: skipped — keyless, and the docs-authored build script starts with the key-requiring `npx gt translate` (exit 1 captured at step 6).

## Pages tested

- `docs/en-US/react/nextjs-quickstart.mdx` (spine — the only page any step forced through; CLI-auth and dashboard pages referenced at step 6 were not needed keyless)

## Not walked

- yarn / bun / pnpm tabs (npm chosen)
- Step 5's alternative `getGT` block (see finding `next/5-duplicate-page-snippet`)
- Sidebar "related" pages: server-functions, middleware, config, link
- `npx gt auth` / Dashboard key setup (no credentials)

## Transcript

<details><summary>Substrate (environment prep — not doc steps)</summary>

```text
$ mktemp -d /tmp/doctest-next-XXXXXX        → /tmp/doctest-next-Y00x8R
$ CI=1 npx create-next-app@latest app --yes → exit 0 (Next 16.2.10, TS, Tailwind, App Router)
```
</details>

<details><summary>Doc steps as executed</summary>

```text
[step 1] $ npm install gt-next && npm install gt --save-dev → exit 0 (gt-next 11.0.8, gt 2.14.62)
[step 2] wrote next.config.ts (verbatim from doc; replaced scaffold config)
[step 3] wrote gt.config.json (verbatim)
[step 4] wrote app/layout.tsx (verbatim; replaced scaffold layout — dropped globals.css/fonts/metadata/lang)
[step 5] wrote app/page.tsx (first block verbatim; second same-titled block treated as alternative)
[step 6] $ npx gt translate → exit 1 ("No API key was found. Pass --api-key or set the GT_API_KEY environment variable.")
[step 6] package.json scripts.build = "npx gt translate && next build"
[verify] $ npm run dev → Ready in 186ms on :3002
[verify] $ curl -s http://localhost:3002/ → 200; <html> (no lang); no <title>; "Welcome to my app" present
[verify] browser: LocaleSelector → Español → reload, selector back to English, content unchanged
[verify] server console: "I18nCache: ... needs a projectId. No translations will be loaded."
[verify] $ curl -s http://localhost:3002/es → 404
```
</details>
