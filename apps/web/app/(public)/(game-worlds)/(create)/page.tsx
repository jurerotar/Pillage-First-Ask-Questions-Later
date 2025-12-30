import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { CreateNewGameWorldForm } from 'app/(public)/(game-worlds)/(create)/components/create-new-game-world-form';
import { Text } from 'app/components/text';
import { Alert } from 'app/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Button } from 'app/components/ui/button';

const CreateNewGameWorldPage = () => {
  const { t } = useTranslation('public');

  const title = t('{{title}} | Pillage First!', {
    title: 'Create a new game world',
  });

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
            <BreadcrumbItem>
              <BreadcrumbLink to="/game-worlds">
                {t('Game worlds')}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{t('Create')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Create a new game world')}</Text>
          <Text>
            Creating a new game world will generate a game state and store it in
            your browser's persistent memory. You can safely close the tab or
            browser at any time, your server will still be there when you
            return. A link to your new server will appear in the server list on
            the homepage, and you'll be automatically redirected to it after
            creation.
          </Text>
          <Alert variant="error">
            The game is still in development, game worlds may become
            incompatible between updates. This means worlds will sometimes need
            to be <b>deleted and recreated</b>. Please use the app for testing
            purposes only until the full release.
          </Alert>
          <CreateNewGameWorldForm />

          <div className="flex flex-col gap-2">
            <Text>
              Want to continue playing on your current game worlds, or want to
              import an existing game state?
            </Text>
            <div className="flex gap-2">
              <Link to="/game-worlds">
                <Button>My game worlds</Button>
              </Link>
              <Link to="/game-worlds/import">
                <Button variant="outline">Import existing game state</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CreateNewGameWorldPage;
