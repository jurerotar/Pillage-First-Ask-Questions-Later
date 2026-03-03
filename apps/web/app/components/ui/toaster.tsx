import type { CSSProperties } from 'react';
import { use } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { CookieContext } from 'app/providers/cookie-provider';

export const Toaster = (props: ToasterProps) => {
  const { uiColorScheme } = use(CookieContext);

  return (
    <Sonner
      className="toaster group"
      theme={uiColorScheme}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
};
