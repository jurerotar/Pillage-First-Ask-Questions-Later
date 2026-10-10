# API WebAssembly engine

This package builds the existing TypeScript API into browser-capable WebAssembly
and provides a frontend client and worker. Static Hermes compiles the JavaScript;
Emscripten links it with the Hermes runtime and native SQLite. Application source,
SQL, schemas, Hermes source and generated C are not patched or substituted.

The normal web application has not yet switched to this worker.

## Execution and persistence

`src/worker.ts` opens and migrates the world using the existing SQLite OPFS pool.
`src/client.ts` supplies its SQLite image to the Wasm engine. Controller requests
and scheduler batches cross the worker boundary as complete requests. The API,
shared database facade, Zod validation and SQLite query execution run inside the
same Wasm instance. The worker persists snapshots to OPFS and schedules the next
wake-up from the deadline returned by the engine.

`src/core.ts` delegates routing and event resolution to the original API. It adds
only the request envelope, batch limit and next deadline. Notifications use the
API's existing notification port, with a local queue returned to the worker.

The original database facade owns its prepared-statement cache. `src/sqlite.ts`
implements its SQLite interface; `native/sqlite-bridge.c` owns native database
memory and statement handles. Statements use `SQLITE_PREPARE_PERSISTENT` and
recycle finalized handles. Individual bind, step and column operations use Hermes
FFI calls inside Wasm; there is no per-query worker message or JSON serialization.

## Build

Use Node 24.18+ (the repository requirement), installed dependencies and a running Docker daemon.
From the repository root:

```powershell
# First build, including the compiler/runtime toolchain:
node packages/engine-wasm/scripts/build.ts --toolchain

# Subsequent builds:
node packages/engine-wasm/scripts/build.ts

# Native binding changes only, after a matching full build:
node packages/engine-wasm/scripts/build.ts --native-only
```

Emscripten is pinned to `emscripten/emsdk:6.0.12`. Hermes is pinned to commit
`f93e7648a419729f1bdb04638218c563efc3f47d`. The Docker volume
`pillage-wasm-toolchain` caches both builds. `bootstrap.sh` checks that the Hermes
checkout is unmodified.

The bundler performs standard TypeScript/module compilation and lexical-capture
lowering. Babel's block-scoping pass works around the pinned Hermes compiler's
incorrect per-iteration closure capture. Static Hermes emits C; Emscripten links
the engine, typed FFI, runtime and SQLite into `build/engine.mjs` and
`build/engine.wasm`. `build/client.mjs` exposes the client. `--native-only` rejects
a changed engine bundle to prevent reuse of a stale object.

`native/serial-executor.cpp` provides synchronous finalizer dispatch for this
single-owner Wasm runtime at link time. It requires no vendor source patch.
`src/runtime-globals.ts` supplies browser globals used by the API but absent from
Hermes. Zod uses its existing interpreted validation path (`jitless`).

## Package layout

| Location | Responsibility |
| --- | --- |
| `src/compiled.ts`, `src/core.ts` | Engine entry point and API delegation |
| `src/client.ts`, `src/worker.ts` | Frontend dispatch, lifecycle and persistence |
| `src/sqlite.ts`, `src/native.d.ts` | SQLite adapter and typed native interface |
| `src/notifications.ts`, `src/runtime-globals.ts` | Runtime platform support |
| `native/ffi.ts.in`, `scripts/ffi.ts` | Typed FFI and generated native declarations |
| `native/sqlite-bridge.c`, `.h` | Database memory, prepared statements and snapshots |
| `native/runtime.c`, `native/serial-executor.cpp` | Hermes lifecycle and platform integration |
| `scripts/build.ts`, `bundle.ts`, `bootstrap.sh`, `compile.sh` | Build pipeline |
| `src/__tests__/`, `scripts/__tests__/` | TypeScript Vitest tests and test fixtures |

## Verification

```powershell
npm.cmd run test:scripts --workspace packages/engine-wasm
npm.cmd run type-check --workspace packages/engine-wasm
# Engine tests require the built Wasm artifacts:
npm.cmd test --workspace packages/engine-wasm
```

Vitest prepares the shared database fixture automatically. Tests compare
controllers, scheduler effects, rollback and notifications against the original
API; compile the SQLite adapter probe to Wasm; and verify browser worker OPFS
save/reopen. Browser tests use a disposable Playwright Chromium instance and
start/stop their own fixture server. Install Playwright Chromium if absent.

Build outputs, fixture databases and verification output belong in ignored
`build/`. There are no application source transformers, SQL optimizers, generated
validators, project Python scripts or benchmark-only native implementations.
Upstream Emscripten uses Python internally.

Before adopting this worker in production, assess startup/module size, broader
resolver coverage and persistence failure handling. Passing these checks does
not establish performance parity across all gameplay workloads.

## Babel, Oxc and Rolldown investigation

These measurements preceded the upgrade to Babel 8.0.7; they do not measure
the current Babel version. Local measurements used Node 24.19, Babel 7.29.7,
esbuild 0.25.12 and Rolldown 1.1.5. The API bundle supplied to Babel was
2,394,187 bytes. Standalone passes
used one warmup and seven samples; the final pipeline comparison alternated
execution order over seven samples after warming each candidate.

| Candidate | Median time | Result |
| --- | ---: | --- |
| Existing module bundling plus Babel | 1,205 ms | Working build |
| Rolldown preserving module boundaries, plus Babel | 1,178 ms | Controller, scheduler and lifecycle Wasm tests passed |
| Babel block-scoping pass alone | 807 ms | Correct captured loop values |
| Oxc ES2020 transform alone, via `rolldown/utils` | 41 ms | Incorrect captured loop values under Hermes |

Oxc is much faster as an isolated pass, but cannot replace the required
block-scoping transformation. A compiled Wasm probe whose loop creates three
closures returns `[0,1,2]` with Babel and `[3,3,3]` with either unmodified or
Oxc-transformed source. The transformer leaves lexical loop bindings intact;
its ES5 target is rejected. Adding Oxc before Babel provided no useful gain.

Direct Rolldown bundling took approximately 44 ms, but flattened modules produce
an 18,519,907-byte Wasm function. Node/V8 rejects it against its 7,654,321-byte
function limit. Preserving module boundaries avoids that failure, but still
requires esbuild's per-module CommonJS conversion and Babel lowering. The viable
candidate's Wasm artifact was 19,845,251 bytes versus 20,368,821 bytes currently.

The final paired pipeline median improved only 2.2%, with candidate samples
ranging from 920 to 1,261 ms. Earlier separate measurements suggested 21%; that
gain did not reproduce in the paired comparison. These timings cover JavaScript
bundling/lowering, not the entire native/Wasm build or gameplay execution.
Babel and the current bundler are retained. No experimental dependency was added.
Investigation scripts, raw timings and candidate binaries are local ignored
`build/` artifacts (`compiler-comparison.json` contains all samples).
