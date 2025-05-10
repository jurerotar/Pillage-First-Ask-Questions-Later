import { OccupiableOasisIcon } from 'app/(game)/(village-slug)/(map)/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/(game)/(village-slug)/(map)/components/wheat-field-icon';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isUnoccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { Reputation } from 'app/interfaces/models/game/reputation';
import type { Tile as TileType } from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { decodeGraphicsProperty } from 'app/utils/map-tile';
import type { Village } from 'app/interfaces/models/game/village';
import type { Player, PlayerFaction } from 'app/interfaces/models/game/player';
import cellStyles from './cell.module.scss';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icon-maps';

type CellBaseProps = {
  map: TileType[];
  gridSize: number;
  tileIdToTroopMovementsMap: Map<TileType['id'], GameEvent<'troopMovement'>[]>;
  mapFilters: MapFilters;
  magnification: number;
  onClick: (data: TileType) => void;
  villageCoordinatesToWorldItemsMap: Map<string, WorldItem>;
  villageCoordinatesToVillagesMap: Map<Village['id'], Village>;
  playersMap: Map<string, Player>;
  reputationsMap: Map<PlayerFaction, Reputation>;
  currentVillage: Village;
};

const offensiveMovements: GameEvent<'troopMovement'>['movementType'][] = ['attack', 'raid'];
const deploymentMovements: GameEvent<'troopMovement'>['movementType'][] = ['return', 'reinforcements', 'relocation'];

type TroopMovementsProps = CellBaseProps & {
  tile: TileType;
  troopMovements: GameEvent<'troopMovement'>[];
};

const TroopMovements: React.FC<TroopMovementsProps> = ({ tile, troopMovements, magnification, currentVillage }) => {
  const classes = clsx(cellStyles['troop-movements'], cellStyles[`troop-movements-magnification-${magnification}`]);

  const isCurrentVillageTile = currentVillage.id === tile.id;

  let troopMovementIcon: TroopMovementType | null = null;

  for (const troopMovement of troopMovements) {
    if (offensiveMovements.includes(troopMovement.movementType)) {
      if (isCurrentVillageTile && troopMovement.targetId === tile.id) {
        troopMovementIcon = 'offensiveMovementIncoming';
        break;
      }

      troopMovementIcon = 'offensiveMovementOutgoing';
      break;
    }

    if (deploymentMovements.includes(troopMovement.movementType)) {
      if (isCurrentVillageTile && troopMovement.targetId === tile.id) {
        troopMovementIcon = 'deploymentIncoming';
        break;
      }

      troopMovementIcon = 'deploymentOutgoing';
      break;
    }

    if (troopMovement.movementType === 'find-new-village') {
      troopMovementIcon = 'findNewVillage';
    }
  }

  if (!troopMovementIcon) {
    return null;
  }

  return (
    <Icon
      className={clsx(classes, 'animate-scale-pulse')}
      type={troopMovementIcon}
    />
  );
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = CellBaseProps & {
  tile: TileType;
};

const CellIcons: React.FC<CellIconsProps> = (props) => {
  const { tile, mapFilters, villageCoordinatesToWorldItemsMap, magnification } = props;
  const { shouldShowTreasureIcons, shouldShowOasisIcons, shouldShowWheatFields } = mapFilters;

  const classes = clsx(cellStyles['tile-icon'], cellStyles[`tile-icon-magnification-${magnification}`]);

  if (isOccupiableTile(tile) && shouldShowWheatFields && wheatFields.includes(tile.RFC)) {
    return <WheatFieldIcon className={classes} />;
  }

  if (isOccupiableOasisTile(tile)) {
    return (
      <>
        {shouldShowOasisIcons && (
          <OccupiableOasisIcon
            className={classes}
            oasisResourceBonus={tile.ORB}
            borderVariant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
          />
        )}
        {/*{shouldShowTroopMovements && <TroopMovements tile={tile} />}*/}
      </>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    const isWorldItemCell = villageCoordinatesToWorldItemsMap.has(tile.id);
    return (
      <>
        {shouldShowTreasureIcons && isWorldItemCell && (
          <TreasureIcon
            className={classes}
            item={villageCoordinatesToWorldItemsMap.get(tile.id)!}
          />
        )}
        {/*{shouldShowTroopMovements && <TroopMovements tile={tile} />}*/}
      </>
    );
  }

  return null;
};

// const populationToVillageSizeMap = new Map<number, VillageSize>([
//   [500, 'xl'],
//   [250, 'md'],
//   [100, 'sm'],
// ]);
//
// const getVillageSize = (population: number): VillageSize => {
//   for (const [key, size] of populationToVillageSizeMap) {
//     if (population >= key) {
//       return size;
//     }
//   }
//
//   return 'xs';
// };

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { map, gridSize, playersMap, reputationsMap, mapFilters, onClick, tileIdToTroopMovementsMap } = data;
  const { shouldShowFactionReputation } = mapFilters;

  const tile: TileType = map[gridSize * rowIndex + columnIndex];

  let classes = '';

  if (isUnoccupiedOccupiableTile(tile)) {
    const { RFC } = tile;
    classes = clsx(cellStyles.tile, cellStyles[`unoccupied-tile-${RFC}`]);
  } else if (isOccupiedOccupiableTile(tile)) {
    const { faction } = playersMap.get(tile.ownedBy)!;

    const reputationLevel = reputationsMap.get(faction)!.reputationLevel;

    classes = clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      // cellStyles[`occupied-tile-${tribe}`],
      // cellStyles[`occupied-tile-${tribe}-${villageSize}`],
      cellStyles[`occupied-tile-reputation-${reputationLevel}`],
      !shouldShowFactionReputation && cellStyles['occupied-tile-reputation-disabled'],
    );
  } else if (isOasisTile(tile)) {
    const { oasisResource, oasisGroup, oasisGroupPositions } = decodeGraphicsProperty(tile.graphics);
    classes = clsx(
      cellStyles.tile,
      cellStyles['oasis-tile'],
      cellStyles[`oasis-tile-${oasisResource}`],
      cellStyles[`oasis-tile-${oasisResource}-group-${oasisGroup}`],
      cellStyles[`oasis-tile-${oasisResource}-group-${oasisGroup}-position-${oasisGroupPositions}`],
    );
  }

  return (
    <button
      onClick={() => onClick(tile)}
      type="button"
      className={classes}
      style={style}
      data-tile-id={tile.id}
    >
      <CellIcons
        tile={tile}
        {...data}
      />
      {tileIdToTroopMovementsMap.has(tile.id) && (
        <TroopMovements
          tile={tile}
          troopMovements={tileIdToTroopMovementsMap.get(tile.id)!}
          {...data}
        />
      )}
    </button>
  );
}, areEqual);
