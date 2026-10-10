import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Plugin } from 'esbuild';

export default async function setup(): Promise<void> {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  await mkdir(path.join(root, 'build'), { recursive: true });
  const sql: Plugin = {
    name: 'fixture-sql',
    setup(builder) {
      builder.onResolve({ filter: /\.sql\?raw$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path.slice(0, -4)),
        namespace: 'sql',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'sql' }, async (args) => ({
        contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`,
        loader: 'js',
      }));
    },
  };
  await build({
    entryPoints: [path.join(root, 'src/__tests__/fixtures/baseline.ts')],
    outfile: path.join(root, 'build/baseline.mjs'),
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'esnext',
    external: ['@sqlite.org/sqlite-wasm'],
    plugins: [sql],
    define: {
      'import.meta.env': JSON.stringify({
        VERSION: '0.4.73',
        DEV: false,
        PROD: true,
        MODE: 'test',
      }),
    },
  });
  const { open } = await import(
    new URL('../../build/baseline.mjs', import.meta.url).href
  );
  const fixture = await open();
  try {
    await writeFile(
      path.join(root, 'build/fixture.sqlite3'),
      fixture.database.serialize(),
    );
  } finally {
    fixture.close();
  }
}
