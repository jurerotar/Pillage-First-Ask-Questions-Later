import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { build } from 'esbuild';
import { expect, test } from 'vitest';
import { z } from 'zod';
import { lowerForHermes } from '../../scripts/bundle';
import { ffiPrelude } from '../../scripts/ffi';
import {
  dockerImage,
  dockerMounts,
  packageRoot,
  prepareToolchain,
  toolchain,
} from '../../scripts/toolchain';
import {
  createEngine,
  type EngineResponse,
  type WasmModule,
} from '../../src/client';
import type { EngineRequest } from '../../src/core';
import {
  type BenchmarkReport,
  compareReports,
  hostMetadata,
  summarize,
} from '../report';

const output = path.join(packageRoot, 'build/bridge-review');
const profile = process.env.BENCHMARK_PROFILE === 'quick' ? 'quick' : 'full';
const sampleCount = profile === 'quick' ? 3 : 15;
const warmups = profile === 'quick' ? 1 : 3;
const compileMetadata = z.object({
  inputSha256: z.string(),
  artifactHashes: z.record(z.string(), z.string()),
});
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const hash = (value: string | Uint8Array) =>
  createHash('sha256').update(value).digest('hex');
const workloadHash = async () =>
  hash(
    (
      await Promise.all(
        ['benchmarks/fixtures/bridge.ts', 'benchmarks/fixtures/bridge.c'].map(
          (file) => readFile(path.join(packageRoot, file)),
        ),
      )
    )
      .map((bytes) => hash(bytes))
      .join('\n'),
  );
