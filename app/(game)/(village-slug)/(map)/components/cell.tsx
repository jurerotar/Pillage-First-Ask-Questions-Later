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
import type React from 'react';
import { memo } from 'react';
import { areEqual, type GridChildComponentProps } from 'react-window';
import { TreasureIcon } from 'app/(game)/(village-slug)/(map)/components/treasure-icon';
import { decodeGraphicsProperty } from 'app/utils/map';
import { Icon } from 'app/components/icon';
import type { TroopMovementType } from 'app/components/icons/icon-maps';
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
      shouldShowTooltip={false}
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

type GetTypePropertiesReturn = {
  classes: React.ComponentProps<'button'>['className'];
  style: React.ComponentProps<'button'>['style'];
};

const getTileProperties = (
  tile: ContextualTile,
  skinVariant: Preferences['skinVariant'],
  magnification: number,
  shouldShowFactionReputation: boolean,
): GetTypePropertiesReturn => {
  let classes = '';
  const style: React.ComponentProps<'button'>['style'] = {};

  const baseUrl = `/graphic-packs/${skinVariant}/map`;

  if (isUnoccupiedOccupiableTile(tile)) {
    const { RFC } = tile;
    classes = cellStyles.tile;
    style.backgroundImage = `url(${baseUrl}/unoccupied-tiles/${RFC}.avif?v=${import.meta.env.GRAPHICS_VERSION})`;
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
    style.backgroundImage = `url(${baseUrl}/oasis/${oasisResource}/${oasisGroup}-${oasisGroupPositions}-${variant}.avif?v=${import.meta.env.GRAPHICS_VERSION})`;
    classes = cellStyles.tile;
  }

  return {
    classes,
    style,
  };
};

type CellProps = GridChildComponentProps<CellBaseProps>;

export const Cell = memo<CellProps>(
  ({ data, style, rowIndex, columnIndex }) => {
    const {
      contextualMap,
      gridSize,
      mapFilters,
      magnification,
      onClick,
      preferences,
    } = data;

    const tile: ContextualTile =
      contextualMap[gridSize * rowIndex + columnIndex];

    const { classes, style: tileStyles } = getTileProperties(
      tile,
      preferences.skinVariant,
      magnification,
      mapFilters.shouldShowFactionReputation,
    );

    return (
      <button
        onClick={() => onClick(tile)}
        type="button"
        className={classes}
        style={{ ...style, ...tileStyles }}
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
