
import React from 'react';
import { Theme, ThemeId } from '../types';
import { GAME_THEMES } from '../constants';

interface ThemeSelectionMenuProps {
    unlockedThemes: Set<ThemeId>;
    currentTheme: ThemeId;
    onSelectTheme: (id: ThemeId) => void;
    onClose: () => void;
    onPlaySound: (type: 'hover' | 'select' | 'back' | 'scratch') => void;
    t: any;
    fontClass: string;
}

export const ThemeSelectionMenu: React.FC<ThemeSelectionMenuProps> = ({ 
    unlockedThemes, 
    currentTheme, 
    onSelectTheme, 
    onClose,
    onPlaySound,
    t,
    fontClass
}) => {

    const getThemeDescription = (id: ThemeId) => {
        switch(id) {
            case 'ignore': return t.DESC_IGNORE;
            case 'neon': return t.DESC_NEON;
            case 'titan': return t.DESC_TITAN;
            case 'queen': return t.DESC_QUEEN;
            default: return "";
        }
    };

    const getUnlockDescription = (desc: string) => {
        if (desc.includes('Default')) return t.UNLOCK_DEFAULT;
        return t.UNLOCK_CUSTOM;
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in p-8">
            <div className="w-full max-w-5xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className={`text-4xl font-bold text-white tracking-tighter ${fontClass}`}>
                            {t.THEME_TITLE}
                        </h2>
                        <p className={`text-slate-400 font-mono text-sm ${fontClass}`}>{t.THEME_SUB}</p>
                    </div>
                    <button 
                        onClick={() => { onPlaySound('select'); onClose(); }}
                        className={`px-6 py-2 border border-slate-600 hover:border-white text-slate-400 hover:text-white transition-colors rounded font-bold ${fontClass}`}
                    >
                        {t.CLOSE_SYSTEM}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2 custom-scrollbar">
                    {GAME_THEMES.map((theme) => {
                        const isUnlocked = unlockedThemes.has(theme.id);
                        const isSelected = currentTheme === theme.id;

                        return (
                            <button
                                key={theme.id}
                                disabled={!isUnlocked}
                                onClick={() => onSelectTheme(theme.id)}
                                className={`
                                    relative p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-start text-left group overflow-hidden
                                    ${isSelected 
                                        ? 'bg-cyan-900/30 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] scale-[1.02]' 
                                        : isUnlocked 
                                            ? 'bg-slate-900/50 border-slate-700 hover:border-slate-400 hover:bg-slate-800' 
                                            : 'bg-slate-950/80 border-slate-800 opacity-70 cursor-not-allowed'
                                    }
                                `}
                            >
                                {/* Background Effect */}
                                {isSelected && (
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <div className="text-6xl text-cyan-400">★</div>
                                    </div>
                                )}

                                <div className="flex justify-between w-full items-start mb-4">
                                    <div className="z-10">
                                        <h3 className={`text-xl font-bold font-display ${isSelected ? 'text-white' : isUnlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                                            {theme.name}
                                        </h3>
                                        <div className={`text-xs text-slate-500 mt-1 ${fontClass}`}>{getThemeDescription(theme.id)}</div>
                                    </div>
                                    
                                    {!isUnlocked && (
                                        <div className="text-2xl text-red-500 z-10">🔒</div>
                                    )}
                                    {isUnlocked && isSelected && (
                                        <div className={`text-xs bg-cyan-500 text-black font-bold px-2 py-1 rounded z-10 ${fontClass}`}>{t.EQUIPPED}</div>
                                    )}
                                </div>

                                {/* VISUAL PREVIEW AREA */}
                                <div className="w-full h-32 bg-black/60 rounded-lg mb-4 flex items-end justify-center relative overflow-hidden border border-white/5 shadow-inner group-hover:border-white/20 transition-colors">
                                    {/* Fake Lane Track */}
                                    <div className="absolute inset-y-0 w-16 bg-gradient-to-t from-cyan-500/10 to-transparent border-x border-white/5"></div>
                                    
                                    {/* Mock Note (Animated) */}
                                    <div className={`
                                        absolute top-4 w-12 h-10 flex items-center justify-center animate-bounce
                                        ${theme.noteShape === 'circle' ? 'rounded-full' : ''}
                                        ${theme.noteShape === 'arrow' ? 'clip-arrow h-12' : ''}
                                        ${theme.noteShape === 'diamond' ? 'rotate-45 scale-75 rounded-sm' : ''}
                                        ${theme.noteShape === 'hex' ? 'clip-hex h-12' : ''}
                                        ${theme.noteShape === 'rect' ? 'rounded-[2px]' : ''}
                                        ${theme.noteShape === 'square' ? '' : ''}
                                        ${isSelected ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : isUnlocked ? 'bg-slate-400' : 'bg-slate-800'}
                                    `}>
                                        {theme.noteShape === 'star' && <span className="text-2xl text-black">★</span>}
                                        {theme.noteShape === 'rect' && <div className="absolute inset-x-0 top-0 h-[40%] bg-white/40 w-full"></div>}
                                    </div>

                                    {/* Mock Receptor */}
                                    <div className={`
                                        mb-2 w-16 h-12 flex items-center justify-center
                                        ${theme.receptorStyle === 'ring' ? 'rounded-full border-4' : ''}
                                        ${theme.receptorStyle === 'box' ? 'border-4' : ''}
                                        ${theme.receptorStyle === 'bracket' ? 'border-x-4 border-b-4 rounded-b-lg' : ''}
                                        ${theme.receptorStyle === 'line' ? 'border-b-4 rounded-b' : ''}
                                        ${theme.receptorStyle === 'button' ? 'rounded border-x-2 border-t-2 border-b-4' : ''}
                                        ${isSelected ? 'border-cyan-400' : isUnlocked ? 'border-slate-500' : 'border-slate-800'}
                                    `}>
                                         <div className={`w-full h-full opacity-20 ${isSelected ? 'bg-cyan-400' : ''}`}></div>
                                    </div>
                                </div>

                                {!isUnlocked && (
                                    <div className="mt-auto w-full bg-red-900/20 border border-red-900/50 p-2 rounded flex items-center space-x-3">
                                        <div className="text-xl">🗝️</div>
                                        <div>
                                            <div className={`text-[10px] text-red-400 font-bold uppercase tracking-widest mb-0.5 ${fontClass}`}>{t.LOCKED}</div>
                                            <div className={`text-xs text-red-200 font-bold ${fontClass}`}>{getUnlockDescription(theme.unlockDescription)}</div>
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                
                {/* Stats Summary */}
                <div className="mt-6 border-t border-slate-800 pt-4 flex justify-between text-xs font-mono text-slate-500">
                    <div>{t.THEMES_UNLOCKED}: {unlockedThemes.size} / {GAME_THEMES.length}</div>
                    <div className={fontClass}>{t.KEEP_PLAYING}</div>
                </div>
            </div>
            
            {/* CSS helper for preview shapes */}
            <style dangerouslySetInnerHTML={{__html: `
                .clip-arrow { clip-path: polygon(0% 0%, 100% 0%, 50% 100%); }
                .clip-hex { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
            `}} />
        </div>
    );
};
