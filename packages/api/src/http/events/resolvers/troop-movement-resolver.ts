import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { newVillageQuestsFactory } from '@pillage-first/game-assets/quests';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import { buildingFieldsFactory } from '@pillage-first/game-assets/village';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { playableTribeSchema } from '@pillage-first/types/models/tribe';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  insertEffectQuery,
  selectAllRelevantEffectsByIdQuery,
  selectWheatProductionEffectIdQuery,
  updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
} from '../../../queries/effect-queries';
import {
  insertBuildingEffectsQuery,
  insertBuildingFieldsQuery,
  insertGatherersHutExpeditionByVillageIdQuery,
  insertNewVillageQuestsQuery,
  insertResourceSiteByTileIdQuery,
  insertVillageForPlayerQuery,
  insertVillageFoundingHistoryQuery,
  selectBuildingIdsQuery,
  selectHeroAdventureContextByVillageIdQuery,
  selectNewVillageFoundationTileByTileIdAndPlayerIdQuery,
  selectRelocationTargetVillageIdByTileIdQuery,
  selectTargetVillageIdByTileIdQuery,
  updateCompletedHeroAdventuresByHeroIdQuery,
  updateHeroAfterAdventureByHeroIdQuery,
} from '../../../queries/troop-movement-queries';
import {
  selectPlayerVillageIdByTileIdQuery,
  selectVillageIdAndTileIdQuery,
} from '../../../queries/village-queries';
import { createEvents } from '../../../utils/create-event';
import {
  createHeroHealthRegenerationEventByVillageId,
  onHeroDeath,
  relocateHero,
} from '../../../utils/hero';
import { assessAdventureCountQuestCompletion } from '../../../utils/quests';
import { moveTroopWheatConsumption } from '../../../utils/reinforcements';
import {
  insertAdventureReport,
  insertMovementReport,
} from '../../../utils/report';
import { resolveNoCombatOffensiveMovement } from '../../../utils/troop-movement';
import { addTroops } from '../../../utils/troops';
import {
  addVillageResourcesAt,
  updateVillageResourcesAt,
} from '../../../utils/village';
import { apiEffectSchema } from '../../../utils/zod/effect-schemas';
import type { Resolver } from '../resolver';

export const adventureMovementResolver: Resolver<
  GameEvent<'troopMovementAdventure'>
> = (database, args) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  const { heroId, healthBefore, adventureId } = database.selectObject({
    sql: selectHeroAdventureContextByVillageIdQuery,
    bind: { $village_id: villageId },
    schema: z.strictObject({
      heroId: z.number(),
      healthBefore: z.number(),
      adventureId: z.int(),
    }),
  })!;

  const healthAfter = database.selectValue({
    sql: updateHeroAfterAdventureByHeroIdQuery,
    bind: { $hero_id: heroId },
    schema: z.number(),
  })!;

  insertAdventureReport(database, {
    villageId,
    timestamp: resolvesAt,
    adventureId,
    itemId: null,
    itemAmount: null,
    healthBefore,
    healthAfter,
  });

  if (healthAfter === 0) {
    onHeroDeath(database, resolvesAt);

    return {
      affectedVillageIds: [villageId],
    };
  }

  database.exec({
    sql: updateCompletedHeroAdventuresByHeroIdQuery,
    bind: { $hero_id: heroId },
  });

  assessAdventureCountQuestCompletion(database, resolvesAt);

  if (healthAfter < 100) {
    createHeroHealthRegenerationEventByVillageId(
      database,
      villageId,
      resolvesAt,
    );
  }

  createEvents<'troopMovementReturn'>(database, {
    villageId,
    originTileId: targetTileId,
    startsAt: resolvesAt,
    targetTileId: originTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementAdventure',
    troops,
  });

  return {
    affectedVillageIds: [villageId],
  };
};

export const oasisOccupationMovementResolver: Resolver<
  GameEvent<'troopMovementOasisOccupation'>
> = (database, args) => {
  const targetVillageId = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: args.targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [...targetVillageId],
  };
};

