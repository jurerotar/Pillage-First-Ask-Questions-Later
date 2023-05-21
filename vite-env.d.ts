/// <reference types="vite/client" />

import React from 'react';

interface ImportMetaEnv {
  readonly VITE_ENVIRONMENT: 'local' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react' {
  export type FunctionComponentWithChildren<P = {}> = React.FC<P & {
    children: React.ReactNode;
  }>;
}
