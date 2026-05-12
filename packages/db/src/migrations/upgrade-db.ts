import type { DbFacade } from '@pillage-first/utils/facades/database';

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (database: DbFacade): void => {
  database.transaction((db) => {
    db.exec({
      sql: `
        CREATE TRIGGER IF NOT EXISTS loyalties_delete_capped_entries_after_update
        AFTER UPDATE OF loyalty
        ON loyalties
        WHEN NEW.loyalty >= 100
        BEGIN
          DELETE FROM loyalties WHERE tile_id = NEW.tile_id;
        END;
      `,
    });

    // Delete all heroes present in troops table
    db.exec({
      sql: `
        DELETE FROM troops
        WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = 'HERO')
      `,
    });

    // Insert a new hero unit into troops table for village with slug 'v-1'
    // if hero is not already in that village and not currently on an adventure
    db.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        SELECT
          (SELECT id FROM unit_ids WHERE unit = 'HERO'),
          1,
          v.tile_id,
          v.tile_id
        FROM villages v
        JOIN heroes h ON h.village_id = v.id
        WHERE v.slug = 'v-1'
          -- Hero has more than 0 health
          AND h.health > 0

          -- Hero is NOT currently on an adventure (no active troopMovementAdventure event for this village)
          AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.village_id = v.id
              AND e.type = 'troopMovementAdventure'
          )
      `,
    });

    // Normalize legacy village_founding_history timestamps from milliseconds to seconds
    // Some historical rows were inserted by JS in milliseconds. Since triggers now set
    // timestamps via unixepoch() (seconds), convert any ms values at rest.
    db.exec({
      sql: `
        UPDATE village_founding_history
        SET timestamp = CASE
          WHEN timestamp > 2000000000 THEN CAST(timestamp / 1000 AS INTEGER)
          ELSE timestamp
        END
        WHERE timestamp > 2000000000;
      `,
    });
  });
};
