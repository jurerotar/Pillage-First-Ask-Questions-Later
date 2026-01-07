import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { Faction } from '@pillage-first/types/models/faction';
import { factionSchema } from '@pillage-first/types/models/faction';
import type { PlayableTribe } from '@pillage-first/types/models/tribe';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { useGameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

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
  const { gameWorldOverviewStatistics } = useGameWorldOverview();

  const playersByFactionData = factionSchema.options.map((name) => ({
    name,
    value: gameWorldOverviewStatistics.playersByFaction[name],
  }));

  const villagesByFactionData = factionSchema.options.map((name) => ({
    name,
    value: gameWorldOverviewStatistics.villagesByFaction[name],
  }));

  const playersByTribeData = tribeSchema.options.map((name) => ({
    name,
    value: gameWorldOverviewStatistics.playersByTribe[name],
  }));

  const villagesByTribeData = tribeSchema.options.map((name) => ({
    name,
    value: gameWorldOverviewStatistics.villagesByTribe[name],
  }));

  return (
    <Section>
      <Text as="h2">{t('Server overview')}</Text>
      <Text>{t('General statistics for this game world.')}</Text>

      <div className="overflow-x-scroll scrollbar-hidden">
        <Table>
          <TableBody>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Name')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.name}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Seed')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.seed}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Start date')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{new Date(server.createdAt).toLocaleDateString()}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Speed')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.speed}x</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Map size')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{server.configuration.mapSize}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Total players')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{gameWorldOverviewStatistics.playerCount}</Text>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableHeaderCell>
                <Text>{t('Total villages')}</Text>
              </TableHeaderCell>
              <TableCell>
                <Text>{gameWorldOverviewStatistics.villageCount}</Text>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <SectionContent>
        <Text as="h3">{t('Players by Faction')}</Text>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
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
              {playersByFactionData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={FACTION_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Villages by Faction')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
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
              {villagesByFactionData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={FACTION_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Players by Tribe')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart data={playersByTribeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Bar
              dataKey="value"
              name={t('Players')}
            >
              {playersByTribeData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={TRIBE_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <Text as="h3">{t('Villages by Tribe')}</Text>
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <BarChart data={villagesByTribeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Bar
              dataKey="value"
              name={t('Villages')}
            >
              {villagesByTribeData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={TRIBE_COLORS[entry.name] ?? '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </SectionContent>
    </Section>
  );
};
