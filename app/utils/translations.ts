import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import { msg } from '@lingui/core/macro';
import type { MessageDescriptor } from '@lingui/core';

export const resourceTranslationMap = new Map<Resource, MessageDescriptor>([
  ['wood', msg`Wood`],
  ['clay', msg`Clay`],
  ['iron', msg`Iron`],
  ['wheat', msg`Wheat`],
]);

export const factionTranslationMap = new Map<PlayerFaction, MessageDescriptor>([
  ['npc1', msg`NPC 1`],
  ['npc2', msg`NPC 2`],
  ['npc3', msg`NPC 3`],
  ['npc4', msg`NPC 4`],
  ['npc5', msg`NPC 5`],
  ['npc6', msg`NPC 6`],
  ['npc7', msg`NPC 7`],
  ['npc8', msg`NPC 8`],
  ['player', msg`Player`],
]);

export const tribeTranslationMap = new Map<Tribe, MessageDescriptor>([
  ['romans', msg`Romans`],
  ['gauls', msg`Gauls`],
  ['teutons', msg`Teutons`],
  ['egyptians', msg`Egyptians`],
  ['huns', msg`Huns`],
  ['spartans', msg`Spartans`],
  ['nature', msg`Nature`],
  ['natars', msg`Natars`],
]);

export const reputationLevelTranslationMap = new Map<ReputationLevel, MessageDescriptor>([
  ['ecstatic', msg`Ecstatic`],
  ['respected', msg`Respected`],
  ['friendly', msg`Friendly`],
  ['neutral', msg`Neutral`],
  ['unfriendly', msg`Unfriendly`],
  ['hostile', msg`Hostile`],
]);
