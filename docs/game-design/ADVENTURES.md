# Adventures

## 1. Introduction

This document provides an overview of hero adventures functionality in **Pillage First, Ask Questions Later**. It covers
implementation details, notes important files, and caveats.

**Please read the documentation on [**HERO](./HERO.md) before starting with this document.**

## 2. Overview

Adventures are special events which only a hero may complete. Heroes may embark on adventures and if they survive, they
receive experience and treasure. Treasure may come in form of **silver**, **items**, **troops** or **nothing**, if
they're unlucky.

### Requirements

Heroes may only start adventures if the following conditions are met: they have available **adventure points**.

* Hero is alive
* Hero is in the source village (adventures can't be started if hero is currently on adventure, attacking or reinforcing
  other villages)
* Player has at least 1 adventure point available

Player starts with 3 adventure points. A new adventure points is gained every couple of hours. This duration depends on
game world speed.
Adventure may be started from any village a hero is currently positioned in.

### Duration

Adventure duration is calculated based on amount of completed adventures and game world seed.

```ts
const adventurePrng = prngMulberry32(`${seed}${amount_of_completed_adventures}`);

// Short adventure is between 8 & 12 minutes long
const adventureDuration = seededRandomIntFromInterval(adventurePrng, 8 * 60, 12 * 60) * 1000;
```

Duration does not depend on hero's equipped gear (horse, boots with speed bonus,...).

### Rewards

Each successful adventure rewards experience and may reward silver, items, troops or nothing.

#### Experience

TODO: Experience formula. Generally experience should go up with amount of completed oasis, but we need to find a balanced equation.

#### Additional rewards

TODO: We need to design loot tables
