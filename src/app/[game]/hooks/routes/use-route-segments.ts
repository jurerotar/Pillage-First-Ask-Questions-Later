import { useParams } from 'react-router-dom';

export const useRouteSegments = () => {
  const { serverSlug, villageSlug } = useParams();

  return {
    serverSlug: serverSlug as string,
    villageSlug: villageSlug as string,
  };
};
