import {
  applyReferenceLinkFixes,
  buildReferenceSymbolIndex,
  findUnlinkedReferenceSymbols,
  type ReferenceSource,
} from './validate-reference-links.ts';

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${message}`);
    return;
  }

  failed++;
  console.log(`  ❌ ${message}`);
  console.log(`     Expected: ${JSON.stringify(expected)}`);
  console.log(`     Actual:   ${JSON.stringify(actual)}`);
}

const references: ReferenceSource[] = [
  {
    path: 'docs/en-US/react/reference/components/t.mdx',
    source: '---\ntitle: T\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/hooks/use-gt.mdx',
    source: '---\ntitle: useGT\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/functions/load-translations.mdx',
    source: '---\ntitle: loadTranslations\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/config.mdx',
    source: [
      '---',
      'title: Configuration',
      '---',
      '',
      '### `initializeGT` [#initialize]',
      '### `initializeGTSPA` [#initialize-spa]',
      '### `defaultLocale` [#default-locale]',
    ].join('\n'),
  },
  {
    path: 'docs/en-US/node/reference/functions/get-gt.mdx',
    source: '---\ntitle: getGT\n---\n',
  },
  {
    path: 'docs/en-US/react/(frameworks)/nextjs/reference/functions/get-gt.mdx',
    source: '---\ntitle: getGT\n---\n',
  },
  {
    path: 'docs/en-US/python/reference/functions/declare-var.mdx',
    source: '---\ntitle: declare_var\n---\n',
  },
  {
    path: 'docs/en-US/python/reference/classes/translations-loader.mdx',
    source: '---\ntitle: TranslationsLoader\n---\n',
  },
  {
    path: 'docs/en-US/cli/reference/commands/translate.mdx',
    source: '---\ntitle: gt translate\n---\n',
  },
  {
    path:
      'docs/en-US/platform/core/reference/utility-functions/locales/get-locale-properties.mdx',
    source: '---\ntitle: getLocaleProperties\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/components.mdx',
    source: '---\ntitle: Components\n---\n\n### `<T>`\n\n### `<Var>`\n',
  },
  {
    path: 'docs/en-US/vue/reference/functions.mdx',
    source:
      '---\ntitle: Functions\n---\n\n### `createGT`\n\n### `useGT`\n',
  },
  {
    path: 'docs/en-US/react/reference/recording-demos.mdx',
    source:
      '---\ntitle: Localized recordings\n---\n\n### `<GTRecorder>`\n\n### `useRecorder`\n',
  },
];

const index = buildReferenceSymbolIndex(references);

console.log('\nReference inline-code link validator\n');

const skippedCases = [
  {
    name: 'frontmatter',
    path: 'docs/en-US/react/guides/example.mdx',
    source: '---\ndescription: Use `useGT()`.\n---\n\nBody.',
  },
  {
    name: 'heading',
    path: 'docs/en-US/react/guides/example.mdx',
    source: '## Use `useGT()` [#use-gt]\n',
  },
  {
    name: 'fenced code',
    path: 'docs/en-US/react/guides/example.mdx',
    source: '```tsx\nuseGT()\n```\n',
  },
  {
    name: 'existing link',
    path: 'docs/en-US/react/guides/example.mdx',
    source: '[`useGT()`](/docs/react/reference/hooks/use-gt)',
  },
  {
    name: 'self-link',
    path: 'docs/en-US/react/reference/hooks/use-gt.mdx',
    source: 'Call `useGT()` in a component.',
  },
  {
    name: 'grouped Vue self-link',
    path: 'docs/en-US/vue/reference/functions.mdx',
    source: 'Call `useGT()` in a component.',
  },
  {
    name: 'config key without a dedicated API page',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'Set `defaultLocale` in the config.',
  },
  {
    name: 'config key matching another package API',
    path: 'docs/en-US/node/reference/config.mdx',
    source:
      '## `loadTranslations` [#load-translations]\n\nSet `loadTranslations` once.',
  },
  {
    name: 'same-named type from another package',
    path: 'docs/en-US/node/reference/config.mdx',
    source: 'The loader has type `TranslationsLoader`.',
  },
  {
    name: 'returned callback with a standalone namesake',
    path: 'docs/en-US/react/reference/hooks/use-locale-selector.mdx',
    source:
      'The returned `getLocaleProperties` callback uses the configured custom mapping.',
  },
];

for (const testCase of skippedCases) {
  assertEqual(
    findUnlinkedReferenceSymbols(testCase.source, testCase.path, index).length,
    0,
    `skips ${testCase.name}`
  );
}

const foundCases = [
  {
    name: 'component angle brackets',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'Wrap the content in `<T>`.',
    target: '/docs/react/reference/components/t',
  },
  {
    name: 'function call parentheses',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'Call `useGT()` for dynamic strings.',
    target: '/docs/react/reference/hooks/use-gt',
  },
  {
    name: 'grouped Vue component',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Wrap the content in `<T>`.',
    target: '/docs/vue/reference/components#t',
  },
  {
    name: 'grouped Vue function',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Call `useGT()` for dynamic strings.',
    target: '/docs/vue/reference/functions#usegt',
  },
  {
    name: 'grouped recording API',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'Mount `<GTRecorder>` once.',
    target: '/docs/react/reference/recording-demos#gtrecorder',
  },
  {
    name: 'anchor-level initializeGT',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'Server rendering uses `initializeGT()`.',
    target: '/docs/react/reference/config#initialize',
  },
  {
    name: 'anchor-level initializeGTSPA',
    path: 'docs/en-US/react/guides/example.mdx',
    source: 'A browser app uses `initializeGTSPA()`.',
    target: '/docs/react/reference/config#initialize-spa',
  },
  {
    name: 'Python snake_case',
    path: 'docs/en-US/python/guides/example.mdx',
    source: 'Wrap runtime values with `declare_var()`.',
    target: '/docs/python/reference/functions/declare-var',
  },
  {
    name: 'CLI command with arguments',
    path: 'docs/en-US/cli/guides/example.mdx',
    source: 'Run `npx gt translate --locales es` before release.',
    target: '/docs/cli/reference/commands/translate',
  },
  {
    name: 'package context',
    path: 'docs/en-US/node/guides/example.mdx',
    source: 'In `gt-node`, call `getGT()` before translating.',
    target: '/docs/node/reference/functions/get-gt',
  },
  {
    name: 'standalone utility outside the narrow exclusion',
    path: 'docs/en-US/platform/core/guides/example.mdx',
    source:
      'Import the standalone `getLocaleProperties()` utility from `generaltranslation`.',
    target:
      '/docs/platform/core/reference/utility-functions/locales/get-locale-properties',
  },
];

for (const testCase of foundCases) {
  const findings = findUnlinkedReferenceSymbols(
    testCase.source,
    testCase.path,
    index
  );
  assertEqual(findings.length, 1, `finds ${testCase.name}`);
  assertEqual(findings[0]?.target?.url, testCase.target, `resolves ${testCase.name}`);
}

const ambiguous = findUnlinkedReferenceSymbols(
  'In `gt-node` and `gt-next`, call `getGT()` to create a translation function.',
  'blog/en-US/example.mdx',
  index
);
assertEqual(ambiguous.length, 1, 'reports a genuinely ambiguous symbol');
assertEqual(ambiguous[0]?.target, undefined, 'does not guess an ambiguous target');

const fixSource = 'Before **formatting**, call `useGT()`; after.';
const fixed = applyReferenceLinkFixes(
  fixSource,
  findUnlinkedReferenceSymbols(
    fixSource,
    'docs/en-US/react/guides/example.mdx',
    index
  )
);
assertEqual(
  fixed,
  'Before **formatting**, call [`useGT()`](/docs/react/reference/hooks/use-gt); after.',
  'fixes by source offsets without changing surrounding formatting'
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} reference link validator test(s) failed`);
}
