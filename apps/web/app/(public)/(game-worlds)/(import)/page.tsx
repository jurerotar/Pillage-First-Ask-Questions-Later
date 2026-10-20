import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
import { useGameWorldActions } from 'app/(public)/(game-worlds)/hooks/use-game-world-actions';
import { PageMetadata } from 'app/(public)/components/page-metadata';
import { availableServerCacheKey } from 'app/(public)/constants/query-keys';
import { PageContents } from 'app/components/page-contents';
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
import { pushGameWorldImported } from 'app/instrumentation/product-events';
import { invalidateQueries } from 'app/utils/react-query';
import { remoteRequest } from 'app/utils/remote-api';
import { workerFactory } from 'app/utils/workers';

type ImportGameWorldSuccess = Extract<
  ImportGameWorldWorkerResponse,
  { resolved: true }
>;

type WorldDownload = {
  token: string;
  imported?: ImportGameWorldSuccess;
  registered?: boolean;
};

const importDatabase = async (
  databaseBuffer: ArrayBuffer,
): Promise<ImportGameWorldSuccess> => {
  const payload: ImportGameWorldWorkerPayload = { databaseBuffer };
  const result = await workerFactory<
    ImportGameWorldWorkerPayload,
    ImportGameWorldWorkerResponse
  >(ImportGameWorldWorker, payload, [databaseBuffer]);

  if (!result.resolved) {
    throw new Error(result.error || 'Failed to import game world.');
  }

  return result;
};

const ImportGameWorld = () => {
  const { t } = useTranslation('public');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { createGameWorld } = useGameWorldActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchParams] = useSearchParams();
  const worldId = searchParams.get('world-id');

  const downloads = useRef(new Map<string, WorldDownload>());

  const {
    mutateAsync: importGameWorld,
    isPending: isImporting,
    error,
  } = useMutation<ImportGameWorldSuccess, Error, File | string>({
    mutationFn: async (source) => {
      if (typeof source !== 'string') {
        return importDatabase(await source.arrayBuffer());
      }

      const download: WorldDownload = downloads.current.get(source) ?? {
        token: crypto.randomUUID(),
      };

      downloads.current.set(source, download);

      if (download.imported) {
        return download.imported;
      }

      const response = await remoteRequest(
        `/api/game-worlds/${encodeURIComponent(source)}/download`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${download.token}` },
        },
      );

      download.imported = await importDatabase(await response.arrayBuffer());

      return download.imported;
    },
    onSuccess: async ({ server }, source, _onMutateResult, context) => {
      const download =
        typeof source === 'string' ? downloads.current.get(source) : undefined;
      if (!download?.registered) {
        await createGameWorld({ server });
        if (download) {
          download.registered = true;
        }
        pushGameWorldImported(server);
      }

      await invalidateQueries(context, [[availableServerCacheKey]]);
      if (typeof source === 'string' && download) {
        try {
          await remoteRequest(
            `/api/game-worlds/${encodeURIComponent(source)}`,
            {
              method: 'DELETE',
              headers: { authorization: `Bearer ${download.token}` },
            },
          );
        } catch {
          throw new Error(
            'Your game world was imported, but its uploaded copy could not be deleted. Retry to finish sharing.',
          );
        }
      }

      await navigate(`/game/${server.slug}/v-1/resources`);
    },
  });

  const title = t('{{title}} | Pillage First!', {
    title: 'Import existing game world',
  });

  return (
    <PageContents>
      <PageMetadata
        title={title}
        description="Import a previously exported Pillage First! game world from any device and continue playing."
        pathname={pathname}
      />
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
          <Text
            as="h1"
            className="text-3xl font-medium leading-tight lg:text-5xl"
          >
            {t('Import existing game world')}
          </Text>
          <Text>
            If you have an existing game state file, you may attempt to import
            it here. If import is successful, you'll be automatically redirected
            to the game world.
          </Text>
          {error && <Alert variant="error">{error.toString()}</Alert>}
          {worldId !== null && (
            <div className="flex flex-col gap-2">
              <Text
                as="h2"
                className="text-xl font-semibold"
              >
                Import shared game world
              </Text>
              <Text>
                Download this world onto this device and continue playing. After
                a successful import, the uploaded copy will be deleted and this
                link will no longer work.
              </Text>
              <Button
                disabled={isImporting || !worldId}
                onClick={() => {
                  void importGameWorld(worldId).catch(() => {});
                }}
              >
                {isImporting
                  ? 'Importing...'
                  : downloads.current.get(worldId)?.registered
                    ? 'Finish sharing'
                    : 'Download and import game world'}
              </Button>
            </div>
          )}
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
                    await importGameWorld(file).catch(() => {});
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
    </PageContents>
  );
};

export default ImportGameWorld;
