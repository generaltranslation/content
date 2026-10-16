import { openapi } from '@/lib/openapi';

// Proxies playground requests through the docs server to avoid CORS issues.
// The proxy is same-origin only unless the spec's server is allowed.
export const { GET, HEAD, PUT, POST, PATCH, DELETE } = openapi.createProxy({
  allowedOrigins: ['https://api.gtx.dev'],
});
