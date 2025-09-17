interface ImportMetaEnv {
  readonly BRANCH_ENV: 'master' | 'develop';
  readonly VERSION: string;
  readonly GRAPHICS_VERSION: string;
  readonly VITE_FARO_INGEST_ENDPOINT: string;
  // Injected by Netlify, not available during dev
  readonly COMMIT_REF: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
