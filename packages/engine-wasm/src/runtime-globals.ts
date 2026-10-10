// Host conveniences used by shared API dependencies. These execute inside Wasm.
if (typeof performance === 'undefined') {
  Object.assign(globalThis, { performance: { now: () => Date.now() } });
}
if (typeof console === 'undefined') {
  Object.assign(globalThis, {
    console: { log: () => {}, error: () => {}, warn: () => {} },
  });
}
if (typeof URLSearchParams === 'undefined') {
  class SearchParams {
    private entries: [string, string][];
    constructor(query: string) {
      const decode = (value: string) =>
        decodeURIComponent(value.replace(/\+/g, ' '));
      this.entries = query
        .replace(/^\?/, '')
        .split('&')
        .filter(Boolean)
        .map((part) => {
          const equal = part.indexOf('=');
          return equal < 0
            ? [decode(part), '']
            : [decode(part.slice(0, equal)), decode(part.slice(equal + 1))];
        });
    }
    [Symbol.iterator]() {
      return this.entries[Symbol.iterator]();
    }
  }
  Object.assign(globalThis, { URLSearchParams: SearchParams });
}
