CREATE TABLE battle_report_rescues
(
  battle_id INTEGER PRIMARY KEY,
  traps_destroyed INTEGER NOT NULL DEFAULT 0 CHECK (traps_destroyed >= 0),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE
) STRICT;
