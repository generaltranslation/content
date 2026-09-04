import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = resolve(import.meta.dirname, '..', 'docs', 'en-US');

const EXPECTED_ROOTS = [
  'overview',
  'platform',
  'cli',
  'react',
  'vue',
  'node',
  'python',
  'integrations',
] as const;

const EXPECTED_ROOT_SECTIONS: Readonly<Record<string, readonly string[]>> = {
  overview: ['Frameworks', 'Platform', 'Integrations'],
  platform: ['Dashboard', 'Locadex', 'Core', 'OpenAPI'],
  cli: ['Guides', 'Reference'],
  react: ['Guides', 'Reference', 'Frameworks'],
  vue: ['Guides', 'Reference'],
  node: ['Guides', 'Reference'],
  python: ['Guides', 'Reference'],
  integrations: ['Google Drive', 'Mintlify', 'Sanity', 'Storyblok', 'rrweb'],
};

const EXPECTED_OVERVIEW_PAGES = [
  './get-started',
  './key-concepts',
  './for-coding-agents',
  '---Frameworks---',
  '[React](/docs/react/react-quickstart)',
  '[React SPA](/docs/react/react-spa-quickstart)',
  '[Next.js App Router](/docs/react/nextjs-quickstart)',
  '[Next.js Pages Router](/docs/react/nextjs-pages-router-quickstart)',
  '[TanStack Start](/docs/react/tanstack-start-quickstart)',
  '[React Native](/docs/react/react-native-quickstart)',
  '[Vue](/docs/vue/quickstart)',
  '[Node.js](/docs/node/quickstart)',
  '[Python](/docs/python/quickstart)',
  '[CLI](/docs/cli/quickstart)',
  '[JSON](/docs/cli/reference/formats/json-files)',
  '---Platform---',
  '[Dashboard](/docs/platform/dashboard/get-started)',
  '[Locadex](/docs/platform/locadex/quickstart)',
  '[Core](/docs/platform/core/quickstart)',
  '[OpenAPI](/docs/platform/openapi/overview)',
  '---Integrations---',
  '[Google Drive](/docs/integrations/google-drive/quickstart)',
  '[Mintlify](/docs/integrations/mintlify/quickstart)',
  '[Sanity](/docs/integrations/sanity/quickstart)',
  '[Storyblok](/docs/integrations/storyblok/quickstart)',
  '[rrweb](/docs/integrations/rrweb/quickstart)',
] as const;

const EXPECTED_LANDING_CARDS: Readonly<Record<string, readonly string[]>> = {
  platform: ['Dashboard', 'Locadex', 'Core', 'OpenAPI'],
  integrations: ['Google Drive', 'Mintlify', 'Sanity', 'Storyblok', 'rrweb'],
};

const CANONICAL_FOLDER_TITLES: Readonly<Record<string, string>> = {
  classes: 'Classes',
  commands: 'Commands',
  components: 'Components',
  formats: 'File formats',
  functions: 'Functions',
  guides: 'Guides',
  hooks: 'Hooks',
  composables: 'Composables',
  reference: 'Reference',
  rrweb: 'rrweb',
  types: 'Types',
};

const ALLOWED_META_KEYS = new Set([
  'defaultOpen',
  'description',
  'icon',
  'pages',
  'root',
  'title',
]);

export type StructureFinding = Readonly<{
  file: string;
  message: string;
}>;

type CrossSectionLink = Readonly<{
  title: string;
  path: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function metadataDirectory(metaPath: string): string {
  const directory = posix.dirname(metaPath);
  return directory === '.' ? '' : directory;
}

function metadataPath(directory: string): string {
  return directory ? `${directory}/meta.json` : 'meta.json';
}

function resolveEntryBase(metaPath: string, entry: string): string {
  return posix.normalize(
    posix.join(metadataDirectory(metaPath), entry.slice(2))
  );
}

function getPages(meta: Record<string, unknown>): readonly string[] | undefined {
  if (
    !Array.isArray(meta.pages) ||
    !meta.pages.every((page) => typeof page === 'string')
  ) {
    return undefined;
  }
  return meta.pages;
}

function parseCrossSectionLink(entry: string): CrossSectionLink | undefined {
  const match = /^\[([^\]]+)\]\((\/docs\/[^)]+)\)$/.exec(entry);
  if (!match?.[1] || !match[2]) return undefined;
  return { title: match[1], path: match[2] };
}

