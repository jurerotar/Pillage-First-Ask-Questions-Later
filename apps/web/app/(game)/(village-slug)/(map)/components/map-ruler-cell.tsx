import { use } from 'react';
import type { CellComponentProps, RowComponentProps } from 'react-window';
import { MapContext } from 'app/(game)/(village-slug)/(map)/providers/map-context';

type MapRulerCellProps = {
  layout: 'vertical' | 'horizontal';
};

export const MapRulerCell = ({
  ariaAttributes,
  index,
  style,
  layout,
}: RowComponentProps<MapRulerCellProps>) => {
  return (
    <MapRulerCellContents
      ariaAttributes={ariaAttributes}
      index={index}
      layout={layout}
      style={style}
    />
  );
};

export const MapRulerGridCell = ({
  ariaAttributes,
  columnIndex,
  style,
  layout,
}: CellComponentProps<MapRulerCellProps>) => {
  return (
    <MapRulerCellContents
      ariaAttributes={ariaAttributes}
      index={columnIndex}
      layout={layout}
      style={style}
    />
  );
};

type MapRulerCellContentsProps = {
  ariaAttributes:
    | RowComponentProps['ariaAttributes']
    | CellComponentProps['ariaAttributes'];
  index: number;
  layout: MapRulerCellProps['layout'];
  style: RowComponentProps['style'];
};

const MapRulerCellContents = ({
  ariaAttributes,
  index,
  layout,
  style,
}: MapRulerCellContentsProps) => {
  const { gridSize } = use(MapContext);

  const modifier = (gridSize - 1) / 2 + 1;

  const cellIndex =
    layout === 'vertical'
      ? gridSize - index - modifier
      : -gridSize + index + modifier;

  return (
    <span
      {...ariaAttributes}
      className="flex items-center justify-center text-xs font-medium text-black"
      style={style}
    >
      {cellIndex}
    </span>
  );
};
