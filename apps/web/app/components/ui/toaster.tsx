import { use } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CookieContext } from 'app/providers/cookie-provider';

type ToasterStyle = NonNullable<ToasterProps['style']> & {
  '--normal-bg': string;
  '--normal-text': string;
  '--normal-border': string;
};

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
      style={toasterStyle}
      {...props}
    />
  );
};
