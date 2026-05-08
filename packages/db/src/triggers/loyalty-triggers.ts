import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setupLoyaltyTriggers = (db: DbFacade): void => {
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
};
