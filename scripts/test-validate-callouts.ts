/**
 * Unit tests for the Callout type validator.
 *
 * Usage: npx tsx test-validate-callouts.ts
 */

import {
  findUnsupportedCalloutTypes,
  SUPPORTED_CALLOUT_TYPES,
} from "./validate-callouts.ts";

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

console.log("\nCallout type validator\n");

assertEqual(
  findUnsupportedCalloutTypes("<Callout>Default info</Callout>").length,
  0,
  "allows an omitted type because info is the default"
);

for (const type of SUPPORTED_CALLOUT_TYPES) {
  assertEqual(
    findUnsupportedCalloutTypes(
      `<Callout type="${type}">Supported</Callout>`
    ).length,
    0,
    `allows the ${type} type`
  );
}

assertEqual(
  findUnsupportedCalloutTypes(
    "Before <Callout type='warn'>Supported</Callout> after"
  ).length,
  0,
  "allows a supported type on an inline Callout"
);

const unsupportedFindings = findUnsupportedCalloutTypes(
  [
    "---",
    "title: Example",
    "---",
    "",
    '<Callout type="danger">Unsupported</Callout>',
  ].join("\n")
);
assertEqual(unsupportedFindings.length, 1, "rejects an unsupported type");
assertEqual(
  unsupportedFindings[0]?.type,
  "danger",
  "reports the unsupported type"
);
assertEqual(
  unsupportedFindings[0]?.line,
  5,
  "preserves the source line after frontmatter"
);
assertEqual(
  unsupportedFindings[0]?.column,
  10,
  "reports the type attribute column"
);

assertEqual(
  findUnsupportedCalloutTypes('<Callout type={kind}>Dynamic</Callout>')[0]
    ?.type,
  "expression",
  "rejects a type that cannot be statically verified"
);

assertEqual(
  findUnsupportedCalloutTypes("<Callout type>Boolean</Callout>")[0]?.type,
  "true",
  "rejects a boolean type attribute"
);

const codeExample = [
  "```mdx",
  '<Callout type="danger">Example</Callout>',
  "```",
  "",
  'Use `<Callout type="danger">` to demonstrate an invalid value.',
].join("\n");
assertEqual(
  findUnsupportedCalloutTypes(codeExample).length,
  0,
  "allows unsupported types inside fenced and inline code"
);

assertEqual(
  findUnsupportedCalloutTypes(
    '<MyCallout type="danger">Custom</MyCallout>'
  ).length,
  0,
  "ignores other components"
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} Callout validator test(s) failed`);
}
