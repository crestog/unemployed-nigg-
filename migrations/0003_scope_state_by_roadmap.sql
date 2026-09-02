-- Re-keys progress and notes on (profile_id, roadmap_slug, topic_id).
--
-- 0001 declared the primary key as (profile_id, topic_id) and left
-- roadmap_slug as an ordinary column. Because the write path uses
-- `INSERT OR REPLACE`, completing a topic whose id also appears in another
-- roadmap silently destroyed that other roadmap's row. Topic ids like `html`,
-- `git`, `sql` and `docker` are shared across most roadmaps in the catalog, so
-- this was not a corner case: it fired on ordinary use.
--
-- Rows that already collided cannot be recovered. `INSERT OR REPLACE` overwrote
-- the loser in place, so there is no earlier version to copy forward. Carrying
-- the surviving rows over is the best available outcome; the alternative would
-- be dropping the table, which loses strictly more.
--
-- The two (profile_id, roadmap_slug) indexes from 0001 are not recreated: the
-- new primary key has profile_id and roadmap_slug as its leading columns, so it
-- serves the same lookups. They are dropped implicitly with the old tables.

CREATE TABLE atlas_progress_v2 (
  profile_id TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, roadmap_slug, topic_id),
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO atlas_progress_v2
  (profile_id, roadmap_slug, topic_id, completed, updated_at)
SELECT profile_id, roadmap_slug, topic_id, completed, updated_at
FROM atlas_progress;

DROP TABLE atlas_progress;
ALTER TABLE atlas_progress_v2 RENAME TO atlas_progress;

CREATE TABLE atlas_notes_v2 (
  profile_id TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, roadmap_slug, topic_id),
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO atlas_notes_v2
  (profile_id, roadmap_slug, topic_id, note, updated_at)
SELECT profile_id, roadmap_slug, topic_id, note, updated_at
FROM atlas_notes;

DROP TABLE atlas_notes;
ALTER TABLE atlas_notes_v2 RENAME TO atlas_notes;
