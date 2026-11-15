import type { Hero } from '@pillage-first/types/models/hero';

type Attributes = Hero['selectableAttributes'];

export const allocateHeroAttributePoints = (
  attributes: Attributes,
  minimumAttributes: Attributes,
  availablePoints: number,
  key: keyof Attributes,
  value: number,
): Attributes => {
  let otherSpentPoints = -attributes[key];

  for (const points of Object.values(attributes)) {
    otherSpentPoints += points;
  }

  const maximum = Math.min(100, availablePoints - otherSpentPoints);
  const nextValue = Math.max(minimumAttributes[key], Math.min(maximum, value));

  return nextValue === attributes[key]
    ? attributes
    : { ...attributes, [key]: nextValue };
};
