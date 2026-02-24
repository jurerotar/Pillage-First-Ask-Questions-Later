import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { assessAdventureCountQuestCompletion } from '../../utils/quests.ts';
import { createEvents } from '../utils/create-event';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, startsAt, duration } = args;

  const { heroId, health } = database.selectObject({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience = experience + CASE
          WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
          THEN (SELECT completed + 1 FROM hero_adventures WHERE hero_id = heroes.id) * 10
          ELSE 0
        END
      WHERE player_id = (SELECT player_id FROM villages WHERE id = $villageId)
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $villageId: villageId,
    },
    schema: z.object({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  if (health > 0) {
    database.exec({
      sql: 'UPDATE hero_adventures SET completed = completed + 1, available = available - 1 WHERE hero_id = $heroId;',
      bind: {
        $heroId: heroId,
      },
    });

    assessAdventureCountQuestCompletion(database, startsAt + duration);

    createEvents<'troopMovementReturn'>(database, {
      ...args,
      type: 'troopMovementReturn',
      originalMovementType: 'adventure',
    });
  }
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (_database, _args) => {};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (_database, _args) => {};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (_database, _args) => {};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (_database, _args) => {};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (_database, _args) => {};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (_database, _args) => {};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  _database,
  _args,
) => {};
