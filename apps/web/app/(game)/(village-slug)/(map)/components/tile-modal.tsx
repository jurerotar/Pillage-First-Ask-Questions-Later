import { clsx } from 'clsx';
import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getSettlerUnitIdByTribe } from '@pillage-first/game-assets/utils/units';
import {
  type MapMarker,
  mapMarkerColorPresets,
} from '@pillage-first/types/models/map-marker';
import type {
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile,
} from '@pillage-first/types/models/tile';
import { isFindNewVillageTroopMovementEvent } from '@pillage-first/utils/guards/event';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from '@pillage-first/utils/guards/map';
import { parseResourcesFromRFC } from '@pillage-first/utils/map';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from '@pillage-first/utils/math';
import { useOasisBonuses } from 'app/(game)/(village-slug)/(map)/hooks/use-oasis-bonuses';
import { useTileTroops } from 'app/(game)/(village-slug)/(map)/hooks/use-tile-troops';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Icon } from 'app/components/icon';
import { unitIdToUnitIconMapper } from 'app/components/icons/icons';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { Input } from 'app/components/ui/input';
import { Label } from 'app/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'app/components/ui/popover';
import { Skeleton } from 'app/components/ui/skeleton';

type TileModalResourcesProps = {
  tile: OccupiableTile;
};

const TileModalResources = ({ tile }: TileModalResourcesProps) => {
  const resources = parseResourcesFromRFC(
    tile.attributes.resourceFieldComposition,
  );

  return (
    <div className="flex gap-2 justify-start text-sm">
      <Resources
        iconClassName="size-4"
        resources={resources}
      />
    </div>
  );
};

type TileModalProps = {
  tile: Tile;
};

type TileModalMarkerProps = {
  mapMarkers: MapMarker[];
  createMapMarker: (args: {
    tileId: number;
    description: string;
    color: MapMarker['color'];
  }) => void;
  deleteMapMarker: (args: { tileId: number }) => void;
};

type TileDialogProps = TileModalProps & TileModalMarkerProps;

type MapMarkerFormValues = {
  description: string;
  color: MapMarker['color'];
};

const TileModalMarkerAction = ({
  tile,
  mapMarkers,
  createMapMarker,
  deleteMapMarker,
}: TileDialogProps) => {
  const { t } = useTranslation();
  const marker = mapMarkers.find((marker) => marker.tileId === tile.id);
  const label = marker ? t('Edit map marker') : t('Create map marker');
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<MapMarkerFormValues>({
    defaultValues: {
      description: '',
      color: '#dc2626',
    },
  });

  const color = form.watch('color');

  useEffect(() => {
    form.reset({
      description: marker?.description ?? '',
      color: marker?.color ?? '#dc2626',
    });
  }, [form, marker]);

  const onSubmit = form.handleSubmit(({ description, color }) => {
    createMapMarker({
      tileId: tile.id,
      description: description.trim(),
      color,
    });

    form.reset();
    setIsOpen(false);
  });

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <PopoverTrigger asChild>
        <Button
          aria-label={label}
          className={clsx(
            'absolute top-1.5 right-12 rounded-xs',
            marker && getContrastingTextClassName(marker.color),
          )}
          size="icon"
          style={marker ? { backgroundColor: marker.color } : undefined}
          title={label}
          variant={marker ? 'ghost' : 'outline'}
        >
          <Icon
            className="size-4"
            shouldShowTooltip={false}
            type="mapMarker"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72"
        side="bottom"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor={`map-marker-description-${tile.id}`}>
              {t('Description')}
            </Label>
            <Input
              id={`map-marker-description-${tile.id}`}
              maxLength={120}
              placeholder={t('Map marker description')}
              {...form.register('description')}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t('Color')}</span>
            <div className="flex gap-2">
              {mapMarkerColorPresets.map((markerColor) => (
                <button
                  aria-label={t('{{color}} marker', {
                    color: markerColor,
                  })}
                  className={clsx(
                    'size-8 rounded-full border border-border outline-none transition-all focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    color === markerColor && 'ring-2 ring-ring ring-offset-2',
                  )}
                  key={markerColor}
                  onClick={() =>
                    form.setValue('color', markerColor, {
                      shouldDirty: true,
                    })
                  }
                  style={{ backgroundColor: markerColor }}
                  type="button"
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              type="submit"
            >
              {marker ? t('Update map marker') : t('Create map marker')}
            </Button>
            {marker && (
              <Button
                onClick={() => {
                  deleteMapMarker({ tileId: tile.id });
                  setIsOpen(false);
                }}
                type="button"
                variant="destructive"
              >
                {t('Delete')}
              </Button>
            )}
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

const getContrastingTextClassName = (hexColor: string) => {
  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 160
    ? 'text-black hover:text-black'
    : 'text-white hover:text-white';
};

type TileModalMarkerDescriptionProps = {
  mapMarkers: MapMarker[];
  tile: Tile;
};

const TileModalMarkerDescription = ({
  mapMarkers,
  tile,
}: TileModalMarkerDescriptionProps) => {
  const marker = mapMarkers.find((marker) => marker.tileId === tile.id);

  if (!marker?.description) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="flex items-center gap-1 font-medium">
        <Icon
          className="size-4"
          shouldShowTooltip={false}
          style={{ color: marker.color }}
          type="mapMarker"
        />
        <span className="text-muted-foreground">{marker.description}</span>
      </span>
    </div>
  );
};

const TileModalLocation = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const distance = roundToNDecimalPoints(
    calculateDistanceBetweenPoints(
      currentVillage.coordinates,
      tile.coordinates,
    ),
  );
  const { x, y } = tile.coordinates;

  return (
    <span className="text-xs text-gray-500">
      ({x}|{y}) - {t('{{count}} fields', { count: distance })}
    </span>
  );
};

const TileModalPlayerInfo = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const { getReputation } = useReputations();

  const { tribe, name, faction, slug } = tile.owner!;
  const { population } = tile.ownerVillage!;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex">
        {t('Player')} -{' '}
        <Text variant="link">
          <Link to={`../players/${slug}`}>{name}</Link>
        </Text>
      </div>
      {faction !== 'player' && (
        <>
          <span>
            {t('Faction')} - {t(`FACTIONS.${faction.toUpperCase()}`)}
          </span>
          <span>
            {t('Reputation')} -{' '}
            {t(
              `REPUTATIONS.${getReputation(faction).reputationLevel.toUpperCase()}`,
            )}
          </span>
        </>
      )}
      <span>
        {t('Tribe')} - {t(`TRIBES.${tribe.toUpperCase()}`)}
      </span>
      <span>
        {t('Population')} - {population}
      </span>
    </div>
  );
};

