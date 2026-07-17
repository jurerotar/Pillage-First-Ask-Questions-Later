import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type {
  BattleCombatant,
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
  combatant: BattleCombatant;
  role: 'attacker' | 'defender' | 'reinforcement';
  showDefendingUnits: boolean;
};

export const BattleParticipantTable = ({
  battle,
  combatant,
  role,
  showDefendingUnits,
}: BattleParticipantTableProps) => {
  const { t } = useTranslation();

  const { troopsBefore, troopsAfter, troopsLost } = useMemo(() => {
    const troopsBefore: TroopLike[] = sortTroops(
      combatant.troops.tribe,
      combatant.troops.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountBefore,
      })),
    );
    const troopsAfter: TroopLike[] = sortTroops(
      combatant.troops.tribe,
      combatant.troops.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountAfter,
      })),
    );
    const troopsLost: TroopLike[] = sortTroops(
      combatant.troops.tribe,
      combatant.troops.units.map((troop) => ({
        unitId: troop.unitId,
        amount: troop.amountBefore - troop.amountAfter,
      })),
    );

    return {
      troopsBefore,
      troopsAfter,
      troopsLost,
    };
  }, [combatant]);

  return (
    <UnitTable tribe={combatant.troops.tribe}>
      <UnitTableTitle>{role}</UnitTableTitle>

      <UnitTablePlayer
        playerName={combatant.player.name}
        playerSlug={combatant.player.slug}
        tileName={combatant.village.name}
        coordinates={combatant.village.coordinates}
        sourceLabel={
          combatant.troops.tribe === 'nature' ? t(' from ') : undefined
        }
      />

      <UnitTableUnitIcons />
      {role !== 'attacker' && !showDefendingUnits && (
        <UnitTableHiddenRow
          label={t('Troops')}
          troops={troopsBefore}
        />
      )}
      {(role === 'attacker' || showDefendingUnits) && (
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

      {role === 'attacker' && (
        <UnitTableLoot
          loot={battle.outcome.loot}
          totalCarryCapacity={battle.outcome.totalCarryCapacity}
        />
      )}
    </UnitTable>
  );
};
