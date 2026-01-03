import { useTranslation } from "react-i18next";
import { Section } from "app/(game)/(village-slug)/components/building-layout";
import { Text } from "app/components/text";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "app/components/ui/table";
import { useServer } from "app/(game)/(village-slug)/hooks/use-server";
import type { PlayableTribe } from "app/interfaces/models/game/tribe";
import type { Faction } from "app/interfaces/models/game/faction";
import { useGameWorldOverview } from "app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview";

const FACTION_COLORS: Record<Faction, string> = {
  player: "#ef4444",
  npc1: "#3b82f6",
  npc2: "#22c55e",
  npc3: "#f59e0b",
  npc4: "#8b5cf6",
  npc5: "#ec4899",
  npc6: "#14b8a6",
  npc7: "#f97316",
  npc8: "#6366f1",
};

const TRIBE_COLORS: Record<PlayableTribe, string> = {
  romans: "#ef4444",
  gauls: "#3b82f6",
  teutons: "#22c55e",
  huns: "#f59e0b",
  egyptians: "#8b5cf6",
};

export const GameWorldOverview = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { data } = useGameWorldOverview();

  const playersByFactionData = Object.entries(data.playersByFaction)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  const villagesByFactionData = Object.entries(data.villagesByFaction)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  const playersByTribeData = Object.entries(data.playersByTribe)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  const villagesByTribeData = Object.entries(data.villagesByTribe)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  return (
    <Section>
      <Text as="h2">{t("Server overview")}</Text>
      <Text>{t("General statistics for this game world.")}</Text>

      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Name")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.name}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Seed")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.seed}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Start date")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{new Date(server.createdAt).toLocaleDateString()}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Speed")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.speed}x</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Map size")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.mapSize}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Total players")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{data.playerCount}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t("Total villages")}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{data.villageCount}</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Players by Faction */}
        {playersByFactionData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <Text
              as="h4"
              className="mb-4 font-semibold text-gray-900 dark:text-white"
            >
              {t("Players by Faction")}
            </Text>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playersByFactionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {playersByFactionData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={FACTION_COLORS[entry.name as Faction] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Villages by Faction */}
        {villagesByFactionData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <Text
              as="h4"
              className="mb-4 font-semibold text-gray-900 dark:text-white"
            >
              {t("Villages by Faction")}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={villagesByFactionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {villagesByFactionData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={FACTION_COLORS[entry.name as Faction] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Players by Tribe */}
        {playersByTribeData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <Text
              as="h4"
              className="mb-4 font-semibold text-gray-900 dark:text-white"
            >
              {t("Players by Tribe")}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={playersByTribeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name={t("Players")}>
                  {playersByTribeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        TRIBE_COLORS[entry.name as PlayableTribe] ?? "#94a3b8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Villages by Tribe */}
        {villagesByTribeData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
            <Text
              as="h4"
              className="mb-4 font-semibold text-gray-900 dark:text-white"
            >
              {t("Villages by Tribe")}
            </Text>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={villagesByTribeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name={t("Villages")}>
                  {villagesByTribeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        TRIBE_COLORS[entry.name as PlayableTribe] ?? "#94a3b8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Section>
  );
};
