
import React, { useState } from 'react';
import { PageWrapper } from '../PageWrapper';
import { AnalysisSummary } from '../../types';

interface ResultsViewProps {
  results: AnalysisSummary;
  onRestart: () => void;
  onSubmitLeaderboard: (name: string) => void;
  onViewLeaderboard: () => void;
  hasLeaderboardEntries: boolean;
}

const VOICE_MIN = 65;
const VOICE_MAX = 1320;

function CentsBar({ cents }: { cents: number }) {
  if (cents === 9999) {
    return (
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[10px] font-bold text-slate-300 w-16 tabular-nums">no signal</span>
        <div className="flex-1 h-1 bg-slate-100 rounded-full" />
      </div>
    );
  }

  const abs = Math.abs(cents);
  const fillColor = abs <= 25 ? 'bg-emerald-400' : abs <= 50 ? 'bg-amber-400' : 'bg-rose-400';
  const textColor = abs <= 25 ? 'text-emerald-500' : abs <= 50 ? 'text-amber-500' : 'text-rose-500';
  const clamped = Math.max(-100, Math.min(100, cents));
  const halfFill = Math.max(2, Math.abs(clamped) / 2);
  const isFlat = clamped < 0;

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <span className={`text-[10px] font-black tabular-nums w-16 ${textColor}`}>
        {cents > 0 ? '+' : ''}{cents}¢ {isFlat ? '▾' : cents > 0 ? '▴' : '●'}
      </span>
      <div className="flex-1 relative h-1.5">
        <div className="absolute inset-0 bg-slate-100 rounded-full" />
        <div className="absolute top-0 bottom-0 rounded-full" style={{ left: '50%', width: '1px', background: '#cbd5e1' }} />
        <div
          className={`absolute inset-y-0 ${fillColor} rounded-full transition-all duration-700`}
          style={isFlat
            ? { left: `${50 - halfFill}%`, width: `${halfFill}%` }
            : { left: '50%', width: `${halfFill}%` }
          }
        />
      </div>
    </div>
  );
}

