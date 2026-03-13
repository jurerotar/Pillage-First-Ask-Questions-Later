import { describe, expect, test } from 'vitest';
import {
  type Army,
  type BattleTroop,
  resolveAttackValue,
  resolveCasualties,
  resolveDefenceValue,
} from 'app/(game)/(village-slug)/utils/battle-resolver';

const newArmy = (troops: BattleTroop[]): Army => ({
  tribe: 'romans',
  troops,
});

// TODO: Reinforcements
// TODO: Palace/residence/command center
// TODO: Trapper
// TODO: Hero
// TODO: Rams
// TODO: Catapults
// TODO: Hospital
// TODO: Brewery
// TODO: Possibly WW and other special buildings.
// TODO: Artifacts

describe(resolveAttackValue, () => {
  test('empty army should return 0 attack points', () => {
    const attackingArmy: Army = newArmy([]);

    const { totalAttackPoints } = resolveAttackValue({ attackingArmy });

    expect(totalAttackPoints).toBe(0);
  });

  test('multiunit army should return correct attack points', () => {
    const attackingArmy: Army = newArmy([
      {
        // att: 40
        unitId: 'LEGIONNAIRE',
        amount: 5,
        improvementLevel: 0,
      },
      {
        // att: 180
        unitId: 'EQUITES_CAESARIS',
        amount: 10,
        improvementLevel: 0,
      },
    ]);

    const { totalAttackPoints } = resolveAttackValue({ attackingArmy });

    // 40 * 5 + 180 * 10 = 2000
    expect(totalAttackPoints).toBe(2000);
  });

  test('should return correct number of units', () => {
    const attackingArmy: Army = newArmy([
      {
        unitId: 'LEGIONNAIRE',
        amount: 500,
        improvementLevel: 0,
      },
      {
        unitId: 'EQUITES_CAESARIS',
        amount: 2000,
        improvementLevel: 0,
      },
    ]);

    const { attackingTroopCount } = resolveAttackValue({ attackingArmy });

    expect(attackingTroopCount).toBe(2500);
  });

  test('should return correct attack proportion for only infantry', () => {
    const attackingArmy: Army = newArmy([
      {
        unitId: 'LEGIONNAIRE',
        amount: 500,
        improvementLevel: 0,
      },
      {
        unitId: 'IMPERIAN',
        amount: 2000,
        improvementLevel: 0,
      },
    ]);

    const { infAttackProportion, cavAttackProportion } = resolveAttackValue({
      attackingArmy,
    });

    expect(infAttackProportion).toBe(1);
    expect(cavAttackProportion).toBe(0);
  });

  test('should return correct attack proportion for only cavalry', () => {
    const attackingArmy: Army = newArmy([
      {
        unitId: 'EQUITES_IMPERATORIS',
        amount: 500,
        improvementLevel: 0,
      },
      {
        unitId: 'EQUITES_CAESARIS',
        amount: 2000,
        improvementLevel: 0,
      },
    ]);

    const { infAttackProportion, cavAttackProportion } = resolveAttackValue({
      attackingArmy,
    });

    expect(infAttackProportion).toBe(0);
    expect(cavAttackProportion).toBe(1);
  });

  test('should return correct attack proportion for mixed army', () => {
    const attackingArmy: Army = newArmy([
      {
        unitId: 'LEGIONNAIRE',
        amount: 50,
        improvementLevel: 0,
      },
      {
        unitId: 'EQUITES_CAESARIS',
        amount: 100,
        improvementLevel: 0,
      },
    ]);

    const { infAttackProportion, cavAttackProportion } = resolveAttackValue({
      attackingArmy,
    });

    // inf att: 50 * 40 = 2000
    // cav att: 100 * 180 = 18000
    // inf att proportion = 2000 / 20000 = 0.1
    // inf att proportion = 18000 / 20000 = 0.9

    expect(infAttackProportion).toBe(0.1);
    expect(cavAttackProportion).toBe(0.9);
  });

  test('should reflect the improvement level', () => {
    const attackingArmy: Army = newArmy([
      {
        unitId: 'LEGIONNAIRE',
        amount: 50,
        improvementLevel: 10,
      },
      {
        unitId: 'EQUITES_CAESARIS',
        amount: 100,
        improvementLevel: 0,
      },
    ]);

    const { infAttackProportion, cavAttackProportion } = resolveAttackValue({
      attackingArmy,
    });

    // inf improved value: 50 + (50 + (300 * 1 / 7)) * (1,007 ** 10 - 1) = 56,71
    // inf att: 56,71 * 40 = 2268,34
    // cav att: 100 * 180 = 18000
    // attack total: 20268,34
    // inf att proportion: 2268,34 / 20268,34 = 0.11
    // inf att proportion: 18000 / 20268,34 = 0.89

    expect(infAttackProportion).toBeCloseTo(0.11);
    expect(cavAttackProportion).toBeCloseTo(0.89);
  });
});

