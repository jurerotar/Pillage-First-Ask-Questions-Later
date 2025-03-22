import { Icon } from 'app/components/icon';
import type React from 'react';

export const WheatFieldIcon: React.FC = () => {
  return (
    <Icon
      className="select-none size-3"
      type="wheat"
      borderVariant="yellow"
      wrapperClassName="absolute top-0 right-0 z-10"
      asCss
    />
  );
};
