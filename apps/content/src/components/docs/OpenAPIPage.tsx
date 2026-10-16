'use client';

import { createOpenAPIPage } from 'fumadocs-openapi/ui';

const OpenAPIPage = createOpenAPIPage({
  // The public contract has recursive JSON schemas that overflow this renderer's
  // optional TypeScript converter. Keep the full response schema and examples;
  // the generated SDK provides the supported TypeScript request/response types.
  generateTypeScriptDefinitions: false,
});

export default OpenAPIPage;
