---

name: General Translation docs internal skill
description: Follow these rules when creating, editing, reviewing, or restructuring General Translation documentation content. Use this style guide when the user asks about docs voice, structure, naming, or formatting conventions.

---

# General Translation docs style guide

Rules for authoring and updating the General Translation docs. Follow these to preserve the established style, structure, and flow.

General Translation is **one full-stack product**, and every top-level docs section is a capability of it. They all follow the same **Get Started/Quickstart → Guides → Reference** spine. A few rules are specific to the Platform section (Dashboard, Locadex, OpenAPI, Core) and are marked *(Platform-specific)*.

## Before you write: understand the system first

Good docs come from understanding, not paraphrasing. Before applying any formatting rule below — especially on a first rewrite with access to the codebase — work in this order:

1. **Understand the application and the logic of each piece first.** For the product/section you are documenting, work out what each feature, function, endpoint, or setting actually does, who uses it, and why it exists — including inputs, outputs, defaults, constraints, and failure modes. Only once the behavior is clear should you spin out into the structure and formatting conventions in this guide. Do not start from the formatting.
2. **Read the existing docs for that area, but treat the code as the source of truth.** Existing pages often contain human-written explanations, product guardrails, edge cases, and nuance that are not evident from the code alone. Treat them as *supplementary* material only: mine them for intent and fold that in, and rework or delete duplicative content freely. They are a second pass on top of the code, never a substitute for it. **The code is ALWAYS the source of truth. Whenever the code and the existing docs disagree, follow the code without exception**, correct the docs to match, and flag the discrepancy for human review. Never carry over a behavior, signature, parameter, default, return type, or option from the old docs once you have seen the code contradict it — do not "stay faithful to the old docs" in those cases. When you cannot find something in the code, verify it against the code before documenting it; do not invent or assume, and note it as missing/unverifiable instead.
3. **Then apply the conventions below** for architecture, naming, structure, and voice. Before writing full docs content, first ask user to confirm filetree structure.

## Always flag for human review

Docs must always get some form of human review before publishing — never treat AI output as final. To make that review efficient, proactively call out the specific pieces that most need a human's eyes. Automatically surface:

- Anything **unclear in the codebase** or that you could not verify against the code.
- Anything **logically unclear** or ambiguous in how it should behave.
- Anything you are **not absolutely certain about**.
- **Close calls:** when two options for structuring, displaying, or describing important information are similarly good, present both and note the tradeoff instead of silently picking one.
- **Dashboard and Locadex changes:** these sections describe UI elements (screens, labels, buttons, navigation) that are not verifiable against this codebase and drift as the product UI changes, so any updates to them need closer human review — confirm UI names, breadcrumbs, and screenshots against the live product.
- Anything else noteworthy: assumptions you made, gaps, or content that may be out of date.

List these explicitly (for example, in the summary of changes) so a human can confirm or correct them.

## Document the complete public surface

Reference docs must cover the **entire public API**, not a curated subset. When you document a library, CLI, or API:

- **Capture every undocumented public surface.** Diff the code's public exports (classes, methods, functions, options, config keys, flags, endpoints, and types) against the existing pages, and add a page or section for anything public that is missing. Do not silently skip a public symbol because it is advanced, low-level, or tooling-oriented — document it (grouping several related low-traffic symbols onto one reference page is fine; omitting them is not). Add crosslinks between related symbols (for example, a method and its inverse, or a flat vs. parts variant) so readers can navigate between them.
- **Never expose anything marked internal.** If the code marks a symbol as internal — a JSDoc `@internal` tag, a leading-underscore private implementation, a `# private` member, an `__all__` omission, or an equivalent "not public" signal — do **not** document it, do not link to it, and do not reference the internal implementation. Document only the public wrapper that the internal function backs. When it is ambiguous whether a symbol is public, verify against the code and flag it for human review rather than exposing it.
- **When the surface is genuinely complete, say so** in the review notes (for example, "all N exports have reference pages"), so a reviewer can trust the coverage.

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
- **Do not use jargon when you do not need to.** When a plain word works, use it; when a technical term is genuinely necessary, define or link it on first use.
- Favor practical, runnable examples over exhaustive prose.

### Voice and formatting

