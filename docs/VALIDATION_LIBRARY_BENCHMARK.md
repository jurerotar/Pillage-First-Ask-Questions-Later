# TypeScript validation library benchmark

## Summary

Zod remains the recommended validation library for this project.

TypeBox Compile and Typia can validate these particular inputs faster, but their
advantages do not outweigh Zod's existing integration, simpler build process,
good TypeScript performance, and adequate runtime performance. If production
profiling identifies validation as a material bottleneck, TypeBox Compile is the
preferred option for selectively optimizing that boundary. Typia should only be
considered when maximum validation throughput justifies adding a compiler
transform.

## Motivation

The project uses Zod throughout its HTTP controllers, event resolvers, database
facade, shared types, tests, and OpenAPI generation. This experiment compared
alternatives using two validation-heavy shapes from the troop movement path:

- `troopMovementValidationBodySchema`: a nested request containing 60 troops
- `getVillageTroopMovementsRowSchema`: a flat database result with 15 fields

These represent the nested request and wide database-row patterns used around
[`troop-movement-resolver.ts`](/packages/api/src/http/events/resolvers/troop-movement-resolver.ts).

## Tested libraries

| Library | Version | Mode |
|---|---:|---|
| Zod | 4.4.3 | Schema interpreter |
| Zod Mini | 4.4.3 | Schema interpreter |
| Valibot | 1.4.2 | Schema interpreter |
| ArkType | 2.2.3 | Schema interpreter |
| TypeBox | 1.3.6 | `Value.Check` interpreter |
| TypeBox | 1.3.6 | Compiled validator |
| Ajv | 8.20.0 | Compiled JSON Schema |
| Effect | 3.22.0 | Effect Schema interpreter |
| Superstruct | 2.0.2 | Schema interpreter |
| Runtypes | 7.0.4 | Schema interpreter |
| Typia | 13.2.0 | Generated validator |

The benchmark used TypeScript 7.0.2 and Node 24.13.0 on an Intel Core Ultra 7
255HX with 96 GB of RAM.

## Methodology

Every implementation validates equivalent required fields, primitive types,
literal unions, arrays, nullable values, integer constraints, and strict
rejection of undeclared object keys.

Four runtime cases are measured:

1. A valid request containing 60 troops.
2. The same request with an invalid `amount` on the last troop.
3. A valid wide movement row.
4. The same row with an invalid final field.

Runtime results are the median of five warmed runs containing 2,000 validations
per case. Results are operations per second, so higher is better. The suite uses
a relatively low iteration count because Runtypes' nested literal-union case
makes larger runs take several minutes.

TypeScript results are the median of five separate compiler processes using
`--strict`, `--skipLibCheck`, and `--extendedDiagnostics`. They measure total
compiler time, check time, peak memory, and type instantiations. Lower is better.

TypeBox Compile and Ajv compile their schemas before steady-state validation.
Their compilation cost is measured separately. Typia is also reported
separately because it generates validator code through a TypeScript compiler
transform.

Absolute timing varies with machine load, JIT state, and library version.
Ratios and broad trends are more useful than individual numbers.

## Runtime results

### Valid nested request

| Library | Operations/second |
|---|---:|
| Typia | 1,502,291 |
| TypeBox Compile | 746,241 |
| ArkType | 346,123 |
| Zod | 235,081 |
| Valibot | 130,153 |
| Zod Mini | 94,646 |
| Ajv | 42,118 |
| Effect | 9,991 |
| Superstruct | 4,762 |
| TypeBox Value | 2,233 |
| Runtypes | 219 |

### Invalid nested request

The failure occurs on the last troop, forcing validators to traverse the array.

| Library | Operations/second |
|---|---:|
| Typia | 1,664,447 |
| TypeBox Compile | 793,903 |
| Valibot | 98,793 |
| Ajv | 62,573 |
| ArkType | 45,826 |
| Zod | 36,133 |
| Zod Mini | 30,363 |
| Effect | 14,846 |
| Superstruct | 6,669 |
| TypeBox Value | 2,491 |
| Runtypes | 220 |

### Valid wide row

| Library | Operations/second |
|---|---:|
| Typia | 36,101,083 |
| Ajv | 3,947,888 |
| ArkType | 3,271,716 |
| Zod | 2,255,809 |
| TypeBox Compile | 1,628,532 |
| Valibot | 1,036,807 |
| Zod Mini | 553,250 |
| Runtypes | 86,009 |
| Effect | 67,853 |
| Superstruct | 66,769 |
| TypeBox Value | 42,387 |

### Invalid wide row

The failure occurs on the final field.

| Library | Operations/second |
|---|---:|
| Typia | 38,095,238 |
| TypeBox Compile | 9,174,312 |
| Ajv | 4,478,280 |
| Valibot | 719,502 |
| ArkType | 225,673 |
| Effect | 75,490 |
| Zod | 46,504 |
| TypeBox Value | 46,835 |
| Zod Mini | 45,307 |
| Runtypes | 43,903 |
| Superstruct | 38,261 |