export const findNewVillageMovementResolver: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const { targetTileId, resolvesAt, villageId } = args;

  // tileId here represents a tile_id where the new village will be founded
  const {
    id: tileId,
    x,
    y,
    resourceFieldComposition,
    tribe,
  } = database.selectObject({
    sql: selectNewVillageFoundationTileByTileIdAndPlayerIdQuery,
    bind: {
      $tile_id: targetTileId,
      $player_id: PLAYER_ID,
    },
    schema: z.strictObject({
      id: z.number(),
      x: z.number(),
      y: z.number(),
      resourceFieldComposition: resourceFieldCompositionSchema,
      tribe: playableTribeSchema,
    }),
  })!;

  // Create village with incremental slug v-{n}
  const newVillageId = database.selectValue({
    sql: insertVillageForPlayerQuery,
    bind: {
      $name: 'New village',
      $tile_id: tileId,
      $player_id: PLAYER_ID,
    },
    schema: z.number(),
  })!;

  database.exec({
    sql: insertGatherersHutExpeditionByVillageIdQuery,
    bind: {
      $village_id: newVillageId,
    },
  });

  const buildingIdRows = database.selectObjects({
    sql: selectBuildingIdsQuery,
    schema: z.strictObject({ id: z.number(), building: buildingIdSchema }),
  });

  const buildingIdMap = new Map<Building['id'], number>(
    buildingIdRows.map((b) => [b.building, b.id]),
  );

  const buildingFields = buildingFieldsFactory(
    'player',
    tribe,
    resourceFieldComposition,
  );

  const wheatProductionEffectId = database.selectValue({
    sql: selectWheatProductionEffectIdQuery,
    schema: z.number(),
  })!;

  database.exec({
    sql: insertBuildingFieldsQuery,
    bind: {
      $village_id: newVillageId,
      $fields: JSON.stringify(
        buildingFields.map(({ field_id, building_id, level }) => ({
          fieldId: field_id,
          buildingId: buildingIdMap.get(building_id)!,
          level,
        })),
      ),
    },
  });

  const buildingEffects = buildingFields.flatMap(
    ({ field_id, building_id, level }) =>
      getBuildingDefinition(building_id)
        .effects(tribe)
        .map((effect) => ({
          effectId: effect.effectId,
          value: effect.valuesPerLevel[level],
          type: effect.type,
          sourceSpecifier: field_id,
        })),
  );

  database.exec({
    sql: insertBuildingEffectsQuery,
    bind: {
      $effects: JSON.stringify(buildingEffects),
      $village_id: newVillageId,
    },
  });

  // Initialize resource site for the new village (fresh-settlement baseline similar to starting village)
  database.exec({
    sql: insertResourceSiteByTileIdQuery,
    bind: { $tile_id: tileId, $updatedAt: resolvesAt },
  });

  const quests = newVillageQuestsFactory(
    newVillageId,
    tribe,
    resourceFieldComposition,
  );

  database.exec({
    sql: insertNewVillageQuestsQuery,
    bind: {
      $quests: JSON.stringify(quests.map(({ id }) => id)),
      $resolves_at: resolvesAt,
      $village_id: newVillageId,
    },
  });

  // Population effect
  database.exec({
    sql: insertEffectQuery,
    bind: {
      $effect_id: wheatProductionEffectId,
      $value: -3,
      $type: 'base',
      $scope: 'local',
      $source: 'building',
      $village_id: newVillageId,
      $source_specifier: 0,
    },
  });

  // Troop wheat consumption effect
  database.exec({
    sql: insertEffectQuery,
    bind: {
      $effect_id: wheatProductionEffectId,
      $value: 0,
      $type: 'base',
      $scope: 'local',
      $source: 'troops',
      $village_id: newVillageId,
      $source_specifier: 0,
    },
  });

  // Reduce troop consumption in the source village by 3 (since 3 settlers are consumed)
  database.exec({
    sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
    bind: {
      $increase_amount: -3,
      $village_id: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);

  // Founding village history
  database.exec({
    sql: insertVillageFoundingHistoryQuery,
    bind: {
      $village_id: newVillageId,
      $tile_id: tileId,
      $x: x,
      $y: y,
      // JS stores values in ms, other history table triggers store it in seconds
      $timestamp: Math.trunc(resolvesAt / 1000),
    },
  });

  return {
    affectedVillageIds: [villageId, newVillageId],
  };
};

export const returnMovementResolver: Resolver<
  GameEvent<'troopMovementReturn'>
> = (database, args) => {
  const { villageId, targetTileId, troops, loot, resolvesAt } = args;

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (loot?.some((amount) => amount > 0)) {
    addVillageResourcesAt(database, villageId, resolvesAt, loot);
  }

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return {
    affectedVillageIds: [villageId, ...targetVillageIds],
  };
};

export const relocationMovementResolver: Resolver<
  GameEvent<'troopMovementRelocation'>
> = (database, args) => {
  const { targetTileId, troops, resolvesAt, villageId } = args;

  const targetVillageId = database.selectValue({
    sql: selectRelocationTargetVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId },
    schema: z.number(),
  })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'relocation',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
      source: targetTileId,
    })),
  );

  if (troops.some(({ unitId }) => unitId === 'HERO')) {
    relocateHero(database, villageId, targetVillageId, resolvesAt);
  }

  moveTroopWheatConsumption(
    database,
    troops,
    villageId,
    targetVillageId,
    resolvesAt,
  );

  return {
    affectedVillageIds: [villageId, targetVillageId],
  };
};

