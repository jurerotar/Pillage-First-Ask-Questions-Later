import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from '@babel/core';
import blockScoping from '@babel/plugin-transform-block-scoping';
import { build, type Plugin } from 'esbuild';
import { build as treeShake } from 'rolldown';
import { ffiPrelude } from './ffi.ts';

const root = fileURLToPath(new URL('../', import.meta.url));

// The pinned Hermes compiler needs lexical captures lowered to function scopes.
// Keep probe builds on the same compiler pass as the production engine.
export const lowerForHermes = (source: string): string => {
  const lowered = transformSync(source, {
    babelrc: false,
    configFile: false,
    compact: false,
    plugins: [blockScoping],
  });
  if (lowered === null || !lowered.code) {
    throw new Error('Babel did not produce the engine bundle');
  }
  return lowered.code;
};

export const bundleForHermes = async (
  entryPoint: string,
  define: Record<string, string> = {},
): Promise<string> => {
  // Shake original ESM first. Converting every source to CommonJS beforehand
  // retains unused dependency exports, including thousands of Zod functions.
  const shaken = await treeShake({
    input: entryPoint,
    write: false,
    platform: 'neutral',
    resolve: { mainFields: ['module', 'main'] },
    transform: { target: 'esnext', define },
    output: {
      format: 'cjs',
      preserveModules: true,
      entryFileNames: '[name].cjs',
      chunkFileNames: '[name].cjs',
    },
  });
  const chunks = new Map(
    shaken.output.flatMap((output) =>
      output.type === 'chunk' ? [[output.fileName, output] as const] : [],
    ),
  );
  const entry = [...chunks.values()].find((chunk) => chunk.isEntry);

  if (!entry) {
    throw new Error('Rolldown did not produce the engine entry');
  }

  // Keep the emitted CommonJS module wrappers when making the final IIFE.
  // Flattening the whole ESM graph creates a function too large for browser Wasm.
  const modules: Plugin = {
    name: 'hermes-modules',
    setup(builder) {
      builder.onResolve({ filter: /.*/ }, (args) => {
        const filename = path.posix.normalize(
          args.importer
            ? path.posix.join(path.posix.dirname(args.importer), args.path)
            : args.path,
        );

        if (!chunks.has(filename)) {
          throw new Error(`Missing generated engine module: ${filename}`);
        }

        return { path: filename, namespace: 'hermes-module' };
      });
      builder.onLoad({ filter: /.*/, namespace: 'hermes-module' }, (args) => ({
        contents: chunks.get(args.path)!.code,
        loader: 'js',
      }));
    },
  };
  const engine = await build({
    entryPoints: [entry.fileName],
    write: false,
    bundle: true,
    platform: 'neutral',
    format: 'iife',
    target: 'esnext',
    plugins: [modules],
  });

  return lowerForHermes(engine.outputFiles[0].text);
};

export const bundle = async (): Promise<void> => {
  const output = path.join(root, 'build/modular');
  await mkdir(output, { recursive: true });
  const engine = await bundleForHermes(path.join(root, 'src/compiled.ts'));
  await writeFile(path.join(output, 'engine.js'), engine);
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
    target: 'esnext',
  });
};

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await bundle();
}
