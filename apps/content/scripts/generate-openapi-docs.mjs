#!/usr/bin/env node
/**
 * OpenAPI Documentation Generator
 *
 * Generates one MDX page per API operation from the OpenAPI JSON snapshot at
 * docs/en-US/platform/openapi/openapi.json. Its canonical source is the public
 * artifact at gt-cloud/apps/api/openapi.public.json; this snapshot supports the
 * standalone content preview and page generation.
 *
 * To refresh the snapshot, copy the canonical artifact over it and rerun this
 * script:
 *   cp ../gt-cloud/apps/api/openapi.public.json docs/en-US/platform/openapi/openapi.json
 *   pnpm --filter ./apps/content generate-openapi-docs
 *
 * Each generated page renders with the `<APIPage />` component (registered in
 * the docs MDX components) against the `gt-api` schema, which provides the
 * interactive request playground.
 *
 * The generated pages and their navigation metadata live in
 * docs/en-US/platform/openapi/reference. Operation slugs and navigation come
 * from the contract's x-docs-slug and x-docs-nav extensions.
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
const MANUAL_REFERENCE_PAGES = ['./typescript-sdk'];
const DOCS_SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

function operationKey(method, route) {
  return `${method.toLowerCase()} ${route}`;
}

function readOperationPages(document) {
  const navigation = document['x-docs-nav'];
  if (!Array.isArray(navigation) || navigation.length === 0) {
    throw new Error('OpenAPI document must have a non-empty x-docs-nav array.');
  }

  const operationsBySlug = new Map();
  for (const [route, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem ?? {})) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;

      const key = operationKey(method, route);
      const slug = operation?.['x-docs-slug'];
      if (typeof slug !== 'string' || !DOCS_SLUG_PATTERN.test(slug)) {
        throw new Error(
          `OpenAPI operation "${key}" must have an x-docs-slug in "group/page-name" format.`
        );
      }
      if (operationsBySlug.has(slug)) {
        throw new Error(
          `Duplicate x-docs-slug "${slug}" on "${operationsBySlug.get(slug).key}" and "${key}".`
        );
      }
      operationsBySlug.set(slug, {
        key,
        route,
        method: method.toLowerCase(),
        slug,
      });
    }
  }

  const pagesByOperation = new Map();
  const pagesBySlug = new Map();
  const groups = [];
  const groupSlugs = new Set();

  for (const item of navigation) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.group !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.group) ||
      typeof item.title !== 'string' ||
      item.title.length === 0 ||
      !Array.isArray(item.pages) ||
      item.pages.length === 0
    ) {
      throw new Error(
        'Each x-docs-nav entry must have a group slug, title, and non-empty pages array.'
      );
    }
    if (groupSlugs.has(item.group)) {
      throw new Error(`Duplicate x-docs-nav group "${item.group}".`);
    }
    groupSlugs.add(item.group);

    const pages = [];
    for (const slug of item.pages) {
      if (
        typeof slug !== 'string' ||
        !DOCS_SLUG_PATTERN.test(slug) ||
        !slug.startsWith(`${item.group}/`)
      ) {
        throw new Error(
          `Invalid x-docs-nav page "${slug}" in group "${item.group}".`
        );
      }
      if (pagesBySlug.has(slug)) {
        throw new Error(`Duplicate x-docs-nav page "${slug}".`);
      }

      const operation = operationsBySlug.get(slug);
      if (!operation) {
        throw new Error(
          `x-docs-nav page "${slug}" has no matching OpenAPI operation.`
        );
      }
      const page = slug.slice(item.group.length + 1);
      const metadata = { ...operation, group: item.group, page };
      pagesByOperation.set(operation.key, metadata);
      pagesBySlug.set(slug, metadata);
      pages.push(page);
    }
    groups.push({ slug: item.group, title: item.title, pages });
  }

  const missingSlugs = [...operationsBySlug.keys()].filter(
    (slug) => !pagesBySlug.has(slug)
  );
  if (missingSlugs.length > 0) {
    throw new Error(
      `OpenAPI operations missing from x-docs-nav: ${missingSlugs.join(', ')}.`
    );
  }

  return { groups, pagesByOperation, pagesBySlug };
}

const { groups, pagesByOperation, pagesBySlug } =
  readOperationPages(document);

// Mirror src/lib/openapi.ts (minus runtime-only playground config). We
// re-create the server here instead of importing that module because it lives
// behind a Next.js path alias and pulls in app-only code paths that aren't
// resolvable from a plain node script.
const openapi = createOpenAPI({
  input: () => ({
    'gt-api': document,
  }),
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
  for (const { slug, title, pages } of groups) {
    fs.mkdirSync(path.join(OUTPUT_DIR, slug), { recursive: true });
    fs.writeFileSync(
      path.join(OUTPUT_DIR, slug, 'meta.json'),
      `${JSON.stringify(
        {
          title,
          description: `Browse OpenAPI ${title} pages.`,
          pages: pages.map((page) => `./${page}`),
        },
        null,
        2
      )}\n`
    );
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'meta.json'),
    `${JSON.stringify(
      {
        title: 'Reference',
        description: 'Browse Reference pages for the General Translation API.',
        pages: [
          ...MANUAL_REFERENCE_PAGES,
          ...groups.map(({ slug }) => `./${slug}`),
        ],
      },
      null,
      2
    )}\n`
  );
}

// Marker Fumadocs writes into every generated MDX page.
const GENERATED_MARKER = 'This file was generated by Fumadocs';

// Recursively delete only Fumadocs-generated `.mdx` pages. Group dirs left
// holding nothing but regenerable `meta.json` are removed too, so a group
// deleted from x-docs-nav does not leave orphaned navigation behind
// (writeNavigation recreates current groups afterward).
function cleanGenerated(dir = OUTPUT_DIR) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanGenerated(target);
      const remaining = fs.readdirSync(target);
      if (
        remaining.length === 0 ||
        (remaining.length === 1 && remaining[0] === 'meta.json')
      ) {
        fs.rmSync(target, { recursive: true });
      }
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
