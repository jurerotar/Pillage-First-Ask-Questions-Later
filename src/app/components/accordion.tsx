import React from 'react';
import clsx from 'clsx';

type AccordionProps = {
  summary: string;
  opened?: boolean;
  summaryClassName?: string;
  className?: string;
  children: React.ReactNode;
};

export const Accordion: React.FC<AccordionProps> = (props) => {
  const { summary, opened = false, summaryClassName = '', className = '', children } = props;

  return (
    <details
      className="accordion rounded-md border border-gray-300"
      open={opened}
    >
      <summary className={clsx(summaryClassName, 'flex cursor-pointer items-center justify-between border-gray-300 p-4')}>
        <span>{summary}</span>
        {/* <Icon */}
        {/*  className="scale-75" */}
        {/*  icon={faChevronUp} */}
        {/* /> */}
      </summary>
      <div className={clsx(className, 'p-4')}>{children}</div>
    </details>
  );
};
