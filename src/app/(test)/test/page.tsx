import React from 'react';
import { useLocation } from 'react-router-dom';

export const TestPage: React.FC = () => {
  const location = useLocation();

  return (
    <>
      Test page {location.pathname}
    </>
  );
};