const compile = async () => {
  await prepareToolchain();
  await mkdir(output, { recursive: true });
  const bundle = await build({
    entryPoints: [path.join(packageRoot, 'benchmarks/fixtures/bridge.ts')],
    write: false,
    bundle: true,
    format: 'iife',
    platform: 'neutral',
    target: 'esnext',
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
  const native = ffiPrelude();
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
  const sourceMetadata = {
    workloadSha256: await workloadHash(),
    emscripten: toolchain.emscripten,
    hermesCommit: toolchain.hermes.commit,
    optimization: '-O2',
    currentSha256: hash(current),
    nativeBridgeSha256: hash(bridge),
  };
  await copyFile(
    path.join(packageRoot, 'benchmarks/fixtures/bridge.c'),
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
  const inputs = [
    'engine.js',
    'pump.js',
    'native-current.js',
    'runtime.c',
    'serial-executor.cpp',
    'sqlite-bridge.c',
    'sqlite-bridge.h',
    'text-bindings.cpp',
    'c-engine.c',
    'sqlite3.o',
    'sqlite3.h',
  ];
  const { stdout: compilerIdentity } = await promisify(execFile)('docker', [
    'run',
    '--rm',
    ...dockerMounts,
    dockerImage,
    'bash',
    '/package/benchmarks/compile-bridge.sh',
    '--identity',
  ]);
  const inputSha256 = hash(
    JSON.stringify({
      toolchain,
      compilerIdentity,
      sources: await Promise.all(
        inputs.map(async (file) =>
          hash(await readFile(path.join(output, file))),
        ),
      ),
      script: hash(
        await readFile(path.join(packageRoot, 'benchmarks/compile-bridge.sh')),
      ),
    }),
  );
  try {
    const cached = compileMetadata.parse(
      JSON.parse(
        await readFile(path.join(output, 'compile-metadata.json'), 'utf8'),
      ),
    );
    const artifacts = ['c.wasm', 'c.mjs', 'current.wasm', 'current.mjs'];
    if (
      cached.inputSha256 === inputSha256 &&
      (
        await Promise.all(
          artifacts.map(
            async (file) =>
              hash(await readFile(path.join(output, file))) ===
              cached.artifactHashes[file],
          ),
        )
      ).every(Boolean)
    ) {
      process.stdout.write(
        'Cached bridge probes (inputs and artifacts verified)\n',
      );
      return;
    }
  } catch {
    // Missing, damaged or older cache entries require compilation.
  }
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'docker',
      [
        'run',
        '--rm',
        ...dockerMounts,
        dockerImage,
        'bash',
        '/package/benchmarks/compile-bridge.sh',
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
  const compiledArtifacts = ['c.wasm', 'c.mjs', 'current.wasm', 'current.mjs'];
  const artifactHashes = Object.fromEntries(
    await Promise.all(
      compiledArtifacts.map(async (file) => [
        file,
        hash(await readFile(path.join(output, file))),
      ]),
    ),
  );
  await writeFile(
    path.join(output, 'compile-metadata.json'),
    JSON.stringify(
      {
        ...sourceMetadata,
        inputSha256,
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
// production builds; compare saved reports when changing the bridge.
test.skipIf(process.env.BRIDGE_BENCHMARK !== '1')(
  'paired C and Hermes bridge performance with identical prepared SQL/state',
  async () => {
    await compile();
    const sqlite = await sqlite3InitModule();
    const raw = new sqlite.oo1.DB(':memory:');
    let fixture: Uint8Array;
    try {
      raw.exec('CREATE TABLE review_seed(value INTEGER)');
      fixture = sqlite.capi.sqlite3_js_db_export(raw.pointer!, 'main');
    } finally {
      raw.close();
    }
    const provenance = compileMetadata
      .passthrough()
      .parse(
        JSON.parse(
          await readFile(path.join(output, 'compile-metadata.json'), 'utf8'),
        ),
      );
    expect(
      provenance.workloadSha256,
      'Probe workload fingerprint differs from the compiled artifacts',
    ).toBe(await workloadHash());
    for (const [file, expectedHash] of Object.entries(
      provenance.artifactHashes,
    )) {
      expect(hash(await readFile(path.join(output, file)))).toBe(expectedHash);
    }
    const artifacts = ['current'];
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
        'envelope-0',
        'envelope-1024',
        'envelope-65536',
        'prepare',
        'sql-aggregate',
        'sql-join',
        'sql-sort',
        'numeric',
        'rows-numeric',
        'ascii',
        'rows-ascii',
        'unicode',
        'rows-unicode',
      ]) {
        const samples: number[][] = variants.map(() => []);
        const checksums: unknown[][] = variants.map(() => []);
        const envelope = kind.startsWith('envelope-');
        const rounds = kind === 'prepare' ? 1000 : 5;
        const repeats = kind === 'envelope-65536' ? 10 : envelope ? 1000 : 1;
        process.stdout.write(`Measuring bridge workload: ${kind}\n`);
        for (let sample = -warmups; sample < sampleCount; sample++) {
          for (let offset = 0; offset < variants.length; offset++) {
            const index = (offset + sample + warmups) % variants.length;
            const request = {
              kind: envelope ? 'envelope' : kind,
              rounds,
              ...(envelope
                ? { payload: 'x'.repeat(Number(kind.split('-')[1])) }
                : {}),
              facade: variants[index].endsWith('facade'),
            } as unknown as EngineRequest;
            const start = performance.now();
            let response: EngineResponse | undefined;
            for (let repeat = 0; repeat < repeats; repeat++) {
              response = engines[index].dispatch(request);
            }
            const elapsed = performance.now() - start;
            if (sample >= 0) {
              samples[index].push(elapsed);
            }
            checksums[index].push(response!.data);
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
        const samples: number[][] = [[], []];
        for (let sample = -warmups; sample < sampleCount; sample++) {
          for (let offset = 0; offset < 2; offset++) {
            const index = (offset + sample + warmups) % 2;
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
              p90Ms: summarize(samples[index], 10).p90Ms,
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
      const report: BenchmarkReport = {
        schemaVersion: 1,
        suite: 'bridge',
        metadata: {
          ...provenance,
          host: hostMetadata(),
          measuredAt: new Date().toISOString(),
          fixtureSha256: hash(fixture),
          profile,
          samples: sampleCount,
          warmups,
          notes: [
            'Synthetic Node bridge probes built at -O2; production engine uses a mixed optimization profile.',
            'C includes native bridge/SQLite work; Hermes adds FFI and JS, facade variants add schemas/object creation.',
            'SQL workloads return one scalar to minimize row materialization; timings still include dispatch.',
            'Envelope payload is request-only; C scans it and Hermes parses JSON.',
            'Numeric/text units are update/read pairs; row units are rows; SQL units are query executions.',
          ],
        },
        results: Object.fromEntries(
          Object.entries(results).flatMap(([kind, values]) =>
            Object.entries(values).map(([variant, value]) => {
              const operations =
                kind === 'envelope-65536'
                  ? 10
                  : kind.startsWith('snapshot')
                    ? 10
                    : kind.startsWith('envelope') || kind === 'prepare'
                      ? 1000
                      : kind.startsWith('sql-')
                        ? 5
                        : 5000;
              return [
                `${kind}/${variant}`,
                summarize(value.samplesMs, operations),
              ];
            }),
          ),
        ),
      };
      const reportPath =
        process.env.BRIDGE_BENCHMARK_OUTPUT ??
        path.join(
          packageRoot,
          'benchmarks/reports',
          `bridge-${new Date().toISOString().replaceAll(':', '-')}.json`,
        );
      await mkdir(path.dirname(reportPath), { recursive: true });
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      process.stdout.write(`Report: ${reportPath}\n`);
      if (process.env.BRIDGE_BENCHMARK_COMPARE) {
        const before = JSON.parse(
          await readFile(process.env.BRIDGE_BENCHMARK_COMPARE, 'utf8'),
        ) as BenchmarkReport;
        process.stdout.write(
          `${JSON.stringify(compareReports(before, report), null, 2)}\n`,
        );
      }
      await writeFile(
        path.join(output, 'metadata.json'),
        JSON.stringify(
          {
            ...provenance,
            measuredAt: new Date().toISOString(),
            fixtureSha256: hash(fixture),
            profile,
            samples: sampleCount,
            warmups,
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
