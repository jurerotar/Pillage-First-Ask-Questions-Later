import { redirect } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(not-allowed)/+types/page';
import { doesGameWorldExist } from 'app/utils/middleware';

export const gameWorldNotExistsMiddleware: Route.ClientMiddlewareFunction =
  async ({ params }) => {
    const { serverSlug } = params;

    const gameWorldExists = await doesGameWorldExist(serverSlug);

    if (gameWorldExists) {
      throw redirect(`/game/${serverSlug}/v-1/resources`);
    }
  };
