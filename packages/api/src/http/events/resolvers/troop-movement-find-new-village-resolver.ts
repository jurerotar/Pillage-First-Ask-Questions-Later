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
import {
  insertEffectQuery,
  selectWheatProductionEffectIdQuery,
  updateWheatProductionByTroopsAndTileIdEffectQuery,
} from '../../../queries/effect-queries';
import {
  insertBuildingEffectsQuery,
  insertBuildingFieldsQuery,
  insertGatherersHutExpeditionByVillageIdQuery,
  insertNewVillageQuestsQuery,
  insertResourceSiteByTileIdQuery,
  insertVillageForPlayerQuery,
  selectBuildingIdsQuery,
  selectNewVillageFoundationTileByTileIdAndPlayerIdQuery,
} from '../../../queries/troop-movement-queries';
import { updatePlayerCulturePointsAt } from '../../../utils/culture-points';
import { insertVillageFoundedReport } from '../../../utils/report';
import {
  getVillageTileId,
  updateResourceSiteResourcesAt,
} from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';
import { movementCreation } from './troop-movement-event-helpers';

const resolveFindNewVillageMovement: Resolver<
  GameEvent<'troopMovementFindNewVillage'>
> = (database, args) => {
  const { originTileId, targetTileId, resolvesAt, villageId } = args;

  // tileId here represents a tile_id where the new village will be founded
  const {
    id: tileId,
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

  updatePlayerCulturePointsAt(database, resolvesAt, PLAYER_ID);

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
      $tile_id: tileId,
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
      $tile_id: tileId,
      $source_specifier: 0,
    },
  });

  updateResourceSiteResourcesAt(
    database,
    getVillageTileId(database, villageId),
    resolvesAt,
  );

  // Reduce troop consumption in the source village by 3 (since 3 settlers are consumed)
  database.exec({
    sql: updateWheatProductionByTroopsAndTileIdEffectQuery,
    bind: {
      $increase_amount: -3,
      $tile_id: originTileId,
    },
  });

  insertVillageFoundedReport(database, {
    villageId,
    timestamp: resolvesAt,
    originTileId,
    targetTileId: tileId,
  });

  return {
    affectedVillageIds: [villageId, newVillageId],
    affectedTileIds: [originTileId, targetTileId],
  };
};

export const findNewVillageMovementResolver =
  defineEventResolver<'troopMovementFindNewVillage'>(
    movementCreation,
    resolveFindNewVillageMovement,
  );
