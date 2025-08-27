import type { Seeder } from 'app/interfaces/db';

export const adventurePointsSeeder: Seeder = (database): void => {
  database.exec({
    sql: 'INSERT INTO adventure_points (amount) VALUES ($amount);',
    bind: {
      $amount: 3,
    },
  });
};
