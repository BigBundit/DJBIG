
import React, { useEffect, useState, useMemo } from 'react';
import { ScoreRating } from '../types';

interface HitEffectProps {
    x: string;
    width: string;
    rating: ScoreRating;
}

export const HitEffect: React.FC<HitEffectProps> = ({ x, width, rating }) => {
    const [visible, setVisible] = useState(true);

    // Pre-calculate spark trajectories
    const sparks = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => {
            const angle = (Math.random() * 360) * (Math.PI / 180);
            const dist = 60 + Math.random() * 80; // Distance of spark fly
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            const size = 2 + Math.random() * 3;
            const delay = Math.random() * 0.1;
            return { id: i, tx, ty, size, delay };
        });
    }, []);

    useEffect(() => {
        // Slightly longer lifetime for the sparks to finish
        const timer = setTimeout(() => setVisible(false), 400);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    let fireColors = '';
    let sparkColor = '';
    
    // Using gradients that simulate hot plasma/fire
    if (rating === ScoreRating.PERFECT) {
        // Blue/White Plasma Fire
        fireColors = 'from-white via-cyan-300 to-blue-600';
        sparkColor = 'bg-cyan-200';
    } else if (rating === ScoreRating.GOOD) {
        // Green/White Chemical Fire
        fireColors = 'from-white via-green-300 to-emerald-600';
        sparkColor = 'bg-green-200';
    } else {
        // Traditional Orange/Red Fire
        fireColors = 'from-white via-yellow-300 to-red-600';
        sparkColor = 'bg-yellow-200';
    }

    return (
        <div 
            className="absolute bottom-[8%] z-50 pointer-events-none flex justify-center items-center"
            style={{ left: x, width: width, height: '10%' }}
        >
            {/* 1. SHOCKWAVE RING - Expands fast */}
            <div className={`
                absolute w-full pt-[100%] rounded-full 
                border-white
                opacity-0
                animate-[explosion-ring_0.4s_ease-out_forwards]
            `}></div>

            {/* 2. MAIN FIREBALL CORE - Intense Gradient */}
            <div className={`
                absolute w-[120%] pt-[120%] rounded-full 
                bg-[radial-gradient(circle,_var(--tw-gradient-stops))] ${fireColors}
                opacity-0 blur-[2px] mix-blend-screen
                animate-[explosion-core_0.35s_ease-out_forwards]
            `}></div>

            {/* 3. CENTER WHITE HOT FLASH */}
            <div className={`
                absolute w-[60%] pt-[60%] rounded-full 
                bg-white box-shadow-[0_0_20px_white]
                opacity-0 mix-blend-screen
                animate-[flash_0.2s_ease-out_forwards]
            `}></div>
            
            {/* 4. SPARKS / DEBRIS FLYING OUT */}
            {sparks.map((s) => (
                <div 
                    key={s.id}
                    className={`absolute rounded-full ${sparkColor} shadow-[0_0_5px_white] animate-[spark-fly_0.35s_ease-out_forwards]`}
                    style={{
                        width: `${s.size}px`,
                        height: `${s.size}px`,
                        '--tx': `${s.tx}px`,
                        '--ty': `${s.ty}px`,
                        animationDelay: `${s.delay}s`
                    } as React.CSSProperties}
                ></div>
            ))}
        </div>
    );
};
