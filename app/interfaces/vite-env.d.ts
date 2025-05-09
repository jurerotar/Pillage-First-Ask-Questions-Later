interface ImportMetaEnv {
  readonly BRANCH_ENV: 'master' | 'develop';
  readonly VERSION: string;
  readonly VITE_FARO_INGEST_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
