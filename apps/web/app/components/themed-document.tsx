import { clsx } from 'clsx';
import type { PropsWithChildren, ReactNode } from 'react';
import { useClientHydration } from 'app/hooks/use-client-hydration';
import {
  uiColorSchemeCookiePattern,
  useUiColorScheme,
} from 'app/hooks/use-ui-color-scheme';

const initializeColorScheme = `
  if (${uiColorSchemeCookiePattern}.exec(document.cookie)?.[1] === 'dark') {
    document.documentElement.classList.replace('light', 'dark');
  }
`;

type ThemedDocumentProps = PropsWithChildren<{
  lang: string;
  head: ReactNode;
  className?: string;
  bodyClassName?: string;
}>;

export const ThemedDocument = ({
  lang,
  head,
  className,
  bodyClassName,
  children,
}: ThemedDocumentProps) => {
  const isHydrated = useClientHydration();
  const colorScheme = useUiColorScheme();

  return (
    <html
      lang={lang}
      className={clsx(colorScheme, className)}
    >
      <head>
        <meta charSet="utf-8" />
        {!isHydrated && <script>{initializeColorScheme}</script>}
        <style>
          {
            ':root.dark { color-scheme: dark; background-color: var(--background, oklch(0.145 0 0)); }'
          }
        </style>
        {head}
      </head>
      <body className={bodyClassName}>{children}</body>
    </html>
  );
};
