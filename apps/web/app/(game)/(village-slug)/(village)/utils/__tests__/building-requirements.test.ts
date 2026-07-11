import { describe, expect, test } from 'vitest';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import {
  villageWithBarracksRequirementsMetBuildingFieldsMock,
  villageWithWorkshopRequirementsMetBuildingFieldsMock,
} from '@pillage-first/mocks/building-fields';
import { createBuildingConstructionEventMock } from '@pillage-first/mocks/event';
import { villageMock } from '@pillage-first/mocks/village';
import type {
  Building,
  BuildingRequirement,
} from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';
import {
  type AssessBuildingRequirementsArgs,
  type AssessBuildingRequirementsReturn,
  type AssessedBuildingRequirement,
  assessBuildingRequirements,
} from '@pillage-first/utils/game/building-requirements';

const buildingConstructionEventMock = createBuildingConstructionEventMock({
  buildingId: 'CRANNY',
  buildingFieldId: 38,
  level: 2,
});

const currentVillage: Village = villageMock;
const tribe: Tribe = 'gauls';
const currentVillageBuildingEvents: BuildingEvent[] = [];

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

const toIdsInQueue = (events: BuildingEvent[]) => {
  const set = new Set<Building['id']>();

  for (const ev of events) {
    set.add(ev.buildingId);
  }

  return set;
};

const defaultArgs: Omit<AssessBuildingRequirementsArgs, 'building'> = {
  tribe,
  maxLevelByBuildingId: toMaxLevelMap(currentVillage.buildingFields),
  buildingIdsInQueue: toIdsInQueue(currentVillageBuildingEvents),
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
    describe('non-playable tribe can not build any of the playable tribe specific buildings', () => {
      test('natars can not build trapper', () => {
        const args: AssessBuildingRequirementsArgs = {
          ...defaultArgs,
          tribe: 'natars',
          building: getBuildingDefinition('TRAPPER'),
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingRequirements({ ...args }),
        );
        expect(fulfilled).toBe(false);
      });

      test('natars can not build brewery', () => {
        const args: AssessBuildingRequirementsArgs = {
          ...defaultArgs,
          tribe: 'natars',
          building: getBuildingDefinition('BREWERY'),
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingRequirements(args),
        );
        expect(fulfilled).toBe(false);
      });

      test('natars can not build horse drinking trough', () => {
        const args: AssessBuildingRequirementsArgs = {
          ...defaultArgs,
          tribe: 'natars',
          building: getBuildingDefinition('HORSE_DRINKING_TROUGH'),
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingRequirements(args),
        );
        expect(fulfilled).toBe(false);
      });

      test('natars can not build trapper', () => {
        const args: AssessBuildingRequirementsArgs = {
          ...defaultArgs,
          tribe: 'natars',
          building: getBuildingDefinition('TRAPPER'),
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingRequirements(args),
        );
        expect(fulfilled).toBe(false);
      });

      test('natars can not build waterworks', () => {
        const args: AssessBuildingRequirementsArgs = {
          ...defaultArgs,
          tribe: 'natars',
          building: getBuildingDefinition('WATERWORKS'),
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingRequirements(args),
        );
        expect(fulfilled).toBe(false);
      });
    });

    test('gauls may build trapper', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        tribe: 'gauls',
        building: getBuildingDefinition('TRAPPER'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements({ ...args }),
      );
      expect(fulfilled).toBe(true);
    });

    test('teutons may build brewery', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        tribe: 'teutons',
        building: getBuildingDefinition('BREWERY'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test('romans may build horse drinking trough', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        tribe: 'romans',
        building: getBuildingDefinition('HORSE_DRINKING_TROUGH'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    // test('huns may build command center', () => {
    //   const args: AssessBuildingRequirementsArgs = {
    //     ...defaultArgs,
    //     tribe: 'huns',
    //     building: getBuildingDefinition('COMMAND_CENTER'),
    //   };
    //   const { fulfilled } = getAssessedRequirementByType(
    //     'tribe',
    //     assessBuildingRequirements(args),
    //   );
    //   expect(fulfilled).toBe(true);
    // });

    test('egyptians may build waterworks', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        tribe: 'egyptians',
        building: getBuildingDefinition('WATERWORKS'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });
  });

  describe('amount requirement', () => {
    test('can build a granary', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        building: getBuildingDefinition('GRANARY'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test("can't build a second main building", () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        building: getBuildingDefinition('MAIN_BUILDING'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(false);
    });

    test("can't build a palisade", () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          { buildingId: 'GAUL_WALL', id: 40, level: 0 },
        ]),
        building: getBuildingDefinition('GAUL_WALL'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(false);
    });

    test("can't build a second main building even if first is max level", () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          {
            buildingId: 'MAIN_BUILDING',
            id: 1,
            level: 20,
          },
        ]),
        building: getBuildingDefinition('MAIN_BUILDING'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(false);
    });

    test('can build a second cranny if first one is max level', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          { buildingId: 'CRANNY', id: 1, level: 10 },
        ]),
        building: getBuildingDefinition('CRANNY'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test('can build a third cranny if one is max level, even if other is not max level', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          { buildingId: 'CRANNY', id: 1, level: 1 },
          { buildingId: 'CRANNY', id: 2, level: 10 },
        ]),
        building: getBuildingDefinition('CRANNY'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test("can't build a cranny if one is already in building queue", () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        buildingIdsInQueue: toIdsInQueue([buildingConstructionEventMock]),
        building: getBuildingDefinition('CRANNY'),
      };

      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(false);
    });

    test('can build a third cranny even if one is already in building queue, if you have a max level one', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          { buildingId: 'CRANNY', id: 2, level: 10 },
        ]),
        buildingIdsInQueue: toIdsInQueue([buildingConstructionEventMock]),
        building: getBuildingDefinition('CRANNY'),
      };

      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });
  });

  describe('building level requirement', () => {
    test('can not build barracks immediately as a new village', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        building: getBuildingDefinition('BARRACKS'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(false);
    });

    test('can build barracks once main building is upgraded', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap(
          villageWithBarracksRequirementsMetBuildingFieldsMock,
        ),
        building: getBuildingDefinition('BARRACKS'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test('can build workshop with academy and main building at lvl 10', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap(
          villageWithWorkshopRequirementsMetBuildingFieldsMock,
        ),
        building: getBuildingDefinition('WORKSHOP'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    // Testing this to make sure your buildings can be higher level than required
    test('can build stable with academy and main building at lvl 10', () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap(
          villageWithWorkshopRequirementsMetBuildingFieldsMock,
        ),
        building: getBuildingDefinition('STABLE'),
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingRequirements(args),
      );
      expect(fulfilled).toBe(true);
    });

    test("can not build brickyard with clay pit lvl 10 if it's missing main building", () => {
      const args: AssessBuildingRequirementsArgs = {
        ...defaultArgs,
        maxLevelByBuildingId: toMaxLevelMap([
          { buildingId: 'CLAY_PIT', id: 1, level: 10 },
        ]),
        building: getBuildingDefinition('BRICKYARD'),
      };
      const canBuild = getAssessedRequirementsByType(
        'building',
        assessBuildingRequirements(args),
      ).every(({ fulfilled }) => fulfilled);
      expect(canBuild).toBe(false);
    });
  });
});
