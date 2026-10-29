import { clsx } from 'clsx';
import { Suspense, use, useEffect } from 'react';
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
import { getReportSubject } from 'app/(game)/(village-slug)/(reports)/utils/report-subject';
import { useMarketplaceMerchants } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-tabs/marketplace/hooks/use-marketplace-merchants';
import { Countdown } from 'app/(game)/(village-slug)/components/countdown';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useTileReports } from 'app/(game)/(village-slug)/hooks/use-tile-reports';
import { useTileTroopMovements } from 'app/(game)/(village-slug)/hooks/use-tile-troop-movements';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { useVillageTroopMovements } from 'app/(game)/(village-slug)/hooks/use-village-troop-movements';
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
import { Skeleton } from 'app/components/ui/skeleton';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from 'app/components/ui/toggle-group';
import { useIntl } from 'app/hooks/use-intl';
import { CookieContext } from 'app/providers/cookie-context';

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

type TileModalActionsProps = {
  onAttackOrRaid: (tile: OccupiedOccupiableTile | OasisTile) => void;
  onFoundNewVillage: (tile: OccupiableTile) => void;
  onReinforceVillage: (tile: OccupiedOccupiableTile | OasisTile) => void;
  onSendResources: (tile: OccupiedOccupiableTile) => void;
};

type TileModalMarkerProps = {
  mapMarkersByTileId: ReadonlyMap<MapMarker['tileId'], MapMarker>;
  createMapMarker: (args: {
    tileId: number;
    description: string;
    color: MapMarker['color'];
    icon: MapMarker['icon'];
  }) => void;
  deleteMapMarker: (args: { tileId: number }) => void;
};

type TileDialogProps = TileModalProps &
  TileModalMarkerProps &
  TileModalActionsProps;

type MapMarkerFormValues = {
  description: string;
  color: MapMarker['color'];
  icon: MapMarker['icon'];
};

