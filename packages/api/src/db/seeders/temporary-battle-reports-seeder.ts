import { z } from 'zod';
import { artifacts } from '@pillage-first/game-assets/items';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import {
  oasisCaptureFailureReasonSchema,
  villageConquestFailureReasonSchema,
} from '@pillage-first/types/models/battle';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { natureUnitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type CreateNewBattleReport,
  insertBattleReport,
} from '../../utils/report';

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
  const enemy = villages.find((v) => v.player_id !== playerId);
  const reinforcement = villages.find(
    (v) => v.id !== own?.id && v.id !== enemy?.id,
  );
  if (!own || !enemy || !reinforcement) {
    throw new Error(
      'Preview reports require a player village and two other villages.',
    );
  }
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
    unitId: CreateNewBattleReport['attacker']['units'][number]['unitId'],
    amountAfter = 70,
  ) => ({
    unitId,
    amountBefore: 100,
    amountAfter,
    amountHospitalized: 0,
    amountImprisoned: 0,
    amountBandaged: 0,
    amountConsumed: 0,
  });
  const participant = (village: typeof own) => ({
    tileId: village.tile_id,
    playerId: village.player_id,
    units: [unit(getUnitsByTribe(village.tribe)[0].id)],
  });
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
      attackerPoints: 120,
      defenderPoints: 70,
      attacker: participant(attacker),
      defender: participant(defender),
    };
  };
  const add = (label: string, report: CreateNewBattleReport) => {
    if (reports.length >= availableSlots) {
      throw new Error(
        'Not enough report slots. Import the separate preview world instead.',
      );
    }

    report.timestamp = now + reports.length * 1000;
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
              if (!report.isRaid) {
                report.reinforcements[0].units[0].amountAfter =
                  role === 'attacker'
                    ? loss === 'FullLoss'
                      ? 70
                      : 0
                    : loss === 'FullLoss'
                      ? 0
                      : 70;
              }
            }
            if (
              mode === 'attack' &&
              role === 'attacker' &&
              loss !== 'FullLoss'
            ) {
              report.damagedBuildings = [
                { buildingId: 'WAREHOUSE', levelBefore: 20, levelAfter: 12 },
                { buildingId: 'WHEAT_FIELD', levelBefore: 10, levelAfter: 0 },
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
          experienceGained: 2350,
          consumables: [{ itemId: 1021, amount: 5 }],
        };
        owner.units[0] = {
          ...owner.units[0],
          amountAfter: 40,
          amountHospitalized: 15,
          amountBandaged: 10,
          amountImprisoned: 5,
        };
        report.reinforcements = [
          {
            ...participant(reinforcement),
            hero: {
              heroId: 2,
              healthBefore: 100,
              healthAfter: 65,
              experienceGained: 500,
              consumables: [],
            },
            units: [
              ...participant(reinforcement).units,
              { ...unit('HERO', 1), amountBefore: 1 },
            ],
          },
        ];
        add(
          [
            role,
            `hero ${died ? 'death' : 'survival'}`,
            'hospital + bandages + prisoners',
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
        add(`${role} / Village failure / ${reason}`, report);
      }
    }
    for (const reason of [null, ...oasisCaptureFailureReasonSchema.options]) {
      const report = base();
      report.targetTileId = oasisTileId;
      report.defender = {
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
      report.loyaltyAfter = reason === null ? 0 : 50;
      add(`Oasis / ${reason ?? 'captured'}`, report);
    }
    for (const died of [0, 5, 20]) {
      const report = base();
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
    add('Traps destroyed / no rescued unit details', traps);
    const captures = base();
    captures.targetTileId = oasisTileId;
    captures.defender = { tileId: oasisTileId, playerId: null, units: [] };
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
    captures.attacker.units.push({ ...unit('HERO', 1), amountBefore: 1 });
    add('Cages / every animal type', captures);
    const loot = base();
    loot.stolenItems = artifacts
      .slice(0, 3)
      .map(({ id }) => ({ itemId: id, amount: 1 }));
    loot.stolenItems.push({ itemId: 1021, amount: 3 });
    add('Items stolen / artifacts and consumables', loot);
    const destroyed = base();
    destroyed.villageDestroyed = true;
    destroyed.damagedBuildings = [
      { buildingId: 'MAIN_BUILDING', levelBefore: 1, levelAfter: 0 },
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
      }
      if (recovery === 'prisoners') {
        u.amountImprisoned = 100;
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
    add('Rescue / no traps destroyed', rescueWithoutTraps);
    const itemOnly = base();
    itemOnly.stolenItems = [{ itemId: 1021, amount: 2 }];
    add('Items stolen / consumables only', itemOnly);
    const artifactsOnly = base();
    artifactsOnly.stolenItems = [{ itemId: artifacts[0].id, amount: 1 }];
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
        add(`Defender tribe / ${tribe}`, report);
      }
    }
    const heroOnly = base();
    heroOnly.attacker.units = [{ ...unit('HERO', 1), amountBefore: 1 }];
    heroOnly.attacker.hero = {
      heroId: 1,
      healthBefore: 100,
      healthAfter: 90,
      experienceGained: 100,
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
