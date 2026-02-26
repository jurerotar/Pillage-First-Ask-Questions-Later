import type { PropsWithChildren } from 'react';
import { BiWrench } from 'react-icons/bi';
import { Text } from 'app/components/text.tsx';

export const PerformanceBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <BiWrench className="size-6" />
        <Text className="font-semibold">Performance</Text>
      </div>
      <div className="ml-2">{children}</div>
    </>
  );
};
