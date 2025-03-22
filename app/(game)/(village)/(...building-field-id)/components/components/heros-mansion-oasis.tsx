import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from 'app/components/tables/table';
import { useOasis } from 'app/(game)/hooks/use-oasis';
import { useGameNavigation } from 'app/(game)/hooks/routes/use-game-navigation';
import { Icon } from 'app/components/icon';
import clsx from 'clsx';
import type { OccupiedOasisTile } from 'app/interfaces/models/game/tile';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/components/text';
import { LinkWithState } from 'app/components/link-with-state';

type OccupiedOasisRowProps = {
  occupiedOasis: OccupiedOasisTile | undefined;
  heroMansionLevel: number;
};

const OccupiedOasisRow: React.FC<OccupiedOasisRowProps> = ({ occupiedOasis, heroMansionLevel }) => {
  const { t: herosMansionT } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.HEROS_MANSION.OASIS',
  });
  const { mapPath } = useGameNavigation();

  const hasOccupiedOasis = !!occupiedOasis;

  if (hasOccupiedOasis) {
    const [x, y] = occupiedOasis.id.split('|');

    return (
      <TableRow>
        <TableCell>
          <LinkWithState to={`${mapPath}?x=${x}&y=${y}`}>
            {x}, {y}
          </LinkWithState>
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
        <Text>{herosMansionT('NEXT_OASIS', { heroMansionLevel })}</Text>
      </TableCell>
    </TableRow>
  );
};

export const HerosMansionOasis = () => {
  const { t: herosMansionT } = useTranslation('translation', {
    keyPrefix: 'APP.GAME.BUILDING_FIELD.BUILDING_DETAILS.TAB_PANELS.HEROS_MANSION.OASIS',
  });
  const { mapPath } = useGameNavigation();
  const { oasisOccupiedByCurrentVillage, oasisTilesInRange } = useOasis();

  const [firstOccupiedOasis, secondOccupiedOasis, thirdOccupiedOasis] = oasisOccupiedByCurrentVillage;

  return (
    <article className="flex flex-col gap-4">
      <section className="flex flex-col gap-2">
        <Text as="h2">{herosMansionT('OCCUPIED_OASIS_TITLE')}</Text>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>{herosMansionT('TABLE.COORDINATES')}</TableHeaderCell>
              <TableHeaderCell>{herosMansionT('TABLE.RESOURCES')}</TableHeaderCell>
              <TableHeaderCell>{herosMansionT('TABLE.ACTIONS')}</TableHeaderCell>
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
        <Text as="h2">{herosMansionT('OASIS_WITHIN_REACH_TITLE')}</Text>
        <div className="overflow-x-scroll scrollbar-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{herosMansionT('TABLE.OWNER')}</TableHeaderCell>
                <TableHeaderCell>{herosMansionT('TABLE.COORDINATES')}</TableHeaderCell>
                <TableHeaderCell>{herosMansionT('TABLE.RESOURCES')}</TableHeaderCell>
                <TableHeaderCell>{herosMansionT('TABLE.ACTIONS')}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oasisTilesInRange.map((tile) => {
                const [x, y] = tile.id.split('|');
                return (
                  <TableRow key={tile.id}>
                    <TableCell>/</TableCell>
                    <TableCell>
                      <LinkWithState to={`${mapPath}?x=${x}&y=${y}`}>
                        {x}, {y}
                      </LinkWithState>
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
