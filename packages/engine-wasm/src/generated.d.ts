// Generated bundles expose the same API as these TypeScript sources.
declare module '*.mjs' {
  const createModule: (
    options?: Record<string, unknown>,
  ) => Promise<import('./client').WasmModule & Record<string, unknown>>;
  export default createModule;
  export const open: typeof import('./__tests__/fixtures/baseline').open;
  export const execute: typeof import('./core').execute;
  export const createEngine: typeof import('./client').createEngine;
  export const inspect: typeof import('./__tests__/fixtures/baseline').inspect;
}

interface Window {
  verification?: { status: string; [key: string]: unknown };
}
