# Engine refactor workflow

Before each engine refactor, build the current engine and generate fresh baseline
reports with all three benchmark suites, sequentially:

```powershell
npm.cmd run build --workspace packages/engine-wasm
npm.cmd run benchmark --workspace packages/engine-wasm
npm.cmd run benchmark:bridge --workspace packages/engine-wasm
npm.cmd run benchmark:browser --workspace packages/engine-wasm
```

Complete these baseline runs before changing runtime, SQLite bridge, database
adapter, client, worker, or build/optimization behavior. Existing reports and quick
smoke runs do not replace a fresh baseline. Documentation-only changes do not
require benchmark runs.

Keep baseline report paths. After the refactor, rebuild, rerun the same suites
with the same environment and sample counts, and compare against those baselines
using `--compare`, `BRIDGE_BENCHMARK_COMPARE`, and `BROWSER_BENCHMARK_COMPARE`.
Report correctness failures and timing changes; repeat runs before attributing
small timing differences to the refactor. If prerequisites prevent a baseline
run, report the blocker before proceeding with the refactor.

Reports belong in `benchmarks/reports/` and are ignored by Git. Do not commit
generated reports or compiled benchmark artifacts.
