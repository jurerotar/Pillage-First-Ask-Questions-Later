import { useParams } from 'react-router';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId } = useParams();

  return {
    serverSlug: serverSlug!,
    villageSlug: villageSlug!,
    buildingFieldId: buildingFieldId
      ? Number.parseInt(buildingFieldId, 10)
      : null,
    reportId,
  };
};
