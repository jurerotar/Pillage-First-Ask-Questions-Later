import { z } from 'zod';
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
): void => {
  const currentDbVersion = database.selectValue({
    sql: 'PRAGMA user_version',
    schema: z.number(),
  })!;

  const [, , targetPatch] = parseAppVersion(targetVersion);
  const [, , dbPatch] = parseDatabaseUserVersion(currentDbVersion);

  if (dbPatch < targetPatch) {
    onMigrate(database);

    database.exec({
      sql: `PRAGMA user_version=${encodeAppVersionToDatabaseUserVersion(targetVersion)};`,
    });
  }
};