function getFrontmatterValue(
  content: string,
  key: string
): string | undefined {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)?.[1];
  if (!frontmatter) return undefined;

  const match = new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(frontmatter);
  const value = match?.[1];
  if (!value) return undefined;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function findEntryCandidates(
  files: ReadonlyMap<string, string>,
  metaPath: string,
  entry: string
): string[] {
  const base = resolveEntryBase(metaPath, entry);
  return [`${base}.mdx`, `${base}.md`, `${base}/meta.json`].filter((path) =>
    files.has(path)
  );
}

function findImmediateNavigableChildren(
  files: ReadonlyMap<string, string>,
  metaPath: string
): string[] {
  const directory = metadataDirectory(metaPath);
  const prefix = directory ? `${directory}/` : '';
  const children = new Set<string>();

  for (const path of files.keys()) {
    if (!path.startsWith(prefix)) continue;
    const childPath = path.slice(prefix.length);

    if (!childPath.includes('/') && /\.(md|mdx)$/.test(childPath)) {
      children.add(childPath.replace(/\.(md|mdx)$/, ''));
      continue;
    }

    const folderMatch = /^([^/]+)\/meta\.json$/.exec(childPath);
    if (folderMatch?.[1]) children.add(folderMatch[1]);
  }

  return [...children].sort();
}

function sameValues(
  actual: readonly string[],
  expected: readonly string[]
): boolean {
  return (
    actual.length === expected.length &&
    actual.every((value, index) => value === expected[index])
  );
}

