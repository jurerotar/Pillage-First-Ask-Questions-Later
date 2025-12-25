import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { gameWorldNotLockedMiddleware } from 'app/(game)/(not-allowed)/middleware/game-world-not-locked-middleware';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

export const clientMiddleware = [gameWorldNotLockedMiddleware];

const GameWorldEntryNotAllowedPage = () => {
  const { t } = useTranslation();
  const { serverSlug } = useRouteSegments();

  return (
    <main className="container mx-auto max-w-2xl p-4 flex flex-col gap-4">
      <div
        role="alert"
        aria-live="assertive"
        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-700/30 dark:bg-red-900/10"
      >
        <svg
          className="shrink-0 h-6 w-6 text-red-800"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.335-.213 2.99-1.742 2.99H3.48c-1.529 0-2.492-1.655-1.742-2.99L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 01.993.883L11 6v4a1 1 0 01-1.993.117L9 10V6a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>

        <div className="min-w-0">
          <Text
            as="h1"
            className="text-xl! font-semibold text-red-800 leading-tight"
          >
            {t('Game world is already opened')}
          </Text>

          <Text className="mt-1 text-red-800">
            {t(
              'This game world is already opened in another tab or browser window.',
            )}
          </Text>
        </div>
      </div>

      <Text>
        {t(
          'To prevent data corruption, only a single instance of each game world is allowed to be open at once. Please close the other tab or window, then proceed to refresh the app.',
        )}
      </Text>

      <div className="flex justify-between">
        <div className="flex flex-wrap gap-2">
          <Link to={`/game/${serverSlug}/v-1/resources`}>
            <Button variant="outline">{t('Refresh app')}</Button>
          </Link>

          <Link to="/game-worlds">
            <Button variant="outline">{t('Game worlds')}</Button>
          </Link>
        </div>
        <Link to="/">
          <Button>{t('Return to homepage')}</Button>
        </Link>
      </div>
    </main>
  );
};

export default GameWorldEntryNotAllowedPage;
