
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];
const SCALE_DEGREE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Ti", "Do (Octave)"];

export function frequencyToNote(freq: number): string {
  if (freq <= 0) return "Unknown";
  const n = Math.round(12 * Math.log2(freq / 440) + 69);
  const octave = Math.floor(n / 12) - 1;
  const noteIndex = n % 12;
  const wrappedIndex = ((noteIndex % 12) + 12) % 12;
  return `${NOTE_NAMES[wrappedIndex]}${octave}`;
}

export function noteToFrequency(note: string): number {
  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return 440;
  const name = match[1];
  const octave = parseInt(match[2]);
  const noteIndex = NOTE_NAMES.indexOf(name);
  const n = noteIndex + (octave + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

export function calculateCents(detected: number, expected: number): number {
  if (detected <= 0 || expected <= 0) return 9999;
  return Math.round(1200 * Math.log2(detected / expected));
}

export function generateMajorScale(startFreq: number): { freq: number; note: string; degree: string }[] {
  return MAJOR_SCALE_INTERVALS.map((interval, i) => {
    const freq = startFreq * Math.pow(2, interval / 12);
    return {
      freq,
      note: frequencyToNote(freq),
      degree: SCALE_DEGREE_NAMES[i]
    };
  });
}

export function findBestFitScale(detectedFreqs: number[]): number {
  if (detectedFreqs.every(f => f <= 0)) return 130.81;

  let bestTonicFreq = 0;
  let minTotalError = Infinity;

  for (let midi = 36; midi <= 72; midi++) {
    const candidateTonicFreq = 440 * Math.pow(2, (midi - 69) / 12);
    const candidateScale = MAJOR_SCALE_INTERVALS.map(interval => 
      candidateTonicFreq * Math.pow(2, interval / 12)
    );

    let totalError = 0;
    for (let i = 0; i < 8; i++) {
      if (detectedFreqs[i] > 0) {
        const cents = Math.abs(1200 * Math.log2(detectedFreqs[i] / candidateScale[i]));
        totalError += cents;
      } else {
        totalError += 200; 
      }
    }

    if (totalError < minTotalError) {
      minTotalError = totalError;
      bestTonicFreq = candidateTonicFreq;
    }
  }

  return bestTonicFreq;
}

export function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0;

  let r1 = 0, r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buffer[i]) < threshold) { r1 = i; break; } }
  for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; } }

  const croppedBuffer = buffer.slice(r1, r2);
  const croppedSize = croppedBuffer.length;
  if (croppedSize < 2) return 0;

  const correlations = new Float32Array(croppedSize);
  for (let i = 0; i < croppedSize; i++) {
    for (let j = 0; j < croppedSize - i; j++) {
      correlations[i] = correlations[i] + croppedBuffer[j] * croppedBuffer[j + i];
    }
  }

  let d = 0;
  while (correlations[d] > correlations[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < croppedSize; i++) {
    if (correlations[i] > maxval) { maxval = correlations[i]; maxpos = i; }
  }

  if (maxpos < 1) return 0;
  let T0 = maxpos;
  const x1 = correlations[T0 - 1], x2 = correlations[T0], x3 = correlations[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

export function getMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const filtered = values.filter(v => v > 0);
  if (filtered.length === 0) return 0;
  filtered.sort((a, b) => a - b);
  const half = Math.floor(filtered.length / 2);
  if (filtered.length % 2) return filtered[half];
  return (filtered[half - 1] + filtered[half]) / 2.0;
}

// Add normalPDF for voice distribution visualization by calculating the probability density function for a normal distribution.
export function normalPDF(x: number, mean: number, stdDev: number): number {
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
}
