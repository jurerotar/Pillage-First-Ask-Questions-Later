import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withBuildLock } from './build-lock.ts';
import {
  dockerImage,
  dockerMounts,
  packageRoot,
  prepareToolchain,
} from './toolchain.ts';

for (const argument of process.argv.slice(2)) {
  if (!['--toolchain', '--native-only', '--debug'].includes(argument)) {
    throw new Error(`Unsupported build option: ${argument}`);
  }
}

const command = (file: string, args: string[]) => {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(file, args, { cwd: packageRoot, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${file} exited ${code}`)),
    );
  });
};

await withBuildLock(path.join(packageRoot, 'build'), async () => {
  await prepareToolchain();
  await command(process.execPath, [
    fileURLToPath(new URL('./bundle.ts', import.meta.url)),
  ]);

  if (process.argv.includes('--toolchain')) {
    await command('docker', [
      'run',
      '--rm',
      ...dockerMounts,
      dockerImage,
      'bash',
      '/package/scripts/bootstrap.sh',
    ]);
  }

  await command('docker', [
    'run',
    '--rm',
    ...dockerMounts,
    dockerImage,
    'bash',
    '/package/scripts/compile.sh',
    ...(process.argv.includes('--native-only') ? ['--native-only'] : []),
    ...(process.argv.includes('--debug') ? ['--debug'] : []),
  ]);
});
