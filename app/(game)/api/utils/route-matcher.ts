import { compiledApiRoutes } from 'app/(game)/api/routes/api-routes';
import { PLAYER_ID } from 'app/constants/player';

// These params are automatically cast as numbers
const numericParams = new Set([
  'playerId',
  'villageId',
  'tileId',
  'oasisId',
  'page',
]);

export const matchRoute = (url: string, method: string) => {
  for (const route of compiledApiRoutes) {
    if (route.method !== method) {
      continue;
    }

    let path = url;

    if (path.startsWith('/me')) {
      path = path.replace('/me', `/players/${PLAYER_ID}`);
    }

    const result = route.matcher(path) as
      | false
      | { path: string; params: Record<string, string> };

    if (!result) {
      continue;
    }

    const paramsWithCasting: Record<string, string | number> = {
      ...result.params,
    };

    for (const key of Object.keys(result.params)) {
      if (numericParams.has(key)) {
        const value = Number.parseInt(result.params[key], 10);
        if (!Number.isNaN(value)) {
          paramsWithCasting[key] = value;
        }
      }
    }

    return {
      handler: route.handler,
      params: paramsWithCasting,
    };
  }

  throw new Error(`Cannot match route ${method}::${url}`);
};
