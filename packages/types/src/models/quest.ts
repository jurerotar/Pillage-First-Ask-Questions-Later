import { z } from 'zod';
import { type Building, buildingIdSchema } from './building';
import { type NatureUnitId, natureUnitIdSchema, unitIdSchema } from './unit';

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

export type QueuedTroopCountQuestRequirement = {
  type: 'queued-troop-count';
  count: number;
};

export type QueuedTroopCountByIdQuestRequirement = {
  type: 'queued-troop-count-by-id';
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

export type CaptureAnimalCountByIdQuestRequirement = {
  type: 'capture-animal-count-by-id';
  unitId: NatureUnitId;
  count: number;
};

export type CaptureAnimalKindCountQuestRequirement = {
  type: 'capture-animal-kind-count';
  count: number;
};

export type GatheredResourceCountQuestRequirement = {
  type: 'gathered-resource-count';
  count: number;
};

export type QuestRequirement =
  | BuildingQuestRequirement
  | AdventureCountQuestRequirement
  | KillCountQuestRequirement
  | UnitKillCountQuestRequirement
  | CaptureAnimalCountByIdQuestRequirement
  | CaptureAnimalKindCountQuestRequirement
  | GatheredResourceCountQuestRequirement
  | QueuedTroopCountQuestRequirement
  | QueuedTroopCountByIdQuestRequirement;

const matcherSchema = z.enum(['oneOf', 'every']);

const villageQuestIdSchema = z.union([
  z.templateLiteral([matcherSchema, '-', buildingIdSchema, '-', z.number()]),
  z.templateLiteral([matcherSchema, '-resourceFields-', z.number()]),
]);

const globalQuestIdSchema = z.union([
  z.templateLiteral(['adventureCount-', z.number()]),
  z.templateLiteral(['queuedTroopCount-', z.number()]),
  z.templateLiteral(['queuedTroopCountById-', unitIdSchema, '-', z.number()]),
  z.templateLiteral(['killCount-', z.number()]),
  z.templateLiteral(['unitKillCount-', unitIdSchema, '-', z.number()]),
  z.templateLiteral([
    'captureAnimalCountById-',
    natureUnitIdSchema,
    '-',
    z.number(),
  ]),
  z.templateLiteral(['captureAnimalKindCount-', z.number()]),
  z.templateLiteral(['gatheredResourceCount-', z.number()]),
]);

export const questIdSchema = z.union([
  villageQuestIdSchema,
  globalQuestIdSchema,
]);

export type QuestId = z.infer<typeof questIdSchema>;

const baseQuestSchema = z.strictObject({
  id: z.string(),
  scope: z.enum(['village', 'global']),
  collectedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
});

const villageQuestsSchema = baseQuestSchema
  .extend({
    id: villageQuestIdSchema,
    scope: z.literal('village'),
    villageId: z.number(),
  })
  .meta({ id: 'VillageQuest' });

export type VillageQuest = z.infer<typeof villageQuestsSchema>;

const globalQuestsSchema = baseQuestSchema
  .extend({
    id: globalQuestIdSchema,
    scope: z.literal('global'),
  })
  .meta({ id: 'GlobalQuest' });

export type GlobalQuest = z.infer<typeof globalQuestsSchema>;

export const questSchema = z
  .discriminatedUnion('scope', [villageQuestsSchema, globalQuestsSchema])
  .meta({ id: 'Quest' });

export type Quest = z.infer<typeof questSchema>;
