import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setupHistoryTriggers = (db: DbFacade): void => {
  db.exec({
    sql: `
      CREATE TRIGGER IF NOT EXISTS trg_building_level_change_history_update
      AFTER UPDATE OF level ON building_fields
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
          (village_id, batch_id, unit_id, amount, timestamp)
        SELECT
          OLD.village_id,
          JSON_EXTRACT(OLD.meta, '$.batchId'),
          (SELECT id FROM unit_ids WHERE unit = JSON_EXTRACT(OLD.meta, '$.unitId')),
          1,
          unixepoch()
        ON CONFLICT(batch_id, unit_id) DO UPDATE SET
          amount = amount + 1,
          timestamp = unixepoch();
      END;
    `,
  });
};
