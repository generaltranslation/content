import { createFromSource } from 'fumadocs-core/search/server';

import {
  promoteExactComponentResults,
  type DocsSearchResult,
} from '@/search-results';
import { source } from '@/source';

const search = createFromSource(source);

export async function GET(request: Request): Promise<Response> {
  const response = await search.GET(request);
  const query = new URL(request.url).searchParams.get('query');
  if (!response.ok || !query) return response;

  const results = (await response.json()) as DocsSearchResult[];
  return Response.json(promoteExactComponentResults(results, query));
}
