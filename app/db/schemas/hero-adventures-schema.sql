CREATE TABLE hero_adventures
(
  available INTEGER NOT NULL CHECK (available > 0),
  completed INTEGER NOT NULL CHECK (completed >= 0)
);
