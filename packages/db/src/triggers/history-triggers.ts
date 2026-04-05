import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setupHistoryTriggers = (db: DbFacade): void => {
  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_building_level_change_history_update
      AFTER UPDATE OF level ON building_fields
      WHEN OLD.level <> NEW.level
      BEGIN
        INSERT INTO building_level_change_history
          (village_id, field_id, building_id, previous_level, new_level, timestamp)
        VALUES
          (OLD.village_id, OLD.field_id, OLD.building_id, OLD.level, NEW.level, unixepoch());
      END;
    `,
  });

  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_building_level_change_history_delete
      AFTER DELETE ON building_fields
      WHEN OLD.level > 0
      BEGIN
        INSERT INTO building_level_change_history
          (village_id, field_id, building_id, previous_level, new_level, timestamp)
        VALUES
          (OLD.village_id, OLD.field_id, OLD.building_id, OLD.level, 0, unixepoch());
      END;
    `,
  });

  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_unit_training_history_delete
      AFTER DELETE ON events
      WHEN OLD.type = 'troopTraining'
      BEGIN
        INSERT INTO unit_training_history
          (village_id, batch_id, unit_id, building_id, amount, timestamp)
        SELECT
          OLD.village_id,
          JSON_EXTRACT(OLD.meta, '$.batchId'),
          (SELECT id FROM unit_ids WHERE unit = JSON_EXTRACT(OLD.meta, '$.unitId')),
          (SELECT id FROM building_ids WHERE building = JSON_EXTRACT(OLD.meta, '$.buildingId')),
          1,
          unixepoch()
        ON CONFLICT(batch_id, unit_id) DO UPDATE SET
          amount = amount + 1,
          timestamp = unixepoch();
      END;
    `,
  });

  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_unit_improvement_history_update
      AFTER UPDATE OF level ON unit_improvements
      WHEN OLD.level <> NEW.level
      BEGIN
        INSERT INTO unit_improvement_history
          (player_id, unit_id, previous_level, new_level, timestamp)
        VALUES
          (OLD.player_id, OLD.unit_id, OLD.level, NEW.level, unixepoch());
      END;
    `,
  });

  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_unit_improvement_history_insert
      AFTER INSERT ON unit_improvements
      BEGIN
        INSERT INTO unit_improvement_history
          (player_id, unit_id, previous_level, new_level, timestamp)
        VALUES
          (NEW.player_id, NEW.unit_id, 0, NEW.level, unixepoch());
      END;
    `,
  });

  // Exclude the tier 1 unit and settler unit research as they are automatically added when a new village is founded and would clutter the history
  // Currently, hardcoded with the unit ids but can be changed in the future to be more flexible if needed
  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_unit_research_history_insert
      AFTER INSERT ON unit_research
      WHEN NEW.unit_id NOT IN ('LEGIONNAIRE', 'PHALANX', 'CLUBSWINGER', 'SLAVE_MILITIA', 'MERCENARY', 'HOPLITE', 'RAT', 'PIKEMAN', 'ROMAN_SETTLER', 'GAUL_SETTLER', 'TEUTON_SETTLER', 'EGYPTIAN_SETTLER', 'HUN_SETTLER', 'SPARTAN_SETTLER', 'NATARIAN_SETTLER')
      BEGIN
        INSERT INTO unit_research_history
          (village_id, unit_id, timestamp)
        VALUES
          (NEW.village_id, NEW.unit_id, unixepoch());
      END;
    `,
  });
};
