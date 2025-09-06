CREATE TABLE adventure_points
(
  amount INTEGER NOT NULL CHECK (amount >= 0)
);
