
import React from 'react';
import { PageWrapper } from '../PageWrapper';
import { AnalysisSummary } from '../../types';

interface ResultsViewProps {
  results: AnalysisSummary;
  onRestart: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onRestart }) => {
  const score = Math.round(results.accuracyScore * 100);
  const isHigh = score >= 75;
  const isMid = score > 30 && score < 75;

  return (
    <PageWrapper>
      <div className="flex-1 flex flex-col py-4">
        <div className="text-center pb-8 border-b border-slate-100">
          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border ${isHigh ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isMid ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
            Analysis Complete
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <h2 className="text-[100px] font-black text-slate-900 leading-none tracking-tighter tabular-nums">{score}</h2>
            <span className="text-3xl font-bold text-slate-300">%</span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Overall Accuracy</p>
        </div>

        <div className="py-8 space-y-6">
          <div className="space-y-1.5 p-5 rounded-3xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Notes</span>
              <span className="text-xs font-black text-indigo-600">{results.referenceNote} Major</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              {score >= 90 ? "Incredible precision. You're hitting professional choral standards." :
               score >= 70 ? "Strong pitch center. Your ear is well-developed." :
               "A decent start. Focus on breath support to steady those high notes."}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {results.results.map((r, i) => (
              <div key={i} className={`flex flex-col items-center p-2 rounded-xl border ${r.isAccurate ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`text-[10px] font-black ${r.isAccurate ? 'text-indigo-600' : 'text-slate-400'}`}>{r.degree}</span>
                <span className={`text-[8px] font-bold ${r.isAccurate ? 'text-indigo-400' : 'text-slate-300'}`}>{r.expectedNote}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <button onClick={onRestart} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-lg btn-active text-base">New Test</button>
        </div>
      </div>
    </PageWrapper>
  );
};
