import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { getUnitsByTribe } from '@pillage-first/game-assets/utils/units';
import type {
  BattleParticipant,
  BattleType,
} from '@pillage-first/types/models/battle';
import type { Coordinates } from '@pillage-first/types/models/coordinates';
import { NPC_ONLY_TRIBES } from '@pillage-first/types/models/tribe';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from 'app/components/ui/table';

const playerHeader = (
  playerName: string,
  playerSlug: string,
  villageName: string,
  coordinates: Coordinates,
) => (
  <div>
    <Link
      to={`../players/${playerSlug}`}
      className="text-link font-medium"
    >
      {playerName}
    </Link>{' '}
    from village{' '}
    <Link
      to={`../map?x=${coordinates.x}&y=${coordinates.y}`}
      className="text-link font-medium"
    >
      {villageName}
    </Link>
  </div>
);

type BattleParticipantTableProps = {
  battle: BattleType;
  participant: BattleParticipant;
};

export const BattleParticipantTable = ({
  battle,
  participant,
}: BattleParticipantTableProps) => {
  const { t } = useTranslation();

  const orderedUnits = useMemo(() => {
    const result = getUnitsByTribe(participant.tribe).map((u) => {
      const existingUnit = participant.units.find((i) => i.unitId === u.id);

      if (existingUnit) {
        return existingUnit;
      }
      return {
        unitId: u.id,
        amountBefore: 0,
        amountAfter: 0,
      };
    });

    const tribeIsNpcOnly = (NPC_ONLY_TRIBES as readonly string[]).includes(
      participant.tribe,
    );
    const lastUnit = result.at(-1);
    const lastUnitIsHero = lastUnit ? lastUnit.unitId === 'HERO' : false;

    if (!tribeIsNpcOnly && !lastUnitIsHero) {
      result.push({
        unitId: 'HERO',
        amountBefore: 0,
        amountAfter: 0,
      });
    }

    return result;
  }, [participant]);

  return (
    <Table className="mb-2 sm:mb-4">
      <TableHeader>
        <TableRow>
          <TableHeaderCell
            colSpan={100}
            className="text-left"
          >
            <Text className="capitalize">{participant.role}</Text>
          </TableHeaderCell>
        </TableRow>
        {!participant.isReinforcement && (
          <TableRow>
            <TableHeaderCell
              colSpan={100}
              className="text-left"
            >
              {participant.role === 'attacker'
                ? playerHeader(
                    battle.attackingPlayerName,
                    battle.attackingPlayerSlug,
                    battle.originVillageName,
                    battle.originVillageCoordinates,
                  )
                : playerHeader(
                    battle.defendingPlayerName,
                    battle.defendingPlayerSlug,
                    battle.targetVillageName,
                    battle.targetVillageCoordinates,
                  )}
            </TableHeaderCell>
          </TableRow>
        )}
      </TableHeader>

      <TableBody>
        <TableRow>
          <TableCell className="text-center" />
          {orderedUnits.map((unit) => {
            return (
              <TableCell
                className="text-center"
                key={unit.unitId}
              >
                <Icon
                  type={unitIdToUnitIconMapper(unit.unitId)}
                  className="size-4 lg:size-6 m-auto"
                />
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">{t('Initial')}</TableCell>
          {orderedUnits.map((unit) => {
            return (
              <TableCell
                className="text-center"
                key={unit.unitId}
              >
                {unit.amountBefore}
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">{t('Casualties')}</TableCell>
          {orderedUnits.map((unit) => {
            return (
              <TableCell
                className="text-center text-red-500"
                key={unit.unitId}
              >
                {unit.amountBefore - unit.amountAfter}
              </TableCell>
            );
          })}
        </TableRow>

        <TableRow>
          <TableCell className="text-center">{t('Remaining')}</TableCell>
          {orderedUnits.map((unit) => {
            return (
              <TableCell
                className="text-center text-green-700"
                key={unit.unitId}
              >
                {unit.amountAfter}
              </TableCell>
            );
          })}
        </TableRow>
      </TableBody>
    </Table>
  );
};
