import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

type AuthenticationGuardProps = {
  isAuthenticated: boolean;
  navigateTo?: string;
};

const AuthenticationGuard: React.FC<AuthenticationGuardProps> = (props): JSX.Element => {
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

export default AuthenticationGuard;