const TileModalMarker = ({
  tile,
  mapMarkersByTileId,
  createMapMarker,
  deleteMapMarker,
}: TileModalProps & TileModalMarkerProps) => {
  const { t } = useTranslation();
  const marker = mapMarkersByTileId.get(tile.id);
  const form = useForm<MapMarkerFormValues>({
    defaultValues: {
      description: '',
      color: '#ffffff',
      icon: 'mapMarker',
    },
  });

  const color = form.watch('color');
  const icon = form.watch('icon');

  const iconOptions = [
    { icon: 'mapMarker', label: t('Flag') },
    { icon: 'mapMarkerAttack', label: t('Attack') },
    { icon: 'mapMarkerDefence', label: t('Defence') },
    { icon: 'mapMarkerSettlement', label: t('Settlement') },
    { icon: 'mapMarkerDanger', label: t('Danger') },
    { icon: 'mapMarkerTreasure', label: t('Treasure') },
  ] satisfies { icon: MapMarker['icon']; label: string }[];

  useEffect(() => {
    if (!marker) {
      form.reset();
      return;
    }

    form.reset(
      {
        description: marker.description,
        color: marker.color,
        icon: marker.icon,
      },
      { keepDefaultValues: true },
    );
  }, [form, marker]);

  const onSubmit = form.handleSubmit(({ description, color, icon }) => {
    createMapMarker({
      tileId: tile.id,
      description: description.trim(),
      color,
      icon,
    });
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={onSubmit}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">{t('Icon')}</legend>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={icon}
          aria-label={t('Icon')}
          className="flex-wrap"
          onValueChange={(value) => {
            const option = iconOptions.find((option) => option.icon === value);
            if (option) {
              form.setValue('icon', option.icon, { shouldDirty: true });
            }
          }}
        >
          {iconOptions.map((option) => (
            <ToggleGroupItem
              key={option.icon}
              value={option.icon}
              aria-label={option.label}
              data-tooltip-id="general-tooltip"
              data-tooltip-content={option.label}
            >
              <Icon
                type={option.icon}
                className="grayscale"
                shouldShowTooltip={false}
              />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </fieldset>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t('Color')}</span>
        <div className="flex flex-wrap gap-2">
          {mapMarkerColorPresets.map((markerColor) => (
            <button
              aria-pressed={color === markerColor}
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
      <div className="flex justify-end gap-2">
        <Button
          className="w-fit"
          type="submit"
        >
          {marker ? t('Update map marker') : t('Create map marker')}
        </Button>
        {marker && (
          <Button
            onClick={() => {
              deleteMapMarker({ tileId: tile.id });
            }}
            type="button"
            variant="destructive"
          >
            {t('Delete')}
          </Button>
        )}
      </div>
    </form>
  );
};

type TileModalMarkerDescriptionProps = {
  mapMarkersByTileId: ReadonlyMap<MapMarker['tileId'], MapMarker>;
  tile: Tile;
};

const TileModalMarkerDescription = ({
  mapMarkersByTileId,
  tile,
}: TileModalMarkerDescriptionProps) => {
  const marker = mapMarkersByTileId.get(tile.id);

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
          type={marker.icon}
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
        {t('Player')} -
        <Text
          className="ml-1"
          variant="link"
        >
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
  onAttackOrRaid: (tile: OasisTile) => void;
  onReinforceVillage: (tile: OasisTile) => void;
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

const OasisTileModal = ({
  tile,
  onAttackOrRaid: _onAttackOrRaid,
  onReinforceVillage,
}: OasisTileModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { oasisBonuses } = useOasisBonuses(tile.id);

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);
  const _canAttackOrRaid =
    isOccupiable && (!isOccupied || tile.owner.id !== PLAYER_ID);

  return (
    <DialogHeader>
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
      {isOccupied && tile.owner.id === PLAYER_ID && (
        <div className="flex flex-col gap-2">
          <Text as="h3">{t('Actions')}</Text>
          {tile.id !== currentVillage.tileId && (
            <Button
              variant="textLink"
              onClick={() => onReinforceVillage(tile)}
            >
              {t('Reinforce oasis')}
            </Button>
          )}
        </div>
      )}
      {/*{canAttackOrRaid && (*/}
      {/*  <div className="flex flex-col gap-2">*/}
      {/*    <Text as="h3">{t('Actions')}</Text>*/}
      {/*    <Button*/}
      {/*      variant="textLink"*/}
      {/*      onClick={() => onAttackOrRaid(tile)}*/}
      {/*    >*/}
      {/*      {t('Raid oasis')}*/}
      {/*    </Button>*/}
      {/*  </div>*/}
      {/*)}*/}
    </DialogHeader>
  );
};

type FoundNewVillageActionProps = {
  tile: OccupiableTile;
  onFoundNewVillage: (tile: OccupiableTile) => void;
};

const FoundNewVillageAction = ({
  tile,
  onFoundNewVillage,
}: FoundNewVillageActionProps) => {
  const { t } = useTranslation();
  const { troopMovements } = useVillageTroopMovements();
  const tribe = useTribe();
  const { villageTroops } = useVillageTroops();
  const { currentVillage } = useCurrentVillage();

  const hasOngoingVillageFindEventOnThisTile = troopMovements.some(
    (movement) =>
      movement.type === 'troopMovementFindNewVillage' &&
      movement.targetTileId === tile.id,
  );

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
    ({ unitId, amount, sourceTileId }) => {
      return (
        unitId === settlerUnitId &&
        sourceTileId === currentVillage.tileId &&
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
    <Button
      variant="textLink"
      onClick={() => onFoundNewVillage(tile)}
    >
      {t('Found new village')}
    </Button>
  );
};

type OccupiableTileModalProps = {
  tile: OccupiableTile;
} & Pick<TileModalActionsProps, 'onFoundNewVillage'>;

const OccupiableTileModal = ({
  tile,
  onFoundNewVillage,
}: OccupiableTileModalProps) => {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader>
        <TileModalResources tile={tile} />
        <DialogDescription>
          {t(
            'You can establish a new village on this tile. To settle it, make sure you have 3 settlers and an unused expansion slot from one of your villages.',
          )}
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Text as="h3">{t('Actions')}</Text>
        <FoundNewVillageAction
          tile={tile}
          onFoundNewVillage={onFoundNewVillage}
        />
      </div>
    </>
  );
};

type OccupiedOccupiableTileModalProps = {
  tile: OccupiedOccupiableTile;
} & Pick<
  TileModalActionsProps,
  'onAttackOrRaid' | 'onReinforceVillage' | 'onSendResources'
>;

type SendResourcesActionProps = {
  tile: OccupiedOccupiableTile;
  onSendResources: (tile: OccupiedOccupiableTile) => void;
};

const SendResourcesAction = ({
  tile,
  onSendResources,
}: SendResourcesActionProps) => {
  const { t } = useTranslation();
  const { marketplaceLevel, availableMerchantAmount } =
    useMarketplaceMerchants();

  if (marketplaceLevel <= 0) {
    return (
      <Text className="text-gray-500">
        {t(
          'You need a Marketplace of level 1 or higher before you can send resources',
        )}
      </Text>
    );
  }

  if (availableMerchantAmount <= 0) {
    return (
      <Text className="text-gray-500">
        {t('You need at least 1 free merchant before you can send resources')}
      </Text>
    );
  }

  return (
    <Button
      variant="textLink"
      onClick={() => onSendResources(tile)}
    >
      {t('Send resources')}
    </Button>
  );
};

const OccupiedOccupiableTileModal = ({
  tile,
  onAttackOrRaid: _onAttackOrRaid,
  onReinforceVillage,
  onSendResources,
}: OccupiedOccupiableTileModalProps) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const { getVillageBasePath } = useGameNavigation();

  const { owner, ownerVillage } = tile;
  const { id: playerId } = owner;
  const { slug: villageSlug } = ownerVillage;

  const isOwnedByPlayer = playerId === PLAYER_ID;
  const isNpcVillage = owner.faction !== 'player';

  return (
    <>
      <DialogHeader>
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
        {/*{!isOwnedByPlayer && (*/}
        {/*  <Button*/}
        {/*    variant="textLink"*/}
        {/*    onClick={() => onAttackOrRaid(tile)}*/}
        {/*  >*/}
        {/*    {t('Attack or raid')}*/}
        {/*  </Button>*/}
        {/*)}*/}
        {!isOwnedByPlayer && isNpcVillage && (
          <Text className="text-gray-500">
            {t('Attacking and raiding is still in development')}
          </Text>
        )}
        {isOwnedByPlayer && (
          <Text variant="link">
            <Link to={`${getVillageBasePath(villageSlug!)}/resources`}>
              {t('Enter village')}
            </Link>
          </Text>
        )}
        {isOwnedByPlayer && tile.id !== currentVillage.tileId && (
          <Button
            variant="textLink"
            onClick={() => onReinforceVillage(tile)}
          >
            {t('Reinforce village')}
          </Button>
        )}
        {isOwnedByPlayer && tile.id !== currentVillage.tileId && (
          <SendResourcesAction
            tile={tile}
            onSendResources={onSendResources}
          />
        )}
      </div>
    </>
  );
};

const TileModalMovements = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const intl = useIntl();
  const { troopMovements: movements } = useTileTroopMovements(tile.id);

  const labels = {
    troopMovementReinforcements: t('Reinforcements'),
    troopMovementRelocation: t('Troop relocation'),
    troopMovementReturn: t('Returning troops'),
    troopMovementFindNewVillage: t('Settlers'),
    troopMovementAttack: t('Attack'),
    troopMovementRaid: t('Raid'),
    troopMovementOasisOccupation: t('Oasis occupation'),
  };

  if (movements.length === 0) {
    return <Text>{t('No troop movements involving this tile.')}</Text>;
  }

  return (
    <ul className="flex max-h-[min(20rem,50dvh)] flex-col divide-y divide-border overflow-y-auto overscroll-contain">
      {movements.map((movement) => {
        const isIncoming = movement.targetTileId === tile.id;
        const isOffensive =
          movement.type === 'troopMovementAttack' ||
          movement.type === 'troopMovementRaid' ||
          movement.type === 'troopMovementOasisOccupation';
        const icon =
          movement.type === 'troopMovementFindNewVillage'
            ? 'findNewVillage'
            : isOffensive
              ? isIncoming
                ? 'offensiveMovementIncoming'
                : 'offensiveMovementOutgoing'
              : isIncoming
                ? 'deploymentIncoming'
                : 'deploymentOutgoing';

        return (
          <li
            key={movement.id}
            className="flex shrink-0 items-center gap-2 py-2 text-sm"
          >
            <Icon
              type={icon}
              className="size-4 shrink-0"
              shouldShowTooltip={false}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Text className="font-medium">{labels[movement.type]}</Text>
              <Text className="text-muted-foreground">
                {movement.originName} ({movement.originCoordinates.x}|
                {movement.originCoordinates.y}){' → '}
                {movement.targetName} ({movement.targetCoordinates.x}|
                {movement.targetCoordinates.y})
              </Text>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums">
                <span>
                  {t('Arrives in')} <Countdown endsAt={movement.resolvesAt} />
                </span>
                <time
                  dateTime={new Date(movement.resolvesAt).toISOString()}
                  className="text-muted-foreground"
                >
                  {intl.dateTime.format(movement.resolvesAt)}
                </time>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const TileModalReports = ({ tile }: TileModalProps) => {
  const { t } = useTranslation();
  const { locale } = use(CookieContext);
  const { reports: tileReports } = useTileReports(tile.id);

  if (tileReports.length === 0) {
    return <Text>{t('No reports found yet.')}</Text>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {tileReports.map((report) => (
        <li key={report.id}>
          <Link
            className="flex gap-2 py-2 text-sm hover:bg-accent"
            to={`../reports/${report.id}`}
          >
            <Icon
              className="size-4 shrink-0"
              type={report.outcome}
            />
            <span className="flex min-w-0 flex-col gap-1">
              <Text variant="link">{getReportSubject(report, t)}</Text>
              <time
                className="text-xs text-muted-foreground"
                dateTime={new Date(report.timestamp).toISOString()}
              >
                {new Date(report.timestamp).toLocaleString(locale, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </time>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export const TileDialog = ({
  tile,
  mapMarkersByTileId,
  createMapMarker,
  deleteMapMarker,
  onAttackOrRaid,
  onFoundNewVillage,
  onReinforceVillage,
  onSendResources,
}: TileDialogProps) => {
  const { t } = useTranslation();
  if (!tile || (!isOasisTile(tile) && !isOccupiableTile(tile))) {
    return null;
  }
  const hasReports =
    isOccupiedOccupiableTile(tile) || isOccupiableOasisTile(tile);
  const title = (() => {
    if (isOasisTile(tile)) {
      if (!isOccupiableOasisTile(tile)) {
        return t('Wilderness');
      }
      return isOccupiedOasisTile(tile)
        ? t('Occupied oasis')
        : t('Unoccupied oasis');
    }
    return isOccupiedOccupiableTile(tile)
      ? tile.ownerVillage.name
      : t('Abandoned valley');
  })();
  return (
    <DialogContent aria-describedby={undefined}>
      <DialogHeader className="pr-6">
        <DialogTitle>{title}</DialogTitle>
        <TileModalLocation tile={tile} />
      </DialogHeader>
      <Tabs
        key={tile.id}
        defaultValue="general"
        className="min-w-0"
      >
        <TabList aria-label={t('Tile information')}>
          <Tab value="general">{t('General')}</Tab>
          <Tab value="marker">{t('Map marker')}</Tab>
          <Tab value="movements">{t('Movements')}</Tab>
          {hasReports && <Tab value="reports">{t('Reports')}</Tab>}
        </TabList>
        <TabPanel
          value="general"
          className="flex flex-col gap-4 border-0 p-0 pt-2"
        >
          {isOasisTile(tile) ? (
            <OasisTileModal
              tile={tile}
              onAttackOrRaid={onAttackOrRaid}
              onReinforceVillage={onReinforceVillage}
            />
          ) : isOccupiedOccupiableTile(tile) ? (
            <OccupiedOccupiableTileModal
              tile={tile}
              onAttackOrRaid={onAttackOrRaid}
              onReinforceVillage={onReinforceVillage}
              onSendResources={onSendResources}
            />
          ) : (
            <OccupiableTileModal
              tile={tile}
              onFoundNewVillage={onFoundNewVillage}
            />
          )}
          <TileModalMarkerDescription
            mapMarkersByTileId={mapMarkersByTileId}
            tile={tile}
          />
        </TabPanel>
        <TabPanel
          value="marker"
          className="border-0 p-0 pt-2"
        >
          <TileModalMarker
            createMapMarker={createMapMarker}
            deleteMapMarker={deleteMapMarker}
            mapMarkersByTileId={mapMarkersByTileId}
            tile={tile}
          />
        </TabPanel>
        <TabPanel
          value="movements"
          className="border-0 p-0 pt-2"
        >
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <TileModalMovements tile={tile} />
          </Suspense>
        </TabPanel>
        {hasReports && (
          <TabPanel
            value="reports"
            className="border-0 p-0 pt-2"
          >
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <TileModalReports tile={tile} />
            </Suspense>
          </TabPanel>
        )}
      </Tabs>
    </DialogContent>
  );
};
