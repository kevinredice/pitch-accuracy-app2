
import React from 'react';

export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-full w-full bg-white flex flex-col overflow-y-auto hide-scrollbar">
    <div className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full relative">
      {children}
    </div>
  </div>
);
