import { redirect } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(not-allowed)/+types/page';
import { isGameWorldLocked } from 'app/utils/middleware';

export const gameWorldNotLockedMiddleware: Route.ClientMiddlewareFunction =
  async ({ context, params }) => {
    const { serverSlug } = params;

    const isLocked = await isGameWorldLocked(context, serverSlug);

    if (!isLocked) {
      throw redirect(`/game/${serverSlug}/v-1/resources`);
    }
  };
