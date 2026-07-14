/**
 * Unit tests for the unsafe HTML validator.
 *
 * Usage: npx tsx test-validate-unsafe-html.ts
 */

import { findUnsafeHtml } from "./validate-unsafe-html.ts";

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

console.log("\nUnsafe HTML validator\n");

const fencedExample = [
  "```html",
  '<script type="module" src="/src/index.ts"></script>',
  "```",
].join("\n");
assertEqual(
  findUnsafeHtml(fencedExample).length,
  0,
  "allows unsafe tag names inside fenced code"
);

assertEqual(
  findUnsafeHtml("Use `<iframe>` to embed another page.").length,
  0,
  "allows unsafe tag names inside inline code"
);

const longerFence = [
  "````html",
  "```",
  '<script src="/example.js"></script>',
  "```",
  "````",
  "<style>body</style>",
].join("\n");
const longerFenceFindings = findUnsafeHtml(longerFence);
assertEqual(
  longerFenceFindings.length,
  1,
  "uses MDX fence parsing instead of a fence-stripping regex"
);
assertEqual(
  longerFenceFindings[0]?.line,
  6,
  "reports the unsafe element after a longer fence"
);

const flowFindings = findUnsafeHtml(
  '<script type="module" src="/src/index.ts"></script>'
);
assertEqual(flowFindings.length, 1, "blocks an unsafe flow element");
assertEqual(flowFindings[0]?.tag, "script", "reports the unsafe tag name");
assertEqual(flowFindings[0]?.line, 1, "reports the source line");
assertEqual(flowFindings[0]?.column, 1, "reports the source column");

const inlineFindings = findUnsafeHtml(
  "Before <iframe src=\"https://example.com\"></iframe> after"
);
assertEqual(inlineFindings.length, 1, "blocks an unsafe inline element");
assertEqual(inlineFindings[0]?.tag, "iframe", "reports an inline tag name");
assertEqual(inlineFindings[0]?.column, 8, "reports an inline source column");

assertEqual(
  findUnsafeHtml("<STYLE>body</STYLE>").length,
  1,
  "matches unsafe element names case-insensitively"
);

assertEqual(
  findUnsafeHtml("&lt;script&gt;alert('example')&lt;/script&gt;").length,
  0,
  "allows escaped text that cannot render as an element"
);

assertEqual(
  findUnsafeHtml("{/* <script>alert('example')</script> */}").length,
  0,
  "allows unsafe tag names inside MDX comments"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} unsafe HTML validator test(s) failed`);
}
