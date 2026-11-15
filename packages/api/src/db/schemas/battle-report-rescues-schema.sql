CREATE TABLE battle_report_rescues
(
  battle_id INTEGER PRIMARY KEY,
  traps_destroyed INTEGER NOT NULL CHECK (traps_destroyed >= 0),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE
) STRICT;
