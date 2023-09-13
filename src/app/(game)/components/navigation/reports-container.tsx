import React from 'react';
import { NavigationButton } from './navigation-button';

export const ReportsContainer: React.FC = () => {
  return (
    <div className="relative">
      <NavigationButton
        onClick={() => {
        }}
        variant="reports"
        size="sm"
      />
      {/* {unopenedReportCount > 0 && ( */}
      {/*   <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-[2px] text-xs text-white"> */}
      {/*     {unopenedReportCount} */}
      {/*   </span> */}
      {/* )} */}
    </div>
  );
};
