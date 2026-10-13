import { expect, test } from 'vitest';
import { type BenchmarkReport, compareReports, summarize } from '../report';

test('summaries use an interpolated median and nearest-rank p90 without mutating samples', () => {
  const samples = [4, 1, 3, 2];
  expect(summarize(samples, 10)).toEqual({
    operations: 10,
    samplesMs: samples,
    medianMs: 2.5,
    p90Ms: 4,
    minMs: 1,
    maxMs: 4,
    medianUsPerOperation: 250,
  });
  expect(samples).toEqual([4, 1, 3, 2]);
  expect(() => summarize([], 1)).toThrow();
  expect(() => summarize([Number.NaN], 1)).toThrow();
  expect(() => summarize([1], 0)).toThrow();
});

test('comparisons allow artifact changes but reject fixture/workload or operation changes', () => {
  const before: BenchmarkReport = {
    schemaVersion: 1,
    suite: 'engine',
    metadata: {
      fixtureSha256: 'fixture',
      workloadSha256: 'workload',
      artifactHashes: { wasm: 'old' },
    },
    results: { query: summarize([10, 11, 12], 1) },
  };
  const after: BenchmarkReport = {
    ...before,
    metadata: { ...before.metadata, artifactHashes: { wasm: 'new' } },
    results: { query: summarize([5, 5.5, 6], 1) },
  };
  expect(compareReports(before, after)[0].changePercent).toBe(-50);
  expect(() =>
    compareReports(before, {
      ...after,
      metadata: { ...after.metadata, fixtureSha256: 'different' },
    }),
  ).toThrow();
  expect(() =>
    compareReports(before, { ...after, results: { query: summarize([1], 2) } }),
  ).toThrow();
});
