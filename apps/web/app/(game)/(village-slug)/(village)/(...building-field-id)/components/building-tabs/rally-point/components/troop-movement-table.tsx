import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type { TroopMovementItemDto } from '@pillage-first/types/dtos/troop-movement';
import { tileIdToCoordinates } from '@pillage-first/utils/map';
import type { TroopMovementFilterType } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/components/troop-movement-filters';
import { getTroopMovementFilterCategory } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/utils/get-troop-movement-filter-category';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  UnitTable,
  UnitTableHiddenRow,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
} from 'app/(game)/components/unit-table';
import { Icon } from 'app/components/icon';
import type { IconType } from 'app/components/icons/icons';

const getMovementIcon = (category: TroopMovementFilterType): IconType => {
  switch (category) {
    case 'offensiveMovementOutgoing': {
      return 'attackerNoLoss';
    }
    case 'offensiveMovementIncoming': {
      return 'defenderNoLoss';
    }
    case 'adventure': {
      return 'heroAdventure';
    }
    case 'findNewVillage': {
      return 'villageFounded';
    }
    default: {
      return 'troopMovement';
    }
  }
};

const getMovementLabel = (
  type: TroopMovementItemDto['type'],
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (type) {
    case 'troopMovementAttack': {
      return t('Attack');
    }
    case 'troopMovementRaid': {
      return t('Raid');
    }
    case 'troopMovementOasisOccupation': {
      return t('Occupy oasis');
    }
    case 'troopMovementReinforcements': {
      return t('Reinforcement');
    }
    case 'troopMovementRelocation': {
      return t('Relocation');
    }
    case 'troopMovementReturn': {
      return t('Return');
    }
    case 'troopMovementAdventure': {
      return t('Adventure');
    }
    case 'troopMovementFindNewVillage': {
      return t('Find new village');
    }
  }
};

type TileLinkProps = {
  name: string;
  tileId: number;
  mapSize: number;
};

const TileLink = ({ name, tileId, mapSize }: TileLinkProps) => {
  const { x, y } = tileIdToCoordinates(tileId, mapSize);

  return (
    <Link
      to={`../map?x=${x}&y=${y}`}
      className="text-link"
    >
      {name} ({x}|{y})
    </Link>
  );
};

type TroopMovementTableProps = {
  movement: TroopMovementItemDto;
};

export const TroopMovementTable = ({ movement }: TroopMovementTableProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { mapSize } = useServer();

  const category = getTroopMovementFilterCategory(
    movement,
    currentVillage.tileId,
  );
  const iconType = getMovementIcon(category);
  const label = getMovementLabel(movement.type, t);

  const sortedTroops = useMemo(
    () => sortTroops(movement.playerTribe, movement.troops ?? []),
    [movement.playerTribe, movement.troops],
  );

  const isIncomingOffensive =
    category === 'offensiveMovementIncoming' &&
    movement.playerId !== currentVillage.playerId;

  const targetTileId =
    movement.type === 'troopMovementAdventure' ? null : movement.targetTileId;
  const targetVillageName =
    movement.type === 'troopMovementAdventure'
      ? null
      : (movement.targetVillageName ?? t('Oasis'));

  return (
    <UnitTable tribe={movement.playerTribe}>
      <UnitTableTitle>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <Icon
              type={iconType}
              shouldShowTooltip={false}
              className="size-5"
            />
            {label}
          </span>
          <Countdown endsAt={movement.resolvesAt} />
        </div>
      </UnitTableTitle>
      <thead className="bg-muted border-b dark:border-border font-medium">
        <tr>
          <th
            colSpan={12}
            className="p-2 text-left font-medium"
          >
            <span className="text-muted-foreground">{movement.playerName}</span>{' '}
            {t('from')}{' '}
            <TileLink
              name={movement.originatingVillageName ?? t('Oasis')}
              tileId={movement.originatingTileId}
              mapSize={mapSize}
            />
            {targetTileId !== null && targetVillageName !== null && (
              <>
                {' '}
                {t('to')}{' '}
                <TileLink
                  name={targetVillageName}
                  tileId={targetTileId}
                  mapSize={mapSize}
                />
              </>
            )}
          </th>
        </tr>
      </thead>
      <UnitTableUnitIcons />
      {isIncomingOffensive ? (
        <UnitTableHiddenRow
          label={t('Troops')}
          troops={sortedTroops}
        />
      ) : (
        <UnitTableRow
          label={t('Troops')}
          troops={sortedTroops}
        />
      )}
    </UnitTable>
  );
};
