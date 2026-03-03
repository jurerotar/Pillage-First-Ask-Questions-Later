import type { PropsWithChildren } from 'react';
import { IoMdGitCompare } from 'react-icons/io';
import { Text } from 'app/components/text.tsx';

export const TechnicalImprovementBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <IoMdGitCompare className="size-6" />
        <Text className="font-semibold">Technical improvements</Text>
      </div>
      <div className="ml-2">{children}</div>
    </>
  );
};
