import { OccupiableOasisIcon } from 'app/(game)/(village-slug)/(map)/components/occupiable-oasis-icon';
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
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { decodeGraphicsProperty } from 'app/utils/map';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icons';
import cellStyles from './cell.module.scss';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import type { Preferences } from 'app/interfaces/models/game/preferences';

type CellBaseProps = {
  contextualMap: ContextualTile[];
  gridSize: number;
  mapFilters: MapFilters;
  magnification: number;
  preferences: Preferences;
  onClick: (data: TileType) => void;
};

type TroopMovementsProps = {
  troopMovementIcon: TroopMovementType;
  magnification: number;
};

const TroopMovements = ({
  troopMovementIcon,
  magnification,
}: TroopMovementsProps) => {
  const classes = clsx(
    cellStyles['troop-movements'],
    cellStyles[`troop-movements-magnification-${magnification}`],
  );

  return (
    <Icon
      className={clsx(classes, 'animate-scale-pulse')}
      type={troopMovementIcon}
      shouldShowTooltip={false}
    />
  );
};

const wheatFields = ['00018', '11115', '3339'];

type CellIconsProps = CellBaseProps & {
  tile: ContextualTile;
};

const CellIcons = (props: CellIconsProps) => {
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
    wheatFields.includes(tile.resourceFieldComposition)
  ) {
    return (
      <BorderIndicator
        className={classes}
        variant="yellow"
      >
        <Icon
          type="wheat"
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  if (shouldShowOasisIcons && isOccupiableOasisTile(tile)) {
    return (
      <BorderIndicator
        className={classes}
        variant={isOccupiedOasisTile(tile) ? 'red' : 'green'}
      >
        <OccupiableOasisIcon oasisResourceBonus={tile.ORB} />
      </BorderIndicator>
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

const getTileClassNames = (
  tile: ContextualTile,
  magnification: number,
  shouldShowFactionReputation: boolean,
): string => {
  let classes = '';

  if (isUnoccupiedOccupiableTile(tile)) {
    const { resourceFieldComposition } = tile;
    classes = clsx(
      cellStyles.tile,
      cellStyles[`unoccupied-tile-${resourceFieldComposition}`],
    );
  } else if (isContextualOccupiedOccupiableTile(tile)) {
    const { reputationLevel } = tile;

    classes = clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-magnification-${magnification}`],
      shouldShowFactionReputation &&
        cellStyles[`occupied-tile-reputation-${reputationLevel}`],
    );
  } else if (isOasisTile(tile)) {
    const { oasisResource, oasisGroup, oasisGroupPositions, variant } =
      decodeGraphicsProperty(tile.graphics);
    classes = clsx(
      cellStyles.tile,
      cellStyles[
        `oasis-tile-${oasisResource}-${oasisGroup}-${oasisGroupPositions}-${variant}`
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

    const className = getTileClassNames(
      tile,
      magnification,
      mapFilters.shouldShowFactionReputation,
    );

    return (
      <button
        onClick={() => onClick(tile)}
        type="button"
        className={className}
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
