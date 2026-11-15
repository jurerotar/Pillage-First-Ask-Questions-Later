import type { PropsWithChildren } from 'react';

export const CombatSimulatorParticipantControlsTable = ({
  children,
}: PropsWithChildren) => {
  return (
    <table className="w-full border-collapse border border-b-0 overflow-hidden dark:border-border text-left">
      {children}
    </table>
  );
};
