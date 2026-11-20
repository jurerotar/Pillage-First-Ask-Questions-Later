import { useEventsByType } from './use-events-by-type';

export const useCageProductionQueue = (
  type: 'animalCageProduction' | 'trapperCageProduction',
) => {
  const { eventsByType } = useEventsByType(type);
  const batches = new Map<
    string,
    {
      batchId: string;
      amount: number;
      nextAt: number;
      resolvesAt: number;
    }
  >();

  for (const event of eventsByType) {
    const batch = batches.get(event.batchId);

    if (batch) {
      batch.amount += 1;
      batch.nextAt = Math.min(batch.nextAt, event.resolvesAt);
      batch.resolvesAt = Math.max(batch.resolvesAt, event.resolvesAt);
    } else {
      batches.set(event.batchId, {
        batchId: event.batchId,
        amount: 1,
        nextAt: event.resolvesAt,
        resolvesAt: event.resolvesAt,
      });
    }
  }

  return {
    batches: Array.from(batches.values()),
    queuedAmount: eventsByType.length,
  };
};
