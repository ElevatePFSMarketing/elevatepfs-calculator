
import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1500 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        let startTime: number | null = null;
        let rafId: number;
        
        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            // Ease-out function
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            const current = Math.floor(easedProgress * (end - start) + start);
            setDisplayValue(current);

            if (progress < 1) {
                rafId = requestAnimationFrame(animation);
            } else {
                 setDisplayValue(end);
            }
        };

        rafId = requestAnimationFrame(animation);
        
        return () => cancelAnimationFrame(rafId);
    }, [value, duration]);
    
    return <span>{formatCurrency(displayValue)}</span>;
};

export default AnimatedNumber;
