import {
  calculateCulturePointsProductionFromBuildingFields,
  calculatePopulationFromBuildingFields,
  calculateResourceProductionFromResourceFields
} from 'utils/game/common';
import _buildingData from 'assets/buildings.json';
import { Building } from 'interfaces/models/game/building';
import { newVillageBuildingFieldsMock } from 'mocks/game/village/building-fields-mock';

const buildingData = _buildingData as Building[];

describe('Game util functions', () => {
  test('calculatePopulationFromBuildingFields', () => {
    expect(calculatePopulationFromBuildingFields(newVillageBuildingFieldsMock, buildingData)).toBe(3);
  });

  test('calculateCulturePointsProductionFromBuildingFields', () => {
    expect(calculateCulturePointsProductionFromBuildingFields(newVillageBuildingFieldsMock, buildingData)).toBe(3);
  });

  // test('calculateResourceProductionFromResourceFields', () => {
  //   calculateResourceProductionFromResourceFields
  // });
});
