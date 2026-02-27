import type { PropsWithChildren } from 'react';
import { MdOutlineNewReleases } from 'react-icons/md';
import { Text } from 'app/components/text.tsx';

export const FeaturesBlock = ({ children }: PropsWithChildren) => {
  if (!children) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 items-center">
        <MdOutlineNewReleases className="size-6" />
        <Text className="font-semibold">New features</Text>
      </div>
      <div className="ml-2">{children}</div>
    </>
  );
};
