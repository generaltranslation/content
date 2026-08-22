---

## name: General Translation docs internal skill
description: Follow these rules when creating, editing, reviewing, or restructuring General Translation documentation content. Use this style guide when the user asks about docs voice, structure, naming, or formatting conventions.

# General Translation docs style guide

Rules for authoring and updating the General Translation docs. Follow these to preserve the established style, structure, and flow.

*This file is the single source of truth for docs style; the* `docs-skill` *skill loads it. Do not maintain a second copy.*

General Translation is **one full-stack product**, and every top-level docs section is a capability of it. They all follow the same **Get Started/Quickstart/Introduction → Guides → Reference** spine. A few rules are specific to the Platform section (Dashboard, Locadex, OpenAPI, Core) and are marked *(Platform-specific)*.

## Before you write: understand the system first

Good docs come from understanding, not paraphrasing. Before applying any formatting rule below — especially on a first rewrite with access to the codebase — work in this order:

1. **Understand the application and the logic of each piece first.** For the product/section you are documenting, work out what each feature, function, endpoint, or setting actually does, who uses it, and why it exists — including inputs, outputs, defaults, constraints, and failure modes. Only once the behavior is clear should you spin out into the structure and formatting conventions in this guide. Do not start from the formatting.
2. **Read the existing docs for that area, but treat the code as the source of truth.** Existing pages often contain human-written explanations, product guardrails, edge cases, and nuance that are not evident from the code alone. Treat them as *supplementary* material only: mine them for intent and fold that in, and rework or delete duplicative content freely. They are a second pass on top of the code, never a substitute for it. **The code is ALWAYS the source of truth. Whenever the code and the existing docs disagree, follow the code without exception** and correct the docs to match. Never carry over a behavior, signature, parameter, default, return type, or option from the old docs once you have seen the code contradict it — do not "stay faithful to the old docs" in those cases. When you cannot find something in the code, verify it against the code before documenting it; do not invent or assume — use your best judgement and prefer omission over invention.
3. **Then apply the conventions below** for architecture, naming, structure, and voice. Settle the filetree structure before writing full docs content, using your best judgement.



## Source of truth and best judgement

The codebase is always the source of truth. Resolve questions by reading the code, and use your best judgement to make a decision rather than deferring to a reviewer or leaving the choice open. Do not add review checklists, "flag for human review" notes, or lists of open questions to the docs or the change.

- **Verify against the code, then decide.** When the code and the existing docs disagree, follow the code and correct the docs. When something is unclear, dig into the code until it is clear; when it genuinely cannot be verified from the code, use your best judgement from the existing docs and the live product, document the current known state plainly, and prefer omission over invention.
- **Verify what is shipped, not merely merged.** For a versioned library or CLI, the published artifact for the version the page targets is the source of truth for availability. Install and probe that exact release for exports, signatures, defaults, runtime requirements, and package versions; repository source may contain unreleased behavior.
- **Close calls:** when two options for structuring, displaying, or describing information are similarly good, pick the stronger one and move on — do not stall or leave both in the page.
- **UI-only surfaces (Dashboard, Locadex).** These describe screens, labels, and navigation that are not verifiable against this codebase and drift as the product UI changes. Confirm UI names and flows against the live product and use your best judgement; if a UI detail is unconfirmed, omit it rather than guessing. Never ship a "Details to confirm" section.
- **Experimental Python SDK.** The 0.x Python SDK (`generaltranslation`, `gt-i18n`, `gt-flask`, `gt-fastapi`, from the `generaltranslation/gt-python` repo) may not be verifiable against this repo. Verify every signature, return type, and default against the published package; when you cannot, prefer omission over invention. State the experimental status and version floor once (in the section intro or Reference index `_Note:_`), and add `Changed in vN` notes cautiously given the fast-moving 0.x surface.



### Safeguards for audits and rewrites

Automated audits and broad rewrites have repeatedly passed builds, link checks, and approval while still containing incorrect behavior or silently dropping important details. Apply these safeguards to every material rewrite, simplification, content audit, or product-sync pass.

#### Establish the shipped behavior

- **Triangulate API contracts.** Do not infer an endpoint from one type or handler. Cross-check the public request schema, normalization and derivation logic, persistence or upsert behavior, response serializer, tests, and published client types. Verify identity keys, defaults, overwrite versus idempotency behavior, partial failures, retry safety, size limits, and every status code separately.
- **Inventory UI behavior before rewriting it.** For Dashboard and Locadex pages, record the current controls, defaults, role and permission requirements, plan gates, button states, disconnect behavior, and failure states from the live product. A reorganized page must not make a still-active control disappear. Use exact role names such as **Admin**; do not substitute an informal role label such as "owner."
- **Scope claims to the mode that implements them.** When a capability supports multiple modes, state which mode an example uses. Audit broad wording around storage, fields, imports, defaults, permissions, and lifecycle behavior so one mode is not presented as universal.

#### Preserve semantics while simplifying

Before rewriting, inventory the facts in the existing page. Account for every prerequisite, permission, role, plan requirement, setup mode, default, side effect, authorization scope, billing effect, limit, fallback, update or replacement behavior, retry rule, and failure mode.

- Keep each verified fact, move it to the relevant Guide or Reference page, or correct it from the source of truth. Delete it only when it is obsolete, duplicative, or cannot be verified.
- Review deletions as carefully as additions. A shorter diff is not automatically a clearer or more accurate page; concision applies to wording, not coverage.
- Shorten the happy path by moving secondary detail into a nearby Note or a linked Reference section. Never make the main path simpler by hiding a consequence the reader must plan for.
- Link volatile values such as pricing and quotas to their canonical source. Explain how usage is measured, but do not copy a rate table, worked cost calculation, or exact price unless the value is contractual and maintained on that page.

#### Validate the user journey

- **Walk every new or materially changed Quickstart in a clean project.** Start with only the requirements stated on the page and perform every step in order. Verify dependency installation, module format, file-creation order, credentials, interactive behavior, start commands, expected output, and the first language switch or translated result.
- **Test the documented environment.** An interactive wizard working locally does not prove the CI path works; a development key returning source text does not prove production credentials are configured; a pre-existing generated file does not prove the Quickstart creates it. Test fresh local, non-interactive, and framework-specific paths when the page claims to support them.
- A Quickstart is complete only when the reader reaches an observable success state. A docs build, valid code fence, or type-correct snippet does not establish that the sequence runs.

#### Treat information architecture as a route migration

Before moving or splitting pages, make an old-to-new route map. Update references in docs, blog, devlog, templates, `meta.json`, `related.links`, cards, and redirects; remember that route-group folder names do not appear in URLs. Validate every new target and preserve compatibility for established entry routes where redirects are supported.

#### Separate mechanical and semantic validation

Validators are necessary but cannot prove product accuracy. Run all structural checks, then separately verify removed facts, examples, version availability, UI workflows, option shapes, defaults, and error behavior against the shipped product. A green build must never be treated as evidence that a behavioral claim is true.



### No draft artifacts in published prose

A page is not done until it reads as finished prose. It must contain **zero** of the following:

- Reviewer directives or notes-to-self ("flag for human review", "confirm against the code", "verify with the team").
- Draft or placeholder sections ("Details to confirm", "TODO", "FIXME", "TBD", or "coming soon" used as a section).
- Bracketed fill-ins (`[…]`, `__PLACEHOLDER__`) or commented-out drafts.

If a detail is unverified, either omit it or write it as a normal `_Note:_` describing the current known state — do not leave an instruction to a future editor in the prose. A page with a "to confirm"/"to verify" heading is unfinished and must not ship.

## Document the complete public surface

Reference docs must cover the **entire public API**, not a curated subset. When you document a library, CLI, or API:

- **Capture every undocumented public surface.** Diff the code's public exports (classes, methods, functions, options, config keys, flags, endpoints, and types) against the existing pages, and add a page or section for anything public that is missing. Do not silently skip a public symbol because it is advanced, low-level, or tooling-oriented — document it (grouping several related low-traffic symbols onto one reference page is fine; omitting them is not). Add crosslinks between related symbols (for example, a method and its inverse, or a flat vs. parts variant) so readers can navigate between them.
- **Never expose anything marked internal.** If the code marks a symbol as internal — a JSDoc `@internal` tag, a leading-underscore private implementation, a `# private` member, an `__all__` omission, or an equivalent "not public" signal — do **not** document it, do not link to it, and do not reference the internal implementation. Document only the public wrapper that the internal function backs. When it is ambiguous whether a symbol is public, verify against the code and, if still unclear, treat it as internal (omit it) rather than exposing it.
- **Confirm the surface is genuinely complete** by cross-checking that every public export has a reference page or section, so the coverage is trustworthy.



## Audience, voice, and style



### Audience

Write for the reader of the specific page, and match depth and vocabulary to them:

