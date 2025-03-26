import type React from 'react';
import { useIsRestoring } from '@tanstack/react-query';

type PersisterAwaiterProps = {
  fallback: React.ReactNode;
};

export const PersisterAwaiter: React.FCWithChildren<PersisterAwaiterProps> = ({ children, fallback }) => {
  const isRestoring = useIsRestoring();

  if (isRestoring) {
    return fallback;
  }

  return children;
};
