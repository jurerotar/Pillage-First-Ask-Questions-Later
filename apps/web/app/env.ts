/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly BRANCH_ENV: 'master' | 'develop';
  readonly VERSION: string;
  readonly NODE_ENV: 'production' | 'development';
  readonly GRAPHICS_VERSION: string;
  readonly VITE_FARO_INGEST_ENDPOINT: string;
  // Injected by Netlify, not available during dev
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
  MODE: import.meta.env.MODE,
  NODE_ENV: import.meta.env.NODE_ENV,
  BRANCH_ENV: import.meta.env.BRANCH_ENV,
  VERSION: import.meta.env.VERSION,
  GRAPHICS_VERSION: import.meta.env.GRAPHICS_VERSION,
  VITE_FARO_INGEST_ENDPOINT: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
  COMMIT_REF: import.meta.env.COMMIT_REF,
  HEAD: import.meta.env.HEAD,
};
