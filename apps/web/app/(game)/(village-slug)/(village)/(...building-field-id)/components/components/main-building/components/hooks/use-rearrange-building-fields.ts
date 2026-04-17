import { useMutation } from '@tanstack/react-query';
import { use } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { currentVillageCacheKey } from 'app/(game)/constants/query-keys';
import { ApiContext } from 'app/(game)/providers/api-provider';
import { invalidateQueries } from 'app/utils/react-query';

type RearrangeBuildingField = {
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'] | null;
};

const swappableBuildingFieldIds = new Set(
  Array.from({ length: 20 }, (_, index) => index + 19),
);

export const useRearrangeBuildingFields = () => {
  const { fetcher } = use(ApiContext);
  const { currentVillage } = useCurrentVillage();

  const { mutate: rearrangeBuildingFields } = useMutation({
    mutationFn: async (buildingFields: RearrangeBuildingField[]) => {
      const normalizedBuildingFields = buildingFields
        .filter((buildingField) =>
          swappableBuildingFieldIds.has(buildingField.buildingFieldId),
        )
        .map((buildingField) => ({
          buildingFieldId: buildingField.buildingFieldId,
          buildingId: buildingField.buildingId,
        }));

      await fetcher(`/villages/${currentVillage.id}/building-fields`, {
        method: 'PATCH',
        body: normalizedBuildingFields,
      });
    },
    onSuccess: async (_data, _vars, _onMutateResult, context) => {
      await invalidateQueries(context, [[currentVillageCacheKey]]);
    },
  });

  return {
    rearrangeBuildingFields,
  };
};
