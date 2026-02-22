# General Translation Docs Style Guide

This guide documents the conventions and patterns used across the General Translation documentation. Follow these rules when writing or reviewing content in this repo.

---

## File Format

- All content files use **`.mdx`** (Markdown with JSX support).
- Use UTF-8 encoding, LF line endings.

## Frontmatter

Every MDX file must start with a YAML frontmatter block.

### Docs pages

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

## Heading Hierarchy

- **H1 (`#`)**: Reserved for the page title (set via frontmatter `title`). Do not use `#` headings in the body.
- **H2 (`##`)**: Top-level sections (e.g., `## Overview`, `## Usage`, `## Flags`).
- **H3 (`###`)**: Subsections within an H2.
- **H4 (`####`)**: Use sparingly, only when a third level is genuinely needed.
- Never skip heading levels (e.g., don't jump from H2 to H4).

## Product and Technology Names

Use the **official capitalization and spelling** for all product and technology names:

| ✅ Correct | ❌ Incorrect |
| --- | --- |
| Next.js | NextJS, Nextjs, next.js |
| TypeScript | Typescript, typescript |
| JavaScript | Javascript, javascript |
| ESLint | eslint, Eslint |
| React Native | react native, React native |
| Node.js | NodeJS, Nodejs |
| General Translation | General Translations, general translation |
| `gt-next` | GT Next, gt next |
| `gt-react` | GT React, gt react |
| `gtx-cli` | GTX CLI (in prose, use backticks: `gtx-cli`) |
| `gt.config.json` | GT config, gt config json |

Package names (`gt-next`, `gt-react`, `gtx-cli`, `generaltranslation`) should always appear in **backticks** when referenced in prose.

## Grammar and Usage

### Verb vs. noun/adjective forms

| Context | Correct | Incorrect |
| --- | --- | --- |
| Verb ("to set up") | "set up your project" | "setup your project" |
| Noun/adjective | "the setup wizard" | "the set up wizard" |
| Verb ("to check out") | "check out the docs" | "checkout the docs" |
| Noun | "the checkout page" | "the check out page" |
| Verb ("to log in") | "log in to the dashboard" | "login to the dashboard" |
| Noun/adjective | "the login page" | "the log in page" |

### Articles

- Use **"an"** before vowel sounds: "an HTML element", "an LLM", "an API key"
- Use **"a"** before consonant sounds: "a URL", "a user"

### Common corrections

| ✅ Correct | ❌ Incorrect |
| --- | --- |
| Oftentimes | Often times |
| one-stop shop | one stop shop |
| step-by-step | step by step (when used as adjective) |
| fall back (verb) | fallback (verb) |
| fallback (noun/adj) | fall back (noun/adj) |
| nested | nexted |
| original | originial |
| preferred | perferred |
| "is" for singular subjects | "are" for singular subjects |
| "will not be translated" | "will not translated" |
| "If you want to" | "If want to" |
| "will not occur in production" | "will not occur during for production" |

### Referring to General Translation

Always write **"General Translation"** (singular). Never "General Translations".

The API is the **"General Translation API"**, not "General Translations API".

## Code Examples

### Language tags

Always use a language identifier on fenced code blocks:

````markdown
```tsx
// TypeScript + JSX
```

```bash
npm i gt-next
```

```json
{
  "defaultLocale": "en"
}
```
````

Common tags used in these docs: `tsx`, `jsx`, `ts`, `js`, `bash`, `json`, `yaml`, `html`, `markdown`.

### Variable naming conventions

- Use **`t`** (not `d`) for the translation function returned by `useTranslations()` or `getTranslations()`:

```tsx
const t = useTranslations();
t('greeting.hello');
```

### Code highlighting

Use `// [!code highlight]` for highlighting specific lines in code blocks (Fumadocs syntax).

### File titles

Use the `title` attribute on code blocks to indicate which file the code belongs to:

````markdown
```tsx title="src/App.tsx"
import { GTProvider } from 'gt-react';
```
````

## Links

### Internal links

- Always use **absolute paths starting with `/`**: `/docs/next/api/components/t`
- Never use relative paths without a leading slash: ~~`docs/next/api/components/t`~~
- Link to the logical page path (not the file path). Omit `en-US/` and `.mdx`:
  - ✅ `/docs/next/guides/t`
  - ❌ `/docs/en-US/next/guides/t.mdx`

### Link format

Use standard Markdown links:

```markdown
[`<T>` component](/docs/next/api/components/t)
[`useTranslations`](/docs/next/api/dictionary/use-translations)
```

For API references in code-centric contexts, wrap component/function names in backticks inside the link text.

### Verify links exist

Before adding a link, verify the target page exists. Broken links are one of the most common issues in this repo. If a page doesn't exist yet, either omit the link or note it as "coming soon".

## Callouts

Use the `<Callout>` component for tips, warnings, and notes:

```mdx
<Callout type='info'>
  **Note:** This command requires a production API key!
</Callout>

<Callout type="warn">
  **For Production Use Only!**
  This command should not be used in development.
</Callout>
```

Supported types: `info`, `warn`, `error`.

## Tables

- Use standard Markdown tables.
- Align columns consistently with padding.
- For parameter/flag tables, use this column order: Parameter, Description, Type, Optional, Default.

## Templates (`docs-templates/`)

Many docs pages under `docs/en-US/` are **auto-generated** from templates in `docs-templates/`. These files contain a comment at the top:

```mdx
{/* AUTO-GENERATED: Do not edit directly. Edit the template in content/docs-templates/ instead. */}
```

When fixing issues in generated files:
1. **Always fix the template first** (`docs-templates/`).
2. Then fix or regenerate the generated files (`docs/en-US/`).
3. If you only fix the generated file, your changes will be overwritten.

Templates use placeholders like `__DOCS_PATH__` and `__PACKAGE_NAME__` which are replaced during generation.

## Tone and Voice

- **Direct and practical**: Get to the point. Prefer "Install the package" over "You'll want to install the package".
- **Second person**: Address the reader as "you" / "your".
- **Present tense**: "This function returns..." not "This function will return..."
- **Active voice**: "The CLI tool translates your files" not "Your files are translated by the CLI tool".
- **Concise**: Avoid filler words. Cut "basically", "simply", "just", "very" where they add nothing.
- **Technical but accessible**: Don't over-explain obvious things, but don't assume deep framework knowledge either.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `fix:` for corrections (typos, broken links, grammar)
- `docs:` for new content or significant rewrites
- `feat:` for new pages or features
- `blog:` / `devlog:` for blog/devlog-specific changes

Keep the subject line concise. Use the body for details when a PR touches multiple files:

```
fix: correct grammar and typos across templates and generated docs

- "originial" → "original" (5 files)
- "not occur during for" → "not occur in" (8 files)
- "will not translated" → "will not be translated" (4 files)
```

## CI Restrictions

The following are **blocked by CI** and will fail your PR:

- `import` or `export` statements in MDX files
- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, or `<style>` tags
- `on*=` event handler attributes
- `javascript:` URLs
