import { clsx } from 'clsx';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import type { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import { getReputationLevel } from 'app/(game)/(village-slug)/utils/reputation';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icons';
import type { MapFilters } from 'app/interfaces/models/game/map-filters';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { decodeGraphicsProperty } from 'app/utils/map';
import cellStyles from './cell.module.scss';

type Tile = ReturnType<typeof useMap>['map'][0];

type CellBaseProps = {
  map: Tile[];
  gridSize: number;
  mapFilters: MapFilters;
  magnification: number;
  preferences: Preferences;
  onClick: (tileId: number) => void;
};

type TroopMovementsProps = {
  troopMovementIcon: TroopMovementType;
  magnification: number;
};

const _TroopMovements = ({
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

const wheatFields = new Set(['00018', '11115', '3339']);

type CellIconsProps = CellBaseProps & {
  tile: NonNullable<Tile>;
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
    tile.type === 'free' &&
    shouldShowWheatFields &&
    wheatFields.has(tile.resourceFieldComposition)
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

  if (
    shouldShowOasisIcons &&
    tile.type === 'oasis' &&
    tile.oasisResource !== null
  ) {
    return (
      <BorderIndicator
        className={classes}
        variant={tile.isOccupied ? 'red' : 'green'}
      >
        <Icon
          type={tile.oasisResource}
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  if (shouldShowTreasureIcons && tile.type === 'free' && tile.itemId !== null) {
    return (
      <TreasureIcon
        className={classes}
        itemId={tile.itemId}
      />
    );
  }

  return null;
};

const getTileClassNames = (
  tile: NonNullable<Tile>,
  magnification: number,
  shouldShowFactionReputation: boolean,
): string => {
  let classes = '';

  if (tile.type === 'free' && !tile.isOccupied) {
    const { resourceFieldComposition } = tile;
    classes = clsx(
      cellStyles.tile,
      cellStyles[`unoccupied-tile-${resourceFieldComposition}`],
    );
  } else if (tile.type === 'free' && tile.isOccupied) {
    const { reputation } = tile;

    const reputationLevel = getReputationLevel(reputation);

    classes = clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-magnification-${magnification}`],
      shouldShowFactionReputation &&
        cellStyles[`occupied-tile-reputation-${reputationLevel}`],
    );
  } else if (tile.type === 'oasis') {
    const { oasisResource, oasisGroup, oasisGroupPositions, variant } =
      decodeGraphicsProperty(tile.oasisGraphics);
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
    const { map, gridSize, mapFilters, magnification, onClick } = data;

    const tileIndex = gridSize * rowIndex + columnIndex;
    const tileId = tileIndex + 1;

    const tile = map[tileIndex];
    const isBorderTile = tile === null;

    return (
      <button
        onClick={() => onClick(tileId)}
        type="button"
        style={style}
        data-tile-id={tileId}
        {...(isBorderTile && {
          className: clsx(
            cellStyles.tile,
            // We have to do + 1, because 0 is reserved for 1x1 oasis icon
            cellStyles[`border-tile-${(tileIndex % 4) + 1}`],
          ),
        })}
        {...(!isBorderTile && {
          className: getTileClassNames(
            tile,
            magnification,
            mapFilters.shouldShowFactionReputation,
          ),
        })}
      >
        {!isBorderTile && (
          <CellIcons
            tile={tile}
            {...data}
          />
        )}
      </button>
    );
  },
  areEqual,
);
