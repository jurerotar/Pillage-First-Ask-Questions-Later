import sqliteWasmUrl from '@sqlite.org/sqlite-wasm/sqlite3.wasm?url';

export const SqlitePreloadLink = () => {
  return (
    <link
      rel="preload"
      crossOrigin="anonymous"
      as="fetch"
      type="application/wasm"
      href={sqliteWasmUrl}
    />
  );
};
