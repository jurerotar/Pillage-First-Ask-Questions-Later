import React from 'react';
import clsx from 'clsx';

type SectionHeadingProps = {
  className?: string;
  children: React.ReactNode;
};

export const SectionHeading: React.FC<SectionHeadingProps> = (props) => {
  const {
    className,
    children
  } = props;

  return (
    <h3 className={clsx(className, 'duration-default inline-flex items-center gap-2 text-lg font-medium text-gray-800 transition-colors dark:text-white md:text-2xl')}>
      {children}
    </h3>
  );
};
