
import React from 'react';
import { PageWrapper } from '../PageWrapper';

interface StartViewProps {
  onStart: () => void;
  error: string | null;
}

export const StartView: React.FC<StartViewProps> = ({ onStart, error }) => (
  <PageWrapper>
    <div className="flex-1 flex flex-col justify-between py-4">
      <div className="space-y-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl rotate-3 mt-8">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
        </div>
        
        <div className="space-y-3 px-4">
          <h1 className="text-4xl font-black text-slate-900 leading-tight">Vocal Pitch Analyzer</h1>
          <p className="text-slate-500 font-medium text-sm">Professional real-time feedback for your singing accuracy.</p>
        </div>

        <div className="space-y-3 text-left">
          <div className="p-4 rounded-3xl bg-indigo-50/50 border border-indigo-100">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">How it works</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 border border-indigo-100">1</div>
                <p className="text-xs text-slate-600 font-medium leading-normal">Sing the major scale notes do, re, mi, fa, sol, la, ti, and do as they highlight. Start at any pitch that feels natural for your voice.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 border border-indigo-100">2</div>
                <p className="text-xs text-slate-600 font-medium leading-normal">Hold each pitch for <span className="text-indigo-600 font-bold">1.5 seconds</span> as steadily as possible.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 border border-indigo-100">3</div>
                <p className="text-xs text-slate-600 font-medium leading-normal">Our <span className="text-indigo-600 font-bold">AI analyzer</span> checks your cents-accuracy against concert pitch.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 pt-8">
        {error && <p className="text-rose-500 text-[11px] text-center font-bold bg-rose-50 p-3 rounded-2xl border border-rose-100">{error}</p>}
        <button 
          onClick={onStart} 
          className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 btn-active text-lg"
        >
          Enter Analysis
        </button>
      </div>
    </div>
  </PageWrapper>
);
