import { createAPIPage } from 'fumadocs-openapi/ui';

import { openapi } from '@/lib/openapi';

// Server component used inside MDX as `<APIPage document="gt-api" ... />`.
export const APIPage = createAPIPage(openapi, {
  // The public contract has recursive JSON schemas that overflow this renderer's
  // optional TypeScript converter. Keep the full response schema and examples;
  // the generated SDK provides the supported TypeScript request/response types.
  generateTypeScriptSchema: false,
});
