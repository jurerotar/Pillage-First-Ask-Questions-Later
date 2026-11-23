import { useMutation, useQuery } from '@tanstack/react-query';
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
  getSharedWorldPreview,
  type TransferProgress,
} from 'app/utils/remote-api';
import { workerFactory } from 'app/utils/workers';

type ImportGameWorldSuccess = Extract<
  ImportGameWorldWorkerResponse,
  { resolved: true }
>;

type WorldDownload = {
  imported?: ImportGameWorldSuccess;
  registered?: boolean;
};

const importDatabase = async (
  databaseBuffer: ArrayBuffer,
): Promise<ImportGameWorldSuccess> => {
  const payload: ImportGameWorldWorkerPayload = { databaseBuffer };
  const result = await workerFactory<ImportGameWorldWorkerResponse>(
    ImportGameWorldWorker,
    payload,
    [databaseBuffer],
  );

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

      const download: WorldDownload = downloads.current.get(source) ?? {};

      downloads.current.set(source, download);

      if (download.imported) {
        setImportStage('finishing');

        return download.imported;
      }

      setProgress(null);
      setImportStage('downloading');

      const buffer = await downloadSharedWorld(source, setProgress);

      setImportStage('importing');
      setProgress({ loaded: buffer.byteLength, total: buffer.byteLength });

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

      if (download) {
        setImportStage('finishing');
      }

      await invalidateQueries(context, [[availableServerCacheKey]]);
      await navigate(`/game/${server.slug}/v-1/resources`);

      if (typeof source === 'string') {
        downloads.current.delete(source);
      }
    },
  });

  const {
    mutate: downloadWorldFile,
    isPending: isDownloadingFile,
    error: downloadError,
    reset: resetDownload,
  } = useMutation<void, Error, { worldId: string; name: string }>({
    mutationFn: async ({ worldId, name }) => {
      setProgress(null);

      const buffer = await downloadSharedWorld(worldId, setProgress);
      const blob = new Blob([buffer], { type: 'application/vnd.sqlite3' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name || worldId}.sqlite3`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });

  const isTransferring = isImporting || isDownloadingFile;

  const worldPreview = useQuery({
    queryKey: ['shared-world-preview', worldId],
    queryFn: async ({ signal }) =>
      await getSharedWorldPreview(worldId!, signal),
    enabled: !!worldId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const remoteError =
    downloadError ??
    (typeof importSource === 'string' ? error : null) ??
    worldPreview.error;
  const localImportError = typeof importSource !== 'string' ? error : null;

  const closeRemoteImport = () => {
    if (isTransferring) {
      return;
    }

    resetImport();
    resetDownload();
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
            onOpenChange={(open, eventDetails) => {
              if (!open && isTransferring) {
                eventDetails.cancel();
                return;
              }

              if (!open) {
                closeRemoteImport();
              }
            }}
          >
            <DialogContent closeDisabled={isTransferring}>
              <DialogHeader>
                <DialogTitle>Import shared game world</DialogTitle>
                <DialogDescription>
                  Import this world to continue playing, or download it as a
                  .sqlite3 file. The link stays available for 24 hours after the
                  upload completes.
                </DialogDescription>
              </DialogHeader>
              {worldPreview.isPending && (
                <p
                  role="status"
                  className="text-sm text-muted-foreground"
                >
                  Loading game world details...
                </p>
              )}
              {worldPreview.data && (
                <div className="grid gap-3 rounded-md border p-3">
                  <p className="font-medium wrap-break-word">
                    {worldPreview.data.name}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Player</dt>
                      <dd className="wrap-break-word">
                        {worldPreview.data.playerName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tribe</dt>
                      <dd className="capitalize">{worldPreview.data.tribe}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Speed</dt>
                      <dd>{worldPreview.data.speed}x</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Map size</dt>
                      <dd>
                        {worldPreview.data.mapSize} ×{' '}
                        {worldPreview.data.mapSize}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Version</dt>
                      <dd>{worldPreview.data.version}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Download size</dt>
                      <dd>
                        {(worldPreview.data.size / 1024 / 1024).toFixed(1)} MiB
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
              {remoteError && (
                <Alert variant="error">{remoteError.message}</Alert>
              )}
              {worldPreview.isError && !isTransferring && (
                <Button
                  className="justify-self-end"
                  variant="outline"
                  size="fit"
                  disabled={worldPreview.isFetching}
                  onClick={() => void worldPreview.refetch()}
                >
                  Retry loading details
                </Button>
              )}
              {(isDownloadingFile ||
                (isImporting && typeof importSource === 'string')) && (
                <GameWorldTransferProgress
                  label={
                    isDownloadingFile || importStage === 'downloading'
                      ? 'Downloading game world...'
                      : importStage === 'importing'
                        ? 'Importing game world...'
                        : 'Finishing import...'
                  }
                  progress={progress}
                  showProgressText={
                    isDownloadingFile || importStage === 'downloading'
                  }
                />
              )}
              {worldId && worldPreview.isSuccess && (
                <DialogFooter className="flex-wrap">
                  <Button
                    variant="outline"
                    className="mr-auto"
                    disabled={isTransferring}
                    onClick={closeRemoteImport}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isTransferring}
                    onClick={() => {
                      resetImport();
                      downloadWorldFile({
                        worldId,
                        name: worldPreview.data.name,
                      });
                    }}
                  >
                    Download file
                  </Button>
                  <Button
                    disabled={isTransferring}
                    onClick={() => {
                      resetDownload();
                      startImport(worldId);
                    }}
                  >
                    {isImporting
                      ? 'Importing...'
                      : downloads.current.get(worldId)?.imported
                        ? 'Finish import'
                        : 'Import game world'}
                  </Button>
                </DialogFooter>
              )}
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
                disabled={isTransferring}
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
