import { match } from 'path-to-regexp';
import { apiRoutes } from 'app/(game)/api/api-routes';

export const matchRoute = (path: string, method: string) => {
  for (const route of apiRoutes) {
    if (route.method !== method) {
      continue;
    }

    const matcher = match(route.path, { decode: decodeURIComponent });
    const result = matcher(path);

    if (result) {
      return {
        handler: route.handler,
        params: result.params,
      };
    }
  }

  return null;
};
