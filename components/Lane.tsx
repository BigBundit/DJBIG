
import React from 'react';
import { LaneConfig, Theme } from '../types';

interface LaneProps {
    config: LaneConfig;
    active: boolean;
    onTrigger: () => void;
    onRelease: () => void;
    theme: Theme;
    isOverdrive?: boolean;
}

export const Lane: React.FC<LaneProps> = ({ config, active, onTrigger, onRelease, theme, isOverdrive }) => {
    // Use colors from config object
    const hitGradient = `from-${config.color.base}-500/60`;
    
    // Background Gradient for lane
    const bgGradient = active 
        ? `bg-gradient-to-t ${hitGradient} to-transparent`
        : 'bg-transparent';
        
    // Render Receptor based on Theme
    const renderReceptor = () => {
        if (theme.id === 'ignore') {
            // "IGNORE PROTOCOL" - PHYSICAL BUTTON STYLE
            // Added z-30 to ensure it sits above the bottom fade gradient
            const buttonBase = `absolute bottom-2 left-1 right-1 h-20 transition-all duration-75 rounded-lg flex items-center justify-center border-b-4 shadow-lg z-30`;
            
            let appearanceClasses = '';
            
            if (isOverdrive) {
                 // Rainbow Mode for Overdrive
                 appearanceClasses = `
                    animate-rainbow 
                    border-white/20
                    ${active ? 'translate-y-1 brightness-150' : 'opacity-90'}
                 `;
            } else {
                 // Normal Mode
                 appearanceClasses = `
                    bg-gradient-to-b from-slate-600 to-slate-900
                    ${active ? `border-${config.color.base}-400 translate-y-1 shadow-inner bg-opacity-100` : 'border-slate-500 bg-opacity-80 border-black/30'}
                 `;
            }

            return (
                <div className={`${buttonBase} ${appearanceClasses}`}>
                    {!isOverdrive && <div className={`w-full h-full absolute inset-0 rounded-lg opacity-30 ${active ? `bg-${config.color.base}-500` : ''}`}></div>}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-lg"></div>
                </div>
            );
        } else if (theme.id === 'titan') {
            // "TITAN CONSTRUCT" - INDUSTRIAL BRACKET STYLE
            const borderColor = isOverdrive ? 'border-white animate-rainbow' : (active ? `border-${config.color.base}-500` : 'border-slate-600');
            const glowColor = isOverdrive ? 'bg-white animate-rainbow shadow-[0_0_15px_white]' : (active ? `bg-${config.color.base}-500 shadow-[0_0_15px_currentColor]` : 'bg-slate-800');
            
            return (
                <div className={`absolute bottom-4 left-1 right-1 h-16 flex items-end justify-center transition-all duration-75 z-30 ${active ? 'scale-95' : ''}`}>
                    {/* Left Bracket */}
                    <div className={`absolute left-0 bottom-0 h-full w-2 border-l-4 border-b-4 border-t-2 ${borderColor} rounded-bl`}></div>
                    
                    {/* Right Bracket */}
                    <div className={`absolute right-0 bottom-0 h-full w-2 border-r-4 border-b-4 border-t-2 ${borderColor} rounded-br`}></div>
                    
                    {/* Center Glow */}
                    <div className={`absolute bottom-1 left-2 right-2 h-2 ${glowColor}`}></div>
                </div>
            );
        } else if (theme.id === 'queen') {
             // "QUEEN PROTOCOL" - GLOWING KEYBOARD KEY STYLE
             // Override pink with rainbow if overdrive
             const bgClass = isOverdrive ? 'animate-rainbow border-white' : (active ? 'border-pink-400 bg-pink-600' : 'border-pink-900 bg-slate-900');
             const shadowClass = isOverdrive ? 'shadow-[0_0_30px_rgba(255,255,255,0.8)]' : (active ? 'shadow-[0_0_30px_rgba(236,72,153,1)]' : 'shadow-[0_0_15px_rgba(236,72,153,0.3)]');

            return (
                <div className={`absolute bottom-3 left-1 right-1 h-16 flex items-end justify-center transition-all duration-75 z-30`}>
                    <div className={`
                        relative w-full rounded-md border-b-4 transition-all duration-75 flex items-center justify-center overflow-hidden
                        ${active ? 'h-14 translate-y-1' : 'h-14'}
                        ${bgClass} ${shadowClass}
                    `}>
                        {/* Keycap Surface Texture */}
                        {!isOverdrive && <div className={`absolute inset-0 bg-gradient-to-b ${active ? 'from-pink-400 to-pink-600' : 'from-slate-800 to-slate-900'}`}></div>}
                        
                        {/* Inner Backlight */}
                        <div className={`
                            absolute inset-2 rounded blur-sm transition-opacity duration-75
                            ${active || isOverdrive ? 'bg-white opacity-40' : 'bg-pink-500 opacity-10'}
                        `}></div>

                        {/* Top Highlight */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-white/5 rounded-t-md"></div>
                    </div>
                    {/* Underglow Reflection */}
                    {(active || isOverdrive) && <div className={`absolute -bottom-2 w-full h-2 blur-md opacity-50 ${isOverdrive ? 'bg-white animate-pulse' : 'bg-pink-500'}`}></div>}
                </div>
            );
        } else {
            // "NEON CORE" - CLASSIC LINE/GLOW STYLE
            const lineClass = isOverdrive ? 'animate-rainbow shadow-[0_0_20px_white]' : (active ? `bg-${config.color.base}-400 shadow-[0_0_20px_rgba(255,255,255,0.8)]` : `bg-slate-600/50 border-x border-${config.color.base}-500/30`);

            return (
                <div className={`absolute bottom-0 left-0 w-full h-full flex flex-col justify-end pointer-events-none z-30`}>
                    {/* The Hit Line */}
                    <div className={`
                        w-full h-2 transition-all duration-75
                        ${lineClass}
                    `}></div>
                </div>
            );
        }
    };

    return (
        <div 
            className={`relative flex-1 h-full border-r border-white/5 last:border-r-0 transition-colors duration-50 ${bgGradient} touch-none select-none`}
            onPointerDown={(e) => {
                e.preventDefault();
                onTrigger();
            }}
            onPointerUp={(e) => {
                e.preventDefault();
                onRelease();
            }}
            onPointerLeave={(e) => {
                e.preventDefault();
                onRelease();
            }}
        >
            {/* Lane Track BG */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
            
            {/* Theme Specific Receptor */}
            {renderReceptor()}

            {/* Hit Beam */}
            {active && (
                <div className={`absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t ${hitGradient} to-transparent opacity-40 pointer-events-none z-10`}></div>
            )}
        </div>
    );
};