export const ResultsView: React.FC<ResultsViewProps> = ({ results, onRestart, onSubmitLeaderboard, onViewLeaderboard, hasLeaderboardEntries }) => {
  const [showLog, setShowLog] = useState(false);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const score = Math.round(results.accuracyScore * 100);
  const isHigh = score >= 75;
  const isMid = score > 30 && score < 75;

  const badgeClass = isHigh
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : isMid
    ? 'bg-amber-50 text-amber-600 border-amber-100'
    : 'bg-rose-50 text-rose-600 border-rose-100';

  const scoreClass = isHigh ? 'text-emerald-500' : isMid ? 'text-amber-500' : 'text-rose-500';

  return (
    <PageWrapper>
      <div className="flex-1 flex flex-col py-4 gap-6">

        {/* Score */}
        <div className="text-center pb-6 border-b border-slate-100">
          <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border ${badgeClass}`}>
            Analysis Complete
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className={`text-[96px] font-black leading-none tracking-tighter tabular-nums ${scoreClass}`}>{score}</span>
            <span className="text-3xl font-bold text-slate-300">%</span>
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Overall Accuracy</p>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Detected</span>
            <span className="text-xs font-black text-indigo-600">{results.referenceNote} Major</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            {score >= 90
              ? "Incredible precision. You're hitting professional choral standards."
              : score >= 70
              ? "Strong pitch center. Your ear is well-developed."
              : "A decent start. Focus on breath support to steady those high notes."}
          </p>
        </div>

        {/* Note breakdown */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note Breakdown</p>
          {results.results.map((r, i) => {
            const missed = r.centsOff === 9999 || r.detectedFreq <= 0;
            const outOfRange = !missed && (r.detectedFreq < VOICE_MIN || r.detectedFreq > VOICE_MAX);
            const cardBg = r.isAccurate
              ? 'bg-emerald-50/60 border-emerald-100'
              : missed
              ? 'bg-slate-50 border-slate-100'
              : 'bg-rose-50/30 border-rose-100/50';

            return (
              <div key={i} className={`p-3 rounded-2xl border transition-colors duration-200 ${cardBg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black ${r.isAccurate ? 'text-emerald-600' : missed ? 'text-slate-300' : 'text-slate-600'}`}>
                      {r.degree}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold tracking-wide">{r.expectedNote}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!missed && (
                      <span className={`text-[9px] font-mono ${outOfRange ? 'text-amber-500' : 'text-slate-400'}`}>
                        {r.detectedFreq.toFixed(1)} Hz{outOfRange ? ' ⚠' : ''}
                      </span>
                    )}
                    <span className={`text-[10px] font-black ${r.isAccurate ? 'text-emerald-500' : missed ? 'text-slate-300' : 'text-rose-400'}`}>
                      {r.isAccurate ? '✓' : missed ? '—' : '✗'}
                    </span>
                  </div>
                </div>
                <CentsBar cents={r.centsOff} />
              </div>
            );
          })}
        </div>

        {/* Frequency log (collapsible) */}
        <div className="rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowLog(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-left active:bg-slate-100 transition-colors"
          >
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frequency Log</span>
            <span className={`text-slate-400 text-[10px] transition-transform duration-200 inline-block ${showLog ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {showLog && (
            <div className="px-4 pb-4 pt-3 space-y-1">
              <p className="text-xs text-slate-500 font-medium mb-3 leading-relaxed">
                Raw Hz detections per note. ⚠ flags frequencies outside the typical singing voice range (65–1320 Hz), which may indicate background noise was picked up instead of your voice.
              </p>

              {results.results.map((r, i) => {
                const missed = r.detectedFreq <= 0 || r.centsOff === 9999;
                const outOfRange = !missed && (r.detectedFreq < VOICE_MIN || r.detectedFreq > VOICE_MAX);
                const raw = r.rawFrequencies ?? [];
                const minFreq = raw.length ? Math.min(...raw) : 0;
                const maxFreq = raw.length ? Math.max(...raw) : 0;
                const spread = maxFreq - minFreq;
                const isUnstable = !missed && spread > 40;

                return (
                  <div key={i} className="py-2 border-b border-slate-50 last:border-0">
                    <div className="flex justify-between items-start gap-3">
                      <span className="text-[10px] font-black text-slate-500 pt-0.5 shrink-0">{r.degree.split(' ')[0]}</span>
                      <div className="flex-1 space-y-0.5 text-right">
                        <div className="flex justify-end gap-3 text-xs font-mono">
                          <span className="text-slate-400">exp {r.expectedFreq.toFixed(1)} Hz</span>
                          <span className={missed ? 'text-slate-400' : outOfRange ? 'text-amber-500 font-bold' : 'text-slate-600'}>
                            got {missed ? '—' : `${r.detectedFreq.toFixed(1)} Hz`}
                          </span>
                        </div>
                        {!missed && raw.length > 0 && (
                          <p className="text-xs font-mono text-slate-400">
                            range {minFreq.toFixed(0)}–{maxFreq.toFixed(0)} Hz
                            {isUnstable && <span className="ml-1 text-indigo-500"> · unstable</span>}
                          </p>
                        )}
                        {outOfRange && (
                          <p className="text-xs text-amber-500 font-bold">⚠ possible non-voice sound</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="mt-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/50">
                <p className="text-xs text-indigo-500 font-medium leading-relaxed">
                  <span className="font-black">Typical ranges —</span> Bass ~80–330 Hz · Tenor ~130–520 Hz · Alto ~170–700 Hz · Soprano ~250–1050 Hz
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard submission */}
        <div className="space-y-3 mt-auto pt-2">
          {!submitted ? (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add to Leaderboard</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onSubmitLeaderboard(name); setSubmitted(true); } }}
                  placeholder="Your name"
                  maxLength={20}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:bg-white transition-colors"
                />
                <button
                  onClick={() => { if (name.trim()) { onSubmitLeaderboard(name); setSubmitted(true); } }}
                  disabled={!name.trim()}
                  className="bg-indigo-600 text-white font-black px-5 py-3 rounded-xl btn-active disabled:opacity-30 text-sm transition-opacity"
                >
                  Submit
                </button>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="text-xs text-emerald-600 font-black">Added to leaderboard!</span>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={onRestart} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl btn-active text-sm">
              New Test
            </button>
            {(hasLeaderboardEntries || submitted) && (
              <button onClick={onViewLeaderboard} className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 font-black py-4 rounded-2xl btn-active text-sm">
                Leaderboard
              </button>
            )}
          </div>
        </div>

      </div>
    </PageWrapper>
  );
};
