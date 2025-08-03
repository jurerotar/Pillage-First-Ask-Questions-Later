import { buildings } from 'app/(game)/(village-slug)/assets/buildings';
import type { Database } from 'app/interfaces/models/common';

const sql = `INSERT INTO bookmarks (
  building_id,
  tab_id
) VALUES (?, ?);`;

export const bookmarksSeeder = (database: Database): void => {
  const values = buildings.map(({ id }) => ({
    building_id: id,
    tab_id: 'default',
  }));

  database.transaction((db) => {
    for (const { building_id, tab_id } of values) {
      db.exec({
        sql,
        bind: [building_id, tab_id],
      });
    }
  });
};
