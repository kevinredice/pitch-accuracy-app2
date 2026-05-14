
import React from 'react';
import { PageWrapper } from '../PageWrapper';
import { ScaleDegreeRing } from '../ScaleDegreeRing';
import { AppState } from '../../types';

interface SingingViewProps {
  state: AppState;
  timer: number;
  prepProgress: number;
  currentScaleIndex: number;
  segmentProgress: number;
  onStartPrep: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onCancel: () => void;
}

const SCALE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"];

export const SingingView: React.FC<SingingViewProps> = (props) => {
  const { state, timer, prepProgress, currentScaleIndex, segmentProgress, onStartPrep, onPause, onResume, onRestart, onCancel } = props;

  if (state === 'READY' || state === 'PREPARING') {
    const isPrep = state === 'PREPARING';
    
    return (
      <PageWrapper>
        <div className="flex-1 flex flex-col justify-between py-6">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black text-slate-900">
              {isPrep ? 'Starting soon...' : 'Ready to sing?'}
            </h2>
            <div className={`px-4 transition-opacity duration-300 ${isPrep ? 'opacity-40' : 'opacity-100'}`}>
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Pick a comfortable starting note. We'll find your key automatically.
              </p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className={`w-full grid grid-cols-4 gap-y-8 gap-x-4 px-4 transition-all duration-500 ${isPrep ? 'scale-95 opacity-50 blur-[1px]' : 'scale-100 opacity-100'}`}>
              {SCALE_NAMES.map((n, i) => (
                <ScaleDegreeRing key={i} label={n} active={false} completed={false} progress={0} />
              ))}
            </div>
          </div>

          <div className="min-h-[140px] flex flex-col justify-end pb-4">
            {!isPrep ? (
              <div className="space-y-4">
                <button onClick={onStartPrep} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-lg btn-active text-lg">
                  Begin Recording
                </button>
                <button onClick={onCancel} className="w-full text-slate-400 font-bold text-sm py-2">Cancel</button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="8" fill="none" />
                    <circle cx="50" cy="50" r="42" stroke="#4f46e5" strokeWidth="8" fill="none" 
                      strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * prepProgress / 100)} 
                      strokeLinecap="round" className="transition-all duration-100" />
                  </svg>
                  <span className="text-4xl font-black text-indigo-600 tabular-nums">{timer}</span>
                </div>
                <p className="text-slate-400 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Prepare your voice...</p>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex-1 flex flex-col justify-between py-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl text-white">
            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div> 
              Recording
            </span>
            <span className="mono text-xs font-bold">{timer}s</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 py-6">
          {SCALE_NAMES.map((name, i) => (
            <ScaleDegreeRing 
              key={i} 
              label={name} 
              active={currentScaleIndex === i && state !== 'PAUSED'} 
              completed={currentScaleIndex > i} 
              progress={currentScaleIndex === i ? segmentProgress : 0} 
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          <div className={`text-[120px] font-black text-indigo-600 leading-none tabular-nums transition-all ${state !== 'PAUSED' ? 'animate-float scale-110' : 'opacity-40 scale-90'}`}>
            {state === 'PAUSED' ? '||' : SCALE_NAMES[currentScaleIndex]}
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Hold this pitch</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-6">
          {state === 'SINGING_SCALE' ? (
            <button onClick={onPause} className="bg-slate-900 text-white font-black py-4 rounded-2xl btn-active text-sm">Pause</button>
          ) : (
            <button onClick={onResume} className="bg-indigo-600 text-white font-black py-4 rounded-2xl btn-active text-sm">Resume</button>
          )}
          <button onClick={onRestart} className="bg-slate-50 text-slate-600 border border-slate-200 font-black py-4 rounded-2xl btn-active text-sm">Restart</button>
        </div>
      </div>
    </PageWrapper>
  );
};