- **Technical, developer-facing pages.** Readers are developers integrating the SDK, CLI, or API. Be precise about types, parameters, headers, defaults, and error behavior; show runnable examples. Ensure documentation is also machine-readable by LLMs and agents.
- **Nontechnical, product-facing pages: Dashboard and Locadex.** Readers are localization managers, translators, and PMs working in the Dashboard UI. Lead with outcomes and UI actions; explain concepts in plain language.

Clarity rules for every audience:

- Lead with **what it is and why** before **how**.
- One idea per sentence; prefer short sentences.
- Define a term the first time it appears, and expand acronyms on first use.
- Do not use a concept, product term, or setting before it has been introduced.
- Avoid unexplained jargon. If a term is unavoidable and too complex to explain in a sentence, link to where it is defined.



### General style

Model the docs after the Next.js docs: short intros, clear sections, and practical examples.

- Keep intros to **1–3 short sentences**; prefer clarity over completeness up front and let details come later.
- Keep headings clear and action-oriented.
- **Prioritize clarity and conciseness throughout.** Use **fewer words** whenever possible and cut anything that does not add meaning.
- **Guide descriptions are one concise sentence under the page title.** Summarize the outcome in plain language; leave step lists and subsection inventories to the body.
- **Do not use jargon when you do not need to.** When a plain word works, use it; when a technical term is genuinely necessary, define or link it on first use.
- Favor practical, runnable examples over exhaustive prose.



### Voice and formatting

- Address the reader as "you"; use active voice and imperatives.
- **Fragment vs. sentence in lists**: use fragments when simply listing pieces or labels (no period needed); use full sentences (including standalone imperatives like "Revoke unused keys.") when describing steps or actions, and end those with a period. Be consistent within a single list. List items that complete a lead-in stem ("From the page, you can:") are fragments and take no period.
- **Bold** UI elements the user interacts with: buttons, page names, fields, toggles (**Save**, **Translate**, **Target directory**).
- **Inline code** for code identifiers, file names, locale codes, environment variables, key prefixes, and headers (`en-US`, `GT_API_KEY`, `gtx-api-`, `x-gt-api-key`).
- **Summarize runtime wording; do not quote it verbatim.** Paraphrase interactive prompts, success and log messages, and console output rather than copying exact strings, so the docs stay correct when that wording changes. Reproduce a string exactly only when the value is part of the contract — environment variable names, flags, config keys, file names, commands, and error codes/identifiers. *Example: write "the wizard asks which API key type to generate" rather than quoting the full prompt sentence.*



#### Referring to Dashboard locations

Use a bolded breadcrumb with `>`: **Project > Automations**, **Project > Context**. Standardize on `>` (never `->`).

### Lists vs. tables

- **Default to bullet points** for readability and quick scanning, and for all conceptual explanations. Do not overuse tables.
- **Use a table only when comparing fixed reference data across the same dimensions:**
  - A matrix (roles × permissions with ✓).
  - Items compared across fixed dimensions (annotation types: *Best For* / *Usage*).
  - Reference lookups with parallel columns (locale code / language / script / region / description; API key resource / Read / Write).
  - A Reference overview table listing every option/method covered on the page (see Reference page).
- Do not use a table for a simple enumeration, a single description column, or a conceptual explanation.
- For **parameter/flag tables**, use this column order: Parameter, Description, Type, Optional, Default.



### Numbered vs. bulleted lists

- Use `-` as the bullet marker for bulleted lists.
- **Numbered** for ordered procedures (steps that must happen in sequence).
- **Bulleted** for options, sets, and non-ordered enumerations.
- Use the `a)` `b)` `c)` subheading pattern for **parallel sibling alternatives** where the reader picks one path (as in "Create a Context Group" → a) multiple projects, b) current project, c) import/export). Good candidates: alternative setup flows, key scopes, trigger options.



## Naming and terminology



### General Translation vs. GT

- Always write **General Translation** (singular) — never "General Translations". The API is the **General Translation API**, not "General Translations API".
- Use **General Translation** when the page needs to identify the overall product, distinguish it from another service, or name an official term such as the **General Translation API**. Do not force the name into every page or `description`; the section title, sidebar, package name, or feature name often supplies enough context.
- **Do not repeat the product or package name when the surrounding section already establishes it.** In page descriptions and opening sentences, omit **General Translation**, `gt-react`, `gt-next`, and similar ownership labels when the section, page title, sidebar, or reference grouping already supplies that context. Start with the reader action or API behavior instead.
- Do not prefix every product-owned feature with the brand. Prefer **the CLI**, **the Dashboard**, **the integration**, **Ask AI**, **Context Groups**, or the package name over "the General Translation CLI/tool/integration/Ask AI" once the subject is clear.
- Remove redundant branding, not meaning. Keep ordinary words such as "translation," "translations," "translate," and "translation workflow" when they explain what the reader is doing.
- Configuration pages should name the thing being configured. Keep **General Translation**, `gt`, or the relevant package name when it distinguishes the configuration from the third-party platform's own settings.
- Do not mechanically remove the product name from `meta.json` descriptions, section overviews, hubs, or card grids. These standalone navigation surfaces may need ownership context that a Guide page already gets from its title and surrounding section.
- Treat the `description` and opening paragraph as one rendered introduction. If one names General Translation, the other should normally use the capability name or a pronoun instead of naming it again.
- If you use **GT** as an abbreviation, first write **General Translation** on that page. Never use **GT** only to avoid a repeated product name; rewrite the sentence around the capability instead.



### Product and term casing

Always capitalize these as product terms: **Dashboard**, **Locadex**, **Core**, **Google Drive**, **Project** (and **Projects**), **Context Group** (and **Context Groups**), **Glossary**, **Custom Prompt** (and **Custom Prompts**), and **Autoderive** (the CLI feature). Also capitalize the product scopes **Organization** and **Enterprise**, and **GitHub**. Lowercase "group" when they are not part of the proper term.

*Note: capitalize **Autoderive** only when referring to the feature in prose; the* `gt.config.json` *key stays lowercase in code as* `autoderive`*. Do not write "General Translation Autoderive" — the feature name stands on its own.*

Always refer to a **product name in the singular**, never plural: "General Translation" (not "General Translations"), "the Dashboard" (not "Dashboards"). Countable objects such as Projects and Context Groups may still be pluralized.

Do not use the **plural of "product"** in reference to the General Translation product itself — no "products", "product suite", or "product line" (it is one full-stack product). *Exception:* other companies' products can take the plural (e.g. "the world's best products should be available to the whole world").

Capitalize the scope noun even inside hyphenated compounds (Organization-level, Project-wide, Project-scoped, Project-specific). Keep it lowercase only inside code, URLs, permission strings (`project:files:read`), headers (`x-gt-project-id`), and identifiers (`projectId`, `GT_PROJECT_ID`).

### Product and technology names

Use the official capitalization and spelling for third-party names: **Next.js**, **TypeScript**, **JavaScript**, **ESLint**, **React Native**, **Node.js**. For GT itself: **General Translation**, **Quickstart** (one word, not "Quick Start").

- **Package names always appear in backticks in prose**: `gt-next`, `gt-react`, `gt`, `generaltranslation`. The same applies to config files like `gt.config.json`.



### Word choices

- Prefer **"Core library,"** not "Core API" — unless you are specifically referring to a class or method API.
- Use **"call a method"** (not "invoke"/"run" a method).
- Use **"agent which,"** not "agent that."
- Use lowercase **"command"** in sentences; capitalize only exact UI labels (e.g. **Pre-process Command**).



### Grammar and usage

- **Verb vs. noun forms:** "set **up** your Project" (verb) but "the **setup** wizard" (noun); "**check out** the docs" but "the **checkout** page"; "**log in**" but "the **login** page".
- Write **"inline"** as one word (never "in-line").
- **Articles** follow sound, not spelling: "an HTML element", "an LLM", "an API key"; but "a URL", "a user".
- Treat **"data" as singular**: "the data is stored", not "the data are stored".
- Use the **Oxford comma** in a series: "supports `<Currency>`, `<DateTime>`, and `<Num>`".
- A comma after **"i.e." / "e.g."** is optional; be consistent within a file.
- Place **commas and periods inside quotation marks**: `the "require a pull request before merging," rule`; `set the trigger to "On commit."`
- Write **"pull request" in lowercase** in prose; capitalize only the abbreviation **PR** (and **PRs**).
- **Hyphenate compound modifiers before a noun, not standalone nouns:**
  - **full-stack** (modifier) vs. **full stack** (noun): "full-stack localization", but "we own the full stack".
  - **open-source** (modifier) vs. **open source** (noun): "open-source libraries", but "the ethos of open source".
- **Hyphenate other compound modifiers** before a noun: "AI-native", "context-aware", "developer-first".



## Information architecture

Treat General Translation as **one full-stack product**, not a collection of separate products. Every top-level area of the docs is a **capability of that single product**, so keep terminology, structure, and voice consistent across all of them.

### Major docs sections

The docs have these top-level sections, in this order:

