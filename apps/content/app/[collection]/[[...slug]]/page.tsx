import {
  CollectionIndex,
  CollectionSidebar,
  EntryHeader,
  PageShell,
} from '@/components/site';
import { getEntry, isCollection, staticParams } from '@/content';
import { getMDXComponents } from '@/mdx-components';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return staticParams(['blog', 'devlog']);
}

export default async function Page({
  params,
}: {
  params: Promise<{ collection: string; slug?: string[] }>;
}) {
  const { collection, slug } = await params;
  if (!isCollection(collection)) notFound();
  if (collection === 'docs') notFound();

  const entry = getEntry(collection, slug);

  if (!entry) {
    if (!slug?.length || (slug.length === 1 && slug[0] === 'en-US')) {
      return <CollectionIndex collection={collection} />;
    }

    notFound();
  }

  const MDXContent = entry.body;

  return (
    <PageShell
      aside={
        <CollectionSidebar
          collection={collection}
          currentPath={entry.info.path}
        />
      }
    >
      <EntryHeader collection={collection} entry={entry} />
      <article className='article'>
        <MDXContent components={getMDXComponents()} />
      </article>
    </PageShell>
  );
}
