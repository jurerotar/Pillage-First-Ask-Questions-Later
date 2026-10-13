import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, test } from 'vitest';
import { dockerImage } from '../../scripts/toolchain';

test.each(['missing', 'stale'])(
  'native-only refuses a %s engine hash before compilation',
  async (hash) => {
    // Isolate the guard from real build outputs and disable network access. It must
    // reject the stale/missing object before looking for SQLite or any compiler.
    const workspace = await mkdtemp(
      path.join(tmpdir(), 'pillage-native-guard-'),
    );
    if (
      path.dirname(workspace) !== path.resolve(tmpdir()) ||
      !path.basename(workspace).startsWith('pillage-native-guard-')
    ) {
      throw new Error('Unexpected test workspace');
    }
    try {
      const output = path.join(workspace, 'build/modular');
      await mkdir(output, { recursive: true });
      await mkdir(path.join(workspace, 'scripts'));
      await writeFile(path.join(output, 'engine.js'), 'changed engine');
      if (hash === 'stale') {
        await writeFile(
          path.join(output, 'engine-source.sha256'),
          `${'0'.repeat(64)}  engine.js\n`,
        );
      }
      await writeFile(
        path.join(workspace, 'scripts/compile.sh'),
        await readFile(new URL('../../scripts/compile.sh', import.meta.url)),
      );
      const result = spawnSync(
        'docker',
        [
          'run',
          '--rm',
          '--network=none',
          '--mount',
          `type=bind,source=${workspace},target=/workspace`,
          dockerImage,
          'bash',
          '/workspace/scripts/compile.sh',
          '--native-only',
        ],
        { encoding: 'utf8', timeout: 30_000 },
      );
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'Engine bundle changed; run a full build before --native-only.',
      );
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  },
);
