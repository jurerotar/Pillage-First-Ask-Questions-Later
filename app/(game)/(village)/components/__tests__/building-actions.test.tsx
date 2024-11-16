import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { BuildingActions } from 'app/(game)/(village)/components/building-actions';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';
import { serverPathMock } from 'app/tests/mocks/game/server-mock';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import { renderWithGameContext } from 'app/tests/test-utils.js';
import { describe, expect, test } from 'vitest';
import { villagesCacheKey } from 'app/query-keys';

const level1MainBuildingBuildingField: BuildingField = {
  buildingId: 'MAIN_BUILDING',
  id: 38,
  level: 1,
};

const level10MainBuildingBuildingField: BuildingField = {
  buildingId: 'MAIN_BUILDING',
  id: 38,
  level: 10,
};

const level1CrannyBuildingField: BuildingField = {
  buildingId: 'MAIN_BUILDING',
  id: 37,
  level: 1,
};

const level10CrannyBuildingField: BuildingField = {
  buildingId: 'MAIN_BUILDING',
  id: 37,
  level: 10,
};

const noResources: Resources = {
  wood: 0,
  clay: 0,
  iron: 0,
  wheat: 0,
};

describe('BuildingActions', () => {
  describe('Main building level 1 on building field with cranny already built', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level1MainBuildingBuildingField, level1CrannyBuildingField];

    const villageMockWithLevel1MainBuilding: Village = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel1MainBuilding]);

    test('Upgrade button should be rendered and enabled', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).not.toBeDisabled();
    });

    test('Max level cranny should not have upgrade button rendered', () => {
      const queryClient = new QueryClient();

      const buildingFields: BuildingField[] = [level1MainBuildingBuildingField, level10CrannyBuildingField];

      const villageMockWithLevel1MainBuilding: Village = {
        ...villageMock,
        buildingFields,
      };

      queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel1MainBuilding]);

      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.queryByTestId('building-actions-upgrade-building-button');

      expect(upgradeButton).not.toBeInTheDocument();
    });

    test('Upgrade button should be rendered and enabled', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).not.toBeDisabled();
    });

    test('Downgrade and demolish buttons should not be rendered', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const downgradeButton = screen.queryByTestId('building-actions-downgrade-building-button');
      const demolishButton = screen.queryByTestId('building-actions-demolish-building-button');

      expect(downgradeButton).not.toBeInTheDocument();
      expect(demolishButton).not.toBeInTheDocument();
    });

    test('Construct button should not be rendered', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.queryByTestId('building-actions-construct-building-button');

      expect(upgradeButton).not.toBeInTheDocument();
    });
  });

  describe('Main building level 10 on building field with cranny already built', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField, level1CrannyBuildingField];

    const villageMockWithLevel10MainBuilding: Village = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel10MainBuilding]);

    test('Downgrade should not be rendered if building is level 1', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const downgradeButton = screen.queryByTestId('building-actions-downgrade-building-button');

      expect(downgradeButton).not.toBeInTheDocument();
    });

    test('Demolish button should be rendered', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const demolishButton = screen.getByTestId('building-actions-demolish-building-button');

      expect(demolishButton).toBeInTheDocument();
    });
  });

  describe('Different building field', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField];

    const villageMockWithLevel10MainBuilding: Village = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel10MainBuilding]);

    test('Only construct button should be rendered', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/36` });
      const upgradeButton = screen.queryByTestId('building-actions-upgrade-building-button');
      const downgradeButton = screen.queryByTestId('building-actions-downgrade-building-button');
      const constructButton = screen.getByTestId('building-actions-construct-building-button');
      const demolishButton = screen.queryByTestId('building-actions-demolish-building-button');

      expect(upgradeButton).not.toBeInTheDocument();
      expect(downgradeButton).not.toBeInTheDocument();
      expect(demolishButton).not.toBeInTheDocument();
      expect(constructButton).toBeInTheDocument();
    });
  });

  test('Construct button should be disabled with insufficient resources', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField];

    const villageMockWithLevel10MainBuilding: Village = {
      ...villageMock,
      buildingFields,
      resources: noResources,
    };
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel10MainBuilding]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/36` });
    const constructButton = screen.getByTestId('building-actions-construct-building-button');

    expect(constructButton).toBeInTheDocument();
    expect(constructButton).toBeDisabled();
  });

  test('Upgrade button should be disabled with insufficient resources', () => {
    const queryClient = new QueryClient();
    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField, level1CrannyBuildingField];

    const villageMockWithLevel10MainBuilding: Village = {
      ...villageMock,
      buildingFields,
      resources: noResources,
    };

    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithLevel10MainBuilding]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
    const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toBeDisabled();
  });
});
