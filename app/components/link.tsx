import type React from 'react';
import { Link as ReactRouterLink, type LinkProps, useNavigation } from 'react-router';

export const Link: React.FC<LinkProps> = (props) => {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  return (
    <ReactRouterLink
      {...props}
      onClick={(event) => {
        if (isNavigating) {
          // Prevent double-click sending users to an incorrect url
          event.preventDefault();
        }
      }}
    />
  );
};
