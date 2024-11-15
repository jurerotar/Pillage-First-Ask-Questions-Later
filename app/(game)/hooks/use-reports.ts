import { useQuery } from '@tanstack/react-query';
import type { MissingIconType, ReportIconType } from 'app/components/icon';
import type { Report, ReportTag } from 'app/interfaces/models/game/report';
import type { Tile } from 'app/interfaces/models/game/tile';
import { reportsCacheKey } from 'app/query-keys';

type _ReportMark = ReportTag | `un${ReportTag}`;

// TODO: Finish this
export const getReportIconType = ({ type, status }: Report): ReportIconType | MissingIconType => {
  let iconType: ReportIconType | MissingIconType;

  switch (true) {
    case type === 'attack' && status === 'no-loss': {
      iconType = 'attackerNoLoss';
      break;
    }
    case type === 'attack' && status === 'some-loss': {
      iconType = 'attackerSomeLoss';
      break;
    }
    case type === 'attack' && status === 'full-loss': {
      iconType = 'attackerFullLoss';
      break;
    }
    case type === 'defence' && status === 'no-loss': {
      iconType = 'defenderNoLoss';
      break;
    }
    case type === 'defence' && status === 'some-loss': {
      iconType = 'defenderSomeLoss';
      break;
    }
    case type === 'defence' && status === 'full-loss': {
      iconType = 'defenderFullLoss';
      break;
    }
    default: {
      iconType = 'missingIcon';
    }
  }

  return iconType;
};

export const useReports = () => {
  const { data: reports } = useQuery<Report[]>({
    queryKey: [reportsCacheKey],
    initialData: [],
  });

  const readReports = reports.filter(({ tags }) => tags.includes('read'));
  const deletedReports = reports.filter(({ tags }) => tags.includes('deleted'));
  const archivedReports = reports.filter(({ tags }) => tags.includes('archived'));

  const getReportsByTileId = (tileIdToSearchBy: Tile['id']): Report[] => {
    return reports.filter(({ tileId }) => tileId === tileIdToSearchBy);
  };

  return {
    reports,
    archivedReports,
    deletedReports,
    readReports,
    getReportsByTileId,
  };
};
