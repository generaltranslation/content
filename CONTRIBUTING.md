# Contributing to General Translation Content

If you've found an error in our docs or have a suggestion, we're open to contributions. Please read through this guide before opening a pull request.

> When contributing to this repo, you must agree that you have authored 100% of the content, that you have the necessary rights to the content, and that the content you contribute may be provided under the project license.

## How to contribute

1. **Fork** this repository
2. **Create a branch** for your changes (e.g. `fix/typo-in-quickstart`)
3. **Make your edits** following the conventions below
4. **Open a pull request** against `main`

A maintainer will review your PR. CI checks will run automatically to validate your changes. Please note that blog posts and devlog entries are written by the General Translation team -- external contributions to docs are more likely to be accepted.

## Content structure

| Directory | What belongs here |
| --- | --- |
| `docs/en-US/` | Documentation pages |
| `blog/en-US/` | Blog posts |
| `devlog/en-US/` | Devlog / release note entries |
| `authors/` | Author profiles |
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
title: Release Title
date: 2025-01-15
authors: [author-slug]
tags: ['package-name', 'version']
---
```

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
