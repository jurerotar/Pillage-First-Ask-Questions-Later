import {
  Link,
  Links,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from 'react-router';
import { DatabaseNotFoundError } from '@pillage-first/api/errors';
import { HeadLinks } from 'app/components/head-links.tsx';

export const ErrorBoundary = () => {
  const error = useRouteError() as Error;

  const isDatabaseNotFoundError = error instanceof DatabaseNotFoundError;

  const isErrorWithCustomSteps = isDatabaseNotFoundError;

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
        <main className="container mx-auto max-w-2xl p-4 flex flex-col gap-4">
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-red-900">
            <h1 className="text-lg font-semibold">{name}</h1>
            <p className="mt-1">{message}</p>
          </div>

          <p className="text-sm text-muted-foreground">Try these steps:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            {isErrorWithCustomSteps && (
              <>
                {isDatabaseNotFoundError && (
                  <>
                    <li>
                      If you've opened this game world through a link on{' '}
                      <Link
                        className="underline"
                        to="/game-worlds"
                      >
                        game worlds
                      </Link>{' '}
                      page, please navigate back to that page, delete the game
                      world and create a new one.
                    </li>
                    <li>
                      If you've opened this game world directly with the URL,
                      please navigate to{' '}
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
              </>
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
          </div>

          <details
            open
            className="rounded-md border bg-white p-3 text-sm"
          >
            <summary className="cursor-pointer select-none font-medium">
              Technical details
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">
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
