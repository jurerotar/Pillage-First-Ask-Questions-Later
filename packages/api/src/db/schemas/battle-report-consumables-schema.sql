CREATE TABLE battle_report_consumables
(
  battle_participant_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),

  PRIMARY KEY (battle_participant_id, item_id),

  FOREIGN KEY (battle_participant_id) REFERENCES battle_report_heroes (battle_participant_id) ON DELETE CASCADE
) STRICT, WITHOUT ROWID;
