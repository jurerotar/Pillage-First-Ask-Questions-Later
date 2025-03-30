import type { VillageBuildingEffect } from 'app/interfaces/models/game/effect';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';

export const wheatProduction100EffectMock: VillageBuildingEffect = {
  id: 'wheatProduction',
  value: 100,
  scope: 'village',
  source: 'building',
  villageId: villageMock.id,
  buildingFieldId: 1,
};
