import type { DbFacade } from '@pillage-first/utils/facades/database';

export const setTestDeveloperSetting = (
  database: DbFacade,
  column: string,
  value: number,
): void => {
  database.exec({
    sql: `UPDATE developer_settings SET "${column.replaceAll('"', '""')}" = $value;`,
    bind: { $value: value },
  });
};