type OasisTileModalProps = {
  tile: OasisTile;
};

type OasisTileModalAnimalsProps = {
  tile: OasisTile;
};

const OasisTileModalAnimals = ({ tile }: OasisTileModalAnimalsProps) => {
  const { tileTroops } = useTileTroops(tile.id);

  return (
    <div className="flex flex-col flex-wrap gap-2">
      {tileTroops.map(({ unitId, amount }) => (
        <span
          key={unitId}
          className="flex items-center gap-1 text-sm"
        >
          <Icon
            className="size-4"
            type={unitIdToUnitIconMapper(unitId)}
          />
          {amount}
        </span>
      ))}
    </div>
  );
};

const OasisTileModalAnimalsSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton
          // biome-ignore lint/suspicious/noArrayIndexKey: It's a static loading placeholder.
          key={`animal-skeleton-${i}`}
          className="h-4 w-10 rounded-xs"
        />
      ))}
    </div>
  );
};

const OasisTileModal = ({ tile }: OasisTileModalProps) => {
  const { t } = useTranslation();
  const { oasisBonuses } = useOasisBonuses(tile.id);

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);

  const title = (() => {
    if (!isOccupiable) {
      return t('Wilderness');
    }
    return isOccupied ? t('Occupied oasis') : t('Unoccupied oasis');
  })();

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <TileModalLocation tile={tile} />
      <DialogDescription>
        {!isOccupiable && t('This is an un-occupiable oasis.')}
        {isOccupiable && (
          <>
            {isOccupied && (
              <>
                {tile.owner.id === PLAYER_ID &&
                  t(
                    'This oasis is occupied by you and is producing resources for village {{villageName}}.',
                    {
                      villageName: tile.ownerVillage.name,
                    },
                  )}
                {tile.owner.id !== PLAYER_ID &&
                  t(
                    'This oasis is occupied by another player. You can raid it, but doing so may trigger retaliations.',
                  )}
              </>
            )}
            {!isOccupied &&
              t(
                'This is an occupiable oasis. You can occupy this oasis by upgrading {{herosMansion}} to levels 10, 15 or 20.',
                {
                  herosMansion: t('BUILDINGS.HEROS_MANSION.NAME'),
                },
              )}
          </>
        )}
      </DialogDescription>
      {isOccupiable && (
        <div className="flex justify-start gap-2 items-center">
          {oasisBonuses.map(({ resource, bonus }) => (
            <span
              key={resource}
              className="flex items-center gap-1"
            >
              <Icon
                className="size-4"
                type={resource}
              />
              <span>{bonus}%</span>
            </span>
          ))}
        </div>
      )}
      {!isOccupied && (
        <Suspense fallback={<OasisTileModalAnimalsSkeleton />}>
          <OasisTileModalAnimals tile={tile} />
        </Suspense>
      )}
      {isOccupied && <TileModalPlayerInfo tile={tile} />}
    </DialogHeader>
  );
};

type FoundNewVillageActionProps = {
  tile: OccupiableTile;
};

