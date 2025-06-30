import { Icon } from 'app/components/icon';
import type React from 'react';

type WheatFieldIconProps = Omit<React.ComponentProps<typeof Icon>, 'type'>;

export const WheatFieldIcon: React.FC<WheatFieldIconProps> = ({
  className,
}) => {
  return (
    <Icon
      type="wheat"
      wrapperClassName={className}
      borderVariant="yellow"
    />
  );
};
