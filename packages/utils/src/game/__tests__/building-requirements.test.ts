import { describe, expect, test } from 'vitest';
import type {
  Building,
  BuildingRequirement,
} from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import {
  type AssessBuildingRequirementsArgs,
  type AssessBuildingRequirementsReturn,
  type AssessedBuildingRequirement,
  assessBuildingRequirements,
} from '../building-requirements';

const createBuilding = (
  id: Building['id'],
  buildingRequirements: BuildingRequirement[],
  maxLevel = 20,
): Building => ({
  id,
  buildingRequirements,
  maxLevel,
  category: 'infrastructure',
  populationCoefficient: 1,
  culturePointsCoefficient: 1,
  buildingDurationBase: 1,
  buildingDurationModifier: 1,
  buildingDurationReduction: 1,
  effects: [],
  baseBuildingCost: [1, 1, 1, 1],
  buildingCostCoefficient: 1,
});

const toMaxLevelMap = (buildingFields: BuildingField[]) => {
  const map = new Map<Building['id'], number>();

  for (const bf of buildingFields) {
    const prev = map.get(bf.buildingId);
    if (prev === undefined || bf.level > prev) {
      map.set(bf.buildingId, bf.level);
    }
  }

  return map;
};

const toIdsInQueue = (events: Pick<BuildingEvent, 'buildingId'>[]) => {
  const set = new Set<Building['id']>();

  for (const ev of events) {
    set.add(ev.buildingId);
  }

  return set;
};

const defaultArgs: Omit<AssessBuildingRequirementsArgs, 'building'> = {
  tribe: 'gauls',
  maxLevelByBuildingId: toMaxLevelMap([
    { buildingId: 'MAIN_BUILDING', id: 38, level: 1 },
    { buildingId: 'RALLY_POINT', id: 39, level: 1 },
  ]),
  buildingIdsInQueue: toIdsInQueue([]),
};

const getAssessedRequirementByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingRequirementsReturn,
): AssessedBuildingRequirement => {
  return assessedReadiness.assessedRequirements.find(
    ({ type }) => type === requirementType,
  )!;
};

const getAssessedRequirementsByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingRequirementsReturn,
): AssessedBuildingRequirement[] => {
  return assessedReadiness.assessedRequirements.filter(
    ({ type }) => type === requirementType,
  );
};

describe('building-requirements', () => {
  describe('tribe requirement', () => {
    const trapper = createBuilding('TRAPPER', [
      { id: 1, type: 'tribe', tribe: 'gauls' },
    ]);

    test('non-matching tribes can not construct tribal buildings', () => {
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements({
          ...defaultArgs,
          tribe: 'natars',
          building: trapper,
        }),
      );

      expect(fulfilled).toBe(false);
    });

    test('matching tribes can construct tribal buildings', () => {
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements({
          ...defaultArgs,
          tribe: 'gauls',
          building: trapper,
        }),
      );

      expect(fulfilled).toBe(true);
    });
  });

  describe('amount requirement', () => {
    test('can construct the first instance of a repeatable building', () => {
      const granary = createBuilding('GRANARY', [
        { id: 1, type: 'amount', amount: Number.POSITIVE_INFINITY },
      ]);
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements({ ...defaultArgs, building: granary }),
      );

      expect(fulfilled).toBe(true);
    });

    test("can't construct a second unique building", () => {
      const mainBuilding = createBuilding('MAIN_BUILDING', [
        { id: 1, type: 'amount', amount: 1 },
      ]);
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements({ ...defaultArgs, building: mainBuilding }),
      );

      expect(fulfilled).toBe(false);
    });

    test('can construct an additional repeatable building when one is max level', () => {
      const cranny = createBuilding(
        'CRANNY',
        [{ id: 1, type: 'amount', amount: Number.POSITIVE_INFINITY }],
        10,
      );
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements({
          ...defaultArgs,
          maxLevelByBuildingId: toMaxLevelMap([
            { buildingId: 'CRANNY', id: 1, level: 10 },
          ]),
          building: cranny,
        }),
      );

      expect(fulfilled).toBe(true);
    });

    test("can't construct a first instance if one is already queued", () => {
      const cranny = createBuilding('CRANNY', [
        { id: 1, type: 'amount', amount: Number.POSITIVE_INFINITY },
      ]);
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements({
          ...defaultArgs,
          buildingIdsInQueue: toIdsInQueue([{ buildingId: 'CRANNY' }]),
          building: cranny,
        }),
      );

      expect(fulfilled).toBe(false);
    });
  });

  describe('building level requirement', () => {
    const barracks = createBuilding('BARRACKS', [
      { id: 1, type: 'building', buildingId: 'MAIN_BUILDING', level: 3 },
    ]);

    test('can not construct when a required building level is missing', () => {
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements({ ...defaultArgs, building: barracks }),
      );

      expect(fulfilled).toBe(false);
    });

    test('can construct when required building levels are met', () => {
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements({
          ...defaultArgs,
          maxLevelByBuildingId: toMaxLevelMap([
            { buildingId: 'MAIN_BUILDING', id: 38, level: 3 },
          ]),
          building: barracks,
        }),
      );

      expect(fulfilled).toBe(true);
    });

    test('requires all building-level requirements to be met', () => {
      const workshop = createBuilding('WORKSHOP', [
        { id: 1, type: 'building', buildingId: 'MAIN_BUILDING', level: 10 },
        { id: 2, type: 'building', buildingId: 'ACADEMY', level: 10 },
      ]);
      const canBuild = getAssessedRequirementsByType(
        'building',
        assessBuildingRequirements({
          ...defaultArgs,
          maxLevelByBuildingId: toMaxLevelMap([
            { buildingId: 'MAIN_BUILDING', id: 38, level: 10 },
          ]),
          building: workshop,
        }),
      ).every(({ fulfilled }) => fulfilled);

      expect(canBuild).toBe(false);
    });
  });
});
