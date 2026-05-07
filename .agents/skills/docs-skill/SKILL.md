---
name: docs-skill
description: General Translation documentation style and MDX conventions. Use when writing, editing, reviewing, or generating docs content in this repository, especially files under docs/**, docs-templates/**, blog/**, devlog/**, or any task that references STYLE_GUIDE.md.
---

# General Translation Docs

Use this skill as the source of truth for General Translation documentation content.

## Required workflow

1. Before changing docs, read `references/style-guide.md`.
2. Check whether the target file is generated from `docs-templates/`. If it has an auto-generated comment, update the template first and then fix or regenerate the generated docs file.
3. Preserve the existing MDX component conventions, frontmatter shape, and page structure around the file being edited.
4. Verify internal links point to logical absolute docs paths and that linked pages exist before adding them.
5. Keep copy direct, practical, second person, present tense, active voice, and concise.

## Reference

- `references/style-guide.md` - Complete docs style guide: MDX format, frontmatter, headings, naming, grammar, code examples, links, callouts, tables, templates, tone, page structure, components, placeholders, and CI restrictions.

## Non-negotiable rules

- All content files use `.mdx` and start with YAML frontmatter.
- Do not use `#` headings in body content; the H1 comes from frontmatter `title`.
- Use sentence case for headings and never skip heading levels.
- Use official product and package naming. Package names such as `gt-next`, `gt-react`, `gt`, and `generaltranslation` use backticks in prose.
- Use absolute internal links beginning with `/`, omit `en-US/` and `.mdx`, and verify targets exist.
- Use `<Callout>` for notes, tips, and warnings, with a bold lead phrase.
- For generated docs, fix templates in `docs-templates/` before generated files under `docs/en-US/`.
- Avoid CI-blocked MDX content: imports, exports, scripts, unsafe embedded tags, event handlers, and `javascript:` URLs.
