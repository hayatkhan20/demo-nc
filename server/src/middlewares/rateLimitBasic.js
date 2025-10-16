// Extremely simple IP bucket; fine for Phase 1 (Render free tiers).
const hits = new Map();
const WINDOW_MS = 60_000;
const MAX_HITS = 120;

export function rateLimitBasic(req, res, next) {
  const now = Date.now();
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const bucket = hits.get(ip) || [];
  const recent = bucket.filter(ts => now - ts < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > MAX_HITS) {
    return res.status(429).json({ error: { code: 429, message: 'Too Many Requests' } });
  }
  next();
}
