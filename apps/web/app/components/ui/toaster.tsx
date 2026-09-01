import { use } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CookieContext } from 'app/providers/cookie-context';

type ToasterStyle = NonNullable<ToasterProps['style']> & {
  '--normal-bg': string;
  '--normal-text': string;
  '--normal-border': string;
};

const safeAreaOffset = {
  top: 'calc(env(safe-area-inset-top, 0px) + 1rem)',
  right: 'calc(env(safe-area-inset-right, 0px) + 1rem)',
  bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)',
  left: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
} satisfies ToasterProps['offset'];

const toasterStyle: ToasterStyle = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
};

export const Toaster = (props: ToasterProps) => {
  const { uiColorScheme } = use(CookieContext);

  return (
    <Sonner
      className="toaster group"
      theme={uiColorScheme}
      offset={safeAreaOffset}
      mobileOffset={safeAreaOffset}
      style={toasterStyle}
      {...props}
    />
  );
};