export const reinforcementMovementResolver: Resolver<
  GameEvent<'troopMovementReinforcements'>
> = (database, args) => {
  const { targetTileId, troops, resolvesAt, villageId } = args;

  const { tileType: targetTileType, villageId: targetVillageId } =
    database.selectObject({
      sql: selectVillageIdAndTileIdQuery,
      bind: { $tile_id: targetTileId },
      schema: z.strictObject({
        tileId: z.number(),
        tileType: z.enum(['free', 'oasis']),
        villageId: z.number(),
      }),
    })!;

  insertMovementReport(database, {
    ...args,
    movementType: 'reinforcement',
  });

  addTroops(
    database,
    troops.map((troop) => ({
      ...troop,
      tileId: targetTileId,
    })),
  );

  if (targetTileType !== 'oasis') {
    moveTroopWheatConsumption(
      database,
      troops,
      villageId,
      targetVillageId,
      resolvesAt,
    );
  }

  return {
    affectedVillageIds: [
      villageId,
      targetTileType === 'oasis' ? null : targetVillageId,
    ],
  };
};

export const attackMovementResolver: Resolver<
  GameEvent<'troopMovementAttack'>
> = (database, args) => {
  const { villageId, resolvesAt, originTileId, targetTileId, troops } = args;

  let crannyCapacity = 0;

  const targetVillageId = database.selectValue({
    sql: selectTargetVillageIdByTileIdQuery,
    bind: { $target_tile_id: targetTileId },
    schema: z.number().nullable(),
  })!;

  if (targetVillageId !== null) {
    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'crannyCapacity',
        $village_id: targetVillageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      'crannyCapacity',
      effects,
      targetVillageId,
    );

    crannyCapacity = total;
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

  return { affectedVillageIds: [villageId, ...targetVillageIds] };
};

export const raidMovementResolver: Resolver<GameEvent<'troopMovementRaid'>> = (
  database,
  args,
) => {
  const { villageId, resolvesAt, troops, originTileId, targetTileId } = args;

  let crannyCapacity = 0;

  const targetVillageId = database.selectValue({
    sql: selectTargetVillageIdByTileIdQuery,
    bind: { $target_tile_id: targetTileId },
    schema: z.number().nullable(),
  })!;

  if (targetVillageId !== null) {
    const effects = database.selectObjects({
      sql: selectAllRelevantEffectsByIdQuery,
      bind: {
        $effect_id: 'crannyCapacity',
        $village_id: targetVillageId,
      },
      schema: apiEffectSchema,
    });

    const { total } = calculateComputedEffect(
      'crannyCapacity',
      effects,
      targetVillageId,
    );

    crannyCapacity = total;
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
    startsAt: resolvesAt,
    targetTileId: originTileId,
    originTileId: targetTileId,
    type: 'troopMovementReturn',
    originalMovementType: 'troopMovementRaid',
    loot,
  });

  const targetVillageIds = database.selectValues({
    sql: selectPlayerVillageIdByTileIdQuery,
    bind: { $tile_id: targetTileId, $player_id: PLAYER_ID },
    schema: z.number(),
  });

  return { affectedVillageIds: [villageId, ...targetVillageIds] };
};
