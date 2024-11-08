import type React from 'react';

type ConditionalWrapperProps = {
  condition: boolean;
  wrapper: (children: React.ReactNode) => React.ReactNode;
};

export const ConditionalWrapper: React.FCWithChildren<ConditionalWrapperProps> = (props) => {
  const { condition, wrapper, children } = props;

  return condition ? wrapper(children) : children;
};
