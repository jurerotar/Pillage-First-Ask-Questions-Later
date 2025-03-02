import type { BuildingField } from 'app/interfaces/models/game/village';
import { useParams } from 'react-router';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId, questId } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
    buildingFieldId: buildingFieldId ? (Number(buildingFieldId) as BuildingField['id']) : null,
    reportId,
    questId,
  };
};
