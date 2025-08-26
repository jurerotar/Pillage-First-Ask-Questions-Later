CREATE TABLE tribes
(
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK(name IN ('gauls', 'romans', 'teutons', 'huns', 'egyptians'))
);