1. **Overview** — product-level: **Introduction**, **Key Concepts**, and **For coding agents**. Overview also acts as a landing hub (see Overview hub).
2. **Platform** — the Dashboard, Locadex, OpenAPI, and Core capabilities.
3. **CLI**
4. **React** — the React ecosystem SDKs (`gt-react`, `gt-next`, TanStack Start, and `gt-react-native`) and the React Core linter, folded into **one multi-framework section** (see React section (multi-framework)).
5. **Vue** — the unstable 0.x `gt-vue` runtime for Vue 3.
6. **Node**
7. **Python**
8. **Integrations** — plugins for third-party content platforms (for example, Sanity, Storyblok, and Google Drive).

Some sections are **multi-part**: they group several capabilities, and *each* capability carries its own **Get Started/Quickstart → Guides → Reference** spine (Platform groups Dashboard, Locadex, OpenAPI, and Core; Integrations groups one plugin per integration). **CLI, Vue, Node, and Python** are **single-part**: the section itself is directly **Quickstart → Guides → Reference**. **React** is a **multi-framework** section: it covers several closely-related frameworks that share one API, so it uses a **Get Started (Overview + one Quickstart per framework) → shared Guides → shared Reference → per-framework folders** shape (see React section (multi-framework)). **Overview** has its own shape (**Introduction → Key Concepts → For coding agents**).

### The three-section spine

Every capability follows the same spine:

- **Get Started / Quickstart** — orients the reader and gives the fastest path to first success. Product/nontechnical capabilities use **Get started**; technical libraries and APIs use **Quickstart** (see Get Started vs. Quickstart, and File and folder naming).
- **Guides** — practical, customer-facing workflows; one self-contained, action-oriented page per task. How-to guide.
- **Reference** — complete, standardized, scannable descriptions of exactly how something works.

Structure: **Section > (Capability) > Pages**, where Reference pages may be grouped into **subsections**.

The **exact per-page structure** for each of these types is defined in Page structure; this section covers only how the docs are organized at a high-level.

### React section (multi-framework)

The **React** section documents several frameworks that share one API — `gt-react` (React SPAs), `gt-next` (Next.js), TanStack Start, and `gt-react-native` — plus the React Core linter. Because the components, hooks, and functions are (mostly) identical across them, do **not** split these into separate top-level sections; fold them into one React section shaped like this:

- **Get Started** (folder). One **Overview** page plus **one Quickstart page per meaningfully different framework**. The Overview orients the reader (what the ecosystem is, shared concepts, how to pick a framework) and links to the quickstarts. Each quickstart is titled **"[Framework] Quickstart"** — **React Quickstart**, **Next.js Quickstart**, **TanStack Start Quickstart**, **React Native Quickstart** — with the file named for the framework (`get-started/react.md`, `get-started/nextjs.md`, `get-started/tanstack-start.md`, `get-started/react-native.md`) and the Overview at `get-started/overview.md`. Only give a framework its own quickstart when its setup path is genuinely different; if two frameworks install and initialize identically, use tabs on one page instead.
- **Guides** and **Reference** are **shared across all frameworks**. Write one page per task/symbol, and show the per-framework implementation differences with **tabs**, not duplicate pages. Use this exact tab order where frameworks differ: `<Tabs items={['React', 'Next.js', 'TanStack Start', 'React Native']}>`. When a symbol or behavior is unavailable in a framework, say so with an italicized *Note:* (for example, server-only functions are Next.js-only). When a symbol is identical everywhere, no tabs are needed.
- **Framework-specific pages** — anything that only applies to one framework (for example, Next.js server components, middleware, the config plugin, and localized `<Link>`; React Native's native plugin/setup; TanStack Start's server setup) lives in a **folder named for that framework**, and those framework folders are grouped under a single `(frameworks)` **route group** at the section root (`react/(frameworks)/nextjs`, `.../react-native`, `.../tanstack-start`). A **route group** is a folder wrapped in parentheses: it groups pages under one sidebar heading (displayed here as **Frameworks**) **without adding a URL segment**, so the parenthesized folder disappears from the link. Folder display names use the framework's official spelling; link slugs stay lowercase-hyphenated and omit the route group (`/docs/react/nextjs/...`, `/docs/react/react-native/...`, `/docs/react/tanstack-start/...`).
- **Linter.** Fold the React Core linter (ESLint plugin and its rules) into the shared Guides (a *Lint your code* guide) and Reference (a lint-rules page), with tabs for the per-framework ESLint config where it differs.

This is the one **exception** to the single-part "section landing page is the Quickstart" rule: the React section landing is the **Get Started → Overview** page. Keep terminology, examples, and page order consistent across the framework tabs.

### Filetree (`meta.json`)

The filetree is defined by **per-folder** `meta.json` **files** (the Fumadocs convention), not a single root `filetree.json`. Every section and subsection folder has a `meta.json` that sets its display name and the order of its pages. When you add, remove, or reorder pages in *any* section, update the relevant folder's `meta.json` (and confirm the structure with the user before writing a new section's pages).

A `meta.json` supports these keys:

- `title` — the folder's sidebar display name using its established casing (see File and folder naming).
- `description` — the meaning depends on the folder:
  - **On top-level section roots (**`"root": true`**)** it is a very short **tab subtitle** shown under the section name in the nav — a few words or a package name, **not a full sentence**, and it does not need to spell out "General Translation." *Examples:* CLI = `gt`, Overview = `Quickstarts`, React = `Next.js, TanStack & more`, Python = `Flask, FastAPI`.
  - **On subsection folders** (`guides`, `reference`, `commands`, …) it is a one-line summary of the folder ending with a period, like every description (these folders have no landing page, so it is not rendered as page content). The short tab subtitles on section roots above are the only `description` values that omit the period.
- `pages` — the ordered list of entries; **this array is the source of truth for page order**.
- `icon` — a named icon token (e.g. `Terminal`, `React`, `Python`, `Globe`) shown next to the section in the nav. Set it only on the top-level section roots.
- `root` — set `"root": true` on the eight top-level sections only; it marks the folder as a navigable section root.
- `defaultOpen` — optional flag controlling whether the folder starts expanded in the sidebar.

Entries in `pages` take three forms:

- **A child page or folder** — a relative reference: `"./quickstart"`, `"./guides"`, `"./(frameworks)"`.
- **A section separator** — a label wrapped in triple dashes: `"---Frameworks---"`, `"---Platform---"`. This renders a labeled divider in the sidebar; use it to group entries within one section.
- **A cross-section link** — a Markdown link to another page: `"[Dashboard](/docs/platform/dashboard/get-started)"`. Use these to point out of the current section (see Overview hub).

Every immediate child folder listed by a top-level section root becomes a visible sidebar section. The allowed section names and order are pinned by CI. Do not add, remove, or reorder one unless the task explicitly calls for an information-architecture change.



### Overview hub

The **overview** section doubles as a **landing hub**: its `meta.json` lists the overview pages (introduction, key concepts, for coding agents) directly, then uses separators (`---Frameworks---`, `---Platform---`) with **cross-section link entries** to surface the main frameworks and Platform capabilities without duplicating their content. Include every published Platform capability and integration section, keep those links in sync with the sections they point to, and only link pages that exist. The structure validator enforces this coverage.

### Machine-readable outputs

The publishing app generates two machine-readable maps from the docs source:

