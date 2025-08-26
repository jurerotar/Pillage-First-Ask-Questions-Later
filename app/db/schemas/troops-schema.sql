CREATE TABLE troops_base
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id INTEGER NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  tile_id INTEGER NOT NULL,
  source INTEGER NOT NULL,

  FOREIGN KEY (unit_id) REFERENCES units (id),
  FOREIGN KEY (tile_id) REFERENCES tiles_base (id) ON DELETE CASCADE,
  FOREIGN KEY (source) REFERENCES tiles_base (id) ON DELETE CASCADE
);

CREATE VIEW troops AS
SELECT tb.id,
       u.name AS unit_id,
       tb.amount,
       tb.tile_id,
       tb.source
FROM troops_base tb
       JOIN units u ON u.id = tb.unit_id;

CREATE TRIGGER troops_ins
  INSTEAD OF INSERT
  ON troops
BEGIN
  INSERT INTO troops_base (id, unit_id, amount, tile_id, source)
  VALUES (NEW.id,
          COALESCE(
            (SELECT id FROM units WHERE id = CAST(NEW.unit_id AS INTEGER)),
            (SELECT id FROM units WHERE name = NEW.unit_id COLLATE NOCASE)
          ),
          NEW.amount,
          NEW.tile_id,
          NEW.source);
END;

CREATE TRIGGER troops_upd
  INSTEAD OF UPDATE
  ON troops
BEGIN
  UPDATE troops_base
  SET unit_id =
        COALESCE(
          (SELECT id FROM units WHERE id = CAST(NEW.unit_id AS INTEGER)),
          (SELECT id FROM units WHERE name = NEW.unit_id COLLATE NOCASE),
          unit_id
        ),
      amount  = NEW.amount,
      tile_id = NEW.tile_id,
      source  = NEW.source
  WHERE id = OLD.id;
END;
