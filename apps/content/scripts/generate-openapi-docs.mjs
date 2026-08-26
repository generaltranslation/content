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
 * The generated pages and their navigation metadata live in
 * docs/en-US/platform/openapi/reference. Operation slugs and ordering come
 * from the contract's x-docs-slug and x-docs-order extensions.
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

// Group presentation changes rarely and is not operation enumeration; route
// slugs and within-group order remain owned by the OpenAPI contract.
const GROUPS = [
  { slug: 'files', title: 'Files' },
  { slug: 'context', title: 'Context' },
  { slug: 'translation', title: 'Translation' },
  { slug: 'project', title: 'Project' },
];
const HTTP_METHODS = new Set([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]);
const DOCS_SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

function operationKey(method, route) {
  return `${method.toLowerCase()} ${route}`;
}

function readOperationPages(document) {
  const pagesByOperation = new Map();
  const pagesBySlug = new Map();
  const ordersByGroup = new Map();

  for (const [route, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;

      const key = operationKey(method, route);
      const slug = operation?.['x-docs-slug'];
      const order = operation?.['x-docs-order'];
      if (typeof slug !== 'string' || !DOCS_SLUG_PATTERN.test(slug)) {
        throw new Error(
          `OpenAPI operation "${key}" must have an x-docs-slug in "group/page-name" format.`
        );
      }
      if (!Number.isInteger(order) || order < 0) {
        throw new Error(
          `OpenAPI operation "${key}" must have a non-negative integer x-docs-order.`
        );
      }
      if (pagesBySlug.has(slug)) {
        throw new Error(
          `Duplicate x-docs-slug "${slug}" on "${pagesBySlug.get(slug).key}" and "${key}".`
        );
      }

      const [group, page] = slug.split('/');
      if (!GROUPS.some((item) => item.slug === group)) {
        throw new Error(`Unknown documentation group "${group}" on "${key}".`);
      }
      const groupOrders = ordersByGroup.get(group) ?? new Map();
      if (groupOrders.has(order)) {
        throw new Error(
          `Duplicate x-docs-order ${order} in group "${group}" on "${groupOrders.get(order)}" and "${key}".`
        );
      }

      const metadata = {
        key,
        route,
        method: method.toLowerCase(),
        slug,
        group,
        page,
        order,
      };
      pagesByOperation.set(key, metadata);
      pagesBySlug.set(slug, metadata);
      groupOrders.set(order, key);
      ordersByGroup.set(group, groupOrders);
    }
  }

  return { pagesByOperation, pagesBySlug };
}

const { pagesByOperation, pagesBySlug } = readOperationPages(document);

// Mirror src/lib/openapi.ts. We re-create the server here instead of importing
// that module because it lives behind a Next.js path alias and pulls in
// app-only code paths that aren't resolvable from a plain node script.
const openapi = createOpenAPI({
  input: () => ({
    'gt-api': document,
  }),
  proxyUrl: '/api/proxy',
});

function pageSlug(entry) {
  const key = operationKey(entry.item.method, entry.item.path);
  const page = pagesByOperation.get(key);
  if (!page) {
    throw new Error(`No documentation metadata found for operation "${key}".`);
  }
  return page.slug;
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
  const page = pagesBySlug.get(slug);
  if (!page) {
    throw new Error(`No operation found for generated page "${file.path}".`);
  }

  const operation = document.paths?.[page.route]?.[page.method];
  if (!operation || typeof operation.summary !== 'string') {
    throw new Error(`No OpenAPI operation found for "${page.key}".`);
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
method: ${page.method.toUpperCase()}
full: true
${openapiMetadata}
---${body}`;
}

function writeNavigation() {
  const groups = GROUPS.map(({ slug, title }) => {
    const pages = [...pagesBySlug.values()]
      .filter((page) => page.group === slug)
      .sort((a, b) => a.order - b.order)
      .map((page) => `./${page.page}`);
    if (pages.length === 0) {
      throw new Error(
        `No OpenAPI operations found for documentation group "${slug}".`
      );
    }

    fs.mkdirSync(path.join(OUTPUT_DIR, slug), { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, slug, 'meta.json'),
      `${JSON.stringify(
        {
          title,
          description: `Browse OpenAPI ${title} pages.`,
          pages,
        },
        null,
        2
      )}\n`
    );
    return `./${slug}`;
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'meta.json'),
    `${JSON.stringify(
      {
        title: 'Reference',
        description: 'Browse Reference pages for the General Translation API.',
        pages: groups,
      },
      null,
      2
    )}\n`
  );
}

// Marker Fumadocs writes into every generated MDX page.
const GENERATED_MARKER = 'This file was generated by Fumadocs';

// Recursively delete only Fumadocs-generated `.mdx` pages, leaving navigation
// metadata in place until it is deterministically regenerated.
function cleanGenerated(dir = OUTPUT_DIR) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanGenerated(target);
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

  writeNavigation();
  console.log(`\nGenerated operation pages and navigation into ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error('Failed to generate OpenAPI docs', e);
  process.exit(1);
});
