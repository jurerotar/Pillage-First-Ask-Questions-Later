CREATE TABLE battle_report_rescued_units
(
  battle_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  -- Tile of the troops' original home village, where rescued survivors return.
  home_tile_id INTEGER NOT NULL,
  unit_id INTEGER NOT NULL,
  amount_freed INTEGER NOT NULL CHECK (amount_freed > 0),
  amount_died INTEGER NOT NULL CHECK (amount_died BETWEEN 0 AND amount_freed),

  PRIMARY KEY (battle_id, player_id, home_tile_id, unit_id),

  FOREIGN KEY (battle_id) REFERENCES battle_report_rescues (battle_id) ON DELETE CASCADE,
  FOREIGN KEY (home_tile_id) REFERENCES tiles (id),
  FOREIGN KEY (unit_id) REFERENCES unit_ids (id)
) STRICT;
