import type { Route } from '.react-router/types/app/(game)/(village-slug)/(players)/+types/page';
import { redirect } from 'react-router';

export const redirectToStatisticsMiddleware: Route.ClientMiddlewareFunction = async ({
  params,
}) => {
  const { serverSlug } = params;

  throw redirect(`/game/${serverSlug}/v-1/statistics`);
};
