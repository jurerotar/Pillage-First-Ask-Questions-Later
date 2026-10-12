import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const bash =
  process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const helper = fileURLToPath(
  new URL('../cache.sh', import.meta.url),
).replaceAll('\\', '/');

const run = async (script: string): Promise<string> => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'pillage-build-cache-'));
  if (
    path.dirname(workspace) !== path.resolve(tmpdir()) ||
    !path.basename(workspace).startsWith('pillage-build-cache-')
  ) {
    throw new Error('Unexpected test workspace');
  }

  try {
    const result = spawnSync(bash, ['-euo', 'pipefail'], {
      cwd: workspace,
      input: `source '${helper.replaceAll("'", "'\\''")}'\n${script}`,
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    return await readFile(path.join(workspace, 'executions'), 'utf8');
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
};

test('reuses unchanged stages and invalidates changed input, flags and tools', async () => {
  const executions = await run(`
    printf api > engine.js
    printf sqlite > sqlite.c
    compile() { printf '%s\\n' "$1" >> executions; cp "$2" "$3"; }
    build() {
      cache_run engine "$(cache_key "$1" engine.js)" engine.o -- compile engine engine.js engine.o
      cache_run sqlite "$(cache_key "$1" sqlite.c)" sqlite.o -- compile sqlite sqlite.c sqlite.o
    }
    build 'compiler-v1 -O2'
    build 'compiler-v1 -O2'
    printf changed >> engine.js
    build 'compiler-v1 -O2'
    build 'compiler-v1 -O3'
    build 'compiler-v2 -O3'
  `);
  expect(executions.trim().split('\n')).toEqual([
    'engine',
    'sqlite',
    'engine',
    'engine',
    'sqlite',
    'engine',
    'sqlite',
  ]);
});

test('checks all linked artifacts and rebuilds damaged or missing output', async () => {
  const executions = await run(`
    printf object > input.o
    link() { printf 'link\\n' >> executions; cp input.o engine.mjs; cp input.o engine.wasm; }
    build() { cache_run link "$(cache_key flags input.o)" engine.mjs engine.wasm -- link; }
    build
    build
    printf damaged > engine.wasm
    build
    rm engine.mjs
    build
  `);
  expect(executions.trim().split('\n')).toEqual(['link', 'link', 'link']);
});

test('failed stages never commit input hashes and damaged output cannot be reused', async () => {
  const executions = await run(`
    printf original > input.c
    compile() { printf 'compile\\n' >> executions; cp input.c output.o; }
    fail() { printf 'failure\\n' >> executions; printf incomplete > output.o; return 7; }
    original=$(cache_key flags input.c)
    cache_run object "$original" output.o -- compile
    printf changed > input.c
    changed=$(cache_key flags input.c)
    if cache_run object "$changed" output.o -- fail; then exit 10; fi
    [ "$(head -n 1 .cache/object.sha256)" = "$original" ]
    if cache_valid object "$original" output.o; then exit 11; fi
    cache_run object "$changed" output.o -- compile
    cache_run object "$changed" output.o -- compile
  `);
  expect(executions.trim().split('\n')).toEqual([
    'compile',
    'failure',
    'compile',
  ]);
});

test('included header and runtime library contents invalidate fingerprints', async () => {
  const executions = await run(`
    printf source > input.c
    printf header > included.h
    printf library > runtime.a
    compile() { printf 'compile\\n' >> executions; cp input.c output.o; }
    build() { cache_run object "$(cache_key options input.c included.h runtime.a)" output.o -- compile; }
    build
    printf changed >> included.h
    build
    printf changed >> runtime.a
    build
  `);
  expect(executions.trim().split('\n')).toEqual([
    'compile',
    'compile',
    'compile',
  ]);
});
