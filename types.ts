
// Updated AppState to include speaking and leaderboard states, and added missing result interfaces.
export type AppState = 'START' | 'READY' | 'PREPARING' | 'SINGING_SCALE' | 'PAUSED' | 'RESULTS' | 'SPEAKING_VOICE' | 'SPEAKING_RECORDING' | 'SPEAKING_RESULTS' | 'LEADERBOARD';

export interface PitchResult {
  degree: string;
  expectedNote: string;
  expectedFreq: number;
  detectedFreq: number;
  rawFrequencies: number[];
  note: string;
  centsOff: number;
  isAccurate: boolean;
}

export interface AnalysisSummary {
  referenceNote: string;
  results: PitchResult[];
  accurateNotes: string[];
  accuracyScore: number;
}

export interface SpeakingResult {
  medianFreq: number;
  note: string;
  classification: string;
  malePercentile: number;
  femalePercentile: number;
  semitonesFromSinging: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  scalesCompleted: number;
  date: string;
  isUser?: boolean;
}
