import { useTranslation } from "react-i18next";
import { Section } from "app/(game)/(village-slug)/components/building-layout";
import { Text } from "app/components/text";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "app/components/ui/table";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useServerOverviewStatistics } from "app/(game)/(village-slug)/(statistics)/hooks/use-server-overview-statistics";

const FACTION_COLORS: Record<string, string> = {
  player: "#ef4444",
  npc1: "#3b82f6",
  npc2: "#22c55e",
  npc3: "#f59e0b",
  npc4: "#8b5cf6",
  npc5: "#ec4899",
  npc6: "#14b8a6",
  npc7: "#f97316",
  npc8: "#6366f1",
  default: "#64748b",
};

const TRIBE_COLORS: Record<string, string> = {
  romans: "#ef4444",
  gauls: "#3b82f6",
  teutons: "#22c55e",
  huns: "#f59e0b",
  egyptians: "#8b5cf6",
  default: "#64748b",
};

export const ServerOverviewStatistics = () => {
  const { t } = useTranslation();
  const { data } = useServerOverviewStatistics();

  if (!data) {
    return (
      <Section>
        <Text>{t("Failed to load server statistics")}</Text>
      </Section>
    );
  }

  const playersByFactionData = Object.entries(data.playersByFaction).map(
    ([name, value]) => ({ name, value }),
  );

  const villagesByFactionData = Object.entries(data.villagesByFaction).map(
    ([name, value]) => ({ name, value }),
  );

  const tribeData = Object.entries(data.tribeDistribution).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <Section>
      <Text as="h2">{t("Server overview")}</Text>
      <Text>{t("General statistics for this game world.")}</Text>

      {/* SERVER DETAILS */}
      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{t("Server Information")}</TableHeaderCell>
            <TableHeaderCell>{t("Value")}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{t("Server name")}</TableCell>
            <TableCell>{data.serverName}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("World start date")}</TableCell>
            <TableCell>{data.startDate}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("Server speed")}</TableCell>
            <TableCell>{data.serverSpeed}x</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("Map size")}</TableCell>
            <TableCell>
              {data.mapSize} x {data.mapSize}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("Total players")}</TableCell>
            <TableCell>{data.totalPlayers}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t("Total villages")}</TableCell>
            <TableCell>{data.totalVillages}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Players by Faction */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <Text as="h4" className="mb-4 font-semibold text-white">
            {t("Players by Faction")}
          </Text>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={playersByFactionData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {playersByFactionData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={FACTION_COLORS[entry.name] ?? FACTION_COLORS.default}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Villages by Faction */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <Text as="h4" className="mb-4 font-semibold text-white">
            {t("Villages by Faction")}
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={villagesByFactionData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
                label
              >
                {villagesByFactionData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={FACTION_COLORS[entry.name] ?? FACTION_COLORS.default}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tribe Distribution */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <Text as="h4" className="mb-4 font-semibold text-white">
            {t("Tribe Distribution")}
          </Text>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tribeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {tribeData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={TRIBE_COLORS[entry.name] ?? TRIBE_COLORS.default}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Section>
  );
};
