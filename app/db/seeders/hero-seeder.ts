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
      VALUES (
        $experience,
        $health,
        $attack_power,
        $resource_production,
        $attack_bonus,
        $defence_bonus,
        $resource_to_produce,
        $adventure_count
       );
    `,
    bind: {
      $experience: 0,
      $health: 100,
      $attack_power: 0,
      $resource_production: 4,
      $attack_bonus: 0,
      $defence_bonus: 0,
      $resource_to_produce: 'shared',
      $adventure_count: 0,
    },
  });
};
