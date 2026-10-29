import {
  Link,
  Links,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import {
  MissingGameWorldDatabaseError,
  OutdatedAppVersionError,
  OutdatedDatabaseSchemaError,
  serializeError,
} from '@pillage-first/utils/errors';
import { GameErrorContent } from 'app/(game)/components/game-error-content';
import { HeadLinks } from 'app/components/head-links';
import { FaroErrorBoundary } from 'app/instrumentation/faro-client';

export const ErrorBoundary = () => {
  const error = useRouteError() as Error;

  const isDatabaseInitializationError =
    error instanceof OutdatedDatabaseSchemaError;

  const isOutdatedAppVersionError = error instanceof OutdatedAppVersionError;
  const isMissingDatabaseError = error instanceof MissingGameWorldDatabaseError;

  const isMultipleTabsError = error.name === 'NoModificationAllowedError';

  const isUnsupportedRuntimeFunctionError = error.message
    .toLowerCase()
    .includes('is not a function');

  const isErrorWithCustomSteps =
    isMissingDatabaseError ||
    isOutdatedAppVersionError ||
    isDatabaseInitializationError ||
    isMultipleTabsError ||
    isUnsupportedRuntimeFunctionError;

  const { message, name } = error;

  const details = JSON.stringify(serializeError(error), null, 2);

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
                {isMissingDatabaseError && (
                  <p className="text-foreground">
                    The saved world listing is still available, but its database
                    is missing from browser storage.
                  </p>
                )}
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

                {isUnsupportedRuntimeFunctionError && (
                  <p className="text-foreground">
                    This error usually means the game tried to use a feature
                    that your current browser or operating system does not
                    support. Please update your browser and/or operating system
                    before trying again.
                  </p>
                )}
              </>
            }
            steps={
              <>
                {isErrorWithCustomSteps && (
                  <>
                    {isMissingDatabaseError && (
                      <>
                        <li>
                          Close other tabs running this game, then refresh this
                          page.
                        </li>
                        <li>
                          If the world is still missing, import a previously
                          exported backup from the{' '}
                          <Link
                            className="underline"
                            to="/game-worlds/import"
                          >
                            import game world
                          </Link>{' '}
                          page.
                        </li>
                      </>
                    )}
                    {isOutdatedAppVersionError && (
                      <li>
                        Refresh this page to load the latest version of the app
                        and reopen your game world.
                      </li>
                    )}
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
                    {isUnsupportedRuntimeFunctionError && (
                      <>
                        <li>Update your browser to the latest version.</li>
                        <li>
                          If your browser is already up to date or cannot be
                          updated further, update your operating system.
                        </li>
                        <li>Restart the browser, then refresh this page.</li>
                      </>
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
