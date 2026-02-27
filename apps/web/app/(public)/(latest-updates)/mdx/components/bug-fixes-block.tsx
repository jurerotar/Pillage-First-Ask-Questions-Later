import type { PropsWithChildren } from 'react';
import { TbBugOff } from 'react-icons/tb';
import { Text } from 'app/components/text.tsx';

export const BugFixesBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <TbBugOff className="size-6" />
        <Text className="font-semibold">Bug fixes</Text>
      </div>
      <div className="ml-2">{children}</div>
    </>
  );
};
