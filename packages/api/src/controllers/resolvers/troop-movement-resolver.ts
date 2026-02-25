import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import {
  deleteHeroEffectsQuery,
  updateHeroEffectsVillageIdQuery,
} from '../../utils/queries/effect-queries';
import { addTroops } from '../../utils/queries/troop-queries';
import { assessAdventureCountQuestCompletion } from '../../utils/quests.ts';
import { updateVillageResourcesAt } from '../../utils/village.ts';
import { createEvents } from '../utils/create-event';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, startsAt, duration, resolvesAt } = args;

  const { heroId, health } = database.selectObject({
    sql: `
      UPDATE heroes
      SET
        health = MAX(0, health - MAX(0, 5 - damage_reduction)),
        experience = experience + CASE
        WHEN MAX(0, health - MAX(0, 5 - damage_reduction)) > 0
          THEN (
             SELECT completed + 1
             FROM
               hero_adventures
             WHERE
               hero_id = heroes.id
             ) * 10
        ELSE 0
          END
      WHERE
        player_id = (
          SELECT player_id
          FROM
            villages
          WHERE
            id = $villageId
          )
      RETURNING
        id AS heroId,
        health
    `,
    bind: {
      $villageId: villageId,
    },
    schema: z.strictObject({
      heroId: z.number(),
      health: z.number(),
    }),
  })!;

  if (health === 0) {
    updateVillageResourcesAt(database, villageId, resolvesAt);

    database.exec({
      sql: deleteHeroEffectsQuery,
      bind: { $playerId: PLAYER_ID },
    });

    return;
  }

  database.exec({
    sql: 'UPDATE hero_adventures SET completed = completed + 1, available = available - 1 WHERE hero_id = $heroId;',
    bind: {
      $heroId: heroId,
    },
  });

  assessAdventureCountQuestCompletion(database, startsAt + duration);

  createEvents<'troopMovementReturn'>(database, {
    ...args,
    targetId: villageId,
    type: 'troopMovementReturn',
    originalMovementType: 'adventure',
  });
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (_database, _args) => {};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (_database, _args) => {};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  // If hero is relocated, update effects as well
  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    database.exec({
      sql: updateHeroEffectsVillageIdQuery,
      bind: {
        $playerId: PLAYER_ID,
        $targetId: targetId,
      },
    });

    database.exec({
      sql: 'UPDATE heroes SET village_id = $targetId WHERE player_id = $playerId;',
      bind: {
        $playerId: PLAYER_ID,
        $targetId: targetId,
      },
    });
  }
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { targetId, troops } = args;

  const { tileId: targetTileId } = database.selectObject({
    sql: 'SELECT tile_id AS tileId FROM villages WHERE id = $targetId;',
    bind: { $targetId: targetId },
    schema: z.strictObject({ tileId: z.number() }),
  })!;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    type: 'troopMovementReturn',
    originalMovementType: 'attack',
  });
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  // TODO: Combat
  createEvents<'troopMovementReturn'>(database, {
    ...args,
    type: 'troopMovementReturn',
    originalMovementType: 'raid',
  });
};
