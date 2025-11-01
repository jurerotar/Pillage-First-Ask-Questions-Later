import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import { z } from 'zod';

export type ResourceQuestReward = {
  type: 'resources';
  amount: number;
};

export type HeroExperienceQuestReward = {
  type: 'hero-exp';
  amount: number;
};

export type HeroItemQuestReward = {
  type: 'hero-item';
  amount: number;
};

export type QuestReward =
  | ResourceQuestReward
  | HeroExperienceQuestReward
  | HeroItemQuestReward;

type Matcher = 'oneOf' | 'every';

export type BuildingQuestRequirement = {
  type: 'building';
  buildingId: Building['id'];
  level: number;
  matcher: Matcher;
};

export type AdventureCountQuestRequirement = {
  type: 'adventure-count';
  count: number;
};

export type TroopCountQuestRequirement = {
  type: 'troop-count';
  count: number;
};

export type UnitTroopCountQuestRequirement = {
  type: 'unit-troop-count';
  count: number;
};

export type KillCountQuestRequirement = {
  type: 'kill-count';
  count: number;
};

export type UnitKillCountQuestRequirement = {
  type: 'unit-kill-count';
  count: number;
};

export type QuestRequirement =
  | BuildingQuestRequirement
  | AdventureCountQuestRequirement
  | KillCountQuestRequirement
  | UnitKillCountQuestRequirement
  | TroopCountQuestRequirement
  | UnitTroopCountQuestRequirement;

type VillageQuestId =
  | `${Matcher}-${Building['id']}-${number}`
  | `${Matcher}-resourceFields-${number}`;

type GlobalQuestId =
  | `adventureCount-${number}`
  | `troopCount-${number}`
  | `unitTroopCount-${Unit['id']}-${number}`
  | `killCount-${number}`
  | `unitKillCount-${Unit['id']}-${number}`;

const baseQuestSchema = z.strictObject({
  id: z.string(),
  scope: z.enum(['village', 'global']),
  collectedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
});

const villageQuestsSchema = baseQuestSchema.extend({
  id: z.string() as z.ZodType<VillageQuestId>,
  scope: z.literal('village'),
  villageId: z.number(),
});

export type VillageQuest = z.infer<typeof villageQuestsSchema>;

const globalQuestsSchema = baseQuestSchema.extend({
  id: z.string() as z.ZodType<GlobalQuestId>,
  scope: z.literal('global'),
});

export type GlobalQuest = z.infer<typeof globalQuestsSchema>;

export const questSchema = z.discriminatedUnion('scope', [
  villageQuestsSchema,
  globalQuestsSchema,
]);

export type Quest = z.infer<typeof questSchema>;
