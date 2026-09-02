-- Fixed-window counters for the three Workers AI endpoints, which were
-- previously unauthenticated *and* unmetered: any caller could spend the
-- account's inference budget at max_tokens per request, without limit.
--
-- bucket_key is "<namespace>:<windowStartMs>:<subject>", so the window is baked
-- into the key and a new hour starts a new row rather than needing a
-- read-modify-write reset. The Worker keeps two namespaces — "id:" per identity
-- cookie and "ip:" per client address — and requires both to be under their
-- ceiling, because a per-identity limit alone is bypassed by discarding the
-- cookie. Counters are pruned by the first request of each new window;
-- window_start is indexed for that DELETE.

CREATE TABLE IF NOT EXISTS atlas_ai_usage (
  bucket_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_atlas_ai_usage_window
  ON atlas_ai_usage (window_start);
