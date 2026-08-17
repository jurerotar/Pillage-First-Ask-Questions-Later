import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';

// No backwards-compatible upgrade path is maintained. The current schema and seeders are the source of truth.
export const upgradeDb = (
  database: DbFacade,
  currentDatabaseVersion: number,
): void => {
  const targetDatabaseVersion = encodeAppVersionToDatabaseUserVersion(
    env.VERSION,
  );

  if (currentDatabaseVersion === targetDatabaseVersion) {
    return;
  }

  database.exec({
    sql: `PRAGMA user_version=${targetDatabaseVersion};`,
  });
};
