import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

type AuthenticationGuardProps = {
  isAuthenticated: boolean;
  navigateTo?: string;
};

export const AuthenticationGuard: React.FC<AuthenticationGuardProps> = (props) => {
  const {
    isAuthenticated,
    navigateTo = '/'
  } = props;
  return (
    isAuthenticated
      ? <Outlet />
      : <Navigate to={navigateTo} />
  ) as JSX.Element;
};
