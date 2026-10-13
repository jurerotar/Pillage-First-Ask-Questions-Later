# API WebAssembly engine

This package compiles the existing TypeScript API into WebAssembly using Static
Hermes, Emscripten and native SQLite. It exports the engine factory and a typed
client. The host supplies a migrated SQLite image and owns persistence, worker
messages and scheduling. The normal web application has not switched to this
engine.

```ts
import { createEngine } from '@pillage-first/engine-wasm';
import factory from '@pillage-first/engine-wasm/engine';

const engine = await createEngine(databaseBytes, factory);
try {
  const result = engine.dispatch({ type: 'advance', now: Date.now() });
  const savedBytes = engine.snapshot();
  // The host handles result.notifications, result.nextDeadline and savedBytes.
} finally {
  engine.close();
}
```

Controller requests require `type: 'request'`, `url` and `method`. Scheduler
requests require `type: 'advance'` and `now`, with an optional batch limit.
Responses always include notifications and the next deadline. JSON boundaries
validate their envelopes; route schemas retain responsibility for API payloads.
Snapshots are detached copies. SQLite owns its deserialized database image, so
MEMFS's temporary copy is released after initialization.

## Build

Use Node 24.18+, installed workspace dependencies and a running Docker daemon.
From the repository root:

```powershell
# First build, including the compiler/runtime toolchain:
npm.cmd run build --workspace packages/engine-wasm -- --toolchain
# Subsequent builds:
npm.cmd run build --workspace packages/engine-wasm
# Retain native function names for debugging:
npm.cmd run build --workspace packages/engine-wasm -- --debug
```

`toolchain.json` pins Emscripten, the Hermes commit and SQLite with an archive
checksum. The build mounts this package into Docker and caches the toolchain in
`pillage-wasm-toolchain`. Set `PILLAGE_WASM_TOOLCHAIN_VOLUME` for a different cache.
Bootstrap verifies the Hermes checkout and downloaded SQLite. SQLite's native
version must match the development fixture dependency.

Rolldown tree-shakes the API and dependencies before emitting separate CommonJS
modules. Esbuild preserves their function wrappers while bundling for Hermes:
flattening the application produces functions too large for browser Wasm
compilation. Both stages and the host client target ESNext. Babel's block-scoping
pass handles the pinned Hermes compiler's per-iteration closure capture behavior.
Runtime APIs still need support in Hermes; `src/polyfills.ts` supplies the existing
runtime globals. Application and vendor sources are not patched.

Outputs are `build/client.mjs`, `build/engine.mjs` and `build/engine.wasm`.
Generated engine C uses `-Oz`; native SQLite, bindings, the Hermes runtime and
linking use `-O2`. Content fingerprints cache compilation and linking stages.
`--native-only` supports native binding changes after a matching full build and
rejects stale engine objects. Delete `build/modular/.cache` to force recompilation.

A build lock prevents overlapping production builds. After a killed process,
confirm it has stopped before removing `build/.build-lock`. Run probes,
benchmarks and standalone bundling sequentially with production builds because
these share generated artifacts.

## Package layout

| Location | Responsibility |
| --- | --- |
| `src/client.ts`, `src/protocol.ts` | Host lifecycle and validated transport |
| `src/compiled.ts`, `src/core.ts` | Engine entry point and API delegation |
| `src/sqlite.ts`, `src/native.d.ts` | Structural database adapter and native types |
| `src/notifications.ts`, `src/polyfills.ts` | Runtime platform support |
| `native/` | SQLite bridge, typed FFI and Hermes platform integration |
| `scripts/`, `toolchain.json` | Package-local build pipeline and pinned toolchain |
| `src/__tests__/fixtures/browser-worker.ts` | Example host with OPFS persistence |
| `benchmarks/` | Reproducible engine, bridge and browser measurements |

Routing and scheduling use the API package's public runtime entry point. The
shared facade owns statement caching. Its structural database types describe
only operations required by both SQLite implementations. The browser worker,
migrations and SQLite-WASM fixture dependency belong to tests rather than the
production engine entry point.

## Verification

```powershell
npm.cmd run type-check --workspace packages/engine-wasm
npm.cmd run lint --workspace packages/engine-wasm
npm.cmd run test:scripts --workspace packages/engine-wasm
npm.cmd run test:unit --workspace packages/engine-wasm
# Requires built artifacts, Docker and Playwright Chromium:
npm.cmd run test:engine --workspace packages/engine-wasm
npm.cmd run test:benchmarks --workspace packages/engine-wasm
```

Unit and script tests cover protocol validation, resource cleanup, snapshot
ownership, notifications, host persistence and scheduling, bundling and build
cache invalidation. Shell tests require Git Bash on Windows. Integration tests
compare controllers and scheduler effects against the original API and exercise
real native bindings and Chromium OPFS save/reopen. Fixture databases and compiled
probes stay in ignored `build/`.

Generate fresh measurements before each refactor and compare afterward with
`benchmark:quick`; use `benchmark:all` to confirm improvements with full samples.
See [the benchmark workflow](./benchmarks/README.md) for commands,
workload coverage and interpretation. Reports stay in ignored
`benchmarks/reports/`.
