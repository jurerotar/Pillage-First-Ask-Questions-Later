import { cpus, platform, release } from 'node:os';

export type Measurement = {
  operations: number;
  samplesMs: number[];
  medianMs: number;
  p90Ms: number;
  minMs: number;
  maxMs: number;
  medianUsPerOperation: number;
};

export const summarize = (
  samplesMs: number[],
  operations: number,
): Measurement => {
  if (
    !samplesMs.length ||
    samplesMs.some((n) => !Number.isFinite(n) || n < 0) ||
    !Number.isInteger(operations) ||
    operations < 1
  ) {
    throw new Error('Invalid benchmark samples or operation count');
  }
  const sorted = [...samplesMs].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  return {
    operations,
    samplesMs,
    medianMs,
    p90Ms: sorted[Math.ceil(sorted.length * 0.9) - 1],
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    medianUsPerOperation: (medianMs * 1000) / operations,
  };
};

export const hostMetadata = () => ({
  node: process.version,
  platform: platform(),
  release: release(),
  arch: process.arch,
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
});

export type BenchmarkReport = {
  schemaVersion: 1;
  suite: string;
  metadata: Record<string, unknown>;
  results: Record<string, Measurement>;
};

export const compareReports = (
  before: BenchmarkReport,
  after: BenchmarkReport,
) => {
  if (
    before.schemaVersion !== 1 ||
    after.schemaVersion !== 1 ||
    before.suite !== after.suite
  ) {
    throw new Error(
      'Cannot compare different benchmark suites or report schemas',
    );
  }
  for (const key of ['fixtureSha256', 'workloadSha256']) {
    if (before.metadata[key] !== after.metadata[key]) {
      throw new Error(`Cannot compare changed ${key}; create a new baseline`);
    }
  }
  return Object.entries(after.results).map(([name, current]) => {
    const previous = before.results[name];
    if (!previous || previous.operations !== current.operations) {
      throw new Error(`Missing or incompatible baseline workload: ${name}`);
    }
    return {
      name,
      beforeMs: previous.medianMs,
      afterMs: current.medianMs,
      changePercent:
        previous.medianMs === 0
          ? null
          : (current.medianMs / previous.medianMs - 1) * 100,
    };
  });
};
