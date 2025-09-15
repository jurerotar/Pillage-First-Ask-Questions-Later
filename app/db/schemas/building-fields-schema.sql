CREATE TABLE building_fields
(
  village_id INTEGER NOT NULL,
  field_id INTEGER NOT NULL,
  building_id TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (village_id, field_id),

  FOREIGN KEY (village_id) REFERENCES villages (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CHECK (field_id BETWEEN 1 AND 40),

  CHECK (
    -- 1–18: resource only
    (field_id BETWEEN 1 AND 18 AND building_id IN ('WOODCUTTER', 'CLAY_PIT', 'IRON_MINE', 'WHEAT_FIELD'))
      OR -- 39: rally only
    (field_id = 39 AND building_id = 'RALLY_POINT')
      OR -- 40: walls only
    (field_id = 40 AND building_id IN ('CITY_WALL', 'EARTH_WALL', 'MAKESHIFT_WALL', 'PALISADE', 'STONE_WALL'))
      OR -- 19–38: anything except the reserved ones
    (field_id BETWEEN 19 AND 38 AND
     building_id NOT IN
     ('RALLY_POINT', 'CITY_WALL', 'EARTH_WALL', 'MAKESHIFT_WALL', 'PALISADE', 'STONE_WALL', 'WOODCUTTER', 'CLAY_PIT',
      'IRON_MINE', 'WHEAT_FIELD'))
    )
) STRICT, WITHOUT ROWID;
