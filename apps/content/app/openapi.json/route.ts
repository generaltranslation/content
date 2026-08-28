import { readFile } from 'node:fs/promises';

import { OPENAPI_SPEC_PATH } from '@/lib/openApiPath';

export const dynamic = 'force-static';

export async function GET() {
  const document = await readFile(OPENAPI_SPEC_PATH, 'utf8');

  return new Response(document, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
