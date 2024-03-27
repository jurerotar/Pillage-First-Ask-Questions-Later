import { useParams } from 'react-router-dom';
import { BuildingField } from 'interfaces/models/game/village';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
    buildingFieldId: buildingFieldId ? (Number(buildingFieldId) as BuildingField['id']) : null,
    reportId,
  };
};
