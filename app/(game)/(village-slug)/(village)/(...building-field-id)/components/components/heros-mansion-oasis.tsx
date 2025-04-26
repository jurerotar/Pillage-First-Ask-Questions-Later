import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/ui/table';
import { useOasis } from 'app/(game)/(village-slug)/hooks/use-oasis';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { Icon } from 'app/components/icon';
import clsx from 'clsx';
import type { OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { Link } from 'react-router';

type OccupiedOasisRowProps = {
  occupiedOasis: OccupiedOasisTile | undefined;
  heroMansionLevel: number;
};

const OccupiedOasisRow: React.FC<OccupiedOasisRowProps> = ({ occupiedOasis, heroMansionLevel }) => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();

  const hasOccupiedOasis = !!occupiedOasis;

  if (hasOccupiedOasis) {
    const [x, y] = occupiedOasis.id.split('|');

    return (
      <TableRow>
        <TableCell>
          <Link to={`${mapPath}?x=${x}&y=${y}`}>
            {x}, {y}
          </Link>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {occupiedOasis.ORB.map(({ resource, bonus }, index) => (
            <span
              className={clsx('inline-flex gap-1', index > 0 && 'ml-2')}
              key={resource}
            >
              <Icon
                type={resource}
                className="flex size-5"
              />
              {bonus}
            </span>
          ))}
        </TableCell>
        <TableCell>/</TableCell>
      </TableRow>
    );
  }

  // TODO: Maybe show a different text depending on whether player already has 10/15/20 Hero's mansion
  return (
    <TableRow>
      <TableCell
        className="text-left"
        colSpan={3}
      >
        <Text>{t("Next oasis available at Hero's mansion level {{heroMansionLevel}}", { heroMansionLevel })}</Text>
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { t } = useTranslation();
  const { mapPath } = useGameNavigation();
  const { oasisOccupiedByCurrentVillage, oasisTilesInRange } = useOasis();

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis] = oasisOccupiedByCurrentVillage;

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Oasis you occupy')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
              <TableHeaderCell>{t('Resources')}</TableHeaderCell>
              <TableHeaderCell>{t('Actions')}</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <OccupiedOasisRow
              occupiedOasis={firstOccupiedOasis}
              heroMansionLevel={10}
            />
            <OccupiedOasisRow
              occupiedOasis={secondOccupiedOasis}
              heroMansionLevel={15}
            />
            <OccupiedOasisRow
              occupiedOasis={thirdOccupiedOasis}
              heroMansionLevel={20}
            />
          </TableBody>
        </Table>
      </section>

      <section className="flex flex-col gap-2">
        <Text as="h2">{t('Oasis within reach')}</Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t('Owner')}</TableHeaderCell>
                <TableHeaderCell>{t('Coordinates')}</TableHeaderCell>
                <TableHeaderCell>{t('Resources')}</TableHeaderCell>
                <TableHeaderCell>{t('Actions')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oasisTilesInRange.map((tile) => {
                const [x, y] = tile.id.split('|');
                return (
                  <TableRow key={tile.id}>
                    <TableCell>/</TableCell>
                    <TableCell>
                      <Link to={`${mapPath}?x=${x}&y=${y}`}>
                        {x}, {y}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {tile.ORB.map(({ resource, bonus }, index) => (
                        <span
                          className={clsx('inline-flex gap-1', index > 0 && 'ml-2')}
                          key={resource}
                        >
                          <Icon
                            type={resource}
                            className="flex size-5"
                          />
                          {bonus}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>/</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </article>
  );
};
