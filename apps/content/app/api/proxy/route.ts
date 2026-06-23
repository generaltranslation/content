import { openapi } from '@/lib/openapi';

// Proxies playground requests through the docs server to avoid CORS issues.
export const { GET, HEAD, PUT, POST, PATCH, DELETE } = openapi.createProxy();
