// A bounded per-process brake, not a substitute for a distributed hosting/WAF
// rate limit. Keys are hashes, so usernames are not retained in this map.
export function loginLimiter(
  limit = 5,
  windowMs = 15 * 60 * 1000,
  capacity = 2048,
) {
  const records = new Map<string, { count: number; until: number }>();
  return {
    attempt(key: string, now = Date.now()) {
      for (const [key, record] of records)
        if (record.until <= now) records.delete(key);
      const record = records.get(key);
      if (record) {
        if (record.count >= limit) return false;
        record.count++;
        return true;
      }
      if (records.size >= capacity) return false;
      records.set(key, { count: 1, until: now + windowMs });
      return true;
    },
    reset(key: string) {
      records.delete(key);
    },
  };
}
