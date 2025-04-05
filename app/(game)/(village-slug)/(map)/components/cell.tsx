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
import type { OasisTile, OccupiedOccupiableTile as OccupiedOccupiableTileType, Tile as TileType } from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { parseCoordinatesFromTileId, parseOasisTileGraphicsProperty } from 'app/utils/map-tile';
import { calculatePopulationFromBuildingFields } from 'app/(game)/(village-slug)/utils/building';
import type { Village, VillageSize } from 'app/interfaces/models/game/village';
import type { Player, PlayerFaction } from 'app/interfaces/models/game/player';
import cellStyles from './cell.module.scss';

type OccupiedTileWithClasses = TileType & OccupiedOccupiableTileType;

type TroopMovementsProps = {
  tile: OccupiedTileWithClasses;
};

const _TroopMovements: React.FC<TroopMovementsProps> = ({ tile }) => {
  const _isOccupiableCell = isOccupiableTile(tile);
  const _isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const _isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return null;
};

type CellBaseProps = {
  map: TileType[];
  gridSize: number;
  mapFilters: MapFilters;
  onClick: (data: TileType) => void;
  villageCoordinatesToWorldItemsMap: Map<string, WorldItem>;
  villageCoordinatesToVillagesMap: Map<Village['id'], Village>;
  playersMap: Map<string, Player>;
  reputationsMap: Map<PlayerFaction, Reputation>;
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = CellBaseProps & {
  tile: TileType;
};

const CellIcons: React.FC<CellIconsProps> = (props) => {
  const { tile, mapFilters, villageCoordinatesToWorldItemsMap } = props;
  const { shouldShowTreasureIcons, shouldShowOasisIcons, shouldShowWheatFields } = mapFilters;

  if (isOccupiableTile(tile) && shouldShowWheatFields && wheatFields.includes(tile.RFC)) {
    return <WheatFieldIcon />;
  }

  if (isOccupiableOasisTile(tile)) {
    return (
      <>
        {shouldShowOasisIcons && (
          <OccupiableOasisIcon
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
        {shouldShowTreasureIcons && isWorldItemCell && <TreasureIcon item={villageCoordinatesToWorldItemsMap.get(tile.id)!} />}
        {/*{shouldShowTroopMovements && <TroopMovements tile={tile} />}*/}
      </>
    );
  }

  return null;
};

const populationToVillageSizeMap = new Map<number, VillageSize>([
  [500, 'xl'],
  [250, 'md'],
  [100, 'sm'],
]);

const getVillageSize = (population: number): VillageSize => {
  for (const [key, size] of populationToVillageSizeMap) {
    if (population >= key) {
      return size;
    }
  }

  return 'xs';
};

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { map, gridSize, playersMap, reputationsMap, villageCoordinatesToVillagesMap, mapFilters, onClick } = data;
  const { shouldShowFactionReputation } = mapFilters;

  const tile: TileType = map[gridSize * rowIndex + columnIndex];

  let classes = '';

  const isUnoccupiedOccupiableCell = isUnoccupiedOccupiableTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isOasisCell = isOasisTile(tile);

  if (isUnoccupiedOccupiableCell) {
    const { RFC } = tile;
    classes = clsx(cellStyles.cell, cellStyles['unoccupied-tile'], cellStyles[`unoccupied-tile-${RFC}`]);
  } else if (isOccupiedOccupiableCell) {
    const { tribe } = playersMap.get(tile.ownedBy)!;
    const { x, y } = parseCoordinatesFromTileId(tile.id);
    const { buildingFields, buildingFieldsPresets } = villageCoordinatesToVillagesMap.get(`${x}|${y}`)!;

    const population = calculatePopulationFromBuildingFields(buildingFields!, buildingFieldsPresets);

    const villageSize = getVillageSize(population);

    classes = clsx(
      cellStyles.cell,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-${tribe}`],
      cellStyles[`occupied-tile-${tribe}-${villageSize}`],
      cellStyles[`occupied-tile-${villageSize}`],
    );
  } else if (isOasisCell) {
    const { oasisResource, oasisGroup, groupPositions, oasisVariant } = parseOasisTileGraphicsProperty((tile as OasisTile).graphics);
    classes = clsx(
      cellStyles.cell,
      cellStyles.oasis,
      cellStyles[`oasis-${oasisResource}`],
      cellStyles[`oasis-${oasisResource}-group-${oasisGroup}`],
      cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}`],
      cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}-variant-${oasisVariant}`],
    );
  }

  return (
    <button
      onClick={() => onClick(tile)}
      type="button"
      className={classes}
      style={style}
      data-tile-id={tile.id}
      {...(shouldShowFactionReputation &&
        isOccupiedOccupiableCell && {
          'data-tile-reputation-level': reputationsMap.get(playersMap.get(tile.ownedBy)!.faction)!.reputationLevel,
        })}
    >
      <CellIcons
        tile={tile}
        {...data}
      />
    </button>
  );
}, areEqual);
