import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Browser, chromium } from 'playwright';
import { startBrowserServer } from '../src/__tests__/browser-server.ts';
import setup from '../src/__tests__/setup.ts';
import {
  type BenchmarkReport,
  compareReports,
  hostMetadata,
  summarize,
} from './report.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const samples = Number(process.env.BROWSER_BENCHMARK_SAMPLES ?? 15);
const warmups = Number(process.env.BROWSER_BENCHMARK_WARMUPS ?? 3);
assert.ok(
  Number.isInteger(samples) &&
    samples >= 3 &&
    Number.isInteger(warmups) &&
    warmups >= 1,
);
const originalNow = Date.now;
try {
  Date.now = () => 1700000000000;
  await setup();
} finally {
  Date.now = originalNow;
}
const { open } = await import('../build/baseline.mjs');
const seed = await open(
  new Uint8Array(await readFile(path.join(root, 'build/fixture.sqlite3'))),
);
let fixture: Uint8Array;
try {
  // Keep the 1000-event response, but prevent automatic scheduling during reads.
  seed.raw.exec('UPDATE events SET starts_at=4102444800000');
  // Write triggers use SQLite's clock, independently of the frozen JS seed time.
  seed.raw.exec('UPDATE meta SET last_write=1700000000');
  fixture = seed.database.serialize();
} finally {
  seed.close();
}
await writeFile(path.join(root, 'build/browser-benchmark.sqlite3'), fixture);
const stopServer = await startBrowserServer();
let browser: Browser | undefined;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Serve a blank same-origin harness instead of starting the verification page.
  await page.route('http://127.0.0.1:4179/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Engine benchmarks</title>',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    }),
  );
  await page.goto('http://127.0.0.1:4179/');
  const measured = await page.evaluate(
    async ({ samples, warmups }) => {
      const bytes = new Uint8Array(
        await (await fetch('/browser-benchmark.sqlite3')).arrayBuffer(),
      );
      const slug = 'wasm-benchmark';
      const seedWorker = new Worker('/seed.mjs', { type: 'module' });
      try {
        await new Promise<void>((resolve, reject) => {
          seedWorker.onmessage = ({ data }) =>
            data.error ? reject(new Error(data.error)) : resolve();
          seedWorker.onerror = reject;
          seedWorker.postMessage({ slug, bytes }, [bytes.buffer]);
        });
      } finally {
        seedWorker.terminate();
      }
      const timings: Record<
        string,
        { operations: number; samplesMs: number[] }
      > = {};
      const record = (
        name: string,
        elapsed: number,
        iteration: number,
        operations = 1,
      ) => {
        timings[name] ??= { operations, samplesMs: [] };
        if (iteration >= 0) {
          timings[name].samplesMs.push(elapsed);
        }
      };
      for (let iteration = -warmups; iteration < samples; iteration++) {
        const start = performance.now();
        const worker = new Worker(`/worker.mjs?server-slug=${slug}`, {
          type: 'module',
        });
        const notifications = new MessageChannel();
        const waitFor = (
          predicate: (data: Record<string, unknown>) => boolean,
        ) =>
          new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Worker benchmark timed out')),
              60000,
            );
            notifications.port1.onmessage = ({ data }) => {
              if (
                data.eventKey === 'event:error' ||
                data.eventKey === 'event:database-initialization-error'
              ) {
                clearTimeout(timeout);
                reject(new Error(JSON.stringify(data)));
              } else if (predicate(data)) {
                clearTimeout(timeout);
                resolve();
              }
            };
          });
        const request = (url: string, method = 'GET', body?: unknown) =>
          new Promise<unknown>((resolve, reject) => {
            const channel = new MessageChannel();
            const timeout = setTimeout(() => {
              channel.port1.close();
              reject(new Error('Request timed out'));
            }, 60000);
            channel.port1.onmessage = ({ data }) => {
              clearTimeout(timeout);
              channel.port1.close();
              if (data.error) {
                reject(new Error(JSON.stringify(data)));
              } else {
                resolve(data.data);
              }
            };
            worker.postMessage({ type: 'WORKER_MESSAGE', url, method, body }, [
              channel.port2,
            ]);
          });
        try {
          const ready = waitFor(
            (data) => data.eventKey === 'event:database-initialization-success',
          );
          worker.postMessage({ type: 'WORKER_INIT' }, [notifications.port2]);
          await ready;
          record('worker/open-opfs', performance.now() - start, iteration);
          const persisted = (await request('/developer-settings')) as {
            isFreeHuntingPartiesEnabled: boolean;
          };
          if (iteration > -warmups && !persisted.isFreeHuntingPartiesEnabled) {
            throw new Error('OPFS save did not survive reopening');
          }
          for (const url of [
            '/server',
            '/villages/1/events',
            '/server/database',
          ]) {
            const requestStart = performance.now();
            for (let repeat = 0; repeat < 10; repeat++) {
              const result = await request(url);
              if (
                url === '/server/database' &&
                (!(result instanceof Uint8Array) || !result.length)
              ) {
                throw new Error('Snapshot transfer failed');
              }
            }
            record(
              `worker/request${url}`,
              performance.now() - requestStart,
              iteration,
              10,
            );
          }
          await request(
            '/developer-settings/isFreeHuntingPartiesEnabled',
            'PATCH',
            { value: true },
          );
          const closeStart = performance.now();
          const closed = waitFor(
            (data) => data.type === 'WORKER_CLOSE_SUCCESS',
          );
          worker.postMessage({ type: 'WORKER_CLOSE' });
          await closed;
          record(
            'worker/save-and-close-opfs',
            performance.now() - closeStart,
            iteration,
          );
        } finally {
          worker.terminate();
          notifications.port1.close();
        }
      }
      return { timings, userAgent: navigator.userAgent };
    },
    { samples, warmups },
  );
  const hash = (bytes: Uint8Array) =>
    createHash('sha256').update(bytes).digest('hex');
  const artifactHashes: Record<string, string> = {};
  for (const filename of [
    'engine.wasm',
    'engine.mjs',
    'worker.mjs',
    'seed.mjs',
  ]) {
    artifactHashes[filename] = hash(
      await readFile(path.join(root, 'build', filename)),
    );
  }
  const report: BenchmarkReport = {
    schemaVersion: 1,
    suite: 'browser',
    metadata: {
      measuredAt: new Date().toISOString(),
      host: hostMetadata(),
      browser: browser.version(),
      userAgent: measured.userAgent,
      samples,
      warmups,
      profile: process.env.BENCHMARK_PROFILE ?? 'full',
      fixtureSha256: hash(fixture),
      workloadSha256: hash(await readFile(fileURLToPath(import.meta.url))),
      artifactHashes,
      notes: [
        'Disposable Chromium profile; localhost, real worker messages and OPFS.',
        'Open measures worker startup, OPFS load and engine init; excludes first cold warmup.',
        'Save includes snapshot, backup and replacement OPFS writes and worker close.',
        'Events are scheduled in 2100 to avoid background scheduler interference.',
      ],
    },
    results: Object.fromEntries(
      Object.entries(measured.timings).map(([name, value]) => [
        name,
        summarize(value.samplesMs, value.operations),
      ]),
    ),
  };
  const output =
    process.env.BROWSER_BENCHMARK_OUTPUT ??
    path.join(
      root,
      'benchmarks/reports',
      `browser-${new Date().toISOString().replaceAll(':', '-')}.json`,
    );
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify(report.results, null, 2)}\nReport: ${output}\n`,
  );
  if (process.env.BROWSER_BENCHMARK_COMPARE) {
    const before = JSON.parse(
      await readFile(process.env.BROWSER_BENCHMARK_COMPARE, 'utf8'),
    ) as BenchmarkReport;
    process.stdout.write(
      `${JSON.stringify(compareReports(before, report), null, 2)}\n`,
    );
  }
} finally {
  try {
    await browser?.close();
  } finally {
    stopServer();
  }
}
