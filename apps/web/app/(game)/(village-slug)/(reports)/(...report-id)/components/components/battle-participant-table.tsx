import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type {
  BattleParticipant,
  BattleType,
} from '@pillage-first/types/models/battle';
import type { TroopLike } from '@pillage-first/types/models/troop';
import {
  UnitTable,
  UnitTableHiddenRow,
  UnitTableLoot,
  UnitTablePlayer,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
} from 'app/(game)/components/unit-table';

type BattleParticipantTableProps = {
  battle: BattleType;
  participant: BattleParticipant;
  showDefendingUnits: boolean;
};

export const BattleParticipantTable = ({
  battle,
  participant,
  showDefendingUnits,
}: BattleParticipantTableProps) => {
  const { t } = useTranslation();

  const { troopsBefore, troopsAfter, troopsLost } = useMemo(() => {
    const troopsBefore: TroopLike[] = sortTroops(
      participant.tribe,
      participant.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountBefore,
      })),
    );
    const troopsAfter: TroopLike[] = sortTroops(
      participant.tribe,
      participant.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountAfter,
      })),
    );
    const troopsLost: TroopLike[] = sortTroops(
      participant.tribe,
      participant.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountBefore - troop.amountAfter,
      })),
    );

    return {
      troopsBefore,
      troopsAfter,
      troopsLost,
    };
  }, [participant]);

  return (
    <UnitTable tribe={participant.tribe}>
      <UnitTableTitle>{participant.role}</UnitTableTitle>

      {participant.role === 'attacker' && (
        <UnitTablePlayer
          playerName={battle.attackingPlayerName}
          playerSlug={battle.attackingPlayerSlug}
          tileName={battle.originName}
          coordinates={battle.originCoordinates}
        />
      )}
      {participant.role === 'defender' && !participant.isReinforcement && (
        <UnitTablePlayer
          playerName={battle.defendingPlayerName}
          playerSlug={battle.defendingPlayerSlug}
          tileName={battle.targetName}
          coordinates={battle.targetCoordinates}
        />
      )}

      <UnitTableUnitIcons />
      {participant.role === 'defender' && !showDefendingUnits && (
        <UnitTableHiddenRow
          label={t('Troops')}
          troops={troopsBefore}
        />
      )}
      {(participant.role === 'attacker' || showDefendingUnits) && (
        <>
          <UnitTableRow
            label={t('Initial')}
            troops={troopsBefore}
          />
          <UnitTableRow
            label={t('Casualties')}
            troops={troopsLost}
            textColor="text-red-500"
          />
          <UnitTableRow
            label={t('Remaining')}
            troops={troopsAfter}
            textColor="text-green-700"
          />
        </>
      )}

      {participant.role === 'attacker' && (
        <UnitTableLoot
          loot={battle.loot}
          totalCarryCapacity={battle.totalCarryCapacity}
        />
      )}
    </UnitTable>
  );
};
