import type { Route } from '@react-router/types/app/(public)/(game-worlds)/(index)/+types/page';
import {
  getGameWorldListing,
  removeUnlistedGameWorldDirectories,
} from 'app/(public)/(game-worlds)/utils/game-world-listing';

export const removeUnlistedGameWorldDirectoriesMiddleware: Route.ClientMiddlewareFunction =
  async () => {
    const gameWorldListing = getGameWorldListing();

    await removeUnlistedGameWorldDirectories(gameWorldListing);
  };
