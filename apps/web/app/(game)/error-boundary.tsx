import { FaroErrorBoundary } from '@grafana/faro-react';
import {
  Link,
  Links,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import { OutdatedDatabaseSchemaError } from '@pillage-first/utils/errors';
import { GameErrorContent } from 'app/(game)/components/game-error-content';
import { HeadLinks } from 'app/components/head-links';

export const ErrorBoundary = () => {
  const error = useRouteError() as Error;

  const isDatabaseInitializationError =
    error instanceof OutdatedDatabaseSchemaError;

  const isMultipleTabsError = error.name === 'NoModificationAllowedError';

  const isErrorWithCustomSteps =
    isDatabaseInitializationError || isMultipleTabsError;

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
    <FaroErrorBoundary>
      <html lang="en">
        <head>
          <HeadLinks />
          <Links />
        </head>
        <body>
          <GameErrorContent
            title={name}
            message={message}
            description={
              <>
                {isDatabaseInitializationError && (
                  <p className="text-foreground">
                    We've recently released a new version of the app that
                    introduced breaking changes in existing game worlds. If
                    you're seeing this error message, your game world is not
                    compatible with latest version of the app.
                  </p>
                )}

                {isMultipleTabsError && (
                  <p className="text-foreground">
                    The database is locked. This can happen when the same game
                    world is open in multiple tabs, or sometimes at random when
                    you attempt to refresh the app and the browser has not
                    released its lock yet.
                  </p>
                )}
              </>
            }
            steps={
              <>
                {isErrorWithCustomSteps && (
                  <>
                    {isDatabaseInitializationError && (
                      <>
                        <li>
                          If you've opened this game world through a link on{' '}
                          <Link
                            className="underline"
                            to="/game-worlds"
                          >
                            game worlds
                          </Link>{' '}
                          page, please navigate back to that page, delete the
                          game world and create a new one.
                        </li>
                        <li>
                          If you've opened this game world directly with the
                          URL, please navigate to{' '}
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
                    {isMultipleTabsError && (
                      <li>
                        Refresh this page. This often resolves the issue when
                        the browser has not released the lock yet.
                      </li>
                    )}
                  </>
                )}
                {!isErrorWithCustomSteps && (
                  <>
                    <li>
                      Refresh this page — transient issues often resolve on
                      reload.
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
              </>
            }
            actions={
              <>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Refresh page
                </button>
                <Link
                  to="/"
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                >
                  Return to homepage
                </Link>
                <button
                  type="button"
                  onClick={copyDetails}
                  className="ml-auto inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                  title="Copy technical details to clipboard"
                >
                  Copy details
                </button>
              </>
            }
            technicalDetails={
              <details
                open
                className="rounded-md border bg-white p-3"
              >
                <summary className="cursor-pointer non-selectable font-medium">
                  Technical details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">
                  {details}
                </pre>
              </details>
            }
          />
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </FaroErrorBoundary>
  );
};
