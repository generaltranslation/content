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
    source: '---\ntitle: "<T>"\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/hooks/use-gt.mdx',
    source: '---\ntitle: useGT\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/components/num.mdx',
    source: '---\ntitle: "<Num>"\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/functions/msg.mdx',
    source: '---\ntitle: msg\n---\n',
  },
  {
    path: 'docs/en-US/react/reference/functions/t-function.mdx',
    source: '---\ntitle: t\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/components/t.mdx',
    source: '---\ntitle: "<T>"\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/composables/use-gt.mdx',
    source: '---\ntitle: useGT\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/components/num.mdx',
    source: '---\ntitle: "<Num>"\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/functions/msg.mdx',
    source: '---\ntitle: msg\n---\n',
  },
  {
    path: 'docs/en-US/vue/reference/functions/t.mdx',
    source: '---\ntitle: t\n---\n',
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
    path: 'docs/en-US/cli/reference/commands/project-create.mdx',
    source: '---\ntitle: gt project create\n---\n',
  },
  {
    path: 'docs/en-US/cli/reference/commands/project-status.mdx',
    source: '---\ntitle: gt project status\n---\n',
  },
  {
    path: 'docs/en-US/integrations/rrweb/reference/recorder.mdx',
    source: '---\ntitle: Recorder API\n---\n\n## `GTRecorder` [#gt-recorder]\n',
  },
  {
    path: 'docs/en-US/integrations/rrweb/reference/harvest.mdx',
    source: '---\ntitle: Harvest API\n---\n\n## `harvestLocales` [#harvest-locales]\n',
  },
  {
    path: 'docs/en-US/integrations/rrweb/reference/replayer.mdx',
    source: '---\ntitle: Replayer API\n---\n\n## `GTReplayer` [#gt-replayer]\n',
  },
  {
    path:
      'docs/en-US/platform/core/reference/utility-functions/locales/get-locale-properties.mdx',
    source: '---\ntitle: getLocaleProperties\n---\n',
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
  {
    name: 'generic project field with nested CLI commands',
    path: 'docs/en-US/integrations/sanity/reference/example.mdx',
    source: 'Set the `project` field in the Sanity configuration.',
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
    name: 'Vue component angle brackets',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Wrap the content in `<T>` in a Vue template.',
    target: '/docs/vue/reference/components/t',
  },
  {
    name: 'Vue composable call parentheses',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Call `useGT()` inside a Vue component.',
    target: '/docs/vue/reference/composables/use-gt',
  },
  {
    name: 'Vue module message',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Register shared Vue strings with `msg()`.',
    target: '/docs/vue/reference/functions/msg',
  },
  {
    name: 'Vue SPA translation',
    path: 'docs/en-US/vue/guides/example.mdx',
    source: 'Use `t()` only after the Vue SPA runtime is initialized.',
    target: '/docs/vue/reference/functions/t',
  },
  {
    name: 'generic Vue possessive context',
    path: 'blog/en-US/example.mdx',
    source: "Use Vue's `<Num>` component.",
    target: '/docs/vue/reference/components/num',
  },
  {
    name: 'generic Vue formatting context',
    path: 'blog/en-US/example.mdx',
    source: 'Use the Vue formatting component `<Num>`.',
    target: '/docs/vue/reference/components/num',
  },
  {
    name: 'generic Vue template context',
    path: 'blog/en-US/example.mdx',
    source: 'Use `<T>` in a Vue template.',
    target: '/docs/vue/reference/components/t',
  },
  {
    name: 'generic TypeScript Vue context',
    path: 'blog/en-US/example.mdx',
    source: 'In TypeScript, use `<T>` in a Vue template.',
    target: '/docs/vue/reference/components/t',
  },
  {
    name: 'generic Vue composable context',
    path: 'blog/en-US/example.mdx',
    source: 'Call `useGT()` from a Vue component.',
    target: '/docs/vue/reference/composables/use-gt',
  },
  {
    name: 'generic Vue message context',
    path: 'blog/en-US/example.mdx',
    source: 'Register shared strings with `msg()` in gt-vue.',
    target: '/docs/vue/reference/functions/msg',
  },
  {
    name: 'generic Vue module translation context',
    path: 'blog/en-US/example.mdx',
    source: "Call Vue's `t()` only after SPA initialization.",
    target: '/docs/vue/reference/functions/t',
  },
  {
    name: 'generic React context remains React',
    path: 'blog/en-US/example.mdx',
    source: "Use React's `<Num>` component.",
    target: '/docs/react/reference/components/num',
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
    name: 'nested CLI command with arguments',
    path: 'docs/en-US/cli/guides/example.mdx',
    source: 'Run `npx gt project create --name Storefront` to create a Project.',
    target: '/docs/cli/reference/commands/project-create',
  },
  {
    name: 'nested CLI sibling command',
    path: 'docs/en-US/cli/guides/example.mdx',
    source: 'Run `gt project status job_123` to inspect the setup job.',
    target: '/docs/cli/reference/commands/project-status',
  },
  {
    name: 'package context',
    path: 'docs/en-US/node/guides/example.mdx',
    source: 'In `gt-node`, call `getGT()` before translating.',
    target: '/docs/node/reference/functions/get-gt',
  },
  {
    name: 'rrweb recorder section',
    path: 'docs/en-US/integrations/rrweb/guides/example.mdx',
    source: 'Mount `GTRecorder` once before recording.',
    target: '/docs/integrations/rrweb/reference/recorder#gt-recorder',
  },
  {
    name: 'rrweb harvest section',
    path: 'docs/en-US/integrations/rrweb/guides/example.mdx',
    source: 'Call `harvestLocales()` after capture.',
    target: '/docs/integrations/rrweb/reference/harvest#harvest-locales',
  },
  {
    name: 'rrweb replayer section',
    path: 'docs/en-US/integrations/rrweb/guides/example.mdx',
    source: 'Render `GTReplayer` with the saved bundle.',
    target: '/docs/integrations/rrweb/reference/replayer#gt-replayer',
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
