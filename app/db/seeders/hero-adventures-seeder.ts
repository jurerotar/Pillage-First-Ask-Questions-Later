import type { Seeder } from 'app/interfaces/db';

export const heroAdventuresSeeder: Seeder = (database): void => {
  database.exec({
    sql: 'INSERT INTO hero_adventures (available, completed) VALUES (3, 0);',
  });
};
