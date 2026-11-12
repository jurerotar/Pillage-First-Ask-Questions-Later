import { z } from 'zod';
import { artifacts } from '@pillage-first/game-assets/items';
import {
  getUnitDefinition,
  getUnitsByTribe,
} from '@pillage-first/game-assets/utils/units';
import {
  oasisCaptureFailureReasonSchema,
  villageConquestFailureReasonSchema,
} from '@pillage-first/types/models/battle';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  calculateBattleUnitLosses,
  calculateSurvivingCarryCapacity,
  distributeLoot,
} from '@pillage-first/utils/game/combat';
import {
  type CreateNewBattleReport,
  insertBattleReport,
} from '../../utils/report';

type PreviewParticipant = CreateNewBattleReport['attacker'];
type PreviewUnit = PreviewParticipant['units'][number];

const setRemaining = (participant: PreviewParticipant, amount: number) => {
  for (const unit of participant.units) {
    unit.amountAfter = Math.min(amount, unit.amountBefore);
  }
};

// Preview strengths use base unit values: no smithy, walls, equipment, or village bonuses.
// Heroes use the catalog's unmounted base values. This does not resolve combat.
const finalizePreview = (report: CreateNewBattleReport) => {
  const defenders = [report.defender, ...report.reinforcements];
  const defendingUnits = defenders.flatMap(({ units }) => units);
  let infantryAttack = 0;
  let cavalryAttack = 0;
  for (const unit of report.attacker.units) {
    const definition = getUnitDefinition(unit.unitId);
    const strength =
      definition.attack * (unit.amountBefore - unit.amountImprisoned);
    if (definition.category === 'cavalry') {
      cavalryAttack += strength;
    } else {
      infantryAttack += strength;
    }
  }
  report.attackerPoints = infantryAttack + cavalryAttack;
  const infantryShare =
    report.attackerPoints > 0 ? infantryAttack / report.attackerPoints : 1;
  let defence = 0;
  for (const unit of defendingUnits) {
    const definition = getUnitDefinition(unit.unitId);
    defence +=
      unit.amountBefore *
      (definition.infantryDefence * infantryShare +
        definition.cavalryDefence * (1 - infantryShare));
  }
  report.defenderPoints = Math.round(defence);
  if (report.capturedAnimals.length > 0) {
    report.attackerPoints = 0;
    report.defenderPoints = 0;
  }

  const role = report.outcome.startsWith('attacker') ? 'attacker' : 'defender';
  const ownUnits = role === 'attacker' ? report.attacker.units : defendingUnits;
  let before = 0;
  let after = 0;
  for (const unit of ownUnits) {
    before += unit.amountBefore - unit.amountConsumed;
    after += unit.amountAfter;
  }
  const loss =
    before === after ? 'NoLoss' : after === 0 ? 'FullLoss' : 'SomeLoss';
  report.outcome = `${role}${loss}`;

  const carryCapacity = calculateSurvivingCarryCapacity(
    report.attacker.units.map((unit) => ({
      amountAfter: unit.amountAfter,
      unitCarryCapacity: getUnitDefinition(unit.unitId).unitCarryCapacity,
    })),
  );
  const canLoot =
    report.isRaid ||
    defendingUnits.every(({ amountAfter }) => amountAfter === 0);
  report.loot = distributeLoot(report.loot, canLoot ? carryCapacity : 0);

  const killedSupply = (units: PreviewUnit[]) => {
    let total = 0;
    for (const unit of units) {
      total +=
        calculateBattleUnitLosses(unit).dead *
        getUnitDefinition(unit.unitId).unitWheatConsumption;
    }
    return total;
  };
  for (const [participants, experience] of [
    [[report.attacker], killedSupply(defendingUnits)],
    [defenders, killedSupply(report.attacker.units)],
  ] as const) {
    const survivingHeroes = participants.filter(
      ({ hero }) => hero !== null && hero.healthAfter > 0,
    );
    for (const { hero } of participants) {
      if (hero !== null) {
        hero.experienceGained =
          hero.healthAfter > 0
            ? Math.floor(experience / survivingHeroes.length)
            : 0;
      }
    }
  }
};

