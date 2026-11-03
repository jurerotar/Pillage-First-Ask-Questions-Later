import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { sortTroops } from '@pillage-first/game-assets/utils/troops';
import type { TroopMovementItemDto } from '@pillage-first/types/dtos/troop-movement';
import { tileIdToCoordinates } from '@pillage-first/utils/map';
import type { TroopMovementFilterType } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/components/troop-movement-filters';
import { getTroopMovementFilterCategory } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/rally-point/utils/get-troop-movement-filter-category';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useServer } from 'app/(game)/(village-slug)/hooks/use-server';
import {
  UnitTable,
  UnitTableArrivalRow,
  UnitTableHiddenRow,
  UnitTableLootRow,
  UnitTableRow,
  UnitTableTitle,
  UnitTableUnitIcons,
} from 'app/(game)/components/unit-table';

const getMovementBackground = (category: TroopMovementFilterType): string => {
  switch (category) {
    case 'deploymentOutgoing':
    case 'offensiveMovementOutgoing': {
      return 'bg-yellow-100 dark:bg-yellow-400/40';
    }
    case 'offensiveMovementIncoming': {
      return 'bg-red-100 dark:bg-red-950';
    }
    default: {
      return 'bg-green-100 dark:bg-green-950';
    }
  }
};

const getMovementLabel = (
  type: TroopMovementItemDto['type'],
  outgoing: boolean,
  t: ReturnType<typeof useTranslation>['t'],
) => {
  switch (type) {
    case 'troopMovementReinforcements':
      return outgoing ? t('Reinforcements to') : t('Reinforcements from');
    case 'troopMovementRelocation':
      return outgoing ? t('Relocation to') : t('Relocation from');
    case 'troopMovementAttack':
      return outgoing ? t('Attack against') : t('Attack from');
    case 'troopMovementRaid':
      return outgoing ? t('Raid against') : t('Raid from');
    case 'troopMovementReturn':
      return t('Return from');
    case 'troopMovementOasisOccupation':
      return t('Occupy oasis');
    case 'troopMovementFindNewVillage':
      return t('Found village at');
    case 'troopMovementAdventure':
      return t('Adventure');
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
  const loot =
    movement.type === 'troopMovementReturn' ? movement.loot : undefined;
  const { currentVillage } = useCurrentVillage();
  const { mapSize } = useServer();

  const category = getTroopMovementFilterCategory(
    movement,
    currentVillage.tileId,
  );

  const sortedTroops = useMemo(
    () => sortTroops(movement.playerTribe, movement.troops ?? []),
    [movement.playerTribe, movement.troops],
  );

  const isIncomingOffensive =
    category === 'offensiveMovementIncoming' &&
    movement.playerId !== currentVillage.playerId;

  const outgoing = movement.originatingTileId === currentVillage.tileId;
  const showOrigin = !outgoing;

  const otherVillage = (() => {
    if (movement.type === 'troopMovementAdventure') {
      return null;
    }

    if (showOrigin) {
      return {
        tileId: movement.originatingTileId,
        name: movement.originatingVillageName ?? t('Oasis'),
      };
    }

    return {
      tileId: movement.targetTileId,
      name: movement.targetVillageName ?? t('Oasis'),
    };
  })();

  return (
    <UnitTable tribe={movement.playerTribe}>
      <UnitTableTitle className={getMovementBackground(category)}>
        {getMovementLabel(movement.type, outgoing, t)}
        {otherVillage?.tileId != null && (
          <>
            {' '}
            <TileLink
              name={otherVillage.name}
              tileId={otherVillage.tileId}
              mapSize={mapSize}
            />
          </>
        )}
      </UnitTableTitle>
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
      <UnitTableLootRow loot={loot} />
      <UnitTableArrivalRow endsAt={movement.resolvesAt} />
    </UnitTable>
  );
};
