// Resolve the generated factory in unit tests before any Wasm build exists.
// Worker tests must mock this boundary; integration tests use the real module.
const createGameEngine = (): never => {
  throw new Error('The Wasm factory must be mocked in unit tests');
};

export default createGameEngine;
