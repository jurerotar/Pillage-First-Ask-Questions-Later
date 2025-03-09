import { Link, type LinkProps, useLocation } from 'react-router';
import type React from 'react';

export const LinkWithState: React.FCWithChildren<LinkProps> = (props) => {
  const { pathname } = useLocation();

  return (
    <Link
      {...props}
      state={{
        previousLocationPathname: pathname,
      }}
    />
  );
};
