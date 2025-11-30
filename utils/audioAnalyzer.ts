
import { Note } from '../types';

/**
 * Analyzes an audio buffer to detect beats and generate a note chart.
 * Uses a dynamic threshold algorithm to detect energy peaks (onsets).
 * UPDATED: Includes Pattern Generator, Dynamic Density, and Rest Periods.
 */
export const analyzeAudioAndGenerateNotes = async (
  audioBuffer: AudioBuffer, 
  level: number, // 1 to 10
  laneCount: number, // 4, 5, or 7
  startOffset: number = 3000 // Delay before music starts (ms)
): Promise<Note[]> => {
  const rawData = audioBuffer.getChannelData(0); // Use left channel
  const sampleRate = audioBuffer.sampleRate;
  
  // 1. Difficulty Scaling Base Values
  let baseGap = Math.max(110, 550 - ((level - 1) * 45)); 
  
  // EASY MODE TWEAK
  if (level === 7) {
      baseGap = 450; 
  }

  const sensitivity = Math.max(1.02, 2.5 - ((level - 1) * 0.18));

  // Chord Threshold
  let chordThreshold = 99;
  if (level >= 4) {
      chordThreshold = 3.0 - ((level - 4) * 0.25); 
  }
  if (level === 7) chordThreshold = 999;

  const notes: Note[] = [];
  let noteId = 0;
  let lastNoteTime = -baseGap;

  const bufferSize = 1024; 
  const audioLength = rawData.length;
  
  // Calculate energies (RMS)
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

  // PATTERN SYSTEM STATE
  const patternState = {
    type: 'random' as 'random' | 'stream' | 'trill' | 'jack' | 'jump' | 'chaos',
    step: 0,
    direction: 1, 
    lastLane: Math.floor(laneCount / 2),
    notesSinceChange: 0
  };
  
  const getNextLane = () => {
      let next = 0;
      
      // Change pattern logic
      if (patternState.notesSinceChange > (2 + Math.random() * 4)) {
          patternState.notesSinceChange = 0;
          const rand = Math.random();
          
          if (level === 7) {
             if (rand < 0.2) patternState.type = 'stream';
             else patternState.type = 'random';
          } else {
             if (level >= 8 && rand < 0.10) patternState.type = 'stream'; 
             else if (level >= 8 && rand < 0.20) patternState.type = 'trill'; 
             else if (rand < 0.35) patternState.type = 'jack'; 
             else if (level >= 8 && rand < 0.70) patternState.type = 'jump'; 
             else patternState.type = 'chaos'; 
          }
          
          patternState.direction = Math.random() > 0.5 ? 1 : -1;
      }

      switch (patternState.type) {
          case 'stream':
              next = patternState.lastLane + patternState.direction;
              if (next >= laneCount) { next = laneCount - 2; patternState.direction = -1; }
              if (next < 0) { next = 1; patternState.direction = 1; }
              break;
          case 'trill':
              if (patternState.step % 2 === 0) next = patternState.lastLane + 1;
              else next = patternState.lastLane - 1;
              if (next >= laneCount) next = laneCount - 2;
              if (next < 0) next = 1;
              break;
          case 'jack':
              next = patternState.lastLane;
              if (patternState.notesSinceChange > 3) patternState.type = 'random';
              break;
          case 'jump':
              next = patternState.lastLane + (patternState.direction * 2);
              if (next >= laneCount || next < 0) {
                  patternState.direction *= -1;
                  next = patternState.lastLane + patternState.direction;
              }
              break;
          case 'chaos':
              next = Math.floor(Math.random() * laneCount);
              break;
          case 'random':
          default:
              const jump = Math.floor(Math.random() * 3) - 1; 
              next = patternState.lastLane + jump;
              break;
      }
      
      if (next < 0) next = 0;
      if (next >= laneCount) next = laneCount - 1;
      
      if (patternState.type !== 'jack' && patternState.type !== 'chaos' && next === patternState.lastLane) {
          next = (next + 1) % laneCount;
      }

      patternState.step++;
      patternState.notesSinceChange++;
      patternState.lastLane = next;
      return next;
  };

  const historySize = 43; 
  
  for (let i = 0; i < energies.length; i++) {
    const startHistory = Math.max(0, i - historySize);
    let sumHistory = 0;
    for (let h = startHistory; h < i; h++) {
      sumHistory += energies[h];
    }
    const averageEnergy = sumHistory / (i - startHistory || 1);
    const currentEnergy = energies[i];
    
    // --- FEATURE: QUIET SECTION DETECTION (REST) ---
    // If energy is low (relative to average), force skip
    // Increased threshold from 0.02 to 0.15 to catch verses/bridges
    if (currentEnergy < 0.15 * averageEnergy || currentEnergy < 0.02) {
        continue; 
    }

    // --- FEATURE: DYNAMIC DENSITY ---
    let dynamicGap = baseGap;
    const intensityRatio = currentEnergy / (averageEnergy || 0.01);
    
    if (intensityRatio > 1.5) dynamicGap = baseGap * 0.6; // Peak
    else if (intensityRatio < 0.8) dynamicGap = baseGap * 1.8; // Low intensity = Slower
    
    dynamicGap = Math.max(100, dynamicGap);

    // Beat Detection
    if (currentEnergy > averageEnergy * sensitivity && currentEnergy > 0.05) {
      const timeMs = ((i * bufferSize / sampleRate) * 1000) + startOffset;

      if (timeMs - lastNoteTime > dynamicGap) {
        
        // 1. Generate Main Note
        const laneIndex = getNextLane();

        notes.push({
          id: noteId++,
          laneIndex: laneIndex,
          timestamp: timeMs,
          y: -10,
          hit: false,
          missed: false
        });

        // 2. Chord Logic
        if (currentEnergy > averageEnergy * chordThreshold && patternState.type !== 'trill' && patternState.type !== 'jack') {
             let secondLane = (laneIndex + Math.floor(laneCount / 2)) % laneCount;
             if (secondLane === laneIndex) secondLane = (secondLane + 1) % laneCount;

             notes.push({
                id: noteId++,
                laneIndex: secondLane,
                timestamp: timeMs,
                y: -10,
                hit: false,
                missed: false
              });
        }
        
        // 3. Triple Logic
        if (level === 10 && currentEnergy > averageEnergy * 2.5) {
             const thirdLane = (laneIndex + 2) % laneCount;
             const existing = notes.filter(n => Math.abs(n.timestamp - timeMs) < 1);
             if (!existing.some(n => n.laneIndex === thirdLane)) {
                notes.push({
                    id: noteId++,
                    laneIndex: thirdLane,
                    timestamp: timeMs,
                    y: -10,
                    hit: false,
                    missed: false
                });
             }
        }

        lastNoteTime = timeMs;
      }
    }
  }

  return notes;
};
