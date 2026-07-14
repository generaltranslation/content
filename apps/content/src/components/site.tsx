import Link from 'next/link';

import {
  collectionEntries,
  collectionLabels,
  collectionStats,
  entryDate,
  entryHref,
  entrySection,
  entrySummary,
  groupEntries,
  sortDatedEntries,
} from '@/content';

import type { ContentCollection, ContentEntry } from '@/content';
import type { ReactNode } from 'react';

const collectionOrder: ContentCollection[] = ['docs', 'blog', 'devlog'];

export function SiteHeader() {
  return (
    <header className='bg-fd-background sticky top-0 z-10 flex items-center justify-between gap-6 border-b px-6 py-3'>
      <Link className='font-semibold no-underline' href='/'>
        GT content
      </Link>
      <nav
        className='text-fd-muted-foreground flex gap-4 text-sm'
        aria-label='Primary'
      >
        {collectionOrder.map((collection) => (
          <Link
            className='hover:text-fd-foreground transition-colors'
            key={collection}
            href={`/${collection}`}
          >
            {collectionLabels[collection]}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function PageShell({
  aside,
  children,
}: {
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className='max-w-fd-container mx-auto grid w-full gap-10 px-6 py-8 md:grid-cols-[260px_minmax(0,1fr)]'>
        {aside ? (
          <aside className='max-h-[calc(100vh-6rem)] overflow-auto border-r pr-5 text-sm md:sticky md:top-20'>
            {aside}
          </aside>
        ) : null}
        <div className={aside ? 'min-w-0' : 'col-span-full min-w-0'}>
          {children}
        </div>
      </main>
    </>
  );
}

export function CollectionCards() {
  return (
    <div className='grid gap-4 sm:grid-cols-3'>
      {collectionOrder.map((collection) => {
        const stats = collectionStats(collection);

        return (
          <Link
            className='bg-fd-card text-fd-card-foreground hover:bg-fd-accent flex flex-col gap-2 rounded-lg border p-5 no-underline transition-colors'
            href={`/${collection}`}
            key={collection}
          >
            <span className='text-fd-muted-foreground text-xs font-medium tracking-wide uppercase'>
              {stats.entries} pages
            </span>
            <strong className='text-2xl'>{collectionLabels[collection]}</strong>
            <span className='text-fd-muted-foreground text-sm'>
              {stats.sections} {stats.sections === 1 ? 'section' : 'sections'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function CollectionIndex({
  collection,
}: {
  collection: ContentCollection;
}) {
  const entries = collectionEntries(collection);
  const grouped = groupEntries(
    collection === 'docs' ? entries : sortDatedEntries(entries)
  );

  return (
    <PageShell aside={<CollectionSidebar collection={collection} />}>
      <div className='mb-10'>
        <span className='text-fd-muted-foreground text-xs font-medium tracking-wide uppercase'>
          {entries.length} pages
        </span>
        <h1 className='mt-2 text-4xl font-semibold tracking-tight'>
          {collectionLabels[collection]}
        </h1>
        <p className='text-fd-muted-foreground mt-3 max-w-2xl text-lg'>
          A build-only view of the {collectionLabels[collection].toLowerCase()}{' '}
          content included in this repository.
        </p>
      </div>
      <div className='grid gap-10'>
        {Object.entries(grouped).map(([section, sectionEntries]) => (
          <section key={section}>
            <h2 className='mb-3 text-2xl font-semibold'>
              {formatSection(section)}
            </h2>
            <div className='grid gap-3'>
              {sectionEntries.map((entry) => (
                <EntryLink
                  collection={collection}
                  entry={entry}
                  key={entry.info.path}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}

export function CollectionSidebar({
  collection,
  currentPath,
}: {
  collection: ContentCollection;
  currentPath?: string;
}) {
  const entries =
    collection === 'docs'
      ? collectionEntries(collection)
      : sortDatedEntries(collectionEntries(collection));
  const grouped = groupEntries(entries);

  return (
    <nav aria-label={`${collectionLabels[collection]} navigation`}>
      <Link
        className='mb-5 block font-semibold no-underline'
        href={`/${collection}`}
      >
        {collectionLabels[collection]}
      </Link>
      {Object.entries(grouped).map(([section, sectionEntries]) => (
        <div className='mb-6' key={section}>
          <div className='text-fd-muted-foreground text-xs font-medium tracking-wide uppercase'>
            {formatSection(section)}
          </div>
          <ul className='mt-2 list-none space-y-1 p-0'>
            {sectionEntries.map((entry) => {
              const href = entryHref(collection, entry);
              const active = currentPath === entry.info.path;

              return (
                <li key={entry.info.path}>
                  <Link
                    className={
                      active
                        ? 'bg-fd-accent text-fd-accent-foreground block rounded-md px-2 py-1 no-underline'
                        : 'text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground block rounded-md px-2 py-1 no-underline'
                    }
                    href={href}
                  >
                    {entry.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function EntryHeader({
  collection,
  entry,
}: {
  collection: ContentCollection;
  entry: ContentEntry;
}) {
  const summary = entrySummary(entry);
  const date = entryDate(entry);

  return (
    <div className='mb-8'>
      <div className='text-fd-muted-foreground flex flex-wrap gap-2 text-sm'>
        <Link href={`/${collection}`}>{collectionLabels[collection]}</Link>
        <span>/</span>
        <span>{formatSection(entrySection(entry))}</span>
      </div>
      <h1 className='mt-2 text-4xl font-semibold tracking-tight'>
        {entry.title}
      </h1>
      {summary ? (
        <p className='text-fd-muted-foreground mt-3 max-w-2xl text-lg'>
          {summary}
        </p>
      ) : null}
      {date ? (
        <p className='text-fd-muted-foreground mt-3 text-xs font-medium tracking-wide uppercase'>
          {date}
        </p>
      ) : null}
    </div>
  );
}

function EntryLink({
  collection,
  entry,
}: {
  collection: ContentCollection;
  entry: ContentEntry;
}) {
  const summary = entrySummary(entry);
  const date = entryDate(entry);

  return (
    <Link
      className='bg-fd-card text-fd-card-foreground hover:bg-fd-accent flex flex-col gap-1 rounded-lg border p-4 no-underline transition-colors'
      href={entryHref(collection, entry)}
    >
      <strong>{entry.title}</strong>
      {summary ? (
        <span className='text-fd-muted-foreground text-sm'>{summary}</span>
      ) : null}
      {date ? <small className='text-fd-muted-foreground'>{date}</small> : null}
    </Link>
  );
}

function formatSection(section: string) {
  return section
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
