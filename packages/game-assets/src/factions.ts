import type { Faction } from '@pillage-first/types/models/faction';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';

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

export const TRIBE_COLORS: Record<PlayableTribe, string> = {
  romans: '#ef4444',
  gauls: '#3b82f6',
  teutons: '#22c55e',
  huns: '#f59e0b',
  egyptians: '#8b5cf6',
};
