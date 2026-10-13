// Each generated artifact exposes only its actual exports.
declare module '*engine.mjs' {
  const createModule: import('./client').WasmFactory;
  export default createModule;
}

declare module '*bridge-probe.mjs' {
  const createModule: import('./client').WasmFactory;
  export default createModule;
}

declare module '*client.mjs' {
  export const createEngine: typeof import('./client').createEngine;
}

declare module '*baseline.mjs' {
  export const open: typeof import('./__tests__/fixtures/baseline').open;
  export const execute: typeof import('./core').execute;
  export const inspect: typeof import('./__tests__/fixtures/baseline').inspect;
}

interface Window {
  verification?: { status: string; [key: string]: unknown };
}
