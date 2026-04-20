import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { ImportModal } from 'app/(public)/(game-worlds)/(import)/components/import-modal';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
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
import { workerFactory } from 'app/utils/workers';

type ImportGameWorldSuccess = Extract<
  ImportGameWorldWorkerResponse,
  { resolved: true }
>;

const ImportGameWorld = () => {
  const { t } = useTranslation('public');
  const navigate = useNavigate();
  const { createGameWorld } = useGameWorldActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const {
    mutateAsync: importGameWorld,
    isPending: isImporting,
    error,
  } = useMutation<ImportGameWorldSuccess, Error, ArrayBuffer | Blob>({
    mutationFn: async (data) => {
      const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
      const payload: ImportGameWorldWorkerPayload = {
        databaseBuffer: buffer as ArrayBuffer,
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
      createGameWorld({ server });

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
          {error && <Alert variant="error">{error.toString()}</Alert>}
          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="text-xl font-semibold"
            >
              {t('Local file import')}
            </Text>
            <Text>
              {t(
                'This method allows you to import game world files directly from your computer.',
              )}
            </Text>
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
          </div>

          <div className="flex flex-col gap-2">
            <Text
              as="h2"
              className="text-xl font-semibold"
            >
              {t('Import from local devices')}
            </Text>
            <Text>
              {t(
                'Click the button below to see available game worlds from your other devices.',
              )}
            </Text>
            <Alert variant="warning">
              {t(
                "This feature is experimental. In case you can't see your game worlds, refresh the app on both devices.",
              )}
            </Alert>
            <div className="flex flex-col gap-3">
              <Button
                size="fit"
                onClick={() => setIsImportModalOpen(true)}
                disabled={isImporting}
              >
                {t('Scan for devices')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Text>
              {t(
                'Want to create a new game world, or continue with your existing ones instead?',
              )}
            </Text>

            <div className="flex flex-wrap gap-2">
              <Link to="/game-worlds/create">
                <Button>Create new world</Button>
              </Link>
              <Link to="/game-worlds">
                <Button variant="outline">Your game worlds</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
      <ImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={async (buffer) => {
          await importGameWorld(buffer);
        }}
      />
    </>
  );
};

export default ImportGameWorld;
