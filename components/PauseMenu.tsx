
import React from 'react';

interface PauseMenuProps {
    onResume: () => void;
    onSettings: () => void;
    onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onSettings, onQuit }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-col space-y-4 p-8 border border-cyan-500/50 bg-slate-900 rounded-lg text-center min-w-[320px] shadow-[0_0_50px_rgba(6,182,212,0.2)]">
                <h2 className="text-4xl font-display font-black text-white mb-6 tracking-widest text-shadow-cyan italic">
                    SYSTEM PAUSED
                </h2>
                
                <button 
                    onClick={onResume} 
                    className="group relative py-3 px-6 bg-cyan-900/40 hover:bg-cyan-600 border border-cyan-500/50 hover:border-cyan-400 text-cyan-100 hover:text-white font-mono font-bold uppercase tracking-wider transition-all duration-200 rounded overflow-hidden"
                >
                    <span className="relative z-10">RESUME MISSION</span>
                    <div className="absolute inset-0 bg-cyan-400/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-300"></div>
                </button>
                
                <button 
                    onClick={onSettings} 
                    className="group py-3 px-6 bg-slate-800 hover:bg-yellow-600/50 border border-slate-600 hover:border-yellow-400 text-slate-300 hover:text-white font-mono font-bold uppercase tracking-wider transition-all duration-200 rounded"
                >
                    SYSTEM SETTINGS
                </button>

                <div className="h-px bg-slate-700 my-2"></div>

                <button 
                    onClick={onQuit} 
                    className="group py-3 px-6 bg-slate-800 hover:bg-red-900/50 border border-slate-600 hover:border-red-500 text-slate-400 hover:text-red-200 font-mono font-bold uppercase tracking-wider transition-all duration-200 rounded"
                >
                    ABORT MISSION
                </button>
            </div>
        </div>
    );
};
