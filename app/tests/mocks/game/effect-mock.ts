import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import type { VillageBuildingEffect } from 'app/interfaces/models/game/effect';

const villageId = villageMock.id;

export const woodProductionEffect: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 100,
  id: 'woodProduction',
  buildingFieldId: 1,
  buildingId: 'WOODCUTTER',
};

export const woodProductionBonusEffect: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 1.25,
  id: 'woodProduction',
  buildingFieldId: 30,
  buildingId: 'SAWMILL',
};

export const wheatProductionEffect: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 100,
  id: 'wheatProduction',
  buildingFieldId: 1,
  buildingId: 'WHEAT_FIELD',
};

export const wheatProductionBonusEffect: VillageBuildingEffect = {
  villageId,
  scope: 'village',
  source: 'building',
  value: 1.25,
  id: 'wheatProduction',
  buildingFieldId: 30,
  buildingId: 'GRAIN_MILL',
};
