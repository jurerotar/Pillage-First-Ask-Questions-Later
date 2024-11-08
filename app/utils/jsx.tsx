import type React from 'react';

export const composeComponents = (WrappedComponent: React.ReactNode, Layout: React.FCWithChildren[]) => {
  const InitialComponent: React.FCWithChildren = ({ children }) => children;
  const ComposedLayouts: React.FCWithChildren = Layout.reduce(
    (AccumulatedLayouts: React.FCWithChildren, CurrentLayout: React.FCWithChildren) =>
      ({ children }) => (
        <AccumulatedLayouts>
          <CurrentLayout>{children}</CurrentLayout>
        </AccumulatedLayouts>
      ),
    InitialComponent,
  );

  return <ComposedLayouts>{WrappedComponent}</ComposedLayouts>;
};
