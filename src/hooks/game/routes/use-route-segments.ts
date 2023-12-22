import { useParams } from 'react-router-dom';

type UseRouteSegmentsReturn = {
  serverSlug: string;
  villageSlug: string;
};

export const useRouteSegments = (): UseRouteSegmentsReturn => {
  const {
    serverSlug,
    villageSlug,
  } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
  };
};
