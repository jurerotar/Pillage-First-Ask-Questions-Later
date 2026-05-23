# Combat implementation

This document tracks **what is currently implemented in code** for the combat system, mapped against the canonical formula described in [COMBAT_MECHANICS.md](./COMBAT_MECHANICS.md). It is meant for contributors who want to know the gap between the reference and the running code.

The reference doc preserves the Kirilloid / Travian blog material. Do not edit that file for implementation notes — keep them here.

## Core resolver

The pure combat function lives at `packages/api/src/controllers/resolvers/utils/battle.ts`:

```ts
resolveBattle(attackers, defenders, modifiers) → BattleResult
```

It is intentionally DB-free so it can be unit tested in isolation. Tests are in `packages/api/src/controllers/resolvers/utils/__tests__/battle.test.ts`.

## Mapping to the reference formula

| Reference section | What the code does today | Status |
| --- | --- | --- |
| Offense and defense points | Sums `amount × attack` for attackers; sums `amount × defence` for defenders. Defence type (infantry vs cavalry) is weighted by the attacker mix. | ✅ Implemented |
| Mixed infantry/cavalry attack | `cavalryShare = cavalry_attack_power / total_attack_power`. Defender defence is computed as `infDef × infShare + cavDef × cavShare`. | ✅ Implemented |
| Normal attack vs raid | Raids apply a flat `× 0.5` multiplier to both sides' loss rates. **The Travian raid formula (`x / (1 + x)`) is NOT used yet** — current implementation is the simpler half-loss heuristic. | ⚠️ Simplified |
| Winner casualty formula `(loser / winner)^1.5` | Implemented with a fixed exponent of `1.5`. | ✅ Implemented |
| Loser casualty = 100% on normal attack | Implemented: losing side has `lossRate = 1`. | ✅ Implemented |
| Immense-battle exponent `K = 2·(1.8592 − N^0.015)` | **Not implemented.** Exponent is hard-coded to `1.5` regardless of army size. | ❌ Missing |
| Wall multiplier (tribe-specific `base^level`) | Read from existing `infantryDefence` / `cavalryDefence` effects (`type='bonus'`) which are already produced by wall buildings. Applied as `defencePower × wallBonus`. | ✅ Reuses existing effects |
| Wall base defence | Read from `type='base'` defence effects (already produced by walls). Applied as `+ wallBase` after the multiplier. | ✅ Reuses existing effects |
| Watchtowers (City annual special) | Not modelled. | ❌ Missing |
| Basic village defence (`10` baseline) | **Not implemented.** Empty villages have `0` defence. The "lone unit with <83 attack dies" rule is also missing. | ❌ Missing |
| Residence / Palace / Command Centre `2·n²` defence | Not implemented. The `HEROS_MANSION` slots are used by oasis occupation only. | ❌ Missing |
| Smithy upgrade modifier `BASE + (BASE + 300·UPKEEP/7) × (1.007^L − 1)` | Smithy effects exist in `unit_improvements` table but **are not yet read** by the resolver. Unit stats come straight from `@pillage-first/game-assets/units`. | ❌ Missing |
| Hero attack / defence bonus | Hero is treated as a regular unit. Hero attributes (`fightStrength`, `attackBonus`, `defenceBonus`) and equipped items are not applied. | ❌ Missing |
| Brewery / Natar horn / alliance metallurgy / payment ban malus | Not modelled (no alliance / Natar / payment systems yet). | ❌ Missing |
| Moral bonus (population difference) | Parameter `moralBonus` exists in the modifier struct but is always passed as `1` by callers. The formula is not implemented. | ⚠️ Stubbed |
| Rams reducing wall to a "virtual level" | Not implemented. Rams currently behave as normal units. | ❌ Missing |
| Catapults destroying buildings | Not implemented. | ❌ Missing |
| Cranny hiding resources from raid | Not implemented. Loot logic itself is not in the resolver yet (planned). | ❌ Missing |
| Hospital saving 40% of casualties | Not implemented. UI text exists, mechanic does not. | ❌ Missing |
| Wave attacks (multiple events resolving simultaneously) | Not implemented. Each `troopMovementAttack` resolves independently. | ❌ Missing |

