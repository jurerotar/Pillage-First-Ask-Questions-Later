import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';

type AccordionProps = {
  summary: string;
  opened?: boolean;
  summaryClassName?: string;
  className?: string;
  children: React.ReactNode;
};

const Accordion: React.FC<AccordionProps> = (props): JSX.Element => {
  const {
    summary,
    opened = false,
    summaryClassName = '',
    className = '',
    children
  } = props;

  return (
    <details
      className="accordion border border-gray-300 rounded-md"
      open={opened}
    >
      <summary className={`flex p-4 border-gray-300 items-center justify-between cursor-pointer ${summaryClassName}`}>
        <span>
          {summary}
        </span>
        <FontAwesomeIcon
          className="scale-75"
          icon={faChevronUp}
          fixedWidth
        />
      </summary>
      <div className={`p-4 ${className}`}>
        {children}
      </div>
    </details>
  );
};

export default Accordion;
