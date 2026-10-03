// Per-account throttling for this single-instance application; never retain passwords.
const attempts = new Map<string, { count: number; expires: number }>();
const WINDOW_MS = 15 * 60 * 1000;
export function allowLoginAttempt(name: string) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.expires <= now) attempts.delete(key);
  const key = name.trim().toLowerCase();
  const entry = attempts.get(key);
  if (entry) {
    if (entry.count >= 20) return false;
    entry.count++;
  } else {
    if (attempts.size >= 1000) return false;
    attempts.set(key, { count: 1, expires: now + WINDOW_MS });
  }
  return true;
}
export function clearLoginAttempts(name: string) { attempts.delete(name.trim().toLowerCase()); }
