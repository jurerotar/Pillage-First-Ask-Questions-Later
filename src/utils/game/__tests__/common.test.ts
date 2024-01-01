import {
  calculateCulturePointsProductionFromBuildingFields,
  calculatePopulationFromBuildingFields,
  calculateResourceProductionFromResourceFields
} from 'utils/game/common';
import { buildings } from 'assets/buildings';
import { newVillageBuildingFieldsMock } from 'mocks/game/village/building-fields-mock';
import { resourceFields00018Mock, resourceFields11115Mock, resourceFields4446Mock } from 'mocks/game/village/resource-fields-mock';

describe('Game util functions', () => {
  test('calculatePopulationFromBuildingFields', () => {
    expect(calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock, buildings)).toBe(3);
  });

  test('calculateCulturePointsProductionFromBuildingFields', () => {
    expect(calculateCulturePointsProductionFromBuildingFields(newVillageBuildingFieldsMock, buildings)).toBe(3);
  });

  test('calculateResourceProductionFromResourceFields', () => {
    const village4446Production = calculateResourceProductionFromResourceFields(resourceFields4446Mock, buildings);
    expect(village4446Production).toMatchObject({ clayProduction: 16, ironProduction: 16, wheatProduction: 24, woodProduction: 16 });

    const village11115Production = calculateResourceProductionFromResourceFields(resourceFields11115Mock, buildings);
    expect(village11115Production).toMatchObject({ clayProduction: 4, ironProduction: 4, wheatProduction: 60, woodProduction: 4 });

    const village00018Production = calculateResourceProductionFromResourceFields(resourceFields00018Mock, buildings);
    expect(village00018Production).toMatchObject({ clayProduction: 0, ironProduction: 0, wheatProduction: 72, woodProduction: 0 });
  });
});
