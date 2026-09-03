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
    ];
  },
};

export default withMDX(config);
