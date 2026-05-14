
import React from 'react';

interface InfoTooltipProps {
  title: string;
  children: React.ReactNode;
  direction?: 'up' | 'down';
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, children, direction = 'up' }) => {
  const isUp = direction === 'up';
  
  return (
    <div className="relative inline-block group ml-1 align-baseline">
      <span className="cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/10 text-current text-[10px] font-black hover:bg-black/20 transition-colors select-none">?</span>
      
      {/* Tooltip Container */}
      <div className={`
        /* Base Visibility & Animation */
        invisible group-hover:visible opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto
        transition-all duration-200 transform z-[100] scale-95 group-hover:scale-100
        
        /* Mobile: Fixed bottom sheet to ensure it's always in-view */
        fixed bottom-6 left-6 right-6 translate-y-4 group-hover:translate-y-0
        
        /* Desktop: Positioning relative to the '?' icon */
        sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:right-auto sm:w-80 sm:max-w-[calc(100vw-2rem)]
        ${isUp ? 'sm:bottom-full sm:mb-3' : 'sm:top-full sm:mt-3'}
        
        /* Aesthetics */
        bg-slate-900 text-white p-5 rounded-2xl text-[13px] text-left shadow-2xl border border-slate-800 normal-case tracking-normal
      `}>
        <p className="font-bold mb-1.5 text-indigo-400 text-sm">{title}</p>
        <div className="leading-relaxed text-slate-300 font-normal">
          {children}
        </div>
        
        {/* Desktop Arrow */}
        <div className={`
          hidden sm:block absolute left-1/2 -translate-x-1/2 border-8 border-transparent
          ${isUp ? 'top-full border-t-slate-900' : 'bottom-full border-b-slate-900'}
        `}></div>
      </div>
    </div>
  );
};