Invalid-input results include each library's error handling or failure-reporting
strategy. They should not be interpreted as pure traversal speed.

## Validator compilation

| Library | Median compilation time |
|---|---:|
| TypeBox Compile | 0.242 ms |
| Ajv | 8.664 ms |

Compiled validators should be created once and reused. TypeBox compiled this
request schema approximately 36 times faster than Ajv.

## TypeScript compiler results

| Library | Total time | Check time | Memory | Type instantiations |
|---|---:|---:|---:|---:|
| Zod | 58 ms | 5 ms | 33,826 KB | 1,127 |
| Zod Mini | 46 ms | 5 ms | 33,295 KB | 1,975 |
| Valibot | 45 ms | 9 ms | 37,408 KB | 5,452 |
| ArkType | 53 ms | 16 ms | 45,675 KB | 13,491 |
| TypeBox | 51 ms | 12 ms | 46,058 KB | 9,759 |
| Ajv | 126 ms | 95 ms | 53,388 KB | 14,408 |
| Effect | 52 ms | 10 ms | 79,971 KB | 9,380 |
| Superstruct | 34 ms | 2 ms | 27,719 KB | 1,262 |
| Runtypes | 38 ms | 5 ms | 29,784 KB | 4,537 |
| Typia type checking only | 34 ms | 1 ms | 32,670 KB | 10 |

Typia's row only measures ordinary type checking. It excludes the required
validator-generation transform and is not directly comparable with schema-first
libraries.

Zod has the fewest type instantiations among the schema-first implementations.
Superstruct has the lowest compiler time and memory, but its runtime performance
is substantially worse for these inputs. Effect uses considerably more compiler
memory. Ajv has the heaviest compiler check in this small fixture because its
`JSONSchemaType` validates the schema against a separately declared TypeScript
type.

## Findings

### Zod

Zod provides the best overall fit for the repository:

- It is already integrated with the database facade, shared types, controllers,
  tests, and OpenAPI generation.
- It has low TypeScript complexity and competitive runtime performance.
- It does not require compilation, code generation, or custom build tooling.
- Its errors and API are already familiar within the codebase.

Database access and event processing are expected to dominate the small Zod
validations in troop movement resolvers. Replacing the validator without a
production profile showing otherwise would optimize the wrong layer.

### TypeBox Compile

TypeBox Compile is the strongest selective optimization candidate:

- It is very fast on the nested troop request and invalid rows.
- Validator compilation is inexpensive.
- TypeBox 1.x supports TypeScript 7 and produces standard JSON Schema.
- It does not require the compiler transform used by Typia.

Its TypeScript footprint is heavier than Zod's, and adopting it globally would
still require replacing existing Zod and Zod OpenAPI integrations.

### Typia

Typia has the highest steady-state throughput by a large margin. The cost is a
different development and build model:

- Validation is generated from TypeScript types.
- Tests, production builds, and local scripts must all run through the Typia
  compiler transform.
- Build caching and IDE/runtime parity require additional care.
- Its performance is therefore not a drop-in comparison with runtime schemas.

Typia is only justified if profiling demonstrates that validation consumes
enough CPU to warrant this complexity.

### Other libraries

- ArkType performs well for valid data, particularly flat rows, but creates
  considerably more TypeScript instantiations than Zod.
- Valibot performs well on invalid inputs but is slower on valid inputs in these
  fixtures and creates more type instantiations.
- Zod Mini reduces API and bundling surface; it is not a runtime-performance
  upgrade for these cases.
- Ajv is fast on flat JSON-shaped rows but has noticeable schema compilation and
  TypeScript costs. Large literal unions also reduce its nested-request result.
- Effect offers richer decoding and transformation capabilities but is slower
  and has the highest compiler memory usage.
- Superstruct has a light TypeScript footprint but poor runtime performance here.
- Runtypes is unsuitable for this nested workload because its large literal
  unions validate extremely slowly.
- TypeBox `Value.Check` should not be selected for performance-sensitive paths;
  the compiled TypeBox validator is dramatically faster.

## Recommendation

Continue using Zod as the project's default and do not migrate existing schemas
based solely on this microbenchmark.

If a production profile shows validation to be a meaningful bottleneck:

1. Confirm the cost is validation rather than SQLite, serialization, event
   processing, or JavaScript-to-WASM crossings.
2. Benchmark the exact production schema and its real input distribution.
3. Introduce TypeBox Compile only at the measured boundary.
4. Consider Typia only if TypeBox is insufficient and the additional build
   complexity has a measurable payoff.

For `troop-movement-resolver.ts`, retain Zod. Its schemas validate small database
rows around much more expensive SQL and event-processing work.

## Reproducing the benchmark

The source and exact commands are documented in
[`benchmarks/validation/README.md`](/benchmarks/validation/README.md).

