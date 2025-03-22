import { OccupiableOasisIcon } from 'app/(game)/(map)/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/(game)/(map)/components/wheat-field-icon';
import { calculatePopulationFromBuildingFields } from 'app/(game)/utils/building';
import {
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isUnoccupiedOccupiableTile,
} from 'app/(game)/utils/guards/map-guards';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { PlayerFaction } from 'app/interfaces/models/game/player';
import type { ReputationLevel } from 'app/interfaces/models/game/reputation';
import type {
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile as OccupiedOccupiableTileType,
  Tile as TileType,
} from 'app/interfaces/models/game/tile';
import type { Tribe } from 'app/interfaces/models/game/tribe';
import type { Village, VillageSize } from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import cellStyles from './cell.module.scss';
import type { WorldItem } from 'app/interfaces/models/game/world-item';
import { TreasureIcon } from 'app/(game)/(map)/components/treasure-icon';
import { parseCoordinatesFromTileId, parseOasisTileGraphicsProperty } from 'app/utils/map-tile';

const reputationColorMap = new Map<ReputationLevel, string>([
  ['player', 'after:border-reputation-player'],
  ['ecstatic', 'after:border-reputation-ecstatic'],
  ['respected', 'after:border-reputation-respected'],
  ['friendly', 'after:border-reputation-friendly'],
  ['neutral', 'after:border-reputation-neutral'],
  ['unfriendly', 'after:border-reputation-unfriendly'],
  ['hostile', 'after:border-reputation-hostile'],
]);

type TileWithVillageData = TileType | OccupiedTileWithFactionAndTribe;

type OccupiedTileWithFactionAndTribe = OccupiedOccupiableTileType & {
  faction: PlayerFaction;
  reputationLevel: ReputationLevel;
  tribe: Tribe;
};

type TroopMovementsProps = {
  tile: TileWithVillageData;
};

const TroopMovements: React.FC<TroopMovementsProps> = ({ tile }) => {
  const _isOccupiableCell = isOccupiableTile(tile);
  const _isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const _isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return null;
};

type CellBaseProps = {
  tilesWithFactions: TileWithVillageData[];
  mapFilters: MapFilters;
  magnification: number;
  onClick: (data: TileWithVillageData) => void;
  villageCoordinatesToVillagesMap: Map<TileType['id'], Village>;
  villageCoordinatesToWorldItemsMap: Map<string, WorldItem>;
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = Omit<CellBaseProps, 'tilesWithFactions'> & { tile: TileWithVillageData };

const CellIcons: React.FC<CellIconsProps> = ({ tile, mapFilters, villageCoordinatesToWorldItemsMap }) => {
  const { shouldShowFactionReputation, shouldShowTreasureIcons, shouldShowOasisIcons, shouldShowWheatFields, shouldShowTroopMovements } =
    mapFilters;

  const isOccupiableCell = isOccupiableTile(tile);
  const isOccupiableOasisCell = isOccupiableOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isWorldItemCell = villageCoordinatesToWorldItemsMap.has(tile.id);

  // Determine if any content will render
  const hasContent =
    (isOccupiedOccupiableCell && shouldShowTreasureIcons && isWorldItemCell) || // Treasure icon
    (isOccupiableCell && shouldShowWheatFields && wheatFields.includes((tile as OccupiableTile).RFC)) || // Wheat field icon
    (isOccupiableOasisCell && shouldShowOasisIcons) || // Oasis icon
    // shouldShowTroopMovements || // Troop movements
    (shouldShowFactionReputation && isOccupiedOccupiableCell); // Faction reputation CSS class

  if (!hasContent) {
    return null;
  }

  return (
    <div
      className={clsx(
        'size-full relative',
        shouldShowFactionReputation &&
          isOccupiedOccupiableCell &&
          `after:absolute after:top-0 after:left-0 after:size-full after:z-10 after:rounded-[1px] after:border-[3px] after:border-dashed ${reputationColorMap.get(
            (tile as OccupiedTileWithFactionAndTribe).reputationLevel,
          )!}`,
      )}
    >
      {isOccupiedOccupiableCell && shouldShowTreasureIcons && isWorldItemCell && (
        <TreasureIcon item={villageCoordinatesToWorldItemsMap.get(tile.id)!} />
      )}

      {isOccupiableCell && shouldShowWheatFields && wheatFields.includes((tile as OccupiableTile).RFC) && <WheatFieldIcon />}

      {isOccupiableOasisCell && shouldShowOasisIcons && (
        <OccupiableOasisIcon
          oasisResourceBonus={tile.ORB}
          borderVariant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
        />
      )}

      {shouldShowTroopMovements && <TroopMovements tile={tile} />}
    </div>
  );
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

const dynamicCellClasses = (
  tile: TileWithVillageData,
  villageCoordinatesToVillagesMap: CellBaseProps['villageCoordinatesToVillagesMap'],
): string => {
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);
  const isUnoccupiedOccupiableCell = isUnoccupiedOccupiableTile(tile);

  if (isUnoccupiedOccupiableCell) {
    const { RFC } = tile as OccupiableTile;
    return clsx(cellStyles['unoccupied-tile'], cellStyles[`unoccupied-tile-${RFC}`]);
  }

  if (isOccupiedOccupiableCell) {
    const { tribe } = tile as OccupiedTileWithFactionAndTribe;
    const { x, y } = parseCoordinatesFromTileId(tile.id);
    const { buildingFields, buildingFieldsPresets } = villageCoordinatesToVillagesMap.get(`${x}|${y}`)!;

    const population = calculatePopulationFromBuildingFields(buildingFields!, buildingFieldsPresets);

    const villageSize = getVillageSize(population);

    return clsx(
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-${tribe}`],
      cellStyles[`occupied-tile-${tribe}-${villageSize}`],
      cellStyles[`occupied-tile-${villageSize}`],
    );
  }

  const cell = tile as OasisTile;

  const { oasisResource, oasisGroup, groupPositions, oasisVariant } = parseOasisTileGraphicsProperty(cell.graphics);

  return clsx(
    cellStyles.oasis,
    cellStyles[`oasis-${oasisResource}`],
    cellStyles[`oasis-${oasisResource}-group-${oasisGroup}`],
    cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}`],
    cellStyles[`oasis-${oasisResource}-group-${oasisGroup}-position-${groupPositions}-variant-${oasisVariant}`],
  );
};

export const Cell = memo<CellProps>(({ data, style, rowIndex, columnIndex }) => {
  const { tilesWithFactions, ...cellIconsProps } = data;
  const { onClick, villageCoordinatesToVillagesMap } = cellIconsProps;

  const gridSize = Math.sqrt(data.tilesWithFactions.length);

  const tile: TileWithVillageData = tilesWithFactions[gridSize * rowIndex + columnIndex];

  return (
    <div
      className={clsx(
        dynamicCellClasses(tile, villageCoordinatesToVillagesMap),
        'flex size-full rounded-[1px] border border-gray-500/50 night:border-gray-700 bg-contain',
      )}
      style={style}
      data-tile-id={tile.id}
    >
      <button
        onClick={() => onClick(tile)}
        type="button"
        className="flex size-full absolute inset-0 z-[5]"
      />

      <CellIcons
        tile={tile}
        {...cellIconsProps}
      />
    </div>
  );
}, areEqual);
