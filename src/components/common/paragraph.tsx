import React from 'react';

type ParagraphProps = {
  className?: string;
  children: React.ReactNode;
} & React.ParamHTMLAttributes<HTMLParagraphElement>;

const Paragraph: React.FC<ParagraphProps> = (props): JSX.Element => {
  const {
    className = '',
    children
  } = props;

  return (
    <p className={`text-base text-gray-800 dark:text-white transition-colors duration-default ${className}`}>
      {children}
    </p>
  );
};

export default Paragraph;
