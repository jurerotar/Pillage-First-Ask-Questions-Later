CREATE TRIGGER IF NOT EXISTS battle_report_units_create_wounded_troops_after_insert
AFTER INSERT ON battle_report_units
WHEN
  NEW.amount_before > NEW.amount_after
  AND NEW.unit_id IN (
    SELECT id
    FROM unit_ids
    WHERE unit IN (
      'LEGIONNAIRE',
      'PRAETORIAN',
      'IMPERIAN',
      'ROMAN_SCOUT',
      'EQUITES_IMPERATORIS',
      'EQUITES_CAESARIS',
      'PHALANX',
      'SWORDSMAN',
      'GAUL_SCOUT',
      'THEUTATES_THUNDER',
      'DRUIDRIDER',
      'HAEDUAN',
      'CLUBSWINGER',
      'SPEARMAN',
      'AXEMAN',
      'TEUTONIC_SCOUT',
      'PALADIN',
      'TEUTONIC_KNIGHT',
      'MERCENARY',
      'BOWMAN',
      'HUN_SCOUT',
      'STEPPE_RIDER',
      'MARKSMAN',
      'MARAUDER',
      'SLAVE_MILITIA',
      'ASH_WARDEN',
      'KHOPESH_WARRIOR',
      'EGYPTIAN_SCOUT',
      'ANHUR_GUARD',
      'RESHEPH_CHARIOT',
      'HOPLITE',
      'SHIELDSMAN',
      'SPARTAN_SCOUT',
      'TWINSTEEL_THERION',
      'ELPIDA_RIDER',
      'CORINTHIAN_CRUSHER',
      'PIKEMAN',
      'THORNED_WARRIOR',
      'GUARDSMAN',
      'NATARIAN_SCOUT',
      'AXERIDER',
      'NATARIAN_KNIGHT'
    )
  )
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
        AND v.player_id = brp.player_id
      JOIN building_fields bf ON bf.village_id = v.id
        AND bf.level > 0
      JOIN building_ids bi ON bi.id = bf.building_id
        AND bi.building IN ('HOSPITAL', 'ASCLEPEION')
  WHERE
    brp.id = NEW.battle_participant_id
    AND brp.player_id = 1
    AND brp.tile_id IN (br.origin_tile_id, br.target_tile_id)
  GROUP BY
    v.id, r.timestamp
  HAVING
    wounded_amount > 0
  ON CONFLICT (village_id, unit_id) DO UPDATE SET
    amount = wounded_troops.amount + EXCLUDED.amount,
    updated_at = EXCLUDED.updated_at;
END;
