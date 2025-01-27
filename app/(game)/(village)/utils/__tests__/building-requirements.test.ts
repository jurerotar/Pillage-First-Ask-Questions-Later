import {
  assessBuildingConstructionReadiness,
  type AssessBuildingConstructionReadinessArgs,
  type AssessBuildingConstructionReadinessReturn,
  type AssessedBuildingRequirement,
} from 'app/(game)/(village)/utils/building-requirements';
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
  return assessedReadiness.assessedRequirements.find(({ type }) => type === requirementType)!;
};

const getAssessedRequirementsByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingConstructionReadinessReturn,
): AssessedBuildingRequirement[] => {
  return assessedReadiness.assessedRequirements.filter(({ type }) => type === requirementType)!;
};

describe('building-requirements', () => {
  describe('Capital requirement', () => {
    describe('Is capital village', () => {
      const capitalVillage = { ...villageMock, isCapital: true };
      test("Great barracks can't be built in capital", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: capitalVillage,
          buildingId: 'GREAT_BARRACKS',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      test("Great stable can't be built in capital", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: capitalVillage,
          buildingId: 'GREAT_STABLE',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      test('Brewery can only be built in capital', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: capitalVillage,
          buildingId: 'BREWERY',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });
    });

    describe('Non-capital village', () => {
      const nonCapitalVillage = { ...villageMock, isCapital: false };

      test('Great barracks can be built in non-capitals', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'GREAT_BARRACKS',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });

      test('Great stable can be built in non-capitals', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'GREAT_STABLE',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });

      test("Brewery can't be built in non-capitals", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'BREWERY',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });
    });
  });

  describe('Tribe requirement', () => {
    describe('Non-playable tribe can not build any of the playable tribe specific buildings', () => {
      test('Natars can not build trapper', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'TRAPPER',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({ ...args }));
        expect(fulfilled).toBe(false);
      });

      test('Natars can not build brewery', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'BREWERY',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      test('Natars can not build horse drinking trough', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'HORSE_DRINKING_TROUGH',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      test('Natars can not build command center', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'COMMAND_CENTER',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      test('Natars can not build waterworks', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          tribe: 'natars',
          buildingId: 'WATERWORKS',
          hasGreatBuildingsArtifact: true,
        };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      // test('Natars can not build asclepeion', () => {
      //   const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({...args, buildingId: 'TRAPPER'}));
      //   expect(fulfilled).toBe(false);
      // });
    });

    test('Gauls may build trapper', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'gauls',
        buildingId: 'TRAPPER',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({ ...args }));
      expect(fulfilled).toBe(true);
    });

    test('Teutons may build brewery', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'teutons',
        buildingId: 'BREWERY',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test('Romans may build horse drinking trough', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'romans',
        buildingId: 'HORSE_DRINKING_TROUGH',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test('Huns may build command center', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'huns',
        buildingId: 'COMMAND_CENTER',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test('Egyptians may build waterworks', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        tribe: 'egyptians',
        buildingId: 'WATERWORKS',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    // test('Spartans may build asclepeion', () => {
    //   const args: AssessBuildingConstructionReadinessArgs = {...defaultArgs, tribe: 'natars', buildingId: 'TRAPPER'};
    //   const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({...args}));
    //   expect(fulfilled).toBe(false);
    // });
  });

  describe('Amount requirement', () => {
    test('Can build a granary', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'GRANARY',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test("Can't build a second main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'MAIN_BUILDING',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    test("Can't build a second main building even if first is max level", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'MAIN_BUILDING', id: 1, level: 20 }] },
        buildingId: 'MAIN_BUILDING',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    test('Can build a second cranny if first one is max level', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CRANNY', id: 1, level: 10 }] },
        buildingId: 'CRANNY',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
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
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test("Can't build a cranny if one is already in building queue", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
        hasGreatBuildingsArtifact: true,
      };

      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    test('Can build a third cranny even if one is already in building queue, if you have a max level one', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CRANNY', id: 2, level: 10 }] },
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
        hasGreatBuildingsArtifact: true,
      };

      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });
  });

  describe('Building level requirement', () => {
    test('Can not build barracks immediately as a new village', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, buildingId: 'BARRACKS', hasGreatBuildingsArtifact: true };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    test('Can build barracks once main building is upgraded', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithBarracksRequirementsMetBuildingFieldsMock },
        buildingId: 'BARRACKS',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test('Can build workshop with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock },
        buildingId: 'WORKSHOP',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    // Testing this to make sure your buildings can be higher level than required
    test('Can build stable with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock },
        buildingId: 'STABLE',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    test("Can not build brickyard with clay pit lvl 10 if it's missing main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CLAY_PIT', id: 1, level: 10 }] },
        buildingId: 'BRICKYARD',
        hasGreatBuildingsArtifact: true,
      };
      const canBuild = getAssessedRequirementsByType('building', assessBuildingConstructionReadiness(args)).every(
        ({ fulfilled }) => fulfilled,
      );
      expect(canBuild).toBe(false);
    });
  });

  describe('Artifact building requirement', () => {
    test("Great stable can't be built without artifact", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
        },
        buildingId: 'GREAT_STABLE',
        hasGreatBuildingsArtifact: false,
      };
      const { fulfilled } = getAssessedRequirementByType('artifact', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    test('Great stable can be built with artifact', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: {
          ...currentVillage,
        },
        buildingId: 'GREAT_STABLE',
        hasGreatBuildingsArtifact: true,
      };
      const { fulfilled } = getAssessedRequirementByType('artifact', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });
  });
});
