import { calculatePopulationFromBuildingFields, calculateResourceProductionFromResourceFields } from 'app/[game]/utils/building';
import { newVillageBuildingFieldsMock } from 'mocks/models/game/village/building-fields-mock';
import { resourceFields00018Mock, resourceFields4446Mock, resourceFields11115Mock } from 'mocks/models/game/village/resource-fields-mock';

describe('Game util functions', () => {
  test('calculatePopulationFromBuildingFields', () => {
    expect(calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock)).toBe(3);
  });

  test('calculateResourceProductionFromResourceFields', () => {
    const village4446Production = calculateResourceProductionFromResourceFields(resourceFields4446Mock);
    expect(village4446Production).toMatchObject({ clayProduction: 12, ironProduction: 12, wheatProduction: 18, woodProduction: 12 });

    const village11115Production = calculateResourceProductionFromResourceFields(resourceFields11115Mock);
    expect(village11115Production).toMatchObject({ clayProduction: 3, ironProduction: 3, wheatProduction: 45, woodProduction: 3 });

    const village00018Production = calculateResourceProductionFromResourceFields(resourceFields00018Mock);
    expect(village00018Production).toMatchObject({ clayProduction: 0, ironProduction: 0, wheatProduction: 54, woodProduction: 0 });
  });
});
