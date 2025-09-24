/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BRANCH_ENV: 'master' | 'develop';
  readonly VERSION: string;
  readonly GRAPHICS_VERSION: string;
  readonly VITE_FARO_INGEST_ENDPOINT: string;
  // Injected by Netlify, not available during dev
  readonly COMMIT_REF: string;
  readonly HEAD: string;
}

// biome-ignore lint/correctness/noUnusedVariables: This is required for the types to work and Biome complaints about it
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const env = {
  MODE: import.meta.env.MODE,
  BRANCH_ENV: import.meta.env.BRANCH_ENV,
  VERSION: import.meta.env.VERSION,
  GRAPHICS_VERSION: import.meta.env.GRAPHICS_VERSION,
  VITE_FARO_INGEST_ENDPOINT: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
  COMMIT_REF: import.meta.env.COMMIT_REF,
  HEAD: import.meta.env.HEAD,
};
