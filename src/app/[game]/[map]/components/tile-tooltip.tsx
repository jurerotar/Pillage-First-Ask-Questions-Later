import React from 'react';
import { OasisResourceBonus, OasisTile, OccupiableTile, OccupiedOccupiableTile, Tile } from 'interfaces/models/game/tile';
import { useTranslation } from 'react-i18next';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { usePlayers } from 'app/[game]/hooks/use-players';
import { useReputations } from 'app/[game]/hooks/use-reputations';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { Icon } from 'app/components/icon';
import { factionTranslationMap, reputationLevelTranslationMap, resourceTranslationMap, tribeTranslationMap } from 'app/utils/translations';
import { getReportIconType, useReports } from 'app/[game]/hooks/use-reports';

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

const TileTooltipReports: React.FC<TileTooltipProps> = ({ tile }) => {
  const { getReportsByTileId } = useReports();

  const last3reports = getReportsByTileId(tile.tileId).filter((_, index) => index < 3);

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

type OasisTileTooltipProps = {
  tile: OasisTile;
};

const OasisTileTooltip: React.FC<OasisTileTooltipProps> = ({ tile }) => {
  const { t } = useTranslation();

  const isOccupiable = tile.oasisResourceBonus.length > 0;
  const isOccupied = Object.hasOwn(tile, 'villageId');
  const title = (() => {
    if (!isOccupiable) {
      return 'APP.GAME.MAP.OASIS_TILE.WILDERNESS';
    }
    return isOccupied ? 'APP.GAME.MAP.OASIS_TILE.OCCUPIED_OASIS' : 'APP.GAME.MAP.OASIS_TILE.UNOCCUPIED_OASIS';
  })();

  return (
    <>
      <span className="font-semibold">{t(title)}</span>
      <TileTooltipLocation tile={tile} />
      {isOccupiable &&
        tile.oasisResourceBonus.map(({ resource, bonus }: OasisResourceBonus) => (
          <span
            key={resource}
            className="flex gap-1"
          >
            <Icon type={resource} />
            <span>
              {t(resourceTranslationMap.get(resource)!)} - {bonus}
            </span>
          </span>
        ))}
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
  const { t } = useTranslation();
  const { getPlayerByPlayerId } = usePlayers();
  const { getReputationByFaction } = useReputations();
  const { getVillageByCoordinates } = useVillages();

  const village = getVillageByCoordinates(tile.coordinates)!;
  const title = village.name;
  const { faction, tribe, name } = getPlayerByPlayerId(tile.ownedBy);
  const { reputationLevel } = getReputationByFaction(faction);

  return (
    <>
      <span className="font-semibold">{title}</span>
      <TileTooltipLocation tile={tile} />
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
      <TileTooltipReports tile={tile} />
    </>
  );
};

export const TileTooltip: React.FC<TileTooltipProps> = ({ tile }) => {
  const isOasis = tile.type === 'oasis-tile';
  const isOccupiableTile = tile.type === 'free-tile';
  const isOccupiedOccupiableTile = isOccupiableTile && Object.hasOwn(tile, 'ownedBy');

  return (
    <div className="flex flex-col gap-1">
      {isOasis && <OasisTileTooltip tile={tile} />}
      {!isOasis && (
        <>
          {isOccupiedOccupiableTile && <OccupiedOccupiableTileTooltip tile={tile as OccupiedOccupiableTile} />}
          {!isOccupiedOccupiableTile && <OccupiableTileTooltip tile={tile} />}
        </>
      )}
    </div>
  );
};
