import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/docs/cli/reference/formats/apple-strings-files',
        destination: '/docs/cli/reference/formats/dot-strings-files',
        permanent: true,
      },
      {
        source: '/docs/cli/reference/formats/apple-stringsdict-files',
        destination: '/docs/cli/reference/formats/dot-stringsdict-files',
        permanent: true,
      },
      {
        source: '/:locale/docs/cli/reference/formats/apple-strings-files',
        destination: '/:locale/docs/cli/reference/formats/dot-strings-files',
        permanent: true,
      },
      {
        source: '/:locale/docs/cli/reference/formats/apple-stringsdict-files',
        destination:
          '/:locale/docs/cli/reference/formats/dot-stringsdict-files',
        permanent: true,
      },
      {
        source: '/docs/rrweb',
        destination: '/docs/integrations/rrweb/quickstart',
        permanent: true,
      },
      {
        source: '/docs/rrweb/guides',
        destination:
          '/docs/integrations/rrweb/guides/recording-walkthroughs',
        permanent: true,
      },
      {
        source: '/docs/rrweb/reference',
        destination: '/docs/integrations/rrweb/reference/recorder',
        permanent: true,
      },
      {
        source: '/docs/rrweb/:path*',
        destination: '/docs/integrations/rrweb/:path*',
        permanent: true,
      },
      {
        source: '/:locale/docs/rrweb',
        destination: '/:locale/docs/integrations/rrweb/quickstart',
        permanent: true,
      },
      {
        source: '/:locale/docs/rrweb/guides',
        destination:
          '/:locale/docs/integrations/rrweb/guides/recording-walkthroughs',
        permanent: true,
      },
      {
        source: '/:locale/docs/rrweb/reference',
        destination: '/:locale/docs/integrations/rrweb/reference/recorder',
        permanent: true,
      },
      {
        source: '/:locale/docs/rrweb/:path*',
        destination: '/:locale/docs/integrations/rrweb/:path*',
        permanent: true,
      },
    ];
  },
};

export default withMDX(config);
