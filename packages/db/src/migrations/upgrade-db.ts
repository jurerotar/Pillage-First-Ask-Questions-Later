import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const upgradeDb = (database: DbFacade): void => {
  /**
   * Added 16.2.2026
   */
  const hasBuildingConstructionViewModeColumn = database.selectValue({
    sql: `
      SELECT
        EXISTS
        (
          SELECT 1
          FROM
            PRAGMA_TABLE_INFO('preferences')
          WHERE
            name = 'building_construction_view_mode'
          );
    `,
    schema: z.number(),
  })!;

  if (hasBuildingConstructionViewModeColumn === 0) {
    database.exec({
      sql: `ALTER TABLE preferences
        ADD COLUMN building_construction_view_mode TEXT DEFAULT 'detailed'`,
    });
  }
};
