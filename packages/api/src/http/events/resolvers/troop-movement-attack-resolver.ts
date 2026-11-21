import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { selectAllRelevantEffectsByIdQuery } from '../../../queries/effect-queries';
import { selectTargetVillageIdByTileIdQuery } from '../../../queries/troop-movement-queries';
import { selectPlayerVillageIdByTileIdQuery } from '../../../queries/village-queries';
import { resolveNoCombatOffensiveMovement } from '../../../utils/troop-movement';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import { defineEventResolver, type Resolver } from '../resolver';
import { movementCreation } from './troop-movement-event-helpers';

const resolveAttackMovement: Resolver<GameEvent<'troopMovementAttack'>> = (
  database,
  args,
  createEvents,
) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  let crannyCapacity = 0;

  const targetVillageId =
    database.selectValue({
      sql: selectTargetVillageIdByTileIdQuery,
      bind: { $target_tile_id: targetTileId },
      schema: z.number().nullable(),
    }) ?? null;

  if (targetVillageId !== null) {
    const effects = database.selectValue({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'crannyCapacity',
        $village_id: targetVillageId,
      },
      schema: apiEffectsJsonSchema,
    })!;

    if (effects.some(({ type }) => type === 'base')) {
      const { total } = calculateComputedEffect(
        'crannyCapacity',
        effects,
        targetTileId,
      );

      crannyCapacity = total;
    }
  }

  const loot = resolveNoCombatOffensiveMovement(
    database,
    args,
    targetVillageId,
    crannyCapacity,
  );

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    troops,
    targetTileId: originTileId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAttack',
    loot,
  });

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [villageId, ...targetVillageIds],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const attackMovementResolver =
  defineEventResolver<'troopMovementAttack'>(
    movementCreation,
    resolveAttackMovement,
  );
