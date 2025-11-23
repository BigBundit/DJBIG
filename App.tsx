
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Note as NoteType, 
  ScoreRating, 
  GameStatus,
  HitEffectData,
  LaneConfig
} from './types';
import { 
  LANE_CONFIGS_4,
  LANE_CONFIGS_5,
  LANE_CONFIGS_7,
  BASE_FALL_SPEED_MS
} from './constants';
import { ScoreBoard } from './components/ScoreBoard';
import { Lane } from './components/Lane';
import { EndScreen } from './components/EndScreen';
import { Note } from './components/Note';
import { PauseMenu } from './components/PauseMenu';
import { HitEffect } from './components/HitEffect';
import { analyzeAudioAndGenerateNotes } from './utils/audioAnalyzer';

const audioCtxRef = { current: null as AudioContext | null };

const App: React.FC = () => {
  // Game State
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [missCount, setMissCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string; id: number } | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  
  // Visual Effects State
  const [hitEffects, setHitEffects] = useState<HitEffectData[]>([]);

  // Local Video State
  const [localVideoSrc, setLocalVideoSrc] = useState<string>('');
  const [localFileName, setLocalFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedNotes, setAnalyzedNotes] = useState<NoteType[] | null>(null);

  const [level, setLevel] = useState<number>(5); // Level 1-10
  const [speedMod, setSpeedMod] = useState<number>(2.0); // Default 2x speed
  
  // Key Mode State
  const [keyMode, setKeyMode] = useState<4 | 5 | 7>(7);

  // Derived Config
  const activeLaneConfig: LaneConfig[] = useMemo(() => {
      if (keyMode === 4) return LANE_CONFIGS_4;
      if (keyMode === 5) return LANE_CONFIGS_5;
      return LANE_CONFIGS_7;
  }, [keyMode]);

  // Engine State (Refs for performance)
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const totalPauseDurationRef = useRef<number>(0);
  
  const notesRef = useRef<NoteType[]>([]);
  const activeKeysRef = useRef<boolean[]>(new Array(7).fill(false)); // Max 7
  const videoRef = useRef<HTMLVideoElement>(null); // Ref for local video
  const audioBufferRef = useRef<AudioBuffer | null>(null); // Ref to store raw audio for re-analysis
  
  // Touch Input State
  const laneContainerRef = useRef<HTMLDivElement>(null);
  const touchedLanesRef = useRef<Set<number>>(new Set());

  // Visual State for React Render
  const [renderNotes, setRenderNotes] = useState<NoteType[]>([]);

  // Memoized Particles for Anime Background
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      size: `${2 + Math.random() * 4}px`
    }));
  }, []);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const performAnalysis = async (buffer: AudioBuffer) => {
      setIsAnalyzing(true);
      try {
        const notes = await analyzeAudioAndGenerateNotes(buffer, level, keyMode);
        setAnalyzedNotes(notes);
        console.log(`Analysis complete. Level: ${level}, Keys: ${keyMode}, Notes: ${notes.length}`);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (localVideoSrc) URL.revokeObjectURL(localVideoSrc);
      const url = URL.createObjectURL(file);
      setLocalVideoSrc(url);
      setLocalFileName(file.name);
      setAnalyzedNotes(null); // Reset previous analysis
      
      try {
        setIsAnalyzing(true);
        const arrayBuffer = await file.arrayBuffer();
        const ctx = initAudio();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer; // Store for later re-use
        
        await performAnalysis(audioBuffer);
      } catch (error) {
        console.error("Audio decode failed", error);
        alert("Could not analyze audio file.");
        setIsAnalyzing(false);
      }
    }
  };

  // Re-analyze when level or key mode changes
  useEffect(() => {
    if (audioBufferRef.current && !isAnalyzing) {
       // Debounce slightly to prevent flicker if user clicks fast
       const timeoutId = setTimeout(() => {
           if (audioBufferRef.current) {
               performAnalysis(audioBufferRef.current);
           }
       }, 100);
       return () => clearTimeout(timeoutId);
    }
  }, [level, keyMode]);

  // Generate white noise buffer for snares/hats
  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2.0; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playHitSound = (laneIndex: number) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    // Adapt sound to key mode. 
    // Logic: Center key or space is kick. Outer is hi-hat. Middle is snare.
    let isKick = false;
    let isSnare = false;

    if (keyMode === 5 && laneIndex === 2) isKick = true;
    else if (keyMode === 7 && laneIndex === 3) isKick = true;
    else if (keyMode === 4 && (laneIndex === 1 || laneIndex === 2)) isSnare = true; // Inner keys snare
    else if ((keyMode === 5 || keyMode === 7) && (laneIndex % 2 !== 0)) isSnare = true;

    if (isKick) {
      // KICK DRUM
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
      gain.gain.setValueAtTime(0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (isSnare) {
      // SNARE / CLAP
      const noiseBuffer = createNoiseBuffer(ctx);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(250, t);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.2, t);
      oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      noise.start(t);
      osc.start(t);
      noise.stop(t + 0.2);
      osc.stop(t + 0.2);
    } else {
      // HI-HAT
      const noiseBuffer = createNoiseBuffer(ctx);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 5000;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.05); // Short decay

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start(t);
      noise.stop(t + 0.05);
    }
  };

  const playOutroSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;
    
    // --- DRUM & CYMBAL OUTRO (3 Seconds) ---
    const playDrum = (type: 'kick' | 'snare' | 'tom' | 'crash', startTime: number, intensity: number = 1.0) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'kick') {
            osc.frequency.setValueAtTime(150, startTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            gain.gain.setValueAtTime(1.0 * intensity, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.5);
        } else if (type === 'snare') {
            const noise = ctx.createBufferSource();
            noise.buffer = createNoiseBuffer(ctx);
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 800;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.8 * intensity, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(startTime);
            noise.stop(startTime + 0.2);
            
            const tone = ctx.createOscillator();
            tone.type = 'triangle';
            tone.frequency.setValueAtTime(180, startTime);
            const toneGain = ctx.createGain();
            toneGain.gain.setValueAtTime(0.4 * intensity, startTime);
            toneGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            tone.connect(toneGain);
            toneGain.connect(ctx.destination);
            tone.start(startTime);
            tone.stop(startTime + 0.2);
        } else if (type === 'tom') {
             osc.frequency.setValueAtTime(200, startTime);
             osc.frequency.exponentialRampToValueAtTime(60, startTime + 0.3);
             gain.gain.setValueAtTime(0.7 * intensity, startTime);
             gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
             osc.connect(gain);
             gain.connect(ctx.destination);
             osc.start(startTime);
             osc.stop(startTime + 0.4);
        } else if (type === 'crash') {
            const noise = ctx.createBufferSource();
            noise.buffer = createNoiseBuffer(ctx);
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(1.0 * intensity, startTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, startTime + 2.5); // Long decay
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(startTime);
            noise.stop(startTime + 3.0);
            playDrum('kick', startTime, intensity);
        }
    };

    let ct = t;
    const beat = 0.15; 
    playDrum('snare', ct); ct += beat;
    playDrum('snare', ct); ct += beat;
    playDrum('tom', ct); ct += beat;
    playDrum('tom', ct); ct += beat;
    playDrum('snare', ct); ct += beat/2;
    playDrum('snare', ct); ct += beat/2;
    playDrum('kick', ct); ct += beat;
    playDrum('crash', ct); 
    playDrum('snare', ct);
    ct += 0.2;
    playDrum('crash', ct, 1.2); 
  };

  // Toggle Pause
  const togglePause = useCallback(() => {
    if (status === GameStatus.PLAYING) {
        setStatus(GameStatus.PAUSED);
        pauseTimeRef.current = performance.now();
        if (videoRef.current) videoRef.current.pause();
    } else if (status === GameStatus.PAUSED) {
        setStatus(GameStatus.PLAYING);
        const pauseDuration = performance.now() - pauseTimeRef.current;
        totalPauseDurationRef.current += pauseDuration;
        if (videoRef.current) videoRef.current.play().catch(() => {});
        initAudio(); 
    }
  }, [status]);

  // Handle Outro Transition
  const triggerOutro = useCallback(() => {
      setStatus(GameStatus.OUTRO);
      initAudio(); 
      playOutroSound();
       if (videoRef.current) videoRef.current.pause();
      setTimeout(() => setStatus(GameStatus.FINISHED), 3000);
  }, []);

  // CORE GAME LOGIC
  const triggerLane = useCallback((laneIndex: number) => {
    if (status !== GameStatus.PLAYING || isAutoPlay) return; 

    if (activeKeysRef.current[laneIndex]) return;
    activeKeysRef.current[laneIndex] = true;

    const now = performance.now();
    const elapsed = now - startTimeRef.current - totalPauseDurationRef.current;
    
    const notesInLane = notesRef.current.filter(n => n.laneIndex === laneIndex && !n.hit && !n.missed);
    notesInLane.sort((a, b) => b.y - a.y);
    const targetNote = notesInLane[0];

    // HIT LOGIC
    if (targetNote) {
        const dist = Math.abs(targetNote.y - 90);
        let hitType: ScoreRating | null = null;

        if (dist < 4) hitType = ScoreRating.PERFECT;
        else if (dist < 10) hitType = ScoreRating.GOOD;
        else if (dist < 18) hitType = ScoreRating.BAD;

        if (hitType !== null) {
            targetNote.hit = true;
            playHitSound(laneIndex);

            const newEffect: HitEffectData = {
                id: Date.now() + Math.random(),
                laneIndex: laneIndex,
                rating: hitType,
                timestamp: now
            };
            setHitEffects(prev => [...prev, newEffect]);
            
            if (hitType === ScoreRating.PERFECT) {
                setScore(s => s + 100 + (combo > 10 ? 10 : 0));
                setHealth(h => Math.min(100, h + 0.5));
                setFeedback({ text: "MAX 100%", color: "text-cyan-300", id: Date.now() });
            } else if (hitType === ScoreRating.GOOD) {
                setScore(s => s + 50);
                setFeedback({ text: "90%", color: "text-green-400", id: Date.now() });
            } else {
                setScore(s => s + 10);
                setCombo(0);
                setFeedback({ text: "10%", color: "text-yellow-400", id: Date.now() });
            }

            if (hitType !== ScoreRating.BAD) {
                setCombo(c => {
                    const newC = c + 1;
                    if (newC > maxCombo) setMaxCombo(newC);
                    setMaxCombo(prev => Math.max(prev, newC));
                    return newC;
                });
            }
        }
    } else {
        playHitSound(laneIndex);
    }
  }, [status, isAutoPlay, combo, maxCombo]);

  const releaseLane = useCallback((laneIndex: number) => {
    activeKeysRef.current[laneIndex] = false;
  }, []);

  // Touch Event Handler
  const handleTouch = useCallback((e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    if (!laneContainerRef.current) return;
    
    const rect = laneContainerRef.current.getBoundingClientRect();
    const laneWidth = rect.width / keyMode; // Use dynamic keyMode
    const currentTouchLanes = new Set<number>();

    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            const laneIndex = Math.floor(x / laneWidth);
            if (laneIndex >= 0 && laneIndex < keyMode) {
                currentTouchLanes.add(laneIndex);
            }
        }
    }

    currentTouchLanes.forEach(laneIdx => {
        if (!touchedLanesRef.current.has(laneIdx)) triggerLane(laneIdx);
    });

    touchedLanesRef.current.forEach(laneIdx => {
        if (!currentTouchLanes.has(laneIdx)) releaseLane(laneIdx);
    });

    touchedLanesRef.current = currentTouchLanes;

  }, [triggerLane, releaseLane, keyMode]);

  // Game Loop
  const update = useCallback(() => {
    if (status !== GameStatus.PLAYING) return;

    const now = performance.now();
    const elapsed = now - startTimeRef.current - totalPauseDurationRef.current;
    
    const missThreshold = 115; 
    const currentFallSpeed = BASE_FALL_SPEED_MS / speedMod;

    notesRef.current.forEach(note => {
      const timeSinceSpawn = elapsed - note.timestamp;
      const position = (timeSinceSpawn / currentFallSpeed) * 90;
      note.y = position;

      // AUTO PLAY
      if (isAutoPlay && !note.hit && !note.missed && position >= 90) {
          note.hit = true;
          activeKeysRef.current[note.laneIndex] = true;
          setTimeout(() => {
               activeKeysRef.current[note.laneIndex] = false;
          }, 50);

          playHitSound(note.laneIndex);
          
          const newEffect: HitEffectData = {
                id: Date.now() + Math.random(),
                laneIndex: note.laneIndex,
                rating: ScoreRating.PERFECT,
                timestamp: now
            };
          setHitEffects(prev => [...prev, newEffect]);
          setScore(s => s + 100 + (combo > 10 ? 10 : 0));
          setHealth(h => Math.min(100, h + 0.5));
          setFeedback({ text: "AUTO", color: "text-cyan-300", id: Date.now() });
          setCombo(c => {
                const newC = c + 1;
                if (newC > maxCombo) setMaxCombo(newC);
                setMaxCombo(prev => Math.max(prev, newC));
                return newC;
          });
      }

      if (!note.hit && !note.missed && position > missThreshold) {
        note.missed = true;
        setMissCount(c => c + 1);
        setCombo(0);
        setHealth(h => Math.max(0, h - 4));
        setFeedback({ text: "MISS", color: "text-red-500", id: Date.now() });
      }
    });

    const visibleNotes = notesRef.current.filter(n => n.y > -20 && n.y < 120 && !n.hit);
    setRenderNotes([...visibleNotes]); 

    if (health <= 0) {
      triggerOutro();
      return;
    }
    
    setHitEffects(prev => prev.filter(e => Date.now() - e.id < 500));

    frameRef.current = requestAnimationFrame(update);
  }, [status, health, speedMod, isAutoPlay, combo, maxCombo, triggerOutro]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      frameRef.current = requestAnimationFrame(update);
      if (videoRef.current) {
        videoRef.current.play().catch(e => console.error("Local video play error", e));
      }
    }
    return () => cancelAnimationFrame(frameRef.current);
  }, [status, update]);

  // Input Handling
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (status === GameStatus.MENU) return;
    
    if (e.key === 'F1') {
        e.preventDefault();
        setSpeedMod(prev => Math.max(1.0, prev - 0.5));
        setFeedback({ text: "SPEED DOWN", color: "text-white", id: Date.now() });
    }
    if (e.key === 'F2') {
        e.preventDefault();
        setSpeedMod(prev => Math.min(10.0, prev + 0.5));
        setFeedback({ text: "SPEED UP", color: "text-white", id: Date.now() });
    }
    if (e.key === 'F4') {
        e.preventDefault();
        setIsAutoPlay(prev => !prev);
        setFeedback({ text: isAutoPlay ? "AUTO OFF" : "AUTO ON", color: "text-fuchsia-400", id: Date.now() });
    }
    if (e.key === 'F9') {
        e.preventDefault();
        triggerOutro();
        return;
    }
    
    if (e.key === 'Escape') {
        togglePause();
        return;
    }

    // Look up key in active config
    const laneIndex = activeLaneConfig.findIndex(l => l.key === e.key.toLowerCase());
    if (laneIndex !== -1) {
        triggerLane(laneIndex);
    }
  }, [status, triggerLane, triggerOutro, togglePause, isAutoPlay, activeLaneConfig]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const laneIndex = activeLaneConfig.findIndex(l => l.key === e.key.toLowerCase());
    if (laneIndex !== -1) {
        releaseLane(laneIndex);
    }
  }, [releaseLane, activeLaneConfig]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const startGame = () => {
    initAudio();

    if (!localVideoSrc) {
        alert("Please upload an MP4 video file first.");
        return;
    }
    if (!analyzedNotes) {
        alert("Please wait for audio analysis to complete.");
        return;
    }
    notesRef.current = JSON.parse(JSON.stringify(analyzedNotes));
    activeKeysRef.current = new Array(keyMode).fill(false); // Reset active keys size

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setHealth(100);
    setMissCount(0);
    setHitEffects([]);
    setIsAutoPlay(false);
    totalPauseDurationRef.current = 0;
    
    setStatus(GameStatus.PLAYING);
    startTimeRef.current = performance.now();
  };

  const quitGame = () => {
      setStatus(GameStatus.MENU);
      setHitEffects([]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-slate-100 select-none">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-auto bg-slate-950">
        {(status === GameStatus.PLAYING || status === GameStatus.PAUSED || status === GameStatus.OUTRO) ? (
            <video
                ref={videoRef}
                src={localVideoSrc}
                className="w-full h-full object-cover opacity-80"
                onEnded={triggerOutro}
            />
        ) : (
             // ANIME STYLE BACKGROUND (Same as before)
             <div className="w-full h-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black">
                <div className="absolute inset-[-50%] opacity-20 animate-[spin-slow_20s_linear_infinite] origin-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-cyan-400">
                        {[...Array(24)].map((_,i) => (
                            <path key={i} d={`M50 50 L${50 + 80*Math.cos(i*15 * Math.PI/180)} ${50 + 80*Math.sin(i*15 * Math.PI/180)} L${50 + 70*Math.cos((i*15+5) * Math.PI/180)} ${50 + 70*Math.sin((i*15+5) * Math.PI/180)} Z`} />
                        ))}
                    </svg>
                </div>
                <div className="absolute bottom-0 w-full h-2/3 bg-gradient-to-t from-fuchsia-900/40 to-transparent z-0 pointer-events-none"></div>
                <div className="absolute -bottom-[50%] -left-[50%] -right-[50%] h-full opacity-30 pointer-events-none"
                     style={{
                         backgroundImage: 'linear-gradient(transparent 95%, #06b6d4 95%), linear-gradient(90deg, transparent 95%, #06b6d4 95%)',
                         backgroundSize: '60px 60px',
                         transform: 'perspective(500px) rotateX(60deg)',
                         animation: 'grid-scroll 1s linear infinite'
                     }}
                ></div>
                {particles.map((p) => (
                    <div 
                        key={p.id}
                        className="absolute bottom-0 bg-white rounded-full shadow-[0_0_10px_white]"
                        style={{
                            left: p.left,
                            width: p.size,
                            height: p.size,
                            animation: `float-up ${p.duration} ease-in infinite`,
                            animationDelay: p.delay
                        }}
                    ></div>
                ))}
                {/* Instruments SVGs (Preserved from previous request) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Guitar */}
                    <svg className="absolute top-[15%] left-[10%] w-64 h-64 text-cyan-500/10 animate-[float-up_20s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9.06 11.9 8.07-6.7c.88-.73.81-1.92-.1-2.67a1.98 1.98 0 0 0-2.68.1l-8.06 6.7a1.98 1.98 0 0 0-.1 2.68c.88.73 2.07.8 2.87.16" />
                        <path d="M12.97 4.14 7.6 10.6a5.77 5.77 0 0 0-.32 7.7 5.76 5.76 0 0 0 7.7.32l5.37-6.46" />
                        <path d="M7 21c-2.21 0-4-1.79-4-4" />
                    </svg>
                    {/* Bass Guitar */}
                    <svg className="absolute top-[60%] left-[15%] w-72 h-72 text-indigo-500/10 animate-[float-up_24s_ease-in-out_infinite_2s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21c-2.21 0-4-1.79-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12c0 2.21-1.79 4-4 4z" />
                        <line x1="11" y1="3" x2="11" y2="21" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                        <line x1="9" y1="12" x2="13" y2="12" />
                    </svg>
                    {/* Speaker */}
                    <svg className="absolute bottom-[20%] right-[5%] w-56 h-56 text-fuchsia-500/10 animate-[float-up_25s_ease-in-out_infinite_reverse]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="16" height="20" x="4" y="2" rx="2" />
                        <circle cx="12" cy="14" r="4" />
                        <line x1="12" x2="12.01" y1="6" y2="6" />
                    </svg>
                    {/* Microphone */}
                    <svg className="absolute top-[40%] right-[20%] w-40 h-40 text-yellow-500/10 animate-[float-up_18s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                        <line x1="8" x2="16" y1="22" y2="22" />
                    </svg>
                    {/* Drum */}
                    <svg className="absolute bottom-[10%] left-[25%] w-60 h-60 text-white/10 animate-[float-up_22s_ease-in-out_infinite_1s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 13.4v7.9" />
                        <path d="M17 13.4v7.9" />
                        <path d="M2 9c0 1.1 4.5 2 10 2s10-.9 10-2" />
                        <path d="M2 9v8c0 1.1 4.5 2 10 2s10-.9 10-2V9" />
                        <ellipse cx="4" cy="4" rx="3" ry="1" />
                        <line x1="4" y1="4" x2="6" y2="13" />
                        <ellipse cx="20" cy="5" rx="3" ry="1" />
                        <line x1="20" y1="5" x2="18" y2="13" />
                    </svg>
                    {/* Turntable */}
                    <svg className="absolute bottom-[40%] right-[30%] w-52 h-52 text-cyan-600/10 animate-[float-up_30s_ease-in-out_infinite_4s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                         <rect x="2" y="2" width="20" height="20" rx="2" />
                         <circle cx="12" cy="12" r="8" />
                         <circle cx="12" cy="12" r="2" />
                         <path d="M20 4 L16 8" />
                    </svg>
                    {/* Piano */}
                    <svg className="absolute top-[5%] right-[5%] w-64 h-32 text-fuchsia-300/10 animate-[float-up_12s_ease-in-out_infinite_3s]" viewBox="0 0 24 12" fill="none" stroke="currentColor" strokeWidth="0.5">
                        <rect x="0" y="0" width="24" height="12" />
                        <line x1="4" y1="0" x2="4" y2="12" />
                        <line x1="8" y1="0" x2="8" y2="12" />
                        <line x1="12" y1="0" x2="12" y2="12" />
                        <line x1="16" y1="0" x2="16" y2="12" />
                        <line x1="20" y1="0" x2="20" y2="12" />
                    </svg>
                    {/* Note */}
                    <svg className="absolute top-[20%] left-[40%] w-32 h-32 text-cyan-300/10 animate-[float-up_15s_ease-in-out_infinite_3s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                    </svg>
                     {/* Headphones */}
                    <svg className="absolute bottom-[30%] left-[5%] w-40 h-40 text-fuchsia-300/10 animate-[float-up_28s_ease-in-out_infinite_5s]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 14v3c0 .6.4 1 1 1h2a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" />
                        <path d="M18 13h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" />
                        <path d="M21 14v-3a9 9 0 0 0-9-9 9 9 0 0 0-9 9v3" />
                    </svg>
                </div>
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none"></div>
            </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-slate-950/40 to-transparent pointer-events-none"></div>
      </div>

      <div className="scanlines z-10 pointer-events-none"></div>

      {/* OUTRO SEQUENCE OVERLAY */}
      {status === GameStatus.OUTRO && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black animate-fade-in duration-1000">
              <div className="flex flex-col items-center animate-bounce-short">
                  <h1 className="text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500 filter drop-shadow-[0_0_50px_rgba(6,182,212,0.8)]">
                      DJ<span className="text-cyan-400">BIG</span>
                  </h1>
                  <div className="text-2xl font-mono text-cyan-200 tracking-[1em] mt-4 animate-pulse">
                      SESSION COMPLETE
                  </div>
              </div>
          </div>
      )}

      {/* MAIN MENU */}
      {status === GameStatus.MENU && (
        <div className="relative z-30 h-full flex flex-col items-center justify-center animate-fade-in px-4 overflow-y-auto">
          <h1 className="text-6xl md:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 tracking-tighter filter drop-shadow-[0_0_25px_rgba(6,182,212,0.6)] mb-6 text-center transform hover:scale-105 transition-transform duration-500">
            DJ<span className="text-cyan-400">BIG</span>
          </h1>
          
          <div className="w-full max-w-xl space-y-6 p-8 bg-black/80 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl relative">
            
            {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center rounded-xl">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-cyan-400 font-mono animate-pulse">ANALYZING AUDIO SPECTRUM...</div>
                </div>
            )}

            {/* Upload Section */}
            <div className="animate-fade-in space-y-3">
                <label className="text-sm font-bold tracking-widest text-cyan-400 block">SELECT MUSIC TRACK</label>
                <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-slate-700 border-dashed rounded cursor-pointer hover:bg-slate-800 hover:border-cyan-500 transition-all bg-slate-900/50 group">
                    <div className="flex flex-col items-center justify-center">
                        <p className="text-sm text-slate-400 font-mono group-hover:text-cyan-300 transition-colors">
                            {localFileName ? localFileName : "CLICK TO SELECT MP4 / MP3 FILE"}
                        </p>
                    </div>
                    <input type="file" accept="video/*,audio/*" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>

            {/* KEY MODE SELECTOR */}
            <div>
                <label className="text-xs font-bold tracking-widest text-cyan-400 mb-2 block">KEY CONFIGURATION</label>
                <div className="flex space-x-2">
                    {[4, 5, 7].map((k) => (
                        <button
                            key={k}
                            onClick={() => setKeyMode(k as 4|5|7)}
                            className={`flex-1 py-2 font-display font-bold border rounded transition-all ${
                                keyMode === k
                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]' 
                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {k} KEYS
                        </button>
                    ))}
                </div>
            </div>

            {/* LEVEL SELECTOR 1-10 */}
            <div>
                <label className="text-xs font-bold tracking-widest text-cyan-400 mb-2 block flex justify-between">
                    <span>LEVEL SELECTION</span>
                    <span className="text-white">{level}</span>
                </label>
                <div className="grid grid-cols-10 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => (
                        <button
                            key={l}
                            onClick={() => setLevel(l)}
                            className={`aspect-square font-display font-bold text-sm flex items-center justify-center border transition-all rounded ${
                                level === l
                                ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-110 z-10' 
                                : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Speed */}
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-xs font-bold tracking-widest text-cyan-400">SCROLL SPEED</label>
                    <span className="text-xs font-mono text-white">{speedMod.toFixed(1)}x</span>
                </div>
                <input 
                    type="range" 
                    min="1.0" 
                    max="5.0" 
                    step="0.1"
                    value={speedMod}
                    onChange={(e) => setSpeedMod(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
            </div>
            
            <button 
                onClick={startGame}
                disabled={isAnalyzing || !analyzedNotes}
                className={`w-full py-4 bg-gradient-to-r from-cyan-700 to-blue-700 text-white font-display font-bold text-2xl tracking-widest uppercase transition-all transform shadow-[0_0_30px_rgba(6,182,212,0.4)]
                    ${(isAnalyzing || !analyzedNotes) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:from-cyan-600 hover:to-blue-600 hover:scale-[1.02]'}
                `}
            >
                {isAnalyzing ? 'ANALYZING...' : 'Game Start!!'}
            </button>
            <div className="text-[10px] text-slate-500 text-center font-mono">
                CONTROLS: F1/F2 (Speed) | F4 (Auto) | F9 (End) | ESC (Pause)
            </div>
          </div>
        </div>
      )}

      {/* GAMEPLAY UI */}
      {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
        <div className="relative z-20 w-full h-full flex">
            
            <div className="relative h-full w-full md:max-w-lg flex-shrink-0 border-r border-white/10 bg-black/70 backdrop-blur-sm shadow-[10px_0_50px_rgba(0,0,0,0.8)]">
                
                <ScoreBoard score={score} combo={combo} health={health} maxCombo={maxCombo} />

                <div 
                    ref={laneContainerRef}
                    className="absolute top-0 bottom-0 left-2 right-2 md:left-4 md:right-4 flex perspective-1000 outline-none"
                    onTouchStart={handleTouch}
                    onTouchMove={handleTouch}
                    onTouchEnd={handleTouch}
                    onTouchCancel={handleTouch}
                >
                    
                    {activeLaneConfig.map((lane, index) => (
                        <Lane 
                            key={index} 
                            config={lane} 
                            active={activeKeysRef.current[index]}
                            onTrigger={() => triggerLane(index)}
                            onRelease={() => releaseLane(index)}
                        />
                    ))}

                    {/* Hit Effects */}
                    {hitEffects.map(effect => {
                        const width = 100 / keyMode;
                        const left = effect.laneIndex * width;
                        return (
                            <HitEffect 
                                key={effect.id} 
                                x={`${left}%`} 
                                width={`${width}%`} 
                                rating={effect.rating} 
                            />
                        );
                    })}

                    <div className="absolute w-full h-3 bg-white/40 top-[90%] shadow-[0_0_20px_rgba(255,255,255,0.8)] z-10 mix-blend-overlay pointer-events-none"></div>
                    <div className="absolute w-full h-1 bg-cyan-400 top-[90%] z-10 pointer-events-none"></div>

                    {renderNotes.map((note) => {
                        // Pass current lane config to Note for styling
                        const config = activeLaneConfig[note.laneIndex];
                        if (!config) return null;
                        return (
                            <Note 
                                key={note.id} 
                                note={note} 
                                totalLanes={keyMode} 
                                color={config.color}
                            />
                        );
                    })}

                    <div className="absolute top-[40%] left-0 right-0 flex flex-col items-center pointer-events-none z-50">
                        {isAutoPlay && (
                             <div className="text-xl font-display font-bold text-fuchsia-500 animate-pulse mb-2 border border-fuchsia-500 px-2 bg-black/50">
                                AUTO PILOT
                             </div>
                        )}
                        {combo > 5 && (
                            <div className="text-8xl font-display font-black text-white/20 animate-pulse">
                                {combo}
                            </div>
                        )}
                        {feedback && (
                            <div key={feedback.id} className={`text-5xl font-black font-display ${feedback.color} animate-bounce-short drop-shadow-[0_0_10px_rgba(0,0,0,1)] stroke-black`}>
                                {feedback.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 hidden md:flex flex-col justify-end p-12">
                <div className="text-right pointer-events-none">
                    <h2 className="text-6xl font-display font-bold text-white/40 tracking-widest drop-shadow-md">NEON PROTOCOL</h2>
                    <div className="text-cyan-500/80 font-mono mt-2 bg-black/60 inline-block px-4 py-1 rounded backdrop-blur-md border border-cyan-500/30">
                        SYSTEM LINKED: {localFileName ? localFileName : 'LOCAL_FILE'} // MODE: {keyMode}K // LEVEL {level}
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {status === GameStatus.PAUSED && (
        <PauseMenu onResume={togglePause} onQuit={quitGame} />
      )}

      {status === GameStatus.FINISHED && (
        <EndScreen 
            score={score} 
            maxCombo={maxCombo} 
            missCount={missCount}
            fileName={localFileName}
            onRestart={() => setStatus(GameStatus.MENU)}
            onMenu={() => setStatus(GameStatus.MENU)}
        />
      )}
    </div>
  );
};

export default App;
