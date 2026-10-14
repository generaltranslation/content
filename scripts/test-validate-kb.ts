/**
 * Unit tests for the knowledge base validator.
 *
 * Usage: npx tsx test-validate-kb.ts
 */

import { findKbProblems, type KbContext, type KbEntry } from "./validate-kb.ts";

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual:   ${JSON.stringify(actual)}`);
  }
}

const context: KbContext = {
  liveSlugs: [],
  authors: ["jackie", "default"],
  today: "2026-10-13",
};

const BODY = `## The problem\n\n${"Plural rules differ by language. ".repeat(12)}\n`;

/** A valid article; each test overrides only what it checks. */
const article = (
  name: string,
  frontmatter: Record<string, unknown> = {},
  body = BODY
): KbEntry => ({
  name,
  isDirectory: false,
  frontmatter: {
    title: `How does ${name} work?`,
    summary: "It works by following the rules.",
    date: "2026-01-01",
    authors: ["jackie"],
    ...frontmatter,
  },
  body,
});

const first = (entries: KbEntry[], overrides: Partial<KbContext> = {}) =>
  findKbProblems(entries, { ...context, ...overrides })[0];

console.log("\nKnowledge base validator\n");

// Files and slugs

assertEqual(
  findKbProblems(
    [article("how-plurals-work.mdx", { redirectFrom: ["plurals"] }), article("other.mdx")],
    { ...context, liveSlugs: ["live-post"] }
  ).length,
  0,
  "accepts flat articles with distinct redirects from retired posts"
);

assertEqual(
  first([{ name: "guides", isDirectory: true }]),
  "kb/guides is a folder; kb/ holds only <slug>.mdx files.",
  "rejects a subfolder"
);

assertEqual(
  first([{ name: "notes.md", isDirectory: false }]),
  "kb/notes.md is not an .mdx file.",
  "rejects a non-.mdx file"
);

assertEqual(
  first([article("bad.slug.mdx")]),
  'kb/bad.slug.mdx: the slug may contain only letters, digits, "-", and "_".',
  "rejects a slug the site cannot serve"
);

assertEqual(
  first([article("sitemap.mdx")]),
  'kb/sitemap.mdx: "sitemap" is a reserved slug.',
  "rejects a reserved slug"
);

// Frontmatter

assertEqual(
  first([{ name: "a.mdx", isDirectory: false, body: BODY }]),
  "kb/a.mdx: frontmatter is missing or is not valid YAML.",
  "rejects an article without frontmatter"
);

assertEqual(
  first([article("a.mdx", { summary: undefined })]),
  "kb/a.mdx: frontmatter is missing summary.",
  "rejects a missing required field"
);

assertEqual(
  first([article("a.mdx", { relatd: ["b"] })]),
  'kb/a.mdx: unknown frontmatter field "relatd".',
  "rejects an unknown frontmatter field"
);

// Titles

assertEqual(
  first([article("a.mdx", { title: "x".repeat(91) })]),
  "kb/a.mdx: title is 91 characters; keep it to 90 or fewer.",
  "rejects a title over 90 characters"
);

assertEqual(
  first([
    article("a.mdx", { title: "How do plurals work?" }),
    article("b.mdx", { title: "How do Plurals work?" }),
  ]),
  'kb/b.mdx: title "How do Plurals work?" duplicates kb/a.mdx.',
  "rejects two articles with the same title"
);

assertEqual(
  first([article("a.mdx", { title: "" })]),
  "kb/a.mdx: title must be non-empty text.",
  "rejects an empty title"
);

assertEqual(
  first([article("a.mdx", { title: 42 })]),
  "kb/a.mdx: title must be non-empty text.",
  "rejects a title that is not text"
);

assertEqual(
  first([article("a.mdx", { noindex: "yes" })]),
  "kb/a.mdx: noindex must be true or false.",
  "rejects a noindex the site would ignore"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", { noindex: true }), article("b.mdx", { noindex: false })],
    context
  ).length,
  0,
  "accepts noindex true or false"
);