// Temporary visual fixtures. Only records tracked in this table are replaced.
export const seedTemporaryBattleReports = (
  database: DbFacade,
  playerId: number,
) => {
  database.execMulti({
    sql: `CREATE TABLE IF NOT EXISTS temporary_battle_report_previews (
    report_id INTEGER PRIMARY KEY, label TEXT NOT NULL,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
  );`,
  });
  const villages = database.selectObjects({
    sql: 'SELECT v.id, v.tile_id, v.player_id, ti.tribe FROM villages v JOIN players p ON p.id = v.player_id JOIN tribe_ids ti ON ti.id = p.tribe_id ORDER BY v.id;',
    schema: z.strictObject({
      id: z.int(),
      tile_id: z.int(),
      player_id: z.int(),
      tribe: tribeSchema,
    }),
  });
  const own = villages.find((v) => v.player_id === playerId);
  const enemy = villages.find(
    (v) => v.player_id !== playerId && v.tribe !== 'nature',
  );
  const reinforcement = villages.find(
    (v) => v.id !== own?.id && v.id !== enemy?.id && v.tribe !== 'nature',
  );
  if (!own || !enemy || !reinforcement) {
    throw new Error(
      'Preview reports require a player village and two other villages.',
    );
  }
  const gaulEnemy = villages.find(
    ({ tribe, id }) => tribe === 'gauls' && id !== own.id,
  );
  const oasisTileId = database.selectValue({
    sql: "SELECT t.id FROM tiles t JOIN tile_type_ids tt ON tt.id = t.type_id WHERE tt.type = 'oasis' LIMIT 1;",
    schema: z.int(),
  });
  if (!oasisTileId) {
    throw new Error('No oasis is available for capture previews.');
  }

  const reports: { id: number; label: string }[] = [];
  let availableSlots = 1000;
  const now = Date.now();
  const unit = (
    unitId: PreviewUnit['unitId'],
    amountAfter = 70,
  ): PreviewUnit => ({
    unitId,
    amountBefore: 100,
    amountAfter,
    amountHospitalized: 0,
    amountImprisoned: 0,
    amountBandaged: 0,
    amountConsumed: 0,
  });
  const participant = (village: typeof own): PreviewParticipant => ({
    hero: null,
    tileId: village.tile_id,
    playerId: village.player_id,
    units: [unit(getUnitsByTribe(village.tribe)[0].id)],
  });
  const addHero = (army: PreviewParticipant) => {
    army.units.push({ ...unit('HERO', 1), amountBefore: 1 });
    army.hero = {
      heroId: 1,
      healthBefore: 100,
      healthAfter: 90,
      experienceGained: 0,
      consumables: [],
    };
  };
  const base = (
    role: 'attacker' | 'defender' = 'attacker',
  ): CreateNewBattleReport => {
    const attacker = role === 'attacker' ? own : enemy;
    const defender = role === 'attacker' ? enemy : own;
    return {
      villageId: own.id,
      timestamp: now,
      outcome: role === 'attacker' ? 'attackerSomeLoss' : 'defenderSomeLoss',
      originTileId: attacker.tile_id,
      targetTileId: defender.tile_id,
      isRaid: false,
      loot: [1200, 800, 400, 200],
      attackerPoints: 0,
      defenderPoints: 0,
      loyaltyBefore: null,
      loyaltyAfter: null,
      conquest: null,
      villageDestroyed: false,
      trapsDestroyed: 0,
      rescuedUnits: [],
      capturedAnimals: [],
      stolenItems: [],
      siegeResults: [],
      reinforcements: [],
      attacker: participant(attacker),
      defender: {
        ...participant(defender),
        units: [unit(getUnitsByTribe(defender.tribe)[0].id, 0)],
      },
    };
  };
  const add = (label: string, report: CreateNewBattleReport) => {
    if (reports.length >= availableSlots) {
      throw new Error(
        'Not enough report slots. Import the separate preview world instead.',
      );
    }

    if (report.siegeResults.length > 0) {
      const attackerVillage = villages.find(
        ({ tile_id }) => tile_id === report.originTileId,
      )!;
      const catapult = getUnitsByTribe(attackerVillage.tribe).find(({ id }) =>
        id.endsWith('_CATAPULT'),
      )!;
      const noSurvivingSiege = report.siegeResults.some(
        ({ reason }) => reason === 'no-surviving-siege',
      );
      report.attacker.units.push({
        ...unit(catapult.id, noSurvivingSiege ? 0 : 40),
        amountBefore: 40,
      });
    }
    finalizePreview(report);
    report.timestamp = now - reports.length * 1000;
    const id = insertBattleReport(database, report);
    database.exec({
      sql: 'INSERT INTO temporary_battle_report_previews(report_id, label) VALUES ($id, $label);',
      bind: { $id: id, $label: label },
    });
    reports.push({ id, label });
  };
  database.transaction(() => {
    database.exec({
      sql: 'DELETE FROM reports WHERE id IN (SELECT report_id FROM temporary_battle_report_previews);',
    });
    database.exec({ sql: 'DELETE FROM temporary_battle_report_previews;' });
    availableSlots =
      1000 -
      database.selectValue({
        sql: "SELECT COUNT(*) FROM reports r WHERE NOT EXISTS (SELECT 1 FROM report_tags rt JOIN report_tag_ids ti ON ti.id = rt.report_tag_id WHERE rt.report_id = r.id AND ti.tag = 'archived');",
        schema: z.int(),
      })!;
    for (const mode of ['attack', 'raid'] as const) {
      for (const role of ['attacker', 'defender'] as const) {
        for (const loss of ['NoLoss', 'SomeLoss', 'FullLoss'] as const) {
          for (const reinforced of [false, true]) {
            const report = base(role);
            report.isRaid = mode === 'raid';
            report.outcome = (role + loss) as CreateNewBattleReport['outcome'];
            const ownUnits =
              role === 'attacker'
                ? report.attacker.units
                : report.defender.units;
            const otherUnits =
              role === 'attacker'
                ? report.defender.units
                : report.attacker.units;
            ownUnits[0].amountAfter =
              loss === 'NoLoss' ? 100 : loss === 'SomeLoss' ? 70 : 0;
            otherUnits[0].amountAfter =
              mode === 'attack' && loss !== 'FullLoss' ? 0 : 80;
            if (reinforced) {
              report.reinforcements = [participant(reinforcement)];
              report.reinforcements[0].units[0].amountAfter =
                role === 'defender'
                  ? ownUnits[0].amountAfter
                  : !report.isRaid && loss !== 'FullLoss'
                    ? 0
                    : 80;
            }
            if (
              mode === 'attack' &&
              role === 'attacker' &&
              loss !== 'FullLoss'
            ) {
              report.siegeResults = [
                {
                  fieldId: 20,
                  requestedBuildingId: 'WAREHOUSE',
                  buildingId: 'WAREHOUSE',
                  targeting: 'selected',
                  outcome: 'damaged',
                  reason: null,
                  levelBefore: 20,
                  levelAfter: 12,
                },
                {
                  fieldId: 1,
                  requestedBuildingId: 'WHEAT_FIELD',
                  buildingId: 'WHEAT_FIELD',
                  targeting: 'selected',
                  outcome: 'destroyed',
                  reason: null,
                  levelBefore: 10,
                  levelAfter: 0,
                },
              ];
            }
            add(
              [mode, role, loss, reinforced ? 'reinforced' : 'solo'].join(
                ' / ',
              ),
              report,
            );
          }
        }
      }
    }
    const hidden = base();
    hidden.attacker.units[0].amountAfter = 0;
    hidden.defender.units[0].amountAfter = 100;
    hidden.reinforcements = [participant(reinforcement)];
    hidden.reinforcements[0].units[0].amountAfter = 100;
    hidden.outcome = 'attackerFullLoss';
    hidden.loot = [0, 0, 0, 0];
    add('Attack / hidden defender details', hidden);
    for (const role of ['attacker', 'defender'] as const) {
      for (const died of [false, true]) {
        const report = base(role);
        const owner = role === 'attacker' ? report.attacker : report.defender;
        owner.units.push({ ...unit('HERO', died ? 0 : 1), amountBefore: 1 });
        owner.hero = {
          heroId: 1,
          healthBefore: 85,
          healthAfter: died ? 0 : 42,
          experienceGained: 0,
          consumables: [],
        };
        owner.units[0] = {
          ...owner.units[0],
          amountAfter: 40,
          amountHospitalized: 15,
          amountBandaged: 10,
          amountImprisoned: 0,
        };
        report.reinforcements = [
          {
            ...participant(reinforcement),
            hero: {
              heroId: 2,
              healthBefore: 100,
              healthAfter: 65,
              experienceGained: 0,
              consumables: [],
            },
            units: [
              ...participant(reinforcement).units,
              { ...unit('HERO', 1), amountBefore: 1 },
            ],
          },
        ];
        if (role === 'attacker') {
          setRemaining(report.defender, 0);
          report.reinforcements[0].hero!.healthAfter = 0;
          setRemaining(report.reinforcements[0], 0);
        } else {
          setRemaining(report.attacker, 0);
        }
        add(
          [
            role,
            `hero ${died ? 'death' : 'survival'}`,
            'hospital + bandages',
          ].join(' / '),
          report,
        );
      }
    }
    for (const role of ['attacker', 'defender'] as const) {
      const success = base(role);
      success.conquest = {
        target: 'village',
        succeeded: true,
        failureReason: null,
      };
      success.loyaltyBefore = 22.5;
      success.loyaltyAfter = 0;
      const chief = getUnitsByTribe(
        role === 'attacker' ? own.tribe : enemy.tribe,
      ).find((u) => u.category === 'administration');
      if (chief) {
        success.attacker.units.push({
          ...unit(chief.id, 0),
          amountBefore: 1,
          amountConsumed: 1,
        });
      }
      add(`${role} / Village conquered`, success);
      for (const reason of villageConquestFailureReasonSchema.options) {
        const report = base(role);
        report.conquest = {
          target: 'village',
          succeeded: false,
          failureReason: reason,
        };
        report.loyaltyBefore = 100;
        report.loyaltyAfter = reason === 'loyalty-not-zero' ? 75 : 100;
        if (chief) {
          report.attacker.units.push({
            ...unit(chief.id, reason === 'no-surviving-administrator' ? 0 : 1),
            amountBefore: 1,
          });
        }
        if (reason === 'defenders-survived') {
          setRemaining(report.attacker, 0);
          setRemaining(report.defender, 80);
        }
        add(`${role} / Village failure / ${reason}`, report);
      }
    }
    for (const reason of [null, ...oasisCaptureFailureReasonSchema.options]) {
      const report = base();
      report.targetTileId = oasisTileId;
      report.defender = {
        hero: null,
        tileId: oasisTileId,
        playerId: null,
        units: [unit('RAT', 0)],
      };
      report.conquest = {
        target: 'oasis',
        succeeded: reason === null,
        failureReason: reason,
      };
      report.loyaltyBefore = 100;
      report.loyaltyAfter =
        reason === null ? 0 : reason === 'loyalty-not-zero' ? 50 : 100;
      report.attacker.hero = {
        heroId: 1,
        healthBefore: 100,
        healthAfter:
          reason === 'no-surviving-hero' || reason === 'defenders-survived'
            ? 0
            : 90,
        experienceGained: 0,
        consumables: [],
      };
      report.attacker.units.push({
        ...unit('HERO', report.attacker.hero.healthAfter === 0 ? 0 : 1),
        amountBefore: 1,
      });
      if (reason === 'defenders-survived') {
        setRemaining(report.attacker, 0);
        setRemaining(report.defender, 80);
      }
      add(`Oasis / ${reason ?? 'captured'}`, report);
    }
    for (const died of [0, 5]) {
      if (!gaulEnemy) {
        continue;
      }
      const report = base();
      report.targetTileId = gaulEnemy.tile_id;
      report.defender = participant(gaulEnemy);
      setRemaining(report.defender, 0);
      report.trapsDestroyed = 20;
      report.rescuedUnits = [
        {
          playerId: own.player_id,
          homeTileId: own.tile_id,
          unitId: getUnitsByTribe(own.tribe)[0].id,
          amountFreed: 20,
          amountDied: died,
        },
      ];
      add(`Rescue / ${died} died`, report);
    }
    const traps = base();
    traps.trapsDestroyed = 15;
    if (gaulEnemy) {
      traps.targetTileId = gaulEnemy.tile_id;
      traps.defender = participant(gaulEnemy);
      setRemaining(traps.defender, 0);
      add('Traps destroyed / no rescued unit details', traps);
    }
    const captures = base();
    captures.targetTileId = oasisTileId;
    captures.defender = {
      tileId: oasisTileId,
      playerId: null,
      // Captured animals leave the defending army without combat casualties.
      units: natureUnitIdSchema.options.map((unitId, index) => ({
        ...unit(unitId, 0),
        amountBefore: index + 1,
        amountConsumed: index + 1,
      })),
      hero: null,
    };
    captures.capturedAnimals = natureUnitIdSchema.options.map(
      (unitId, index) => ({ unitId, amount: index + 1 }),
    );
    captures.attacker.hero = {
      heroId: 1,
      healthBefore: 100,
      healthAfter: 100,
      experienceGained: 0,
      consumables: [{ itemId: 1023, amount: 55 }],
    };
    captures.attacker.units = [{ ...unit('HERO', 1), amountBefore: 1 }];
    captures.loot = [0, 0, 0, 0];
    add('Cages / every animal type', captures);
    const loot = base();
    loot.stolenItems = artifacts
      .slice(0, 3)
      .map(({ id }) => ({ itemId: id, amount: 1 }));
    loot.stolenItems.push({ itemId: 1021, amount: 3 });
    addHero(loot.attacker);
    add('Items stolen / artifacts and consumables', loot);
    const destroyed = base();
    destroyed.villageDestroyed = true;
    destroyed.siegeResults = [
      {
        fieldId: 19,
        requestedBuildingId: 'MAIN_BUILDING',
        buildingId: 'MAIN_BUILDING',
        targeting: 'selected',
        outcome: 'destroyed',
        reason: null,
        levelBefore: 1,
        levelAfter: 0,
      },
    ];
    add('Village destroyed', destroyed);
    for (const recovery of ['hospital', 'bandages', 'prisoners'] as const) {
      const report = base();
      const u = report.attacker.units[0];
      u.amountAfter = 0;
      if (recovery === 'hospital') {
        u.amountHospitalized = 100;
      }
      if (recovery === 'bandages') {
        u.amountBandaged = 100;
        report.attacker.units.push({ ...unit('HERO', 1), amountBefore: 1 });
        report.attacker.hero = {
          heroId: 1,
          healthBefore: 100,
          healthAfter: 70,
          experienceGained: 0,
          consumables: [],
        };
      }
      if (recovery === 'prisoners') {
        u.amountImprisoned = 100;
        if (!gaulEnemy) {
          continue;
        }
        report.targetTileId = gaulEnemy.tile_id;
        report.defender = participant(gaulEnemy);
        setRemaining(report.defender, 100);
      }
      report.loot = [0, 0, 0, 0];
      add(`All missing troops / ${recovery}`, report);
    }
    const rescueWithoutTraps = base();
    rescueWithoutTraps.rescuedUnits = [
      {
        playerId: own.player_id,
        homeTileId: own.tile_id,
        unitId: getUnitsByTribe(own.tribe)[0].id,
        amountFreed: 8,
        amountDied: 0,
      },
    ];
    if (gaulEnemy) {
      rescueWithoutTraps.targetTileId = gaulEnemy.tile_id;
      rescueWithoutTraps.defender = participant(gaulEnemy);
      setRemaining(rescueWithoutTraps.defender, 0);
      add('Rescue / no traps destroyed', rescueWithoutTraps);
    }
    const itemOnly = base();
    itemOnly.stolenItems = [{ itemId: 1021, amount: 2 }];
    addHero(itemOnly.attacker);
    add('Items stolen / consumables only', itemOnly);
    const artifactsOnly = base();
    artifactsOnly.stolenItems = [{ itemId: artifacts[0].id, amount: 1 }];
    addHero(artifactsOnly.attacker);
    add('Items stolen / artifact only', artifactsOnly);
    for (const tribe of [
      'romans',
      'gauls',
      'teutons',
      'egyptians',
      'huns',
    ] as const) {
      const village = villages.find(
        (v) => v.tribe === tribe && v.id !== own.id,
      );
      if (village) {
        const report = base();
        report.targetTileId = village.tile_id;
        report.defender = participant(village);
        setRemaining(report.defender, 0);
        add(`Defender tribe / ${tribe}`, report);
      }
    }
    const mixed = base();
    const cavalry = getUnitsByTribe(own.tribe).find(
      ({ category, tier }) => category === 'cavalry' && tier !== 'scout',
    )!;
    mixed.attacker.units.push({ ...unit(cavalry.id, 28), amountBefore: 40 });
    mixed.reinforcements = [participant(reinforcement)];
    setRemaining(mixed.reinforcements[0], 0);
    add('Mixed infantry and cavalry / reinforced defence', mixed);
    const siege = base();
    const warehouseHit = {
      fieldId: 20,
      requestedBuildingId: 'WAREHOUSE',
      buildingId: 'WAREHOUSE',
      targeting: 'selected',
      outcome: 'damaged',
      reason: null,
      levelBefore: 20,
      levelAfter: 12,
    } satisfies CreateNewBattleReport['siegeResults'][number];
    siege.siegeResults = [warehouseHit, { ...warehouseHit, fieldId: 21 }];
    add('Siege / identical damage to two warehouse fields', siege);
    const failedSiege = base();
    failedSiege.siegeResults = [
      {
        ...warehouseHit,
        targeting: 'brewery',
        buildingId: 'GRANARY',
        fieldId: 22,
      },
      {
        ...warehouseHit,
        outcome: 'undamaged',
        reason: 'insufficient-power',
        levelAfter: 20,
      },
    ];
    add('Siege / randomized target and insufficient power', failedSiege);
    const noSiegeSurvivors = base();
    noSiegeSurvivors.siegeResults = [
      {
        ...warehouseHit,
        outcome: 'not-fired',
        reason: 'no-surviving-siege',
        levelAfter: 20,
      },
    ];
    add('Siege / no surviving catapults', noSiegeSurvivors);
    const missingTarget = base();
    missingTarget.siegeResults = [
      {
        ...warehouseHit,
        outcome: 'no-target',
        reason: 'target-missing',
        targeting: 'fallback',
        buildingId: null,
        fieldId: null,
        levelBefore: null,
        levelAfter: null,
      },
    ];
    add('Siege / selected target no longer exists', missingTarget);
    const raidSiege = base();
    raidSiege.isRaid = true;
    setRemaining(raidSiege.defender, 80);
    raidSiege.siegeResults = [
      { ...warehouseHit, outcome: 'not-fired', reason: 'raid', levelAfter: 20 },
    ];
    add('Siege / raid does not fire', raidSiege);
    const heroOnly = base();
    heroOnly.attacker.units = [{ ...unit('HERO', 1), amountBefore: 1 }];
    heroOnly.defender.units[0].amountBefore = 1;
    heroOnly.attacker.hero = {
      heroId: 1,
      healthBefore: 100,
      healthAfter: 90,
      experienceGained: 0,
      consumables: [],
    };
    add('Hero alone / no consumables', heroOnly);
    const empty = base();
    empty.attacker.units = [];
    empty.defender.units = [];
    empty.loot = [0, 0, 0, 0];
    add('Empty troop tables / no loot', empty);
  });
  return { reports };
};
