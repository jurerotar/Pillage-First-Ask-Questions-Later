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

export const getBattleByReportRowSchema = z
  .strictObject({
    attacking_player_name: z.string(),
    attacking_player_slug: z.string(),
    defending_player_name: z.string(),
    defending_player_slug: z.string(),
    origin_village_name: z.string(),
    origin_village_x: z.int(),
    origin_village_y: z.int(),
    target_village_name: z.string(),
    target_village_x: z.int(),
    target_village_y: z.int(),
    loot_wood: z.int(),
    loot_clay: z.int(),
    loot_iron: z.int(),
    loot_wheat: z.int(),
    total_carry_capacity: z.int(),
    did_attacker_win: z.int(),
    attacker_points: z.int(),
    attacker_supply_before: z.int(),
    attacker_supply_lost: z.int(),
    attacker_resources_lost: z.int(),
    defender_points: z.int(),
    defender_supply_before: z.int(),
    defender_supply_lost: z.int(),
    defender_resources_lost: z.int(),
  })
  .meta({ id: 'GetBattleByReportRow' });
