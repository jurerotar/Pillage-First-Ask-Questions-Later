import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const heroSeeder = (database: DbFacade): void => {
  database.exec({
    sql: `
      INSERT INTO heroes (
        player_id,
        experience,
        health,
        base_attack_power,
        health_regeneration,
        damage_reduction,
        experience_modifier,
        speed,
        natarian_attack_bonus,
        attack_bonus,
        defence_bonus,
        resource_to_produce
      )
      SELECT
        p.id,
        0,
        100,
        CASE WHEN LOWER(ti.tribe) = 'romans' THEN 100 ELSE 80 END,
        10,
        0,
        0,
        6,
        0,
        0,
        0,
        'shared'
      FROM players p
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE p.id = $playerId;
    `,
    bind: { $playerId: PLAYER_ID },
  });

  database.exec({
    sql: `
      INSERT INTO hero_selectable_attributes (
        hero_id,
        attack_power,
        resource_production,
        attack_bonus,
        defence_bonus
      )
      SELECT
        id,
        0,
        4,
        0,
        0
      FROM heroes;
    `,
  });
};
