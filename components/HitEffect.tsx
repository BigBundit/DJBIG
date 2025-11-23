
import React, { useEffect, useState } from 'react';
import { ScoreRating } from '../types';

interface HitEffectProps {
    x: string;
    width: string;
    rating: ScoreRating;
}

export const HitEffect: React.FC<HitEffectProps> = ({ x, width, rating }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Reduced lifetime for snappier explosion
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    let burstColor = '';
    
    if (rating === ScoreRating.PERFECT) {
        burstColor = 'from-cyan-200 to-cyan-500';
    } else if (rating === ScoreRating.GOOD) {
        burstColor = 'from-green-200 to-green-500';
    } else {
        burstColor = 'from-yellow-200 to-yellow-500';
    }

    return (
        <div 
            className="absolute bottom-[8%] z-50 pointer-events-none flex justify-center items-center"
            style={{ left: x, width: width, height: '10%' }}
        >
            {/* Main Explosion Ring */}
            <div className={`
                absolute w-full pt-[100%] rounded-full 
                bg-gradient-radial ${burstColor}
                opacity-0 scale-50
                animate-[explode_0.3s_ease-out_forwards]
            `}></div>

            {/* Core Flash */}
            <div className={`
                absolute w-[80%] pt-[80%] rounded-full 
                bg-white
                opacity-0 scale-0
                animate-[flash_0.2s_ease-out_forwards]
            `}></div>
            
            {/* Particle Debris (Simulated with simple box shadows) */}
             <div className="absolute w-2 h-2 bg-white rounded-full animate-[debris_0.3s_ease-out_forwards]" style={{transform: 'translate(-10px, -10px)'}}></div>
             <div className="absolute w-2 h-2 bg-white rounded-full animate-[debris_0.3s_ease-out_forwards] delay-75" style={{transform: 'translate(10px, -15px)'}}></div>
             <div className="absolute w-2 h-2 bg-white rounded-full animate-[debris_0.3s_ease-out_forwards]" style={{transform: 'translate(0px, -20px)'}}></div>
        </div>
    );
};
