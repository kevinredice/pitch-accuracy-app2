
import React from 'react';
import { PageWrapper } from '../PageWrapper';
import { VoiceDistributionChart } from '../VoiceDistributionChart';
import { InfoTooltip } from '../InfoTooltip';
import { AppState, SpeakingResult, AnalysisSummary } from '../../types';

interface SpeakingViewProps {
  state: AppState;
  speakingResults: SpeakingResult | null;
  results: AnalysisSummary | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetry: () => void;
  onGoBack: () => void;
  onDashboard: () => void;
}

export const SpeakingView: React.FC<SpeakingViewProps> = (props) => {
  const { state, speakingResults, results, onStartRecording, onStopRecording, onRetry, onGoBack, onDashboard } = props;

  if (state === 'SPEAKING_VOICE' || state === 'SPEAKING_RECORDING') {
    const isRec = state === 'SPEAKING_RECORDING';
    return (
      <PageWrapper>
        <div className="flex-1 flex flex-col justify-between py-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-slate-900">{isRec ? 'Listening...' : 'Voice Print'}</h2>
            <p className="text-slate-400 text-sm font-bold">Natural speech analysis.</p>
          </div>

          <div className={`p-8 rounded-[2.5rem] border flex items-center justify-center transition-all duration-300 ${isRec ? 'bg-indigo-600 border-indigo-500 scale-105 shadow-2xl' : 'bg-slate-50 border-slate-100'}`}>
            <p className={`text-2xl font-black leading-tight italic text-center ${isRec ? 'text-white' : 'text-slate-800'}`}>
              "The quick brown fox jumps over the lazy dog."
            </p>
          </div>

          <div className="space-y-4">
            {isRec ? (
              <button onClick={onStopRecording} className="w-full bg-rose-600 text-white font-black py-5 rounded-2xl shadow-lg btn-active text-lg">Finish Reading</button>
            ) : (
              <>
                <button onClick={onStartRecording} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-lg btn-active text-lg">Start Reading</button>
                <button onClick={onGoBack} className="w-full text-slate-400 font-bold text-sm">Cancel</button>
              </>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (state === 'SPEAKING_RESULTS') {
    if (!speakingResults) {
      return (
        <PageWrapper>
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 text-center">
            <span className="text-7xl">🔇</span>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900">Silence?</h2>
              <p className="text-slate-500 font-medium px-8 text-sm">No vocal activity detected. Let's try that reading once more.</p>
            </div>
            <div className="w-full space-y-3 pt-4">
              <button onClick={onRetry} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-lg btn-active">Try Again</button>
              <button onClick={onDashboard} className="w-full text-slate-400 font-bold text-sm">Back to Home</button>
            </div>
          </div>
        </PageWrapper>
      );
    }

    const diff = speakingResults.semitonesFromSinging;
    const isHigher = diff > 0;

    return (
      <PageWrapper>
        <div className="flex-1 flex flex-col py-4">
          <div className="text-center pb-6 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full mb-4 inline-block">Pitch Map</span>
            <h2 className="text-8xl font-black text-indigo-600 tracking-tighter leading-none">{speakingResults.note}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xl font-black text-slate-800">{speakingResults.classification}</span>
              <span className="text-xs font-bold text-slate-300 tabular-nums">{Math.round(speakingResults.medianFreq)} Hz</span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] my-6 p-2 shadow-sm">
            <VoiceDistributionChart userFreq={speakingResults.medianFreq} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100/50">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Male Pattern</span>
              <span className="text-2xl font-black text-blue-600">{speakingResults.malePercentile}%</span>
            </div>
            <div className="bg-pink-50/40 p-5 rounded-2xl border border-pink-100/50">
              <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest block mb-1">Female Pattern</span>
              <span className="text-2xl font-black text-pink-600">{speakingResults.femalePercentile}%</span>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl text-white text-xs mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <p className="font-medium leading-relaxed">
                Your speaking voice is <span className="text-indigo-400 font-black">{Math.abs(diff).toFixed(1)} semitones {isHigher ? 'higher' : 'lower'}</span> than your singing scale's tonic ({results?.referenceNote}).
              </p>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <button onClick={onRetry} className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl btn-active text-base">Re-analyze</button>
            <button onClick={onDashboard} className="w-full bg-slate-50 text-slate-500 font-bold py-3.5 rounded-2xl border border-slate-100 text-[11px] uppercase tracking-widest btn-active">Done</button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return null;
};
