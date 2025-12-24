import type { Route } from '.react-router/types/app/(game)/(village-slug)/(statistics)/+types/page';

export async function getFromQueryParam(args: Route.ClientLoaderArgs) {
  try {
    const url = new URL(args.request.url);
    const from = url.searchParams.get('from');
    return { from };
  } catch (e) {
    console.error('Error:', e);
    return null;
  }
}
