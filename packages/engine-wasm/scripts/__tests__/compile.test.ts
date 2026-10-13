import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { toolchainEnvironment } from '../toolchain';

const bash =
  process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const scripts = fileURLToPath(new URL('../', import.meta.url));

test('production stage wiring reuses objects, invalidates inputs and rejects unsafe native-only builds', async () => {
  const workspace = (
    await mkdtemp(path.join(tmpdir(), 'pillage-compile-pipeline-'))
  ).replaceAll('\\', '/');
  const packageRoot = `${workspace}/standalone-engine`;
  const output = `${packageRoot}/build/modular`;
  if (
    path.dirname(path.resolve(workspace)) !== path.resolve(tmpdir()) ||
    !path.basename(workspace).startsWith('pillage-compile-pipeline-')
  ) {
    throw new Error('Unexpected test workspace');
  }
  const bin =
    process.platform === 'win32'
      ? `${workspace.replace(/^([a-z]):/i, (_, drive: string) => `/${drive.toLowerCase()}`)}/bin`
      : `${workspace}/bin`;

  const file = async (name: string, content: string): Promise<void> => {
    await mkdir(path.dirname(name), { recursive: true });
    await writeFile(name, content);
  };

  const compile = (nativeOnly = false, fail = '', debug = false) => {
    const result = spawnSync(bash, ['-euo', 'pipefail'], {
      input: `export PATH='${bin}':"$PATH"\nbash '${packageRoot}/scripts/compile.sh' ${nativeOnly ? '--native-only' : ''} ${debug ? '--debug' : ''}`,
      env: { ...process.env, FAKE_FAIL_STAGE: fail },
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(result.error).toBeUndefined();
    return result;
  };

  try {
    // Relocate only the test copy's mount paths. Commands are fake compilers;
    // this exercises real production stage keys without touching shared builds.
    const source = await readFile(path.join(scripts, 'compile.sh'), 'utf8');
    await file(
      `${packageRoot}/scripts/compile.sh`,
      source.replaceAll('/toolchain/', `${workspace}/toolchain/`),
    );
    await file(
      `${packageRoot}/build/toolchain.env`,
      toolchainEnvironment().replace(
        /sqlite_sha256='[a-f0-9]+'/,
        `sqlite_sha256='${createHash('sha256').update('download').digest('hex')}'`,
      ),
    );
    await file(
      `${packageRoot}/scripts/cache.sh`,
      await readFile(path.join(scripts, 'cache.sh'), 'utf8'),
    );
    for (const name of ['engine', 'native', 'pump']) {
      await file(`${output}/${name}.js`, name);
    }
    await file(`${output}/sqlite3.c`, 'sqlite source');
    await file(`${output}/sqlite3.h`, '#define SQLITE_VERSION "3.53.4"');
    for (const name of [
      'runtime.c',
      'sqlite-bridge.c',
      'serial-executor.cpp',
      'text-bindings.cpp',
    ]) {
      await file(`${packageRoot}/native/${name}`, name);
    }
    for (const name of [
      'hermes-clean/include',
      'hermes-clean/external/llvh/include',
      'hermes-clean/API',
      'hermes-clean/public',
      'hermes-clean/external/llvh/gen/include',
      'wasm-6.0.12/lib/config',
      'wasm-6.0.12/external/llvh/include',
    ]) {
      await file(`${workspace}/toolchain/${name}/header.h`, name);
    }
    for (const name of [
      'tools/shermes/libshermes_console_a.a',
      'lib/libhermesvm_a.a',
      'jsi/libjsi.a',
    ]) {
      await file(`${workspace}/toolchain/wasm-6.0.12/${name}`, name);
    }

    const compiler = `#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = '--version' ]; then echo compiler-v1; exit; fi
args=("$@")
for ((i=0; i<\${#args[@]}; i++)); do
  if [ "\${args[i]}" = '-o' ]; then
    output="\${args[i+1]}"
    printf '%s\\n' "$*" > "$output"
    for input in "$@"; do
      if [ -f "$input" ] && [ "$input" != "$output" ]; then cat "$input" >> "$output"; fi
    done
    if [ "\${FAKE_FAIL_STAGE:-}" = "$output" ]; then exit 7; fi
    if [[ "$output" = *.mjs ]]; then printf wasm > "\${output%.mjs}.wasm"; fi
    exit
  fi
done
exit 9
`;
    for (const name of [
      `${workspace}/bin/emcc`,
      `${workspace}/bin/em++`,
      `${workspace}/toolchain/host-clean/bin/shermes`,
    ]) {
      await file(name, compiler);
      await chmod(name, 0o755);
    }
    await file(
      `${workspace}/bin/curl`,
      '#!/usr/bin/env bash\nprintf download > sqlite.zip\n',
    );
    await file(
      `${workspace}/bin/unzip`,
      '#!/usr/bin/env bash\nprintf refreshed-sqlite > sqlite3.c\nprintf \'#define SQLITE_VERSION "3.53.4"\' > sqlite3.h\n',
    );
    await chmod(`${workspace}/bin/curl`, 0o755);
    await chmod(`${workspace}/bin/unzip`, 0o755);

    const initial = compile();
    expect(initial.status, initial.stderr).toBe(0);
    expect(initial.stdout).toContain('Building engine-o');
    expect(initial.stdout).toContain('Building sqlite-o');

    const unchanged = compile();
    expect(unchanged.status, unchanged.stderr).toBe(0);
    expect(unchanged.stdout).not.toContain('Building ');
    expect(compile(true).status).toBe(0);

    const debug = compile(true, '', true);
    expect(debug.status, debug.stderr).toBe(0);
    expect(debug.stdout.match(/^Building .+$/gm)).toEqual(['Building link']);
    expect(await readFile(`${output}/engine.mjs`, 'utf8')).toContain(' -g2 ');

    const repeatedDebug = compile(false, '', true);
    expect(repeatedDebug.status, repeatedDebug.stderr).toBe(0);
    expect(repeatedDebug.stdout).not.toContain('Building ');

    const release = compile(true);
    expect(release.status, release.stderr).toBe(0);
    expect(release.stdout.match(/^Building .+$/gm)).toEqual(['Building link']);
    expect(await readFile(`${output}/engine.mjs`, 'utf8')).toContain(' -g0 ');
    expect(compile().stdout).not.toContain('Building ');

    await file(`${packageRoot}/native/sqlite-bridge.c`, 'bridge changed');
    const bridge = compile(true);
    expect(bridge.status, bridge.stderr).toBe(0);
    expect(bridge.stdout).toContain('Building sqlite-bridge-o');
    expect(bridge.stdout).toContain('Cached engine-o');
    expect(bridge.stdout).toContain('Cached sqlite-o');
    expect(bridge.stdout).toContain('Building link');

    await file(`${output}/engine.js`, 'api changed');
    const unsafe = compile(true);
    expect(unsafe.status).toBe(1);
    expect(unsafe.stderr).toContain('Engine bundle changed');
    expect(unsafe.stdout).not.toContain('Building ');

    const published = await readFile(`${packageRoot}/build/engine.mjs`, 'utf8');
    const failure = compile(false, 'engine.o');
    expect(failure.status).toBe(7);
    expect(await readFile(`${packageRoot}/build/engine.mjs`, 'utf8')).toBe(
      published,
    );
    expect(compile().status).toBe(0);

    await rm(`${output}/engine.o`);
    const missing = compile(true);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain(
      'Engine compiler, headers or artifacts changed',
    );
    expect(missing.stdout).not.toContain('Building ');
    expect(compile().status).toBe(0);

    await file(
      `${workspace}/toolchain/hermes-clean/include/header.h`,
      'new header',
    );
    const headers = compile(true);
    expect(headers.status).toBe(1);
    expect(headers.stderr).toContain(
      'Engine compiler, headers or artifacts changed',
    );
    expect(headers.stdout).not.toContain('Building ');
    expect(compile().status).toBe(0);

    await file(`${output}/sqlite3.h`, '#define SQLITE_VERSION "3.52.0"');
    const sqlite = compile();
    expect(sqlite.status, sqlite.stderr).toBe(0);
    expect(sqlite.stdout).toContain('Building sqlite-o');
    expect(sqlite.stdout).toContain('Cached engine-o');
    expect(await readFile(`${output}/sqlite3.h`, 'utf8')).toContain('3.53.4');

    await file(
      `${workspace}/toolchain/wasm-6.0.12/lib/libhermesvm_a.a`,
      'runtime library changed',
    );
    const runtime = compile();
    expect(runtime.status, runtime.stderr).toBe(0);
    expect(runtime.stdout).toContain('Building link');
    expect(runtime.stdout).toContain('Cached engine-o');

    await file(
      `${workspace}/toolchain/host-clean/bin/shermes`,
      `${compiler}\n# compiler changed\n`,
    );
    const compilerChange = compile(true);
    expect(compilerChange.status).toBe(1);
    expect(compilerChange.stderr).toContain(
      'Engine compiler, headers or artifacts changed',
    );
    expect(compilerChange.stdout).not.toContain('Building ');
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
