import { createOpenAPI } from 'fumadocs-openapi/server';

import { readOpenApiDocuments } from './openApiDocuments.mjs';
import { OPENAPI_DIR } from './openApiPath';

// These snapshots of gt-cloud/apps/api/openapi.public*.json live alongside the
// docs content so they ship with the standalone app. Each API version is
// registered under a stable schema id (`gt-api` for the latest version,
// `gt-api@<version>` for older ones) so MDX pages can reference it with
// `<APIPage document="gt-api" />` regardless of the on-disk path, which
// differs between this app and the landing app that renders the same content.
export const openapi = createOpenAPI({
  input: Object.fromEntries(
    readOpenApiDocuments(OPENAPI_DIR).map(({ id, path }) => [id, path])
  ),
  proxyUrl: '/api/proxy',
});