describe(resolveDefenceValue, () => {
  test('should return correct amount of defending troops', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          unitId: 'SPEARMAN',
          amount: 200,
          improvementLevel: 0,
        },
        {
          unitId: 'PALADIN',
          amount: 800,
          improvementLevel: 0,
        },
      ],
    };

    const { defendingTroopCount } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    expect(defendingTroopCount).toBe(1000);
  });

  test('empty city should return 0 defending troops', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [],
    };

    const { defendingTroopCount } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    expect(defendingTroopCount).toBe(0);
  });

  test('empty city should return 10 defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [],
    };

    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    expect(totalDefencePoints).toBe(10);
  });

  test('an attack with only infantry should return correct proportional defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          // inf def: 35
          unitId: 'SPEARMAN',
          amount: 10,
          improvementLevel: 0,
        },
      ],
    };

    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    // def: 10 + 35 * 10 = 360
    expect(totalDefencePoints).toBe(360);
  });

  test('an attack with only cavalry should return correct proportional defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          // cav def: 60
          unitId: 'SPEARMAN',
          amount: 10,
          improvementLevel: 0,
        },
      ],
    };

    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 0,
      cavAttackProportion: 1,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    // def: 10 + 60 * 10 = 610
    expect(totalDefencePoints).toBe(610);
  });

  test('an attack with mixed units should return correct proportional defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          // inf def: 35
          // cav def: 60
          unitId: 'SPEARMAN',
          amount: 10,
          improvementLevel: 0,
        },
      ],
    };

    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 0.4,
      cavAttackProportion: 0.6,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    // inf def: 35 * 10 = 350
    // cav def: 60 * 10 = 600
    // inf def proportional: 350 * 0.4 = 140
    // cav def proportional: 600 * 0.6 = 360
    // total def: 10 + 140 + 360 = 510

    expect(totalDefencePoints).toBe(510);
  });

  test('a city with a level 1 wall should return correct defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          // inf def: 35
          unitId: 'SPEARMAN',
          amount: 10,
          improvementLevel: 0,
        },
      ],
    };

    // teuton walls
    const wallFlatDefenceBonus = 6;
    const wallPercentDefenceBonus = 1.02;
    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus,
      wallPercentDefenceBonus,
    });

    // base unit def: 350
    // def with percent wall bonus: 350 * 1,02 = 357
    // def with flat wall bonus: 357 + 6 = 363
    // def with base bonus : 363 + 10 = 373

    expect(totalDefencePoints).toBe(373);
  });

  test('a city with a level 20 wall should return correct defence points', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          // inf def: 35
          unitId: 'SPEARMAN',
          amount: 10,
          improvementLevel: 0,
        },
      ],
    };

    // teuton walls
    const wallFlatDefenceBonus = 6 * 20;
    const wallPercentDefenceBonus = 1.02 ** 20;
    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 1,
      cavAttackProportion: 0,
      wallFlatDefenceBonus,
      wallPercentDefenceBonus,
    });

    // base unit def: 350
    // def with percent wall bonus: 350 * 1,49 = 520,08
    // def with flat wall bonus: 520,8 + 120 = 640,08
    // def with base bonus : 640,8 + 10 = 650,08

    expect(totalDefencePoints).toBeCloseTo(650.08);
  });

  test('should reflect the improvement level', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [
        {
          unitId: 'TEUTONIC_KNIGHT',
          amount: 10,
          improvementLevel: 20,
        },
      ],
    };

    // teuton walls
    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies: [],
      infAttackProportion: 0.5,
      cavAttackProportion: 0.5,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    // wheat consumption: 3
    // base unit inf def: 50
    // base unit cav def: 70
    // improved inf def value: 50 + (50 + (300 * 3 / 7)) * (1,007 ** 20 - 1) = 76,73
    // improved inf def value: 75 + (75 + (300 * 3 / 7)) * (1,007 ** 20 - 1) = 105,48
    // proportional inf def: 76,73 * 10 * 0.5 = 383,67
    // proportional cav def: 105,48 * 10 * 0.5 = 527,38
    // total defence: 383,67 + 498,64 + 10 = 911,06

    expect(totalDefencePoints).toBeCloseTo(921.06);
  });

  test('should include reinforcements', () => {
    const defendingArmy: Army = {
      tribe: 'teutons',
      troops: [],
    };

    const reinforcingArmies: Army[] = [
      {
        tribe: 'nature',
        troops: [
          {
            unitId: 'SPIDER',
            amount: 10,
            improvementLevel: 0,
          },
        ],
      },
      {
        tribe: 'gauls',
        troops: [
          {
            unitId: 'PHALANX',
            amount: 100,
            improvementLevel: 0,
          },
        ],
      },
    ];

    // teuton walls
    const { totalDefencePoints } = resolveDefenceValue({
      defendingArmy,
      reinforcingArmies,
      infAttackProportion: 0.5,
      cavAttackProportion: 0.5,
      wallFlatDefenceBonus: 0,
      wallPercentDefenceBonus: 1,
    });

    // nature inf def: 35 * 10 = 350
    // nature inf def: 40 * 10 = 400

    // gauls inf def: 40 * 100 = 4000
    // gauls cav def: 40 * 100 = 5000

    // total inf def: (350 + 4000) * 0,5 = 2175
    // total cav def: (400 + 5000) * 0,5 = 2700

    // total def: 2175 + 2700 + 10 = 4885

    expect(totalDefencePoints).toBe(4885);
  });
});

