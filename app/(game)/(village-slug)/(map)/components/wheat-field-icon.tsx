import { Icon } from 'app/components/icon';
import type React from 'react';

export const WheatFieldIcon: React.FC = () => {
  return (
    <Icon
      className="select-none size-3"
      type="wheat"
      borderVariant="yellow"
      wrapperClassName="absolute top-1 right-1 z-10"
      asCss
    />
  );
};
