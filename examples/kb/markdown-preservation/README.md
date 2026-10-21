# Markdown and MDX preservation example

This is the executable extraction demonstration from the [Markdown translation article](../../../kb/en-US/translate-markdown-files.mdx). It uppercases text nodes to make the selected content visible; it does not call a translation service.

Use Node.js 22 or later. From this directory:

```bash
npm ci
npm test
npm run demo
```

The lockfile pins the parser and compiler dependencies. `guide.mdx` contains frontmatter, an import, a stable heading ID, inline and fenced code, a link, an admonition, a table, an image, and a component with display text in an attribute.

The tests compare the protected AST fields before and after text replacement, compile both files as MDX, validate YAML, and ensure the article's code matches `extract.mjs`. They also expose two limitations: one sentence becomes several text nodes, and alt text, component attributes, and frontmatter remain untranslated.

This is a parser demonstration, not a production translator. A complete pipeline must preserve sentence context, select display-text fields outside text nodes, handle the site's MDX plugins, resolve imports and links, and pass the actual framework build. A successful syntax compilation does not establish those outcomes or assess translation quality.
