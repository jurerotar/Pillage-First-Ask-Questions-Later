import { useCallback, useEffect, useState } from 'react';
import { reportError } from 'app/instrumentation/report-error';

export const useBrowserStorageQuota = () => {
  const [hasUnavailableStorageQuota, setHasUnavailableStorageQuota] =
    useState<boolean>(false);
  const [isCheckingStorageQuota, setIsCheckingStorageQuota] =
    useState<boolean>(false);

  const checkStorageQuota = useCallback(async (): Promise<boolean> => {
    if (!navigator.storage?.estimate) {
      setHasUnavailableStorageQuota(false);
      return false;
    }

    setIsCheckingStorageQuota(true);

    try {
      const { quota } = await navigator.storage.estimate();
      const isUnavailable = quota === 0;

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
