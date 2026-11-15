CREATE TABLE effect_type_ids
(
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('base', 'bonus', 'bonus-booster'))
);
