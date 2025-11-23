
import React, { useEffect, useState } from 'react';
import { HighScore } from '../types';

interface EndScreenProps {
    score: number;
    maxCombo: number;
    missCount: number;
    fileName: string;
    onRestart: () => void;
    onMenu: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ score, maxCombo, missCount, fileName, onRestart, onMenu }) => {
    const [highScoreData, setHighScoreData] = useState<HighScore | null>(null);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [playerName, setPlayerName] = useState("");
    const [nameSaved, setNameSaved] = useState(false);

    useEffect(() => {
        const storageKey = `djbig_hs_${fileName.replace(/\s+/g, '_')}`;
        const stored = localStorage.getItem(storageKey);
        
        let existingRecord: HighScore | null = null;
        if (stored) {
            existingRecord = JSON.parse(stored);
        }

        if (!existingRecord || score > existingRecord.score) {
            setIsNewRecord(true);
        } else {
            setHighScoreData(existingRecord);
        }
    }, [score, fileName]);

    const handleSaveName = () => {
        if (!playerName.trim()) return;

        const newRecord: HighScore = {
            playerName: playerName.trim().toUpperCase(),
            score: score,
            maxCombo: maxCombo,
            missCount: missCount,
            timestamp: Date.now()
        };

        const storageKey = `djbig_hs_${fileName.replace(/\s+/g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify(newRecord));
        
        setHighScoreData(newRecord);
        setNameSaved(true);
        setIsNewRecord(false);
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <div className="max-w-3xl w-full bg-slate-900 border border-cyan-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col items-center space-y-6">
                
                <div className="text-center space-y-2">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white tracking-tighter">
                        MISSION COMPLETE
                    </h2>
                    <div className="h-1 w-32 bg-cyan-500 mx-auto"></div>
                </div>

                {/* CURRENT STATS */}
                <div className="grid grid-cols-3 gap-8 w-full">
                    <div className="text-center bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 tracking-widest mb-2 font-display">FINAL SCORE</div>
                        <div className="text-3xl md:text-5xl font-mono font-bold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                            {score.toLocaleString()}
                        </div>
                    </div>
                    <div className="text-center bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 tracking-widest mb-2 font-display">MAX CHAIN</div>
                        <div className="text-3xl md:text-5xl font-mono font-bold text-fuchsia-300">
                            {maxCombo}
                        </div>
                    </div>
                    <div className="text-center bg-slate-800/50 p-4 rounded border border-slate-700">
                        <div className="text-xs text-slate-400 tracking-widest mb-2 font-display">MISS</div>
                        <div className="text-3xl md:text-5xl font-mono font-bold text-red-400">
                            {missCount}
                        </div>
                    </div>
                </div>

                {/* NEW RECORD INPUT */}
                {isNewRecord && !nameSaved && (
                    <div className="w-full bg-cyan-900/30 border border-cyan-500 p-6 rounded-lg text-center animate-pulse-slow">
                        <h3 className="text-xl font-display font-bold text-yellow-400 mb-4 animate-bounce-short">
                            ★ NEW RECORD HOLDER ★
                        </h3>
                        <div className="flex flex-col items-center space-y-4">
                             <input 
                                type="text"
                                maxLength={10}
                                placeholder="ENTER PILOT NAME"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                className="bg-black/50 border-b-2 border-cyan-400 text-center text-2xl text-white font-mono p-2 focus:outline-none uppercase w-full max-w-xs"
                             />
                             <button 
                                onClick={handleSaveName}
                                className="px-6 py-2 bg-yellow-500 text-black font-bold font-display uppercase tracking-wider hover:bg-yellow-400 transition-colors"
                             >
                                CONFIRM ENTRY
                             </button>
                        </div>
                    </div>
                )}

                {/* LEADERBOARD DISPLAY */}
                {!isNewRecord && highScoreData && (
                    <div className="w-full bg-black/40 border border-white/10 p-4 rounded text-center">
                         <div className="text-xs font-bold text-yellow-500 tracking-[0.2em] mb-2 uppercase">
                            TRACK RECORD HOLDER: {fileName.substring(0, 20)}...
                        </div>
                        <div className="flex items-center justify-center space-x-4">
                             <span className="text-2xl font-display font-bold text-white">{highScoreData.playerName}</span>
                             <span className="text-slate-500">|</span>
                             <span className="text-xl font-mono text-cyan-400">{highScoreData.score.toLocaleString()} PTS</span>
                        </div>
                    </div>
                )}

                <div className="flex space-x-4 mt-8">
                    <button 
                        onClick={onRestart}
                        className="px-8 py-3 bg-cyan-700 hover:bg-cyan-600 text-white font-bold tracking-widest transition-colors clip-path-slant shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                        RETRY MISSION
                    </button>
                    <button 
                        onClick={onMenu}
                        className="px-8 py-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-bold tracking-widest transition-colors"
                    >
                        RETURN TO BASE
                    </button>
                </div>
            </div>
        </div>
    );
};
