import React from 'react';
import clsx from 'clsx';

type ParagraphProps = {
  className?: string;
  children: React.ReactNode;
} & React.ParamHTMLAttributes<HTMLParagraphElement>;

export const Paragraph: React.FC<ParagraphProps> = (props) => {
  const {
    className = '',
    children
  } = props;

  return (
    <p className={clsx(className, 'duration-default text-base text-gray-800 transition-colors dark:text-white')}>
      {children}
    </p>
  );
};