describe(resolveCasualties, () => {
  test('when attacking points == defensive points the defender should win', () => {
    const { winner } = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 100,
      totalDefencePoints: 100,
      attackingTroopCount: 5,
      totalTroopCount: 10,
    });

    expect(winner).toBe('defender');
  });

  test('when attacking points < defensive points the defender should win', () => {
    const { winner } = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 100,
      totalDefencePoints: 200,
      attackingTroopCount: 5,
      totalTroopCount: 10,
    });

    expect(winner).toBe('defender');
  });

  test('when attacking points > defensive points the attacker should win', () => {
    const { winner } = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 200,
      totalDefencePoints: 100,
      attackingTroopCount: 5,
      totalTroopCount: 10,
    });

    expect(winner).toBe('attacker');
  });

  test('loser should use all units during normal attack', () => {
    const report = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 200,
      totalDefencePoints: 100,
      attackingTroopCount: 5,
      totalTroopCount: 10,
    });

    expect(report.attackerCasualtyRate).toBeLessThan(1);
    expect(report.defenderCasualtyRate).toBe(1);
  });

  test('casualties should be correct during raid', () => {
    const report = resolveCasualties({
      battleType: 'raid',
      totalAttackPoints: 200,
      totalDefencePoints: 100,
      attackingTroopCount: 5,
      totalTroopCount: 10,
    });

    // base casualty rate: (100 / 200) ** 1,5 = 0,35
    // winner casualties:  0,35 / (1 + 0,35) = 0,26
    // loser casualties:   1 - 0,26 = 0,74

    expect(report.attackerCasualtyRate).toBeCloseTo(0.26);
    expect(report.defenderCasualtyRate).toBeCloseTo(0.74);
  });

  test('a single winning attacking unit should die if attacking points < 83', () => {
    const { attackerCasualtyRate } = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 82,
      totalDefencePoints: 10,
      attackingTroopCount: 1,
      totalTroopCount: 0,
    });

    expect(attackerCasualtyRate).toBe(1);
  });

  test('a single winning attacking unit should survive if attacking points >= 83', () => {
    const { attackerCasualtyRate } = resolveCasualties({
      battleType: 'attack',
      totalAttackPoints: 83,
      totalDefencePoints: 10,
      attackingTroopCount: 1,
      totalTroopCount: 0,
    });

    expect(attackerCasualtyRate).toBeLessThan(0.5);
  });

  test('a large scale battle should use another formula for K (> 1000 units)', () => {
    const report = resolveCasualties({
      battleType: 'raid',
      totalAttackPoints: 20000,
      totalDefencePoints: 10000,
      attackingTroopCount: 5000,
      totalTroopCount: 13000,
    });

    // k = 2 * (1,8592 - 13000 ** 0.015) = 1,41
    // base casualty rate: (10000 / 20000) ** 1,41 = 0,38
    // winner casualties:  0,35 / (1 + 0,35) = 0,27
    // loser casualties:   1 - 0,27 = 0,73

    expect(report.attackerCasualtyRate).toBeCloseTo(0.27);
    expect(report.defenderCasualtyRate).toBeCloseTo(0.73);
  });

  test('when attacking points and defence points being zero should return valid result', () => {
    const report = resolveCasualties({
      battleType: 'raid',
      totalAttackPoints: 0,
      totalDefencePoints: 0,
      attackingTroopCount: 0,
      totalTroopCount: 0,
    });

    expect(report.defenderCasualtyRate).toBe(0);
    expect(report.attackerCasualtyRate).toBe(1);
  });
});
