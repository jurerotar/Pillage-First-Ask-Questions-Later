import { redirectToStatisticsMiddleware } from 'app/(game)/(village-slug)/(players)/middleware/redirect-to-statistics-middleware';

export const clientMiddleware = [redirectToStatisticsMiddleware];

const PlayersPage = () => {
  return null;
};

export default PlayersPage;
