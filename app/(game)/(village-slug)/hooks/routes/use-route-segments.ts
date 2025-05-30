import type { BuildingField } from 'app/interfaces/models/game/village';
import { useParams } from 'react-router';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
    buildingFieldId: buildingFieldId ? (Number.parseInt(buildingFieldId) as BuildingField['id']) : null,
    reportId,
  };
};
