import { villageMock } from 'mocks/models/game/village/village-mock';
import {
  assessBuildingConstructionReadiness,
  AssessBuildingConstructionReadinessArgs,
  AssessBuildingConstructionReadinessReturn,
  AssessedBuildingRequirement,
} from 'app/[game]/[village]/utils/building-requirements';
import { GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { Tribe } from 'interfaces/models/game/tribe';
import { Village } from 'interfaces/models/game/village';
import { BuildingRequirement } from 'interfaces/models/game/building';
import {
  villageWithBarracksRequirementsMetBuildingFieldsMock,
  villageWithWorkshopRequirementsMetBuildingFieldsMock,
} from 'mocks/models/game/village/building-fields-mock';
import { buildingConstructionEventMock } from 'mocks/models/game/event-mock';

const currentVillage: Village = villageMock;
const playerVillages: Village[] = [villageMock, villageMock];
const tribe: Tribe = 'gauls';
const currentVillageBuildingEvents: GameEvent<GameEventType.BUILDING_CONSTRUCTION>[] = [];

const defaultArgs = {
  currentVillage,
  currentVillageBuildingEvents,
  playerVillages,
  tribe,
};

const getAssessedRequirementByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingConstructionReadinessReturn
): AssessedBuildingRequirement => {
  return assessedReadiness.assessedRequirements.find(({ type }) => type === requirementType)!;
};

const getAssessedRequirementsByType = (
  requirementType: BuildingRequirement['type'],
  assessedReadiness: AssessBuildingConstructionReadinessReturn
): AssessedBuildingRequirement[] => {
  return assessedReadiness.assessedRequirements.filter(({ type }) => type === requirementType)!;
};

describe('building-requirements', () => {
  describe('Capital requirement', () => {
    describe('Is capital village', () => {
      const capitalVillage = { ...villageMock, isCapital: true };
      it("Great barracks can't be built in capital", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: capitalVillage,
          buildingId: 'GREAT_BARRACKS',
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it("Great stable can't be built in capital", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: capitalVillage,
          buildingId: 'GREAT_STABLE',
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it('Brewery can only be built in capital', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, currentVillage: capitalVillage, buildingId: 'BREWERY' };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });

      it('Stonemason can only be built in capital', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, currentVillage: capitalVillage, buildingId: 'STONEMASON' };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });
    });

    describe('Non-capital village', () => {
      const nonCapitalVillage = { ...villageMock, isCapital: false };

      it('Great barracks can be built in non-capitals', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'GREAT_BARRACKS',
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });

      it('Great stable can be built in non-capitals', () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'GREAT_STABLE',
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(true);
      });

      it("Brewery can't be built in non-capitals", () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, currentVillage: nonCapitalVillage, buildingId: 'BREWERY' };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it("Stonemason can't be built in non-capitals", () => {
        const args: AssessBuildingConstructionReadinessArgs = {
          ...defaultArgs,
          currentVillage: nonCapitalVillage,
          buildingId: 'STONEMASON',
        };
        const { fulfilled } = getAssessedRequirementByType('capital', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });
    });
  });

  describe('Tribe requirement', () => {
    describe('Non-playable tribe can not build any of the playable tribe specific buildings', () => {
      it('Natars can not build trapper', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'natars', buildingId: 'TRAPPER' };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({ ...args }));
        expect(fulfilled).toBe(false);
      });

      it('Natars can not build brewery', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'natars', buildingId: 'BREWERY' };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it('Natars can not build horse drinking trough', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'natars', buildingId: 'HORSE_DRINKING_TROUGH' };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it('Natars can not build command center', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'natars', buildingId: 'COMMAND_CENTER' };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      it('Natars can not build waterworks', () => {
        const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'natars', buildingId: 'WATERWORKS' };
        const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
        expect(fulfilled).toBe(false);
      });

      // it('Natars can not build asclepeion', () => {
      //   const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({...args, buildingId: 'TRAPPER'}));
      //   expect(fulfilled).toBe(false);
      // });
    });

    it('Gauls may build trapper', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'gauls', buildingId: 'TRAPPER' };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({ ...args }));
      expect(fulfilled).toBe(true);
    });

    it('Teutons may build brewery', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'teutons', buildingId: 'BREWERY' };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it('Romans may build horse drinking trough', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'romans', buildingId: 'HORSE_DRINKING_TROUGH' };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it('Huns may build command center', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'huns', buildingId: 'COMMAND_CENTER' };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it('Egyptians may build waterworks', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, tribe: 'egyptians', buildingId: 'WATERWORKS' };
      const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    // it('Spartans may build asclepeion', () => {
    //   const args: AssessBuildingConstructionReadinessArgs = {...defaultArgs, tribe: 'natars', buildingId: 'TRAPPER'};
    //   const { fulfilled } = getAssessedRequirementByType('tribe', assessBuildingConstructionReadiness({...args}));
    //   expect(fulfilled).toBe(false);
    // });
  });

  describe('Amount requirement', () => {
    it('Can build a granary', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'GRANARY',
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it("Can't build a second main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        buildingId: 'MAIN_BUILDING',
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    it("Can't build a second main building even if first is max level", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'MAIN_BUILDING', id: 1, level: 20 }] },
        buildingId: 'MAIN_BUILDING',
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    it('Can build a second cranny if first one is max level', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CRANNY', id: 1, level: 10 }] },
        buildingId: 'CRANNY',
      };
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it('Can build a third cranny if one is max level, even if other is not max level', () => {
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
      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it("Can't build a cranny if one is already in building queue", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
      };

      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    it('Can build a third cranny even if one is already in building queue, if you have a max level one', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CRANNY', id: 2, level: 10 }] },
        currentVillageBuildingEvents: [buildingConstructionEventMock],
        buildingId: 'CRANNY',
      };

      const { fulfilled } = getAssessedRequirementByType('amount', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });
  });

  describe('Building level requirement', () => {
    it('Can not build barracks immediately as a new village', () => {
      const args: AssessBuildingConstructionReadinessArgs = { ...defaultArgs, buildingId: 'BARRACKS' };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(false);
    });

    it('Can build barracks once main building is upgraded', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithBarracksRequirementsMetBuildingFieldsMock },
        buildingId: 'BARRACKS',
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it('Can build workshop with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock },
        buildingId: 'WORKSHOP',
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    // Testing this to make sure your buildings can be higher level than required
    it('Can build smithy with academy and main building at lvl 10', () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: villageWithWorkshopRequirementsMetBuildingFieldsMock },
        buildingId: 'SMITHY',
      };
      const { fulfilled } = getAssessedRequirementByType('building', assessBuildingConstructionReadiness(args));
      expect(fulfilled).toBe(true);
    });

    it("Can not build brickyard with clay pit lvl 10 if it's missing main building", () => {
      const args: AssessBuildingConstructionReadinessArgs = {
        ...defaultArgs,
        currentVillage: { ...currentVillage, buildingFields: [{ buildingId: 'CLAY_PIT', id: 1, level: 10 }] },
        buildingId: 'BRICKYARD',
      };
      const canBuild = getAssessedRequirementsByType('building', assessBuildingConstructionReadiness(args)).every(
        ({ fulfilled }) => fulfilled
      );
      expect(canBuild).toBe(false);
    });
  });
});