- `llms.txt` — an [llmstxt.org](https://llmstxt.org/)-style index for LLMs and agents, grouped by section.
- `sitemap.xml` — the standard sitemap for every published page, including localized docs URLs.

Do not add hand-written copies to this repository. When you add, rename, remove, or reorder pages, keep the `meta.json` filetree valid so the publishing app generates current output. **Only include pages that actually exist** — omit in-progress sections and manifest-only stubs, and keep every link resolvable.

### Agent-navigable by default

Beyond the two maps above, the docs follow these agent best practices so an agent can consume them without scraping HTML. Keep them in place and current:

- **Raw Markdown for every page.** Every page is available as raw Markdown by appending `.md` to its URL. Never remove this affordance, and link to the logical page path in prose (the build serves the `.md` variant).

Document these entry points for developers on the **Overview → For coding agents** page (see For coding agents page).

### Drop-in AGENTS.md guide

Embed a copyable `AGENTS.md` guide on the **For coding agents** page, aimed at the **coding agents of developers who use General Translation** — *not* at agents editing this docs repo. A developer drops its contents into their own project so their agent knows how to add and run General Translation correctly. Keep it self-contained, imperative, and short enough to fit an agent's context window.

Structure it in this order:

1. **What General Translation is** — one or two sentences, plus which package or tool fits the reader's stack (`gt-next`, `gt-react`, `gt-vue`, `gt-node`, the CLI, and so on).
2. **Setup** — install the right package, create `gt.config.json`, and set the API key environment variables.
3. **Core usage** — the canonical patterns the agent should follow (for example, wrap user-facing strings in `<T>`, use `useGT()` for dynamic strings, keep locale configuration in one place). Show minimal, commented code.
4. **Commands** — a short cheat-sheet of the CLI commands the agent will run (`npx gt configure`, `npx gt translate`, and so on) and when to run each.
5. **Rules — do and don't** — explicit guardrails: what to always do (wrap new copy, run `gt translate` before committing) and what never to do (hardcode translated strings, hand-edit generated translation files).
6. **Links** — point to `llms.txt`, `sitemap.xml`, and the most useful pages for deeper detail.

Document only capabilities that exist, and resolve anything uncertain against the codebase (see Source of truth and best judgement). This file is written by an agent connected to the product codebase; this guide defines its **shape**, not its exact contents.

### Get Started vs. Quickstart

The entry page for a capability is named for its audience:

- **Technical libraries and APIs use** `quickstart.md`**.** Quickstart is the developer-facing tone: install the library or SDK, authenticate, and run the first call. This applies to Core, CLI, React, Vue, Node, Python, Locadex, and integration plugins.
- **The OpenAPI section uses** `overview.md` **(titled "Overview").** The public API is documented as a reference surface rather than an install path, so its entry page orients the reader to base URLs, authentication, versioning, and errors instead of a numbered install flow.
- **Product/nontechnical capabilities use** `get-started.md`**.** Get Started is the setup-and-orientation tone for product pieces, not a developer install path. This applies to the **Dashboard** and the **Overview** section (whose entry page is `get-started.md` but displays as **Introduction**).

Shape the entry page itself:

- **Default to a single condensed entry page** placed directly in the capability folder: open with what it does and when to use it, then include the steps on the same page (a **Quickstart** for technical capabilities; **Key workflows/Configuration/Navigation** for product capabilities).
- **For single-part sections (CLI, Vue, Node, Python), the section landing page is the Quickstart itself** (`quickstart.md` at the section root); there is no separate section index page.
- **The React section is the exception:** it is multi-framework, so its landing page is **Get Started → Overview**, followed by one **[Framework] Quickstart** per framework (see React section (multi-framework)).
- **Split into a Get Started section with separate Overview and Quickstart pages only when** the capability needs substantial conceptual grounding before a reader can act — concepts, architecture, or a mental model that would overwhelm a single page (typical of larger frameworks). Small libraries, single APIs, and the current Platform capabilities do not need a split.
  - When split: **Overview** covers what it is, why, when to use it, and the core concepts; **Quickstart** is the numbered path to first success.
  - The folder then displays as **Get Started** and its link/URL slug is `get-started` (see File and folder naming).



### Guides vs. Reference

Both sections exist on every capability of the product, but they answer different questions:

Use **Guides** for practical, customer-facing workflows. A guide should help someone complete a task, understand when to use a feature, and make good decisions along the way. Guides can include light conceptual explanation, but only when it helps the user act.

Use **Reference** for complete, standardized descriptions of how something works. A reference page should define options, fields, permissions, APIs, settings, limits, and behavior precisely. Reference pages do not need to persuade or teach a workflow; they should be easy to scan when someone already knows what they are looking for.

In short:

- **Guides answer "How do I do this?"** They are practical and customer-sendable. Titles use the **gerund (-ing) form** (*Configuring Locadex automations*, *Reviewing and editing translations*, *Translating content*, *Querying translations*), and steps run in order toward a goal. The file name and link slug follow the gerund title (*Using translations* → `using-translations.md`).
- **Reference answers "What exactly does this setting / command / API / page do?"** Reference pages are exact, standardized, and comprehensive within a consistent structure; they can read more "robotic" than guides.

Scope guides by outcome, not by surface area:

- **Name guides by the outcome the reader achieves, never one-per-command or one-per-function.** Fold several related commands or functions into a single workflow guide (for example, `upload` + `enqueue` + `download` + `stage` + `save-local` → one *Managing translations* guide) and keep the exhaustive per-command flags in Reference.
- **Only add a "Configure the [capability]" guide when it covers materially more than the Quickstart** — multiple setup paths, locales, file selection, storage choices, or credentials. If it would restate the Quickstart, omit it and let the Reference configuration page carry the detail.
- **Do not create a standalone FAQs page.** FAQs may appear as a section on a Get Started or overview page; otherwise individual questions belong inside the relevant guide.

The exact page structure for each type is specified in Page structure.

### Ordering (the filetree is the source of truth)

Guides and Reference pages follow a **logical order** — usually the sequence in which a reader does or encounters them, not alphabetical. Ordering is meaningful and deliberate.

- **The filetree is the source of truth for order.** Each folder's `meta.json` `pages` array is the canonical order. Set and change page order there; the sidebar navigation follows it.
- Order Guides along the natural workflow, and order Reference from setup outward.
- **Single-part technical sections (CLI, Vue, Node, Python) share one Reference spine:** Configuration → Commands or API → File formats, where applicable, with one page per command, function, format, or config area. Order commands from setup outward (`init`/`setup`/`configure`/`auth` → `translate` → the CI building blocks → `generate`/`validate`).
- *Examples:*
  - **Dashboard Guides:** generating context → reviewing and editing translations → adding annotations.
  - **CLI Guides:** configuring the CLI (`configuring-cli.md`) → generating translations → managing translations → tracking by branch → …
  - **CLI Reference:** Configuration → Commands → File Formats.



### Section landing pages

- **Guides and Reference folders do not have an** `index` **landing page.** The folder is a sidebar grouping only; its pages are listed directly in `meta.json` and the reader reaches them from the sidebar. Do not add `guides/index.md` or `reference/index.md` (with a `<Cards>` grid or otherwise) — those pages are not served, so a link to the bare `/docs/<section>/guides` or `/docs/<section>/reference` path does not resolve; link to a specific child page instead.
- Landing pages otherwise appear only where a folder's `meta.json` points to a real page — a section-root Quickstart/Get Started/Introduction, or a hub page such as `platform/index.md`. The sidebar navigation, driven by `meta.json`, determines each section's structure and entry points.
- Get Started is a single page, so it does not need a separate index.



## Files and frontmatter



### File format

- **Generated/draft docs are authored as** `.md`**.** For production they will and should be converted to `**.mdx` (Markdown with JSX support), UTF-8, with LF line endings. MDX is what enables the shared components (`<Tabs>`, `<Callout>`, `<Files>`, `<Accordion>`, `<Cards>`) used across the docs. Where this guide says `.md`, read it as `.mdx` once published.
- `docs-templates/` **is deprecated.** The refactored pages under `docs/en-US/`** are authored by hand — none carry an `{/* AUTO-GENERATED … */}` marker, and no build step regenerates them from templates. Do **not** edit `docs-templates/` expecting a regeneration to flow into the published docs, and do not treat any docs page as generated. Edit the published `.mdx` page directly. The old template workflow (fix the template first, then regenerate, using `__DOCS_PATH__`/`__PACKAGE_NAME__`/`__FRAMEWORK_NAME__` placeholders) no longer applies.



### File and folder naming

- **General principle:** name a file for its topic using the **fewest words that stay clear and self-explanatory** when read on their own (in a URL or the sidebar), together with the folder for context. Lowercase, hyphenated, **usually three words or fewer** — never padded, and never truncated to a cryptic stub (`edit-translations.md`, `configure-automations.md`, `vm-image.md`).
- **Keep a single word only when it is standard or unambiguous in its folder** (`config.md`, `quickstart.md`, `webhooks.md`; `automations.md` under Locadex Reference clearly reads as Locadex Automations). **Expand a vague single word** into two or three words that say what the page actually covers (`translation-context.md`, not `context.md`; `locale-codes.md`, not `locales.md`).
- Name reference and conceptual pages by topic, not verb phrase (`monorepos.md`, `annotations.md`). **Guides are the exception:** their file name and link slug use the **gerund (-ing) form** matching the guide title (`using-translations.md`, `configuring-automations.md`, `translating-content.md`).
- **The entry page is** `quickstart.md` **for technical capabilities and** `get-started.md` **for product/nontechnical ones** (see Get Started vs. Quickstart). Core, CLI, React, Vue, Node, Python, Locadex, and integration plugins use `quickstart.md`; OpenAPI uses `overview.md`; Dashboard and Overview use `get-started.md` (Overview displays as **Introduction**).
- **Configuration reference pages are named and linked simply** `config.md` in most cases (not `configuration.md` or `config-reference.md`).
- **Command reference pages are named by the command**, lowercase-hyphenated, matching the invoked subcommand (`translate.md`, `save-local.md`, `keyed-metadata.md`).
- **Consolidate near-identical formats or variants onto one page** (MDX + Markdown → `mdx.md`; TypeScript + JavaScript → `ts.md`). Name the page after the primary variant and cover the sibling on the same page.
- **Sidebar display names follow the established casing in their section.** Standard spine labels include **Overview**, **Get Started**, **Quickstart**, **Guides**, **Reference**, and **Frameworks**. Reference subsection labels display as **Commands**, **File formats**, **Functions**, **Components**, **Hooks**, and **Types**. Automated style passes must preserve these labels instead of deriving them by lowercasing the folder name.
- **Proper nouns and product/brand names keep their official casing** as display titles: `CLI`, `React`, `Vue`, `Next.js`, `Node.js`, `Python`, `Dashboard`, `Locadex`, `Core`, `OpenAPI`, `Google Drive`, `React Native`, `TanStack Start`, and the `GT Class` reference group.
- **Links, filesystem folder names, and URL slugs remain lowercase and hyphenated**, regardless of display-name casing. *Example: the Get Started section is linked as* `/docs/platform/dashboard/get-started`*.*



### Frontmatter

Use this exact structure (blank line after the opening `---`, blank line before the closing `---`):

```text
---

title: Adding annotations
description: How to use labels, notes, and comments to coordinate translation review by entry and locale in the Dashboard.

---
```

- **Frontmatter is YAML, not plain prose.** Parse every touched page after bulk frontmatter edits. Quote or rewrite scalar values containing YAML-significant punctuation, especially a colon followed by a space (`: `), a leading special character, or an inline `#`; visual inspection and a successful Markdown render are not sufficient.
- `title`: **sentence case** — capitalize only the first word, except proper/product names (Dashboard, Locadex, Core, Organization, Project, Enterprise, Context Group, Glossary, Custom Prompts, GitHub). No trailing spaces. The docs layout renders this value as the page H1, so do not repeat it as a `#` heading in the body.
- **React component reference titles use JSX syntax.** Quote the complete tag in frontmatter (`title: "<T>"`) so the page title and sidebar display `<T>`, not `T`.
- `description`: no backticks, and **end with a period** (a question ends with `?` instead) — the description is used verbatim as the HTML meta description and in machine-readable indexes (`llms.txt`), where backticks render as literal characters. Refer to a component by its angle-bracket tag with no backticks (`<T>`, `<Plural>`), not the bare word; where the same description appears in a `<Card>` body, escape the tag as `<T>` so the MDX still parses. Name the relevant capability directly; do not add **General Translation** when the section, title, or feature name already makes ownership clear. If the product name is genuinely needed, spell out **General Translation**, never GT. Phrasing depends on page type:
  - **Guides** lead with **"How to…"** for SEO. Write **one concise sentence** that states what the reader will accomplish and names the relevant capability or tool without automatically branding it. Add enough scope to distinguish the description from the title, but **do not** restate the title, enumerate every subsection, or append a `: this guide covers …` checklist. For a guide that explains a concept rather than a task, use a question instead. *Examples:* "How to upload, translate, and download files with the generaltranslation library." / "How to review translations, make manual edits, and compare locales in the Dashboard." / "What are locale codes, and how are they used across the translation stack?"
    - **Configuration Guides:** retain `gt`, the package name, or **General Translation** when it identifies which system's configuration the reader is changing. *Example:* "How to configure the General Translation gt-sanity plugin for locales, document filters, and credentials."
  - **Other pages** (Quickstart, Get Started, hubs) use one action-oriented sentence ending with a period ("Configure…", "Review…", "Learn…").
- **Reference pages** add a second sentence naming what the page documents. Choose the lead by page type:
  - **API/library reference** (a function, method, type, command, or endpoint) uses `API reference for [function/method/type]` — including OpenAPI endpoints. *Example: "…into a target locale. API reference for translateField."*
    - **React components:** name the JSX tag directly (`API reference for the <T> component.`).
  - **Non-API reference** (a settings page, config area, file format, or other non-API surface) uses `Reference for [topic]` — do not start the sentence with "API reference". *Example: "…across every locale. Reference for supported file formats."*

A few optional fields appear on specific page types:

- `related.links` (optional): a YAML list of root-relative `/docs/...` paths that feed the global related-pages template rendered at the bottom of the page (see No next-steps sections). This is the **only** way to author related links — never write a manual roundup section. List logical page paths (no `.md`/`.mdx`), most relevant first, and verify each target exists. For how many links and which ones by page type, see [Choosing `related.links`](#choosing-relatedlinks).
  ```yaml
  related:
    links:
      - /docs/cli/quickstart
      - /docs/react/reference/functions/load-translations
  ```
- `navTitle` (optional): a shorter sidebar/nav label for when the full `title` is too long for the sidebar. The `title` remains the page H1; `navTitle` overrides only the sidebar label. *Example: a page with* `title: Get started with the Dashboard` *sets* `navTitle: "Get started"`*.* Use it sparingly and keep it consistent with the section's other nav labels.
- `method` (OpenAPI endpoint pages only): the HTTP verb (`GET`, `POST`, `PUT`, `DELETE`, …) rendered as a badge on API-endpoint reference pages. Set it on every OpenAPI endpoint page; omit it everywhere else.



## Page structure

1. **Frontmatter title:** the docs layout renders the `title` as the page H1. Do not add a `#` heading to the body.
2. **Intro:** 1–3 short sentences with no heading that add substance beyond the `description`: behavior, inputs, or when to use it. The docs layout already renders the `description` beneath the title, so the intro must not restate or paraphrase it. Read the title, description, and intro together and remove repeated branding as well as repeated meaning; after the capability is established, use its short name, "the integration," "the CLI," or another natural subject. On reference pages especially, do not open with the description's summary sentence. Optionally one more italicized short line for constraints or scope.
3. **Sections:** use `##` for top-level body sections.



### Heading hierarchy

- **H2 (**`##`**)** for top-level sections, **H3 (**`###`**)** for subsections, **H4 (**`####`**)** only when a third level is genuinely needed.
- **Prefer a few larger sections over many small ones.** Group related material under a small number of meaningful H2s, using H3 (and sparingly H4) subsections. If several candidate H2s are all facets of one topic, make them H3s under a single H2 instead of a long flat list of H2s.
- **Do not skip heading levels** (do not jump from `##` to `####`).
- Headings are **sentence case** (see Voice and formatting).
- **Step-by-step sections** use numbered H3 headings (`### 1. Install`) nested under a single H2 for that section — on a Quickstart page the steps live under a `## Quickstart [#quickstart]` H2 (our Get Started convention). Do not use numbered H2s for steps.
- **Custom anchors** for stable linking apply only to files under `docs/`: append `[#anchor]` to **every H2 heading only** (not H3 or H4) so links do not break when the title changes. Use a **concise, meaningful slug** (lowercase, hyphenated, **3 words maximum**) — a short form of the heading rather than its full kebab-case. Use normal Markdown headings without `[#anchor]` suffixes in `blog/` and `devlog/`.

```text
## Using variables [#variables]
```

Link to it with the anchor: `/docs/platform/core/guides/translate-string#variables`. For same-page references, link to the anchor directly (`[Context priority](#priority)`) instead of writing "see the section below".

### Get Started / Quickstart page

The entry page orients the reader and gives them a fast path to first success. Shape it to the capability (see Get Started vs. Quickstart for which name to use):

- **Product/nontechnical capabilities (**`get-started.md`**: Dashboard, Locadex, Overview).** Lead with orientation, not code. Dashboard-style: **Key workflows** → **Configuration** → **Navigation** → **FAQs**. Locadex-style: **How [product] works** → numbered setup steps.
- **Technical capabilities (**`quickstart.md`**: Core, CLI, React, Vue, Node, Python, OpenAPI, integration plugins).** The page title is **Quickstart**. Open with what the library/API does and when to use it, then put the numbered path to first success (install → authenticate → first call) under a dedicated `## Quickstart [#quickstart]` H2 with `### 1. …` steps — title that section **Quickstart**, not "Translate your first app" or similar. Precede the steps with a short paragraph so the reader has context before acting. If there are concrete prerequisites (minimum runtime/library versions, supported platforms, required accounts or keys), list them explicitly up front — a short **Requirements** or **Before you start** section, or a `Note` callout for a single version floor.
- Do not add a separate conceptual overview page (unless the section is split per Information architecture) or a "Next steps" section (see No next-steps sections).



### For coding agents page

The **Overview → For coding agents** page (slug `for-coding-agents`) is the single page explaining how to use AI coding agents and LLMs with General Translation. Keep it to **one page** — do not spread it across a section. Write it for developers who work with agents such as Cursor, Claude Code, and Copilot.

Cover, in this order (drop any part that does not yet exist rather than inventing it):

1. **Intro** — one or two sentences on why General Translation is built to be agent- and LLM-friendly (open-source libraries, predictable configuration, machine-readable docs).
2. **Drop-in agent guide** — the full agent guide (what to use, setup, core usage, commands, do/don't, links) embedded in a **single copyable code block** so a developer can paste it straight into their project's `AGENTS.md`, `CLAUDE.md`, or tool instructions. Use a fenced block with a `title="AGENTS.md"` and a wider outer fence (four backticks) so the guide's own inner code fences render as literal text.
3. **Point agents at the docs** — link the machine-readable entry points (`llms.txt` and `sitemap.xml`) and show how to add the docs as context in an agent.
4. **MCP server and agent skills** — if a General Translation MCP server or agent skill exists, show how to install and use it; otherwise omit this part.
5. **Editor-specific tips** — short, parallel bullets for the common agents (Cursor, Claude Code, Copilot), only where the guidance genuinely differs. Use tabs when the shape is identical (see Code blocks).
6. **Best practices** — a short decision list of what to hand an agent versus what to verify by hand (for example, let it wire up `<T>` components, but always review generated translation context and locale configuration).

Only document capabilities that actually exist, and resolve anything uncertain against the codebase (see Source of truth and best judgement).

### Common workflow sections

A "common workflow" section is a bulleted roundup that points readers to the main tasks or settings from a landing page (as in the Dashboard get-started **Key workflows** and **Configuration** lists). Each bullet starts with the action, then a short description, then a link:

```text
- **Define context and key terms for translation:** use Context Groups to guide terminology and style across Projects. See [Defining context for translations](/docs/platform/dashboard/guides/defining-context-for-translations).
```

Use common workflow sections on **Get Started pages and other overview/landing pages** to surface the primary tasks, instead of duplicating full how-tos inline. Do not use them mid-guide, where ordered steps belong.

### Guide page

Guides are **actionable**: they walk the reader through completing one task, in order. Give them **gerund (-ing) titles** that are easy to understand (*Configuring Locadex automations*, *Translating content*), and name the file and link slug to match the title (`configuring-automations.md`, `translating-content.md`).

Anatomy:

1. **Intro** (1–3 sentences): what you will accomplish and when to use this guide.
2. Optional **Before you start**: prerequisites such as access, keys, or installed tools. Use the heading **Before you start** (not "Prerequisites").
3. (For product pages) Optional **Basic [x] workflow** numbered list: the shortest happy path, end to end, so a reader can succeed without reading the whole page.
4. Detailed task sections (`##`): one section per sub-task, each with ordered steps. Name the exact buttons and pages in **bold**. Titles must be understandable and actionable.
5. Optional **What to use and when**: when a task offers two or more valid approaches, add a short decision list contrasting them (each bullet: the option in **bold**, then when to choose it) so the reader can pick quickly. Model this on the Next.js "What to use and when" bullets.

**Link named API details precisely.** When a Guide names a public prop, option, field, or parameter and the Reference documents that same public surface, link to its exact anchor rather than only the parent page. Require semantic API identity, not only a shared name: do not link a returned callback, framework wrapper, or package-specific field to a different standalone function, prop, or method. When no exact matching surface exists, leave the name unlinked or link the containing API with wording that makes the relationship clear.

*Example happy-path workflow (from the context guide):*

```text
## Basic context workflow

1. Open your Organization in the Dashboard.
2. Go to the **Context** page.
3. Create a **Context Group**.
4. Add a **Glossary** (for terminology) and/or **Custom Prompts** (for style and tone).
5. **Assign** your Context Group to relevant Project(s).
6. Generate translations or apply updates to existing translations.
```

Use the `a)` `b)` `c)` sub-section pattern for parallel alternative paths (see Numbered vs. bulleted lists).

**Integrations and plugins:** match the depth to the setup surface. Developer plugins can use technical commands and configuration; Dashboard-managed integrations such as Google Drive use plain-language UI actions for nontechnical readers.

Keep an integration Quickstart focused on the shortest successful path, usually three to five numbered steps. Make the primary flow easy to scan without deleting details that affect access, cost, or results:

- Keep role-specific and one-time setup out of the main sequence. Put provisioning, connection setup, and secondary prerequisites for any role in a `Note` callout immediately after the relevant step. Start with the exact current role in bold — for example, **Organization admins:**, **Developers:**, or **Editors:** — then state only the actions that role must take.
- Preserve critical granularity when simplifying. Required permissions and plan features, authorization scope, billing effects, update and replacement behavior, limits, and failure modes must remain in the relevant Guide or Reference page. Move them into a concise callout or a clearly named section instead of dropping them.
- Keep Guides task-oriented and written for the person using the integration. Explain secondary button states and edge behavior next to the step where readers encounter them, without interrupting the happy path.
- Keep Reference pages complete. Concise wording does not justify removing permissions, supported content, access behavior, defaults, limits, or failure behavior.

Use a consistent set of Guides where possible, in this order:

- Configuring [integration]
- Translating content
- Managing translations
- Querying translations *or* Using translated content



### Reference page

Reference pages are **comprehensive, exact lookups** for a **technical audience**: cover every field, option, parameter, permission, command, flag, limit, error, and setting for the topic — including defaults and behavior — within a clear, predictable structure. **This is the one place to favor completeness over brevity.** The conciseness rule still governs *wording*, but never drop options, flags, edge cases, or defaults just to keep a page short. When in doubt here, document more. This is the exception to the general "keep it short" guidance that applies elsewhere in the docs.

- **Write for developers.** Assume familiarity with the terminal, code, and the relevant language or framework; do not simplify away technical detail or restate basics covered in the Quickstart.
- **Place scope notes where they apply.** Keep API availability and framework scope near the intro. Put package, language, or framework context that only explains sample code immediately after the **Examples** heading, or directly before the first example code block it qualifies when the page has no Examples section.
- **Document external-standard options locally.** When a public API accepts options from an external standard such as `Intl`, document the commonly used and currently supported fields, accepted values, defaults, and important constraints on the Reference page. Retain a link to the upstream standard as the source for future additions and runtime updates; do not make readers leave the page to discover basic options.
- **Lead with an overview table** that lists every item covered on the page (option, method, field, command, flag, endpoint), and **link each item name to its section on the same page** so a reader can jump straight to it. Model this on the Sanity plugin reference and the Next.js `generateMetadata` reference. For parameter/flag tables, use the column order Name, Description, Type, Optional, Default (see Lists vs. tables). This overview table replaces a separate bullet "table of contents".
- **The overview table is for navigation and scanning only — it never replaces the detailed sections.** Every reference page still needs its full per-item sections *below* the table (each with an example, expected output, behavior, and notes). A page that is only a table is not finished.
- **Then one section per item** (`##`, optionally grouped into subsections), in the **same order as the table**. **Each section must stand on its own:** the overview table is high-level navigation, but the reader should get *everything* about that item from its own section without going back to the table. Lead each section with a compact attribute line restating the item's key facts (for a field or parameter: **Type**, **Optional**/**Required**, and **Default** — the same values as its table row, in the format shown below), then give the full description, accepted values, side effects, error/permission behavior, and an example. Do not leave the type or default *only* in the table. Keep entries parallel in shape.
- **Group large reference sets into labeled tables** under H2/H3 headings. Always label every table column — never leave header cells blank.
- **Keep the comments when you show code.** Preserve the `// ...` comments from real examples — especially those in the existing docs — because they carry intent that a bare snippet loses. Prefer pulling a complete, commented example over paraphrasing one.

**Section titles must read for a technical audience.** Never use **"What it does"** — use **How it works**. Never use **"What it creates"** — use a precise, technical title such as **Outputs**, **Returns**, or **Generated files**.

**Page shape (general default, not binding).** Adapt per item, but default to this order and include every part that applies:

1. **Overview** — a short intro of what the item is and when to use it, with the **usage/signature block inline** in this section (do not add a separate "Usage" section). Include a *typical workflow* here when one exists.
2. **How it works** — behavior, resolution order, side effects, and the internals a developer needs.
3. **Flags** / **Options** / **Parameters** — document **every** flag or option, not just the common ones, in a table (columns: Name, Description, Type, Optional, Default). Group large sets into H3 subsections (for example, *Source-scanning flags*, *Experimental flags*).
4. **Example** — a runnable example, with its comments; include one whenever one is available. For configuration and field references, pair the input with its result (for example, a config snippet and the file or HTTP response it produces) using an `Output` title or `// Before` / `// After` comments, as the Next.js metadata reference pairs each field with its `<head>` output.
5. **Other notes** — outputs/returns, limits, errors, availability caveats, and — when behavior changed across releases — a **Version history** table (columns: Version, Changes). When availability varies by library or framework, state it as an italicized *Note:*.

*Example overview table (each name links to its section below):*

```text
| Option | Description | Type | Optional | Default |
| --- | --- | --- | --- | --- |
| `[sourceLocale](#source-locale)` | Source language code, such as `en`. | `string` | Yes | `defaultLocale` |
| `[locales](#locales)` | Target locale codes. | `string[]` | No | — |
```

*Example item section:*

```text
## `sourceLocale` [#source-locale]

**Type** `string` · **Optional** · **Default** `defaultLocale`

Source language code, such as `en`. Falls back to `defaultLocale` when not provided.
```

Two reference-page shapes recur in single-part technical sections:

- **Command reference page.** The frontmatter title is the invoked command (`gt translate`); the `description` ends with `API reference for the <command> command.` Follow the page shape above: an Overview with the usage block inline, then How it works, then a **Flags** section documenting **all** flags (not just the common ones), then an Example, then Other notes.
- **File-format reference page.** Cover format-specific behavior — syntax preservation, output/transform quirks, per-format extras such as keyed metadata — and link to the configuration reference for shared file keys. Do not repeat full config-key documentation on each format page. **Name the page for the format(s) it documents, with a** `-files` **suffix** (the suffix keeps the slug explicit and machine-readable). Join a related pair with a hyphen: `ts-js-files`, `po-pot-files`, `mdx-md-files`, `gt-jsx-files`. A page covering a single format uses that format's name plus the suffix: `json-files`, `yaml-files`, `html-files`, `plain-text-files`.

The OpenAPI section (~40 endpoint pages) uses its own reference shape:

- **API-endpoint reference page (OpenAPI).** Each endpoint page carries a `method` frontmatter field (see Frontmatter) and a `description` ending with `API reference for [Endpoint].`. Shape the body as:
  1. **Intro** line (and an optional `_Note:_`) describing what the endpoint does.
  2. `## Overview` — a fenced ````http` block showing `METHOD https://api.gtx.dev/...`, immediately followed by an attribute line pairing permission and rate limit: `**Permission** \`project:files:read · **Rate limit** Light (300/min)`.
  3. `## How it works` — bulleted behavior (resolution order, defaults, encoding).
  4. `## Request` — with `### Headers`, `### Path parameters`, `### Query parameters`, and `### Body` subsections as they apply, each a table. Keep the `x-gt-api-key` / `x-gt-project-id` header rows standardized across endpoints.
  5. `## Response` — status, response fields, and an example (`title="Response"`).

**Document each configuration key once**, in the Configuration reference. Everywhere else (format pages, guides), link to it rather than restating it.

### No next-steps sections

Do not add "Next steps", "What to read next", "See also", "Learn more", "Related pages", "Related reference", or similar related-links roundup sections to any page. Related pages are handled globally by a template component appended to the bottom of every page (and surfaced in the header), so per-page roundups are redundant and drift out of date.

- *Note:* the template's section title differs by page type — **Next steps** on Guides, **Related pages** on Reference — but you never author either one by hand; the template adds it afterward.
- End a page on its last real content section (e.g. FAQs, the final task section, the OpenAPI spec note).
- Inline, contextual links inside prose are fine and encouraged (e.g. "install `generaltranslation` in the [Quickstart](…)"). The rule targets standalone roundup sections, not in-context links.
- **Drop the per-page scaffolding common in older docs:** standalone *Notes*, *Next steps*, *Related*, and repeated *Install* / *Add your environment variables* / *Add to your build process* steps. Setup steps live once in the Quickstart; contextual links inside prose replace roundup sections.



#### Choosing `related.links`

Populate `related.links` by page type, ordered by **what the reader most likely wants to do next**:

- **Quickstart and section-entry pages** (`quickstart`, the Dashboard/Locadex entry page, and each React per-framework quickstart) link to **four guides for that section** — the ones someone who has just set up their app is most likely to want next. If the section has fewer than four guides, link all of them. **Never link another quickstart or a reference page.**
- **Guide pages** link to the **other guides in the same section** — what someone who has just finished this guide would do next. Link **all** the section's other guides; only when there are **more than four** others do you use relevance to choose the four most useful. **Never** link the guide to itself, to another section's guides, to quickstarts, or to reference pages. (Example: a four-guide section like Dashboard means every guide links the other three.)
- **Relevance only decides *which* to drop, never *whether* to link.** Do not pad a short list with reference or cross-section links to reach four, and do not trim a list below four unless the section genuinely has fewer eligible guides.
- **Exception — a section with no guides** (currently OpenAPI): link the most relevant reference pages instead, since there are no guides to point to.



### Links

- Internal links use root-relative `/docs/...` paths (e.g. `/docs/platform/dashboard/reference/api-keys`).
- **Link paths are always lowercase and hyphenated**, even when they point to a capitalized folder or section (**Get Started** → `/docs/platform/dashboard/get-started`). Preserve lowercase in links regardless of how the folder or section name is displayed.
- Link to the **logical page path, not the file path**: omit any `en-US/` locale segment and the file extension (`.md`/`.mdx`) in Markdown links. Note that `meta.json` `pages` entries use extensionless relative references (`"./quickstart"`), since those are structural file locations.
- Link punctuation goes **outside** the brackets: `[Annotations](…).`, not `[Annotations.](…)`.
- **Backticks go inside the link text, never around the whole link.** For API/code references, code-format the identifier inside the link text — `[useTranslations](…)` — which renders correctly. Do not wrap the entire link in backticks (`[GT](…)` renders literally).
- **Link every occurrence of a component, function, hook, class, or method in prose** to its reference page (`[useTranslations](/docs/react/reference/hooks/use-translations)`). Do not link occurrences inside headings. Skip self-links on the symbol's own reference page.
- **Verify the target exists before linking.** If a page does not exist yet, omit the link or note it as "coming soon".
- **Validate inline-code API links with the reference index.** Run `npm run validate:reference-links` from `scripts/`; use `npm run validate:reference-links -- --fix` to wrap deterministic matches without reformatting the source. The index uses dedicated API reference page titles plus the `initializeGT` and `initializeGTSPA` sections on the React configuration page. It normalizes component brackets, call parentheses, Python snake_case, and `gt` commands, then uses package, framework, and section context when a symbol has multiple targets.
- **The validator checks prose only.** It excludes frontmatter, headings, fenced code, existing links, same-page symbols, local config/field headings, and symbols that belong to another package unless the surrounding text names that package. Its narrow source exclusions cover fields returned by `useLocaleSelector`, the `gt-i18n` `getTranslations` export without a package-specific page, and release-note mentions that intentionally refer to both a class method and standalone function.



### Callouts

Callouts are MDX components that keep secondary but important information next to the step or concept it affects. Use them based on purpose, not a page-level quota: a page can have several when each one helps a different role, mode, or decision. Do not add them only for visual variety.

Use a callout when the information should stay adjacent but should not interrupt the main path:

- **Role-specific actions.** In integration and Dashboard flows, use a Note for setup or decisions that belong to a particular role rather than every reader. Start with the exact role in bold, such as **Organization admins:**, **Developers:**, or **Editors:**. Different roles may have separate Notes when their actions occur at different steps.
- **Path- or mode-specific context.** Use a Note for an alternate connection mode, a non-interactive path, a plan or permission requirement, a fallback, or behavior that applies only in one framework or localization mode.
- **Consequences near an action.** Use a Note for billing or metering behavior, generated files, background processing, replacement behavior, or another result readers should understand before continuing.
- **Optional improvements.** Use a Tip for a shortcut, best practice, or optimization that is helpful but not required.
- **Risk.** Use a Warning when an action can overwrite work, delete or expose data, incur an unexpected cost, break a build, or be difficult to reverse.
- **Version changes.** Use a Note led by `Changed in vN:` for breaking or behavior-changing updates on maintenance-facing pages (see Version and change notes).

Use `type="info"` for Notes and Tips so the default icon is blue. Use `type="warn"` for Warnings so the warning icon remains orange.

Keep each callout focused on one audience, condition, or consequence. One to three short sentences is typical; a short list is acceptable when one role must complete several related actions. Place the callout immediately after the step or paragraph it qualifies.

Do not use a callout:

- In place of a required step in the primary workflow. Make that a numbered step.
- To hold a long reference explanation, full option list, or troubleshooting procedure. Give that content a clearly named section.
- To repeat the same note on every nearby page. Put the complete detail in the canonical page and link to it where needed.
- For ordinary prose that reads clearly in the main flow.

Avoid stacking callouts with no prose between them. Combine callouts that address the same audience and condition; keep separate ones only when the reader needs to make distinct decisions.

Example for role-specific integration setup:

```mdx
<Callout type="info">
  **Organization admins:** Open **Organization > Connections**, add the connection, and verify access before Project members continue.
</Callout>
```

Follow the established pattern for the page type and keep sibling pages consistent. Use italicized prose instead when the aside is lightweight and does not need to interrupt the flow.

### Version and change notes

Docs serve two readers at once: someone **setting up for the first time** and someone **maintaining an existing project** across an upgrade. Write for both without cluttering either.

- **Setup-first pages document only the current version.** The Quickstart, Get Started, and a guide's happy path show the current API as the single correct way — no legacy snippets, and no "previously…", "in older versions…", or "if you are on vN…" asides. A new reader should never have to reason about past versions to reach first success.
- **Maintenance-facing pages call out what changed.** Reference pages and the detailed/troubleshooting parts of a guide add a change note when a **public surface changed in a way that breaks or silently alters existing code** — a removed or renamed export, a changed or newly required prop/parameter, a moved responsibility (setup that moved off one API onto another), or a changed default. This is what an upgrading reader needs and a new reader can skip.

When to add a note:

- **Add one** for breaking or behavior-changing updates that affect existing users, at the major version where it changed (write `v11`, the package major — not full semver, unless a specific patch matters).
- **Do not add one** for purely additive features: document the new capability as current, with no version note. Absence of a note means "this is just how it works now."
- **One note per affected page**, placed at the relevant spot. Do not repeat the same version note across every page that touches the feature; note it where the reader acts on it (the provider change belongs on the provider reference and the configuring guide, not on every page that renders a `<T>`).

How to write it:

- Use a `Note` callout led with `Changed in vN:`, stating what changed **from → to** in one or two sentences, and link to the current API. *Example:* "**Changed in v11:** `GTProvider` no longer accepts `config` or `loadTranslations`; move setup to `[initializeGTSPA](…)` and pass the resolved `locale` and `translations`."
- For a per-item behavior change on a Reference page, prefer the **Version history** table (columns: Version, Changes) in that item's *Other notes* over a callout (see Reference page).
- Show old-vs-new code only when it materially helps migration, using `// Before` / `// After` (see Code blocks) — and keep the current ("after") form as the primary example, never leading with the deprecated one.



### Code blocks

- Fence code with a language tag. Common tags: `tsx`, `jsx`, `ts`, `js`, `bash`, `json`, `yaml`, `html`, `markdown`. The tag is optional for plaintext.
- Use `title="src/index.ts"` for file snippets and `title="Output"` for response examples.
- Keep runnable examples minimal and consistent (e.g. `gt.translate('Hello, world!', 'es')`).
- Highlight specific lines with the Fumadocs syntax `// [!code highlight]`.
- Show edits to a file the reader already has (quickstart-style changes) with the diff notation `// [!code ++]` and `// [!code --]`: added lines render green, removed lines red. Ranges apply to the following lines (`[!code ++:3]`).
- Notation markers only convert where the marker is a real comment token. Inline `// [!code ...]` works in JS statements and JSX attribute positions. In JSX children positions, put the marker on its own line as `{/* [!code ++] */}`; the marker line is removed from output and the notation applies to the next line.
- **Use tabs whenever possible.** This follows the conciseness rule: when the shape of the instructions is the same and only the specific code differs (package managers, language variants, query examples), do not duplicate the instructions — capture the variants in tabs. List all four package managers in this exact order: `<Tabs items={['npm', 'yarn', 'bun', 'pnpm']}>`. Use this exact shape, with a `<Tab value="...">` per item wrapping a fenced code block:

```mdx
<Tabs items={['npm', 'yarn', 'bun', 'pnpm']}>
  <Tab value="npm">
    ```bash
    npm install gt-sanity
    ```
  </Tab>

<Tab value='yarn'>```bash yarn add gt-sanity ```</Tab>

<Tab value='bun'>```bash bun add gt-sanity ```</Tab>

  <Tab value="pnpm">
    ```bash
    pnpm add gt-sanity
    ```
  </Tab>
</Tabs>
```

- **Flag correct vs. incorrect patterns with ✅ / ❌** in code comments or prose (e.g. `// ❌ Wrong` / `// ✅ Correct`).
- **Show migrations as before/after.** Mark the old and new code with `// Before` and `// After` comments (paired blocks, or one block when the diff is small) so the change is unmistakable.
- For directory structures, use the `<Files>` / `<Folder>` / `<File>` components rather than ASCII tree diagrams.



### Card grids

Use `<Cards>` wrapping child `<Card title="…" href="…">` elements for the navigational grids on **hub and landing pages** (hub pages such as `platform/index.mdx` and `integrations/index.mdx`, and the Overview landing) — **not** on `guides`/`reference` folders, which have no landing page. Each card's `title` is the target page's display name in its natural casing (`useGT`, `gt translate`, `GTProvider`) and its body is a single short fragment describing the page, matching the target page's `description` (ending with a period, like the description; escape component tags as `<T>`). Group cards under `##` headings that mirror the section's subsections. Cards are for hub and landing pages only — do not scatter them mid-page in place of prose or inline links.

```mdx
<Cards>
  <Card title="Configuring the CLI" href="/docs/cli/guides/configuring">
    How to set up a General Translation gt.config.json with your locales, files, and storage options.
  </Card>
</Cards>
```



## Commits and CI



### Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `fix:` for corrections (typos, broken links, grammar).
- `docs:` for new content or significant rewrites.
- `feat:` for new pages or features.

Keep the subject line concise; use the body to list details when a change touches multiple files.

### CI restrictions

These patterns are **blocked by CI** and will fail the build, so never use them in docs files:

- `import` or `export` statements in MDX (the shared components are globally available — do not import them).
- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, or `<style>` tags.
- `on*=` event handler attributes.
- `javascript:` URLs.

CI validates every `meta.json`: entries must resolve, every navigable child must be listed exactly once, standard folder titles must use canonical sentence case, and top-level sidebar sections must match the approved information architecture.



## Consistency checks before finishing

- The page reflects real system behavior (verified against code and existing docs), not just restated formatting.
- Every material rewrite accounts for removed prerequisites, permissions, roles, plan gates, modes, defaults, billing effects, limits, fallbacks, side effects, update behavior, and failure modes; each fact was kept, moved, corrected, or deliberately removed with evidence.
- Every changed Quickstart was completed in order from a clean project using only its stated requirements, including its start command and observable success state.
- Claims about a versioned package were verified against the published artifact for the documented version, not only repository source.
- Examples and broad behavior statements are scoped correctly when a capability has multiple modes.
- Every information-architecture change has an old-to-new route map covering content, metadata, related links, cards, and redirects.
- Frontmatter on every touched page parses as YAML, including descriptions with colons, hashes, or other significant punctuation.
- The intro does not restate the frontmatter `description` (the layout renders the description under the title); the body opens with new detail.
- Depth and vocabulary match the page audience.
- Sections are grouped into a few meaningful H2s with H3 subsections, not many small one-off H2s. Consolidate or restructure if there are more than 6 H2 subsections.
- The product name appears only where it adds context; the title, description, and intro do not repeat **General Translation**, and product-owned capabilities are not needlessly brand-prefixed. If **GT** is used, an earlier necessary mention spells out **General Translation**.
- Brand cleanup preserves useful "translation" language and identifiers such as `gt` or package names, and does not mechanically rewrite `meta.json`, overviews, hubs, cards, or configuration descriptions.
- Guides answer "how do I…?" with ordered steps; Reference answers "what exactly does this do?" comprehensively and opens with an overview table linking to each item's section.
- Guide titles use the gerund (-ing) form, and each guide's file name and link slug match its title.
- Guide descriptions lead with "How to…" (or a question for concept-only guides), are one concise sentence with no `: this guide covers …` checklist, contain no unnecessary brand prefix, and contain no backticks; component names use angle-bracket tags (`<T>`, `<Plural>`), which any matching `<Card>` body on a hub page escapes as `<T>` so the MDX still parses.
- Descriptions (frontmatter and `meta.json`) end with a period (a question ends with `?`); `<Card>` bodies that mirror a description match it (also ending with a period). The only exception is the short tab subtitle on a section root (`"root": true`), which is not a sentence and takes no period.
- Sidebar labels preserve their established casing; **Get Started**, **Quickstart**, **Guides**, and **Reference** are title-cased, and product names such as **Google Drive** keep their official casing.
- Top-level sidebar sections match the approved names and order; no unrequested section folder has been added.
- Every occurrence of a component, function, hook, class, or method in prose links to its reference page, except occurrences inside headings and self-references on the symbol's own page.
- `npm run validate:reference-links` passes with no unresolved relevant inline-code API symbols.
- No reviewer directives, TODO/FIXME/placeholder text, or "to confirm"/"to verify" draft sections remain in the page.
- Setup-first pages (Quickstart, Get Started, guide happy paths) show only the current version, with no legacy code or "in older versions" asides; breaking changes are noted only on maintenance-facing pages (Reference, guide detail) with a `Changed in vN:` note.
- Page order in the filetree (and the sidebar navigation it drives) is logical (workflow order), not alphabetical.
- Uncertain items are resolved against the codebase; anything that genuinely cannot be verified is omitted rather than guessed.
- Navigation separators use `>`, not `->`.
- `.md` link suffix usage is consistent within the file.
- Notes and tips use the established format for their page type and are consistent across sibling pages.
- Product/term casing matches the canonical list (Dashboard, Locadex, Core, Google Drive, Project, Context Group, Glossary, Custom Prompts, Organization, Enterprise, GitHub).
- Reference descriptions end with a second sentence: `API reference for X.` for API/library pages, or `Reference for X.` for non-API reference pages (ending with a period).
- No broken internal links (verify the target file exists).
- `related.links` follow the page-type rule: quickstart/entry pages point to four of that section's guides (or all if the section has fewer than four); guide pages link **all** the section's other guides, trimming to the four most relevant only when there are more than four others; neither links reference pages or quickstarts (the guide-less OpenAPI section is the only exception).
- **Machine-readable outputs are in sync:** every entry in each `meta.json` `pages` array resolves to a real file, so the publishing app can generate current `llms.txt` and `sitemap.xml` output.
- No typos; body prose sentences end with periods, and so do descriptions (a description that is a question ends with `?`; section-root tab subtitles take no period).
