CREATE TRIGGER IF NOT EXISTS battle_report_units_create_wounded_troops_after_insert
AFTER INSERT ON battle_report_units
WHEN NEW.amount_before > NEW.amount_after
BEGIN
  INSERT INTO wounded_troops (village_id, unit_id, amount, updated_at)
  SELECT
    v.id,
    NEW.unit_id,
    CAST(
      (NEW.amount_before - NEW.amount_after) *
      CASE
        WHEN MAX(CASE WHEN bi.building = 'ASCLEPEION' THEN 1 ELSE 0 END) = 1
          THEN 0.6
        ELSE 0.4
      END
      AS INTEGER
    ) AS wounded_amount,
    r.timestamp
  FROM
    battle_report_participants brp
      JOIN battle_reports br ON br.id = brp.battle_id
      JOIN reports r ON r.id = br.report_id
      JOIN villages v ON v.tile_id = brp.tile_id
      JOIN building_fields bf ON bf.village_id = v.id
        AND bf.level > 0
      JOIN building_ids bi ON bi.id = bf.building_id
        AND bi.building IN ('HOSPITAL', 'ASCLEPEION')
      JOIN unit_ids ui ON ui.id = NEW.unit_id
  WHERE
    brp.id = NEW.battle_participant_id
    AND ui.unit <> 'HERO'
    AND ui.unit NOT LIKE '%\_RAM' ESCAPE '\'
    AND ui.unit NOT LIKE '%\_CATAPULT' ESCAPE '\'
    AND ui.unit NOT LIKE '%\_SETTLER' ESCAPE '\'
    AND ui.unit NOT LIKE '%\_CHIEF' ESCAPE '\'
  GROUP BY
    v.id, r.timestamp
  HAVING
    wounded_amount > 0
  ON CONFLICT (village_id, unit_id) DO UPDATE SET
    amount = wounded_troops.amount + EXCLUDED.amount,
    updated_at = EXCLUDED.updated_at;
END;
