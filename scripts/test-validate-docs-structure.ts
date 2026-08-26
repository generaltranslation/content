import { resolve } from 'node:path';

import {
  collectDocsFiles,
  validateDocsStructure,
  type StructureFinding,
} from './validate-docs-structure.ts';

const DOCS_ROOT = resolve(import.meta.dirname, '..', 'docs', 'en-US');

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

function hasFinding(
  findings: readonly StructureFinding[],
  file: string,
  message: string
): boolean {
  return findings.some(
    (finding) => finding.file === file && finding.message.includes(message)
  );
}

function replaceMeta(
  files: ReadonlyMap<string, string>,
  path: string,
  update: (meta: Record<string, unknown>) => void
): Map<string, string> {
  const copy = new Map(files);
  const parsed: unknown = JSON.parse(copy.get(path) ?? '');
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError(`${path} must contain a JSON object.`);
  }
  update(parsed as Record<string, unknown>);
  copy.set(path, JSON.stringify(parsed));
  return copy;
}

console.log('\nDocumentation structure validator\n');

const repositoryFiles = collectDocsFiles(DOCS_ROOT);

let unexpectedSection = replaceMeta(
  repositoryFiles,
  'node/meta.json',
  (meta) => {
    const pages = meta.pages as string[];
    pages.splice(pages.indexOf('./guides'), 0, './tutorials');
  }
);
unexpectedSection.set(
  'node/tutorials/meta.json',
  JSON.stringify({
    title: 'Tutorials',
    description: 'Tutorial documentation.',
    pages: ['./example'],
  })
);
unexpectedSection.set('node/tutorials/example.mdx', '');
const unexpectedSectionFindings = validateDocsStructure(unexpectedSection);
assertEqual(
  hasFinding(
    unexpectedSectionFindings,
    'node/meta.json',
    'Sidebar sections must be Guides, Reference'
  ),
  true,
  'rejects an unexpected root sidebar section'
);
assertEqual(
  hasFinding(
    unexpectedSectionFindings,
    'node/tutorials/meta.json',
    'must contain at least two navigable entries'
  ),
  true,
  'rejects a single-page root sidebar section'
);

const lowercaseTitle = replaceMeta(
  repositoryFiles,
  'node/guides/meta.json',
  (meta) => {
    meta.title = 'guides';
  }
);
const lowercaseFindings = validateDocsStructure(lowercaseTitle);
assertEqual(
  hasFinding(
    lowercaseFindings,
    'node/guides/meta.json',
    'must use the title "Guides"'
  ),
  true,
  'rejects a lowercase navigation title'
);

const componentPath = 'react/reference/components/t.mdx';
const bareComponentTitle = new Map(repositoryFiles);
bareComponentTitle.set(
  componentPath,
  (bareComponentTitle.get(componentPath) ?? '').replace(
    'title: "<T>"',
    'title: T'
  )
);
assertEqual(
  hasFinding(
    validateDocsStructure(bareComponentTitle),
    componentPath,
    'title must use a quoted component tag'
  ),
  true,
  'rejects a bare React component title'
);

const incompleteComponentDescription = new Map(repositoryFiles);
incompleteComponentDescription.set(
  componentPath,
  (incompleteComponentDescription.get(componentPath) ?? '').replace(
    'API reference for the <T> component.',
    'API reference for T.'
  )
);
assertEqual(
  hasFinding(
    validateDocsStructure(incompleteComponentDescription),
    componentPath,
    'description must include "API reference for the <T> component."'
  ),
  true,
  'rejects incomplete React component search metadata'
);

const vueComponentPath = 'vue/reference/components/t.mdx';
const bareVueComponentTitle = new Map(repositoryFiles);
bareVueComponentTitle.set(
  vueComponentPath,
  (bareVueComponentTitle.get(vueComponentPath) ?? '').replace(
    'title: "<T>"',
    'title: T'
  )
);
assertEqual(
  hasFinding(
    validateDocsStructure(bareVueComponentTitle),
    vueComponentPath,
    'title must use a quoted component tag'
  ),
  true,
  'rejects a bare Vue component title'
);

const incompleteVueComponentDescription = new Map(repositoryFiles);
incompleteVueComponentDescription.set(
  vueComponentPath,
  (incompleteVueComponentDescription.get(vueComponentPath) ?? '').replace(
    'API reference for the <T> component.',
    'API reference for T.'
  )
);
assertEqual(
  hasFinding(
    validateDocsStructure(incompleteVueComponentDescription),
    vueComponentPath,
    'description must include "API reference for the <T> component."'
  ),
  true,
  'rejects incomplete Vue component search metadata'
);

const reorderedRoots = replaceMeta(repositoryFiles, 'meta.json', (meta) => {
  const pages = meta.pages as string[];
  [pages[0], pages[1]] = [pages[1]!, pages[0]!];
});
assertEqual(
  hasFinding(
    validateDocsStructure(reorderedRoots),
    'meta.json',
    'Top-level sections must be ./overview, ./platform, ./cli, ./react, ./vue, ./rrweb, ./node, ./python, ./integrations in that order'
  ),
  true,
  'rejects reordered top-level sections'
);

const missingOverviewSection = replaceMeta(
  repositoryFiles,
  'overview/meta.json',
  (meta) => {
    const pages = meta.pages as string[];
    const googleDriveIndex = pages.findIndex((page) =>
      page.startsWith('[Google Drive]')
    );
    pages.splice(googleDriveIndex, 1);
  }
);
assertEqual(
  hasFinding(
    validateDocsStructure(missingOverviewSection),
    'overview/meta.json',
    'must link to the "Google Drive" section from integrations/meta.json'
  ),
  true,
  'rejects an integration section omitted from Overview'
);

const staleEntry = replaceMeta(
  repositoryFiles,
  'node/guides/meta.json',
  (meta) => {
    (meta.pages as string[]).push('./missing-page');
  }
);
assertEqual(
  hasFinding(
    validateDocsStructure(staleEntry),
    'node/guides/meta.json',
    'Pages entry "./missing-page" does not resolve'
  ),
  true,
  'rejects an unresolved pages entry'
);

const unlistedPage = new Map(repositoryFiles);
unlistedPage.set('node/guides/unlisted.mdx', '');
assertEqual(
  hasFinding(
    validateDocsStructure(unlistedPage),
    'node/guides/meta.json',
    'Navigable child "./unlisted" is missing from pages'
  ),
  true,
  'rejects a page omitted from folder metadata'
);

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  throw new Error(`${failed} documentation structure validator test(s) failed`);
}
