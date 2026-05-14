
import React from 'react';
import { PageWrapper } from '../PageWrapper';
import { LeaderboardEntry } from '../../types';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  onRestart: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ entries, onRestart }) => {
  return (
    <PageWrapper>
      <div className="flex-1 flex flex-col py-4">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 shadow-sm mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.49.73 1.16 1.32 1.94 1.7L8.33 19H7c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1h-1.33l-1-4.36c.78-.38 1.45-.97 1.94-1.7C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900">Hall of Fame</h2>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Global Singing Ranks</p>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          {entries.map((entry, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between p-4 rounded-[1.5rem] border transition-all ${entry.isUser ? 'bg-indigo-600 border-indigo-500 shadow-lg scale-[1.02]' : 'bg-white border-slate-100'}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-amber-400 text-amber-900' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-slate-100 text-slate-400'}`}>
                  {i + 1}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-black truncate ${entry.isUser ? 'text-white' : 'text-slate-800'}`}>{entry.name}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-widest ${entry.isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {entry.scalesCompleted} Scale{entry.scalesCompleted > 1 ? 's' : ''} • {entry.date}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-black tabular-nums ${entry.isUser ? 'text-white' : 'text-indigo-600'}`}>
                  {entry.score}<span className="text-[10px] ml-0.5 opacity-60">%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <button onClick={onRestart} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl btn-active text-base">Back to Home</button>
        </div>
      </div>
    </PageWrapper>
  );
};
