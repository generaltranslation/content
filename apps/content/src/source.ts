import { loader } from 'fumadocs-core/source';

import { docs } from '@/.source';

export const docsBaseUrl = '/docs';

export const source = loader({
  baseUrl: docsBaseUrl,
  icon: () => null,
  i18n: {
    defaultLanguage: 'en-US',
    languages: ['en-US'],
    hideLocale: 'default-locale',
    parser: 'dir',
  },
  source: docs.toFumadocsSource(),
});

export type DocsPage = NonNullable<ReturnType<typeof source.getPage>>;
