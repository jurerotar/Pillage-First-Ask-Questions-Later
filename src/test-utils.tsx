import React, { FCWithChildren } from 'react';
import { render, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ViewportProvider } from 'app/providers/viewport-context';
import { composeComponents } from 'utils/jsx';

export type RenderOptions = {
  path?: string;
  // Wrap your component with layout(s). If property is missing, default layout will be used.
  wrapper?: FCWithChildren[] | FCWithChildren;
  deviceSize?: {
    height: Window['innerHeight'];
    width: Window['innerWidth'];
  };
};

const TestingEnvironment: FCWithChildren<RenderOptions> = (props) => {
  const { path, wrapper = [], deviceSize, children } = props;

  const initialPath = path ?? '/';

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <ViewportProvider initialSize={deviceSize}>
        {composeComponents(children, Array.isArray(wrapper) ? wrapper : [wrapper])}
      </ViewportProvider>
    </MemoryRouter>
  );
};

const defaultOptions: RenderOptions = {
  wrapper: [],
  deviceSize: {
    height: 0,
    width: 0,
  },
};

export const renderHookWithContext = <TProps, TResult>(callback: (props: TProps) => TResult, options?: RenderOptions) => {
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <TestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</TestingEnvironment>
    ),
  });
};
const renderWithContext = <T = HTMLElement, >(
  ui: React.ReactElement<T, string | React.JSXElementConstructor<T>>,
  options?: RenderOptions,
) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</TestingEnvironment>
    ),
  });
};
