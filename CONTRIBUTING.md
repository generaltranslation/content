# Contributing to General Translation Content

Thank you for your interest in improving our documentation, blog, and devlog content. This guide covers everything you need to know to submit a content contribution.

## How to contribute

1. **Fork** this repository
2. **Create a branch** for your changes (e.g. `fix/typo-in-quickstart`, `docs/add-caching-guide`)
3. **Make your edits** following the conventions below
4. **Open a pull request** against `main`

A maintainer will review your PR. CI checks will run automatically to validate your changes.

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

These restrictions exist because MDX files are executed during the build. If you need custom components, propose the change in the main [gt-cloud](https://github.com/generaltranslation/gt-cloud) repository instead.

## Helpful links

- [Live documentation](https://generaltranslation.com/docs)
- [Discord community](https://discord.gg/W99K6fchSu)
- [GitHub Discussions](https://github.com/generaltranslation/gt/discussions)
