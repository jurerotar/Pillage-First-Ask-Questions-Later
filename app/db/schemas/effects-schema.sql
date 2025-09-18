CREATE TABLE effects
(
  id         INTEGER PRIMARY KEY,

  -- What the effect changes
  effect_id  TEXT NOT NULL,
  value      REAL NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('base','bonus','bonus-booster')),

  -- Where it applies
  scope      TEXT NOT NULL CHECK (scope IN ('global','village','server')),
  source     TEXT NOT NULL CHECK (source IN ('hero','oasis','artifact','building','tribe','server','troops')),

  -- Attachments
  village_id   INTEGER,   -- required when scope='village'
  source_specifier  INTEGER,   -- unified numeric specifier:
                          --   source='artifact' -> artifactId  ( > 0 )
                          --   source='oasis'    -> tileId      ( > 0 )
                          --   source='building' -> slot 1..40, or 0 = 'hidden'
                          --   others            -> NULL

  FOREIGN KEY (village_id) REFERENCES villages(id) ON DELETE CASCADE ON UPDATE CASCADE,

  -- Scope rules
  CHECK ( (scope <> 'village') OR village_id IS NOT NULL ),
  CHECK ( (scope <> 'global')  OR village_id IS NULL ),
  CHECK ( (scope <> 'server')  OR village_id IS NULL ),

  -- Source ↔ scope compatibility
  CHECK ( source <> 'oasis'    OR scope = 'village' ),
  CHECK ( source <> 'building' OR scope = 'village' ),
  CHECK ( source <> 'troops'   OR scope = 'village' ),
  CHECK ( source <> 'tribe'    OR scope = 'global'  ),
  CHECK ( source <> 'server'   OR scope IN ('server','village') ),
  CHECK ( source <> 'hero'     OR scope IN ('global','village') ),

  -- Source-specific specifier constraints
  CHECK ( source <> 'artifact' OR (source_specifier IS NOT NULL AND source_specifier > 0) ),
  CHECK ( source <> 'oasis'    OR (source_specifier IS NOT NULL AND source_specifier > 0) ),
  CHECK ( source <> 'building' OR (source_specifier IS NOT NULL AND (source_specifier = 0 OR source_specifier BETWEEN 1 AND 40)) ),

  -- Sources that should not carry a specifier
  CHECK ( (source NOT IN ('hero','server','tribe','troops')) OR source_specifier IS NULL )
);
