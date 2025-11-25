
import React from 'react';
import { LaneConfig, Theme } from '../types';

interface LaneProps {
    config: LaneConfig;
    active: boolean;
    onTrigger: () => void;
    onRelease: () => void;
    theme: Theme;
}

export const Lane: React.FC<LaneProps> = ({ config, active, onTrigger, onRelease, theme }) => {
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
            const buttonBase = `absolute bottom-2 left-1 right-1 h-20 transition-all duration-75 rounded-lg flex items-center justify-center border-b-4 border-black/30 shadow-lg`;
            const transform = active ? 'translate-y-1 shadow-inner bg-opacity-100' : 'bg-opacity-40';
            
            const styleClasses = `
                ${buttonBase} 
                ${transform}
                bg-gradient-to-b from-slate-700 to-slate-900
                ${active ? `border-${config.color.base}-400` : 'border-slate-600'}
            `;

            return (
                <div className={styleClasses}>
                    <div className={`w-full h-full absolute inset-0 rounded-lg opacity-30 ${active ? `bg-${config.color.base}-500` : ''}`}></div>
                    <span className={`relative z-10 font-bold font-mono text-2xl ${active ? 'text-white' : 'text-slate-500'}`}>
                        {config.label === 'SPC' ? '␣' : config.label}
                    </span>
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/5 rounded-t-lg"></div>
                </div>
            );
        } else {
            // "NEON CORE" - CLASSIC LINE/GLOW STYLE
            return (
                <div className={`absolute bottom-0 left-0 w-full h-full flex flex-col justify-end pointer-events-none`}>
                    {/* The Hit Line */}
                    <div className={`
                        w-full h-2 transition-all duration-75
                        ${active 
                            ? `bg-${config.color.base}-400 shadow-[0_0_20px_rgba(255,255,255,0.8)]` 
                            : `bg-slate-600/50 border-x border-${config.color.base}-500/30`
                        }
                    `}></div>
                    
                    {/* Key Label (Floating below line in classic mode) */}
                    <div className={`
                        w-full text-center mt-2 font-mono font-bold text-lg transition-colors
                        ${active ? `text-${config.color.base}-400` : 'text-slate-600'}
                    `}>
                        {config.label === 'SPC' ? 'SPACE' : config.label}
                    </div>
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
                <div className={`absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-t ${hitGradient} to-transparent opacity-40 pointer-events-none`}></div>
            )}
        </div>
    );
};
