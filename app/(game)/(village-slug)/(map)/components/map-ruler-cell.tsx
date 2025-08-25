import { use } from 'react';
import type { CellComponentProps } from 'react-window';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';

export type MapRulerCellProps = {
  layout: 'vertical' | 'horizontal';
};

export const MapRulerCell = ({
  style,
  layout,
  columnIndex,
  rowIndex,
}: CellComponentProps<MapRulerCellProps>) => {
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
