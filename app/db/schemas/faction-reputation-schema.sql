CREATE TABLE faction_reputation_base
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_faction_id INTEGER NOT NULL,
  target_faction_id INTEGER NOT NULL,
  reputation INTEGER NOT NULL DEFAULT 0,

  UNIQUE (source_faction_id, target_faction_id),

  FOREIGN KEY (source_faction_id) REFERENCES factions (id),
  FOREIGN KEY (target_faction_id) REFERENCES factions (id)
);

CREATE VIEW faction_reputation AS
SELECT frb.id,
       sf.name AS source_faction,
       tf.name AS target_faction,
       frb.reputation
FROM faction_reputation_base frb
       JOIN factions sf ON sf.id = frb.source_faction_id
       JOIN factions tf ON tf.id = frb.target_faction_id;

-- INSERT via view: accept ID or name for both factions
CREATE TRIGGER faction_reputation_ins
  INSTEAD OF INSERT
  ON faction_reputation
BEGIN
  INSERT INTO faction_reputation_base (id, source_faction_id, target_faction_id, reputation)
  VALUES (NEW.id,
          COALESCE(
            (SELECT id FROM factions WHERE id = CAST(NEW.source_faction AS INTEGER)),
            (SELECT id FROM factions WHERE name = NEW.source_faction COLLATE NOCASE)
          ),
          COALESCE(
            (SELECT id FROM factions WHERE id = CAST(NEW.target_faction AS INTEGER)),
            (SELECT id FROM factions WHERE name = NEW.target_faction COLLATE NOCASE)
          ),
          NEW.reputation);
END;

-- UPDATE via view: NULL means "no change"; accepts ID or name
CREATE TRIGGER faction_reputation_upd
  INSTEAD OF UPDATE
  ON faction_reputation
BEGIN
  UPDATE faction_reputation_base
  SET source_faction_id =
        COALESCE(
          (SELECT id FROM factions WHERE id = CAST(NEW.source_faction AS INTEGER)),
          (SELECT id FROM factions WHERE name = NEW.source_faction COLLATE NOCASE),
          source_faction_id
        ),
      target_faction_id =
        COALESCE(
          (SELECT id FROM factions WHERE id = CAST(NEW.target_faction AS INTEGER)),
          (SELECT id FROM factions WHERE name = NEW.target_faction COLLATE NOCASE),
          target_faction_id
        ),
      reputation        = NEW.reputation
  WHERE id = OLD.id;
END;
