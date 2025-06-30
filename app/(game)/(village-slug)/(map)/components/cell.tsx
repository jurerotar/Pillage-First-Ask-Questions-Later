import { OccupiableOasisIcon } from 'app/(game)/(village-slug)/(map)/components/occupiable-oasis-icon';
import { WheatFieldIcon } from 'app/(game)/(village-slug)/(map)/components/wheat-field-icon';
import {
  isContextualOccupiedOccupiableTile,
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
  isUnoccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type {
  ContextualTile,
  Tile as TileType,
} from 'app/interfaces/models/game/tile';
import clsx from 'clsx';
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { decodeGraphicsProperty } from 'app/utils/map';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icon-maps';
import cellStyles from './cell.module.scss';

type CellBaseProps = {
  contextualMap: ContextualTile[];
  gridSize: number;
  mapFilters: MapFilters;
  magnification: number;
  onClick: (data: TileType) => void;
};

type TroopMovementsProps = {
  troopMovementIcon: TroopMovementType;
  magnification: number;
};

const TroopMovements: React.FC<TroopMovementsProps> = ({
  troopMovementIcon,
  magnification,
}) => {
  const classes = clsx(
    cellStyles['troop-movements'],
    cellStyles[`troop-movements-magnification-${magnification}`],
  );

  return (
    <Icon
      className={clsx(classes, 'animate-scale-pulse')}
      type={troopMovementIcon}
    />
  );
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = CellBaseProps & {
  tile: ContextualTile;
};

const CellIcons: React.FC<CellIconsProps> = (props) => {
  const { tile, mapFilters, magnification } = props;
  const {
    shouldShowTreasureIcons,
    shouldShowOasisIcons,
    shouldShowWheatFields,
  } = mapFilters;

  const classes = clsx(
    cellStyles['tile-icon'],
    cellStyles[`tile-icon-magnification-${magnification}`],
  );

  if (
    isOccupiableTile(tile) &&
    shouldShowWheatFields &&
    wheatFields.includes(tile.RFC)
  ) {
    return <WheatFieldIcon className={classes} />;
  }

  if (shouldShowOasisIcons && isOccupiableOasisTile(tile)) {
    return (
      <OccupiableOasisIcon
        className={classes}
        oasisResourceBonus={tile.ORB}
        borderVariant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
      />
    );
  }

  if (
    shouldShowTreasureIcons &&
    isOccupiedOccupiableTile(tile) &&
    tile.worldItem !== null
  ) {
    return (
      <TreasureIcon
        className={classes}
        item={tile.worldItem}
      />
    );
  }

  return null;
};

const getTileClasses = (
  tile: ContextualTile,
  shouldShowFactionReputation: boolean,
): string => {
  let classes = '';

  if (isUnoccupiedOccupiableTile(tile)) {
    const { RFC } = tile;
    classes = clsx(cellStyles.tile, cellStyles[`unoccupied-tile-${RFC}`]);
  } else if (isContextualOccupiedOccupiableTile(tile)) {
    const { tribe, reputationLevel, villageSize } = tile;

    classes = clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-${tribe}`],
      cellStyles[`occupied-tile-${tribe}-${villageSize}`],
      cellStyles[`occupied-tile-reputation-${reputationLevel}`],
      !shouldShowFactionReputation &&
        cellStyles['occupied-tile-reputation-disabled'],
    );
  } else if (isOasisTile(tile)) {
    const { oasisResource, oasisGroup, oasisGroupPositions } =
      decodeGraphicsProperty(tile.graphics);
    classes = clsx(
      cellStyles.tile,
      cellStyles['oasis-tile'],
      cellStyles[`oasis-tile-${oasisResource}`],
      cellStyles[`oasis-tile-${oasisResource}-group-${oasisGroup}`],
      cellStyles[
        `oasis-tile-${oasisResource}-group-${oasisGroup}-position-${oasisGroupPositions}`
      ],
    );
  }

  return classes;
};

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(
  ({ data, style, rowIndex, columnIndex }) => {
    const { contextualMap, gridSize, mapFilters, magnification, onClick } =
      data;

    const tile: ContextualTile =
      contextualMap[gridSize * rowIndex + columnIndex];

    const classes = getTileClasses(
      tile,
      mapFilters.shouldShowFactionReputation,
    );

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
        {tile.troopMovementIcon !== null && (
          <TroopMovements
            magnification={magnification}
            troopMovementIcon={tile.troopMovementIcon}
          />
        )}
      </button>
    );
  },
  areEqual,
);