- Address the reader as "you"; use active voice and imperatives.
- **Fragment vs. sentence in lists**: use fragments when simply listing pieces or labels (no period needed); use full sentences (including standalone imperatives like "Revoke unused keys.") when describing steps or actions, and end those with a period. Be consistent within a single list. List items that complete a lead-in stem ("From the page, you can:") are fragments and take no period.
- **Italicize notes and examples**: write them as *Note: …* and *Example: …*.
- **Bold** UI elements the user interacts with: buttons, page names, fields, toggles (**Save**, **Translate**, **App Root Directory**).
- **Inline code** for code identifiers, file names, locale codes, environment variables, key prefixes, and headers (`en-US`, `GT_API_KEY`, `gtx-api-`, `x-gt-api-key`).
- **Summarize runtime wording; do not quote it verbatim.** Paraphrase interactive prompts, success and log messages, and console output rather than copying exact strings, so the docs stay correct when that wording changes. Reproduce a string exactly only when the value is part of the contract — environment variable names, flags, config keys, file names, commands, and error codes/identifiers. *Example: write "the wizard asks which API key type to generate" rather than quoting the full prompt sentence.*

#### Referring to Dashboard locations

Use a bolded breadcrumb with `>`: **Locadex > Configuration > General**, **Project > Context**. Standardize on `>` (never `->`).

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
- Write out **General Translation** on the **first mention of a page, and in every** `description`. Do not open a page or a description with the abbreviation.
- After the first mention, you may use **GT** later on the same page where it is clear from context and reads better, such as long sentences or possessives (**GT's**). When in doubt, keep writing General Translation.

### Product and term casing

Always capitalize these as product terms: **Dashboard**, **Locadex**, **Core**, **Project** (and **Projects**), **Context Group** (and **Context Groups**), **Glossary**, **Directive** (and **Directives**), and **Autoderive** (the CLI feature). Also capitalize the product scopes **Organization** and **Enterprise**, and **GitHub**. Lowercase "group" when they are not part of the proper term.

*Note: capitalize **Autoderive** only when referring to the feature in prose; the `gt.config.json` key stays lowercase in code as `autoderive`. Do not write "General Translation Autoderive" — the feature name stands on its own.*

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

1. **Overview** — product-level: **Get Started**, **Key Concepts**, and **For coding agents**. Overview also acts as a landing hub (see Overview hub).
2. **Platform** — the Dashboard, Locadex, OpenAPI, and Core capabilities.
3. **CLI**
4. **React** — the React ecosystem SDKs (`gt-react`, `gt-next`, TanStack Start, and `gt-react-native`) and the React Core linter, folded into **one multi-framework section** (see React section (multi-framework)).
5. **Node**
6. **Python**
7. **Integrations** — plugins for third-party content platforms (for example, Sanity, Storyblok, and Google Drive).

Some sections are **multi-part**: they group several capabilities, and *each* capability carries its own **Get Started/Quickstart → Guides → Reference** spine (Platform groups Dashboard, Locadex, OpenAPI, and Core; Integrations groups one plugin per integration). **CLI, Node, and Python** are **single-part**: the section itself is directly **Quickstart → Guides → Reference**. **React** is a **multi-framework** section: it covers several closely-related frameworks that share one API, so it uses a **Get Started (Overview + one Quickstart per framework) → shared Guides → shared Reference → per-framework folders** shape (see React section (multi-framework)). **Overview** has its own shape (**Get Started → Key Concepts → For coding agents**).

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
- **Framework-specific pages** — anything that only applies to one framework (for example, Next.js server components, middleware, the config plugin, and localized `<Link>`; React Native's native plugin/setup; TanStack Start's server setup) lives in a **folder named for that framework**, and those framework folders are grouped under a single **`(additional-frameworks)` route group** at the section root (`react/(additional-frameworks)/nextjs`, `.../react-native`, `.../tanstack-start`). A **route group** is a folder wrapped in parentheses: it groups pages under one sidebar heading (displayed here as **Additional Frameworks**) **without adding a URL segment**, so the parenthesized folder disappears from the link. Folder display names use the framework's official spelling; link slugs stay lowercase-hyphenated and omit the route group (`/docs/react/nextjs/...`, `/docs/react/react-native/...`, `/docs/react/tanstack-start/...`).
- **Linter.** Fold the React Core linter (ESLint plugin and its rules) into the shared Guides (a *Lint your code* guide) and Reference (a lint-rules page), with tabs for the per-framework ESLint config where it differs.

This is the one **exception** to the single-part "section landing page is the Quickstart" rule: the React section landing is the **Get Started → Overview** page. Keep terminology, examples, and page order consistent across the framework tabs.

### Filetree (`meta.json`)

The filetree is defined by **per-folder `meta.json` files** (the Fumadocs convention), not a single root `filetree.json`. Every section and subsection folder has a `meta.json` that sets its display name and the order of its pages. When you add, remove, or reorder pages in *any* section, update the relevant folder's `meta.json` (and confirm the structure with the user before writing a new section's pages).

