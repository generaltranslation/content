#!/usr/bin/env node
/**
 * OpenAPI Documentation Generator
 *
 * Generates one MDX page per API operation for every API version listed in
 * docs/en-US/platform/openapi/openapi.versions.json, which gt-cloud's OpenAPI
 * sync writes together with the OpenAPI snapshots. Snapshot layout: see
 * src/lib/openApiDocuments.mjs.
 *
 * Each generated page renders with the `<APIPage />` component (registered in
 * the docs MDX components) against the version's schema id (`gt-api` for the
 * latest version, `gt-api@<version>` for older ones), which provides the
 * interactive request playground. Fumadocs' frontmatter (including
 * `_openapi.preload`) is kept, but the page body stays a plain `<APIPage />`
 * instead of its ESM layout: the landing app renders this content straight
 * from main and maps only `APIPage`, and MDX here carries no exports.
 *
 * The latest version's pages and navigation metadata live in
 * docs/en-US/platform/openapi/reference; each older version's live in
 * reference/versions/<version>, which reference/meta.json does not list.
 * Operation slugs and navigation, including each group's description, come
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
import { parse, stringify } from 'yaml';

import { readOpenApiDocuments } from '../src/lib/openApiDocuments.mjs';

const REPO_ROOT = path.join(fileURLToPath(import.meta.url), '../../../..');
const OPENAPI_DIR = path.join(REPO_ROOT, 'docs/en-US/platform/openapi');
const OUTPUT_DIR = path.join(OPENAPI_DIR, 'reference');
const VERSIONS_DIR = path.join(OUTPUT_DIR, 'versions');

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
      typeof item.description !== 'string' ||
      item.description.length === 0 ||
      !Array.isArray(item.pages) ||
      item.pages.length === 0
    ) {
      throw new Error(
        'Each x-docs-nav entry must have a group slug, title, description, and non-empty pages array.'
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
    groups.push({
      slug: item.group,
      title: item.title,
      description: item.description,
      pages,
    });
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

// One reference per API version: the latest version renders into OUTPUT_DIR
// under `gt-api`, each older one into VERSIONS_DIR/<version> under
// `gt-api@<version>`. Versions that share a doc share its parsed pages.
function readReferences() {
  const sources = new Map();
  return readOpenApiDocuments(OPENAPI_DIR).map(
    ({ id, version, latest, path: file }) => {
      let source = sources.get(file);
      if (!source) {
        const document = JSON.parse(fs.readFileSync(file, 'utf-8'));
        try {
          source = { document, ...readOperationPages(document) };
        } catch (error) {
          throw new Error(`${path.basename(file)}: ${error.message}`, {
            cause: error,
          });
        }
        sources.set(file, source);
      }
      return {
        ...source,
        id,
        version,
        latest,
        outputDir: latest ? OUTPUT_DIR : path.join(VERSIONS_DIR, version),
      };
    }
  );
}

function pageSlug(reference, entry) {
  const key = operationKey(entry.item.method, entry.item.path);
  const page = reference.pagesByOperation.get(key);
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

// Fumadocs' generated-file marker; cleanGenerated deletes only pages with it.
const GENERATED_MARKER = 'This file was generated by Fumadocs';
const GENERATED_COMMENT = `{/* ${GENERATED_MARKER}. Do not edit this file directly. Any changes should be made by running the generation command again. */}`;
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n/;

function writePage(reference, file) {
  const slug = file.path.replace(/\.mdx$/, '');
  const page = reference.pagesBySlug.get(slug);
  if (!page) {
    throw new Error(`No operation found for generated page "${file.path}".`);
  }

  const operation = reference.document.paths?.[page.route]?.[page.method];
  if (!operation || typeof operation.summary !== 'string') {
    throw new Error(`No OpenAPI operation found for "${page.key}".`);
  }

  const generatedFrontmatter = file.content.match(FRONTMATTER_PATTERN)?.[1];
  const { _openapi } = generatedFrontmatter ? parse(generatedFrontmatter) : {};
  if (!_openapi) {
    throw new Error(`Could not parse generated frontmatter in "${file.path}".`);
  }

  const summary = plainText(operation.summary);
  const overview = completeSentence(
    plainText(operation.description ?? operation.summary)
  );
  const frontmatter = {
    title: summary,
    description: overview,
    method: page.method.toUpperCase(),
    full: true,
    _openapi,
  };
  const operations = [{ path: page.route, method: page.method }];

  file.content = `---
${stringify(frontmatter)}---

${GENERATED_COMMENT}

<APIPage document={${JSON.stringify(reference.id)}} operations={${JSON.stringify(operations)}} />`;
}

function writeMeta(dir, meta) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'meta.json'),
    `${JSON.stringify(meta, null, 2)}\n`
  );
}

function writeNavigation(reference) {
  for (const { slug, title, description, pages } of reference.groups) {
    writeMeta(path.join(reference.outputDir, slug), {
      title,
      description,
      pages: pages.map((page) => `./${page}`),
    });
  }

  writeMeta(reference.outputDir, {
    title: reference.latest ? 'Reference' : reference.version,
    description: reference.latest
      ? 'Browse Reference pages for the General Translation API.'
      : `Browse Reference pages for General Translation API version ${reference.version}.`,
    pages: reference.groups.map(({ slug }) => `./${slug}`),
  });
}

// Lists the older versions newest first. reference/meta.json does not list
// this folder, so older versions stay out of the latest version's navigation.
function writeVersionsNavigation(olderReferences) {
  if (olderReferences.length === 0) return;
  writeMeta(VERSIONS_DIR, {
    title: 'Versions',
    description:
      'Browse Reference pages for earlier General Translation API versions.',
    pages: olderReferences.map(({ version }) => `./${version}`).reverse(),
  });
}

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

// Mirror src/lib/openapi.ts (minus runtime-only playground config), with one
// document per server so each reference renders only its version's pages. We
// re-create the server here instead of importing that module because it lives
// behind a Next.js path alias and pulls in app-only code paths that aren't
// resolvable from a plain node script.
async function generateReference(reference) {
  await generateFiles({
    input: createOpenAPI({ input: { [reference.id]: reference.document } }),
    output: reference.outputDir,
    per: 'operation',
    groupBy: (entry) => path.dirname(pageSlug(reference, entry)),
    name: (entry) => path.basename(pageSlug(reference, entry)),
    beforeWrite(files) {
      for (const file of files) writePage(reference, file);
    },
  });
  writeNavigation(reference);
}

async function main() {
  console.log('=== OpenAPI Docs Generator ===\n');
  const references = readReferences();
  cleanGenerated();

  for (const reference of references) await generateReference(reference);
  writeVersionsNavigation(references.filter(({ latest }) => !latest));
  console.log(`\nGenerated operation pages and navigation into ${OUTPUT_DIR}`);
}

main().catch((e) => {
  console.error('Failed to generate OpenAPI docs', e);
  process.exit(1);
});
