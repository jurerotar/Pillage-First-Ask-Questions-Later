# API WebAssembly engine

This package builds the existing TypeScript API into browser-capable WebAssembly
and provides a frontend client and worker. Static Hermes compiles the JavaScript;
Emscripten links it with the Hermes runtime and native SQLite. Application source,
SQL, schemas, Hermes source and generated C are not patched or substituted.

The normal web application has not yet switched to this worker.

## Execution and persistence

`src/worker.ts` opens and migrates the world using the existing SQLite OPFS pool.
`src/client.ts` supplies its SQLite image to the Wasm engine and releases the
temporary MEMFS copy once native SQLite owns it. Controller requests
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

# Keep Wasm function names for native debugging:
node packages/engine-wasm/scripts/build.ts --debug
```

Emscripten is pinned to `emscripten/emsdk:6.0.12`. Hermes is pinned to commit
`f93e7648a419729f1bdb04638218c563efc3f47d`. The Docker volume
`pillage-wasm-toolchain` caches both builds. `bootstrap.sh` checks that the Hermes
checkout is unmodified.

Rolldown tree-shakes the original TypeScript/ES modules before emitting separate
CommonJS modules. Esbuild bundles those modules while preserving their function
wrappers; flattening the entire application creates functions too large for
browser Wasm compilation. Both stages target `esnext`, retaining modern syntax
for Hermes rather than lowering it to an older ECMAScript version. New syntax
and runtime APIs still require support in the pinned Hermes compiler/runtime.
The frontend client also targets `esnext`. Babel's block-scoping pass works around the pinned Hermes compiler's
incorrect per-iteration closure capture. Static Hermes emits C; Emscripten links
the engine, typed FFI, runtime and SQLite into `build/engine.mjs` and
`build/engine.wasm`. `build/client.mjs` exposes the client. `--native-only` rejects
a changed engine bundle, toolchain or engine artifact to prevent reuse of a
stale object.

The generated engine uses `-Oz` to reduce code size. SQLite, native bindings and
the Hermes runtime retain `-O2`, as does the final link. Release builds omit debug
names; `--debug` retains them. This mixed profile reduced the tree-shaken module
by another 21% without a measurable scheduler regression in paired Node and
Chromium runs. Whole-program `-Oz` slowed the scheduler; partial LTO added build
time for little size benefit.

Compilation stages cache content fingerprints of inputs, outputs, compiler
identity, options, headers and linked runtime libraries. Unchanged builds skip
Hermes, C/C++ compilation and linking. A native C implementation change recompiles
its object and relinks; changing an included header conservatively invalidates
all affected objects. Debug/release switching relinks only. The first build after
introducing this cache must be a full build. Delete `build/modular/.cache` to
force compilation. A build lock prevents overlapping production builds; if a
build process is killed, remove the empty `build/.build-lock` directory after
confirming that it has stopped. Do not run standalone bundling or probe builds
against shared artifacts during a production build.

`native/serial-executor.cpp` provides synchronous finalizer dispatch for this
single-owner Wasm runtime at link time. It requires no vendor source patch.
`src/runtime-globals.ts` supplies browser globals used by the API but absent from
Hermes. Zod uses its existing interpreted validation path (`jitless`), without
importing the unused runtime compiler.

String reads use the pinned Hermes runtime's `_sh_asciiz_to_string` typed FFI
builtin, which converts UTF-8 directly to a JavaScript string. SQLite values
pass their explicit byte lengths, preserving embedded NULs.
`native/text-bindings.cpp` registers a Hermes JSI host function for bound text:
it borrows ASCII or UTF-16 spans and SQLite copies them synchronously. No runtime
or GC calls occur while a span is borrowed. Invalid surrogate pairs retain the
previous `URIError` behavior. SQL strings, parameter names and response envelopes
still use the typed FFI encoder, with an ASCII fast path. Native allocation
failures throw before writing through a null pointer.

Snapshots borrow SQLite's contiguous deserialized buffer when available and
fall back to allocated serialization otherwise. The client copies the bytes
synchronously, so returned snapshots remain independent of subsequent writes
and engine close. SQLite owns borrowed buffers; the bridge frees only allocated
fallbacks. See [SQLite's serialization lifetime](https://sqlite.org/c3ref/serialize.html).

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
| `native/text-bindings.cpp` | Borrowed string spans for native SQLite text binding |
| `scripts/build.ts`, `bundle.ts`, `bootstrap.sh`, `compile.sh` | Build pipeline |
| `benchmarks/` | Engine, bridge and browser benchmark runners and fixtures |
| `benchmarks/reports/` | Local JSON measurement reports |
| `src/__tests__/`, `scripts/__tests__/` | TypeScript Vitest tests and test fixtures |

## Verification

```powershell
npm.cmd run test:scripts --workspace packages/engine-wasm
npm.cmd run test:unit --workspace packages/engine-wasm
npm.cmd run test:benchmarks --workspace packages/engine-wasm
npm.cmd run type-check --workspace packages/engine-wasm
npm.cmd run lint --workspace packages/engine-wasm
npm.cmd run format --workspace packages/engine-wasm
# Engine tests require the built Wasm artifacts:
npm.cmd test --workspace packages/engine-wasm
```

Vitest prepares the shared database fixture automatically. Tests compare
controllers, scheduler effects, rollback and notifications against the original
API; compile the SQLite adapter probe to Wasm; and verify browser worker OPFS
save/reopen. Browser tests use a disposable Playwright Chromium instance and
start/stop their own fixture server. Install Playwright Chromium if absent.

Script and unit tests run without Docker or compiled artifacts. Shell pipeline
tests require Git Bash on Windows. Build tests cover cache invalidation, missing
or damaged outputs, failed stages, concurrent builds and debug/release switching.
Bundler tests cover tree shaking, side effects, package resolution, lexical
captures and cyclic live bindings. Unit tests cover
client failure cleanup and snapshot ownership, notifications and rollback, query
parsing, and worker scheduling, save retries, backup recovery and concurrent
save revisions, including resumed scheduling/autosave after a failed close.
Integration tests also check native initialization failure,
stale native-only builds, embedded NUL text, empty blobs and Hermes loop captures.

Build outputs, fixture databases and verification output belong in ignored
`build/`. There are no application source transformers, SQL optimizers, generated
validators, project Python scripts or benchmark-only native implementations.
Upstream Emscripten uses Python internally.

Before adopting this worker in production, assess startup/module size, broader
resolver coverage and persistence failure handling. Passing these checks does
not establish performance parity across all gameplay workloads.

## Measuring bridge changes

### Reproducible benchmark suites

Before every engine refactor, build the current engine and generate fresh baseline
reports with all three suites below. Complete the baseline runs before editing
engine behavior. After the refactor, rebuild and rerun the same suites, comparing
against the saved baselines with the same environment and sample counts.
Documentation-only changes do not require benchmark runs. This workflow is also
recorded in [benchmarks/README.md](./benchmarks/README.md).

Run the suites sequentially on an otherwise idle machine after building the
engine. Keep the same Node/Chromium versions, power mode, sample counts and
fixture/workload hashes when comparing changes. Do not run benchmarks alongside
builds or tests: they share generated fixture artifacts. Performance measurements
are opt-in and do not impose timing assertions on normal tests.

```powershell
# Run from the repository root. Default: 3 warmups, 15 measured samples.
npm.cmd run benchmark --workspace packages/engine-wasm
npm.cmd run benchmark:bridge --workspace packages/engine-wasm
npm.cmd run benchmark:browser --workspace packages/engine-wasm

