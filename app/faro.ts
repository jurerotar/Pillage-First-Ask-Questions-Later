import type { Faro } from '@grafana/faro-web-sdk';
import { isStandaloneDisplayMode } from 'app/utils/device';

let instance: Faro | null = null;

export const faro: Faro = new Proxy({} as Faro, {
  get: (_target, prop: keyof Faro) => {
    const value = instance?.[prop];

    if (typeof value === 'function') {
      return (...args: Parameters<typeof value>) => (value as (...args: unknown[]) => unknown).apply(instance, args);
    }

    return value;
  },
});

export const initFaro = async () => {
  if (typeof window === 'undefined' || import.meta.env.MODE === 'development' || instance) {
    return;
  }

  const { initializeFaro, getWebInstrumentations } = await import('@grafana/faro-web-sdk');

  instance = initializeFaro({
    url: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
    app: {
      name: 'pillage-first',
      version: import.meta.env.VERSION,
      environment: import.meta.env.BRANCH_ENV,
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