const FoundNewVillageAction = ({ tile }: FoundNewVillageActionProps) => {
  const { t } = useTranslation();
  const { events } = useEvents();
  const tribe = useTribe();
  const { villageTroops } = useVillageTroops();
  const { currentVillage } = useCurrentVillage();

  const hasOngoingVillageFindEventOnThisTile = events.some((event) => {
    if (isFindNewVillageTroopMovementEvent(event)) {
      return (
        tile.coordinates.x === event.targetCoordinates.x &&
        tile.coordinates.y === event.targetCoordinates.y
      );
    }

    return false;
  });

  if (hasOngoingVillageFindEventOnThisTile) {
    return (
      <Text className="text-gray-500">
        {t('Settlers are already on route to this location')}
      </Text>
    );
  }

  const hasRallyPoint = currentVillage.buildingFields.some(
    ({ buildingId, level }) => {
      return buildingId === 'RALLY_POINT' && level > 0;
    },
  );

  if (!hasRallyPoint) {
    return (
      <Text className="text-gray-500">
        {t(
          'You need a Rally Point of level 1 or higher before you can found a new village',
        )}
      </Text>
    );
  }

  const settlerUnitId = getSettlerUnitIdByTribe(tribe);

  const hasAtLeast3Settlers = villageTroops.some(
    ({ unitId, amount, source }) => {
      return (
        unitId === settlerUnitId &&
        source === currentVillage.tileId &&
        amount >= 3
      );
    },
  );

  if (!hasAtLeast3Settlers) {
    return (
      <Text className="text-gray-500">
        {t('You need at least 3 settlers before you can found a new village')}
      </Text>
    );
  }

  return (
    <Text variant="link">
      <Link
        to={`../village/39?tab=send-troops&rally-point-send-troops-tab=found-new-village&x=${tile.coordinates.x}&y=${tile.coordinates.y}`}
      >
        {t('Found new village')}
      </Link>
    </Text>
  );
};

type OccupiableTileModalProps = {
  tile: OccupiableTile;
};

const OccupiableTileModal = ({ tile }: OccupiableTileModalProps) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Abandoned valley')}</DialogTitle>
        <TileModalLocation tile={tile} />
        <TileModalResources tile={tile} />
        <DialogDescription>
          {t(
            'You can establish a new village on this tile. To settle it, make sure you have 3 settlers and an unused expansion slot from one of your villages.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Text as="h3">{t('Actions')}</Text>
        <FoundNewVillageAction tile={tile} />
      </div>
    </>
  );
};

type OccupiedOccupiableTileModalProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileModal = ({
  tile,
}: OccupiedOccupiableTileModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { getVillageBasePath } = useGameNavigation();

  const { owner, ownerVillage } = tile;
  const { id: playerId } = owner;
  const { name: villageName, slug: villageSlug } = ownerVillage;

  const isOwnedByPlayer = playerId === PLAYER_ID;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{villageName}</DialogTitle>
        <TileModalLocation tile={tile} />
        <TileModalResources tile={tile} />
        <DialogDescription>
          {isOwnedByPlayer
            ? t('This is your village.')
            : t(
                'This village belongs to another player. You may trade with it or attack it. Beware though, attacking may provoke retaliation!',
              )}
        </DialogDescription>
      </DialogHeader>
      <TileModalPlayerInfo tile={tile} />
      <div className="flex flex-col gap-2">
        <Text as="h3">{t('Actions')}</Text>
        {!isOwnedByPlayer && <Text>{t('No actions available')}</Text>}
        {isOwnedByPlayer && tile.id !== currentVillage.id && (
          <Text variant="link">
            <Link to={`${getVillageBasePath(villageSlug!)}/resources`}>
              {t('Enter {{villageName}}', { villageName })}
            </Link>
          </Text>
        )}
      </div>
    </>
  );
};

export const TileDialog = ({
  tile,
  mapMarkers,
  createMapMarker,
  deleteMapMarker,
}: TileDialogProps) => {
  if (!tile) {
    return null;
  }

  if (isOasisTile(tile)) {
    return (
      <DialogContent>
        <TileModalMarkerAction
          createMapMarker={createMapMarker}
          deleteMapMarker={deleteMapMarker}
          mapMarkers={mapMarkers}
          tile={tile}
        />
        <OasisTileModal tile={tile} />
        <TileModalMarkerDescription
          mapMarkers={mapMarkers}
          tile={tile}
        />
      </DialogContent>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    return (
      <DialogContent>
        <TileModalMarkerAction
          createMapMarker={createMapMarker}
          deleteMapMarker={deleteMapMarker}
          mapMarkers={mapMarkers}
          tile={tile}
        />
        <OccupiedOccupiableTileModal tile={tile} />
        <TileModalMarkerDescription
          mapMarkers={mapMarkers}
          tile={tile}
        />
      </DialogContent>
    );
  }

  if (isOccupiableTile(tile)) {
    return (
      <DialogContent>
        <TileModalMarkerAction
          createMapMarker={createMapMarker}
          deleteMapMarker={deleteMapMarker}
          mapMarkers={mapMarkers}
          tile={tile}
        />
        <OccupiableTileModal tile={tile} />
        <TileModalMarkerDescription
          mapMarkers={mapMarkers}
          tile={tile}
        />
      </DialogContent>
    );
  }

  return null;
};
