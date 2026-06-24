const CACHE_NAME = "course-files-offline-v1";

function cacheKey(courseId: string, fileId: string): string {
  return `/__offline-file__/${courseId}/${fileId}`;
}

export async function getCachedBlob(
  courseId: string,
  fileId: string,
): Promise<Blob | null> {
  if (!("caches" in window)) return null;
  const cache = await caches.open(CACHE_NAME);
  const res = await cache.match(cacheKey(courseId, fileId));
  if (!res) return null;
  return await res.blob();
}

export async function cacheFile(
  courseId: string,
  fileId: string,
  blob: Blob,
  contentType?: string | null,
): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(blob, {
    headers: { "Content-Type": contentType || "application/octet-stream" },
  });
  await cache.put(cacheKey(courseId, fileId), response);
}

export async function removeCachedFile(
  courseId: string,
  fileId: string,
): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  await cache.delete(cacheKey(courseId, fileId));
}

export async function listCachedIds(courseId: string): Promise<Set<string>> {
  if (!("caches" in window)) return new Set();
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  const prefix = `/__offline-file__/${courseId}/`;
  const ids = new Set<string>();
  for (const req of requests) {
    const path = new URL(req.url).pathname;
    if (path.startsWith(prefix)) {
      ids.add(path.slice(prefix.length));
    }
  }
  return ids;
}
