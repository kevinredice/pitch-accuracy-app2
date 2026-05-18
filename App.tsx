
import React, { useState, useRef } from 'react';
import { AppState, AnalysisSummary, PitchResult, LeaderboardEntry } from './types';
import {
  frequencyToNote,
  generateMajorScale,
  detectPitch,
  getMedian,
  calculateCents,
  findBestFitScale
} from './utils/pitch';

// Sub-components
import { StartView } from './components/views/StartView';
import { SingingView } from './components/views/SingingView';
import { ResultsView } from './components/views/ResultsView';
import { LeaderboardView } from './components/views/LeaderboardView';

const LEADERBOARD_KEY = 'pitch-leaderboard';

function loadEntries(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function App() {
  const [state, setState] = useState<AppState>('START');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(loadEntries);
  
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
      if (audioContextRef.current) return true;
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
      audioContextRef.current = null;
    }
    cancelAnimationFrame(frameRef.current);
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
      setTimer(Math.ceil(remaining / 1000));
      setPrepProgress((remaining / prepDuration) * 100);
      if (elapsed < prepDuration) frameRef.current = requestAnimationFrame(tick);
      else startSinging();
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
      if (freq > 0) recordingDataRef.current.push({ timestamp: elapsed, freq });
      
      const noteIdx = Math.min(Math.floor(elapsed / noteDuration), 7);
      const currentSegmentElapsed = elapsed % noteDuration;
      
      setCurrentScaleIndex(noteIdx);
      setSegmentProgress((currentSegmentElapsed / noteDuration) * 100);
      setTimer(Math.ceil((totalDuration - elapsed) / 1000));
      
      if (elapsed < totalDuration) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        analyzeResults();
      }
    };
    frameRef.current = requestAnimationFrame(tick);
  };

  const analyzeResults = () => {
    const segments = Array.from({ length: 8 }, (_, i) => {
      const startTime = i * noteDuration;
      const endTime = (i + 1) * noteDuration;
      const freqs = recordingDataRef.current
        .filter(d => d.timestamp >= startTime + 150 && d.timestamp <= endTime - 150)
        .map(d => d.freq);
      return { freqs, median: freqs.length < 10 ? 0 : getMedian(freqs) };
    });

    const detectedFreqs = segments.map(s => s.median);
    const targetTonic = findBestFitScale(detectedFreqs);
    const expectedScale = generateMajorScale(targetTonic);

    const pitchResults: PitchResult[] = expectedScale.map((expected, i) => {
      const medianFreq = segments[i].median;
      const cents = calculateCents(medianFreq, expected.freq);
      return {
        degree: expected.degree,
        expectedNote: expected.note,
        expectedFreq: expected.freq,
        detectedFreq: medianFreq,
        rawFrequencies: segments[i].freqs,
        note: frequencyToNote(medianFreq),
        centsOff: cents,
        isAccurate: medianFreq > 0 && Math.abs(cents) <= 25
      };
    });

    setResults({
      referenceNote: frequencyToNote(targetTonic),
      results: pitchResults,
      accurateNotes: pitchResults.filter(r => r.isAccurate).map(r => r.expectedNote),
      accuracyScore: pitchResults.filter(r => r.isAccurate).length / 8
    });

    setState('RESULTS');
    stopAudio();
  };

  const handleSubmitToLeaderboard = (name: string) => {
    if (!results) return;
    const entry: LeaderboardEntry = {
      name: name.trim(),
      score: Math.round(results.accuracyScore * 100),
      scalesCompleted: results.accurateNotes.length,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isUser: true,
    };
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score);
    setLeaderboard(updated);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated.map(e => ({ ...e, isUser: false }))));
    setState('LEADERBOARD');
  };

  const handleRestart = () => {
    stopAudio();
    setState('START');
    setResults(null);
    setError(null);
  };

  return (
    <>
      {state === 'START' && (
        <StartView onStart={() => setState('READY')} error={error} />
      )}
      
      {(state === 'READY' || state === 'PREPARING' || state === 'SINGING_SCALE' || state === 'PAUSED') && (
        <SingingView 
          state={state}
          timer={timer}
          prepProgress={prepProgress}
          currentScaleIndex={currentScaleIndex}
          segmentProgress={segmentProgress}
          onStartPrep={startPreparation}
          onPause={() => { cancelAnimationFrame(frameRef.current); setState('PAUSED'); }}
          onResume={() => { setState('SINGING_SCALE'); runRecordingLoop(); }}
          onRestart={handleRestart}
          onCancel={() => setState('START')}
        />
      )}

      {state === 'RESULTS' && results && (
        <ResultsView
          results={results}
          onRestart={handleRestart}
          onSubmitLeaderboard={handleSubmitToLeaderboard}
          onViewLeaderboard={() => setState('LEADERBOARD')}
          hasLeaderboardEntries={leaderboard.length > 0}
        />
      )}

      {state === 'LEADERBOARD' && (
        <LeaderboardView entries={leaderboard} onRestart={handleRestart} />
      )}
    </>
  );
}
