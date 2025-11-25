
import React, { useState, useEffect } from 'react';
import { KeyMapping, LaneConfig, AudioSettings, LayoutSettings } from '../types';
import { LANE_CONFIGS_4, LANE_CONFIGS_5, LANE_CONFIGS_7 } from '../constants';

interface KeyConfigMenuProps {
    currentKeyMode: 4 | 5 | 7;
    mappings: KeyMapping;
    audioSettings: AudioSettings;
    onAudioSettingsChange: (settings: AudioSettings) => void;
    layoutSettings: LayoutSettings;
    onLayoutSettingsChange: (settings: LayoutSettings) => void;
    onSave: (newMappings: KeyMapping) => void;
    onClose: () => void;
}

export const KeyConfigMenu: React.FC<KeyConfigMenuProps> = ({ 
    currentKeyMode, 
    mappings, 
    audioSettings,
    onAudioSettingsChange,
    layoutSettings,
    onLayoutSettingsChange,
    onSave, 
    onClose 
}) => {
    const [localMappings, setLocalMappings] = useState<KeyMapping>(JSON.parse(JSON.stringify(mappings)));
    const [activeMode, setActiveMode] = useState<4 | 5 | 7>(currentKeyMode);
    const [bindingIndex, setBindingIndex] = useState<number | null>(null);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    useEffect(() => {
        // Check initial state
        setIsFullscreen(!!document.fullscreenElement);

        // Listen for native changes (e.g. Esc key)
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    // Get base config for display purposes (colors, labels)
    const getBaseConfig = (mode: number) => {
        if (mode === 4) return LANE_CONFIGS_4;
        if (mode === 5) return LANE_CONFIGS_5;
        return LANE_CONFIGS_7;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (bindingIndex !== null) {
            e.preventDefault();
            e.stopPropagation();

            const newKey = e.key.toLowerCase();
            
            // Check for duplicates in current mode
            const currentKeys = localMappings[activeMode];
            if (currentKeys.includes(newKey) && currentKeys[bindingIndex] !== newKey) {
                // Optional: Could show error or swap
            }

            const newKeys = [...currentKeys];
            newKeys[bindingIndex] = newKey === ' ' ? ' ' : newKey;

            setLocalMappings(prev => ({
                ...prev,
                [activeMode]: newKeys
            }));

            setBindingIndex(null);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [bindingIndex, activeMode, localMappings]);

    const handleSave = () => {
        onSave(localMappings);
        onClose();
    };

    const resetToDefault = () => {
         setLocalMappings({
            4: ['d', 'f', 'j', 'k'],
            5: ['d', 'f', ' ', 'j', 'k'],
            7: ['s', 'd', 'f', ' ', 'j', 'k', 'l']
         });
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error enabling full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleVolumeChange = (type: 'master' | 'sfx', value: number) => {
        onAudioSettingsChange({
            ...audioSettings,
            [type === 'master' ? 'masterVolume' : 'sfxVolume']: value
        });
    };

    const handlePositionChange = (pos: 'left' | 'center' | 'right') => {
        onLayoutSettingsChange({
            ...layoutSettings,
            lanePosition: pos
        });
    };

    const activeConfig = getBaseConfig(activeMode);
    const currentBoundKeys = localMappings[activeMode];

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto py-10">
            <div className="w-full max-w-3xl bg-slate-900 border border-cyan-500/50 p-8 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.2)] flex flex-col items-center">
                <h2 className="text-3xl font-display font-bold text-white tracking-wider mb-6">SYSTEM SETTINGS</h2>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* DISPLAY SETTINGS */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full flex flex-col space-y-6">
                         <h3 className="text-cyan-400 font-bold tracking-widest text-sm border-b border-slate-700 pb-2">DISPLAY</h3>
                         
                         {/* Fullscreen Toggle */}
                         <div className="flex justify-between items-center">
                            <div>
                                <div className="text-slate-200 font-mono font-bold">FULL SCREEN</div>
                                <div className="text-xs text-slate-500">Maximize game window</div>
                            </div>
                            <button
                                onClick={toggleFullScreen}
                                className={`w-16 h-8 rounded-full transition-all relative border ${isFullscreen ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-900 border-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${isFullscreen ? 'right-1' : 'left-1'}`}></div>
                            </button>
                         </div>

                         {/* Lane Position Controls */}
                         <div>
                            <div className="text-slate-200 font-mono font-bold mb-2">LANE POSITION</div>
                            <div className="flex rounded border border-slate-600 overflow-hidden">
                                {(['left', 'center', 'right'] as const).map((pos) => (
                                    <button
                                        key={pos}
                                        onClick={() => handlePositionChange(pos)}
                                        className={`flex-1 py-2 text-xs font-bold uppercase transition-colors ${
                                            layoutSettings.lanePosition === pos
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>

                    {/* AUDIO SETTINGS */}
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 h-full">
                         <h3 className="text-cyan-400 font-bold tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">AUDIO</h3>
                         <div className="space-y-4">
                             <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-200 font-mono text-sm">MASTER VOLUME</span>
                                    <span className="text-cyan-400 font-mono text-xs">{Math.round(audioSettings.masterVolume * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={audioSettings.masterVolume}
                                    onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                             </div>
                             <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-200 font-mono text-sm">SFX VOLUME</span>
                                    <span className="text-cyan-400 font-mono text-xs">{Math.round(audioSettings.sfxVolume * 100)}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="1" step="0.05" 
                                    value={audioSettings.sfxVolume}
                                    onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                />
                             </div>
                         </div>
                    </div>
                </div>

                {/* KEY CONFIG SECTION */}
                <div className="w-full">
                    <h3 className="text-cyan-400 font-bold tracking-widest text-sm mb-4 border-b border-slate-700 pb-2 w-full">CONTROLS</h3>
                    
                    {/* Mode Select Tabs */}
                    <div className="flex space-x-4 mb-6 justify-center">
                        {[4, 5, 7].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => { setActiveMode(mode as 4|5|7); setBindingIndex(null); }}
                                className={`px-6 py-2 rounded font-bold font-display transition-all ${
                                    activeMode === mode 
                                    ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                                    : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {mode} KEYS
                            </button>
                        ))}
                    </div>

                    {/* Visualizer for Keys */}
                    <div className="flex justify-center items-end space-x-2 mb-8 h-32 w-full">
                        {activeConfig.map((lane, idx) => {
                            const isBinding = bindingIndex === idx;
                            const keyLabel = currentBoundKeys[idx] === ' ' ? 'SPACE' : currentBoundKeys[idx].toUpperCase();
                            
                            return (
                                <div 
                                    key={idx}
                                    onClick={() => setBindingIndex(idx)}
                                    className={`
                                        relative h-full flex-1 max-w-[80px] rounded-t border-t border-x border-white/20 cursor-pointer transition-all group
                                        flex flex-col justify-end items-center pb-4
                                        ${isBinding ? 'bg-cyan-500/20 border-cyan-400 animate-pulse' : 'bg-slate-800/50 hover:bg-slate-700'}
                                    `}
                                >
                                    <div className={`absolute top-0 w-full h-2 bg-${lane.color.base}-500/50`}></div>
                                    <div className="text-[10px] text-slate-500 mb-2 font-mono">TRK{idx + 1}</div>
                                    <div className={`
                                        w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded border-2 font-bold text-lg
                                        ${isBinding ? 'bg-cyan-500 text-white border-white' : `bg-slate-900 text-white ${lane.color.border}`}
                                    `}>
                                        {isBinding ? '?' : keyLabel}
                                    </div>
                                    {isBinding && (
                                        <div className="absolute -bottom-8 text-cyan-400 text-xs font-bold whitespace-nowrap animate-bounce">PRESS KEY</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex space-x-4 w-full mt-4">
                    <button 
                        onClick={resetToDefault}
                        className="flex-1 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded font-bold tracking-widest transition-colors"
                    >
                        RESET DEFAULTS
                    </button>
                    <button 
                        onClick={handleSave}
                        className="flex-[2] py-3 bg-cyan-700 hover:bg-cyan-600 text-white rounded font-bold tracking-widest transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    >
                        SAVE & CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};
