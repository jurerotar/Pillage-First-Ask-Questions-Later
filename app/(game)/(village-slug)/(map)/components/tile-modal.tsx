import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useTilePlayer } from 'app/(game)/(village-slug)/(map)/components/hooks/use-tile-player';
import { isPlayerVillage } from 'app/(game)/(village-slug)/(map)/guards/village-guard';
import { Resources } from 'app/(game)/(village-slug)/components/resources';
import { playerTroopsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { useCreateEvent } from 'app/(game)/(village-slug)/hooks/use-create-event';
import { useEvents } from 'app/(game)/(village-slug)/hooks/use-events';
import { usePlayerTroops } from 'app/(game)/(village-slug)/hooks/use-player-troops';
import { useVillages } from 'app/(game)/(village-slug)/hooks/use-villages';
import {
  isOasisTile,
  isOccupiableOasisTile,
  isOccupiableTile,
  isOccupiedOasisTile,
  isOccupiedOccupiableTile,
} from 'app/(game)/(village-slug)/utils/guards/map-guards';
import { isFindNewVillageTroopMovementEvent } from 'app/(game)/guards/event-guards';
import { Icon } from 'app/components/icon';
import { Text } from 'app/components/text';
import { Button } from 'app/components/ui/button';
import {
  type Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'app/components/ui/dialog';
import { PLAYER_ID } from 'app/constants/player';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiableTile,
  OccupiedOccupiableTile,
  Tile,
} from 'app/interfaces/models/game/tile';
import {
  calculateDistanceBetweenPoints,
  roundToNDecimalPoints,
} from 'app/utils/common';
import { parseRFCFromTile } from 'app/utils/map';

type TileModalResourcesProps = {
  tile: OccupiableTile;
};

const TileModalResources = ({ tile }: TileModalResourcesProps) => {
  const resources = parseRFCFromTile(tile.RFC);
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
  const { player, reputation, population } = useTilePlayer(tile.id);

  const { name, tribe } = player;
  const { faction, reputationLevel } = reputation;

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
            {t(`REPUTATIONS.${reputationLevel.toUpperCase()}`)}
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
  const { getVillageByOasis } = useVillages();

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);
  const title = (() => {
    if (!isOccupiable) {
      return t('Wilderness');
    }
    return isOccupied ? t('Occupied oasis') : t('Unoccupied oasis');
  })();

  const occupiedByVillage =
    isOccupiable && isOccupied ? getVillageByOasis(tile) : null;
  const ownedBy = occupiedByVillage?.playerId;

  return (
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <TileModalLocation tile={tile} />
      {isOccupiable && (
        <div className="flex justify-start gap-2 items-center">
          {tile.ORB.map(({ resource, bonus }: OasisResourceBonus) => (
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
                {ownedBy === PLAYER_ID &&
                  t(
                    'This oasis is occupied by you and is producing resources for village {{villageName}}.',
                    {
                      villageName: occupiedByVillage!.name,
                    },
                  )}
                {ownedBy !== PLAYER_ID &&
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

type OccupiableTileModalProps = {
  tile: OccupiableTile;
};

const OccupiableTileModal = ({ tile }: OccupiableTileModalProps) => {
  const { t } = useTranslation();
  const { events } = useEvents();

  const hasOngoingVillageFindEventOnThisTile = events.some((event) => {
    if (isFindNewVillageTroopMovementEvent(event)) {
      return tile.id === event.targetId;
    }

    return false;
  });

  const { createEvent: createFindNewVillageEvent } =
    useCreateEvent('troopMovement');

  const onFoundNewVillage = () => {
    createFindNewVillageEvent({
      movementType: 'find-new-village',
      targetId: tile.id,
      troops: [],
      cachesToClearImmediately: [playerTroopsCacheKey],
    });
  };

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
        <Text>{t('No actions available')}</Text>
        {hasOngoingVillageFindEventOnThisTile && (
          <span className="text-gray-500">
            {t('Settlers are already on route to this location')}
          </span>
        )}
        {false && (
          <Button
            size="fit"
            variant="link"
            onClick={onFoundNewVillage}
          >
            Found new village
          </Button>
        )}
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
  const { getVillageByCoordinates } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { getNewVillageUrl } = useGameNavigation();
  const { playerTroops, sendTroops } = usePlayerTroops();

  const currentVillageMovableTroops = playerTroops.filter(
    ({ tileId, source }) =>
      tileId === currentVillage.id && source === currentVillage.id,
  );

  const isHeroInCurrentVillage = currentVillageMovableTroops.some(
    ({ unitId }) => unitId === 'HERO',
  );

  const village = getVillageByCoordinates(tile.coordinates)!;
  const isOwnedByPlayer = isPlayerVillage(village);

  const onSendHero = () => {
    sendTroops({
      targetId: tile.id,
      movementType: 'relocation',
      troops: [
        {
          unitId: 'HERO',
          amount: 1,
          tileId: currentVillage.id,
          source: currentVillage.id,
        },
      ],
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{village.name}</DialogTitle>
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
          <>
            <Button
              size="fit"
              variant="link"
              onClick={() => navigate(getNewVillageUrl(village.slug))}
            >
              Enter village
            </Button>
            {isHeroInCurrentVillage && (
              <Button
                size="fit"
                variant="link"
                onClick={onSendHero}
              >
                Send hero
              </Button>
            )}
          </>
        )}
      </div>
    </>
  );
};

type TileDialogProps = ComponentProps<typeof Dialog> & {
  tile: Tile | null;
};

export const TileDialog = ({ tile }: TileDialogProps) => {
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
