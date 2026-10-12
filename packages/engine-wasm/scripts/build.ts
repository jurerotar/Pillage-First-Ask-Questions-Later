import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBuildLock } from './build-lock.ts';

for (const argument of process.argv.slice(2)) {
  if (!['--toolchain', '--native-only', '--debug'].includes(argument)) {
    throw new Error(`Unsupported build option: ${argument}`);
  }
}

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

const command = (file: string, args: string[]) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(file, args, { cwd: workspace, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`)),
    );
  });
};

const mounts = [
  '--mount',
  'type=volume,source=pillage-wasm-toolchain,target=/toolchain',
  '--mount',
  `type=bind,source=${workspace},target=/workspace`,
];

await withBuildLock(
  path.join(workspace, 'packages/engine-wasm/build'),
  async () => {
    await command(process.execPath, ['packages/engine-wasm/scripts/bundle.ts']);

    if (process.argv.includes('--toolchain')) {
      await command('docker', [
        'run',
        '--rm',
        ...mounts,
        'emscripten/emsdk:6.0.12',
        'bash',
        '/workspace/packages/engine-wasm/scripts/bootstrap.sh',
      ]);
    }

    await command('docker', [
      'run',
      '--rm',
      ...mounts,
      'emscripten/emsdk:6.0.12',
      'bash',
      '/workspace/packages/engine-wasm/scripts/compile.sh',
      ...(process.argv.includes('--native-only') ? ['--native-only'] : []),
      ...(process.argv.includes('--debug') ? ['--debug'] : []),
    ]);
  },
);
