CREATE TABLE battle_participants
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  -- 'attacker' or 'defender'
  role TEXT NOT NULL,
  tribe_id INTEGER NOT NULL,
  -- boolean
  is_reinforcement INTEGER NOT NULL,

  FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
) STRICT;
