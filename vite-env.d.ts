/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: 'local' | 'production';
  readonly VITE_DATABASE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
