import type { DbFacade } from '@pillage-first/utils/facades/database';

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (database: DbFacade): void => {
  database.transaction((db) => {
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
  });
};
