import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import {
  isSwappableBuildingField,
  type RearrangeBuildingField,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/components/main-building/components/utils/building-field-rearrangement';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import {
  currentVillageCacheKey,
  eventsCacheKey,
} from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-context';
import { invalidateQueries } from 'app/utils/react-query';

export const useRearrangeBuildingFields = () => {
  const { apiClient } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const {
    mutate: rearrangeBuildingFields,
    mutateAsync: rearrangeBuildingFieldsAsync,
    isPending: isRearrangingBuildingFields,
  } = useMutation({
    mutationFn: async (buildingFields: RearrangeBuildingField[]) => {
      const normalizedBuildingFields: RearrangeBuildingField[] = [];

      for (const buildingField of buildingFields) {
        if (isSwappableBuildingField(buildingField.buildingFieldId)) {
          normalizedBuildingFields.push({
            buildingFieldId: buildingField.buildingFieldId,
            buildingId: buildingField.buildingId,
            sourceBuildingFieldId: buildingField.sourceBuildingFieldId,
          });
        }
      }

      await apiClient.patch('/villages/:villageId/building-fields', {
        path: {
          villageId: currentVillage.id,
        },
        body: normalizedBuildingFields,
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [
        [currentVillageCacheKey, currentVillage.slug],
        [eventsCacheKey, 'buildingLevelChange', currentVillage.id],
      ]);
    },
  });

  return {
    rearrangeBuildingFields,
    rearrangeBuildingFieldsAsync,
    isRearrangingBuildingFields,
  };
};
