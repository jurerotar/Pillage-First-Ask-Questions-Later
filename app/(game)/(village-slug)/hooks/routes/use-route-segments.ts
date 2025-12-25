import { useParams } from 'react-router';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug, buildingFieldId, reportId } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
    buildingFieldId: buildingFieldId
      ? Number.parseInt(buildingFieldId, 10)
      : null,
    reportId,
  };
};
