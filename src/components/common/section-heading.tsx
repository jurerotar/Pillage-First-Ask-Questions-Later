import React from 'react';

type SectionHeadingProps = {
  className?: string;
  children: React.ReactNode;
};

const SectionHeading: React.FC<SectionHeadingProps> = (props): JSX.Element => {
  const {
    className,
    children
  } = props;

  return (
    <h3 className={`text-gray-800 font-medium dark:text-white items-center inline-flex gap-2 transition-colors duration-default text-lg md:text-2xl ${className}`}>
      {children}
    </h3>
  );
};

export default SectionHeading;
