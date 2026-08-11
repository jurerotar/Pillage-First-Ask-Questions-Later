import { env } from '@pillage-first/utils/env';
import { isStandaloneDisplayMode } from 'app/utils/device';

const allowedBranches = new Set(['master']);
const attributionSessionStorageKey = 'pillage-first:faro-attribution';
const visitorIdLocalStorageKey = 'pillage-first:faro-visitor-id';

// This is only injected by Netlify, so we're safe to run this during local development
const isAllowedBranch = allowedBranches.has(env.HEAD);

type FaroSessionAttributes = Record<string, string>;

type Attribution = {
  landingPage: string;
  referrer: string;
  referrerHost: string;
  referringSite: string;
  trafficSource: string;
  utmCampaign?: string;
  utmContent?: string;
  utmMedium?: string;
  utmSource?: string;
  utmTerm?: string;
};

const getStoredVisitorId = (): string | null => {
  try {
    return window.localStorage.getItem(visitorIdLocalStorageKey);
  } catch {
    return null;
  }
};

const setStoredVisitorId = (visitorId: string): void => {
  try {
    window.localStorage.setItem(visitorIdLocalStorageKey, visitorId);
  } catch {
    // Best-effort telemetry field. If localStorage is unavailable, the in-memory
    // generated id is still useful for the current page lifecycle.
  }
};

const getVisitorId = (): string => {
  const storedVisitorId = getStoredVisitorId();

  if (storedVisitorId) {
    return storedVisitorId;
  }

  const visitorId = window.crypto.randomUUID();
  setStoredVisitorId(visitorId);

  return visitorId;
};

const getStoredAttribution = (): Attribution | null => {
  try {
    const storedAttribution = window.sessionStorage.getItem(
      attributionSessionStorageKey,
    );

    return storedAttribution
      ? (JSON.parse(storedAttribution) as Attribution)
      : null;
  } catch {
    return null;
  }
};

const setStoredAttribution = (attribution: Attribution): void => {
  try {
    window.sessionStorage.setItem(
      attributionSessionStorageKey,
      JSON.stringify(attribution),
    );
  } catch {
    // Best-effort telemetry field. If sessionStorage is unavailable, Faro still
    // receives the attribution calculated for this page load.
  }
};

const getExternalReferrer = (): {
  referrer: string;
  referrerHost: string;
  referringSite: string;
  trafficSource: string;
} => {
  if (!document.referrer) {
    return {
      referrer: 'direct',
      referrerHost: 'direct',
      referringSite: 'direct',
      trafficSource: 'direct',
    };
  }

  try {
    const referrerUrl = new URL(document.referrer);

    if (referrerUrl.origin === window.location.origin) {
      return {
        referrer: 'same-origin',
        referrerHost: 'same-origin',
        referringSite: 'same-origin',
        trafficSource: 'same-origin',
      };
    }

    return {
      referrer: referrerUrl.origin,
      referrerHost: referrerUrl.hostname,
      referringSite: referrerUrl.origin,
      trafficSource: 'referral',
    };
  } catch {
    return {
      referrer: 'unknown',
      referrerHost: 'unknown',
      referringSite: 'unknown',
      trafficSource: 'unknown',
    };
  }
};

const getAttribution = (): Attribution => {
  const storedAttribution = getStoredAttribution();

  if (storedAttribution) {
    return storedAttribution;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const referrer = getExternalReferrer();
  const utmSource = searchParams.get('utm_source') ?? undefined;
  const attribution: Attribution = {
    ...referrer,
    landingPage: `${window.location.pathname}${window.location.search}`,
    trafficSource: utmSource ? 'campaign' : referrer.trafficSource,
    utmCampaign: searchParams.get('utm_campaign') ?? undefined,
    utmContent: searchParams.get('utm_content') ?? undefined,
    utmMedium: searchParams.get('utm_medium') ?? undefined,
    utmSource,
    utmTerm: searchParams.get('utm_term') ?? undefined,
  };

  setStoredAttribution(attribution);

  return attribution;
};

const toDefinedAttributes = (
  attributes: Record<string, string | undefined>,
): FaroSessionAttributes => {
  const definedAttributes: FaroSessionAttributes = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value) {
      definedAttributes[key] = value;
    }
  }

  return definedAttributes;
};

const getDashboardSessionAttributes = (): FaroSessionAttributes => {
  const attribution = getAttribution();

  return toDefinedAttributes({
    client: isStandaloneDisplayMode() ? 'pwa' : 'browser',
    landing_page: attribution.landingPage,
    referrer: attribution.referrer,
    referrer_host: attribution.referrerHost,
    referring_site: attribution.referringSite,
    traffic_source: attribution.trafficSource,
    utm_campaign: attribution.utmCampaign,
    utm_content: attribution.utmContent,
    utm_medium: attribution.utmMedium,
    utm_source: attribution.utmSource,
    utm_term: attribution.utmTerm,
    visitor_id: getVisitorId(),
  });
};

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
        attributes: getDashboardSessionAttributes(),
      },
    },
  });
};
