import type { Database } from 'app/interfaces/models/common';

const sql = `INSERT INTO adventure_points (
  amount
) VALUES (?);`;

export const adventurePointsSeeder = (database: Database): void => {
  database.exec({
    sql,
    bind: [3],
  });
};