# Save a baseline, rebuild after a change, then compare.
node packages/engine-wasm/benchmarks/engine.ts --output packages/engine-wasm/benchmarks/reports/baseline.json
node packages/engine-wasm/benchmarks/engine.ts --compare packages/engine-wasm/benchmarks/reports/baseline.json

# Quick harness verification; insufficient samples for an optimization claim.
node packages/engine-wasm/benchmarks/engine.ts --samples 3 --warmups 1
```

The engine suite freezes fixture seeding time, uses the seeded game world with
1000 training events, and checks controller responses and scheduler state against
the original API. Each scheduler sample starts with an independent fixture copy;
initialization, reference execution and state inspection are outside its timer.
It measures warm module creation/init/close, small controller responses, the
1000-event response, detached snapshots, and scheduler batches of 1/100/1000 with
and without notifications. It also records raw/gzip/Brotli module sizes. Startup
does not measure a cold process or first module import/compilation.

The bridge suite measures empty request dispatch with 0/1/64 KiB request payloads,
prepare/step/reset/finalize, aggregate/join/sort SQL returning one scalar,
numeric/ASCII/Unicode update/read pairs, row materialization through direct FFI
and the shared facade, and 8 MiB snapshots. C and Hermes use the same SQLite
object, SQL and database state; checksum and image checks are outside timing.
C timings include the native bridge and dispatch, rather than an internal SQLite
CPU timer. The probes use `-O2`; production uses the mixed optimization profile
described above. Facade selection affects the row/write workloads only.

The browser suite launches disposable headless Chromium and measures actual
worker request/response messages, database-image transfers, OPFS open, and dirty
save/close. Reopening validates persisted settings. Its fixture keeps the 1000
training events but moves them to 2100 to prevent automatic background scheduling.
It requires Playwright Chromium and available localhost port 4179. All OPFS data
belongs to the disposable browser profile.

Reports are timestamped JSON files in ignored `benchmarks/reports/`. They retain
every sample, median, nearest-rank p90, range, operation counts and microseconds
per operation, fixture/workload hashes, machine/runtime details and measured
artifact hashes. Engine reports also identify the Git revision and dirty state.
Comparisons report median percentage changes (negative is faster) and reject
different suites, fixtures, workloads or operation counts. They do not establish
statistical significance; repeat full runs before accepting small differences.
Artifact hashes identify what ran; rebuild to establish source freshness.

Bridge output/comparison paths use `BRIDGE_BENCHMARK_OUTPUT` and
`BRIDGE_BENCHMARK_COMPARE`. Browser equivalents are `BROWSER_BENCHMARK_OUTPUT`
and `BROWSER_BENCHMARK_COMPARE`; `BROWSER_BENCHMARK_SAMPLES` and
`BROWSER_BENCHMARK_WARMUPS` adjust its run length. These paths resolve from the
process working directory (npm workspace commands run in the package directory).
Clear environment overrides after use. `BRIDGE_BENCHMARK_SKIP_BUILD=1` reuses
compiled probes only if their workload fingerprint and Wasm hashes match the
stored provenance. The default rebuilds probes and requires Docker.
Set `BRIDGE_BENCHMARK_HISTORY=1` to additionally measure locally preserved
historical FFI variants; the default compares C with the current bridge/facade.

The optional Vitest benchmark compiles C and Hermes fixtures to real Wasm using
the same SQLite object and prepared statements. It checks checksums and complete
database images before reporting rotating paired timings. Numeric, ASCII and
Unicode writes, direct row reads and shared-facade reads are separate workloads.
These measurements locate bridge and facade costs; they are not whole-game
speedup claims.

```powershell
$env:BRIDGE_BENCHMARK = '1'
npx.cmd vitest run --config packages/engine-wasm/vitest.config.ts --project benchmarks packages/engine-wasm/benchmarks/__tests__/bridge.test.ts
Remove-Item Env:BRIDGE_BENCHMARK
```

Build the engine first to prepare the SQLite object. The benchmark creates its
own database fixture. Compiled probes and compatibility output stay in ignored
`build/bridge-review`; structured reports go to `benchmarks/reports`.
Historical bridge comparisons run only when enabled and their original
artifacts are available; source and Wasm hashes identify the measured versions.

In this review, the module fell from approximately 20.3 MB to 9.4 MB raw
(2.35 MB gzip, 1.95 MB Brotli at quality 5). The two-stage bundler was about 3.2
times faster in paired samples. Native text reads and bindings improved direct
ASCII/Unicode bridge workloads by approximately 7–9 times over the original
bridge. Prepared updates with scalar reads now take approximately 2.5–3 times
the equivalent C/Wasm time. Shared facade, validation and object creation still
add substantial cost. These are workload-specific measurements, not an overall
game speedup guarantee.

Emscripten remains the supported toolchain. Direct Clang or WASI SDK would require
replacing browser loading, libc/C++ support, filesystem integration and exported
call wrappers, with no demonstrated runtime benefit here. Emscripten already
runs Binaryen optimization during linking; adding another generic optimization
pass was not justified. See [Emscripten optimization guidance](https://emscripten.org/docs/optimizing/Optimizing-Code.html)
and [WASI SDK C++ exception support](https://github.com/WebAssembly/wasi-sdk/blob/main/CppExceptions.md).
