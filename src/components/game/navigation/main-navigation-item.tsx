import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type MainNavigationItemProps = {
  to: string;
  imageUrl: string;
  label: string;
};

const MainNavigationItem: React.FC<MainNavigationItemProps> = (props): JSX.Element => {
  const {
    to,
    imageUrl,
    label
  } = props;

  const location = useLocation();

  return (
    <Link to={to}>
      <img
        src={imageUrl}
        alt={label}
        height={60}
        width={60}
        className={`rounded-full border-4 ${to === location.pathname ? 'border-green-300' : 'border-gray-200'}`}
      />
    </Link>
  );
};

export default MainNavigationItem;
