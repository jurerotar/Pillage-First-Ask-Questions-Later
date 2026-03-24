/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VERSION: string;
  readonly GRAPHICS_VERSION: string;
  readonly VITE_FARO_INGEST_ENDPOINT: string;
  // Injected by Netlify, not available during dev
  readonly URL: string;
  readonly DEPLOY_URL: string;
  readonly DEPLOY_PRIME_URL: string;
  readonly COMMIT_REF: string;
  readonly HEAD: string;
};

export type ImportMeta = {
  readonly env: ImportMetaEnv;
};

export type ViteTypeOptions = {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown;
};

export const env = {
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  VERSION: import.meta.env.VERSION,
  GRAPHICS_VERSION: import.meta.env.GRAPHICS_VERSION,
  VITE_FARO_INGEST_ENDPOINT: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
  URL: import.meta.env.URL,
  DEPLOY_URL: import.meta.env.DEPLOY_URL,
  DEPLOY_PRIME_URL: import.meta.env.DEPLOY_PRIME_URL,
  COMMIT_REF: import.meta.env.COMMIT_REF,
  HEAD: import.meta.env.HEAD,
};
