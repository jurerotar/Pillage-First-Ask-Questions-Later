interface ImportMetaEnv {
  readonly BRANCH_ENV: 'master' | 'develop';
  readonly VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
