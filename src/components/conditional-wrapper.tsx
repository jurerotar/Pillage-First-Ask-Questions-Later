import React, { FCWithChildren } from 'react';

type ConditionalWrapperProps = {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
};

export const ConditionalWrapper: FCWithChildren<ConditionalWrapperProps> = (props) => {
  const {
    condition,
    wrapper,
    children
  } = props;

  return (
    condition ? wrapper(children) : children
  );
};
