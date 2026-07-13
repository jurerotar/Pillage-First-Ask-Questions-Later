# Rust Migration Experiment

Date: 2026-07-13

## Summary

The experiment was successful. Moving resolver database work from the current JavaScript sqlite-wasm API path into Rust/WASM produced a clear performance improvement for the tested workloads.

The most representative real-world test generated and resolved 1,000 `troopTraining` events against the seeded game-world SQLite database. Both implementations used the same production-oriented SQLite pragmas and ended with matching state.

## Real Resolver Result

| Engine | Runs | Resolve mean ms | Resolve median ms | Min ms | Max ms | State OK |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Rust WASM optimized | 5 | 57.335 | 44.035 | 31.000 | 114.080 | yes |
| Current JS sqlite-wasm path | 5 | 336.473 | 349.910 | 210.545 | 480.685 | yes |

Median current JS / Rust resolve speedup: 7.946x.

Mean current JS / Rust resolve speedup: 5.869x.

## Why Rust Was Faster

The current implementation pays a high per-query cost because resolver code runs in JavaScript while SQLite runs inside the wasm module. Each statement crosses the JS-to-wasm boundary, then returns row data back through wasm-to-JS wrappers. The real resolver benchmark showed 61,056 sqlite-js-wrapper spans for 1,000 resolved events.

The Rust implementation keeps the hot resolver loop and SQLite calls inside the same wasm-side execution path. It performs the batch and returns a compact summary to JavaScript after the work is complete. That removes most wrapper, facade, row materialization, and cross-boundary overhead from the hot path.

Additional Rust-side optimizations improved the result further:

- `DELETE ... RETURNING` emitted the numeric `unit_row_id` directly, avoiding Rust-side event `meta` JSON parsing.
- Troop upsert bound `unit_row_id` directly, avoiding a per-event unit lookup.
- Resource updates skipped the effects query when the resource timestamp proved the update would be a no-op.

## Flamechart Findings

Median-run inclusive instrumented spans:

| Engine | Category | Count | Total ms | Avg ms | Max ms |
| --- | --- | ---: | ---: | ---: | ---: |
| Rust WASM optimized | resolver | 3,000 | 31.435 | 0.010 | 0.385 |
| Rust WASM optimized | transaction | 2,000 | 6.410 | 0.003 | 0.070 |
| Rust WASM optimized | resource-update | 1,000 | 1.870 | 0.002 | 0.060 |
| Current JS | sqlite-js-wrapper | 61,056 | 682.145 | 0.011 | 16.210 |
| Current JS | transaction | 1,000 | 348.200 | 0.348 | 8.770 |
| Current JS | resolver | 1,000 | 315.205 | 0.315 | 8.700 |
| Current JS | db-facade | 5,002 | 282.660 | 0.057 | 7.155 |

The remaining Rust hot spots were the required database work itself:

| Rust frame | Count | Total ms | Avg ms | Max ms |
| --- | ---: | ---: | ---: | ---: |
| `rust.resolve.deleteReturning` | 1,000 | 19.820 | 0.020 | 0.385 |
| `rust.resolver.updateWheatEffect` | 1,000 | 6.960 | 0.007 | 0.050 |
| `rust.transaction.commit` | 1,000 | 5.165 | 0.005 | 0.070 |
| `rust.resolver.upsertTroop` | 1,000 | 4.655 | 0.005 | 0.025 |
| `rust.resolver.selectResourceSite` | 1,000 | 1.870 | 0.002 | 0.060 |

## Isolated SQL Workload

The isolated resolver SQL workload also favored Rust:

| Workload | Rust total ms | JS total ms | JS/Rust speedup |
| --- | ---: | ---: | ---: |
| Read-only, 1 iteration | 34.745 | 58.830 | 1.693x |
| Read-only, 50 iterations | 16.265 | 53.930 | 3.316x |
| Read-only, 250 iterations | 45.685 | 230.940 | 5.055x |
| Read-only, 1,000 iterations | 121.815 | 997.960 | 8.192x |
| Writes without rollback, 50 iterations | 19.615 | 109.560 | 5.586x |
| Writes with rollback, 250 iterations | 257.425 | 608.555 | 2.364x |

Failure counts matched between Rust and JS in the selected isolated SQL comparisons, so the speedup was not caused by one implementation skipping more statements.

## Notes

- The real resolver benchmark used production SQLite pragmas from `packages/api/src/worker/database.ts`, including `locking_mode = EXCLUSIVE`, `journal_mode = WAL`, `secure_delete = OFF`, `synchronous = OFF`, and `wal_autocheckpoint = 1000`.
- The experiment was removed after completion. This document preserves the measured results and reasoning.
- A production migration should benchmark more resolver types, larger mixed event queues, and browser startup/import costs separately from hot resolver execution.

