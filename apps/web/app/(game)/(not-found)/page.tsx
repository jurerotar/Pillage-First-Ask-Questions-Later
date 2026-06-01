import { useTranslation } from 'react-i18next';
import { Link, Links, Scripts, ScrollRestoration } from 'react-router';
import type { Route } from '@react-router/types/app/(game)/(not-found)/+types/page';
import { gameWorldNotExistsMiddleware } from 'app/(game)/(not-found)/middleware/game-world-not-locked-middleware';
import { GameErrorContent } from 'app/(game)/components/game-error-content';
import { HeadLinks } from 'app/components/head-links';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  gameWorldNotExistsMiddleware,
];

const GameWorldNotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <html lang="en">
      <head>
        <HeadLinks />
        <Links />
      </head>
      <body>
        <GameErrorContent
          title={t('Game world not found')}
          message={t('The game world you are trying to open does not exist.')}
          description={
            <Text>
              {t(
                'This game world may have been removed or the address is incorrect.',
              )}
            </Text>
          }
          steps={
            <>
              <li>{t('Check the game worlds list.')}</li>
              <li>{t('Create a new game world if this one was removed.')}</li>
            </>
          }
          actions={
            <>
              <Link to="/game-worlds">
                <Button variant="outline">{t('Game worlds')}</Button>
              </Link>

              <Link to="/game-worlds/create">
                <Button variant="outline">{t('Create new game world')}</Button>
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

export default GameWorldNotFoundPage;
