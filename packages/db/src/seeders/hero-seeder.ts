import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Seeder } from '../types/seeder';

export const heroSeeder: Seeder = (database): void => {
  database.exec({
    sql: `
      INSERT INTO heroes (
        player_id,
        experience,
        health,
        attack_power,
        resource_production,
        attack_bonus,
        defence_bonus,
        resource_to_produce
      )
      VALUES (
        $player_id,
        $experience,
        $health,
        $attack_power,
        $resource_production,
        $attack_bonus,
        $defence_bonus,
        $resource_to_produce
       );
    `,
    bind: {
      $player_id: PLAYER_ID,
      $experience: 0,
      $health: 100,
      $attack_power: 0,
      $resource_production: 4,
      $attack_bonus: 0,
      $defence_bonus: 0,
      $resource_to_produce: 'shared',
    },
  });
};
