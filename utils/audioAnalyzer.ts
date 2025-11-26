
import { Note } from '../types';

/**
 * Analyzes an audio buffer to detect beats and generate a note chart.
 * Uses a dynamic threshold algorithm to detect energy peaks (onsets).
 */
export const analyzeAudioAndGenerateNotes = async (
  audioBuffer: AudioBuffer, 
  level: number, // 1 to 10
  laneCount: number // 4, 5, or 7
): Promise<Note[]> => {
  const rawData = audioBuffer.getChannelData(0); // Use left channel
  const sampleRate = audioBuffer.sampleRate;
  
  // MAP LEVEL 1-10 to Sensitivity and Gap
  // PREVIOUS: Math.max(40, 600 - ((level - 1) * 62)); -> Resulted in ~40ms at Lv10 (Too dense)
  // NEW: 600 start, stepping down 50ms per level, floor at 120ms.
  // Lv1: 600ms, Lv5: 400ms, Lv10: 150ms.
  const minNoteGap = Math.max(120, 600 - ((level - 1) * 50));
  
  const sensitivity = Math.max(1.05, 2.8 - ((level - 1) * 0.19));

  // Chord Threshold
  let chordThreshold = 99;
  if (level >= 4) {
      chordThreshold = 3.5 - ((level - 4) * 0.35); 
  }

  const notes: Note[] = [];
  let noteId = 0;
  let lastNoteTime = 0;

  const bufferSize = 1024; 
  const audioLength = rawData.length;
  
  // Calculate energies
  const energies: number[] = [];
  for (let i = 0; i < audioLength; i += bufferSize) {
    let sum = 0;
    const end = Math.min(i + bufferSize, audioLength);
    for (let j = i; j < end; j++) {
      sum += rawData[j] * rawData[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    energies.push(rms);
  }

  const historySize = 43; 
  
  for (let i = 0; i < energies.length; i++) {
    const startHistory = Math.max(0, i - historySize);
    let sumHistory = 0;
    for (let h = startHistory; h < i; h++) {
      sumHistory += energies[h];
    }
    const averageEnergy = sumHistory / (i - startHistory || 1);
    const currentEnergy = energies[i];
    
    if (currentEnergy > averageEnergy * sensitivity && currentEnergy > 0.05) {
      const timeMs = (i * bufferSize / sampleRate) * 1000;

      if (timeMs - lastNoteTime > minNoteGap) {
        
        // Random lane logic
        const laneSeed = Math.floor((timeMs % 1000) / 1000 * laneCount);
        let laneIndex = laneSeed;

        // Ensure lane variety (Scattered feel)
        // Applied to ALL levels now to prevent jackhammers (same note spam)
        if (notes.length > 0 && notes[notes.length - 1].laneIndex === laneIndex) {
            laneIndex = (laneIndex + Math.floor(laneCount / 2)) % laneCount;
        }

        notes.push({
          id: noteId++,
          laneIndex: laneIndex,
          timestamp: timeMs,
          y: -10,
          hit: false,
          missed: false
        });

        // Chords (Double notes)
        if (currentEnergy > averageEnergy * chordThreshold) {
             const secondLane = (laneIndex + Math.floor(laneCount / 2) + 1) % laneCount;
             notes.push({
                id: noteId++,
                laneIndex: secondLane,
                timestamp: timeMs,
                y: -10,
                hit: false,
                missed: false
              });
        }
        
        // Triples (Level 10 Only - Massive impacts)
        if (level === 10 && currentEnergy > averageEnergy * 2.2) {
             const thirdLane = (laneIndex + 2) % laneCount;
             notes.push({
                id: noteId++,
                laneIndex: thirdLane,
                timestamp: timeMs,
                y: -10,
                hit: false,
                missed: false
              });
        }

        lastNoteTime = timeMs;
      }
    }
  }

  return notes;
};
