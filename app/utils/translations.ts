import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { Tribe } from 'app/interfaces/models/game/tribe';

export const resourceTranslationMap = new Map<Resource, string>([
  ['wood', 'RESOURCES.WOOD'],
  ['clay', 'RESOURCES.CLAY'],
  ['iron', 'RESOURCES.IRON'],
  ['wheat', 'RESOURCES.WHEAT'],
]);

export const factionTranslationMap = new Map<PlayerFaction, string>([
  ['npc1', 'FACTIONS.NPC1'],
  ['npc2', 'FACTIONS.NPC2'],
  ['npc3', 'FACTIONS.NPC3'],
  ['npc4', 'FACTIONS.NPC4'],
  ['npc5', 'FACTIONS.NPC5'],
  ['npc6', 'FACTIONS.NPC6'],
  ['npc7', 'FACTIONS.NPC7'],
  ['npc8', 'FACTIONS.NPC8'],
  ['player', 'FACTIONS.PLAYER'],
]);

export const tribeTranslationMap = new Map<Tribe, string>([
  ['romans', 'TRIBES.ROMANS'],
  ['gauls', 'TRIBES.GAULS'],
  ['teutons', 'TRIBES.TEUTONS'],
  ['egyptians', 'TRIBES.EGYPTIANS'],
  ['huns', 'TRIBES.HUNS'],
  ['spartans', 'TRIBES.SPARTANS'],
  ['nature', 'TRIBES.NATURE'],
  ['natars', 'TRIBES.NATARS'],
]);

export const reputationLevelTranslationMap = new Map<ReputationLevel, string>([
  ['ecstatic', 'REPUTATION_LEVELS.ECSTATIC'],
  ['respected', 'REPUTATION_LEVELS.RESPECTED'],
  ['friendly', 'REPUTATION_LEVELS.FRIENDLY'],
  ['neutral', 'REPUTATION_LEVELS.NEUTRAL'],
  ['unfriendly', 'REPUTATION_LEVELS.UNFRIENDLY'],
  ['hostile', 'REPUTATION_LEVELS.HOSTILE'],
]);
