/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VERSION: string;
    readonly BUILD_ID: string;
    readonly GRAPHICS_VERSION: string;
    readonly VITE_FARO_INGEST_ENDPOINT: string;
    readonly VITE_API_URL: string;
    // Injected by Netlify, not available during dev
    readonly URL: string;
    readonly DEPLOY_URL: string;
    readonly DEPLOY_PRIME_URL: string;
    readonly COMMIT_REF: string;
    readonly HEAD: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface ViteTypeOptions {
    // By adding this line, you can make the type of ImportMetaEnv strict
    // to disallow unknown keys.
    strictImportMetaEnv: unknown;
  }
}

export const env = {
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  VERSION: import.meta.env.VERSION,
  BUILD_ID: import.meta.env.BUILD_ID,
  GRAPHICS_VERSION: import.meta.env.GRAPHICS_VERSION,
  VITE_FARO_INGEST_ENDPOINT: import.meta.env.VITE_FARO_INGEST_ENDPOINT,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  URL: import.meta.env.URL,
  DEPLOY_URL: import.meta.env.DEPLOY_URL,
  DEPLOY_PRIME_URL: import.meta.env.DEPLOY_PRIME_URL,
  COMMIT_REF: import.meta.env.COMMIT_REF,
  HEAD: import.meta.env.HEAD,
};