## Tunable parameters

All knobs are in `battle.ts` and easy to swap:

| Name | Current value | Notes |
| --- | --- | --- |
| Winner casualty exponent | `1.5` | Should become `K = 2·(1.8592 − N^0.015)` to honour immense-battle scaling. |
| Raid loss multiplier | `× 0.5` per side | Travian formula is `100% · x / (100% + x)`. The current heuristic over-rewards the winner of small raids and under-rewards them at scale. |
| Moral bonus | `1` (no effect) | Awaiting population-diff formula. |
| Oasis defence bonus | `0` (treated as `1` internally) | Caller must compute and pass when target is an oasis. |
| Lone-attacker minimum offence | Not enforced | Travian kills any single attacker with offence < 83 regardless of result. |
| Base village defence | `0` | Travian uses `10`, scaled by wall. |

## What invokes `resolveBattle`

Today **nothing in production code does.** The function is ready and tested, but the resolvers in [`troop-movement-resolver.ts`](../../packages/api/src/controllers/resolvers/troop-movement-resolver.ts) still contain `// TODO: Combat`. Wiring is the next phase (see the "Phases" section below).

There is one ad-hoc consumer: the dev tool endpoint `POST /developer-settings/:villageId/spawn-report` inserts a hand-crafted `BattleReport` so the report UI can be exercised without combat. It does **not** call `resolveBattle`.

## Reports persistence

Battles are intended to write rows to the `reports` table. The schema and DTOs already exist:

- Schema: `packages/db/src/schemas/reports-schema.sql`
- Upgrade path for existing saves: `CREATE TABLE IF NOT EXISTS reports …` in `packages/db/src/migrations/upgrade-db.ts`
- DTO: `packages/types/src/dtos/report.ts`
- Insert utility: `packages/api/src/controllers/resolvers/utils/reports.ts`

The full payload (`BattleReportPayload`) currently stores attacker/defender parties, troop-level losses, bonuses applied, and optional `loot`. It does **not** include hero details, smithy levels at time of battle, or building damage — those will need payload extensions when the corresponding mechanics land.

## Phases planned

1. **Reports plumbing.** ✅ Done. Schema, DTOs, controllers, FE list and detail page.
2. **`resolveBattle` pure function.** ✅ Done.
3. **Plug into `attackMovementResolver`.** Load defenders by tile, read wall bonus from effects, call `resolveBattle`, persist losses, insert two reports (attacker side, defender side), dispatch return movement with survivors.
4. **Raid with loot.** Compute carry capacity of survivors, subtract from village resources after cranny, attach loot to return movement, settle on arrival.
5. **Oasis occupation.** Resolve combat against oasis animals; on win, assign oasis to attacking village and apply its production effects.
6. **Hospital / Trapper.** Post-battle processing: convert a fraction of losses into wounded troops; jail enemy survivors when relevant.
7. **Scout flow.** New `troopMovementScout` event type and resolver, generating `scout-attack` / `scout-defence` reports.
8. **Chief / loyalty path.** Hook into the existing `loyaltyIncrease` event when an attack containing a chief succeeds.
9. **Catapult / ram damage.** Building destruction, wall virtual-level mechanic.
10. **Smithy, hero, moral, immense-battle exponent.** Refinements once the base loop is stable.

## When the formula changes

Any tuning of `battle.ts` (exponents, raid divisor, base defence, etc.) must:

1. Update this document so the gap table stays accurate.
2. Update the tests in `battle.test.ts` if the change alters loss numbers that the tests assert numerically.
3. Be considered in light of pre-existing player save states — combat is not retroactive, but the math affecting upcoming battles can swing player expectations.
