import React from 'react';
import { useRouteError } from 'react-router-dom';

export const GameErrorBoundary = () => {
  const error = useRouteError();
  return (
    <p>Error... </p>
  );
};
