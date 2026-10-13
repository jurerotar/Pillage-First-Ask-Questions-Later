import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const started = performance.now();
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'output-prefix': { type: 'string' },
    compare: { type: 'string' },
    quick: { type: 'boolean', default: false },
    suite: { type: 'string' },
  },
  allowPositionals: false,
  strict: true,
});
const prefix = path.resolve(
  values['output-prefix'] ??
    path.join(
      root,
      'benchmarks/reports',
      new Date().toISOString().replaceAll(':', '-'),
    ),
);
const comparePrefix =
  values.compare === undefined ? undefined : path.resolve(values.compare);
const suites =
  values.suite === undefined ? ['engine', 'bridge', 'browser'] : [values.suite];
if (suites.some((suite) => !['engine', 'bridge', 'browser'].includes(suite))) {
  throw new Error('Use --suite engine, bridge or browser');
}
if (comparePrefix !== undefined) {
  await Promise.all(
    suites.map((suite) => access(`${comparePrefix}-${suite}.json`)),
  );
}

const run = async (
  script: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<void> => {
  const scriptStarted = performance.now();
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script), ...args], {
      cwd: root,
      env,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${script} exited ${code}`)),
    );
  });
  process.stdout.write(
    `${script}: ${((performance.now() - scriptStarted) / 1000).toFixed(1)}s\n`,
  );
};

await run('scripts/build.ts', [], process.env);
for (const suite of suites) {
  process.stdout.write(`Running ${suite} benchmark\n`);
  const output = `${prefix}-${suite}.json`;
  const compare =
    comparePrefix === undefined ? undefined : `${comparePrefix}-${suite}.json`;
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.BRIDGE_BENCHMARK_COMPARE;
  delete env.BROWSER_BENCHMARK_COMPARE;
  // Keep every suite on the same measurement profile.
  env.BENCHMARK_PROFILE = values.quick ? 'quick' : 'full';
  env.BROWSER_BENCHMARK_SAMPLES = values.quick ? '3' : '15';
  env.BROWSER_BENCHMARK_WARMUPS = values.quick ? '1' : '3';
  if (suite === 'engine') {
    const args = ['--output', output];
    if (values.quick) {
      args.push('--quick');
    }
    if (compare !== undefined) {
      args.push('--compare', compare);
    }
    await run('benchmarks/engine.ts', args, env);
  } else {
    const namespace = suite === 'bridge' ? 'BRIDGE' : 'BROWSER';
    env[`${namespace}_BENCHMARK_OUTPUT`] = output;
    if (compare !== undefined) {
      env[`${namespace}_BENCHMARK_COMPARE`] = compare;
    }
    await run(`benchmarks/${suite}.ts`, [], env);
  }
}
process.stdout.write(
  `Reports: ${prefix}-{${suites.join(',')}}.json\nTotal: ${((performance.now() - started) / 1000).toFixed(1)}s\n`,
);
