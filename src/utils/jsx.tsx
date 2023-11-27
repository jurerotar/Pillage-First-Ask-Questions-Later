import React, { FCWithChildren } from 'react';

export const composeComponents = (WrappedComponent: React.ReactNode, Layout: FCWithChildren[]) => {
  const InitialComponent: FCWithChildren = ({ children }) => <>{children}</>;
  const ComposedLayouts: FCWithChildren = Layout.reduce(
    (AccumulatedLayouts: FCWithChildren, CurrentLayout: FCWithChildren) =>
      ({ children }) => (
        <AccumulatedLayouts>
          <CurrentLayout>{children}</CurrentLayout>
        </AccumulatedLayouts>
      ),
    InitialComponent,
  );

  return <ComposedLayouts>{WrappedComponent}</ComposedLayouts>;
};
