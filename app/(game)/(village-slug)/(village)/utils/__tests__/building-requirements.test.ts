import {
  assessBuildingConstructionReadiness,
  type AssessBuildingConstructionReadinessArgs,
  type AssessBuildingConstructionReadinessReturn,
  type AssessedBuildingRequirement,
} from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { BuildingRequirement } from 'app/interfaces/models/game/building';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { Village } from 'app/interfaces/models/game/village';
import { createBuildingConstructionEventMock } from 'app/tests/mocks/game/event-mock';
import {
  villageWithBarracksRequirementsMetBuildingFieldsMock,
  villageWithWorkshopRequirementsMetBuildingFieldsMock,
} from 'app/tests/mocks/game/village/building-fields-mock';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import { describe, expect, test } from 'vitest';

const buildingConstructionEventMock = createBuildingConstructionEventMock({
  buildingId: 'CRANNY',
  buildingFieldId: 38,
  level: 2,
});

const currentVillage: Village = villageMock;
const playerVillages: Village[] = [villageMock, villageMock];
const tribe: Tribe = 'gauls';
const currentVillageBuildingEvents: GameEvent<'buildingConstruction'>[] = [];

const defaultArgs = {
  currentVillage,
  currentVillageBuildingEvents,
  playerVillages,
  tribe,
};

const getAssessedRequirementByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingConstructionReadinessReturn,
): AssessedBuildingRequirement => {
  return assessedReadiness.assessedRequirements.find(
    ({ type }) => type === requirementType,
  )!;
};

const getAssessedRequirementsByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingConstructionReadinessReturn,
): AssessedBuildingRequirement[] => {
  return assessedReadiness.assessedRequirements.filter(
    ({ type }) => type === requirementType,
  );
};

describe('building-requirements', () => {
  describe('Tribe requirement', () => {
    describe('Non-playable tribe can not build any of the playable tribe specific buildings', () => {
      test('Natars can not build trapper', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'TRAPPER',
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingConstructionReadiness({ ...args }),
        );
        expect(fulfilled).toBeFalsy();
      });

      test('Natars can not build brewery', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'BREWERY',
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingConstructionReadiness(args),
        );
        expect(fulfilled).toBeFalsy();
      });

      test('Natars can not build horse drinking trough', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'HORSE_DRINKING_TROUGH',
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingConstructionReadiness(args),
        );
        expect(fulfilled).toBeFalsy();
      });

      test('Natars can not build command center', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'COMMAND_CENTER',
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingConstructionReadiness(args),
        );
        expect(fulfilled).toBeFalsy();
      });

      test('Natars can not build waterworks', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'WATERWORKS',
        };
        const { fulfilled } = getAssessedRequirementByType(
          'tribe',
          assessBuildingConstructionReadiness(args),
        );
        expect(fulfilled).toBeFalsy();
      });
    });

    test('Gauls may build trapper', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'gauls',
        buildingId: 'TRAPPER',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingConstructionReadiness({ ...args }),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Teutons may build brewery', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'teutons',
        buildingId: 'BREWERY',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Romans may build horse drinking trough', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'romans',
        buildingId: 'HORSE_DRINKING_TROUGH',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Huns may build command center', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'huns',
        buildingId: 'COMMAND_CENTER',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Egyptians may build waterworks', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'egyptians',
        buildingId: 'WATERWORKS',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'tribe',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });
  });

  describe('Amount requirement', () => {
    test('Can build a granary', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'GRANARY',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test("Can't build a second main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'MAIN_BUILDING',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeFalsy();
    });

    test("Can't build a second main building even if first is max level", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: [{ buildingId: 'MAIN_BUILDING', id: 1, level: 20 }],
        },
        buildingId: 'MAIN_BUILDING',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeFalsy();
    });

    test('Can build a second cranny if first one is max level', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: [{ buildingId: 'CRANNY', id: 1, level: 10 }],
        },
        buildingId: 'CRANNY',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Can build a third cranny if one is max level, even if other is not max level', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: [
            { buildingId: 'CRANNY', id: 1, level: 1 },
            { buildingId: 'CRANNY', id: 2, level: 10 },
          ],
        },
        buildingId: 'CRANNY',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test("Can't build a cranny if one is already in building queue", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
      };

      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeFalsy();
    });

    test('Can build a third cranny even if one is already in building queue, if you have a max level one', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: [{ buildingId: 'CRANNY', id: 2, level: 10 }],
        },
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
      };

      const { fulfilled } = getAssessedRequirementByType(
        'amount',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });
  });

  describe('Building level requirement', () => {
    test('Can not build barracks immediately as a new village', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'BARRACKS',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeFalsy();
    });

    test('Can build barracks once main building is upgraded', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: villageWithBarracksRequirementsMetBuildingFieldsMock,
        },
        buildingId: 'BARRACKS',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test('Can build workshop with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock,
        },
        buildingId: 'WORKSHOP',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    // Testing this to make sure your buildings can be higher level than required
    test('Can build stable with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock,
        },
        buildingId: 'STABLE',
      };
      const { fulfilled } = getAssessedRequirementByType(
        'building',
        assessBuildingConstructionReadiness(args),
      );
      expect(fulfilled).toBeTruthy();
    });

    test("Can not build brickyard with clay pit lvl 10 if it's missing main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
          buildingFields: [{ buildingId: 'CLAY_PIT', id: 1, level: 10 }],
        },
        buildingId: 'BRICKYARD',
      };
      const canBuild = getAssessedRequirementsByType(
        'building',
        assessBuildingConstructionReadiness(args),
      ).every(({ fulfilled }) => fulfilled);
      expect(canBuild).toBeFalsy();
    });
  });
});
