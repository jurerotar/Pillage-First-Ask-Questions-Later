import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getSettlerUnitIdByTribe } from '@pillage-first/game-assets/utils/units';
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
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { useReputations } from 'app/(game)/(village-slug)/hooks/use-reputations';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe.ts';
import { useVillageTroops } from 'app/(game)/(village-slug)/hooks/use-village-troops';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';

type TileModalResourcesProps = {
  tile: OccupiableTile;
};

const TileModalResources = ({ tile }: TileModalResourcesProps) => {
  const resources = parseResourcesFromRFC(
    tile.attributes.resourceFieldComposition,
  );

  return (
    <div className="flex justify-start text-sm">
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

  const { tribe, name, faction } = tile.owner!;
  const { population } = tile.ownerVillage!;

  return (
    <div className="flex flex-col gap-2">
      <span>
        {t('Player')} - {name}
      </span>
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
              <span>{bonus}</span>
            </span>
          ))}
        </div>
      )}
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
          'You need to build a rally point before you can found a new village',
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
  const navigate = useNavigate();
  const { currentVillage } = useCurrentVillage();
  const { getNewVillageUrl } = useGameNavigation();

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
          <Button
            size="fit"
            variant="link"
            onClick={() => navigate(getNewVillageUrl(villageSlug!))}
          >
            {t('Enter village')}
          </Button>
        )}
      </div>
    </>
  );
};

export const TileDialog = ({ tile }: TileModalProps) => {
  if (!tile) {
    return null;
  }

  if (isOasisTile(tile)) {
    return (
      <DialogContent>
        <OasisTileModal tile={tile} />
      </DialogContent>
    );
  }

  if (isOccupiedOccupiableTile(tile)) {
    return (
      <DialogContent>
        <OccupiedOccupiableTileModal tile={tile} />
      </DialogContent>
    );
  }

  if (isOccupiableTile(tile)) {
    return (
      <DialogContent>
        <OccupiableTileModal tile={tile} />
      </DialogContent>
    );
  }

  return null;
};
