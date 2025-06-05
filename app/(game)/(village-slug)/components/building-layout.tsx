import type React from 'react';

export const Section: React.FCWithChildren = ({ children }) => {
  return <article className="flex flex-col gap-4">{children}</article>;
};

export const SectionContent: React.FCWithChildren = ({ children }) => {
  return <div className="flex flex-col gap-2">{children}</div>;
};
