import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';
import blockScoping from '@babel/plugin-transform-block-scoping';
import { build, type Plugin, transform } from 'esbuild';
import { ffiPrelude } from './ffi.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const environment = JSON.stringify({
  VERSION: '0.4.73',
  DEV: false,
  PROD: true,
  MODE: 'wasm',
});

// Preserve module function boundaries for the pinned AOT compiler. These are
// standard compiler passes; no API source is substituted.
const modules: Plugin = {
  name: 'aot-modules',
  setup(builder) {
    builder.onResolve({ filter: /.*/ }, async (args) => {
      if (args.pluginData?.resolved) {
        return;
      }
      const result = await builder.resolve(args.path, {
        resolveDir: args.resolveDir || root,
        kind: 'import-statement',
        pluginData: { resolved: true },
      });
      if (result.errors.length) {
        return result;
      }
      const originalPath = result.path;
      return {
        ...result,
        path: originalPath.endsWith('.mjs')
          ? `${originalPath}.cjs`
          : originalPath,
        namespace: /\.(?:[cm]?js|tsx?)$/.test(originalPath)
          ? 'aot'
          : result.namespace,
        pluginData: { originalPath },
      };
    });
    builder.onLoad(
      { filter: /\.(?:[cm]?js|tsx?)$/, namespace: 'aot' },
      async (args) => {
        const filename = args.pluginData.originalPath as string;
        const output = await transform(await readFile(filename, 'utf8'), {
          loader: filename.endsWith('.ts') ? 'ts' : 'js',
          format: 'cjs',
          target: 'es2020',
          define: { 'import.meta.env': environment },
        });
        return {
          contents: output.code,
          loader: 'js',
          resolveDir: path.dirname(filename),
        };
      },
    );
  },
};

export async function bundle(): Promise<void> {
  const output = path.join(root, 'build/modular');
  await mkdir(output, { recursive: true });
  const engine = await build({
    entryPoints: [path.join(root, 'src/compiled.ts')],
    write: false,
    bundle: true,
    platform: 'neutral',
    format: 'iife',
    target: 'es2020',
    plugins: [modules],
    define: { 'import.meta.env': environment },
  });
  // Lower lexical captures to forms supported by the pinned Static Hermes AOT.
  const lowered = transformSync(engine.outputFiles[0].text, {
    babelrc: false,
    configFile: false,
    compact: false,
    plugins: [blockScoping],
  });
  if (!lowered?.code) {
    throw new Error('Babel did not produce the engine bundle');
  }
  await writeFile(path.join(output, 'engine.js'), lowered.code);
  await writeFile(
    path.join(output, 'native.js'),
    `${ffiPrelude()}\nglobalThis.engineNative = engineNative;\n`,
  );
  await writeFile(path.join(output, 'pump.js'), 'globalThis.enginePump();\n');
  await build({
    entryPoints: [path.join(root, 'src/client.ts')],
    outfile: path.join(root, 'build/client.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    target: 'es2020',
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await bundle();
}
