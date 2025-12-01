import type { RouteConfigEntry } from '@react-router/dev/routes';
import routes from '../routes';

export const extractPathsFromRoutes = (
  routeEntries: RouteConfigEntry[],
  parentPath = '',
): string[] => {
  const paths: string[] = [];

  for (const entry of routeEntries) {
    let currentPath = parentPath;

    if (entry.path) {
      currentPath = currentPath ? `${currentPath}/${entry.path}` : entry.path;
    }

    // If this entry has a file and is not just a layout (has path or is index), add the path
    if (entry.file && (entry.path || entry.index)) {
      paths.push(`/${currentPath}`);
    }

    if (entry.children) {
      paths.push(...extractPathsFromRoutes(entry.children, currentPath));
    }
  }

  return paths;
};

export const getGameRoutePaths = (): string[] => {
  const allPaths = extractPathsFromRoutes(routes);
  const gamePaths: string[] = [];

  for (const path of allPaths) {
    if (!path.startsWith('/game/')) {
      continue;
    }

    const normalizedPath = path.replace(/:([^/]+)/g, '$1');

    gamePaths.push(normalizedPath);
  }

  return gamePaths;
};
