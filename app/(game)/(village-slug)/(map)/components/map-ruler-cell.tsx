import type React from 'react';
import { use } from 'react';
import type { ListChildComponentProps } from 'react-window';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';

type MapRulerCellProps = {
  layout: 'vertical' | 'horizontal';
};

export const MapRulerCell: React.FC<ListChildComponentProps<MapRulerCellProps>> = ({ index, style, data: { layout } }) => {
  const { gridSize } = use(MapContext);

  const modifier = (gridSize - 1) / 2 + 1;

  const cellIndex = layout === 'vertical' ? gridSize - index - modifier : -gridSize + index + modifier;

  return (
    <span
      className="flex items-center justify-center text-xs font-medium text-black"
      style={style}
    >
      {cellIndex}
    </span>
  );
};
