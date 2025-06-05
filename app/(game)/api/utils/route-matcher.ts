import { compiledApiRoutes } from 'app/(game)/api/api-routes';

export const matchRoute = (url: string, method: string) => {
  for (const route of compiledApiRoutes) {
    if (route.method !== method) {
      continue;
    }

    let path = url;

    if (path.startsWith('/me')) {
      path = path.replace('/me', '/players/player');
    }

    const result = route.matcher(path);

    if (result) {
      return {
        handler: route.handler,
        params: result.params,
      };
    }
  }

  throw new Error(`Cannot match route ${method}::${url}`);
};
