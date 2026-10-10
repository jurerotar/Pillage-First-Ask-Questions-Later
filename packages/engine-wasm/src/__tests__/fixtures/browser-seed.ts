import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

globalThis.addEventListener(
  'message',
  async (event: MessageEvent<{ slug: string; bytes: Uint8Array }>) => {
    try {
      const sqlite = await sqlite3InitModule();
      const pool = await sqlite.installOpfsSAHPoolVfs({
        directory: `/pillage-first-ask-questions-later/${event.data.slug}`,
      });
      await pool.importDb(`/${event.data.slug}.sqlite3`, event.data.bytes);
      pool.pauseVfs();
      globalThis.postMessage({ success: true });
    } catch (error) {
      globalThis.postMessage({ error: String(error) });
    }
  },
);
