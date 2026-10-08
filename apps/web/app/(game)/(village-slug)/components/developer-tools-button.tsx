import type { ComponentProps } from 'react';
import { VscTerminal } from 'react-icons/vsc';
import { usePreferences } from 'app/(game)/(village-slug)/hooks/use-preferences';

export const DeveloperToolsButton = ({
  className,
  ...props
}: ComponentProps<'span'>) => {
  const { preferences } = usePreferences();

  if (!preferences.isDeveloperToolsConsoleEnabled) {
    return null;
  }

  return (
    <span
      className={className}
      {...props}
    >
      <VscTerminal className="text-inherit size-full" />
    </span>
  );
};