A `meta.json` supports these keys:

- `title` — the folder's sidebar display name (lowercase for structural folders; see File and folder naming).
- `description` — one-line section summary.
- `pages` — the ordered list of entries; **this array is the source of truth for page order**.
- `icon`, `root`, `defaultOpen` — optional sidebar/section-root flags (top-level sections set `"root": true`).

Entries in `pages` take three forms:

- **A child page or folder** — a relative reference: `"./quickstart"`, `"./guides"`, `"./(additional-frameworks)"`.
- **A section separator** — a label wrapped in triple dashes: `"---Getting Started---"`, `"---Platform---"`. This renders a labeled divider in the sidebar; use it to group entries within one section.
- **A cross-section link** — a Markdown link to another page: `"[Dashboard](/docs/platform/dashboard/get-started)"`. Use these to point out of the current section (see Overview hub).

### Overview hub

The **overview** section doubles as a **landing hub**: its `meta.json` lists the overview pages (get started, key concepts, for coding agents) under a `---Getting Started---` separator, then uses more separators (`---Frameworks---`, `---Platform---`) with **cross-section link entries** to surface the main frameworks and Platform capabilities without duplicating their content. Keep those curated links in sync with the sections they point to, and only link pages that exist.

### Machine-readable outputs

The docs are written to be consumed by LLMs and agents, not only humans. Alongside the filetree, publish two machine-readable maps at the repo root, both **generated from the `meta.json` filetree** (never hand-edited):

