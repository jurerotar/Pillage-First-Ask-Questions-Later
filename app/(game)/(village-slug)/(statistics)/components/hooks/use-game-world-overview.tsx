import { z } from "zod";
import { useSuspenseQuery } from "@tanstack/react-query";
import { use } from "react";
import { ApiContext } from "app/(game)/providers/api-provider";

export const serverOverviewStatisticsSchema = z.object({
  startDate: z.string(),
  totalPlayers: z.number(),
  totalVillages: z.number(),
  serverName: z.string(),
  serverSpeed: z.number(),
  mapSize: z.number(),
  playersByFaction: z.record(z.string(), z.number()),
  villagesByFaction: z.record(z.string(), z.number()),
  tribeDistribution: z.record(z.string(), z.number()),
});

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