// Summaries

assertEqual(
  first([article("a.mdx", { summary: `${"word ".repeat(61).trim()}.` })]),
  "kb/a.mdx: summary is 61 words; keep it to 60 or fewer.",
  "rejects a summary over 60 words"
);

assertEqual(
  first([article("a.mdx", { summary: "It works by following the rules" })]),
  "kb/a.mdx: summary must end with a period.",
  "rejects a summary without a closing period"
);

assertEqual(
  first([article("a.mdx", { summary: "Use the `<Plural>` component." })]),
  "kb/a.mdx: summary must not contain backticks or Markdown links.",
  "rejects backticks in the summary"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", { summary: "Use the <Plural> component from gt-next." })],
    context
  ).length,
  0,
  "accepts a bare component tag in the summary"
);

// Authors

assertEqual(
  first([article("a.mdx", { authors: ["nobody"] })]),
  'kb/a.mdx: author "nobody" has no file in authors/.',
  "rejects an author without an authors/ file"
);

assertEqual(
  first([article("a.mdx", { authors: "jackie" })]),
  "kb/a.mdx: authors must be a list of author slugs from authors/.",
  "rejects authors that is not a list"
);

assertEqual(
  findKbProblems(
    [
      article("a.mdx", { authors: undefined }),
      article("b.mdx", { authors: [] }),
    ],
    context
  ).length,
  0,
  "accepts an article without authors, which the site credits to the team"
);

assertEqual(
  findKbProblems([article("a.mdx", { authors: ["default"] })], context).length,
  0,
  "accepts the team author"
);

// Dates

assertEqual(
  first([article("a.mdx", { date: "2026-02-30" })]),
  "kb/a.mdx: date must be a real YYYY-MM-DD date.",
  "rejects an impossible date"
);

assertEqual(
  first([article("a.mdx", { date: "2026-10-14" })]),
  "kb/a.mdx: date 2026-10-14 is in the future.",
  "rejects a future date"
);

assertEqual(
  findKbProblems([article("a.mdx", { updated: "2026-10-13" })], context).length,
  0,
  "accepts an updated date from the publish date to today"
);

assertEqual(
  first([article("a.mdx", { updated: "2026-13-01" })]),
  "kb/a.mdx: updated must be a real YYYY-MM-DD date.",
  "rejects an impossible updated date"
);

assertEqual(
  first([article("a.mdx", { updated: "2026-10-14" })]),
  "kb/a.mdx: updated 2026-10-14 is in the future.",
  "rejects a future updated date"
);

assertEqual(
  first([article("a.mdx", { updated: "2025-12-31" })]),
  "kb/a.mdx: updated 2025-12-31 is before date 2026-01-01.",
  "rejects an updated date before the publish date"
);

// Body

assertEqual(
  first([article("a.mdx", {}, "## Soon\n\nComing soon.\n")]),
  "kb/a.mdx: the body has fewer than 50 words of text and no code; it reads as a placeholder.",
  "rejects an empty-looking article"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", {}, "## The solution\n\nCall it:\n\n```python\ntime.sleep(5)\n```\n")],
    context
  ).length,
  0,
  "accepts a short answer that has code"
);

assertEqual(
  first([article("a.mdx", {}, `# Heading\n\n${BODY}`)]),
  "kb/a.mdx: line 1 uses a level-1 heading; the title is the page heading, so start at ##.",
  "rejects a level-1 heading in the body"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\n#### Deep\n\nText.\n`)]),
  "kb/a.mdx: line 5 jumps from a level-2 to a level-4 heading.",
  "rejects a skipped heading level"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\n\`\`\`\nnpm install gt-next\n\`\`\`\n`)]),
  "kb/a.mdx: line 5 starts a code block without a language tag.",
  "rejects a code block without a language tag"
);

