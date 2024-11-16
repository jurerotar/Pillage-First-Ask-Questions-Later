import { QueryClient } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { BuildingOverview } from 'app/(game)/(village)/components/building-overview';
import type { Village } from 'app/interfaces/models/game/village';
import { serverPathMock } from 'app/tests/mocks/game/server-mock';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import { renderWithGameContext } from 'app/tests/test-utils.js';
import { describe, expect, test } from 'vitest';
import { villagesCacheKey } from 'app/query-keys';

describe('BuildingOverview', () => {
  describe('Main building level 1', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMock]);

    test('Title section should always be rendered with title, description and image', async () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { path: `${serverPathMock}/v-1/village/38` });

      const titleSection = await screen.findByTestId('building-overview-title-section');
      expect(titleSection, 'Title section is missing').toBeInTheDocument();

      const title = await screen.findByTestId('building-overview-building-title');
      expect(title, 'Title is missing').toBeInTheDocument();
      expect(title, 'Title has incorrect text').toHaveTextContent('BUILDINGS.MAIN_BUILDING.NAME');

      const description = await screen.findByTestId('building-overview-building-description');
      expect(description, 'Description is missing').toBeInTheDocument();
      expect(description, 'Description has incorrect text').toHaveTextContent('BUILDINGS.MAIN_BUILDING.DESCRIPTION');

      const image = await screen.findByTestId('building-overview-building-image');
      expect(image, 'Image is missing').toBeInTheDocument();
    });

    test('Title section should not render max-level span when building is not max level', () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { path: `${serverPathMock}/v-1/village/38` });

      const maxLevelText = screen.queryByTestId('building-overview-max-level');
      expect(maxLevelText).not.toBeInTheDocument();
    });

    test('Title section should render count and level when correct props are passed', async () => {
      renderWithGameContext(
        <BuildingOverview
          titleCount={1}
          showLevel
          buildingId="MAIN_BUILDING"
        />,
        {
          path: `${serverPathMock}/v-1/village/38`,
        },
      );

      const count = await screen.findByTestId('building-overview-building-count');
      expect(count, 'Title count is missing').toBeInTheDocument();
      expect(count, 'Title count has incorrect text').toHaveTextContent('2.');

      const level = await screen.findByTestId('building-overview-building-level');
      expect(level, 'Level is missing').toBeInTheDocument();
      expect(level, 'Level has incorrect text').toHaveTextContent('GENERAL.LEVEL');
    });

    test('Benefits section should always be rendered', async () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { path: `${serverPathMock}/v-1/village/38` });

      const benefitsSection = await screen.findByTestId('building-overview-benefits-section');
      expect(benefitsSection).toBeInTheDocument();
    });

    test('Costs section should be rendered when building is not max level', async () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { path: `${serverPathMock}/v-1/village/38` });

      const costsSection = await screen.findByTestId('building-overview-costs-section');
      expect(costsSection).toBeInTheDocument();
    });
  });

  describe('Main building max level', () => {
    const queryClient = new QueryClient();
    const villageMockWithMaxLevelMainBuilding: Village = {
      ...villageMock,
      buildingFields: [{ buildingId: 'MAIN_BUILDING', level: 20, id: 38 }],
    };
    queryClient.setQueryData<Village[]>([villagesCacheKey], [villageMockWithMaxLevelMainBuilding]);

    test('Title section should render max-level span when building is max level', async () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { queryClient, path: `${serverPathMock}/v-1/village/38` });

      const maxLevelText = await screen.findByTestId('building-overview-max-level');
      expect(maxLevelText).toBeInTheDocument();
    });

    test('Benefits section should always be rendered', async () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { queryClient, path: `${serverPathMock}/v-1/village/38` });

      const benefitsSection = await screen.findByTestId('building-overview-benefits-section');
      expect(benefitsSection).toBeInTheDocument();
    });

    test('Costs section should not be rendered when building is max level', () => {
      renderWithGameContext(<BuildingOverview buildingId="MAIN_BUILDING" />, { queryClient, path: `${serverPathMock}/v-1/village/38` });

      const costsSection = screen.queryByTestId('building-overview-costs-section');
      expect(costsSection).not.toBeInTheDocument();
    });
  });
});
