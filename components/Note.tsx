
import React from 'react';
import { Note as NoteType, LaneColor, Theme, GameModifiers } from '../types';

interface NoteProps {
    note: NoteType;
    totalLanes: number;
    color: LaneColor;
    theme: Theme;
    isOverdrive?: boolean;
    modifiers?: GameModifiers;
}

export const Note: React.FC<NoteProps> = ({ note, totalLanes, color, theme, isOverdrive, modifiers }) => {
    const widthPerc = 100 / totalLanes;
    const leftPos = `${note.laneIndex * widthPerc}%`;
    const showHighlight = theme.noteShape === 'rect' || theme.noteShape === 'square';
    
    // VISUAL PROPERTIES
    let opacity = 1;

    // --- MODIFIER LOGIC (VISUALS) ---
    if (modifiers) {
        if (modifiers.hidden) {
            if (note.y > 50) opacity = 0;
            else opacity = Math.max(0, 1 - ((note.y - 40) / 10)); 
        } else if (modifiers.sudden) {
            const threshold = 25;
            if (note.y < threshold) opacity = 0;
            else opacity = Math.min(1, (note.y - threshold) / 10);
        }
    }

    // BASE STYLE (The Head)
    let containerStyle: React.CSSProperties = {
        left: leftPos, 
        top: `${note.y}%`, 
        width: `${widthPerc}%`,
        height: '3%', 
        transform: 'translateZ(0)', 
        willChange: 'top, opacity',
        opacity: opacity,
        position: 'absolute',
        zIndex: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 2px'
    };

    const colorClass = isOverdrive ? 'bg-white shadow-[0_0_15px_white]' : `${color.bg} ${color.noteShadow}`;
    let shapeClass = '';
    let innerContent = null;

    // THEME SHAPE LOGIC
    switch (theme.noteShape) {
        case 'circle':
            shapeClass = `rounded-full ${colorClass}`;
            containerStyle.height = '4%';
            break;
        case 'diamond':
            shapeClass = `rotate-45 scale-75 ${colorClass} rounded-sm`;
            containerStyle.height = '4%';
            break;
        case 'arrow':
            shapeClass = isOverdrive ? 'bg-white' : `${color.bg}`;
            containerStyle.clipPath = 'polygon(0% 0%, 100% 0%, 50% 100%)';
            containerStyle.filter = isOverdrive ? 'drop-shadow(0 0 10px white)' : `drop-shadow(0 0 10px ${color.base})`;
            containerStyle.height = '4%';
            break;
        case 'hex':
            shapeClass = `${colorClass}`;
            containerStyle.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            containerStyle.height = '4.5%';
            break;
        case 'star':
            shapeClass = `flex items-center justify-center text-2xl ${isOverdrive ? 'text-white' : color.text} drop-shadow-md`;
            innerContent = '★';
            containerStyle.height = '4%';
            break;
        default: // rect
            shapeClass = `rounded-[2px] ${colorClass}`;
            break;
    }

    // --- HOLD NOTE RENDERING ---
    if (note.isHold) {
        const holdLength = (note as any).length || 0;
        
        const holdContainerStyle: React.CSSProperties = {
            left: leftPos,
            top: `${note.y - holdLength}%`,
            height: `${holdLength}%`,
            width: `${widthPerc}%`,
            position: 'absolute',
            zIndex: 15, // Below taps
            opacity: opacity,
            transform: 'translateZ(0)',
            willChange: 'top',
            padding: '0 2px', 
            display: 'flex',
            flexDirection: 'column'
        };
        
        const barColor = isOverdrive ? 'bg-slate-200' : `bg-${color.base}-600`;
        const borderColor = isOverdrive ? 'border-white' : `border-${color.base}-400`;
        
        return (
            <div style={holdContainerStyle} className="pointer-events-none">
                <div className={`w-full h-full ${barColor} border-x-2 ${borderColor} rounded-sm relative overflow-hidden flex flex-col shadow-md`}>
                    <div className={`w-full h-[4px] ${isOverdrive ? 'bg-white' : `bg-${color.base}-400`}`}></div>
                    <div className="flex-1 w-full relative">
                        {note.holding && (
                            <div className={`absolute inset-0 bg-white/40 ${isOverdrive ? '' : 'animate-pulse'}`}></div>
                        )}
                        <div className={`absolute left-1/2 top-0 bottom-0 w-[2px] ${isOverdrive ? 'bg-white/50' : `bg-${color.base}-400/50`} -translate-x-1/2`}></div>
                    </div>
                    <div className={`w-full h-[4px] ${isOverdrive ? 'bg-white' : `bg-${color.base}-400`}`}></div>
                </div>
                {note.holding && (
                    <div className={`absolute bottom-0 left-0 right-0 h-16 ${isOverdrive ? 'bg-white/40' : `bg-${color.base}-400/60`} blur-xl`}></div>
                )}
            </div>
        );
    }

    // RENDER TAP NOTE
    return (
        <div className="absolute z-20 px-[2px] flex justify-center items-center" style={containerStyle}>
            <div className={`w-full h-full relative transition-all ${shapeClass}`}>
                {showHighlight && <div className="absolute inset-x-0 top-0 h-[40%] bg-white/60 w-full"></div>}
                {innerContent}
            </div>
        </div>
    );
};
