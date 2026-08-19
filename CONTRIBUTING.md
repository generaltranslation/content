# Contributing to General Translation Content

If you've found an error in our docs or have a suggestion, we're open to contributions. Please read through this guide before opening a pull request.

> When contributing to this repo, you must agree that you have authored 100% of the content, that you have the necessary rights to the content, and that the content you contribute may be provided under the project license.

## How to contribute

1. **Fork** this repository
2. **Create a branch** for your changes (e.g. `fix/typo-in-quickstart`)
3. **Make your edits** following the conventions below
4. **Open a pull request** against `main`

A maintainer will review your PR. CI checks will run automatically to validate your changes. Please note that blog posts and devlog entries are written by the General Translation team -- external contributions to docs are more likely to be accepted.

## Development environment

This repo holds the MDX content (docs, blog, devlog, authors), a Next.js app that renders it, and Node scripts that validate it. It has **two independent dependency roots**, so use the right package manager in each:

- The repo root is a pnpm workspace (`pnpm-workspace.yaml`, globbing `apps/*`, currently just `apps/content` — the Fumadocs/Next.js site). Use `pnpm` here.
- `scripts/` is a separate project with its own `package-lock.json` and uses `npm`. Do not manage it with pnpm.

Run the site with `pnpm --filter ./apps/content dev` (serves on `http://localhost:3000`), or build it with `pnpm build:content` from the root. There is no `/docs` index route, so deep-link to a real page such as `/docs/cli/quickstart`.

The content directories live at the repo root, outside `apps/content`, and are wired in through `apps/content/source.config.ts`. `fumadocs-mdx` regenerates the `.source/` index on install and on every dev or build run, so restart the dev server after adding or removing content files if new pages do not appear.

Run the validators from `scripts/`:

| Command | What it checks |
| ------- | -------------- |
| `npm test` | Unit tests for every validator (links, unsafe HTML, callouts, reference links, and docs structure) |
| `npx tsx validate-links.ts` | Every internal link across all content |
| `npm run validate:unsafe-html` | The disallowed HTML and MDX patterns listed below |
| `npm run validate:callouts` | Callout types |
| `npm run validate:reference-links` | Inline-code API symbols resolve to reference pages |
| `npm run validate:structure` | `meta.json` filetree and section structure |
| `npm run typecheck` | The validation scripts themselves |

These mirror the CI jobs in `.github/workflows/run-tests.yml`. `pnpm install` reports `Ignored build scripts: esbuild, sharp`; that is expected and does not affect dev, build, or the validators.

## Content structure

| Directory         | What belongs here                   |
| ----------------- | ----------------------------------- |
| `docs/en-US/`     | Documentation pages                 |
| `blog/en-US/`     | Blog posts                          |
| `devlog/en-US/`   | Devlog / release note entries       |
| `authors/`        | Author profiles                     |
| `docs-templates/` | Shared templates (maintainers only) |

## MDX formatting conventions

- All content files use `.mdx` (Markdown with JSX support).
- Use standard Markdown syntax: headings, lists, code blocks, links, images, tables.
- Use fenced code blocks with a language identifier (e.g. ` ```tsx `).
- Keep lines reasonably short for readable diffs.

## Frontmatter requirements

Every MDX file must include a YAML frontmatter block at the top.

### Docs

```yaml
---
title: Page Title
description: A brief description of the page
---
```

### Blog posts

```yaml
---
title: Post Title
summary: A one-line summary
date: 2025-01-15
authors: [author-slug]
tags: ['tag1', 'tag2']
---
```

### Devlog entries

```yaml
---
title: package-name@1.2.0
headline: Condensed summary of the release
date: 2025-01-15
authors: [author-slug]
tags: ['package-name', 'version']
---
```

#### Devlog titles and headlines

Devlog frontmatter follows a fixed shape:

- `title` is the release identifier: `package@major.minor.patch` (`gt-sanity@2.1.0`), with no prose and no `v` prefix. A release cutting several packages together joins them with ` / ` (spaces required): `gt-flask@0.1.0 / gt-fastapi@0.1.0`. Scoped packages keep their scope: `@generaltranslation/react-core-linter@0.1.0`.
- `headline` is the condensed summary of the release — the one thing this version means to a user, in 3–60 characters. It renders in two places: under the package name on the blog index's changelog strip, and in the article title as `package version: headline` ("gt-sanity 2.1.0: Field-level localization").
  - Lead with the capability or outcome. Never repeat the package name or version — both already render next to the headline.
  - Name the concrete feature, not a vague theme: "Field-level localization", never "Sanity improvements".
  - API names are welcome when they are the story: "msg() accepts arrays", "Runtime translation with tx()".
  - Sentence case, no trailing punctuation, no `@`, one line.

### Author profiles

```yaml
---
name: Full Name
avatar: /static/avatars/name.png
occupation: Role
company: General Translation
email: name@generaltranslation.com
twitter: https://x.com/handle
linkedin: https://www.linkedin.com/in/handle
---
```

## What's not allowed

To keep the content repo safe, the following are **blocked by CI** and will cause your PR to fail:

- `import` or `export` statements in MDX files
- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, or `<style>` tags
- `on*=` event handler attributes (e.g. `onclick`, `onerror`)
- `javascript:` URLs

These restrictions exist because MDX files are executed during the build.

## Helpful links

- [Live documentation](https://generaltranslation.com/docs)
- [Discord](https://discord.gg/W99K6fchSu)
