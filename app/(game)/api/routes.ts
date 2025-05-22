import type { QueryClient } from '@tanstack/react-query';
import type { Tile } from 'app/interfaces/models/game/tile';
import { mapCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

export type Handler<TArgs, TReturn> = (queryClient: QueryClient, args: TArgs) => Promise<TReturn>;

const mapGetHandler: Handler<void, Tile[]> = async (queryClient) => {
  return queryClient.getQueryData<Tile[]>([mapCacheKey])!;
};

export const routes = {
  '/map': {
    GET: mapGetHandler,
  },
} as const;
