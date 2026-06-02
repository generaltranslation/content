import { blog, devlog, docs } from '@/.source';

export type ContentCollection = 'docs' | 'blog' | 'devlog';
export type ContentEntry =
  | (typeof docs.docs)[number]
  | (typeof blog)[number]
  | (typeof devlog)[number];

export const collections = {
  docs: docs.docs,
  blog,
  devlog,
} satisfies Record<ContentCollection, ContentEntry[]>;

export const collectionLabels = {
  docs: 'Docs',
  blog: 'Blog',
  devlog: 'Devlog',
} satisfies Record<ContentCollection, string>;

export function isCollection(value: string): value is ContentCollection {
  return value in collections;
}

export function stripLocale(path: string) {
  return path.replace(/^en-US\//, '');
}

export function stripExtension(path: string) {
  return path.replace(/\.mdx?$/, '');
}

export function normalizePath(path: string) {
  const withoutExtension = stripExtension(stripLocale(path));
  return withoutExtension.replace(/\/index$/, '');
}

export function entryHref(collection: ContentCollection, entry: ContentEntry) {
  const normalized = normalizePath(entry.info.path);
  return normalized ? `/${collection}/${normalized}` : `/${collection}`;
}

export function entrySection(entry: ContentEntry) {
  return normalizePath(entry.info.path).split('/')[0] || 'index';
}

export function entrySummary(entry: ContentEntry) {
  return entry.description ?? entry.summary ?? '';
}

export function entryDate(entry: ContentEntry) {
  if (!('date' in entry) || !entry.date) return '';
  return String(entry.date);
}

export function collectionEntries(collection: ContentCollection) {
  return collections[collection];
}

export function collectionStats(collection: ContentCollection) {
  const entries = collectionEntries(collection);
  const sections = new Set(entries.map(entrySection));

  return {
    entries: entries.length,
    sections: sections.size,
  };
}

export function sortDatedEntries(entries: ContentEntry[]) {
  return [...entries].sort((a, b) => entryDate(b).localeCompare(entryDate(a)));
}

export function groupEntries(entries: ContentEntry[]) {
  return entries.reduce<Record<string, ContentEntry[]>>((groups, entry) => {
    const section = entrySection(entry);
    groups[section] ??= [];
    groups[section].push(entry);
    return groups;
  }, {});
}

function slugToCandidates(slug: string[] = []) {
  const joined = slug.join('/');
  const candidates = new Set<string>();

  if (joined) {
    candidates.add(`${joined}.mdx`);
    candidates.add(`${joined}/index.mdx`);
  }

  if (!joined.startsWith('en-US')) {
    if (joined) {
      candidates.add(`en-US/${joined}.mdx`);
      candidates.add(`en-US/${joined}/index.mdx`);
    } else {
      candidates.add('en-US/index.mdx');
    }
  }

  return candidates;
}

export function getEntry(collection: string, slug: string[] = []) {
  if (!isCollection(collection)) return;
  if (slug.length === 0 || (slug.length === 1 && slug[0] === 'en-US')) return;

  const candidates = slugToCandidates(slug);
  return collections[collection].find((entry) => candidates.has(entry.info.path));
}

export function pathToSlugs(path: string) {
  const withoutExtension = stripExtension(path);
  const slugs = new Set<string>();
  slugs.add(withoutExtension);

  if (withoutExtension.endsWith('/index')) {
    slugs.add(withoutExtension.replace(/\/index$/, ''));
  }

  const withoutLocale = stripLocale(withoutExtension);
  slugs.add(withoutLocale);

  if (withoutLocale.endsWith('/index')) {
    slugs.add(withoutLocale.replace(/\/index$/, ''));
  }

  return [...slugs].filter(Boolean).map((slug) => slug.split('/'));
}

export function staticParams(
  selectedCollections: ContentCollection[] = ['docs', 'blog', 'devlog']
) {
  return selectedCollections.flatMap((collection) => [
    {
      collection,
      slug: [],
    },
    {
      collection,
      slug: ['en-US'],
    },
    ...collections[collection].flatMap((entry) =>
      pathToSlugs(entry.info.path).map((slug) => ({
        collection,
        slug,
      }))
    ),
  ]);
}
