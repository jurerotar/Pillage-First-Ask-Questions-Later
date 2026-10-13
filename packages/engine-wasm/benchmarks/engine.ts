import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import setup from '../src/__tests__/setup.ts';
import type { EngineRequest } from '../src/core.ts';
import {
  type BenchmarkReport,
  compareReports,
  hostMetadata,
  summarize,
} from './report.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const options: Record<string, string> = {};
for (let i = 0; i < args.length; i += 2) {
  if (
    !['--samples', '--warmups', '--output', '--compare'].includes(args[i]) ||
    !args[i + 1]
  ) {
    throw new Error(
      'Usage: benchmarks/engine.ts [--samples 15] [--warmups 3] [--output report.json] [--compare baseline.json]',
    );
  }
  options[args[i]] = args[i + 1];
}
const samples = Number(options['--samples'] ?? 15);
const warmups = Number(options['--warmups'] ?? 3);
if (
  !Number.isInteger(samples) ||
  samples < 3 ||
  !Number.isInteger(warmups) ||
  warmups < 1
) {
  throw new Error('Use at least 3 samples and 1 warmup');
}
const hash = (bytes: string | Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');
// Seeding uses Date.now in several tables. Freeze only fixture preparation,
// never elapsed time or the production Wasm runtime.
const now = Date.now;
try {
  Date.now = () => 1700000000000;
  await setup();
} finally {
  Date.now = now;
}
const { open, execute, inspect } = await import('../build/baseline.mjs');
const { createEngine } = await import('../build/client.mjs');
const { default: factory } = await import('../build/engine.mjs');
const fixture = new Uint8Array(
  await readFile(path.join(root, 'build/fixture.sqlite3')),
);
const results: BenchmarkReport['results'] = {};
type Engine = Awaited<ReturnType<typeof createEngine>>;
const measure = async (
  name: string,
  operations: number,
  run: () => unknown | Promise<unknown>,
) => {
  const times: number[] = [];
  for (let i = -warmups; i < samples; i++) {
    const start = performance.now();
    await run();
    if (i >= 0) {
      times.push(performance.now() - start);
    }
  }
  results[name] = summarize(times, operations);
};
await measure('startup/warm-module', 1, async () => {
  const engine = await createEngine(fixture, factory);
  engine.close();
});
const engine = await createEngine(fixture, factory);
const baseline = await open(fixture);
const requests: EngineRequest[] = [
  { type: 'request', url: '/server', method: 'GET' },
  { type: 'request', url: '/developer-settings', method: 'GET' },
  { type: 'request', url: '/villages/1/events', method: 'GET' },
];
try {
  for (const request of requests) {
    assert.deepEqual(
      engine.dispatch(request).data,
      execute(baseline.database, request),
    );
    await measure(
      `controller${request.type === 'request' ? request.url : ''}`,
      100,
      () => {
        for (let i = 0; i < 100; i++) {
          engine.dispatch(request);
        }
      },
    );
  }
  const snapshot = engine.snapshot();
  const saved = await open(snapshot);
  try {
    assert.deepEqual(inspect(saved.database), inspect(baseline.database));
  } finally {
    saved.close();
  }
  await measure(`snapshot/${snapshot.length}-bytes`, 10, () => {
    for (let i = 0; i < 10; i++) {
      engine.snapshot();
    }
  });
} finally {
  engine.close();
  baseline.close();
}

// Verify scheduler state outside timing, including history (timestamps vary).
const normalize = (value: ReturnType<typeof inspect>) => ({
  ...value,
  trainingHistory: value.trainingHistory.map(
    ({ timestamp: _timestamp, ...row }) => row,
  ),
});
for (const limit of [1, 100, 1000]) {
  for (const notifications of [false, true]) {
    const times: number[] = [];
    const request = {
      type: 'advance' as const,
      now: 1700001000000,
      limit,
      notifications,
    };
    for (let i = -warmups; i < samples; i++) {
      let fresh: Engine | undefined;
      const reference = await open(fixture);
      try {
        fresh = await createEngine(fixture, factory);
        const expected = execute(reference.database, request);
        const start = performance.now();
        const response = fresh.dispatch(request);
        const elapsed = performance.now() - start;
        assert.deepEqual(response.data, expected);
        assert.equal((response.data as { processed: number }).processed, limit);
        assert.equal(response.notifications.length, notifications ? limit : 0);
        const saved = await open(fresh.snapshot());
        try {
          assert.deepEqual(
            normalize(inspect(saved.database)),
            normalize(inspect(reference.database)),
          );
        } finally {
          saved.close();
        }
        if (i >= 0) {
          times.push(elapsed);
        }
      } finally {
        fresh?.close();
        reference.close();
      }
    }
    results[`scheduler/${limit}/notifications-${notifications}`] = summarize(
      times,
      limit,
    );
  }
}

const wasm = await readFile(path.join(root, 'build/engine.wasm'));
const artifactHashes: Record<string, string> = {};
for (const file of [
  'engine.wasm',
  'engine.mjs',
  'client.mjs',
  'baseline.mjs',
]) {
  artifactHashes[file] = hash(await readFile(path.join(root, 'build', file)));
}
const report: BenchmarkReport = {
  schemaVersion: 1,
  suite: 'engine',
  metadata: {
    measuredAt: new Date().toISOString(),
    host: hostMetadata(),
    samples,
    warmups,
    fixtureSha256: hash(fixture),
    fixtureBytes: fixture.length,
    workloadSha256: hash(await readFile(fileURLToPath(import.meta.url))),
    artifactHashes,
    gitRevision: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    gitStatus: execFileSync('git', ['status', '--porcelain'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    moduleBytes: {
      raw: wasm.length,
      gzip: gzipSync(wasm).length,
      brotli: brotliCompressSync(wasm).length,
    },
    notes: [
      'Node in-process measurements; excludes worker messaging and OPFS.',
      'Startup includes factory/init/close after warmup; excludes cold process/import/compilation.',
      'Controller and snapshot samples reuse an engine; scheduler samples use fresh fixture copies.',
      'Build the engine before benchmarking; hashes identify measured artifacts, not source freshness.',
    ],
  },
  results,
};
const output = path.resolve(
  options['--output'] ??
    path.join(
      root,
      'benchmarks/reports',
      `engine-${new Date().toISOString().replaceAll(':', '-')}.json`,
    ),
);
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(
  `${JSON.stringify(
    Object.entries(results).map(([name, result]) => ({
      name,
      medianMs: result.medianMs,
      p90Ms: result.p90Ms,
      usPerOperation: result.medianUsPerOperation,
    })),
    null,
    2,
  )}\nReport: ${output}\n`,
);
if (options['--compare']) {
  const before = JSON.parse(
    await readFile(path.resolve(options['--compare']), 'utf8'),
  ) as BenchmarkReport;
  process.stdout.write(
    `${JSON.stringify(compareReports(before, report), null, 2)}\n`,
  );
}
