import type sqlite3InitModule from '@sqlite.org/sqlite-wasm';

export type Sqlite3Module = Awaited<ReturnType<typeof sqlite3InitModule>>;
export type OpfsSahPool = Awaited<
  ReturnType<Sqlite3Module['installOpfsSAHPoolVfs']>
>;
export type Database = OpfsSahPool['OpfsSAHPoolDb']['prototype'];
