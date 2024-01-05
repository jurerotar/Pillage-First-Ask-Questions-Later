import React from 'react';
import { ListChildComponentProps } from 'react-window';
import clsx from 'clsx';
import { useMapOptions } from '../providers/map-context';

type MapRulerCellProps = {
  layout: 'vertical' | 'horizontal';
}

export const MapRulerCell: React.FC<ListChildComponentProps<MapRulerCellProps>> = ({ index, style, data: { layout} }) => {
  const { gridSize } = useMapOptions();
  const modifier = ((gridSize - 1) / 2) + 1;

  const cellIndex = layout === 'vertical' ? gridSize - index - modifier : -gridSize + index + modifier

  return (
    <span
      className={clsx(layout === 'vertical' ? 'border-y' : 'border-x', 'flex items-center justify-center border-gray-400 text-xs')}
      style={style}
    >
      {cellIndex}
    </span>
  );
};
