import { useLocation } from 'react-router-dom';

export const useGameNavigation = () => {
  const { pathname } = useLocation();

  // Hacky, do it properly
  const [, ...segments] = pathname.split('/').reverse();
  const basePath = segments.reverse().join('/');

  const resourcesPath = `${basePath}/resources`;
  const villagePath = `${basePath}/village`;
  const mapPath = `${basePath}/map`;

  return {
    resourcesPath,
    villagePath,
    mapPath,
  };
};
