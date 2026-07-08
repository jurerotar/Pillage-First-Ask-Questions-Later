import type { PropsWithChildren } from 'react';

export const Section = ({ children }: PropsWithChildren) => {
  return <article className="relative flex flex-col gap-4">{children}</article>;
};

export const SectionContent = ({ children }: PropsWithChildren) => {
  return <div className="flex flex-col relative">{children}</div>;
};
