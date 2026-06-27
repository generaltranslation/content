import { createAPIPage } from 'fumadocs-openapi/ui';

import { openapi } from '@/lib/openapi';

// Server component used inside MDX as `<APIPage document="gt-api" ... />`.
export const APIPage = createAPIPage(openapi);