- **`llms.txt`** — an [llmstxt.org](https://llmstxt.org/)-style index for LLMs and agents: an H1, a one-line blockquote summary, then per-section lists of `- [Title](url): description` links.
- **`sitemap.md`** — a linked, hierarchical map of every published page in navigation order.

Regenerate both whenever you add, rename, remove, or reorder pages, so they stay in sync with the `meta.json` filetree. **Only include pages that actually exist** — omit in-progress sections and manifest-only stubs, and keep every link resolvable.

### Agent-navigable by default

Beyond the two maps above, the docs follow these agent best practices so an agent can consume them without scraping HTML. Keep them in place and current:

- **Raw Markdown for every page.** Every page is available as raw Markdown by appending `.md` to its URL. Never remove this affordance, and link to the logical page path in prose (the build serves the `.md` variant).

Document these entry points for developers on the **Overview → For coding agents** page (see For coding agents page).

### AGENTS.md (for product users' agents)

Publish a root **`AGENTS.md`** aimed at the **coding agents of developers who use General Translation** — *not* at agents editing this docs repo. A developer drops it (or its contents) into their own project so their agent knows how to add and run General Translation correctly. Keep it self-contained, imperative, and short enough to fit an agent's context window.

Structure it in this order:

1. **What General Translation is** — one or two sentences, plus which package or tool fits the reader's stack (`gt-next`, `gt-react`, `gt-node`, the CLI, and so on).
2. **Setup** — install the right package, create `gt.config.json`, and set the API key environment variables.
3. **Core usage** — the canonical patterns the agent should follow (for example, wrap user-facing strings in `<T>`, use `useGT()` for dynamic strings, keep locale configuration in one place). Show minimal, commented code.
4. **Commands** — a short cheat-sheet of the CLI commands the agent will run (`npx gt configure`, `npx gt translate`, and so on) and when to run each.
5. **Rules — do and don't** — explicit guardrails: what to always do (wrap new copy, run `gt translate` before committing) and what never to do (hardcode translated strings, hand-edit generated translation files).
6. **Links** — point to `llms.txt`, the sitemap, and the most useful pages for deeper detail.

Document only capabilities that exist, and flag anything uncertain for human review (see Always flag for human review). This file is written by an agent connected to the product codebase; this guide defines its **shape**, not its exact contents.

### Get Started vs. Quickstart

The entry page for a capability is named for its audience:

- **Technical libraries and APIs use** `quickstart.md`**.** Quickstart is the developer-facing tone: install the library or SDK, authenticate, and run the first call. This applies to Core, CLI, React, Node, Python, OpenAPI, and integration plugins.
- **Product/nontechnical capabilities use** `get-started.md`**.** Get Started is the setup-and-orientation tone for product pieces, not a developer install path. This applies to the **Dashboard**, **Locadex**, and the **Overview** section.

Shape the entry page itself:

- **Default to a single condensed entry page** placed directly in the capability folder: open with what it does and when to use it, then include the steps on the same page (a **Quickstart** for technical capabilities; **Key workflows/Configuration/Navigation** for product capabilities).
- **For single-part sections (CLI, Node, Python), the section landing page is the Quickstart itself** (`quickstart.md` at the section root); there is no separate section index page.
- **The React section is the exception:** it is multi-framework, so its landing page is **Get Started → Overview**, followed by one **[Framework] Quickstart** per framework (see React section (multi-framework)).
- **Split into a Get Started section with separate Overview and Quickstart pages only when** the capability needs substantial conceptual grounding before a reader can act — concepts, architecture, or a mental model that would overwhelm a single page (typical of larger frameworks). Small libraries, single APIs, and the current Platform capabilities do not need a split.
  - When split: **Overview** covers what it is, why, when to use it, and the core concepts; **Quickstart** is the numbered path to first success.
  - The folder then displays as **get started** (lowercase, like every structural folder) and its link/URL slug is `get-started` (see File and folder naming).

### Guides vs. Reference

Both sections exist on every capability of the product, but they answer different questions:

Use **Guides** for practical, customer-facing workflows. A guide should help someone complete a task, understand when to use a feature, and make good decisions along the way. Guides can include light conceptual explanation, but only when it helps the user act.

Use **Reference** for complete, standardized descriptions of how something works. A reference page should define options, fields, permissions, APIs, settings, limits, and behavior precisely. Reference pages do not need to persuade or teach a workflow; they should be easy to scan when someone already knows what they are looking for.

In short:

- **Guides answer "How do I do this?"** They are practical and customer-sendable. Titles use the **gerund (-ing) form** (*Configuring Locadex workflows*, *Reviewing and editing translations*, *Translating content*, *Querying translations*), and steps run in order toward a goal. The file name and link slug follow the gerund title (*Using translations* → `using-translations.md`).
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
- **Single-part technical sections (CLI, React, Node, Python) share one Reference spine:** Configuration → Commands (or API) → File formats, each a subsection with one page per command, function, format, or config area. Order commands from setup outward (`init`/`setup`/`configure`/`auth` → `translate` → the CI building blocks → `generate`/`validate`).
- *Examples:*
  - **Dashboard Guides:** generating context → reviewing and editing translations → adding annotations.
  - **CLI Guides:** configuring the CLI (`configuring-cli.md`) → generating translations → managing translations → tracking by branch → …
  - **CLI Reference:** Configuration → Commands → File Formats.

### No index.md for Guides or Reference

- **Guides and Reference sections do not get an** `index.md` **page.** Do not create a landing/index page that lists the section's pages — the sidebar navigation (driven by `meta.json`) is the entry point into each section. This applies to every section and to Reference subsections, not only Platform.
- Get Started is a single page, so it never needed its own index.
- Link directly to the individual page a reader needs, not to a section index.

## Files and frontmatter

### File format

- **Generated/draft docs are authored as** `.md`**.** For production they will and should be converted to `**.mdx`** (Markdown with JSX support), UTF-8, with LF line endings. MDX is what enables the shared components (`<Tabs>`, `<Callout>`, `<Files>`, `<Accordion>`) used across the docs. Where this guide says `.md`, read it as `.mdx` once published.

### File and folder naming

- **General principle:** name a file for its topic using the **fewest words that stay clear and self-explanatory** when read on their own (in a URL or the sidebar), together with the folder for context. Lowercase, hyphenated, **usually three words or fewer** — never padded, and never truncated to a cryptic stub (`edit-translations.md`, `configure-workflows.md`, `vm-image.md`).
- **Keep a single word only when it is standard or unambiguous in its folder** (`config.md`, `quickstart.md`, `webhooks.md`; `agent.md` under Locadex Reference clearly reads as the Locadex Agent). **Expand a vague single word** into two or three words that say what the page actually covers (`translation-context.md`, not `context.md`; `locale-codes.md`, not `locales.md`).
- Name reference and conceptual pages by topic, not verb phrase (`monorepos.md`, `annotations.md`). **Guides are the exception:** their file name and link slug use the **gerund (-ing) form** matching the guide title (`using-translations.md`, `configuring-workflows.md`, `translating-content.md`).
- **The entry page is** `quickstart.md` **for technical capabilities and** `get-started.md` **for product/nontechnical ones** (see Get Started vs. Quickstart). Core, CLI, React, Node, Python, OpenAPI, and integration plugins use `quickstart.md`; Dashboard, Locadex, and Overview use `get-started.md`.
- **Configuration reference pages are named and linked simply** `config.md` in most cases (not `configuration.md` or `config-reference.md`).
- **Command reference pages are named by the command**, lowercase-hyphenated, matching the invoked subcommand (`translate.md`, `save-local.md`, `keyed-metadata.md`).
- **Consolidate near-identical formats or variants onto one page** (MDX + Markdown → `mdx.md`; TypeScript + JavaScript → `ts.md`). Name the page after the primary variant and cover the sibling on the same page.
- **Structural and navigational folder display names are lowercase — the rule is all lowercase.** This covers the spine and grouping folders: `overview`, `get started`, `quickstart`, `guides`, and `reference`. There is no capitalized exception among them (get started and quickstart are lowercase too). Multi-word names keep the space but stay lowercase (`get started`).
- **Reference subsection folders are lowercase as well** — generic groupings display as `commands`, `formats`, `functions`, `components`, `hooks`, and `types`. Never use dashes in the display name; the build derives the URL/`path` slug by lowercasing and hyphenating.
- **Only proper nouns and product/brand names keep their official casing** as folder names: `CLI`, `React`, `Next.js`, `Node.js`, `Python`, `Dashboard`, `Locadex`, `Core`, `OpenAPI`, `React Native`, `TanStack Start`, and the `GT Class` reference group. Everything structural around them is lowercase.
- **Links and URL slugs are always lowercase and hyphenated**, matching the lowercased display name. *Example: the get started section is linked as* `/docs/platform/dashboard/get-started`*.*

### Frontmatter

Use this exact structure (blank line after the opening `---`, blank line before the closing `---`):

```text
---

title: Add annotations
description: Use labels, notes, and comments to coordinate translation review by entry and locale.

---
```

- `title`: **sentence case** — capitalize only the first word, except proper/product names (Dashboard, Locadex, Core, Organization, Project, Enterprise, Context Group, Glossary, Directives, GitHub). No trailing spaces. The `title` must match the page H1 exactly.
- `description`: one sentence ending with a period, action-oriented ("Configure…", "Review…", "Learn…"). Spell out **General Translation** here (never open with "GT").
- **Reference pages** add a second sentence naming what the page documents. Choose the lead by page type:
  - **API/library reference** (a function, method, type, command, or endpoint) uses `API reference for [function/method/type].` — including OpenAPI endpoints. *Example: "…into a target locale. API reference for translateField."*
  - **Non-API reference** (a settings page, config area, file format, or other non-API surface) uses `Reference for [topic].` — do not start the sentence with "API reference". *Example: "…across every locale. Reference for supported file formats."*

## Page structure

1. **H1** right after the frontmatter, matching the title in sentence case.
2. **Intro**: 1–3 short sentences with no heading, stating what the page is and when to use it. Optionally one more italicized short line for constraints or scope.
3. **Sections** as `##`.

### Heading hierarchy

- **H2 (**`##`**)** for top-level sections, **H3 (**`###`**)** for subsections, **H4 (**`####`**)** only when a third level is genuinely needed.
- **Prefer a few larger sections over many small ones.** Group related material under a small number of meaningful H2s, using H3 (and sparingly H4) subsections. If several candidate H2s are all facets of one topic, make them H3s under a single H2 instead of a long flat list of H2s.
- **Do not skip heading levels** (do not jump from `##` to `####`).
- Headings are **sentence case** (see Voice and formatting).
- **Step-by-step sections** use numbered H3 headings (`### 1. Install`) nested under a single H2 for that section — on a Quickstart page the steps live under a `## Quickstart [#quickstart]` H2 (our Get Started convention). Do not use numbered H2s for steps.
- **Custom anchors** for stable linking: append `[#anchor]` to **every H2 heading only** (not H3 or H4) so links do not break when the title changes. Use a **concise, meaningful slug** (lowercase, hyphenated, **3 words maximum**) — a short form of the heading rather than its full kebab-case.

```text
## Using variables [#variables]
```

Link to it with the anchor: `/docs/platform/core/guides/translate-string#variables`. For same-page references, link to the anchor directly (`[Context priority](#priority)`) instead of writing "see the section below".

### Get Started / Quickstart page

The entry page orients the reader and gives them a fast path to first success. Shape it to the capability (see Get Started vs. Quickstart for which name to use):

- **Product/nontechnical capabilities (**`get-started.md`**: Dashboard, Locadex, Overview).** Lead with orientation, not code. Dashboard-style: **Key workflows** → **Configuration** → **Navigation** → **FAQs**. Locadex-style: **How [product] works** → numbered setup steps.
- **Technical capabilities (**`quickstart.md`**: Core, CLI, React, Node, Python, OpenAPI, integration plugins).** The page H1 is **Quickstart**. Open with what the library/API does and when to use it, then put the numbered path to first success (install → authenticate → first call) under a dedicated `## Quickstart [#quickstart]` H2 with `### 1. …` steps — title that section **Quickstart**, not "Translate your first app" or similar. Precede the steps with a short paragraph so the reader has context before acting. If there are concrete prerequisites (minimum runtime/library versions, supported platforms, required accounts or keys), list them explicitly up front — a short **Requirements** or **Before you start** section, or a `Note` callout for a single version floor.
- Do not add a separate conceptual overview page (unless the section is split per Information architecture) or a "Next steps" section (see No next-steps sections).

### For coding agents page

The **Overview → For coding agents** page (slug `for-coding-agents`) is the single page explaining how to use AI coding agents and LLMs with General Translation. Keep it to **one page** — do not spread it across a section. Write it for developers who work with agents such as Cursor, Claude Code, and Copilot.

Cover, in this order (drop any part that does not yet exist rather than inventing it):

1. **Intro** — one or two sentences on why General Translation is built to be agent- and LLM-friendly (open-source libraries, predictable configuration, machine-readable docs).
2. **Drop-in agent guide** — the full agent guide (what to use, setup, core usage, commands, do/don't, links) embedded in a **single copyable code block** so a developer can paste it straight into their project's `AGENTS.md`, `CLAUDE.md`, or tool instructions. Use a fenced block with a `title="AGENTS.md"` and a wider outer fence (four backticks) so the guide's own inner code fences render as literal text.
3. **Point agents at the docs** — link the machine-readable entry points (`llms.txt` and the sitemap) and show how to add the docs as context in an agent.
4. **MCP server and agent skills** — if a General Translation MCP server or agent skill exists, show how to install and use it; otherwise omit this part.
5. **Editor-specific tips** — short, parallel bullets for the common agents (Cursor, Claude Code, Copilot), only where the guidance genuinely differs. Use tabs when the shape is identical (see Code blocks).
6. **Best practices** — a short decision list of what to hand an agent versus what to verify by hand (for example, let it wire up `<T>` components, but always review generated translation context and locale configuration).

Only document capabilities that actually exist, and flag anything uncertain for human review (see Always flag for human review).

### Common workflow sections

A "common workflow" section is a bulleted roundup that points readers to the main tasks or settings from a landing page (as in the Dashboard get-started **Key workflows** and **Configuration** lists). Each bullet starts with the action, then a short description, then a link:

```text
- **Define context and key terms for translation:** use Context Groups to guide terminology and style across Projects. See [Define translation context](/docs/platform/dashboard/guides/translation-context).
```

Use common workflow sections on **Get Started pages and other overview/landing pages** to surface the primary tasks, instead of duplicating full how-tos inline. Do not use them mid-guide, where ordered steps belong.

### Guide page

Guides are **actionable**: they walk the reader through completing one task, in order. Give them **gerund (-ing) titles** that are easy to understand (*Configuring Locadex workflows*, *Translating content*), and name the file and link slug to match the title (`configuring-workflows.md`, `translating-content.md`).

Anatomy:

1. **Intro** (1–3 sentences): what you will accomplish and when to use this guide.
2. Optional **Before you start**: prerequisites such as access, keys, or installed tools. Use the heading **Before you start** (not "Prerequisites").
3. (For product pages) Optional **Basic [x] workflow** numbered list: the shortest happy path, end to end, so a reader can succeed without reading the whole page.
4. Detailed task sections (`##`): one section per sub-task, each with ordered steps. Name the exact buttons and pages in **bold**. Titles must be understandable and actionable.
5. Optional **What to use and when**: when a task offers two or more valid approaches, add a short decision list contrasting them (each bullet: the option in **bold**, then when to choose it) so the reader can pick quickly. Model this on the Next.js "What to use and when" bullets.

*Example happy-path workflow (from the context guide):*

```text
## Basic context workflow

1. Open your Organization in the Dashboard.
2. Go to the **Context** page.
3. Create a **Context Group**.
4. Add a **Glossary** (for terminology) and/or **Directives** (for style and tone).
5. **Assign** your Context Group to relevant Project(s).
6. Generate translations or apply updates to existing translations.
```

Use the `a)` `b)` `c)` sub-section pattern for parallel alternative paths (see Numbered vs. bulleted lists).

**Integrations and plugins:** use a consistent set of Guides where possible, in this order:

- Configuring [integration]
- Translating content
- Managing translations
- Querying translations *or* Using translated content

### Reference page

Reference pages are **comprehensive, exact lookups** for a **technical audience**: cover every field, option, parameter, permission, command, flag, limit, error, and setting for the topic — including defaults and behavior — within a clear, predictable structure. **This is the one place to favor completeness over brevity.** The conciseness rule still governs *wording*, but never drop options, flags, edge cases, or defaults just to keep a page short. When in doubt here, document more. This is the exception to the general "keep it short" guidance that applies elsewhere in the docs.

- **Write for developers.** Assume familiarity with the terminal, code, and the relevant language or framework; do not simplify away technical detail or restate basics covered in the Quickstart.
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
| [`sourceLocale`](#source-locale) | Source language code, such as `en`. | `string` | Yes | `defaultLocale` |
| [`locales`](#locales) | Target locale codes. | `string[]` | No | — |
```

*Example item section:*

```text
## `sourceLocale` [#source-locale]

**Type** `string` · **Optional** · **Default** `defaultLocale`

Source language code, such as `en`. Falls back to `defaultLocale` when not provided.
```

Two reference-page shapes recur in single-part technical sections:

- **Command reference page.** Title and H1 are the invoked command (`gt translate`); the `description` ends with `API reference for the <command> command.` Follow the page shape above: an Overview with the usage block inline, then How it works, then a **Flags** section documenting **all** flags (not just the common ones), then an Example, then Other notes.
- **File-format reference page.** Cover format-specific behavior — syntax preservation, output/transform quirks, per-format extras such as keyed metadata — and link to the configuration reference for shared file keys. Do not repeat full config-key documentation on each format page. **Name the page for the format(s) it documents, with a `-files` suffix** (the suffix keeps the slug explicit and machine-readable). Join a related pair with a hyphen: `ts-js-files`, `po-pot-files`, `mdx-md-files`, `gt-jsx-files`. A page covering a single format uses that format's name plus the suffix: `json-files`, `yaml-files`, `html-files`, `plain-text-files`.

**Document each configuration key once**, in the Configuration reference. Everywhere else (format pages, guides), link to it rather than restating it.

### No next-steps sections

Do not add "Next steps", "What to read next", "See also", "Learn more", "Related pages", "Related reference", or similar related-links roundup sections to any page. Related pages are handled globally by a template component appended to the bottom of every page (and surfaced in the header), so per-page roundups are redundant and drift out of date.

- *Note:* the template's section title differs by page type — **Next steps** on Guides, **Related pages** on Reference — but you never author either one by hand; the template adds it afterward.
- End a page on its last real content section (e.g. FAQs, the final task section, the OpenAPI spec note).
- Inline, contextual links inside prose are fine and encouraged (e.g. "install `generaltranslation` in the [Quickstart](…)"). The rule targets standalone roundup sections, not in-context links.
- **Drop the per-page scaffolding common in older docs:** standalone *Notes*, *Next steps*, *Related*, and repeated *Install* / *Add your environment variables* / *Add to your build process* steps. Setup steps live once in the Quickstart; contextual links inside prose replace roundup sections.

### Links

- Internal links use root-relative `/docs/...` paths (e.g. `/docs/platform/dashboard/reference/api-keys`).
- **Link paths are always lowercase and hyphenated**, even when they point to a capitalized folder or section (**Get Started** → `/docs/platform/dashboard/get-started`). Preserve lowercase in links regardless of how the folder or section name is displayed.
- Link to the **logical page path, not the file path**: omit any `en-US/` locale segment and the file extension (`.md`/`.mdx`) in Markdown links. Note that `meta.json` `pages` entries use extensionless relative references (`"./quickstart"`), since those are structural file locations.
- Link punctuation goes **outside** the brackets: `[Annotations](…).`, not `[Annotations.](…)`.
- **Backticks go inside the link text, never around the whole link.** For API/code references, code-format the identifier inside the link text — `[useTranslations](…)` — which renders correctly. Do not wrap the entire link in backticks (`[GT](…)` renders literally).
- **Link every component, function, hook, class, or method the first time it appears on a page** to its reference page (`[useTranslations](/docs/react/reference/hooks/use-translations)`). Link only the first mention on that page; leave later mentions as plain inline code. Skip the link when the first mention is the page's own subject (do not self-link a reference page to itself).
- **Verify the target exists before linking.** If a page does not exist yet, omit the link or note it as "coming soon".

### Callouts

Callouts are MDX components for a short, important aside. **Use them rarely and never by default** — prefer plain prose, and reach for a callout only when an aside is genuinely important enough to break the flow. Use only these three titles:

- **Note** — a neutral clarification or aside, including version/requirement notes.
- **Tip** — an optional best practice or shortcut.
- **Warning** — something that can cause data loss, breakage, or a hard-to-reverse mistake.

Keep each callout to one or two sentences. Do not stack callouts or use them in place of normal steps.

### Code blocks

- Fence code with a language tag. Common tags: `tsx`, `jsx`, `ts`, `js`, `bash`, `json`, `yaml`, `html`, `markdown`. The tag is optional for plaintext.
- Use `title="src/index.ts"` for file snippets and `title="Output"` for response examples.
- Keep runnable examples minimal and consistent (e.g. `gt.translate('Hello, world!', 'es')`).
- Highlight specific lines with the Fumadocs syntax `// [!code highlight]`.
- **Use tabs whenever possible.** This follows the conciseness rule: when the shape of the instructions is the same and only the specific code differs (package managers, language variants, query examples), do not duplicate the instructions — capture the variants in tabs. List all four package managers in this exact order: `<Tabs items={['npm', 'yarn', 'bun', 'pnpm']}>`. Use this exact shape, with a `<Tab value="...">` per item wrapping a fenced code block:

```mdx
<Tabs items={['npm', 'yarn', 'bun', 'pnpm']}>
  <Tab value="npm">
    ```bash
    npm install gt-sanity
    ```
  </Tab>

  <Tab value="yarn">
    ```bash
    yarn add gt-sanity
    ```
  </Tab>

  <Tab value="bun">
    ```bash
    bun add gt-sanity
    ```
  </Tab>

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

## Consistency checks before finishing

- The page reflects real system behavior (verified against code and existing docs), not just restated formatting.
- Depth and vocabulary match the page audience.
- Sections are grouped into a few meaningful H2s with H3 subsections, not many small one-off H2s. Flag to human if there are more than 6 H2 subsections.
- First mention of the product on the page (and in the description) uses **General Translation**, not GT.
- Guides answer "how do I…?" with ordered steps; Reference answers "what exactly does this do?" comprehensively and opens with an overview table linking to each item's section.
- Guide titles use the gerund (-ing) form, and each guide's file name and link slug match its title.
- Structural/navigational folders (`overview`, `get started`, `quickstart`, `guides`, `reference`, and reference subsections) display in lowercase; only proper-noun and product folders keep their casing.
- Every component, function, hook, class, or method is linked to its reference page on its first mention on the page.
- Guides and Reference sections have no `index.md` page.
- Page order in the filetree (and the sidebar navigation it drives) is logical (workflow order), not alphabetical.
- Uncertain items, unverified logic, and close calls are flagged for human review.
- Navigation separators use `>`, not `->`.
- `.md` link suffix usage is consistent within the file.
- Notes and examples are italicized.
- Product/term casing matches the canonical list (Dashboard, Locadex, Core, Project, Context Group, Glossary, Directives, Organization, Enterprise, GitHub).
- Reference descriptions end with a second sentence: `API reference for X.` for API/library pages, or `Reference for X.` for non-API reference pages.
- No broken internal links (verify the target file exists).
- **Machine-readable outputs are in sync:** every entry in each `meta.json` `pages` array resolves to a real file, and `llms.txt` and `sitemap.md` have been regenerated so they list only existing pages.
- No typos; sentences end with periods.

