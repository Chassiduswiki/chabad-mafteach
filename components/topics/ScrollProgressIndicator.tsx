'use client';

import { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

interface ScrollProgressIndicatorProps {
    color?: string;
    height?: number;
}

export function ScrollProgressIndicator({ 
    color = 'var(--primary)', 
    height = 3 
}: ScrollProgressIndicatorProps) {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = scrollYProgress.on('change', (latest) => {
            // Only show after scrolling past hero (about 10% of page)
            setIsVisible(latest > 0.05 && latest < 0.98);
        });
        return () => unsubscribe();
    }, [scrollYProgress]);

    return (
        <motion.div
            className="fixed top-16 left-0 right-0 z-50 origin-left"
            style={{
                scaleX,
                height,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.3s ease'
            }}
        />
    );
}
