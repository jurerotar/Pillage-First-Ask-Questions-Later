import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Link,
  Links,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import {
  OutdatedDatabaseSchemaError,
  VacationModeEnabledError,
} from '@pillage-first/api/errors';
import ApiWorker from '@pillage-first/api?worker&url';
import { isNotificationMessageEvent } from 'app/(game)/providers/guards/api-notification-event-guards';
import { createWorkerFetcher } from 'app/(game)/providers/utils/worker-fetch';
import { HeadLinks } from 'app/components/head-links.tsx';

const initializeWorker = async (serverSlug: string) => {
  const url = new URL(ApiWorker, import.meta.url);
  url.searchParams.set('server-slug', serverSlug);
  const worker = new Worker(url.toString(), { type: 'module' });

  await new Promise<void>((resolve, reject) => {
    const handleWorkerInitializationMessage = (event: MessageEvent) => {
      if (!isNotificationMessageEvent(event)) {
        return;
      }

      if (event.data.eventKey === 'event:database-initialization-success') {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );
        resolve();
      }

      if (event.data.eventKey === 'event:database-initialization-error') {
        worker.removeEventListener(
          'message',
          handleWorkerInitializationMessage,
        );

        const errorName = (event.data as { error?: { name?: string } }).error
          ?.name;

        if (errorName === 'VacationModeEnabledError') {
          resolve();
          return;
        }

        reject(new OutdatedDatabaseSchemaError());
      }
    };

    worker.addEventListener('message', handleWorkerInitializationMessage);
    worker.postMessage({ type: 'WORKER_INIT' });
  });

  return worker;
};

export const ErrorBoundary = () => {
  const error = useRouteError() as Error;
  const [isDisablingVacationMode, setIsDisablingVacationMode] = useState(false);
  const [vacationErrorMessage, setVacationErrorMessage] = useState<
    string | null
  >(null);

  const queryClient = useQueryClient();

  console.log(queryClient);

  const isDatabaseInitializationError =
    error instanceof OutdatedDatabaseSchemaError;
  const isVacationModeEnabledError = error instanceof VacationModeEnabledError;

  const isErrorWithCustomSteps =
    isDatabaseInitializationError || isVacationModeEnabledError;

  const disableVacationMode = async () => {
    if (!(error instanceof VacationModeEnabledError) || !error.serverSlug) {
      return;
    }

    setVacationErrorMessage(null);
    setIsDisablingVacationMode(true);

    let worker: Worker | null = null;

    try {
      worker = await initializeWorker(error.serverSlug);
      const fetcher = createWorkerFetcher(worker);

      await fetcher('/events/vacation', {
        method: 'DELETE',
      });

      window.location.reload();
    } catch {
      setVacationErrorMessage(
        'Failed to disable vacation mode. Please try again.',
      );
    } finally {
      setIsDisablingVacationMode(false);
      worker?.postMessage({ type: 'WORKER_CLOSE' });
    }
  };

  const { message, name, cause, stack } = error;

  const details = JSON.stringify(
    {
      name,
      message,
      stack,
      cause,
    },
    null,
    2,
  );

  const copyDetails = async () => {
    await navigator.clipboard.writeText(details);
  };

  return (
    <html lang="en">
      <head>
        <HeadLinks />
        <Links />
      </head>
      <body>
        <main className="container mx-auto max-w-2xl p-4 flex flex-col gap-4 text-foreground">
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            <h1 className="text-lg font-semibold">{name}</h1>
            <p className="mt-1">{message}</p>
          </div>

          {isVacationModeEnabledError && (
            <div className="rounded-md border border-border bg-card p-4 flex flex-col gap-3">
              <p>
                This game world is currently paused by vacation mode. Disable it
                to resume gameplay.
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={isDisablingVacationMode}
                  onClick={disableVacationMode}
                  className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disable vacation mode
                </button>
                {vacationErrorMessage && (
                  <span className="text-sm text-destructive">
                    {vacationErrorMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          {isDatabaseInitializationError && (
            <p className="text-foreground">
              We've recently released a new version of the app that introduced
              breaking changes in existing game worlds. If you're seeing this
              error message, your game world is not compatible with latest
              version of the app.
            </p>
          )}

          <p className="text-foreground font-medium">Try these steps:</p>
          <ul className="list-disc pl-6 space-y-1">
            {isErrorWithCustomSteps && isDatabaseInitializationError && (
              <>
                <li>
                  If you've opened this game world through a link on{' '}
                  <Link
                    className="underline"
                    to="/game-worlds"
                  >
                    game worlds
                  </Link>{' '}
                  page, please navigate back to that page, delete the game world
                  and create a new one.
                </li>
                <li>
                  If you've opened this game world directly with the URL, please
                  navigate to{' '}
                  <Link
                    className="underline"
                    to="/game-worlds/create"
                  >
                    create new game world
                  </Link>{' '}
                  page and create a new game world.
                </li>
              </>
            )}
            {isErrorWithCustomSteps && isVacationModeEnabledError && (
              <li>
                Use the <strong>Disable vacation mode</strong> button above to
                resume this game world.
              </li>
            )}
            {!isErrorWithCustomSteps && (
              <>
                <li>
                  Refresh this page — transient issues often resolve on reload.
                </li>
                <li>
                  If the error persists, export your game state from the{' '}
                  <Link
                    className="underline"
                    to="/"
                  >
                    home page
                  </Link>{' '}
                  and report the issue via:{' '}
                  <a
                    className="underline"
                    href="https://discord.gg/Ep7NKVXUZA"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    #bugs on Discord
                  </a>{' '}
                  or{' '}
                  <a
                    className="underline"
                    href="https://github.com/jurerotar/Pillage-First-Ask-Questions-Later/issues/new/choose"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub Issues
                  </a>
                  .
                </li>
              </>
            )}
          </ul>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Refresh page
            </button>
            <Link
              to="/"
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              Return to homepage
            </Link>
            <button
              type="button"
              onClick={copyDetails}
              className="ml-auto inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              title="Copy technical details to clipboard"
            >
              Copy details
            </button>
          </div>

          <details
            open
            className="rounded-md border border-border bg-card p-3"
          >
            <summary className="cursor-pointer select-none font-medium">
              Technical details
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs text-muted-foreground">
              {details}
            </pre>
          </details>
        </main>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};
