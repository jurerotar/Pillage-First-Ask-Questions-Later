import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';
import type { Resource } from 'app/interfaces/models/game/resource';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import { t } from 'i18next';

export const resourceTranslationMap = new Map<Resource, string>([
  ['wood', t('Wood')],
  ['clay', t('Clay')],
  ['iron', t('Iron')],
  ['wheat', t('Wheat')],
]);

export const factionTranslationMap = new Map<PlayerFaction, string>([
  ['npc1', t('NPC faction 1')],
  ['npc2', t('NPC faction 2')],
  ['npc3', t('NPC faction 3')],
  ['npc4', t('NPC faction 4')],
  ['npc5', t('NPC faction 5')],
  ['npc6', t('NPC faction 6')],
  ['npc7', t('NPC faction 7')],
  ['npc8', t('NPC faction 8')],
  ['player', t('Player')],
]);

export const tribeTranslationMap = new Map<Tribe, string>([
  ['romans', t('Romans')],
  ['gauls', t('Gauls')],
  ['teutons', t('Teutons')],
  ['egyptians', t('Egyptians')],
  ['huns', t('Huns')],
  ['spartans', t('Spartans')],
  ['nature', t('Nature')],
  ['natars', t('Natars')],
]);

export const reputationLevelTranslationMap = new Map<ReputationLevel, string>([
  ['ecstatic', t('Ecstatic')],
  ['respected', t('Respected')],
  ['friendly', t('Friendly')],
  ['neutral', t('Neutral')],
  ['unfriendly', t('Unfriendly')],
  ['hostile', t('Hostile')],
]);
