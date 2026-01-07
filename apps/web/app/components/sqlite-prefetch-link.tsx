import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

export const SqlitePrefetchLink = () => {
  return (
    <link
      rel="prefetch"
      crossOrigin="anonymous"
      as="fetch"
      type="application/wasm"
      href={sqliteWasmUrl}
    />
  );
};
