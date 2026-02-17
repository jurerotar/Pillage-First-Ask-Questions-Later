import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { batchInsert } from '../utils/batch-insert';

export const heroSeeder = (database: DbFacade): void => {
  const { id, tribe } = database.selectObject({
    sql: `
      SELECT p.id, ti.tribe
      FROM players p
      JOIN tribe_ids ti ON ti.id = p.tribe_id
      WHERE p.id = $playerId
    `,
    bind: { $playerId: PLAYER_ID },
    schema: z.object({
      id: z.number(),
      tribe: z.string(),
    }),
  })!;

  const baseAttackPower = tribe.toLowerCase() === 'romans' ? 100 : 80;

  const hero = [
    id, // player_id
    0, // experience
    100, // health
    baseAttackPower,
    10, // health_regeneration
    0, // damage_reduction
    0, // experience_modifier
    6, // speed
    0, // natarian_attack_bonus
    0, // attack_bonus
    0, // defence_bonus
    'shared', // resource_to_produce
  ];

  const heroesToInsert = [hero];

  batchInsert(
    database,
    'heroes',
    [
      'player_id',
      'experience',
      'health',
      'base_attack_power',
      'health_regeneration',
      'damage_reduction',
      'experience_modifier',
      'speed',
      'natarian_attack_bonus',
      'attack_bonus',
      'defence_bonus',
      'resource_to_produce',
    ],
    heroesToInsert,
  );

  const heroIds = database.selectObjects({
    sql: 'SELECT id FROM heroes',
    schema: z.object({ id: z.number() }),
  });

  const selectableAttributesToInsert = heroIds.map(({ id }) => {
    return [
      id, // hero_id
      0, // attack_power
      4, // resource_production
      0, // attack_bonus
      0, // defence_bonus
    ];
  });

  batchInsert(
    database,
    'hero_selectable_attributes',
    [
      'hero_id',
      'attack_power',
      'resource_production',
      'attack_bonus',
      'defence_bonus',
    ],
    selectableAttributesToInsert,
  );
};
