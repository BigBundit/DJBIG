
import React from 'react';
import { LaneConfig } from '../types';

interface LaneProps {
    config: LaneConfig;
    active: boolean;
    onTrigger: () => void;
    onRelease: () => void;
}

export const Lane: React.FC<LaneProps> = ({ config, active, onTrigger, onRelease }) => {
    // Use colors from config object
    const hitGradient = `from-${config.color.base}-500/60`;
    const keyColorClass = `${config.color.border} ${config.color.text}`;

    const bgGradient = active 
        ? `bg-gradient-to-t ${hitGradient} to-transparent`
        : 'bg-transparent';
        
    const hitFlash = active ? 'scale-95 brightness-125 bg-opacity-100' : 'scale-100 bg-opacity-60';

    return (
        <div 
            className={`relative flex-1 h-full border-r border-white/10 last:border-r-0 transition-colors duration-50 ${bgGradient} touch-none select-none`}
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
            
            {/* Key Indicator at Bottom */}
            <div className={`absolute bottom-2 left-1 right-1 h-12 border-b-4 ${keyColorClass} rounded-b flex items-end justify-center pb-1 transition-all duration-50 ${hitFlash} bg-slate-900 pointer-events-none`}>
                <span className="font-mono text-lg font-bold text-white drop-shadow-md">
                    {config.label}
                </span>
            </div>

            {/* Hit Beam */}
            {active && (
                <div className={`absolute bottom-14 left-0 right-0 top-0 bg-gradient-to-t ${hitGradient} to-transparent opacity-30 pointer-events-none`}></div>
            )}
        </div>
    );
};
