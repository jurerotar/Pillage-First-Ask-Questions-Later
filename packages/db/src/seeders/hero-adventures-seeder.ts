import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { Seeder } from '../types/seeder';

export const heroAdventuresSeeder: Seeder = (database): void => {
  const heroId = database.selectValue(
    'SELECT id FROM heroes WHERE player_id = $player_id;',
    {
      $player_id: PLAYER_ID,
    },
  );

  database.exec({
    sql: 'INSERT INTO hero_adventures (hero_id, available, completed) VALUES ($hero_id, 3, 0);',
    bind: {
      $hero_id: heroId,
    },
  });
};
