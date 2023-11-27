import '@testing-library/jest-dom';

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid'
  }
});
