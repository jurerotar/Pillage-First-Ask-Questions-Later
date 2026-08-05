import { env } from '@pillage-first/utils/env';
import { isStandaloneDisplayMode } from 'app/utils/device';

const allowedBranches = new Set(['master']);

// This is only injected by Netlify, so we're safe to run this during local development
const isAllowedBranch = allowedBranches.has(env.HEAD);

export const initFaro = async () => {
  if (typeof window === 'undefined' || !isAllowedBranch) {
    return;
  }

  const [{ initializeFaro, getWebInstrumentations }, { ReactIntegration }] =
    await Promise.all([
      import('@grafana/faro-web-sdk'),
      import('@grafana/faro-react'),
    ]);

  initializeFaro({
    url: env.VITE_FARO_INGEST_ENDPOINT,
    app: {
      name: 'pillage-first',
      version: env.VERSION,
      release: env.COMMIT_REF,
      environment: env.MODE,
    },
    ignoreErrors: [/^Script error\./],
    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: false,
        enablePerformanceInstrumentation: true,
      }),
      new ReactIntegration(),
    ],
    sessionTracking: {
      session: {
        attributes: {
          client: isStandaloneDisplayMode() ? 'pwa' : 'browser',
        },
      },
    },
  });
};
