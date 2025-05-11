import type React from 'react';

export const BuildingSection: React.FCWithChildren = ({ children }) => {
  return <article className="flex flex-col gap-4">{children}</article>;
};

export const BuildingSectionContent: React.FCWithChildren = ({ children }) => {
  return <div className="flex flex-col gap-2">{children}</div>;
};
