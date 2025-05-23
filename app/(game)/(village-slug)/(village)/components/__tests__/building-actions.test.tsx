import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { BuildingActions } from 'app/(game)/(village-slug)/(village)/components/building-actions';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { BuildingField, PlayerVillage } from 'app/interfaces/models/game/village';
import { serverPathMock } from 'app/tests/mocks/game/server-mock';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import { renderWithGameContext } from 'app/tests/test-utils';
import { describe, expect, test } from 'vitest';
import { effectsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { Effect } from 'app/interfaces/models/game/effect';
import { wheatProduction100EffectMock } from 'app/tests/mocks/game/effect-mock';

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

    const villageMockWithLevel1MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel1MainBuilding]);

    test('Upgrade button should be rendered and enabled', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

      expect(upgradeButton).toBeInTheDocument();
      expect(upgradeButton).not.toBeDisabled();
    });

    test('Construct button should not be rendered', () => {
      renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
      const upgradeButton = screen.queryByTestId('building-actions-construct-building-button');

      expect(upgradeButton).not.toBeInTheDocument();
    });
  });

  describe('Different building field', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField];

    const villageMockWithLevel10MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel10MainBuilding]);

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

    const villageMockWithLevel10MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
      resources: noResources,
    };
    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel10MainBuilding]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/36` });
    const constructButton = screen.getByTestId('building-actions-construct-building-button');

    expect(constructButton).toBeInTheDocument();
    expect(constructButton).toBeDisabled();
  });

  test('Upgrade button should be disabled with insufficient resources', () => {
    const queryClient = new QueryClient();
    const buildingFields: BuildingField[] = [level10MainBuildingBuildingField, level1CrannyBuildingField];

    const villageMockWithLevel10MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
      resources: noResources,
    };

    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel10MainBuilding]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
    const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).toBeDisabled();
  });

  test('Upgrade button should be rendered and enabled only if we have enough wheat production', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level1MainBuildingBuildingField, level1CrannyBuildingField];

    const villageMockWithLevel1MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
    };
    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel1MainBuilding]);
    queryClient.setQueryData<Effect[]>([effectsCacheKey], [wheatProduction100EffectMock]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
    const upgradeButton = screen.getByTestId('building-actions-upgrade-building-button');

    expect(upgradeButton).toBeInTheDocument();
    expect(upgradeButton).not.toBeDisabled();
  });

  test('Max level cranny should not have upgrade button rendered', () => {
    const queryClient = new QueryClient();

    const buildingFields: BuildingField[] = [level1MainBuildingBuildingField, level10CrannyBuildingField];

    const villageMockWithLevel1MainBuilding: PlayerVillage = {
      ...villageMock,
      buildingFields,
    };

    queryClient.setQueryData<PlayerVillage[]>([playerVillagesCacheKey], [villageMockWithLevel1MainBuilding]);

    renderWithGameContext(<BuildingActions buildingId="CRANNY" />, { queryClient, path: `${serverPathMock}/v-1/village/37` });
    const upgradeButton = screen.queryByTestId('building-actions-upgrade-building-button');

    expect(upgradeButton).not.toBeInTheDocument();
  });
});
