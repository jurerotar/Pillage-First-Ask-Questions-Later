import { Icon } from 'app/components/icon';
import type React from 'react';

export const WheatFieldIcon: React.FC = () => {
  return (
    <Icon
      type="wheat"
      wrapperClassName="cell-icon"
      borderVariant="yellow"
      asCss
    />
  );
};
