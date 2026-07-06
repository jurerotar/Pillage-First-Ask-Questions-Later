import { z } from 'zod';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getBattleUnitsByReportRowSchema = z
  .strictObject({
    battle_participant_id: z.int(),
    unit_id: unitIdSchema,
    amount_before: z.int(),
    amount_after: z.int(),
  })
  .meta({ id: 'GetBattleUnitsByReportRow' });

export const getBattleParticipantsByReportRowSchema = z
  .strictObject({
    id: z.int(),
    role: z.enum(['attacker', 'defender']),
    tribe: tribeSchema,
    is_reinforcement: z.int(),
  })
  .meta({ id: 'GetBattleParticipantsByReportRow' });

export const getBattlePlayerInformationRowSchema = z
  .strictObject({
    player_name: z.string().default('Unknown'),
    player_slug: z.string().default('Unknown'),
    village_name: z.string().default('Unknown'),
    x: z.int().default(0),
    y: z.int().default(0),
  })
  .meta({ id: 'GetBattlePlayerInformationRow' });

export const getBattleOasisInformationRowSchema = z
  .strictObject({
    player_name: z.string().nullable(),
    player_slug: z.string().nullable(),
    x: z.int(),
    y: z.int(),
  })
  .meta({ id: 'GetBattleOasisInformationRow' });

export const getBattleByReportRowSchema = z
  .strictObject({
    attacking_village_id: z.int(),
    defending_village_id: z.int().nullable(),
    defending_oasis_id: z.int().nullable(),
    loot_wood: z.int(),
    loot_clay: z.int(),
    loot_iron: z.int(),
    loot_wheat: z.int(),
    can_attacker_see_full_report: z.int(),
    attacker_points: z.int(),
    defender_points: z.int(),
  })
  .refine(
    ({ defending_village_id, defending_oasis_id }) =>
      defending_village_id != null || defending_oasis_id != null,
    'Either the defending village or oasis ID must be defined',
  )
  .meta({ id: 'GetBattleByReportRow' });