assertEqual(
  first([article("a.mdx", {}, `## TL;DR\n\n${BODY}`)]),
  'kb/a.mdx: line 1 contains "TL;DR"; the summary is the short answer.',
  "rejects a TL;DR section"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\nIn conclusion, plurals are hard.\n`)]),
  'kb/a.mdx: line 5 contains "In conclusion".',
  "rejects filler phrasing"
);

assertEqual(
  first([
    article(
      "a.mdx",
      {},
      `${BODY}\nFirst line\nsecond line\nIn conclusion, plurals are hard.\n`
    ),
  ]),
  'kb/a.mdx: line 7 contains "In conclusion".',
  "reports the line a phrase is on, not where its paragraph starts"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\nFirst line\nTODO: add an example.\n`)]),
  'kb/a.mdx: line 6 contains the placeholder "TODO".',
  "reports the line a placeholder is on"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\n## Next steps\n\nRead more.\n`)]),
  'kb/a.mdx: line 5 is a "Next steps" section; the article footer adds related questions.',
  "rejects a hand-written next-steps section"
);

assertEqual(
  first([article("a.mdx", {}, `${BODY}\nTODO: add an example.\n`)]),
  'kb/a.mdx: line 5 contains the placeholder "TODO".',
  "rejects leftover placeholders"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", {}, `${BODY}\n\`\`\`ts\n// TODO: handle errors\n\`\`\`\n`)],
    context
  ).length,
  0,
  "ignores placeholders inside code blocks"
);

assertEqual(
  first([article("a.mdx", {}, "## Broken\n\n<Callout>\n")])?.startsWith(
    "kb/a.mdx: the body is not valid MDX ("
  ),
  true,
  "reports a body that does not parse"
);

// redirectFrom

assertEqual(
  first([article("a.mdx", { redirectFrom: "plurals" })]),
  "kb/a.mdx: redirectFrom must be a list of blog post slugs.",
  "rejects a redirectFrom that is not a list"
);

assertEqual(
  first([article("a.mdx", { redirectFrom: ["live-post"] })], {
    liveSlugs: ["live-post"],
  }),
  'kb/a.mdx: redirectFrom "live-post" is a live post; the redirect would hide it.',
  "rejects a redirect from a live post"
);

assertEqual(
  first([
    article("a.mdx", { redirectFrom: ["plurals"] }),
    article("b.mdx", { redirectFrom: ["plurals"] }),
  ]),
  'kb/b.mdx: redirectFrom "plurals" is already claimed by kb/a.mdx.',
  "rejects two articles claiming the same redirect"
);

// related

assertEqual(
  findKbProblems(
    [article("a.mdx", { related: ["b", "c"] }), article("b.mdx"), article("c.mdx")],
    context
  ).length,
  0,
  "accepts related articles that exist"
);

assertEqual(
  first([article("a.mdx", { related: "b" }), article("b.mdx")]),
  "kb/a.mdx: related must be a list of Knowledge Base article slugs.",
  "rejects a related that is not a list"
);

assertEqual(
  first([article("a.mdx", { related: ["missing"] })]),
  'kb/a.mdx: related "missing" is not a Knowledge Base article.',
  "rejects a related article that does not exist"
);

assertEqual(
  first([article("a.mdx", { related: ["a"] })]),
  'kb/a.mdx: related "a" is the article itself.',
  "rejects an article listed as related to itself"
);

assertEqual(
  first([article("a.mdx", { related: ["b", "b"] }), article("b.mdx")]),
  'kb/a.mdx: related lists "b" more than once.',
  "rejects a related article listed twice"
);

assertEqual(
  first([
    article("a.mdx", { related: ["b", "c", "d", "e", "f", "g"] }),
    ...["b", "c", "d", "e", "f", "g"].map((slug) => article(`${slug}.mdx`)),
  ]),
  "kb/a.mdx: related lists 6 articles; the site shows at most 5.",
  "rejects more related articles than the site shows"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
