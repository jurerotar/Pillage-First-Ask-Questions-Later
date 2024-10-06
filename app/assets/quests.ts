import type { Quest } from 'app/interfaces/models/game/quest';

export const globalQuests: Quest[] = [];

export const villageQuests: Quest[] = [];

export const quests: Quest[] = [...villageQuests, ...globalQuests];
