import { renderHookWithGameContext } from 'test-utils';
import { useBuildingRequirements } from 'app/[game]/[village]/hooks/use-building-requirements';
import { QueryClient } from '@tanstack/react-query';
import { Village } from 'interfaces/models/game/village';
import { villageMock } from 'mocks/models/game/village/village-mock';
import {
  egyptianServerMock,
  gaulServerMock,
  hunServerMock,
  natarServerMock,
  romanServerMock,
  serverMock,
  teutonServerMock,
} from 'mocks/models/game/server-mock';
import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { Server } from 'interfaces/models/game/server';
import { currentServerCacheKey } from 'app/[game]/hooks/use-current-server';
import {
  villageWithBarracksRequirementsMetBuildingFieldsMock,
  villageWithTownHallRequirementsMetBuildingFieldsMock,
} from 'mocks/models/game/village/building-fields-mock';
import { GameEvent } from 'interfaces/models/events/game-event';
import { eventsCacheKey } from 'app/[game]/hooks/use-events';
import { buildingConstructionEventMock } from 'mocks/models/game/event-mock';

const { id: serverId, slug } = serverMock;

describe('useBuildingRequirements', () => {
  describe('Capital requirement', () => {
    describe('Is capital village', () => {
      it('Great barracks can\'t be built in capital', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: true }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('GREAT_BARRACKS'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(false);
      });

      it('Great stable can\'t be built in capital', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: true }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('GREAT_STABLE'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(false);
      });

      it('Brewery can only be built in capital', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: true }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('BREWERY'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(true);
      });
    });

    describe('Is not capital village', () => {
      it('Great barracks can be built in non-capitals', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: false }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('GREAT_BARRACKS'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(true);
      });

      it('Great stable can be built in non-capitals', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: false }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('GREAT_STABLE'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(true);
      });

      it('Brewery can\'t be built in non-capitals', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{ ...villageMock, isCapital: false }]);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('BREWERY'), { queryClient });
        const { hasMetCapitalRequirement } = result.current;
        expect(hasMetCapitalRequirement).toBe(false);
      });
    });
  });

  describe('Tribe requirement', () => {
    describe('Non-playable tribe can not build any of the playable tribe specific buildings', () => {
      it('Natars can not build trapper', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Server>([currentServerCacheKey, slug], natarServerMock);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('TRAPPER'), { queryClient });
        const { hasMetTribeRequirement } = result.current;
        expect(hasMetTribeRequirement).toBe(false);
      });

      it('Natars can not build brewery', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Server>([currentServerCacheKey, slug], natarServerMock);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('BREWERY'), { queryClient });
        const { hasMetTribeRequirement } = result.current;
        expect(hasMetTribeRequirement).toBe(false);
      });

      it('Natars can not build horse drinking trough', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Server>([currentServerCacheKey, slug], natarServerMock);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('HORSE_DRINKING_TROUGH'), { queryClient });
        const { hasMetTribeRequirement } = result.current;
        expect(hasMetTribeRequirement).toBe(false);
      });

      it('Natars can not build command center', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Server>([currentServerCacheKey, slug], natarServerMock);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('COMMAND_CENTER'), { queryClient });
        const { hasMetTribeRequirement } = result.current;
        expect(hasMetTribeRequirement).toBe(false);
      });

      it('Natars can not build waterworks', () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData<Server>([currentServerCacheKey, slug], natarServerMock);

        const { result } = renderHookWithGameContext(() => useBuildingRequirements('WATERWORKS'), { queryClient });
        const { hasMetTribeRequirement } = result.current;
        expect(hasMetTribeRequirement).toBe(false);
      });

      // it('Natars can not build asclepeion', () => {
      //   const { result } = renderHookWithGameContext(() => useBuildingRequirements('TRAPPER'), { queryClient });
      //   const { hasTribeRequirement } = result.current;
      //   expect(hasTribeRequirement).toBe(false);
      // });
    });

    it('Gauls may build trapper', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Server>([currentServerCacheKey, slug], gaulServerMock);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('TRAPPER'), { queryClient });
      const { hasMetTribeRequirement } = result.current;
      expect(hasMetTribeRequirement).toBe(true);
    });

    it('Teutons may build brewery', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Server>([currentServerCacheKey, slug], teutonServerMock);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('BREWERY'), { queryClient });
      const { hasMetTribeRequirement } = result.current;
      expect(hasMetTribeRequirement).toBe(true);
    });

    it('Romans may build horse drinking trough', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Server>([currentServerCacheKey, slug], romanServerMock);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('HORSE_DRINKING_TROUGH'), { queryClient });
      const { hasMetTribeRequirement } = result.current;
      expect(hasMetTribeRequirement).toBe(true);
    });

    it('Huns may build command center', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Server>([currentServerCacheKey, slug], hunServerMock);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('COMMAND_CENTER'), { queryClient });
      const { hasMetTribeRequirement } = result.current;
      expect(hasMetTribeRequirement).toBe(true);
    });

    it('Egyptians may build waterworks', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Server>([currentServerCacheKey, slug], egyptianServerMock);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('WATERWORKS'), { queryClient });
      const { hasMetTribeRequirement } = result.current;
      expect(hasMetTribeRequirement).toBe(true);
    });

    // it('Spartans may build asclepeion', () => {
    //   const queryClient = new QueryClient();
    //   queryClient.setQueryData<Server>([currentServerCacheKey, slug], spartanServerMock);
    //
    //   const { result } = renderHookWithGameContext(() => useBuildingRequirements(''), { queryClient });
    //   const { hasTribeRequirement } = result.current;
    //   expect(hasTribeRequirement).toBe(true);
    // });
  });

  describe('Other buildings requirement', () => {
    it('Can not build barracks immediately as a new village', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [villageMock]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('BARRACKS'), { queryClient });
      const { hasMetOtherBuildingRequirements } = result.current;
      expect(hasMetOtherBuildingRequirements).toBe(false);
    });

    it('Can build barracks once main building is upgraded', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: villageWithBarracksRequirementsMetBuildingFieldsMock,
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('BARRACKS'), { queryClient });
      const { hasMetOtherBuildingRequirements } = result.current;
      expect(hasMetOtherBuildingRequirements).toBe(true);
    });

    it('Can build town hall with academy and main building at lvl 10', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: villageWithTownHallRequirementsMetBuildingFieldsMock,
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('TOWN_HALL'), { queryClient });
      const { hasMetOtherBuildingRequirements } = result.current;
      expect(hasMetOtherBuildingRequirements).toBe(true);
    });

    // Testing this to make sure your buildings can be higher level than required
    it('Can build smithy with academy and main building at lvl 10', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: villageWithTownHallRequirementsMetBuildingFieldsMock,
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('SMITHY'), { queryClient });
      const { hasMetOtherBuildingRequirements } = result.current;
      expect(hasMetOtherBuildingRequirements).toBe(true);
    });

    it('Can not build brickyard with clay pit lvl 10 if it\'s missing main building', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: [{ buildingId: 'CLAY_PIT', id: 1, level: 10 }],
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('BRICKYARD'), { queryClient });
      const { hasMetOtherBuildingRequirements } = result.current;
      expect(hasMetOtherBuildingRequirements).toBe(false);
    });
  });

  describe('Amount restriction', () => {
    it('Can\'t build a second main building', () => {
      const { result } = renderHookWithGameContext(() => useBuildingRequirements('MAIN_BUILDING'));
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(false);
    });

    it('Can\'t build a second main building even if first is max level', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: [{ buildingId: 'MAIN_BUILDING', id: 1, level: 20 }],
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('MAIN_BUILDING'));
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(false);
    });

    it('Can build a second cranny if first one is max level', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: [{ buildingId: 'CRANNY', id: 1, level: 10 }],
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('CRANNY'), { queryClient });
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(true);
    });

    it('Can build a third cranny if one is max level, even if other is not max level', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: [{ buildingId: 'CRANNY', id: 1, level: 1 }, { buildingId: 'CRANNY', id: 2, level: 10 }],
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('CRANNY'), { queryClient });
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(true);
    });

    it('Can\'t build a cranny if one is already in building queue', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey, serverId], [buildingConstructionEventMock]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('CRANNY'), { queryClient });
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(false);
    });

    it('Can build a third cranny even if one is already in building queue, if you have a max level one', () => {
      const queryClient = new QueryClient();
      queryClient.setQueryData<GameEvent[]>([eventsCacheKey, serverId], [buildingConstructionEventMock]);
      queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], [{
        ...villageMock,
        buildingFields: [{ buildingId: 'CRANNY', id: 2, level: 10 }],
      }]);

      const { result } = renderHookWithGameContext(() => useBuildingRequirements('CRANNY'), { queryClient });
      const { hasMetAmountRequirement } = result.current;
      expect(hasMetAmountRequirement).toBe(true);
    });
  });
});
