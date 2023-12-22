import {
  calculateCulturePointsProductionFromBuildingFields,
  calculatePopulationFromBuildingFields,
  calculateResourceProductionFromResourceFields
} from 'utils/game/common';
import _buildingData from 'assets/buildings.json';
import { Building } from 'interfaces/models/game/building';
import { newVillageBuildingFieldsMock } from 'mocks/game/village/building-fields-mock';
import { resourceFields00018Mock, resourceFields11115Mock, resourceFields4446Mock } from 'mocks/game/village/resource-fields-mock';

const buildingData = _buildingData as Building[];

describe('Game util functions', () => {
  test('calculatePopulationFromBuildingFields', () => {
    expect(calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock, buildingData)).toBe(3);
  });

  test('calculateCulturePointsProductionFromBuildingFields', () => {
    expect(calculateCulturePointsProductionFromBuildingFields(newVillageBuildingFieldsMock, buildingData)).toBe(3);
  });

  test('calculateResourceProductionFromResourceFields', () => {
    const village4446Production = calculateResourceProductionFromResourceFields(resourceFields4446Mock, buildingData);
    expect(village4446Production).toMatchObject({ clayProduction: 16, ironProduction: 16, wheatProduction: 24, woodProduction: 16 });

    const village11115Production = calculateResourceProductionFromResourceFields(resourceFields11115Mock, buildingData);
    expect(village11115Production).toMatchObject({ clayProduction: 4, ironProduction: 4, wheatProduction: 60, woodProduction: 4 });

    const village00018Production = calculateResourceProductionFromResourceFields(resourceFields00018Mock, buildingData);
    expect(village00018Production).toMatchObject({ clayProduction: 0, ironProduction: 0, wheatProduction: 72, woodProduction: 0 });
  });
});
