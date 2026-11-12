CREATE TABLE battle_report_captured_animals
(
  battle_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),

  PRIMARY KEY (battle_id, unit_id),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
