/**
 * Unit tests for the knowledge base validator.
 *
 * Usage: npx tsx test-validate-kb.ts
 */

import { findKbProblems, type KbEntry } from "./validate-kb.ts";

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

const article = (name: string, redirectFrom?: unknown): KbEntry => ({
  name,
  isDirectory: false,
  redirectFrom,
});

console.log("\nKnowledge base validator\n");

assertEqual(
  findKbProblems(
    [article("how-plurals-work.mdx", ["plurals"]), article("other.mdx")],
    ["live-post"]
  ).length,
  0,
  "accepts flat articles with distinct redirects from retired posts"
);

assertEqual(
  findKbProblems([{ name: "guides", isDirectory: true }], [])[0],
  "kb/guides is a folder; kb/ holds only <slug>.mdx files.",
  "rejects a subfolder"
);

assertEqual(
  findKbProblems([article("notes.md")], [])[0],
  "kb/notes.md is not an .mdx file.",
  "rejects a non-.mdx file"
);

assertEqual(
  findKbProblems([article("bad.slug.mdx")], [])[0],
  'kb/bad.slug.mdx: the slug may contain only letters, digits, "-", and "_".',
  "rejects a slug the site cannot serve"
);

assertEqual(
  findKbProblems([article("sitemap.mdx")], [])[0],
  'kb/sitemap.mdx: "sitemap" is a reserved slug.',
  "rejects a reserved slug"
);

assertEqual(
  findKbProblems([article("a.mdx", "plurals")], [])[0],
  "kb/a.mdx: redirectFrom must be a list of blog post slugs.",
  "rejects a redirectFrom that is not a list"
);

assertEqual(
  findKbProblems([article("a.mdx", ["live-post"])], ["live-post"])[0],
  'kb/a.mdx: redirectFrom "live-post" is a live post; the redirect would hide it.',
  "rejects a redirect from a live post"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", ["plurals"]), article("b.mdx", ["plurals"])],
    []
  )[0],
  'kb/b.mdx: redirectFrom "plurals" is already claimed by kb/a.mdx.',
  "rejects two articles claiming the same redirect"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
