import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { build } from 'esbuild';
import { expect, test } from 'vitest';
import { createEngine, type WasmModule } from '../../src/client';
import type { EngineRequest } from '../../src/core';
import { lowerForHermes } from '../bundle';
import { ffiPrelude } from '../ffi';

const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
const repositoryRoot = path.resolve(packageRoot, '../..');
const output = path.join(packageRoot, 'build/bridge-review');
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
const optionalBaseline = async () =>
  readFile(path.join(output, 'ffi-baseline.ts.in'), 'utf8').catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        throw error;
      }
      return null;
    },
  );

const compile = async () => {
  await mkdir(output, { recursive: true });
  const bundle = await build({
    entryPoints: [
      path.join(packageRoot, 'src/__tests__/fixtures/bridge-performance.ts'),
    ],
    write: false,
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: 'es2020',
  });
  await writeFile(
    path.join(output, 'engine.js'),
    lowerForHermes(bundle.outputFiles[0].text),
  );
  await writeFile(path.join(output, 'pump.js'), 'globalThis.enginePump();');
  const current = await readFile(
    path.join(packageRoot, 'native/ffi.ts.in'),
    'utf8',
  );
  const marker = '// @native-declarations';
  const native = ffiPrelude();
  const declarations = native.slice(
    current.indexOf(marker),
    native.length - (current.length - current.indexOf(marker) - marker.length),
  );
  const baseline = await optionalBaseline();
  if (baseline) {
    await writeFile(
      path.join(output, 'native-baseline.js'),
      `${baseline.replace(marker, `${declarations}\nconst _s_bind_text=$SHBuiltin.extern_c({include:"sqlite-bridge.h"},function s_bind_text(id:c_int,index:c_int,value:c_ptr,length:c_int):c_int{throw 0;});`)}\nglobalThis.engineNative=engineNative;`,
    );
  }
  await writeFile(
    path.join(output, 'native-current.js'),
    `${native}\nglobalThis.engineNative=engineNative;`,
  );
  for (const filename of [
    'runtime.c',
    'serial-executor.cpp',
    'sqlite-bridge.c',
    'sqlite-bridge.h',
    'text-bindings.cpp',
  ]) {
    await copyFile(
      path.join(packageRoot, 'native', filename),
      path.join(output, filename),
    );
  }
  const bridge = await readFile(path.join(output, 'sqlite-bridge.c'), 'utf8');
  const previous = await readFile(
    path.join(output, 'native-previous.js'),
    'utf8',
  ).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    return null;
  });
  const sourceMetadata = {
    emscripten: '6.0.12',
    optimization: '-O2',
    baselineSource: baseline
      ? 'build/bridge-review/ffi-baseline.ts.in (locally preserved, untracked)'
      : null,
    baselineSha256: baseline ? hash(baseline) : null,
    currentSha256: hash(current),
    previousSource: previous
      ? 'build/bridge-review/native-previous.js (locally preserved generated FFI before host binding)'
      : null,
    previousSha256: previous ? hash(previous) : null,
    nativeBridgeSha256: hash(bridge),
  };
  await copyFile(
    path.join(packageRoot, 'src/__tests__/fixtures/bridge-performance.c'),
    path.join(output, 'c-engine.c'),
  );
  await copyFile(
    path.join(packageRoot, 'build/modular/sqlite3.o'),
    path.join(output, 'sqlite3.o'),
  );
  await copyFile(
    path.join(packageRoot, 'build/modular/sqlite3.h'),
    path.join(output, 'sqlite3.h'),
  );
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'run',
        '--rm',
        '--mount',
        'type=volume,source=pillage-wasm-toolchain,target=/toolchain',
        '--mount',
        `type=bind,source=${repositoryRoot},target=/workspace`,
        'emscripten/emsdk:6.0.12',
        'bash',
        '/workspace/packages/engine-wasm/scripts/__tests__/compile-bridge-performance.sh',
      ],
      { stdio: 'inherit' },
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Review compilation exited ${code}`)),
    );
  });
  const compiledVariants = [
    'c',
    'current',
    ...(baseline ? ['baseline'] : []),
    ...(previous ? ['previous'] : []),
  ];
  const artifactHashes = Object.fromEntries(
    await Promise.all(
      compiledVariants.map(async (variant) => [
        variant,
        hash(await readFile(path.join(output, `${variant}.wasm`))),
      ]),
    ),
  );
  await writeFile(
    path.join(output, 'compile-metadata.json'),
    JSON.stringify(
      {
        ...sourceMetadata,
        compiledAt: new Date().toISOString(),
        artifactHashes,
        sqliteObjectSha256: hash(
          await readFile(path.join(output, 'sqlite3.o')),
        ),
        hostSourceSha256: hash(
          await readFile(path.join(output, 'text-bindings.cpp')),
        ),
      },
      null,
      2,
    ),
  );
};

// Opt in to avoid slowing normal tests. Objects and reports stay separate from
// production builds; preserve an old ffi-baseline.ts.in to compare FFI changes.
test.skipIf(process.env.BRIDGE_BENCHMARK !== '1')(
  'paired C and Hermes bridge performance with identical prepared SQL/state',
  async () => {
    if (process.env.BRIDGE_BENCHMARK_SKIP_BUILD !== '1') {
      await compile();
    }
    const sqlite = await sqlite3InitModule();
    const raw = new sqlite.oo1.DB(':memory:');
    let fixture: Uint8Array;
    try {
      raw.exec('CREATE TABLE review_seed(value INTEGER)');
      fixture = sqlite.capi.sqlite3_js_db_export(raw.pointer!, 'main');
    } finally {
      raw.close();
    }
    const provenance = JSON.parse(
      await readFile(path.join(output, 'compile-metadata.json'), 'utf8'),
    );
    for (const [variant, expectedHash] of Object.entries(
      provenance.artifactHashes as Record<string, string>,
    )) {
      expect(hash(await readFile(path.join(output, `${variant}.wasm`)))).toBe(
        expectedHash,
      );
    }
    const artifacts = [
      ...(provenance.baselineSha256 ? ['baseline'] : []),
      ...(provenance.previousSha256 ? ['previous'] : []),
      'current',
    ];
    const variants = [
      'c',
      ...artifacts.map((artifact) => `${artifact}-ffi`),
      ...artifacts.map((artifact) => `${artifact}-facade`),
    ];
    const engines = await Promise.all(
      variants.map(async (variant) => {
        const artifact = variant.split('-')[0];
        const { default: factory } = await import(
          path.join(output, `${artifact}.mjs`)
        );
        return createEngine(fixture, factory as () => Promise<WasmModule>);
      }),
    );
    const results: Record<
      string,
      Record<string, { medianMs: number; p90Ms: number; samplesMs: number[] }>
    > = {};
    try {
      for (const [index, engine] of engines.entries()) {
        if (variants[index] !== 'c') {
          expect(
            engine.dispatch({ kind: 'validate' } as unknown as EngineRequest)
              .data,
          ).toEqual({ checksum: 10 });
        }
      }
      for (const kind of [
        'numeric',
        'rows-numeric',
        'ascii',
        'rows-ascii',
        'unicode',
        'rows-unicode',
      ]) {
        const samples = variants.map(() => [] as number[]);
        const checksums = variants.map(() => [] as unknown[]);
        for (let sample = -3; sample < 15; sample++) {
          for (let offset = 0; offset < variants.length; offset++) {
            const index = (offset + sample + 3) % variants.length;
            const request = {
              kind,
              rounds: 5,
              facade: variants[index].endsWith('facade'),
            } as unknown as EngineRequest;
            const start = performance.now();
            const response = engines[index].dispatch(request);
            const elapsed = performance.now() - start;
            if (sample >= 0) {
              samples[index].push(elapsed);
            }
            checksums[index].push(response.data);
          }
        }
        for (const checksum of checksums) {
          expect(checksum).toEqual(checksums[0]);
        }
        results[kind] = Object.fromEntries(
          variants.map((variant, index) => [
            variant,
            {
              medianMs: median(samples[index]),
              p90Ms: [...samples[index]].sort((a, b) => a - b)[
                Math.floor(samples[index].length * 0.9)
              ],
              samplesMs: samples[index],
            },
          ]),
        );
        const expected = engines[0].snapshot();
        for (const engine of engines.slice(1)) {
          expect(
            Buffer.from(engine.snapshot()).equals(Buffer.from(expected)),
          ).toBe(true);
        }
      }
      const { default: cFactory } = await import(path.join(output, 'c.mjs'));
      const snapshotEngines = await Promise.all(
        [false, true].map(async (copy) =>
          createEngine(fixture, async () => {
            const module = (await cFactory()) as WasmModule;
            if (copy) {
              const ccall = module.ccall.bind(module);
              module.ccall = ((name: string, ...args: unknown[]) =>
                ccall(
                  name === 'engine_snapshot' ? 'review_snapshot_copy' : name,
                  ...(args as [string | null, string[], unknown[]]),
                )) as WasmModule['ccall'];
            }
            return module;
          }),
        ),
      );
      try {
        for (const engine of snapshotEngines) {
          engine.dispatch({
            kind: 'grow',
            rounds: 1,
          } as unknown as EngineRequest);
        }
        expect(
          Buffer.from(snapshotEngines[0].snapshot()).equals(
            Buffer.from(snapshotEngines[1].snapshot()),
          ),
        ).toBe(true);
        const samples = [[], []] as number[][];
        for (let sample = -3; sample < 15; sample++) {
          for (let offset = 0; offset < 2; offset++) {
            const index = (offset + sample + 3) % 2;
            const start = performance.now();
            for (let repeat = 0; repeat < 10; repeat++) {
              snapshotEngines[index].snapshot();
            }
            if (sample >= 0) {
              samples[index].push(performance.now() - start);
            }
          }
        }
        results['snapshot-10x-8MiB'] = Object.fromEntries(
          ['nocopy', 'copy'].map((variant, index) => [
            variant,
            {
              medianMs: median(samples[index]),
              p90Ms: [...samples[index]].sort((a, b) => a - b)[13],
              samplesMs: samples[index],
            },
          ]),
        );
      } finally {
        for (const engine of snapshotEngines) {
          engine.close();
        }
      }
      await writeFile(
        path.join(output, 'results.json'),
        `${JSON.stringify(results, null, 2)}\n`,
      );
      await writeFile(
        path.join(output, 'metadata.json'),
        JSON.stringify(
          {
            ...provenance,
            measuredAt: new Date().toISOString(),
            fixtureSha256: hash(fixture),
            samples: 15,
            warmups: 3,
            rounds: 5,
            rowsPerRound: 1000,
            operationCounts: {
              updates: 5000,
              scalarReads: 5000,
              rowReads: 5000,
              transactions: 5,
              snapshotsPerSample: 10,
            },
            variants,
            notes: [
              'Numeric also binds and reads an empty text field.',
              'Snapshot copy variant isolates allocation/memcpy overhead; both variants retain detached JS copies.',
              'These are synthetic bridge workloads, not whole-game speedups.',
            ],
          },
          null,
          2,
        ),
      );
      process.stdout.write(
        `${JSON.stringify(
          Object.entries(results).map(([kind, values]) => ({
            kind,
            ...Object.fromEntries(
              Object.entries(values).map(([variant, value]) => [
                variant,
                Number(value.medianMs.toFixed(3)),
              ]),
            ),
          })),
          null,
          2,
        )}\n`,
      );
    } finally {
      for (const engine of engines) {
        engine.close();
      }
    }
  },
  600_000,
);
