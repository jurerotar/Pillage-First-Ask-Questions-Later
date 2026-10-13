// Host conveniences used by shared API dependencies. These execute inside Wasm.
export {};

if (typeof console === 'undefined') {
  Object.assign(globalThis, {
    console: { error: () => {} },
  });
}

if (typeof URLSearchParams === 'undefined') {
  // Form decoding preserves malformed escapes and replaces invalid UTF-8,
  // unlike decodeURIComponent(), which throws. Hermes has no TextDecoder.
  const decode = (value: string): string => {
    const normalized = value
      .replace(/\+/g, ' ')
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g, (part) =>
        part.length === 2 ? part : '\uFFFD',
      );
    try {
      return decodeURIComponent(normalized);
    } catch {
      // Valid queries use the native decoder; only malformed input needs repair.
    }
    return normalized.replace(/(?:%[0-9a-f]{2})+/gi, (encoded) => {
      const bytes = encoded
        .match(/%[0-9a-f]{2}/gi)!
        .map((byte) => Number.parseInt(byte.slice(1), 16));
      let output = '';

      for (let i = 0; i < bytes.length; ) {
        const first = bytes[i++];
        if (first < 128) {
          output += String.fromCharCode(first);
          continue;
        }
        const width =
          first >= 194 && first <= 223
            ? 2
            : first >= 224 && first <= 239
              ? 3
              : first >= 240 && first <= 244
                ? 4
                : 0;
        let point = first & (width === 2 ? 31 : width === 3 ? 15 : 7);
        let consumed = 1;

        for (; consumed < width && i < bytes.length; consumed++) {
          const byte = bytes[i];
          const lower =
            consumed === 1 && first === 224
              ? 160
              : consumed === 1 && first === 240
                ? 144
                : 128;
          const upper =
            consumed === 1 && first === 237
              ? 159
              : consumed === 1 && first === 244
                ? 143
                : 191;
          if (byte < lower || byte > upper) {
            break;
          }
          point = (point << 6) | (byte & 63);
          i++;
        }
        output +=
          width !== 0 && consumed === width
            ? String.fromCodePoint(point)
            : '\uFFFD';
      }
      return output;
    });
  };

  class SearchParams {
    private entries: [string, string][];

    constructor(query: string) {
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
