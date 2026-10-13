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

const article = (
  name: string,
  redirectFrom?: unknown,
  related?: unknown
): KbEntry => ({
  name,
  isDirectory: false,
  redirectFrom,
  related,
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

assertEqual(
  findKbProblems(
    [
      article("a.mdx", undefined, ["b", "c"]),
      article("b.mdx"),
      article("c.mdx"),
    ],
    []
  ).length,
  0,
  "accepts related articles that exist"
);

assertEqual(
  findKbProblems([article("a.mdx", undefined, "b"), article("b.mdx")], [])[0],
  "kb/a.mdx: related must be a list of Knowledge Base article slugs.",
  "rejects a related that is not a list"
);

assertEqual(
  findKbProblems([article("a.mdx", undefined, ["missing"])], [])[0],
  'kb/a.mdx: related "missing" is not a Knowledge Base article.',
  "rejects a related article that does not exist"
);

assertEqual(
  findKbProblems([article("a.mdx", undefined, ["a"])], [])[0],
  'kb/a.mdx: related "a" is the article itself.',
  "rejects an article listed as related to itself"
);

assertEqual(
  findKbProblems(
    [article("a.mdx", undefined, ["b", "b"]), article("b.mdx")],
    []
  )[0],
  'kb/a.mdx: related lists "b" more than once.',
  "rejects a related article listed twice"
);

assertEqual(
  findKbProblems(
    [
      article("a.mdx", undefined, ["b", "c", "d", "e", "f", "g"]),
      ...["b", "c", "d", "e", "f", "g"].map((slug) => article(`${slug}.mdx`)),
    ],
    []
  )[0],
  "kb/a.mdx: related lists 6 articles; the site shows at most 5.",
  "rejects more related articles than the site shows"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
