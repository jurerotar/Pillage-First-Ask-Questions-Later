CREATE TABLE IF NOT EXISTS gathering_resource_totals
(
  player_id INTEGER PRIMARY KEY REFERENCES players (id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 0)
) STRICT;
