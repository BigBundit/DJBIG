import React from 'react';

interface PauseMenuProps {
    onResume: () => void;
    onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ onResume, onQuit }) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="flex flex-col space-y-4 p-8 border border-cyan-500/50 bg-slate-900 rounded-lg text-center">
                <h2 className="text-3xl font-display text-white mb-4">PAUSED</h2>
                <button onClick={onResume} className="text-cyan-400 hover:text-cyan-200 text-xl font-mono font-bold uppercase tracking-wider">
                    Resume
                </button>
                <button onClick={onQuit} className="text-slate-400 hover:text-red-400 text-xl font-mono font-bold uppercase tracking-wider">
                    Abort
                </button>
            </div>
        </div>
    );
};