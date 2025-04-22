import type React from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { debounce } from 'moderndash';

type WindowSize = {
  height: number;
  width: number;
};

type ViewportContextValues = {
  isWiderThanXs: boolean;
  isWiderThanSm: boolean;
  isWiderThanMd: boolean;
  isWiderThanLg: boolean;
  isWiderThanXl: boolean;
  isWiderThan2Xl: boolean;
} & WindowSize;

const breakpoints = {
  xs: 425,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const ViewportContext = createContext<ViewportContextValues>({} as never);

type ViewportProviderProps = {
  initialSize?: WindowSize;
};

export const ViewportProvider: React.FCWithChildren<ViewportProviderProps> = ({ initialSize = { height: 0, width: 0 }, children }) => {
  const [windowSize, setWindowSize] = useState<WindowSize>(initialSize);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const debouncedHandleResize = debounce(handleResize, 150);

    debouncedHandleResize();
    window.addEventListener('resize', debouncedHandleResize);

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, []);

  const value = useMemo<ViewportContextValues>(() => {
    const { width, height } = windowSize;
    const isWiderThanXs: boolean = width >= breakpoints.xs;
    const isWiderThanSm: boolean = width >= breakpoints.sm;
    const isWiderThanMd: boolean = width >= breakpoints.md;
    const isWiderThanLg: boolean = width >= breakpoints.lg;
    const isWiderThanXl: boolean = width >= breakpoints.xl;
    const isWiderThan2Xl: boolean = width >= breakpoints['2xl'];

    return {
      width,
      height,
      isWiderThanXs,
      isWiderThanSm,
      isWiderThanMd,
      isWiderThanLg,
      isWiderThanXl,
      isWiderThan2Xl,
    };
  }, [windowSize]);

  return <ViewportContext value={value}>{children}</ViewportContext>;
};
