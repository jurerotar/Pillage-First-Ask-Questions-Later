CREATE TABLE battle_report_stolen_items
(
  battle_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),

  PRIMARY KEY (battle_id, item_id),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE
) STRICT;
