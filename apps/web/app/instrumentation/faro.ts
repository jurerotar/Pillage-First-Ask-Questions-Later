import { env } from 'app/env';
import { isStandaloneDisplayMode } from 'app/utils/device';

const allowedBranches = new Set(['master', 'develop']);

// This is only injected by Netlify, so we're safe to run this on development
const isAllowedBranch = allowedBranches.has(env.HEAD);

export const initFaro = async () => {
  if (typeof window === 'undefined' || !isAllowedBranch) {
    return;
  }

  const { initializeFaro, getWebInstrumentations } = await import(
    '@grafana/faro-web-sdk'
  );

  initializeFaro({
    url: env.VITE_FARO_INGEST_ENDPOINT,
    app: {
      name: 'pillage-first',
      version: env.VERSION,
      release: env.COMMIT_REF,
    },
    instrumentations: getWebInstrumentations({
      captureConsole: true,
      enablePerformanceInstrumentation: true,
    }),
    sessionTracking: {
      session: {
        attributes: {
          client: isStandaloneDisplayMode() ? 'pwa' : 'browser',
        },
      },
    },
  });
};
