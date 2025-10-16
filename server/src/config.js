import 'dotenv/config';

function normalizeBase(url) {
  if (!url) return '';
  // ensure trailing slash
  url = url.replace(/\/?$/, '/');
  return url;
}

function validateBase(url) {
  const ok = /^https:\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/[^@/]+@[^/]+\/$/i.test(url);
  if (!ok) {
    throw new Error(
      `Invalid CDN_BASE_URL. Expected 'https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/' but got '${url}'`
    );
  }
}

const corsAllowedOrigin = process.env.CORS_ALLOWED_ORIGIN;

export const config = {
  port: process.env.PORT || 8080,
  corsAllowedOrigin,
  cdnBaseUrl: (() => {
    const v = normalizeBase(process.env.CDN_BASE_URL || '');
    validateBase(v);
    return v;
  })(),
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || 15 * 60 * 1000)
};
