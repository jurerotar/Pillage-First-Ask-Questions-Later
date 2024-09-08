import { getBuildingData } from 'app/[game]/utils/building';
import { type GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { villageMock } from 'mocks/game/village/village-mock';

const cranny = getBuildingData('CRANNY');
const clayPit = getBuildingData('CLAY_PIT');
const mainBuilding = getBuildingData('MAIN_BUILDING');

export const buildingConstructionEventMock: GameEvent<GameEventType.BUILDING_CONSTRUCTION> = {
  id: 'id',
  type: GameEventType.BUILDING_CONSTRUCTION,
  resolvesAt: 0,
  villageId: villageMock.id,
  building: cranny,
  buildingFieldId: 38,
  resourceCost: cranny.buildingCost[0],
  level: 0,
};

export const clayPitUpgradeLevel1EventMock: GameEvent<GameEventType.BUILDING_LEVEL_CHANGE> = {
  id: 'id',
  type: GameEventType.BUILDING_LEVEL_CHANGE,
  resolvesAt: clayPit.buildingDuration[0],
  villageId: villageMock.id,
  building: clayPit,
  buildingFieldId: 5,
  resourceCost: clayPit.buildingCost[1],
  level: 1,
};

export const clayPitUpgradeLevel2EventMock: GameEvent<GameEventType.BUILDING_LEVEL_CHANGE> = {
  id: 'id',
  type: GameEventType.BUILDING_LEVEL_CHANGE,
  resolvesAt: clayPit.buildingDuration[1],
  villageId: villageMock.id,
  building: clayPit,
  buildingFieldId: 5,
  resourceCost: clayPit.buildingCost[2],
  level: 2,
};

export const mainBuildingUpgradeLevel1EventMock: GameEvent<GameEventType.BUILDING_LEVEL_CHANGE> = {
  id: 'id',
  type: GameEventType.BUILDING_LEVEL_CHANGE,
  resolvesAt: mainBuilding.buildingDuration[0],
  villageId: villageMock.id,
  building: mainBuilding,
  buildingFieldId: 38,
  resourceCost: mainBuilding.buildingCost[2],
  level: 1,
};

export const mainBuildingUpgradeLevel2EventMock: GameEvent<GameEventType.BUILDING_LEVEL_CHANGE> = {
  id: 'id',
  type: GameEventType.BUILDING_LEVEL_CHANGE,
  resolvesAt: mainBuilding.buildingDuration[1],
  villageId: villageMock.id,
  building: mainBuilding,
  buildingFieldId: 38,
  resourceCost: mainBuilding.buildingCost[2],
  level: 2,
};
