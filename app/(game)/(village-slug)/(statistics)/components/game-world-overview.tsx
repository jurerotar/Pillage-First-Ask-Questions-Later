import { useTranslation } from 'react-i18next';
import { Section } from 'app/(game)/(village-slug)/components/building-layout';
import { Text } from 'app/components/text';
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
} from 'recharts';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { Faction } from 'app/interfaces/models/game/faction';
import { useGameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview';

const FACTION_COLORS: Record<Faction, string> = {
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

const TRIBE_COLORS: Record<PlayableTribe, string> = {
  romans: '#ef4444',
  gauls: '#3b82f6',
  teutons: '#22c55e',
  huns: '#f59e0b',
  egyptians: '#8b5cf6',
};

export const GameWorldOverview = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const {} = useGameWorldOverview();

  // const playersByFactionData = Object.entries(data.playersByFaction).map(
  //   ([name, value]) => ({ name, value }),
  // );
  //
  // const villagesByFactionData = Object.entries(data.villagesByFaction).map(
  //   ([name, value]) => ({ name, value }),
  // );
  //
  // const tribeData = Object.entries(data.tribeDistribution).map(
  //   ([name, value]) => ({ name, value }),
  // );

  return (
    <Section>
      <Text as="h2">{t('Server overview')}</Text>
      <Text>{t('General statistics for this game world.')}</Text>

      <table className="w-80">
        <tbody>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">{t('Name')}</Text>
          </th>
          <td className="p-1">
            <Text>{server.name}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">{t('Seed')}</Text>
          </th>
          <td className="p-1">
            <Text>{server.seed}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">{t('Start date')}</Text>
          </th>
          <td className="p-1">
            <Text>{(new Date(server.createdAt)).toLocaleDateString()}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">{t('Speed')}</Text>
          </th>
          <td className="p-1">
            <Text>{server.configuration.speed}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">
              {t('Map size')}
            </Text>
          </th>
          <td className="p-1">
            <Text>{server.configuration.mapSize}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">
              {t('Total players')}
            </Text>
          </th>
          <td className="p-1">
            <Text>{0}</Text>
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="p-1"
          >
            <Text className="text-left font-medium">
              {t('Total villages')}
            </Text>
          </th>
          <td className="p-1">
            <Text>{0}</Text>
          </td>
        </tr>
        </tbody>
      </table>

      {/*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">*/}
      {/*  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">*/}
      {/*    <Text as="h4" className="mb-4 font-semibold text-white">*/}
      {/*      {t('Players by Faction')}*/}
      {/*    </Text>*/}

      {/*    <ResponsiveContainer width="100%" height={300}>*/}
      {/*      <PieChart>*/}
      {/*        <Pie*/}
      {/*          data={playersByFactionData}*/}
      {/*          dataKey="value"*/}
      {/*          nameKey="name"*/}
      {/*          outerRadius={80}*/}
      {/*          label*/}
      {/*        >*/}
      {/*          {playersByFactionData.map((entry, i) => (*/}
      {/*            <Cell*/}
      {/*              key={i}*/}
      {/*              fill={FACTION_COLORS[entry.name] ?? FACTION_COLORS.default}*/}
      {/*            />*/}
      {/*          ))}*/}
      {/*        </Pie>*/}
      {/*        <Tooltip />*/}
      {/*        <Legend />*/}
      {/*      </PieChart>*/}
      {/*    </ResponsiveContainer>*/}
      {/*  </div>*/}

      {/*  /!* Villages by Faction *!/*/}
      {/*  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">*/}
      {/*    <Text as="h4" className="mb-4 font-semibold text-white">*/}
      {/*      {t('Villages by Faction')}*/}
      {/*    </Text>*/}
      {/*    <ResponsiveContainer width="100%" height={300}>*/}
      {/*      <PieChart>*/}
      {/*        <Pie*/}
      {/*          data={villagesByFactionData}*/}
      {/*          dataKey="value"*/}
      {/*          nameKey="name"*/}
      {/*          outerRadius={80}*/}
      {/*          label*/}
      {/*        >*/}
      {/*          {villagesByFactionData.map((entry, i) => (*/}
      {/*            <Cell*/}
      {/*              key={i}*/}
      {/*              fill={FACTION_COLORS[entry.name] ?? FACTION_COLORS.default}*/}
      {/*            />*/}
      {/*          ))}*/}
      {/*        </Pie>*/}
      {/*        <Tooltip />*/}
      {/*        <Legend />*/}
      {/*      </PieChart>*/}
      {/*    </ResponsiveContainer>*/}
      {/*  </div>*/}

      {/*  /!* Tribe Distribution *!/*/}
      {/*  <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg border">*/}
      {/*    <Text as="h4" className="mb-4 font-semibold text-white">*/}
      {/*      {t('Tribe Distribution')}*/}
      {/*    </Text>*/}
      {/*    <ResponsiveContainer width="100%" height={300}>*/}
      {/*      <BarChart data={tribeData}>*/}
      {/*        <CartesianGrid strokeDasharray="3 3" />*/}
      {/*        <XAxis dataKey="name" />*/}
      {/*        <YAxis />*/}
      {/*        <Tooltip />*/}
      {/*        <Bar dataKey="value">*/}
      {/*          {tribeData.map((entry, i) => (*/}
      {/*            <Cell*/}
      {/*              key={i}*/}
      {/*              fill={TRIBE_COLORS[entry.name] ?? TRIBE_COLORS.default}*/}
      {/*            />*/}
      {/*          ))}*/}
      {/*        </Bar>*/}
      {/*      </BarChart>*/}
      {/*    </ResponsiveContainer>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </Section>
  );
};
