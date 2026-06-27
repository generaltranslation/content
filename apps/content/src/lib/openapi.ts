import path from 'node:path';

import { createOpenAPI } from 'fumadocs-openapi/server';

// The OpenAPI spec lives alongside the docs content so it ships with the docs.
// We register it under a stable schema id (`gt-api`) so MDX pages can reference
// it with `<APIPage document="gt-api" />` regardless of the on-disk path, which
// differs between this app and the landing app that renders the same content.
export const openapi = createOpenAPI({
  input: () => ({
    'gt-api': path.join(
      process.cwd(),
      '../../docs/en-US/api/openapi.yaml'
    ),
  }),
  proxyUrl: '/api/proxy',
});
