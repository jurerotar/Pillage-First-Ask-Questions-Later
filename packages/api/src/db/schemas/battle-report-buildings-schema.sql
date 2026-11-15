CREATE TABLE battle_report_buildings
(
  id INTEGER PRIMARY KEY,
  battle_id INTEGER NOT NULL,
  building_id INTEGER,
  field_id INTEGER CHECK (field_id BETWEEN 1 AND 40),
  requested_building_id INTEGER,
  targeting TEXT NOT NULL CHECK (targeting IN ('selected', 'random', 'brewery', 'confusion', 'fallback')),
  outcome TEXT NOT NULL CHECK (outcome IN ('damaged', 'destroyed', 'undamaged', 'not-fired', 'no-target')),
  reason TEXT CHECK (reason IN ('insufficient-power', 'no-surviving-siege', 'raid', 'target-missing')),
  level_before INTEGER CHECK (level_before > 0),
  level_after INTEGER CHECK (level_after >= 0),

  -- An actual target has a field and both levels; an absent target has none.
  CONSTRAINT siege_target_complete CHECK (
    (building_id IS NULL) = (field_id IS NULL)
    AND (building_id IS NULL) = (level_before IS NULL)
    AND (building_id IS NULL) = (level_after IS NULL)
  ),

  CONSTRAINT siege_targeting_valid CHECK (
    CASE targeting
      WHEN 'selected' THEN requested_building_id IS NOT NULL
        AND (building_id IS NULL OR building_id = requested_building_id)
      WHEN 'random' THEN requested_building_id IS NULL
      WHEN 'fallback' THEN requested_building_id IS NOT NULL
      ELSE 1 -- Brewery and confusion may override either selected or random targets.
    END
  ),

  CONSTRAINT siege_outcome_valid CHECK (
    CASE outcome
      WHEN 'damaged' THEN building_id IS NOT NULL
        AND level_after > 0 AND level_after < level_before AND reason IS NULL
      WHEN 'destroyed' THEN building_id IS NOT NULL
        AND level_after IS 0 AND reason IS NULL
      WHEN 'undamaged' THEN building_id IS NOT NULL
        AND level_after = level_before AND reason IS 'insufficient-power'
      WHEN 'not-fired' THEN (building_id IS NULL OR level_after = level_before)
        AND (reason IS 'raid' OR reason IS 'no-surviving-siege')
      WHEN 'no-target' THEN building_id IS NULL AND reason IS 'target-missing'
      ELSE 0
    END
  ),

  FOREIGN KEY (battle_id) REFERENCES battle_reports (id) ON DELETE CASCADE,
  FOREIGN KEY (building_id) REFERENCES building_ids (id),
  FOREIGN KEY (requested_building_id) REFERENCES building_ids (id)
) STRICT;
