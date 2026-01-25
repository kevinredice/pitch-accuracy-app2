
export type AppState = 'START' | 'READY' | 'PREPARING' | 'SINGING_SCALE' | 'PAUSED' | 'RESULTS';

export interface PitchResult {
  degree: string;
  expectedNote: string;
  expectedFreq: number;
  detectedFreq: number;
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
