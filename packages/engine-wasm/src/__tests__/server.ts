import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const output = path.join(root, 'build');
const { version } = JSON.parse(
  await readFile(new URL('../../../../package.json', import.meta.url), 'utf8'),
) as { version: string };
const sqlPlugin: import('esbuild').Plugin = {
  name: 'sql-raw',
  setup(builder) {
    builder.onResolve({ filter: /\.sql\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.slice(0, -4)),
      namespace: 'sql',
    }));
    builder.onLoad({ filter: /.*/, namespace: 'sql' }, async (args) => ({
      contents: `export default ${JSON.stringify(await readFile(args.path, 'utf8'))}`,
      loader: 'js',
    }));
  },
};
await build({
  entryPoints: [path.join(root, 'src/__tests__/fixtures/browser-worker.ts')],
  outfile: path.join(output, 'worker.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  plugins: [
    sqlPlugin,
    {
      name: 'generated-engine',
      setup(builder) {
        builder.onResolve({ filter: /build\/engine\.mjs$/ }, () => ({
          path: './engine.mjs',
          external: true,
        }));
      },
    },
  ],
  define: {
    'import.meta.env': JSON.stringify({
      VERSION: version,
      DEV: false,
      PROD: true,
      MODE: 'wasm',
    }),
  },
});
await build({
  entryPoints: [path.join(root, 'src/__tests__/fixtures/browser-seed.ts')],
  outfile: path.join(output, 'seed.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
});
await copyFile(
  fileURLToPath(import.meta.resolve('@sqlite.org/sqlite-wasm/sqlite3.wasm')),
  path.join(output, 'sqlite3.wasm'),
);
await copyFile(
  path.join(
    path.dirname(fileURLToPath(import.meta.resolve('@sqlite.org/sqlite-wasm'))),
    'index.mjs',
  ),
  path.join(output, 'sqlite-browser.mjs'),
);
await writeFile(
  path.join(output, 'index.html'),
  `<!doctype html><title>Compiled engine persistence verification</title><pre id="result">Running…</pre><script type="module">
const slug = 'wasm-verification-' + Date.now();
const report = { slug, status: 'running' }; window.verification = report;
const assert = (test, message) => { if (!test) throw new Error(message); };
async function seed() {
  const bytes = new Uint8Array(await (await fetch('/fixture.sqlite3')).arrayBuffer());
  const worker = new Worker('/seed.mjs', { type: 'module' });
  await new Promise((resolve, reject) => { worker.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(); worker.onerror = reject; worker.postMessage({slug, bytes}, [bytes.buffer]); });
  worker.terminate();
}
async function open() {
  const worker = new Worker('/worker.mjs?server-slug=' + slug, {type: 'module'});
  const channel = new MessageChannel(); let waiting;
  channel.port1.onmessage = ({data}) => { report.lastNotification = data; if (data.eventKey === 'event:error' || data.eventKey === 'event:database-initialization-error') waiting?.reject(new Error(JSON.stringify(data))); else waiting?.resolve(data); };
  function wait() { return new Promise((resolve,reject) => { waiting = {resolve,reject}; }); }
  const ready = wait(); worker.postMessage({type:'WORKER_INIT'}, [channel.port2]);
  const initialized = await ready; assert(initialized.eventKey === 'event:database-initialization-success', 'Initialization failed');
  return {
    request(url, method='GET', body) { const c = new MessageChannel(); return new Promise((resolve,reject) => { c.port1.onmessage = ({data}) => { c.port1.close(); data.error ? reject(new Error(JSON.stringify(data))) : resolve(data.data); }; worker.postMessage({type:'WORKER_MESSAGE', url,method,body}, [c.port2]); }); },
    async close() { const done=wait(); worker.postMessage({type:'WORKER_CLOSE'}); const result=await done; assert(result.type==='WORKER_CLOSE_SUCCESS','Close failed'); worker.terminate(); channel.port1.close(); },
  };
}
try {
  await seed(); report.seeded=true;
  let engine=await open(); report.opened=true;
  const before=await engine.request('/developer-settings');
  const key='isFreeHuntingPartiesEnabled';
  await engine.request('/developer-settings/'+key,'PATCH',{value:!before[key]});
  const after=await engine.request('/developer-settings'); assert(after[key]===!before[key], 'Compiled mutation failed');
  const image=await engine.request('/server/database'); assert(image instanceof Uint8Array && image.length>0,'Database export failed'); report.snapshotBytes=image.length;
  await engine.close(); report.saved=true;
  engine=await open(); const reopened=await engine.request('/developer-settings'); assert(JSON.stringify(reopened)===JSON.stringify(after),'Saved controller state did not survive reopen');
  report.reopened=true; await engine.close(); report.status='passed';
} catch(error) { report.status='failed'; report.error=String(error); report.stack=error.stack; }
document.querySelector('#result').textContent=JSON.stringify(report,null,2);
</script>`,
);
const server = createServer(async (request, response) => {
  try {
    const requested = new URL(request.url ?? '/', 'http://localhost').pathname;
    const filename = path.resolve(
      output,
      `.${requested === '/' ? '/index.html' : requested}`,
    );
    if (!filename.startsWith(output + path.sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    const types: Record<string, string> = {
      '.mjs': 'text/javascript',
      '.wasm': 'application/wasm',
      '.html': 'text/html',
    };
    const content = await readFile(filename);
    response.writeHead(200, {
      'Content-Type':
        types[path.extname(filename)] || 'application/octet-stream',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    });
    response.end(content);
  } catch (error) {
    response.writeHead(500);
    response.end(String(error));
  }
});
server.listen(4179, '127.0.0.1', () =>
  process.stdout.write('Verification at http://127.0.0.1:4179\n'),
);
