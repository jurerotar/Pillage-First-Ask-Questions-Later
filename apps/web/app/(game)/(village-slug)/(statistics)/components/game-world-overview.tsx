import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  type PieSectorShapeProps,
  Rectangle,
  ResponsiveContainer,
  Sector,
  XAxis,
  YAxis,
} from 'recharts';
import {
  FACTION_COLORS,
  TRIBE_COLORS,
} from '@pillage-first/game-assets/factions';
import { factionSchema } from '@pillage-first/types/models/faction';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { useGameWorldOverview } from 'app/(game)/(village-slug)/(statistics)/components/hooks/use-game-world-overview';
import {
  OverflowContainer,
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const overviewTribes = tribeSchema.exclude(['nature', 'spartans']).options;

const getShapeFill = ({
  fill,
  payload,
}: {
  fill?: string;
  payload?: { fill?: string };
}) => payload?.fill ?? fill ?? '#94a3b8';

const ChartPieSector = ({
  className,
  cornerRadius,
  cx,
  cy,
  endAngle,
  fill,
  innerRadius,
  outerRadius,
  payload,
  startAngle,
}: PieSectorShapeProps) => (
  <Sector
    className={className}
    cornerRadius={cornerRadius}
    cx={cx}
    cy={cy}
    endAngle={endAngle}
    fill={getShapeFill({ fill, payload })}
    innerRadius={innerRadius}
    outerRadius={outerRadius}
    startAngle={startAngle}
  />
);

const ChartBarRectangle = ({
  className,
  fill,
  height,
  payload,
  radius,
  width,
  x,
  y,
}: BarShapeProps) => (
  <Rectangle
    className={className}
    fill={getShapeFill({ fill, payload })}
    height={height}
    radius={radius}
    width={width}
    x={x}
    y={y}
  />
);

export const GameWorldOverview = () => {
  const { t } = useTranslation();
  const { server } = useServer();
  const { gameWorldOverviewStatistics } = useGameWorldOverview();

  const playersByFactionData = useMemo(() => {
    return factionSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.playersByFaction[name],
      fill: FACTION_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.playersByFaction]);

  const villagesByFactionData = useMemo(() => {
    return factionSchema.options.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.villagesByFaction[name],
      fill: FACTION_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.villagesByFaction]);

  const playersByTribeData = useMemo(() => {
    return overviewTribes.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.playersByTribe[name],
      fill: TRIBE_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.playersByTribe]);

  const villagesByTribeData = useMemo(() => {
    return overviewTribes.map((name) => ({
      name,
      value: gameWorldOverviewStatistics.villagesByTribe[name],
      fill: TRIBE_COLORS[name] ?? '#94a3b8',
    }));
  }, [gameWorldOverviewStatistics.villagesByTribe]);

  const serverStartDate = useMemo(() => {
    return new Date(server.createdAt).toLocaleDateString();
  }, [server.createdAt]);

  return (
    <Section>
      <InformationPopover ariaLabel={t('Server overview')}>
        <Text>{t('General statistics for this game world.')}</Text>
      </InformationPopover>
      <Text as="h2">{t('Server overview')}</Text>

      <OverflowContainer>
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
                <Text>{serverStartDate}</Text>
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
      </OverflowContainer>
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
              shape={ChartPieSector}
            />
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
              shape={ChartPieSector}
            />
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
              shape={ChartBarRectangle}
            />
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
              shape={ChartBarRectangle}
            />
          </BarChart>
        </ResponsiveContainer>
      </SectionContent>
    </Section>
  );
};
