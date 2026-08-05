export type DocsSearchResult = Readonly<{
  id: string;
  url: string;
  type: 'page' | 'heading' | 'text';
  content: string;
  breadcrumbs?: string[];
  contentWithHighlights?: unknown[];
}>;

function normalizeSearchTerm(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[<>]/g, '')
    .replace(/[^a-z0-9_$]+/g, ' ')
    .trim();
}

function isExactComponentPage(
  result: DocsSearchResult | undefined,
  query: string
): boolean {
  if (
    !result ||
    result.type !== 'page' ||
    !/\/react\/(?:.+\/)?reference\/components\//.test(result.url)
  ) {
    return false;
  }

  const symbol = /^<([A-Za-z_$][A-Za-z0-9_$]*)>$/.exec(result.content)?.[1];
  return (
    symbol !== undefined &&
    normalizeSearchTerm(`${symbol} component`) === normalizeSearchTerm(query)
  );
}

function groupSearchResults(
  results: readonly DocsSearchResult[]
): DocsSearchResult[][] {
  const groups: DocsSearchResult[][] = [];

  for (const result of results) {
    if (result.type === 'page' || groups.length === 0) {
      groups.push([result]);
    } else {
      groups.at(-1)?.push(result);
    }
  }

  return groups;
}

export function promoteExactComponentResults(
  results: readonly DocsSearchResult[],
  query: string
): DocsSearchResult[] {
  const groups = groupSearchResults(results);
  const exact = groups.filter((group) => isExactComponentPage(group[0], query));
  if (exact.length === 0) return [...results];

  const exactSet = new Set(exact);
  return [
    ...exact.flat(),
    ...groups.filter((group) => !exactSet.has(group)).flat(),
  ];
}
