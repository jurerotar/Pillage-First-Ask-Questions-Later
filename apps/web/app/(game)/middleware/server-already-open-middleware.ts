import { redirect } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/+types/layout';
import { isGameWorldLocked } from 'app/utils/middleware';

// Check whether server even exists && whether server is already opened in another tab
export const serverExistAndLockMiddleware: Route.ClientMiddlewareFunction =
  async ({ context, params }) => {
    const { serverSlug } = params;

    const isLocked = await isGameWorldLocked(context, serverSlug);

    if (isLocked) {
      throw redirect(`/game/${serverSlug}/not-allowed`);
    }
  };
