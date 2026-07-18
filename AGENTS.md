# AGENTS.md

This repository holds the MDX content (docs, blog, devlog, authors) for generaltranslation.com, plus a Next.js app that renders it and Node scripts that validate it. See `README.md` and `CONTRIBUTING.md` for content structure, and `DOCS-SKILL.md` for docs style conventions.

## Cursor Cloud specific instructions

Dependencies are already installed by the startup update script (`pnpm install` for the workspace, plus `npm --prefix scripts ci` for the standalone `scripts/` project). You should not need to reinstall them.

### Two separate dependency roots
- The repo root is a pnpm workspace (`pnpm-workspace.yaml`) whose only package is `apps/content` (the Fumadocs/Next.js 16 site). Use `pnpm` here.
- `scripts/` is an independent project with its own `package-lock.json` and uses `npm` (CI runs `npm ci` inside `scripts/`). Do not manage it with pnpm.

### Services and how to run them
- Docs site (`apps/content`): dev server via `pnpm --filter ./apps/content dev` (serves on http://localhost:3000). Build via `pnpm build:content` from the root. There is no `/docs` index route — deep-link to a real page such as `/docs/cli/quickstart`.
- The MDX content directories (`docs/`, `blog/`, `devlog/`) live at the repo root, outside `apps/content`; they are wired in via `apps/content/source.config.ts`. `fumadocs-mdx` runs on `postinstall` and on dev/build to generate the `.source/` index, so after adding/removing content files, restart the dev server (or rebuild) if new pages don't appear.

### Validation / tests (all run from `scripts/`)
- `npm test` — runs the link-validator and unsafe-HTML validator unit tests.
- `npx tsx validate-links.ts` — validates all internal links across content.
- `npm run validate:unsafe-html` — blocks disallowed HTML/MDX patterns.
These mirror the CI jobs in `.github/workflows/run-tests.yml` (validate, validate-links, build-content).

### Notes
- `pnpm install` reports "Ignored build scripts: esbuild, sharp"; this is expected and does not block dev, build, or the validators.
