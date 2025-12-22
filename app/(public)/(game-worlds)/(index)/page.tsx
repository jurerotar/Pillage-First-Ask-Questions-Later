import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import type { Server } from 'app/interfaces/models/game/server';
import { ServerCard } from 'app/(public)/(game-worlds)/(index)/components/server-card';
import { Button } from 'app/components/ui/button';
import { Link } from 'react-router';
import { Alert } from 'app/components/ui/alert';
import { useGameWorldListing } from 'app/(public)/(game-worlds)/(index)/hooks/use-game-world-listing';

const MyGameWorldsPage = () => {
  const { t } = useTranslation('public');
  const { gameWorldListing } = useGameWorldListing();

  const title = t('{{title}} | Pillage First!', { title: 'My game worlds' });

  return (
    <>
      <title>{title}</title>
      <div className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">{t('Home')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Game worlds')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('My game worlds')}</Text>
          <Text>
            Your current game worlds are listed below. To prevent data
            corruptions, each game world may only be opened in a single browser
            window or tab simultaneously.
          </Text>

          <div className="flex flex-col gap-2">
            {gameWorldListing.length > 0 &&
              gameWorldListing.map((server: Server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                />
              ))}
            {gameWorldListing.length === 0 && (
              <Alert variant="info">
                You don't have any existing game worlds. You may create your
                first one by clicking on the link above.
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Text>Want to create a new game world instead?</Text>
            <Link to="/game-worlds/create">
              <Button variant="outline">Create a new game world</Button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
};

export default MyGameWorldsPage;
