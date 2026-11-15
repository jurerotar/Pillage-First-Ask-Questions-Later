import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  encodeAppVersionToDatabaseUserVersion,
  parseAppVersion,
  parseDatabaseUserVersion,
} from '@pillage-first/utils/version';

export const migrateTo = (
  targetVersion: string,
  database: DbFacade,
  onMigrate: (db: DbFacade) => void,
  currentDbVersion: number,
): number => {
  const targetDbVersion = encodeAppVersionToDatabaseUserVersion(targetVersion);

  const [, , targetPatch] = parseAppVersion(targetVersion);
  const [, , dbPatch] = parseDatabaseUserVersion(currentDbVersion);

  if (dbPatch < targetPatch) {
    onMigrate(database);

    database.exec({
      sql: `PRAGMA user_version=${targetDbVersion};`,
    });

    return targetDbVersion;
  }

  return currentDbVersion;
};
