import { useCallback, useEffect, useState } from 'react';
import { reportError } from 'app/instrumentation/report-error';

const checkOpfsWriteAccess = async (): Promise<boolean> => {
  if (!navigator.storage?.getDirectory) {
    return false;
  }

  const directoryName = `pillage-first-storage-probe-${crypto.randomUUID()}`;
  let root: FileSystemDirectoryHandle | null = null;
  let writable: FileSystemWritableFileStream | null = null;

  try {
    root = await navigator.storage.getDirectory();

    const directory = await root.getDirectoryHandle(directoryName, {
      create: true,
    });
    const file = await directory.getFileHandle('probe.txt', { create: true });

    writable = await file.createWritable();
    await writable.write(`storage probe ${Date.now()}`);
    await writable.close();
    writable = null;

    return true;
  } catch {
    return false;
  } finally {
    await writable?.close().catch(() => {});
    await root?.removeEntry(directoryName, { recursive: true }).catch(() => {});
  }
};

export const hasUnavailableBrowserStorage = async (): Promise<boolean> => {
  const [estimate, canWriteToOpfs] = await Promise.all([
    navigator.storage?.estimate?.() ?? null,
    checkOpfsWriteAccess(),
  ]);

  return estimate?.quota === 0 || !canWriteToOpfs;
};

export const useBrowserStorageQuota = () => {
  const [hasUnavailableStorageQuota, setHasUnavailableStorageQuota] =
    useState<boolean>(false);
  const [isCheckingStorageQuota, setIsCheckingStorageQuota] =
    useState<boolean>(false);

  const checkStorageQuota = useCallback(async (): Promise<boolean> => {
    setIsCheckingStorageQuota(true);

    try {
      const isUnavailable = await hasUnavailableBrowserStorage();

      setHasUnavailableStorageQuota(isUnavailable);

      return isUnavailable;
    } catch (error) {
      reportError(
        error instanceof Error
          ? error
          : new Error('Failed to check browser storage quota'),
        'Failed to check browser storage quota',
        {
          source: 'useBrowserStorageQuota',
        },
      );
      setHasUnavailableStorageQuota(false);

      return false;
    } finally {
      setIsCheckingStorageQuota(false);
    }
  }, []);

  useEffect(() => {
    void checkStorageQuota();
  }, [checkStorageQuota]);

  return {
    checkStorageQuota,
    hasUnavailableStorageQuota,
    isCheckingStorageQuota,
  };
};
