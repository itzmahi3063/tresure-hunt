/**
 * ANTI-CHEAT NOTES (read this before wiring up new reward endpoints)
 * ---------------------------------------------------------------
 * The single most important rule: the CLIENT NEVER SENDS A BALANCE OR AMOUNT.
 * It only ever sends "I finished task X" or "I watched ad slot Y". The server
 * looks up how much that task/ad is worth (from MongoDB, set by you in the
 * admin panel) and credits it itself. A user opening devtools and editing the
 * request body can change "taskId" to a different valid task, but they can
 * never inject an arbitrary coin amount, because the amount is never read
 * from the request.
 *
 * Second rule: every reward-granting route is rate-limited AND idempotent
 * per (user, task/ad, time-window) so replaying the same request or firing
 * it in a loop doesn't multiply rewards.
 */

const buckets = new Map(); // in-memory fallback; swap for Redis in production/multi-instance deploys

/**
 * Simple fixed-window rate limiter. Returns true if the call is allowed.
 */
export function rateLimit(key, { maxCalls = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  return bucket.count <= maxCalls;
}

/**
 * Enforces "one credited completion per ad watch" using a server-timed window.
 * The client tells us when it STARTED watching; we only accept the completion
 * call if enough real time elapsed for the ad's declared duration, and only once
 * per (user, adSlot, day).
 */
export function isPlausibleAdWatch(startedAtMs, minDurationMs = 15_000) {
  if (!startedAtMs) return false;
  const elapsed = Date.now() - Number(startedAtMs);
  return elapsed >= minDurationMs && elapsed < minDurationMs * 20; // also reject absurdly long/replayed timestamps
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
