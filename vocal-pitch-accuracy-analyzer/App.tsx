
import React, { useState, useEffect, useRef } from 'react';
import { AppState, AnalysisSummary, PitchResult } from './types';
import { 
  frequencyToNote, 
  generateMajorScale, 
  detectPitch, 
  getMedian, 
  calculateCents,
  noteToFrequency,
  findBestFitScale
} from './utils/pitch';

// --- Sub-components ---

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-12 transition-all duration-500 border border-slate-100 relative text-slate-900">
      {children}
    </div>
  </div>
);

const ScaleDegreeRing: React.FC<{ active: boolean; completed: boolean; label: string; progress: number }> = ({ active, completed, label, progress }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
        {active && (
          <circle 
            cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" 
            className="text-indigo-600 transition-all duration-100"
            strokeDasharray="100 100"
            strokeDashoffset={100 - progress}
            pathLength="100"
          />
        )}
      </svg>
      <div 
        className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          active ? 'bg-indigo-600 text-white shadow-lg' : completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border-2 border-slate-100'
        }`}
      >
        <span className="text-[10px] md:text-xs font-bold uppercase">{label === 'Do (Octave)' ? 'Do' : label}</span>
      </div>
    </div>
  </div>
);

const InfoTooltip: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  width?: string;
  direction?: 'up' | 'down'
}> = ({ title, children, width = "w-64", direction = 'up' }) => {
  const isUp = direction === 'up';
  
  return (
    <div className="relative inline-block group ml-1 align-middle">
      <span className="cursor-help inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold hover:bg-slate-300 transition-colors">?</span>
      <div className={`absolute left-1/2 -translate-x-1/2 ${isUp ? 'bottom-full mb-2' : 'top-full mt-2'} ${width} p-3 bg-slate-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-50 text-left normal-case tracking-normal`}>
        <p className="font-bold mb-1 text-indigo-400">{title}</p>
        <div className="leading-relaxed text-slate-300 font-normal">
          {children}
        </div>
        <div className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${isUp ? 'top-full border-t-slate-900' : 'bottom-full border-b-slate-900'}`}></div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>('START');
  const [error, setError] = useState<string | null>(null);
  
  const [results, setResults] = useState<AnalysisSummary | null>(null);
  const [timer, setTimer] = useState(0);
  const [prepProgress, setPrepProgress] = useState(100);
  const [currentScaleIndex, setCurrentScaleIndex] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const recordingDataRef = useRef<{ timestamp: number; freq: number }[]>([]);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const totalDuration = 12000;
  const noteDuration = 1500;

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioContextRef.current = new AudioContextClass();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 2048;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      return true;
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permissions.");
      return false;
    }
  };

  const stopAudio = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    cancelAnimationFrame(frameRef.current);
  };

  const enterTest = () => {
    setState('READY');
  };

  const startPreparation = async () => {
    const success = await initAudio();
    if (!success) return;
    setState('PREPARING');
    
    const prepDuration = 3000;
    const startTime = Date.now();
    
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, prepDuration - elapsed);
      const seconds = Math.ceil(remaining / 1000);
      const progress = (remaining / prepDuration) * 100;
      
      setTimer(seconds);
      setPrepProgress(progress);
      
      if (elapsed < prepDuration) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        startSinging();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const startSinging = () => {
    setState('SINGING_SCALE');
    recordingDataRef.current = [];
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    runRecordingLoop();
  };

  const runRecordingLoop = () => {
    const tick = () => {
      if (!analyzerRef.current || !audioContextRef.current) return;
      
      const elapsed = (Date.now() - startTimeRef.current) - pausedTimeRef.current;
      const buffer = new Float32Array(analyzerRef.current.fftSize);
      analyzerRef.current.getFloatTimeDomainData(buffer);
      const freq = detectPitch(buffer, audioContextRef.current.sampleRate);
      
      if (freq > 0) {
        recordingDataRef.current.push({ timestamp: elapsed, freq });
      }

      const noteIdx = Math.min(Math.floor(elapsed / noteDuration), 7);
      const currentSegmentElapsed = elapsed % noteDuration;
      
      setCurrentScaleIndex(noteIdx);
      setSegmentProgress((currentSegmentElapsed / noteDuration) * 100);
      setTimer(Math.ceil((totalDuration - elapsed) / 1000));

      if (elapsed < totalDuration) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        analyzeFinalResults();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const handlePause = () => {
    cancelAnimationFrame(frameRef.current);
    pausedTimeRef.current += (Date.now() - startTimeRef.current);
    setState('PAUSED');
  };

  const handleResume = () => {
    startTimeRef.current = Date.now();
    setState('SINGING_SCALE');
    runRecordingLoop();
  };

  const handleRestart = () => {
    stopAudio();
    setState('START');
    setResults(null);
  };

  const analyzeFinalResults = () => {
    // 1. Extract 8 median frequencies for the sung segments
    const detectedFreqs = Array.from({ length: 8 }, (_, i) => {
      const startTime = i * noteDuration;
      const endTime = (i + 1) * noteDuration;
      // Filter recording data for this window, with small margin
      const segmentData = recordingDataRef.current
        .filter(d => d.timestamp >= startTime + 150 && d.timestamp <= endTime - 150)
        .map(d => d.freq);
      
      return getMedian(segmentData);
    });

    // 2. Find the best standard scale (C2 to C5) that fits these notes
    const bestTonicFreq = findBestFitScale(detectedFreqs);
    
    if (bestTonicFreq === 0) {
      setError("Analysis failed. We couldn't detect clear notes throughout the scale.");
      setState('START');
      return;
    }

    const bestTonicNote = frequencyToNote(bestTonicFreq);
    const expectedScale = generateMajorScale(bestTonicFreq);
    
    const finalResults: PitchResult[] = expectedScale.map((expected, i) => {
      const medianFreq = detectedFreqs[i];
      const cents = calculateCents(medianFreq, expected.freq);
      return {
        degree: expected.degree,
        expectedNote: expected.note,
        expectedFreq: expected.freq,
        detectedFreq: medianFreq,
        note: frequencyToNote(medianFreq),
        centsOff: cents,
        isAccurate: Math.abs(cents) <= 25
      };
    });

    setResults({
      referenceNote: bestTonicNote,
      results: finalResults,
      accurateNotes: finalResults.filter(r => r.isAccurate).map(r => r.expectedNote),
      accuracyScore: finalResults.filter(r => r.isAccurate).length / 8
    });
    setState('RESULTS');
    stopAudio();
  };

  // --- Views ---

  const scaleNames = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do"];

  if (state === 'START') {
    return (
      <PageWrapper>
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-indigo-600 text-white mb-2 shadow-xl rotate-[35deg] transition-transform hover:rotate-[40deg]">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 leading-tight">Vocal Pitch Analyzer</h1>
          <div className="bg-slate-50 p-6 rounded-2xl text-left space-y-4 border border-slate-100">
            <h3 className="font-bold text-slate-800">What's about to happen:</h3>
            <ul className="text-slate-600 space-y-2 text-sm">
              <li className="flex gap-3">
                <span className="bg-indigo-100 text-indigo-600 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center font-bold">1</span>
                <span>You'll sing: <br /><b>Do - Re - Mi - Fa - Sol - La - Ti - Do</b> continuously.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-indigo-100 text-indigo-600 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center font-bold">2</span>
                <span>Hold each note for <b>1.5 seconds</b>. We'll show you when to switch.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-indigo-100 text-indigo-600 w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center font-bold">3</span>
                <span>Our AI finds your "best fit" scale automatically!</span>
              </li>
            </ul>
          </div>
          <button 
            onClick={enterTest}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 text-lg"
          >
            Enter Test
          </button>
          {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">{error}</p>}
        </div>
      </PageWrapper>
    );
  }

  if (state === 'READY' || state === 'PREPARING') {
    const isPreparing = state === 'PREPARING';
    return (
      <PageWrapper>
        <div className="text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">{isPreparing ? 'Get Ready...' : 'Prepare to Sing'}</h2>
            <p className="text-slate-500 text-sm px-4">
              {isPreparing 
                ? 'Deep breath. Recording starts in...' 
                : "Review the sequence. Once you click start, you'll have 3 seconds before recording. Hold each note for 1.5 seconds."}
            </p>
          </div>
          
          <div className="grid grid-cols-4 gap-4 py-6 border-y border-slate-50">
            {scaleNames.map((name, i) => (
              <ScaleDegreeRing 
                key={i} 
                label={name} 
                active={false} 
                completed={false}
                progress={0}
              />
            ))}
          </div>

          <div className="space-y-4 flex flex-col items-center justify-center min-h-[160px]">
            {!isPreparing ? (
              <div className="w-full space-y-4">
                <button 
                  onClick={startPreparation}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg active:scale-95 text-lg"
                >
                  Start Test
                </button>
                <button 
                  onClick={() => setState('START')}
                  className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle 
                    cx="50%" cy="50%" r="45%" 
                    stroke="currentColor" strokeWidth="6" fill="transparent" 
                    className="text-slate-100" 
                  />
                  <circle 
                    cx="50%" cy="50%" r="45%" 
                    stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="transparent" 
                    className="text-indigo-600 transition-all duration-75 ease-linear"
                    strokeDasharray="100 100"
                    strokeDashoffset={100 - prepProgress}
                    pathLength="100"
                  />
                </svg>
                <span className="text-5xl font-black text-indigo-600 tabular-nums">
                  {timer}
                </span>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (state === 'SINGING_SCALE' || state === 'PAUSED') {
    return (
      <PageWrapper>
        <div className="text-center space-y-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Singing Scale</h2>
            <div className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500 mono">{timer}s Left</div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 py-4">
            {scaleNames.map((name, i) => (
              <ScaleDegreeRing 
                key={i} 
                label={name} 
                active={currentScaleIndex === i && state !== 'PAUSED'} 
                completed={currentScaleIndex > i}
                progress={currentScaleIndex === i ? segmentProgress : 0}
              />
            ))}
          </div>

          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
            <span className="text-6xl font-black text-indigo-600 mono block animate-bounce">
              {state === 'PAUSED' ? 'PAUSED' : scaleNames[currentScaleIndex]}
            </span>
            <p className="text-slate-400 mt-4 text-sm font-medium">Hold for 1.5s!</p>
          </div>

          <div className="flex gap-4">
            {state === 'SINGING_SCALE' ? (
              <button onClick={handlePause} className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors">Pause</button>
            ) : (
              <button onClick={handleResume} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-colors">Resume</button>
            )}
            <button onClick={handleRestart} className="flex-1 bg-white border-2 border-slate-100 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-colors">Restart</button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (state === 'RESULTS' && results) {
    const scorePct = Math.round(results.accuracyScore * 100);
    return (
      <PageWrapper>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Scale Accuracy</h2>
            <div className={`text-6xl font-black ${scorePct >= 75 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {scorePct}%
            </div>
            <div className="flex flex-col gap-1 items-center justify-center mt-2 text-slate-500">
              <div className="flex items-center">
                <span>Best Fit Scale: <b>{results.referenceNote} Major</b></span>
                <InfoTooltip title="How did we choose this?">
                  We analyzed all 8 notes you sang and found the standard Major scale that minimizes your total pitch deviation. We detected your intended key was <span className="text-indigo-400 font-bold">{results.referenceNote}</span>.
                </InfoTooltip>
              </div>
              <div className="flex items-center text-xs">
                <span>Major Scale Structure</span>
                <InfoTooltip title="The Major Scale Pattern" width="w-72" direction="down">
                  A Major scale consists of <b>7 unique notes</b> following a pattern of semitones. 
                  <br /><br />
                  The test includes an 8th note (the octave) to complete the sequence:
                  <div className="mt-2 font-mono text-indigo-400 font-bold">W - W - H - W - W - W - H</div>
                  <div className="mt-1 opacity-80">(W = 2 semitones, H = 1 semitone)</div>
                </InfoTooltip>
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {results.results.map((r, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${r.isAccurate ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.isAccurate ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                    {r.isAccurate ? '✓' : '✗'}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 flex items-center">
                      {r.degree} 
                      <span className="text-slate-400 text-xs ml-1 font-normal">({r.expectedNote})</span>
                    </div>
                    {!r.isAccurate && (
                      <div className="text-[10px] font-medium text-rose-400 uppercase tracking-tight flex items-center">
                        {r.centsOff > 0 ? `Sharp (+${r.centsOff}¢)` : `Flat (${r.centsOff}¢)`}
                        <InfoTooltip title="What are cents?" direction="down">
                          A <b>cent</b> is 1/100th of a semitone. It's used to measure tiny deviations in pitch. We mark you accurate if you're within <b>±25 cents</b> of the target note. 
                        </InfoTooltip>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`mono font-black ${r.isAccurate ? 'text-emerald-600' : 'text-rose-400'}`}>
                    {r.note === "Unknown" ? "---" : r.note}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleRestart}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg text-lg"
          >
            Try Again
          </button>
        </div>
      </PageWrapper>
    );
  }

  return null;
}
