import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { getReportIconType, useReports } from 'app/[game]/hooks/use-reports';
import { useReputations } from 'app/[game]/hooks/use-reputations';
import { useTroops } from 'app/[game]/hooks/use-troops';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { calculatePopulationFromBuildingFields } from 'app/[game]/utils/building';
import { isOasisTile, isOccupiableOasisTile, isOccupiedOasisTile, isOccupiedOccupiableTile } from 'app/[game]/utils/guards/map-guards';
import { Icon, unitIdToUnitIconMapper } from 'app/components/icon';
import { factionTranslationMap, reputationLevelTranslationMap, resourceTranslationMap, tribeTranslationMap } from 'app/utils/translations';
import type {
  OasisResourceBonus,
  OasisTile,
  OccupiableOasisTile,
  OccupiableTile,
  OccupiedOasisTile,
  OccupiedOccupiableTile,
  Tile,
} from 'interfaces/models/game/tile';
import type React from 'react';
import { useTranslation } from 'react-i18next';

type TileTooltipProps = {
  tile: Tile;
};

const TileTooltipLocation: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { distanceFromCurrentVillage } = useCurrentVillage();
  const distance = distanceFromCurrentVillage(tile.coordinates);

  return (
    <span className="text-xs text-gray-300">
      ({tile.coordinates.x}|{tile.coordinates.y}) - {t('GENERAL.FIELD', { count: distance })}
    </span>
  );
};

const TileTooltipPlayerInfo: React.FC<TileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();
  const { getVillageByOasis, getVillageByCoordinates } = useVillages();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();

  const { playerId, buildingFields, buildingFieldsPresets } =
    tile.type === 'oasis-tile' ? getVillageByOasis(tile as OccupiedOasisTile)! : getVillageByCoordinates(tile.coordinates)!;
  const { faction, tribe, name } = getPlayerByPlayerId(playerId);
  const { reputationLevel } = getReputationByFaction(faction);
  const population = calculatePopulationFromBuildingFields(buildingFields, buildingFieldsPresets);

  return (
    <>
      <span>
        {t('GENERAL.PLAYER')} - {name}
      </span>
      {faction !== 'player' && (
        <>
          <span>
            {t('GENERAL.FACTION')} - {t(factionTranslationMap.get(faction)!)}
          </span>
          <span>
            {t('GENERAL.REPUTATION_LEVEL')} - {t(reputationLevelTranslationMap.get(reputationLevel)!)}
          </span>
        </>
      )}
      <span>
        {t('GENERAL.TRIBE')} - {t(tribeTranslationMap.get(tribe)!)}
      </span>
      <span>
        {t('GENERAL.POPULATION')} - {population}
      </span>
    </>
  );
};

const TileTooltipReports: React.FC<TileTooltipProps> = ({ tile }) => {
  const { getReportsByTileId } = useReports();

  const last3reports = getReportsByTileId(tile.id).filter((_, index) => index < 3);

  if (last3reports.length === 0) {
    return null;
  }

  // TODO: Style this
  return (
    <>
      {last3reports.map((report) => (
        <span
          key={report.id}
          className="flex gap-1"
        >
          <Icon type={getReportIconType(report)} />
          report
        </span>
      ))}
    </>
  );
};

type TileTooltipAnimalsProps = {
  tile: OccupiableOasisTile;
};

const TileTooltipAnimals: React.FC<TileTooltipAnimalsProps> = ({ tile }) => {
  const { getTroopsByTileId } = useTroops();
  const troops = getTroopsByTileId(tile.id);

  if (troops.length === 0) {
    return null;
  }

  return (
    <>
      {troops.map(({ unitId, amount }) => (
        <span
          key={unitId}
          className="flex gap-1"
        >
          <Icon type={unitIdToUnitIconMapper(unitId)} />
          {amount}
        </span>
      ))}
    </>
  );
};

type OasisTileTooltipProps = {
  tile: OasisTile;
};

const OasisTileTooltip: React.FC<OasisTileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();

  const isOccupiable = isOccupiableOasisTile(tile);
  const isOccupied = isOccupiedOasisTile(tile);
  const title = (() => {
    if (!isOccupiable) {
      return 'APP.GAME.MAP.OASIS_TILE.WILDERNESS';
    }
    return isOccupied ? 'APP.GAME.MAP.OASIS_TILE.OCCUPIED_OASIS' : 'APP.GAME.MAP.OASIS_TILE.UNOCCUPIED_OASIS';
  })();

  // Wilderness
  if (!isOccupiable) {
    return (
      <>
        <span className="font-semibold">{t(title)}</span>
        <TileTooltipLocation tile={tile} />
      </>
    );
  }

  return (
    <>
      <span className="font-semibold">{t(title)}</span>
      <TileTooltipLocation tile={tile} />
      {tile.oasisResourceBonus.map(({ resource, bonus }: OasisResourceBonus) => (
        <span
          key={resource}
          className="flex gap-1"
        >
          <Icon
            className="size-4"
            type={resource}
          />
          <span>
            {t(resourceTranslationMap.get(resource)!)} - {bonus}
          </span>
        </span>
      ))}
      {isOccupied && <TileTooltipPlayerInfo tile={tile} />}
      {!isOccupied && <TileTooltipAnimals tile={tile} />}
      <TileTooltipReports tile={tile} />
    </>
  );
};

type OccupiableTileTooltipProps = {
  tile: OccupiableTile;
};

const OccupiableTileTooltip: React.FC<OccupiableTileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();

  const [wood, clay, iron, ...wheat] = tile.resourceFieldComposition.split('');
  const readableResourceComposition = `${wood}-${clay}-${iron}-${wheat.join('')}`;
  const title = `${t('APP.GAME.MAP.OCCUPIABLE_TILE.UNOCCUPIED_TILE')} ${readableResourceComposition}`;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
    </>
  );
};

type OccupiedOccupiableTileTooltipProps = {
  tile: OccupiedOccupiableTile;
};

const OccupiedOccupiableTileTooltip: React.FC<OccupiedOccupiableTileTooltipProps> = ({ tile }) => {
  const { getVillageByCoordinates } = useVillages();

  const village = getVillageByCoordinates(tile.coordinates)!;
  const title = village.name;

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
      <TileTooltipPlayerInfo tile={tile} />
      <TileTooltipReports tile={tile} />
    </>
  );
};

export const TileTooltip: React.FC<TileTooltipProps> = ({ tile }) => {
  const isOasisCell = isOasisTile(tile);
  const isOccupiedOccupiableCell = isOccupiedOccupiableTile(tile);

  return (
    <div className="flex flex-col gap-1">
      {isOasisCell && <OasisTileTooltip tile={tile as OasisTile} />}
      {!isOasisCell && (
        <>
          {isOccupiedOccupiableCell && <OccupiedOccupiableTileTooltip tile={tile as OccupiedOccupiableTile} />}
          {!isOccupiedOccupiableCell && <OccupiableTileTooltip tile={tile as OccupiableTile} />}
        </>
      )}
    </div>
  );
};
