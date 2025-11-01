import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/(...building-field-id)/+types/page';
import { redirect } from 'react-router';

export const buildingFieldIdIsInRangeMiddleware: Route.ClientMiddlewareFunction =
  ({ params }) => {
    const { buildingFieldId: buildingFieldIdParam } = params;

    const buildingFieldId = Number.parseInt(buildingFieldIdParam, 10);

    // Redirect to 404 if user attempts to open a non-existent building-field-id
    if (buildingFieldId < 1 || buildingFieldId > 40) {
      throw redirect('/');
    }
  };
