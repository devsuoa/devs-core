const CACHE_NAME = "devsuoa-image-cache-v1";
const TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHED_AT_HEADER = "x-cached-at";

let prunedOnce = false;

// Object URLs already resolved this session, keyed by source URL. Lets a
// remounted <img> (e.g. paginating back to a previously-seen page) render
// its image on the very first paint instead of re-running the async Cache
// Storage lookup and flashing blank in the meantime.
const objectUrlCache = new Map<string, { url: string; cachedAt: number }>();

// Sweeps out anything past the TTL so the cache doesn't grow unbounded.
// Fire-and-forget: runs once per session, never blocks a lookup.
async function pruneExpired(cache: Cache) {
  if (prunedOnce) return;
  prunedOnce = true;

  const requests = await cache.keys();
  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request);
      const cachedAt = Number(response?.headers.get(CACHED_AT_HEADER) ?? 0);
      if (Date.now() - cachedAt > TTL_MS) {
        await cache.delete(request);
        const entry = objectUrlCache.get(request.url);
        if (entry) {
          URL.revokeObjectURL(entry.url);
          objectUrlCache.delete(request.url);
        }
      }
    }),
  );
}

/**
 * Synchronous lookup of an already-resolved object URL for `src` from this
 * session's in-memory cache. Returns null if nothing's resolved yet (or it
 * expired) — caller should fall back to `getCachedImageUrl`.
 */
export function peekCachedImageUrl(src: string): string | null {
  const entry = objectUrlCache.get(src);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > TTL_MS) {
    URL.revokeObjectURL(entry.url);
    objectUrlCache.delete(src);
    return null;
  }
  return entry.url;
}

/**
 * Returns a local object URL for `src`, serving it from the Cache Storage
 * API when a fresh (<1hr old) copy exists. Falls back to the original URL
 * if caching is unsupported or anything goes wrong.
 */
export async function getCachedImageUrl(src: string): Promise<string> {
  if (!src || typeof caches === "undefined") return src;

  const inMemory = peekCachedImageUrl(src);
  if (inMemory) return inMemory;

  try {
    const cache = await caches.open(CACHE_NAME);
    void pruneExpired(cache);

    const cached = await cache.match(src);
    if (cached) {
      const cachedAt = Number(cached.headers.get(CACHED_AT_HEADER) ?? 0);
      if (Date.now() - cachedAt < TTL_MS) {
        const url = URL.createObjectURL(await cached.blob());
        objectUrlCache.set(src, { url, cachedAt });
        return url;
      }
      await cache.delete(src);
    }

    const response = await fetch(src);
    if (!response.ok) return src;

    const blob = await response.blob();
    const cachedAt = Date.now();
    const headers = new Headers(response.headers);
    headers.set(CACHED_AT_HEADER, cachedAt.toString());
    await cache.put(
      src,
      new Response(blob, {
        headers,
        status: response.status,
        statusText: response.statusText,
      }),
    );

    const url = URL.createObjectURL(blob);
    objectUrlCache.set(src, { url, cachedAt });
    return url;
  } catch {
    return src;
  }
}
