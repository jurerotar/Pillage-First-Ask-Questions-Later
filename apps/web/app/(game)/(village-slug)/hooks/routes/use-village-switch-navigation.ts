import { useQueryClient } from '@tanstack/react-query';
import { use, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';

type BuildingRouteMatch = {
  buildingFieldId: BuildingField['id'];
};

const getBuildingRouteMatch = (pathname: string): BuildingRouteMatch | null => {
  const match = pathname.match(/\/(?:resources|village)\/(\d+)$/);

  if (!match) {
    return null;
  }

  const buildingFieldId = Number.parseInt(match[1], 10);

  if (!Number.isInteger(buildingFieldId)) {
    return null;
  }

  return {
    buildingFieldId,
  };
};

const findMatchingBuildingField = (
  buildingFields: BuildingField[],
  buildingId: Building['id'],
  preferredBuildingFieldId: BuildingField['id'],
): BuildingField | undefined => {
  return (
    buildingFields.find(
      (buildingField) =>
        buildingField.id === preferredBuildingFieldId &&
        buildingField.buildingId === buildingId,
    ) ??
    buildingFields.find(
      (buildingField) => buildingField.buildingId === buildingId,
    )
  );
};

const getBuildingFieldView = (buildingFieldId: BuildingField['id']) => {
  return buildingFieldId <= 18 ? 'resources' : 'village';
};

const isPersistentBuildingField = (buildingFieldId: BuildingField['id']) => {
  return (
    buildingFieldId <= 18 || buildingFieldId === 39 || buildingFieldId === 40
  );
};

export const useVillageSwitchNavigation = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const queryClient = useQueryClient();
  const { apiClient } = use(ApiContext);
  const { getNewVillageUrl, getVillageBasePath } = useGameNavigation();
  const { currentVillage } = useCurrentVillage();

  const navigateToVillage = useCallback(
    async (villageSlug: string) => {
      if (villageSlug === currentVillage.slug) {
        return;
      }

      const buildingRouteMatch = getBuildingRouteMatch(pathname);

      if (!buildingRouteMatch) {
        await navigate(getNewVillageUrl(villageSlug));
        return;
      }

      const targetVillageBasePath = getVillageBasePath(villageSlug);
      const targetView = getBuildingFieldView(
        buildingRouteMatch.buildingFieldId,
      );

      if (isPersistentBuildingField(buildingRouteMatch.buildingFieldId)) {
        await navigate(
          `${targetVillageBasePath}/${targetView}/${buildingRouteMatch.buildingFieldId}${search}`,
        );
        return;
      }

      const currentBuildingField = currentVillage.buildingFields.find(
        (buildingField) =>
          buildingField.id === buildingRouteMatch.buildingFieldId,
      );

      if (!currentBuildingField) {
        await navigate(`${targetVillageBasePath}/village`);
        return;
      }

      const targetVillage = await queryClient.ensureQueryData({
        queryKey: [currentVillageCacheKey, villageSlug],
        queryFn: async () => {
          const { data } = await apiClient.get('/villages/:villageSlug', {
            path: {
              villageSlug,
            },
          });

          return data;
        },
        staleTime: 20_000,
      });
      const targetBuildingField = findMatchingBuildingField(
        targetVillage.buildingFields,
        currentBuildingField.buildingId,
        buildingRouteMatch.buildingFieldId,
      );

      if (!targetBuildingField) {
        await navigate(`${targetVillageBasePath}/village`);
        return;
      }

      const targetBuildingView = getBuildingFieldView(targetBuildingField.id);

      await navigate(
        `${targetVillageBasePath}/${targetBuildingView}/${targetBuildingField.id}${search}`,
      );
    },
    [
      apiClient,
      currentVillage,
      getNewVillageUrl,
      getVillageBasePath,
      navigate,
      pathname,
      queryClient,
      search,
    ],
  );

  return {
    navigateToVillage,
  };
};
