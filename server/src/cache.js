const store = new Map();
const inflight = new Map();

export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return { value: null, stale: false, hit: false };

  const stale = Date.now() > entry.expiresAt;
  return { value: entry.value, stale, hit: true };
}

export function cacheSet(key, value, ttlMs = 5000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Wrap an async fetch fn with stale-while-revalidate caching.
 * Returns cached value immediately if present (even if stale),
 * and kicks off a background refresh if stale.
 */
export async function cached(key, ttlMs, fetchFn) {
  const hit = cacheGet(key);

  if (hit.hit) {
    // Serve cached value. If stale, refresh in background (deduped).
    if (hit.stale && !inflight.has(key)) {
      const p = fetchFn()
        .then((fresh) => {
          cacheSet(key, fresh, ttlMs);
          return fresh;
        })
        .catch(() => {
          // keep old value on error
        })
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return hit.value;
  }

  // First ever request: must wait synchronously.
  if (inflight.has(key)) return inflight.get(key);
  const p = fetchFn()
    .then((fresh) => {
      cacheSet(key, fresh, ttlMs);
      return fresh;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function cacheInvalidate(prefix = "") {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}