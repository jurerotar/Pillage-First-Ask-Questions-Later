Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'uuid'
  }
});
