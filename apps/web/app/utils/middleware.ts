import type { RouterContextProvider } from 'react-router';

export const isGameWorldLocked = async (
  context: Readonly<RouterContextProvider>,
  serverSlug: string,
): Promise<boolean> => {
  const { sessionContext } = await import('app/context/session');

  const { sessionId } = context.get(sessionContext);

  const lockManager = await window.navigator.locks.query();

  const lock = lockManager.held!.find((lock) =>
    lock?.name?.startsWith(serverSlug),
  );

  if (!lock) {
    return false;
  }

  const [, lockSessionId] = lock.name!.split(':');

  if (!lockSessionId || lockSessionId === sessionId) {
    return false;
  }

  return true;
};

export const doesGameWorldExist = async (
  serverSlug: string,
): Promise<boolean> => {
  const root = await navigator.storage.getDirectory();
  const rootHandle = await root.getDirectoryHandle(
    'pillage-first-ask-questions-later',
    {
      create: true,
    },
  );

  try {
    await rootHandle.getFileHandle(`${serverSlug}.json`);
    return true;
  } catch {
    return false;
  }
};
