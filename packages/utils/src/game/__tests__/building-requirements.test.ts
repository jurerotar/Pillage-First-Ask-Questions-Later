import { describe, expect, test } from 'vitest';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
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
  effects: () => [],
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
  describe.each([
    { buildingId: 'BREWERY', level: 20, needsWarehouse: false },
    { buildingId: 'GATHERERS_HUT', level: 3, needsWarehouse: true },
    { buildingId: 'MARKETPLACE', level: 1, needsWarehouse: true },
  ] as const)(
    '$buildingId storage prerequisites',
    ({ buildingId, level, needsWarehouse }) => {
      const assess = (
        levels: Map<Building['id'], number>,
        tribe: AssessBuildingRequirementsArgs['tribe'] = 'teutons',
        queue: Building['id'][] = [],
      ) =>
        assessBuildingRequirements({
          building: getBuildingDefinition(buildingId),
          tribe,
          maxLevelByBuildingId: levels,
          buildingIdsInQueue: new Set(queue),
        });

      const createLevels = () =>
        new Map<Building['id'], number>([
          ['MAIN_BUILDING', 3],
          ['RALLY_POINT', 10],
          ['WAREHOUSE', level],
          ['GRANARY', level],
        ]);

      test.each([
        ['WAREHOUSE', 'GRANARY'],
        ['WAREHOUSE', 'GREAT_GRANARY'],
        ['GREAT_WAREHOUSE', 'GRANARY'],
        ['GREAT_WAREHOUSE', 'GREAT_GRANARY'],
      ] as const)('accepts %s and %s', (warehouseId, granaryId) => {
        const levels = createLevels();

        levels.delete('WAREHOUSE');
        levels.delete('GRANARY');
        levels.set(warehouseId, level);
        levels.set(granaryId, level);

        expect(assess(levels).canBuild).toBe(true);
      });

      test('requires each storage category at the minimum level', () => {
        const storagePairs = [
          ['GRANARY', 'GREAT_GRANARY'],
          ...(needsWarehouse
            ? ([['WAREHOUSE', 'GREAT_WAREHOUSE']] as const)
            : []),
        ] as const;

        for (const [regularId, greatId] of storagePairs) {
          const levels = createLevels();

          levels.delete(regularId);

          expect(assess(levels).canBuild).toBe(false);

          levels.set(greatId, level - 1);

          expect(assess(levels).canBuild).toBe(false);

          levels.set(regularId, level - 1);

          expect(assess(levels).canBuild).toBe(false);

          levels.set(greatId, level);

          expect(assess(levels).canBuild).toBe(true);
        }
      });

      test('queued great storage cannot replace completed storage', () => {
        const levels = createLevels();

        levels.delete('GRANARY');

        expect(assess(levels, 'teutons', ['GREAT_GRANARY']).canBuild).toBe(
          false,
        );
      });

      test('still enforces non-storage prerequisites and building limits', () => {
        const levels = createLevels();

        if (buildingId === 'BREWERY') {
          expect(assess(levels, 'gauls').canBuild).toBe(false);

          levels.set('RALLY_POINT', 9);
        } else {
          levels.set('MAIN_BUILDING', 2);
        }

        expect(assess(levels).canBuild).toBe(false);

        const existingLevels = createLevels();

        existingLevels.set(buildingId, 20);

        expect(assess(existingLevels).canBuild).toBe(false);
      });
    },
  );

  describe.each([
    ['GREAT_WAREHOUSE', 'WAREHOUSE'],
    ['GREAT_GRANARY', 'GRANARY'],
  ] as const)(
    '%s storage alternatives',
    (greatBuildingId, regularBuildingId) => {
      const assessStorage = (
        regularLevel?: number,
        greatLevel?: number,
        mainBuildingLevel = 10,
        queued = false,
      ) => {
        const levels = new Map<Building['id'], number>([
          ['MAIN_BUILDING', mainBuildingLevel],
        ]);

        if (regularLevel !== undefined) {
          levels.set(regularBuildingId, regularLevel);
        }

        if (greatLevel !== undefined) {
          levels.set(greatBuildingId, greatLevel);
        }

        return assessBuildingRequirements({
          ...defaultArgs,
          building: getBuildingDefinition(greatBuildingId),
          maxLevelByBuildingId: levels,
          buildingIdsInQueue: new Set(queued ? [greatBuildingId] : []),
        });
      };

      test('allows the first instance with regular storage at level 20', () => {
        expect(assessStorage(20).canBuild).toBe(true);
      });

      test('allows another instance after regular storage is demolished', () => {
        const result = assessStorage(undefined, 20);

        expect(result.canBuild).toBe(true);
        expect(getAssessedRequirementByType('or', result).fulfilled).toBe(true);
      });

      test('allows both alternatives to be met', () => {
        expect(assessStorage(20, 20).canBuild).toBe(true);
      });

      test('rejects missing or insufficient storage levels', () => {
        expect(assessStorage().canBuild).toBe(false);
        expect(assessStorage(19).canBuild).toBe(false);
        expect(assessStorage(undefined, 19).canBuild).toBe(false);
        expect(assessStorage(19, 19).canBuild).toBe(false);
      });

      test('still requires the main building and a max-level existing instance', () => {
        expect(assessStorage(undefined, 20, 9).canBuild).toBe(false);
        expect(assessStorage(20, 19).canBuild).toBe(false);
      });

      test('queued construction does not satisfy prerequisites', () => {
        expect(assessStorage(undefined, undefined, 10, true).canBuild).toBe(
          false,
        );
        expect(assessStorage(20, undefined, 10, true).canBuild).toBe(false);
        expect(assessStorage(undefined, 20, 10, true).canBuild).toBe(true);
      });
    },
  );

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
