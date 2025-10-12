import { redirect } from 'react-router';
import type { Route } from '.react-router/types/app/(game)/+types/layout';

// Check whether server even exists && whether server is already opened in another tab
export const serverExistAndLockMiddleware: Route.ClientMiddlewareFunction =
  async ({ context, params }) => {
    const { sessionContext } = await import('app/context/session');

    const { serverSlug } = params;

    const { sessionId } = context.get(sessionContext);

    const lockManager = await window.navigator.locks.query();

    // Check if there exists a lock with server slug. If yes, we check if current sessionId matches.
    // If it doesn't, it means the same server was opened in a different tab
    const lock = lockManager.held!.find((lock) =>
      lock?.name?.startsWith(serverSlug!),
    );

    if (lock) {
      const [, lockSessionId] = lock.name!.split(':');

      if (lockSessionId !== sessionId) {
        throw redirect('/error/403');
      }
    }

    // const root = await navigator.storage.getDirectory();
    // const rootHandle = await root.getDirectoryHandle(
    //   'pillage-first-ask-questions-later',
    //   {
    //     create: true,
    //   },
    // );

    // try {
    //   await rootHandle.getFileHandle(`${serverSlug}.json`);
    // } catch (_error) {
    //   throw redirect('/error/404');
    // }
  };
