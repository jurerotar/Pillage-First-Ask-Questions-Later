import { z } from "zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { use } from "react";
import { ApiContext } from "app/(game)/providers/api-provider";

export const serverOverviewStatisticsSchema = z.object({
  playerCount: z.number(),
  villageCount: z.number(),
  playersByTribe: z.record(z.string(), z.number()),
  playersByFaction: z.record(z.string(), z.number()),
  villagesByTribe: z.record(z.string(), z.number()),
  villagesByFaction: z.record(z.string(), z.number()),
});

export type ServerOverviewStatistics = z.infer<
  typeof serverOverviewStatisticsSchema
>;

export const useGameWorldOverview = () => {
  const { fetcher } = use(ApiContext);

  const { data } = useSuspenseQuery({
    queryKey: ["server-overview-statistics"],
    queryFn: async () => {
      const { data } = await fetcher("/statistics/overview", {
        method: "GET",
      });
      return serverOverviewStatisticsSchema.parse(data);
    },
  });

  return { data };
};
