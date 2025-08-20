import type { Seeder } from 'app/interfaces/db';

export const heroSeeder: Seeder = (database): void => {
  database.exec({
    sql: `
      INSERT INTO heroes (
        experience,
        health,
        attack_power,
        resource_production,
        attack_bonus,
        defence_bonus,
        resource_to_produce,
        adventure_count
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    bind: [
      0, // experience
      100, // health
      0, // attack_power
      4, // resource_production
      0, // attack_bonus
      0, // defence_bonus
      'shared', // resource_to_produce
      0, // adventure_count
    ],
  });
};
