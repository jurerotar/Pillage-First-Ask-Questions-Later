import { CreateNewServerForm } from 'app/(public)/(create-new-server)/components/create-new-server-form';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Alert } from 'app/components/ui/alert';

const CreateNewServerPage = () => {
  const { t } = useTranslation('public');

  const title = `${t('Create new server')} | Pillage First! (Ask Questions Later)`;

  return (
    <>
      <title>{title}</title>
      <div className="min-h-screen bg-background p-2">
        <div className="max-w-3xl mx-auto">
          <main className="flex flex-col gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink to="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>{t('Create new server')}</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Text as="h1">{t('Create new server')}</Text>
            <Text as="p">
              {t(
                "Creating a new server will generate a game state and store it in your browser's persistent memory. You can safely close the tab or browser at any time, your server will still be there when you return. A link to your new server will appear in the server list on the homepage, and you'll be automatically redirected to it after creation.",
              )}
            </Text>
            <Alert variant="warning">
              Game is still in development, some features are missing.
              <br /> To see the current list of available features, see{' '}
              <a
                rel="noreferrer"
                className="underline text-blue-600"
                target="_blank"
                href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/blob/master/docs/ROADMAP.md"
              >
                roadmap
              </a>{' '}
              or{' '}
              <a
                rel="noopener noreferrer"
                className="text-blue-500 underline"
                target="_blank"
                href="https://discord.gg/Ep7NKVXUZA"
              >
                join our Discord server
              </a>{' '}
              for more information .
            </Alert>
            <CreateNewServerForm />
          </main>
        </div>
      </div>
    </>
  );
};

export default CreateNewServerPage;
