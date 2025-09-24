import type { Faro } from '@grafana/faro-web-sdk';
import { isStandaloneDisplayMode } from 'app/utils/device';
import { env } from 'app/env';

let instance: Faro | null = null;

export const initFaro = async () => {
  if (
    typeof window === 'undefined' ||
    env.MODE === 'development' ||
    env.VITE_FARO_INGEST_ENDPOINT === undefined ||
    env.BRANCH_ENV !== 'master' ||
    instance
  ) {
    return;
  }

  const { initializeFaro, getWebInstrumentations } = await import(
    '@grafana/faro-web-sdk'
  );

  instance = initializeFaro({
    url: env.VITE_FARO_INGEST_ENDPOINT,
    app: {
      name: 'pillage-first',
      version: env.VERSION,
      environment: env.BRANCH_ENV,
      release: env.COMMIT_REF,
    },
    instrumentations: getWebInstrumentations({ captureConsole: true }),
    sessionTracking: {
      session: {
        attributes: {
          client: isStandaloneDisplayMode() ? 'pwa' : 'browser',
        },
      },
    },
  });
};
