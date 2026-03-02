# General Translation Docs Style Guide

This guide documents the conventions and patterns used across the General Translation documentation. Follow these rules when writing or reviewing docs content.

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

### "Data" is singular

Treat **"data"** as a singular noun: "the data is stored", not "the data are stored".

### Referring to General Translation

Always write **"General Translation"** (singular). Never "General Translations".

The API is the **"General Translation API"**, not "General Translations API".

You may abbreviate to **"GT"** when it's clear from context that you mean General Translation.

## Headings

- Use **sentence case**: capitalize the first word and proper nouns only.
  - ✅ `## Common issues`
  - ❌ `## Common Issues`
- For step-by-step guides, use H3 with numbered steps: `### Step 1: Create dictionary`

## Lists

- Use `-` for bullet lists (except in `## Notes` sections of API pages, which use `*`).
- **Fragment list items** (not full sentences): no trailing period.
  - ✅ `- **Centralized storage** - All translations in one place`
- **Full-sentence list items**: end with a period.
  - ✅ `* The \`<Num>\` component formats numbers according to a user's locale.`

## Punctuation

- **Oxford comma**: Use the Oxford comma in series for clarity.
  - ✅ "supports `<Currency>`, `<DateTime>`, and `<Num>`"
- **Em dashes**: Avoid em dashes (`—`). Use spaced hyphens (` - `) or restructure the sentence instead.
- **"i.e." and "e.g."**: Always follow with a comma: `i.e., ...`, `e.g., 'en', 'es-MX'`.

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

Before adding a link, verify the target page exists. If a page doesn't exist yet, either omit the link or note it as "coming soon".

## Callouts

In the docs, use the `<Callout>` component for tips, warnings, and notes.

Supported types: `info`, `warn`, `error`.

Always start callout content with a **bold lead phrase** followed by a colon:

```mdx
<Callout type='info'>
  **Note:** This command requires a production API key!
</Callout>

<Callout type="warn">
  **For Production Use Only!** This command should not be used in development.
</Callout>
```

Common bold leads: `**Note:**`, `**Quick Setup:**`, `**Recommendation:**`, `**Default behavior:**`, `**File location:**`.

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
Keep the subject line concise. Use the body for details when a PR touches multiple files:

```
fix: correct grammar and typos across templates and generated docs

- "originial" → "original" (5 files)
- "not occur during for" → "not occur in" (8 files)
- "will not translated" → "will not be translated" (4 files)
```

## Page Structure

### API reference pages

Follow this section order:

1. `## Overview` — brief description
2. `## Reference` — with subsections: `### Props`, `### Description`, `### Returns`, `### Throws`
3. `## Examples` — code samples with `copy` attribute on code blocks
4. `## Notes` — bullet list (use `*` marker) of important details
5. `## Next steps` — links to related pages

Separate major sections with horizontal rules (`---`).

### Guide pages

Follow this section order:

1. Introductory paragraph
2. `## Quickstart` (if applicable)
3. Topic sections
4. `## Common issues` (if applicable)
5. `## Next steps`

Do not use horizontal rules between sections in guides.

### "Next steps" format

End pages with a `## Next steps` section containing a bullet list of links:

```markdown
## Next steps

- [Display text](/docs/path) - Brief description of where the link leads
```

## Common Components

### Correct/incorrect examples

Use ✅/❌ emoji in code comments and prose to flag correct and incorrect patterns:

```jsx
// ❌ Wrong - dynamic content not wrapped
<T>Hello {name}</T>

// ✅ Correct - use Variable components
<T>Hello <Var>{name}</Var></T>
```

### Package manager tabs

Always list all four package managers in this order:

```mdx
<Tabs items={['npm', 'yarn', 'bun', 'pnpm']}>
```

### Directory structures

Use `<Files>`, `<Folder>`, and `<File>` components instead of ASCII tree diagrams.

### Accordions

Use `<Accordions>` / `<Accordion>` for troubleshooting and optional content. The title should be a question:

```mdx
<Accordion title="Why do languages take a long time to load in dev?">
```

### Props documentation

Pair a `<TypeTable>` component (for type info) with a markdown table (for prose descriptions). Use this column order: Prop, Description.

### Custom anchors

Add custom anchors to headings for stable linking:

```markdown
### Using variables [#variables]
```

## Template Placeholders

Templates in `docs-templates/` use these placeholders, which are replaced during generation:

| Placeholder | Meaning |
| --- | --- |
| `__DOCS_PATH__` | Base path for docs links (e.g., `/docs/next`) |
| `__PACKAGE_NAME__` | Package name (e.g., `gt-next`) |
| `__FRAMEWORK_NAME__` | Framework name (e.g., `Next.js`) |

## CI Restrictions

The following are **blocked by CI** and will fail your PR:

- `import` or `export` statements in MDX files
- `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, or `<style>` tags
- `on*=` event handler attributes
- `javascript:` URLs
