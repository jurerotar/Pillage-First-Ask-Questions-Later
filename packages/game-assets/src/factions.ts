import type { Faction } from '@pillage-first/types/models/faction';
import type { Tribe } from '@pillage-first/types/models/tribe';

export const FACTION_COLORS: Record<Faction, string> = {
  player: '#ef4444',
  npc1: '#3b82f6',
  npc2: '#22c55e',
  npc3: '#f59e0b',
  npc4: '#8b5cf6',
  npc5: '#ec4899',
  npc6: '#14b8a6',
  npc7: '#f97316',
  npc8: '#6366f1',
};

export const TRIBE_COLORS: Record<Tribe, string> = {
  romans: '#9f1d1d',
  gauls: '#5f7f2f',
  teutons: '#6b4a2e',
  huns: '#8a3a16',
  egyptians: '#c7a66a',
  spartans: '#b8860b',
  nature: '#10b981',
  natars: '#2f2f2f',
};
