import path from 'node:path';

import { LATEST_OPENAPI_FILE } from './openApiDocuments.mjs';

export const OPENAPI_DIR = path.join(
  process.cwd(),
  '../../docs/en-US/platform/openapi'
);

export const OPENAPI_SPEC_PATH = path.join(OPENAPI_DIR, LATEST_OPENAPI_FILE);
