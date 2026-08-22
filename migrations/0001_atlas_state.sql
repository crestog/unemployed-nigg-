CREATE TABLE IF NOT EXISTS atlas_profiles (
  profile_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS atlas_favorites (
  profile_id TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, roadmap_slug),
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atlas_progress (
  profile_id TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, topic_id),
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atlas_notes (
  profile_id TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (profile_id, topic_id),
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS atlas_plans (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  goal TEXT NOT NULL,
  roadmap_slug TEXT NOT NULL,
  level TEXT NOT NULL,
  hours INTEGER NOT NULL,
  pace TEXT NOT NULL,
  topic_ids_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES atlas_profiles(profile_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_atlas_progress_profile_roadmap ON atlas_progress(profile_id, roadmap_slug);
CREATE INDEX IF NOT EXISTS idx_atlas_notes_profile_roadmap ON atlas_notes(profile_id, roadmap_slug);
CREATE INDEX IF NOT EXISTS idx_atlas_plans_profile_created ON atlas_plans(profile_id, created_at DESC);
