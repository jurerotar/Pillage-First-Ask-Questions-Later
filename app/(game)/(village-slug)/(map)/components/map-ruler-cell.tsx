import type React from 'react';
import { use } from 'react';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';
import type { CellComponentProps } from 'react-window';

type MapRulerCellProps = CellComponentProps & {
  layout: 'vertical' | 'horizontal';
};

export const MapRulerCell = ({
  style,
  layout,
  rowIndex,
  columnIndex,
}: MapRulerCellProps): React.ReactNode => {
  const { gridSize } = use(MapContext);

  const index = layout === 'vertical' ? rowIndex : columnIndex;

  const modifier = (gridSize - 1) / 2 + 1;

  const cellIndex =
    layout === 'vertical'
      ? gridSize - index - modifier
      : -gridSize + index + modifier;

  return (
    <span
      className="flex items-center justify-center text-xs font-medium text-black"
      style={style}
    >
      {cellIndex}
    </span>
  );
};
