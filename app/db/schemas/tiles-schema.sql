CREATE TABLE tile_type
(
  type_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

INSERT INTO tile_type (type_id, name)
VALUES (1, 'free'),
       (2, 'oasis'),
       (3, 'wilderness');

CREATE TABLE tiles_base
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  type_id INTEGER NOT NULL,
  resource_field_composition_id INTEGER,
  oasis_graphics INTEGER,
  FOREIGN KEY (type_id) REFERENCES tile_type (type_id),
  FOREIGN KEY (resource_field_composition_id) REFERENCES resource_field_compositions (id)
);

CREATE VIEW tiles AS
SELECT b.id,
       b.x,
       b.y,
       tt.name AS type,
       rfc.resource_field_composition,
       b.oasis_graphics
FROM tiles_base b
       JOIN tile_type tt ON tt.type_id = b.type_id
       LEFT JOIN resource_field_compositions rfc ON rfc.id = b.resource_field_composition_id;

CREATE TRIGGER tiles_ins
  INSTEAD OF INSERT ON tiles
BEGIN
  INSERT INTO tiles_base (id, x, y, type_id, resource_field_composition_id, oasis_graphics)
  VALUES (
           NEW.id,
           NEW.x,
           NEW.y,
           COALESCE(
             (SELECT type_id FROM tile_type WHERE type_id = CAST(NEW.type AS INTEGER)),
             (SELECT type_id FROM tile_type WHERE name = NEW.type)
           ),
           CASE
             WHEN NEW.resource_field_composition IS NULL THEN NULL
             ELSE COALESCE(
               (SELECT id FROM resource_field_compositions
                WHERE id = CAST(NEW.resource_field_composition AS INTEGER)),
               (SELECT id FROM resource_field_compositions
                WHERE resource_field_composition = NEW.resource_field_composition)
                  )
             END,
           NEW.oasis_graphics
         );
END;

CREATE TRIGGER tiles_upd
  INSTEAD OF UPDATE ON tiles
BEGIN
  UPDATE tiles_base
  SET x = NEW.x,
      y = NEW.y,
      type_id =
        COALESCE(
          (SELECT type_id FROM tile_type WHERE type_id = CAST(NEW.type AS INTEGER)),
          (SELECT type_id FROM tile_type WHERE name = NEW.type),
          type_id
        ),
      resource_field_composition_id =
        CASE
          WHEN NEW.resource_field_composition IS NULL THEN resource_field_composition_id
          ELSE COALESCE(
            (SELECT id FROM resource_field_compositions
             WHERE id = CAST(NEW.resource_field_composition AS INTEGER)),
            (SELECT id FROM resource_field_compositions
             WHERE resource_field_composition = NEW.resource_field_composition),
            resource_field_composition_id
               )
          END,
      oasis_graphics = COALESCE(NEW.oasis_graphics, OLD.oasis_graphics)
  WHERE id = OLD.id;
END;
