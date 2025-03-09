import { useQuery } from '@tanstack/react-query';
import type { Report, ReportTag } from 'app/interfaces/models/game/report';
import type { Tile } from 'app/interfaces/models/game/tile';
import { reportsCacheKey } from 'app/(game)/constants/query-keys';
import type { MissingIconType, ReportIconType } from 'app/components/icons/icon-maps';

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

  const getReportsByTileId = (tileIdToSearchBy: Tile['id']): Report[] => {
    return reports.filter(({ tileId }) => tileId === tileIdToSearchBy);
  };

  return {
    reports,
    getReportsByTileId,
  };
};
