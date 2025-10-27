import { CreateNewServerForm } from 'app/(public)/(create-new-server)/components/create-new-server-form';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Alert } from 'app/components/ui/alert';
import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

const CreateNewServerPage = () => {
  const title = 'Create new server | Pillage First! (Ask Questions Later)';

  return (
    <>
      <title>{title}</title>
      <link
        rel="modulepreload"
        href={sqliteWasmUrl}
      />
      <div className="min-h-screen bg-background p-2">
        <div className="max-w-3xl mx-auto">
          <main className="flex flex-col gap-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink to="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>Create new server</BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Text as="h1">Create new server</Text>
            <Text>
              Creating a new server will generate a game state and store it in
              your browser's persistent memory. You can safely close the tab or
              browser at any time, your server will still be there when you
              return. A link to your new server will appear in the server list
              on the homepage, and you'll be automatically redirected to it
              after creation.
            </Text>
            <Alert variant="warning">
              Game is still in development, some features are missing.
              <br />
              To get the list of currently available features,{' '}
              <a
                rel="noopener noreferrer"
                className="text-blue-500 underline"
                target="_blank"
                href="https://discord.gg/Ep7NKVXUZA"
              >
                join our Discord server
              </a>{' '}
              .
            </Alert>
            <Alert variant="error">
              Since the game is still in development, game worlds may become
              incompatible between updates. This means worlds will sometimes
              need to be <b>deleted and recreated</b>. Please use the app for
              testing purposes only until the full release.
            </Alert>
            <CreateNewServerForm />
          </main>
        </div>
      </div>
    </>
  );
};

export default CreateNewServerPage;
