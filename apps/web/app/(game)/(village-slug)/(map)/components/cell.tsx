import { clsx } from 'clsx';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import type { MapFilters } from '@pillage-first/types/models/map-filters';
import type { Preferences } from '@pillage-first/types/models/preferences';
import type { ReputationLevel } from '@pillage-first/types/models/reputation';
import { decodeGraphicsProperty } from '@pillage-first/utils/map';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { BorderIndicator } from 'app/(game)/(village-slug)/components/border-indicator';
import type { useMap } from 'app/(game)/(village-slug)/hooks/use-map';
import type { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icons';
import cellStyles from './cell.module.scss';

type Tile = ReturnType<typeof useMap>['map'][0];

type CellBaseProps = {
  map: Tile[];
  gridSize: number;
  mapFilters: MapFilters;
  magnification: number;
  preferences: Preferences;
  onClick: (tileId: number) => void;
  getReputation: ReturnType<typeof useReputations>['getReputation'];
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
    wheatFields.has(tile.attributes.resourceFieldComposition)
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
    tile.attributes.oasisResource !== null
  ) {
    return (
      <BorderIndicator
        className={classes}
        variant={tile.owner !== null ? 'red' : 'green'}
      >
        <Icon
          type={tile.attributes.oasisResource}
          shouldShowTooltip={false}
        />
      </BorderIndicator>
    );
  }

  if (shouldShowTreasureIcons && tile.type === 'free' && tile.item !== null) {
    return (
      <TreasureIcon
        className={classes}
        itemId={tile.item.id}
      />
    );
  }

  return null;
};

const getTileClassNames = (
  tile: NonNullable<Tile>,
  getReputation: CellBaseProps['getReputation'],
  magnification: number,
  shouldShowFactionReputation: boolean,
): string => {
  let classes = '';

  if (tile.type === 'free' && tile.owner === null) {
    const { resourceFieldComposition } = tile.attributes;
    classes = clsx(
      cellStyles.tile,
      cellStyles[`unoccupied-tile-${resourceFieldComposition}`],
    );
  } else if (tile.type === 'free' && tile.owner !== null) {
    const { faction } = tile.owner!;

    let reputationLevel: ReputationLevel;

    if (faction === 'player') {
      reputationLevel = 'player';
    } else {
      reputationLevel = getReputation(faction).reputationLevel;
    }

    classes = clsx(
      cellStyles.tile,
      cellStyles['occupied-tile'],
      cellStyles[`occupied-tile-magnification-${magnification}`],
      shouldShowFactionReputation &&
        cellStyles[`occupied-tile-reputation-${reputationLevel}`],
    );
  } else if (tile.type === 'oasis') {
    const { oasisResource, oasisGroup, oasisGroupPositions, variant } =
      decodeGraphicsProperty(tile.attributes.oasisGraphics);
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
    const { map, gridSize, mapFilters, magnification, onClick, getReputation } =
      data;

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
            getReputation,
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
