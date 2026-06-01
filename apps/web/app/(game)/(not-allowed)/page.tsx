import { useTranslation } from 'react-i18next';
import { Link, Links, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(not-allowed)/+types/page';
import { gameWorldNotLockedMiddleware } from 'app/(game)/(not-allowed)/middleware/game-world-not-locked-middleware';
import { GameErrorContent } from 'app/(game)/components/game-error-content';
import { HeadLinks } from 'app/components/head-links';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  gameWorldNotLockedMiddleware,
];

const GameWorldEntryNotAllowedPage = () => {
  const { t } = useTranslation();

  return (
    <html lang="en">
      <head>
        <HeadLinks />
        <Links />
      </head>
      <body>
        <GameErrorContent
          title={t('Game world is already opened')}
          message={t(
            'This game world is already opened in another tab or browser window.',
          )}
          description={
            <Text>
              {t(
                'To prevent data corruption, only a single instance of each game world is allowed to be open at once.',
              )}
            </Text>
          }
          steps={
            <>
              <li>
                {t('Check for duplicate tabs with the same game world open.')}
              </li>
              <li>{t('Close the other tab or browser window.')}</li>
              <li>{t('Refresh the app.')}</li>
            </>
          }
          actions={
            <>
              <Link
                to="../v-1/resources"
                relative="path"
              >
                <Button variant="outline">{t('Refresh app')}</Button>
              </Link>

              <Link to="/game-worlds">
                <Button variant="outline">{t('Game worlds')}</Button>
              </Link>

              <Link to="/">
                <Button>{t('Return to homepage')}</Button>
              </Link>
            </>
          }
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

export default GameWorldEntryNotAllowedPage;
