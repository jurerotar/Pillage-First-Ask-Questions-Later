import type { BuildingField } from 'app/interfaces/models/game/village';
import { useParams } from 'react-router';
import { useMemo } from 'react';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId, questId } = useParams();

  return useMemo(() => {
    return {
      serverSlug: serverSlug as string,
      villageSlug: villageSlug as string,
      buildingFieldId: buildingFieldId ? (Number.parseInt(buildingFieldId) as BuildingField['id']) : null,
      reportId,
      questId,
    };
  }, [serverSlug, villageSlug, buildingFieldId, reportId, questId]);
};
