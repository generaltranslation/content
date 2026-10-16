/**
 * Unit tests for the blog order validator.
 *
 * Usage: npx tsx test-validate-blog-order.ts
 */

import { findBlogOrderProblems } from "./validate-blog-order.ts";

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

console.log("\nBlog order validator\n");

const slugs = ["alpha", "beta", "gamma"];

assertEqual(
  findBlogOrderProblems(["gamma", "alpha", "beta"], slugs).length,
  0,
  "accepts a list naming every post exactly once, in any order"
);

assertEqual(
  findBlogOrderProblems([], []).length,
  0,
  "accepts an empty list when there are no posts"
);

assertEqual(
  findBlogOrderProblems({ posts: slugs }, slugs)[0],
  "blog/order.json must be a JSON array of post slugs.",
  "rejects a shape that is not an array"
);

assertEqual(
  findBlogOrderProblems(["alpha", 2, "beta", "gamma"], slugs)[0],
  "Entry 1 is 2; every entry must be a post slug string.",
  "rejects a non-string entry"
);

assertEqual(
  findBlogOrderProblems(["alpha", "beta", "alpha", "gamma"], slugs)[0],
  '"alpha" is listed more than once.',
  "rejects a slug listed twice"
);

assertEqual(
  findBlogOrderProblems(["alpha", "beta", "gamma", "delta"], slugs)[0],
  '"delta" has no post at blog/en-US/delta.mdx.',
  "rejects a slug with no post"
);

assertEqual(
  findBlogOrderProblems(["alpha", "beta"], slugs)[0],
  'blog/en-US/gamma.mdx is not listed; add "gamma" where it should appear.',
  "rejects a post the list leaves out"
);

assertEqual(
  findBlogOrderProblems(["alpha", "alpha", "delta"], slugs).length,
  4,
  "reports every problem at once"
);

console.log(`\n${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
