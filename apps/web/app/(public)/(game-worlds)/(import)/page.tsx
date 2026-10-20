import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import type {
  ImportGameWorldWorkerPayload,
  ImportGameWorldWorkerResponse,
} from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker';
import ImportGameWorldWorker from 'app/(public)/(game-worlds)/(import)/workers/import-game-world-worker?worker&url';
import { GameWorldTransferProgress } from 'app/(public)/(game-worlds)/components/transfer-progress';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { pushGameWorldImported } from 'app/instrumentation/product-events';
import { invalidateQueries } from 'app/utils/react-query';
import {
  downloadSharedWorld,
  remoteRequest,
  type TransferProgress,
} from 'app/utils/remote-api';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = searchParams.get('world-id');

  const downloads = useRef(new Map<string, WorldDownload>());
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [importStage, setImportStage] = useState<
    'downloading' | 'importing' | 'finishing'
  >('downloading');

  const {
    mutate: startImport,
    mutateAsync: importGameWorld,
    isPending: isImporting,
    error,
    variables: importSource,
    reset: resetImport,
  } = useMutation<ImportGameWorldSuccess, Error, File | string>({
    mutationFn: async (source) => {
      if (typeof source !== 'string') {
        return importDatabase(await source.arrayBuffer());
      }

      setProgress(null);
      setImportStage('downloading');

      const download: WorldDownload = downloads.current.get(source) ?? {
        token: crypto.randomUUID(),
      };

      downloads.current.set(source, download);

      if (download.imported) {
        setImportStage('finishing');

        return download.imported;
      }

      const buffer = await downloadSharedWorld(
        source,
        download.token,
        setProgress,
      );

      setImportStage('importing');
      setProgress(null);

      download.imported = await importDatabase(buffer);

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
        setImportStage('finishing');

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

  const remoteImportError = typeof importSource === 'string' ? error : null;
  const localImportError = typeof importSource !== 'string' ? error : null;

  const closeRemoteImport = () => {
    if (isImporting) {
      return;
    }

    resetImport();
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params);

        updated.delete('world-id');

        return updated;
      },
      { replace: true },
    );
  };

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
          {localImportError && (
            <Alert variant="error">{localImportError.message}</Alert>
          )}
          <Dialog
            open={worldId !== null}
            onOpenChange={(open) => !open && closeRemoteImport()}
          >
            <DialogContent
              closeDisabled={isImporting}
              onInteractOutside={(event) => {
                if (isImporting) {
                  event.preventDefault();
                }
              }}
              onEscapeKeyDown={(event) => {
                if (isImporting) {
                  event.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Import shared game world</DialogTitle>
                <DialogDescription>
                  Download this world onto this device and continue playing.
                  After a successful import, the uploaded copy will be deleted
                  and this link will no longer work.
                </DialogDescription>
              </DialogHeader>
              {remoteImportError && (
                <Alert variant="error">{remoteImportError.message}</Alert>
              )}
              {isImporting && typeof importSource === 'string' && (
                <GameWorldTransferProgress
                  label={
                    importStage === 'downloading'
                      ? 'Downloading game world...'
                      : importStage === 'importing'
                        ? 'Importing game world...'
                        : 'Finishing import...'
                  }
                  progress={progress}
                />
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={isImporting}
                  onClick={closeRemoteImport}
                >
                  Cancel
                </Button>
                <Button
                  disabled={isImporting || !worldId}
                  onClick={() => {
                    if (worldId) {
                      startImport(worldId);
                    }
                  }}
                >
                  {isImporting
                    ? 'Importing...'
                    : worldId && downloads.current.get(worldId)?.registered
                      ? 'Finish sharing'
                      : 'Download and import game world'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
