import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Text } from 'app/components/text';
import { useTranslation } from 'react-i18next';
import { Alert } from 'app/components/ui/alert';
import { Button } from 'app/components/ui/button';
import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { useAvailableServers } from 'app/(public)/hooks/use-available-servers';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import { workerFactory } from 'app/utils/workers';

type ImportGameWorldSuccess = Extract<
  ImportGameWorldWorkerResponse,
  { resolved: true }
>;

const ImportGameWorld = () => {
  const { t } = useTranslation('public');
  const navigate = useNavigate();
  const { addServer } = useAvailableServers();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    mutateAsync: importGameWorld,
    isPending: isImporting,
    error,
  } = useMutation<ImportGameWorldSuccess, Error, File>({
    mutationFn: async (file) => {
      const buffer = await file.arrayBuffer();
      const payload: ImportGameWorldWorkerPayload = {
        databaseBuffer: buffer,
      };

      const result = await workerFactory<
        ImportGameWorldWorkerPayload,
        ImportGameWorldWorkerResponse
      >(ImportGameWorldWorker, payload);

      if (!result.resolved) {
        throw new Error(result.error || 'Failed to import game world.');
      }

      return result;
    },
    onSuccess: async ({ server }) => {
      addServer({ server });

      await navigate(`/game/${server.slug}/v-1/resources`);
    },
  });

  const title = t('{{title}} | Pillage First!', {
    title: 'Import existing game world',
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
            <BreadcrumbItem>{t('Import')}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <main className="flex flex-col gap-4">
          <Text as="h1">{t('Import existing game world')}</Text>
          <Text>
            If you have an existing game state file, you may attempt to import
            it here. If import is successful, you'll be automatically redirected
            to the game world.
          </Text>
          <Alert variant="warning">
            Game world importing functionality is experimental. If you encounter
            issues, please report them in the Discord!
          </Alert>
          {error && <Alert variant="error">{error.toString()}</Alert>}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={isImporting}
            >
              {isImporting
                ? t('Importing...')
                : t('Select .sqlite3 file to import')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite3"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  return;
                }

                if (!file.name.endsWith('.sqlite3')) {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                  return;
                }

                try {
                  await importGameWorld(file);
                } finally {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }
              }}
            />
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

export default ImportGameWorld;
