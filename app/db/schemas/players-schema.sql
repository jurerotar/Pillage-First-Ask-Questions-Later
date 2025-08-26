CREATE TABLE players_base
(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tribe_id INTEGER NOT NULL,
  faction_id TEXT NOT NULL,

  FOREIGN KEY (tribe_id) REFERENCES tribes (id),
  FOREIGN KEY (faction_id) REFERENCES factions (id)
);

CREATE VIEW players AS
SELECT b.id,
       b.name,
       b.slug,
       t.name AS tribe,
       b.faction_id
FROM players_base b
       JOIN tribes t ON t.id = b.tribe_id;

-- INSERT via view: accept tribe as id or name; faction as id or name
DROP TRIGGER IF EXISTS players_ins;
CREATE TRIGGER players_ins
  INSTEAD OF INSERT
  ON players
BEGIN
  INSERT INTO players_base (id, name, slug, tribe_id, faction_id)
  VALUES (NEW.id,
          NEW.name,
          NEW.slug,
          COALESCE(
            (SELECT id FROM tribes WHERE id = CAST(NEW.tribe AS INTEGER)),
            (SELECT id FROM tribes WHERE name = NEW.tribe COLLATE NOCASE)
          ),
          COALESCE(
            (SELECT id FROM factions WHERE id = CAST(NEW.faction_id AS INTEGER)),
            (SELECT id FROM factions WHERE name = NEW.faction_id COLLATE NOCASE)
          ));
END;

-- UPDATE via view: NULL means "no change"; accept id or name for both
DROP TRIGGER IF EXISTS players_upd;
CREATE TRIGGER players_upd
  INSTEAD OF UPDATE
  ON players
BEGIN
  UPDATE players_base
  SET name       = NEW.name,
      slug       = NEW.slug,
      tribe_id   =
        COALESCE(
          (SELECT id FROM tribes WHERE id = CAST(NEW.tribe AS INTEGER)),
          (SELECT id FROM tribes WHERE name = NEW.tribe COLLATE NOCASE),
          tribe_id
        ),
      faction_id =
        COALESCE(
          (SELECT id FROM factions WHERE id = CAST(NEW.faction_id AS INTEGER)),
          (SELECT id FROM factions WHERE name = NEW.faction_id COLLATE NOCASE),
          faction_id
        )
  WHERE id = OLD.id;
END;
