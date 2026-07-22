import { createMDX } from 'fumadocs-mdx/next';
import type { NextConfig } from 'next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Docs media lives in the generaltranslation/media repo and serves from
      // assets.gtx.dev, which sends no CORS headers. JS-fetched files (the
      // asciinema .cast recordings) go through this same-origin proxy instead.
      // The landing app (gt-cloud), which also renders these docs, carries the
      // same rewrite so one MDX path works in both renderers.
      {
        source: '/remote-assets/:path*',
        destination: 'https://assets.gtx.dev/:path*',
      },
    ];
  },
};

export default withMDX(config);
