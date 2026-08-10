import { z } from 'zod';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { TroopTrainingDurationEffectId } from '@pillage-first/types/models/effect';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Unit } from '@pillage-first/types/models/unit';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { selectTribeByVillageId } from '../queries/village-queries';

const infantryTrainingBuildingIds = new Set<Building['id']>([
  'BARRACKS',
  'GREAT_BARRACKS',
]);

const cavalryTrainingBuildingIds = new Set<Building['id']>([
  'STABLE',
  'GREAT_STABLE',
]);

const siegeTrainingBuildingIds = new Set<Building['id']>(['WORKSHOP']);

const administrationTrainingBuildingIds = new Set<Building['id']>([
  'RESIDENCE',
]);

const heroTrainingBuildingIds = new Set<Building['id']>();

const trainingBuildingIdsByUnitCategory = new Map<
  Unit['category'],
  ReadonlySet<Building['id']>
>([
  ['infantry', infantryTrainingBuildingIds],
  ['cavalry', cavalryTrainingBuildingIds],
  ['siege', siegeTrainingBuildingIds],
  ['administration', administrationTrainingBuildingIds],
  ['hero', heroTrainingBuildingIds],
]);

const troopTrainingDurationEffectIdByBuildingId = new Map<
  Building['id'],
  TroopTrainingDurationEffectId
>([
  ['BARRACKS', 'barracksTrainingDuration'],
  ['GREAT_BARRACKS', 'greatBarracksTrainingDuration'],
  ['STABLE', 'stableTrainingDuration'],
  ['GREAT_STABLE', 'greatStableTrainingDuration'],
  ['WORKSHOP', 'workshopTrainingDuration'],
  ['RESIDENCE', 'residenceTrainingDuration'],
  ['HOSPITAL', 'hospitalTrainingDuration'],
  ['ASCLEPEION', 'hospitalTrainingDuration'],
]);

const villageBuildingLevelRequirementSchema = z.strictObject({
  buildingId: buildingIdSchema,
  level: z.number(),
});

export const isUnitInVillageTribe = (
  database: DbFacade,
  villageId: Village['id'],
  unit: Unit,
): boolean => {
  if (unit.tribe === 'all') {
    return true;
  }

  const villageTribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: {
      $village_id: villageId,
    },
    schema: tribeSchema,
  })!;

  return unit.tribe === villageTribe;
};

export const areVillageBuildingRequirementsMet = (
  database: DbFacade,
  villageId: Village['id'],
  requirements: Unit['researchRequirements'] | Unit['recruitmentRequirements'],
): boolean => {
  if (requirements.length === 0) {
    return true;
  }

  const requiredBuildingIds = [
    ...new Set(requirements.map(({ buildingId }) => buildingId)),
  ];

  const buildingLevels = database.selectObjects({
    sql: `
      WITH required_buildings AS (
        SELECT value AS building
        FROM json_each($building_ids)
      )

      SELECT
        rb.building AS buildingId,
        COALESCE(MAX(bf.level), 0) AS level
      FROM required_buildings rb
      LEFT JOIN building_ids bi ON bi.building = rb.building
      LEFT JOIN building_fields bf
        ON bf.building_id = bi.id
        AND bf.village_id = $village_id
        AND bf.level > 0
      GROUP BY rb.building;
    `,
    bind: {
      $village_id: villageId,
      $building_ids: JSON.stringify(requiredBuildingIds),
    },
    schema: villageBuildingLevelRequirementSchema,
  });

  const levelByBuildingId = new Map(
    buildingLevels.map(({ buildingId, level }) => [buildingId, level]),
  );

  for (const requirement of requirements) {
    const buildingLevel = levelByBuildingId.get(requirement.buildingId) ?? 0;

    if (buildingLevel < requirement.level) {
      return false;
    }
  }

  return true;
};

export const doesTroopTrainingBuildingMatchUnit = (
  unit: Unit,
  buildingId: Building['id'],
): boolean => {
  const validBuildingIds = trainingBuildingIdsByUnitCategory.get(
    unit.category,
  )!;

  return validBuildingIds.has(buildingId);
};

export const doesTroopTrainingDurationEffectMatchBuilding = (
  event: GameEvent<'troopTraining'>,
): boolean => {
  const expectedDurationEffectId =
    troopTrainingDurationEffectIdByBuildingId.get(event.buildingId) ?? null;

  return event.durationEffectId === expectedDurationEffectId;
};
