const DEFAULT_LOCK_RETRY_ATTEMPTS = 5;
const DEFAULT_LOCK_RETRY_DELAY_MS = 250;

type RetryWhenFileSystemLockedOptions = {
  attempts?: number;
  delayMs?: number;
};

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });

export const isFileSystemLockError = (error: unknown): boolean => {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'NoModificationAllowedError';
  }

  if (error instanceof Error) {
    return (
      error.name === 'NoModificationAllowedError' ||
      error.message.includes('NoModificationAllowedError') ||
      error.message.includes('createSyncAccessHandle')
    );
  }

  return false;
};

export const retryWhenFileSystemLocked = async <T>(
  operation: () => Promise<T>,
  options: RetryWhenFileSystemLockedOptions = {},
): Promise<T> => {
  const attempts = options.attempts ?? DEFAULT_LOCK_RETRY_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_LOCK_RETRY_DELAY_MS;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const isFinalAttempt = attempt === attempts;

      if (!isFileSystemLockError(error) || isFinalAttempt) {
        throw error;
      }

      await sleep(delayMs);
    }
  }

  throw new Error('Unexpected retry state while waiting for lock release.');
};
