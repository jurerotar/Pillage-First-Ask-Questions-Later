import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
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

const ImportGameWorld = () => {
  const { t } = useTranslation('public');
  const navigate = useNavigate();
  const { createGameWorld } = useGameWorldActions();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setError(null);
                fileInputRef.current?.click();
              }}
              disabled={isImporting}
            >
              {isImporting
                ? t('Importing...')
                : t('Select .json file to import')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                setError(null);
                const file = e.target.files?.[0];

                if (!file) {
                  return;
                }

                if (!file.name.endsWith('.json')) {
                  setError('Please select a .json file');

                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }

                  return;
                }

                const inputEl = fileInputRef.current;

                try {
                  setIsImporting(true);
                  const text = await file.text();
                  const payload: ImportGameWorldWorkerPayload = {
                    fileText: text,
                  };

                  const result = await workerFactory<
                    ImportGameWorldWorkerPayload,
                    ImportGameWorldWorkerResponse
                  >(ImportGameWorldWorker, payload);

                  if (!result.resolved) {
                    setError(result.error || 'Failed to import game world.');
                    return;
                  }

                  createGameWorld({ server: result.server });

                  navigate(`/game/${result.serverSlug}/v-1/resources`);
                } catch (err) {
                  console.error(err);
                  setError(
                    'Failed to import game world. Ensure the file is valid.',
                  );
                } finally {
                  setIsImporting(false);
                  if (inputEl) {
                    inputEl.value = '';
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
