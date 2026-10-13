# Engine refactor workflow

Use quick measurements for the development loop. Generate a fresh baseline
before changing engine behavior, then compare using the same profile:

```powershell
npm.cmd run benchmark:quick --workspace packages/engine-wasm -- --output-prefix benchmarks/reports/before
npm.cmd run benchmark:quick --workspace packages/engine-wasm -- --output-prefix benchmarks/reports/after --compare benchmarks/reports/before
# Measure one area while iterating:
npm.cmd run benchmark:quick --workspace packages/engine-wasm -- --suite bridge
```

Complete these baseline runs before changing runtime, SQLite bridge, database
adapter, client, worker, or build/optimization behavior. Existing reports do not
replace a fresh baseline. Documentation-only changes do not
require benchmark runs.

Quick mode uses 3 samples and 1 warmup, keeps every workload including 100-event
scheduler batches, reduces large response repetitions and omits compression size
calculations. Scheduler state is checked once per case; responses and notification
counts are checked for every sample. It is useful for spotting large regressions;
three samples cannot reliably establish small improvements or tail latency.

Before major refactors and when confirming performance improvements, use full
baseline and comparison runs:

```powershell
npm.cmd run benchmark:all --workspace packages/engine-wasm -- --output-prefix benchmarks/reports/full-before
npm.cmd run benchmark:all --workspace packages/engine-wasm -- --output-prefix benchmarks/reports/full-after --compare benchmarks/reports/full-before
```

Full mode uses 3 warmups and 15 measured samples and includes compression sizes.
Both runners build first, then run engine, bridge and Chromium suites sequentially.
`--suite engine|bridge|browser` restricts measurement to one suite. Comparisons
reject different profiles, workloads and operation counts. Prefixes resolve from the process working
directory; npm workspace commands run in the package directory. Each prefix
produces `-engine.json`, `-bridge.json` and `-browser.json`. Omitting the output
prefix creates timestamped reports.

Report correctness failures and timing changes; repeat runs before attributing
small timing differences to the refactor. If prerequisites prevent a baseline
run, report the blocker before proceeding with the refactor.

Reports belong in `benchmarks/reports/` and are ignored by Git. Do not commit
generated reports or compiled benchmark artifacts.

## Coverage and interpretation

Engine measurements cover startup, controllers, large responses, snapshots and
scheduler batches of 1/100 events with and without notifications in both profiles. Bridge
measurements compare C and Hermes dispatch, statement lifecycle, SQL execution,
binding, direct/facade row reads and snapshots using the same native SQLite.
Chromium measurements cover worker messages, image transfers and OPFS save/reopen.
Correctness checks run outside timing. Browser runs require Playwright Chromium
and port 4179. Bridge probes are cached by generated source, native inputs, build
script and installed compiler/header/library identities. Artifact hashes are
checked before reuse; missing, changed or damaged inputs/outputs rebuild.

Reports retain raw samples, medians, p90, operation counts, fixture/workload
hashes and runtime/artifact details. Comparisons reject incompatible workloads.
Negative median changes mean faster execution; small differences need repeated
full runs before attribution. Keep the machine idle, runtime versions, power mode
and sample counts consistent. Timings are opt-in rather than test assertions.

Individual runners remain available as `benchmark`, `benchmark:bridge` and
`benchmark:browser`. Engine options include `--output`, `--compare`, `--samples`
and `--warmups`, with `--quick` selecting quick mode. Bridge output/comparison use `BRIDGE_BENCHMARK_OUTPUT` and
`BRIDGE_BENCHMARK_COMPARE`; browser uses the corresponding `BROWSER_` names and
supports `BROWSER_BENCHMARK_SAMPLES` and `BROWSER_BENCHMARK_WARMUPS`. Clear overrides
after use. `BENCHMARK_PROFILE=quick` selects quick bridge samples. Changes to the
benchmark harness require fresh baselines. Browser fixture preparation resets
the write-trigger timestamp after moving events, keeping byte hashes reproducible
across processes.
