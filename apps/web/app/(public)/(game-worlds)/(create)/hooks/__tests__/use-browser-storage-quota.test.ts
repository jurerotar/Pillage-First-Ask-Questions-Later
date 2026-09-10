import { afterEach, describe, expect, test, vi } from 'vitest';
import { hasUnavailableBrowserStorage } from '../use-browser-storage-quota';

type MockStorageOptions = {
  quota?: number;
  rejectOpfsWrite?: boolean;
  omitOpfs?: boolean;
};

const stubBrowserStorage = ({
  quota = 1024,
  rejectOpfsWrite = false,
  omitOpfs = false,
}: MockStorageOptions = {}) => {
  const close = vi.fn(async () => {});
  const write = vi.fn(async () => {
    if (rejectOpfsWrite) {
      throw new DOMException(
        'The operation failed for an unknown transient reason (e.g. out of memory).',
        'UnknownError',
      );
    }
  });
  const removeEntry = vi.fn(async () => {});
  const createWritable = vi.fn(async () => ({
    close,
    write,
  }));
  const getFileHandle = vi.fn(async () => ({
    createWritable,
  }));
  const getDirectoryHandle = vi.fn(async () => ({
    getFileHandle,
  }));
  const getDirectory = omitOpfs
    ? undefined
    : vi.fn(async () => ({
        getDirectoryHandle,
        removeEntry,
      }));

  vi.stubGlobal('navigator', {
    storage: {
      estimate: vi.fn(() => ({ quota, usage: 0 })),
      getDirectory,
    },
  });

  return {
    close,
    createWritable,
    getDirectory,
    getDirectoryHandle,
    getFileHandle,
    removeEntry,
    write,
  };
};

describe(hasUnavailableBrowserStorage, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('returns false when quota exists and OPFS writes succeed', async () => {
    stubBrowserStorage();

    await expect(hasUnavailableBrowserStorage()).resolves.toBe(false);
  });

  test('returns true when quota is zero', async () => {
    stubBrowserStorage({ quota: 0 });

    await expect(hasUnavailableBrowserStorage()).resolves.toBe(true);
  });

  test('returns true when OPFS is unavailable', async () => {
    stubBrowserStorage({ omitOpfs: true });

    await expect(hasUnavailableBrowserStorage()).resolves.toBe(true);
  });

  test('returns true when quota exists but OPFS writes fail', async () => {
    stubBrowserStorage({ quota: 1_048_576_000, rejectOpfsWrite: true });

    await expect(hasUnavailableBrowserStorage()).resolves.toBe(true);
  });
});
