import { CreateNewGameWorldForm } from 'app/(public)/(create-new-game-world)/components/create-new-game-world-form';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Alert } from 'app/components/ui/alert';

const CreateNewGameWorldPage = () => {
  const title = 'Create new game world | Pillage First! (Ask Questions Later)';

  return (
    <>
      <title>{title}</title>
      <main className="flex flex-col gap-4 max-w-3xl px-2 lg:px-0 mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Create new game world</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Text as="h1">Create new game world</Text>
        <Text>
          Creating a new game world will generate a game state and store it in
          your browser's persistent memory. You can safely close the tab or
          browser at any time, your server will still be there when you return.
          A link to your new server will appear in the server list on the
          homepage, and you'll be automatically redirected to it after creation.
        </Text>
        <Alert variant="error">
          The game is still in development, game worlds may become incompatible
          between updates. This means worlds will sometimes need to be{' '}
          <b>deleted and recreated</b>. Please use the app for testing purposes
          only until the full release.
        </Alert>
        <CreateNewGameWorldForm />
      </main>
    </>
  );
};

export default CreateNewGameWorldPage;
