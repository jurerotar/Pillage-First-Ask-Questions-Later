CREATE TABLE resources_history
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('unit-training', 'building-level-change')),
  subject_id INTEGER NOT NULL,
  wood INTEGER NOT NULL,
  clay INTEGER NOT NULL,
  iron INTEGER NOT NULL,
  wheat INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_history_resources_subject ON resources_history (subject_type, subject_id);
