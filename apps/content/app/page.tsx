import { CollectionCards, PageShell } from '@/components/site';
import { blog, devlog, docs } from '@/.source';

export default function Home() {
  return (
    <PageShell>
      <div className='content-header'>
        <span className='eyebrow'>Build check</span>
        <h1>GT content</h1>
        <p>
          A lightweight Next.js app that renders repository docs, blog posts,
          and devlogs through the same MDX build path used before deploy.
        </p>
      </div>
      <CollectionCards />
      <p className='meta'>
        {docs.docs.length} docs pages / {blog.length} blog posts /{' '}
        {devlog.length} devlog posts
      </p>
    </PageShell>
  );
}
