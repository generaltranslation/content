import {
  promoteExactComponentResults,
  type DocsSearchResult,
} from '../apps/content/src/search-results.ts';

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
    console.log(`     Expected: ${JSON.stringify(expected)}`);
    console.log(`     Actual:   ${JSON.stringify(actual)}`);
  }
}

console.log('\nDocs search result ordering\n');

const results: DocsSearchResult[] = [
  {
    id: 't-function',
    type: 'page',
    content: 't',
    url: '/docs/react/reference/functions/t-function',
  },
  {
    id: 't-function-text',
    type: 'text',
    content: 'Translate strings synchronously.',
    url: '/docs/react/reference/functions/t-function',
  },
  {
    id: 't-component',
    type: 'page',
    content: '<T>',
    url: '/docs/react/reference/components/t',
  },
  {
    id: 't-component-text',
    type: 'text',
    content: 'API reference for the <T> component.',
    url: '/docs/react/reference/components/t',
  },
  {
    id: 'tx-component',
    type: 'page',
    content: '<Tx>',
    url: '/docs/react/nextjs/reference/components/tx',
  },
];

assertEqual(
  promoteExactComponentResults(results, 'T component').map(
    (result) => result.id
  ),
  [
    't-component',
    't-component-text',
    't-function',
    't-function-text',
    'tx-component',
  ],
  'promotes an exact component page and keeps its matches together'
);

assertEqual(
  promoteExactComponentResults(results, '<Tx> component').map(
    (result) => result.id
  ),
  [
    'tx-component',
    't-function',
    't-function-text',
    't-component',
    't-component-text',
  ],
  'promotes framework-specific component pages'
);

assertEqual(
  promoteExactComponentResults(results, 'translate strings').map(
    (result) => result.id
  ),
  results.map((result) => result.id),
  'preserves default ranking for non-component queries'
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} docs search result test(s) failed`);
}
