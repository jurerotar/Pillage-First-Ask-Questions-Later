import { buildings } from 'app/(game)/(village-slug)/assets/buildings';
import type { Database } from 'app/interfaces/models/common';

const sql = `INSERT INTO bookmarks (
  building_id,
  tab_name
) VALUES (?, ?);`;

export const bookmarksSeeder = (database: Database): void => {
  const values = buildings.map(({ id }) => ({
    buildingId: id,
    tabName: 'default',
  }));

  for (const { buildingId, tabName } of values) {
    database.exec({
      sql,
      bind: [buildingId, tabName],
    });
  }
};