export function validateDocsStructure(
  files: ReadonlyMap<string, string>
): StructureFinding[] {
  const findings: StructureFinding[] = [];
  const metaByPath = new Map<string, Record<string, unknown>>();
  const metaPaths = [...files.keys()]
    .filter((path) => path === 'meta.json' || path.endsWith('/meta.json'))
    .sort();

  function addFinding(file: string, message: string): void {
    findings.push({ file, message });
  }

  for (const metaPath of metaPaths) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(files.get(metaPath) ?? '');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addFinding(metaPath, `Metadata must contain valid JSON: ${message}`);
      continue;
    }

    if (!isRecord(parsed)) {
      addFinding(metaPath, 'Metadata must be a JSON object.');
      continue;
    }
    metaByPath.set(metaPath, parsed);

    for (const key of Object.keys(parsed)) {
      if (!ALLOWED_META_KEYS.has(key)) {
        addFinding(metaPath, `Unsupported metadata key "${key}".`);
      }
    }

    if (metaPath !== 'meta.json') {
      if (typeof parsed.title !== 'string' || parsed.title.length === 0) {
        addFinding(metaPath, 'Metadata must define a non-empty title.');
      } else {
        const folderName = posix.basename(metadataDirectory(metaPath));
        const canonicalTitle = CANONICAL_FOLDER_TITLES[folderName];
        if (canonicalTitle && parsed.title !== canonicalTitle) {
          addFinding(
            metaPath,
            `Folder "${folderName}" must use the title "${canonicalTitle}".`
          );
        } else if (!canonicalTitle && /^[a-z]/.test(parsed.title)) {
          addFinding(
            metaPath,
            `Metadata title "${parsed.title}" must use sentence case.`
          );
        }
      }
    }

    if (
      parsed.description !== undefined &&
      typeof parsed.description !== 'string'
    ) {
      addFinding(metaPath, 'Metadata description must be a string.');
    }
    if (parsed.icon !== undefined && typeof parsed.icon !== 'string') {
      addFinding(metaPath, 'Metadata icon must be a string.');
    }
    if (parsed.root !== undefined && typeof parsed.root !== 'boolean') {
      addFinding(metaPath, 'Metadata root must be a boolean.');
    }
    if (
      parsed.defaultOpen !== undefined &&
      typeof parsed.defaultOpen !== 'boolean'
    ) {
      addFinding(metaPath, 'Metadata defaultOpen must be a boolean.');
    }

    const pages = getPages(parsed);
    if (!pages) {
      addFinding(metaPath, 'Metadata pages must be an array of strings.');
      continue;
    }

    const seenPages = new Set<string>();
    for (const page of pages) {
      if (seenPages.has(page)) {
        addFinding(metaPath, `Duplicate pages entry "${page}".`);
      }
      seenPages.add(page);

      if (!page.startsWith('./')) continue;
      const candidates = findEntryCandidates(files, metaPath, page);
      if (candidates.length === 0) {
        addFinding(metaPath, `Pages entry "${page}" does not resolve.`);
      } else if (candidates.length > 1) {
        addFinding(
          metaPath,
          `Pages entry "${page}" resolves to multiple files or folders.`
        );
      }
    }

    for (const child of findImmediateNavigableChildren(files, metaPath)) {
      const entry = `./${child}`;
      if (!seenPages.has(entry)) {
        addFinding(metaPath, `Navigable child "${entry}" is missing from pages.`);
      }
    }
  }

  for (const [path, content] of files) {
    if (
      !/^(?:react|vue)\/(?:.+\/)?reference\/components\/[^/]+\.(?:md|mdx)$/.test(
        path
      )
    ) {
      continue;
    }

    const title = getFrontmatterValue(content, 'title');
    if (!title || !/^<[A-Za-z_$][A-Za-z0-9_$]*>$/.test(title)) {
      addFinding(
        path,
        'Component reference title must use a quoted component tag such as "<T>".'
      );
      continue;
    }

    const description = getFrontmatterValue(content, 'description');
    const expectedReference = `API reference for the ${title} component.`;
    if (!description?.includes(expectedReference)) {
      addFinding(
        path,
        `Component description must include "${expectedReference}"`
      );
    }
  }

  for (const path of files.keys()) {
    if (!/\.(md|mdx)$/.test(path)) continue;
    const parentDirectory = posix.dirname(path);
    const parentMetaPath = metadataPath(
      parentDirectory === '.' ? '' : parentDirectory
    );
    if (!files.has(parentMetaPath)) {
      addFinding(path, `Parent folder is missing ${parentMetaPath}.`);
    }
  }

  for (const metaPath of metaPaths) {
    if (metaPath === 'meta.json') continue;
    const directory = metadataDirectory(metaPath);
    const parent = posix.dirname(directory);
    const parentMetaPath = metadataPath(parent === '.' ? '' : parent);
    if (!files.has(parentMetaPath)) {
      addFinding(metaPath, `Parent folder is missing ${parentMetaPath}.`);
    }
  }

  const rootMeta = metaByPath.get('meta.json');
  const rootPages = rootMeta && getPages(rootMeta);
  const expectedRootEntries = EXPECTED_ROOTS.map((root) => `./${root}`);
  if (rootPages && !sameValues(rootPages, expectedRootEntries)) {
    addFinding(
      'meta.json',
      `Top-level sections must be ${expectedRootEntries.join(', ')} in that order.`
    );
  }

  for (const root of EXPECTED_ROOTS) {
    const rootMetaPath = `${root}/meta.json`;
    const meta = metaByPath.get(rootMetaPath);
    if (!meta) continue;

    if (meta.root !== true) {
      addFinding(rootMetaPath, 'Top-level section must set root to true.');
    }
    for (const field of ['title', 'description', 'icon'] as const) {
      if (typeof meta[field] !== 'string' || meta[field].length === 0) {
        addFinding(rootMetaPath, `Top-level section must define ${field}.`);
      }
    }

    const pages = getPages(meta);
    if (!pages) continue;

    const sectionTitles: string[] = [];
    for (const page of pages) {
      const separator = /^---(.+)---$/.exec(page);
      if (separator?.[1]) {
        sectionTitles.push(separator[1]);
        continue;
      }
      if (!page.startsWith('./')) continue;

      const childMetaPath = `${resolveEntryBase(rootMetaPath, page)}/meta.json`;
      const childMeta = metaByPath.get(childMetaPath);
      if (!childMeta) continue;
      if (typeof childMeta.title === 'string') {
        sectionTitles.push(childMeta.title);
      }

      const childPages = getPages(childMeta);
      const navigableCount =
        childPages?.filter((entry) => !/^---.+---$/.test(entry)).length ?? 0;
      if (navigableCount < 2) {
        addFinding(
          childMetaPath,
          `Root sidebar section "${childMeta.title ?? page}" must contain at least two navigable entries.`
        );
      }
    }

    const expectedSections = EXPECTED_ROOT_SECTIONS[root];
    if (expectedSections && !sameValues(sectionTitles, expectedSections)) {
      addFinding(
        rootMetaPath,
        `Sidebar sections must be ${expectedSections.join(', ')}; received ${sectionTitles.join(', ') || 'none'}.`
      );
    }
  }

  const overviewMetaPath = 'overview/meta.json';
  const overviewMeta = metaByPath.get(overviewMetaPath);
  const overviewPages = overviewMeta && getPages(overviewMeta);
  if (overviewPages) {
    if (!sameValues(overviewPages, EXPECTED_OVERVIEW_PAGES)) {
      addFinding(
        overviewMetaPath,
        'Overview sidebar entries must follow the canonical Frameworks, Platform, and Integrations order.'
      );
    }

    const overviewLinks = overviewPages
      .map(parseCrossSectionLink)
      .filter((link): link is CrossSectionLink => link !== undefined);

    for (const root of ['platform', 'integrations'] as const) {
      const rootMetaPath = `${root}/meta.json`;
      const rootMeta = metaByPath.get(rootMetaPath);
      const rootPages = rootMeta && getPages(rootMeta);
      if (!rootPages) continue;

      for (const page of rootPages) {
        if (!page.startsWith('./')) continue;
        const childBase = resolveEntryBase(rootMetaPath, page);
        const childMetaPath = `${childBase}/meta.json`;
        const childMeta = metaByPath.get(childMetaPath);
        if (!childMeta || typeof childMeta.title !== 'string') continue;

        const expectedPathPrefix = `/docs/${childBase}/`;
        const hasLink = overviewLinks.some(
          (link) =>
            link.title === childMeta.title &&
            link.path.startsWith(expectedPathPrefix)
        );
        if (!hasLink) {
          addFinding(
            overviewMetaPath,
            `Overview sidebar must link to the "${childMeta.title}" section from ${rootMetaPath}.`
          );
        }
      }
    }
  }

  for (const [root, expectedTitles] of Object.entries(
    EXPECTED_LANDING_CARDS
  )) {
    const indexPath = `${root}/index.mdx`;
    const content = files.get(indexPath);
    if (!content) continue;

    const cardTitles = [...content.matchAll(/<Card\s+title="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((title): title is string => title !== undefined);
    if (!sameValues(cardTitles, expectedTitles)) {
      addFinding(
        indexPath,
        `Landing cards must be ${expectedTitles.join(', ')} in sidebar order.`
      );
    }
  }

  for (const [metaPath, meta] of metaByPath) {
    if (meta.root !== true) continue;
    const directory = metadataDirectory(metaPath);
    if (!EXPECTED_ROOTS.includes(directory as (typeof EXPECTED_ROOTS)[number])) {
      addFinding(
        metaPath,
        'Only documented top-level sections may set root to true.'
      );
    }
  }

  return findings;
}

export function collectDocsFiles(root: string): Map<string, string> {
  const files = new Map<string, string>();

  function visit(directory: string): void {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (entry.isFile()) {
        const relativePath = relative(root, absolutePath).split(sep).join('/');
        files.set(
          relativePath,
          readFileSync(absolutePath, 'utf8')
        );
      }
    }
  }

  visit(root);
  return files;
}

function main(): void {
  const findings = validateDocsStructure(collectDocsFiles(DOCS_ROOT));
  for (const finding of findings) {
    console.error(`::error file=docs/en-US/${finding.file}::${finding.message}`);
  }

  if (findings.length > 0) {
    console.error(
      `\nDocumentation structure validation failed with ${findings.length} issue(s).`
    );
    process.exit(1);
  }

  console.log('Documentation structure is valid.');
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main();
}
