#!/usr/bin/env node
/**
 * OpenAPI Documentation Generator
 *
 * Generates one MDX page per API operation from the OpenAPI JSON snapshot at
 * docs/en-US/platform/openapi/openapi.json. Its canonical source is the public
 * artifact at gt-cloud/apps/api/openapi.public.json; this snapshot supports the
 * standalone content preview and page generation.
 *
 * Each generated page renders with the `<APIPage />` component (registered in
 * the docs MDX components) against the `gt-api` schema, which provides the
 * interactive request playground.
 *
 * The generated pages live in `docs/en-US/platform/openapi/reference`. The
 * section's `overview.mdx`, `openapi.json`, and all `meta.json` files (section
 * + per-group ordering) are NOT touched by this script — only
 * Fumadocs-generated `.mdx` operation pages are regenerated.
 *
 * Every operation must have an entry in PAGES below. The mapping pins each
 * operation to a stable URL slug so links from other docs pages never break
 * when the spec is regenerated.
 *
 * Usage:
 *   pnpm run generate-openapi-docs
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateFiles } from 'fumadocs-openapi';
import { createOpenAPI } from 'fumadocs-openapi/server';

const REPO_ROOT = path.join(fileURLToPath(import.meta.url), '../../../..');
const OPENAPI_DIR = path.join(REPO_ROOT, 'docs/en-US/platform/openapi');
const OPENAPI_PATH = path.join(OPENAPI_DIR, 'openapi.json');
const OUTPUT_DIR = path.join(OPENAPI_DIR, 'reference');
const document = JSON.parse(fs.readFileSync(OPENAPI_PATH, 'utf-8'));

// Mirror src/lib/openapi.ts. We re-create the server here instead of importing
// that module because it lives behind a Next.js path alias and pulls in
// app-only code paths that aren't resolvable from a plain node script.
const openapi = createOpenAPI({
  input: () => ({
    'gt-api': document,
  }),
  proxyUrl: '/api/proxy',
});

// Stable output slug (`<group>/<page>`) for every operation, keyed by
// `<method> <path>`. Grouping intentionally differs from the spec's tags:
// branch, tag, and job operations fold into the `project` and `translation`
// sidebar groups.
const PAGES = {
  'post /v2/project/files/upload-files': 'files/upload-source',
  'post /v2/project/files/upload-translations': 'files/upload-translations',
  'post /v2/project/files/diffs': 'files/submit-diffs',
  'post /v2/project/files/download': 'files/download-many',
  'get /v2/project/files/download/{fileId}': 'files/download',
  'post /v2/project/files/publish': 'files/publish-files',
  'post /v2/project/files/info': 'files/file-info',
  'get /v2/project/translations/files/status/{fileId}':
    'files/translation-status',
  'post /v2/project/files/moves': 'files/move-files',
  'post /v2/project/files/orphaned': 'files/orphaned-files',
  'post /v2/project/setup/generate': 'context/generate-context',
  'get /v2/project/setup/should-generate': 'context/check-freshness',
  'get /v2/project/setup/status/{jobId}': 'context/context-status',
  'post /v2/translate': 'translation/translate-runtime',
  'post /v2/project/translations/enqueue': 'translation/queue',
  'post /v2/project/jobs/info': 'translation/job-status',
  'post /v2/projects': 'project/create-project',
  'get /v2/project/info/{projectId}': 'project/project-info',
  'post /v2/project/info/{projectId}': 'project/update-project',
  'post /v2/project/assets': 'project/upload-assets',
  'post /v2/project/branches/info': 'project/branch-info',
  'post /v2/project/branches/create': 'project/create-branch',
  'post /v2/project/tags/create': 'project/upsert-tag',
  'post /cli/wizard/session': 'cli/create-session',
  'get /cli/wizard/{sessionId}': 'cli/get-session',
  'delete /cli/wizard/{sessionId}': 'cli/delete-session',
};

function pageSlug(entry) {
  const key = `${entry.item.method.toLowerCase()} ${entry.item.path}`;
  const slug = PAGES[key];
  if (!slug) {
    throw new Error(
      `No output slug mapped for operation "${key}". Add it to PAGES in ${fileURLToPath(import.meta.url)}.`
    );
  }
  return slug;
}

function plainText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function completeSentence(value) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function normalizeFrontmatter(file, document) {
  const slug = file.path.replace(/\.mdx$/, '');
  const page = Object.entries(PAGES).find(([, output]) => output === slug);
  if (!page) {
    throw new Error(`No operation mapped for generated page "${file.path}".`);
  }

  const [operationKey] = page;
  const separator = operationKey.indexOf(' ');
  const method = operationKey.slice(0, separator);
  const route = operationKey.slice(separator + 1);
  const operation = document.paths?.[route]?.[method];
  if (!operation || typeof operation.summary !== 'string') {
    throw new Error(`No OpenAPI operation found for "${operationKey}".`);
  }

  const frontmatterEnd = file.content.indexOf('\n---', 4);
  const body = file.content.slice(frontmatterEnd + 4);
  const generatedFrontmatter = file.content.slice(4, frontmatterEnd);
  const openapiStart = generatedFrontmatter.indexOf('_openapi:');
  if (frontmatterEnd === -1 || openapiStart === -1) {
    throw new Error(`Could not parse generated frontmatter in "${file.path}".`);
  }

  const summary = plainText(operation.summary);
  const overview = completeSentence(
    plainText(operation.description ?? operation.summary)
  );
  const description = `${overview} API reference for ${summary}.`;
  const openapiMetadata = generatedFrontmatter.slice(openapiStart).trimEnd();

  file.content = `---

title: ${JSON.stringify(summary)}
description: ${JSON.stringify(description)}
method: ${method.toUpperCase()}
full: true
${openapiMetadata}
---${body}`;
}

// Marker Fumadocs writes into every generated MDX page.
const GENERATED_MARKER = 'This file was generated by Fumadocs';

// Recursively delete only Fumadocs-generated `.mdx` pages, leaving
// hand-authored files (every meta.json) in place. Empty group folders left
// behind after deletion are pruned.
function cleanGenerated(dir = OUTPUT_DIR) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanGenerated(target);
      if (fs.readdirSync(target).length === 0) fs.rmdirSync(target);
      continue;
    }
    if (!entry.name.endsWith('.mdx')) continue;
    const content = fs.readFileSync(target, 'utf-8');
    if (content.includes(GENERATED_MARKER)) fs.unlinkSync(target);
  }
}

async function main() {
  console.log('=== OpenAPI Docs Generator ===\n');
  cleanGenerated();

  await generateFiles({
    input: openapi,
    output: OUTPUT_DIR,
    per: 'operation',
    groupBy: (entry) => path.dirname(pageSlug(entry)),
    name: (entry) => path.basename(pageSlug(entry)),
    beforeWrite(files) {
      const document = this.documents['gt-api']?.dereferenced;
      if (!document) {
        throw new Error('Could not load the gt-api OpenAPI document.');
      }
      for (const file of files) normalizeFrontmatter(file, document);
    },
  });

  console.log(`\nGenerated operation pages into ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error('Failed to generate OpenAPI docs', e);
  process.exit(1);
});
