CREATE TABLE IF NOT EXISTS meta (
  last_write INTEGER NOT NULL,
  total_time_skipped INTEGER NOT NULL DEFAULT 0,
  vacation_started_at INTEGER DEFAULT NULL
);
