
import React from 'react';

interface ScaleDegreeRingProps {
  active: boolean;
  completed: boolean;
  label: string;
  progress: number;
}

export const ScaleDegreeRing: React.FC<ScaleDegreeRingProps> = ({ active, completed, label, progress }) => (
  <div className="flex flex-col items-center">
    <div className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 ${active ? 'scale-110' : ''}`}>
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" stroke="#f8fafc" strokeWidth="6" fill="none" />
        {active && (
          <circle cx="50" cy="50" r="46" stroke="#4f46e5" strokeWidth="8" fill="none" 
            strokeDasharray="289" strokeDashoffset={289 - (289 * progress / 100)} 
            strokeLinecap="round" className="transition-all duration-100" />
        )}
      </svg>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        completed ? 'bg-indigo-600 text-white shadow-md' : 
        active ? 'bg-white text-indigo-600 border-2 border-indigo-100 shadow-sm' : 
        'bg-white text-slate-300 border border-slate-100'
      }`}>
        <span className="text-[8px] font-black uppercase tracking-tighter">
          {label === 'Do (Octave)' ? 'Do' : label}
        </span>
      </div>
    </div>
  </div>
);
