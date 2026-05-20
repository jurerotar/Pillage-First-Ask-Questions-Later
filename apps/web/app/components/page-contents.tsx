import type { PropsWithChildren } from 'react';

export const PageContents = ({ children }: PropsWithChildren) => {
  return <div className="contents">{children}</div>;
};
