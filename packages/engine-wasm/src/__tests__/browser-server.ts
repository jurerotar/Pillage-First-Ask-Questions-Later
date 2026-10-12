import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Launch a disposable fixture server for the browser test, then close it even
// when browser assertions fail. No personal browser tabs or servers are used.
export const startBrowserServer = async (): Promise<() => void> => {
  const server = spawn(
    process.execPath,
    [fileURLToPath(new URL('./server.ts', import.meta.url))],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  try {
    await new Promise<void>((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(
        () => reject(new Error(`Browser server startup timed out: ${output}`)),
        60_000,
      );
      server.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      server.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`Browser server exited ${code}: ${output}`));
      });
      server.stderr.on('data', (chunk) => {
        output += chunk;
      });
      server.stdout.on('data', (chunk) => {
        output += chunk;
        if (output.includes('Verification at http://127.0.0.1:4179')) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
    return () => {
      server.kill();
    };
  } catch (error) {
    server.kill();
    throw error;
  }
};
