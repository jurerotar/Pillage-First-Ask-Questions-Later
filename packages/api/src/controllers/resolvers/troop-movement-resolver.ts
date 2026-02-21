import { z } from 'zod';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { assessAdventureCountQuestCompletion } from '../../utils/quests.ts';
import { createEvents } from '../utils/create-event';

const adventureMovementResolver: Resolver<GameEvent<'troopMovement'>> = (
  database,
  args,
) => {
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

    createEvents<'troopMovement'>(database, {
      type: 'troopMovement',
      movementType: 'return',
      villageId: args.villageId,
      targetId: args.targetId,
      troops: args.troops,
    });
  }
};

const findNewVillageMovementResolver: Resolver<GameEvent<'troopMovement'>> = (
  _database,
  _args,
) => {};

export const troopMovementResolver: Resolver<GameEvent<'troopMovement'>> = (
  database,
  args,
) => {
  const { movementType } = args;

  switch (movementType) {
    case 'adventure': {
      adventureMovementResolver(database, args);
      break;
    }
    case 'find-new-village': {
      findNewVillageMovementResolver(database, args);
      break;
    }

    default: {
      console.error(
        `No resolver function set for troopMovement type ${movementType}`,
      );
    }
  }
};
