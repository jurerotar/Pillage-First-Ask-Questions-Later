import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { env } from '@pillage-first/utils/env';

const checkInterval = 5 * 60 * 1000;
const requestTimeout = 10 * 1000;
const toastId = 'app-update-available';

const buildMetadataSchema = z.strictObject({
  buildId: z.string().min(1),
  version: z.string().min(1),
});

export const useAppUpdate = (): void => {
  const { t } = useTranslation();
  const notified = useRef(false);

  const { data } = useQuery({
    queryKey: ['build-metadata'],
    queryFn: async ({ signal }) => {
      const timeoutController = new AbortController();
      const timeout = window.setTimeout(
        () => timeoutController.abort(),
        requestTimeout,
      );

      try {
        const response = await fetch('/build.json', {
          cache: 'no-store',
          signal: AbortSignal.any([signal, timeoutController.signal]),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch build metadata');
        }

        return buildMetadataSchema.parse(await response.json());
      } finally {
        window.clearTimeout(timeout);
      }
    },
    enabled: (query) =>
      env.PROD &&
      (!query.state.data || query.state.data.buildId === env.BUILD_ID),
    refetchInterval: checkInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    networkMode: 'online',
    staleTime: 0,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (!data || data.buildId === env.BUILD_ID || notified.current) {
      return;
    }

    notified.current = true;

    toast(t('A new version of the game is available.'), {
      id: toastId,
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
      action: {
        label: t('Refresh'),
        onClick: () => window.location.reload(),
      },
    });
  }, [data, t]);

  useEffect(() => {
    return () => {
      toast.dismiss(toastId);
    };
  }, []);
};
