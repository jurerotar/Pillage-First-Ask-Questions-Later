import type { PropsWithChildren } from 'react';
import { LuEye } from 'react-icons/lu';
import { Text } from 'app/components/text';

export const UIUXImprovementBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <LuEye className="size-6" />
        <Text className="font-semibold">UI/UX improvements</Text>
      </div>
      <div className="ml-2">{children}</div>
    </>
  );
};
